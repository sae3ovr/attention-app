import type { Incident, CredibilityResult, CredibilityLevel } from '../types';

interface ReporterHistory {
  level: number;
  totalReports: number;
  totalConfirmations: number;
  verifiedIncidents: number;
  removedIncidents: number;
  accountAgeMs: number;
}

// ── Weights ────────────────────────────────────────────────────────────────

const W = {
  textQuality: 0.15,
  reporterHistory: 0.20,
  communityValidation: 0.25,
  geographicPlausibility: 0.10,
  crossReference: 0.15,
  photoEvidence: 0.05,
  timeRecency: 0.05,
  sourceAuthority: 0.05,
} as const;

// ── Helpers ────────────────────────────────────────────────────────────────

function clamp(v: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, v));
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\sàáâãéèêíóôõúçñ]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

function jaccardSimilarity(a: string[], b: string[]): number {
  const setA = new Set(a);
  const setB = new Set(b);
  let intersection = 0;
  for (const w of setA) if (setB.has(w)) intersection++;
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Factor Scorers ─────────────────────────────────────────────────────────

const VAGUE_WORDS = new Set([
  'algo', 'coisa', 'talvez', 'acho', 'parece', 'something', 'maybe', 'idk',
  'whatever', 'stuff', 'thing', 'dunno', 'like',
]);

const THREAT_KEYWORDS = new Set([
  'bomba', 'arma', 'terrorismo', 'explosão', 'refém', 'tiroteio',
  'bomb', 'weapon', 'terrorism', 'hostage', 'shooting', 'gun',
]);

function scoreTextQuality(text: string): { score: number; flags: string[] } {
  const flags: string[] = [];
  let score = 70;

  if (text.length < 20) { score -= 25; flags.push('text_too_short'); }
  if (text.length > 500) score += 5;

  const upperRatio = (text.replace(/[^A-Z]/g, '').length) / Math.max(text.length, 1);
  if (upperRatio > 0.4) { score -= 20; flags.push('excessive_caps'); }

  const exclamations = (text.match(/!/g) || []).length;
  if (exclamations > 3) { score -= 10; flags.push('excessive_punctuation'); }

  const tokens = tokenize(text);
  const vagueCount = tokens.filter((t) => VAGUE_WORDS.has(t)).length;
  if (vagueCount > 2) { score -= 15; flags.push('vague_language'); }

  const threatCount = tokens.filter((t) => THREAT_KEYWORDS.has(t)).length;
  if (threatCount > 0) flags.push('threat_keywords');

  const uniqueRatio = new Set(tokens).size / Math.max(tokens.length, 1);
  if (uniqueRatio < 0.3 && tokens.length > 5) { score -= 10; flags.push('repetitive_text'); }

  return { score: clamp(score), flags };
}

function scoreReporterHistory(history: ReporterHistory | null): number {
  if (!history) return 50;

  let score = 50;
  score += Math.min(history.level * 3, 20);

  if (history.totalReports > 0) {
    const verifyRatio = history.verifiedIncidents / history.totalReports;
    score += verifyRatio * 20;
  }

  if (history.totalReports > 0 && history.removedIncidents > 0) {
    const removeRatio = history.removedIncidents / history.totalReports;
    score -= removeRatio * 30;
  }

  const ageDays = history.accountAgeMs / 86400000;
  if (ageDays < 1) score -= 15;
  else if (ageDays < 7) score -= 5;
  else if (ageDays > 90) score += 5;

  return clamp(score);
}

function scoreCommunityValidation(confirms: number, denies: number): number {
  const total = confirms + denies;
  if (total === 0) return 50;
  return clamp((confirms / total) * 100);
}

function scoreGeographicPlausibility(lat: number, lng: number): number {
  // Basic land check: reject obvious ocean coordinates
  if (lat < -60 || lat > 85) return 20;
  if (Math.abs(lat) < 0.5 && Math.abs(lng) < 0.5) return 25; // Null island
  // Most coordinates on land get a neutral score
  return 70;
}

function scoreCrossReference(
  incident: Incident,
  allIncidents: Incident[],
  windowMs = 2 * 3600000,
  radiusKm = 0.5
): { score: number; flags: string[] } {
  const flags: string[] = [];
  let nearby = 0;
  let duplicateFromSameReporter = false;

  const candidates = allIncidents.length > 200
    ? allIncidents.filter((i) => Math.abs(i.createdAt - incident.createdAt) <= windowMs)
    : allIncidents;

  for (const other of candidates) {
    if (other.id === incident.id) continue;
    const timeDiff = Math.abs(incident.createdAt - other.createdAt);
    if (timeDiff > windowMs) continue;

    const dist = haversineKm(
      incident.location.latitude, incident.location.longitude,
      other.location.latitude, other.location.longitude
    );
    if (dist > radiusKm) continue;

    nearby++;

    if (other.reporterUid === incident.reporterUid) {
      const tokens1 = tokenize(incident.title + ' ' + incident.description);
      const tokens2 = tokenize(other.title + ' ' + other.description);
      if (jaccardSimilarity(tokens1, tokens2) > 0.6) {
        duplicateFromSameReporter = true;
        flags.push('duplicate_from_same_reporter');
      }
    }
  }

  if (duplicateFromSameReporter) return { score: 15, flags };

  if (nearby >= 3) return { score: 90, flags: ['corroborated_by_multiple'] };
  if (nearby >= 1) return { score: 70, flags: ['has_nearby_reports'] };
  return { score: 50, flags };
}

function scorePhotoEvidence(photoURLs: string[]): number {
  return photoURLs.length > 0 ? 80 : 50;
}

function scoreTimeRecency(createdAt: number): number {
  const ageHrs = (Date.now() - createdAt) / 3600000;
  if (ageHrs < 6) return 70;
  if (ageHrs < 24) return 60;
  if (ageHrs < 72) return 45;
  return 30;
}

function scoreSourceAuthority(source?: string): number {
  if (!source || source === 'community') return 50;
  return 95;
}

// ── Spam Detection ─────────────────────────────────────────────────────────

function detectSpam(
  incident: Incident,
  allIncidents: Incident[]
): string[] {
  const flags: string[] = [];
  const oneHourAgo = Date.now() - 3600000;
  const recentFromSame = allIncidents.filter(
    (i) => i.reporterUid === incident.reporterUid && i.createdAt > oneHourAgo
  );
  if (recentFromSame.length > 5) flags.push('spam_high_frequency');
  return flags;
}

// ── Main Engine ────────────────────────────────────────────────────────────

export function analyzeCredibility(
  incident: Incident,
  allIncidents: Incident[],
  reporterHistory: ReporterHistory | null = null
): CredibilityResult {
  const textResult = scoreTextQuality(incident.title + ' ' + incident.description);
  const reporter = scoreReporterHistory(reporterHistory);
  const community = scoreCommunityValidation(incident.confirmCount, incident.denyCount);
  const geo = scoreGeographicPlausibility(incident.location.latitude, incident.location.longitude);
  const crossRef = scoreCrossReference(incident, allIncidents);
  const photo = scorePhotoEvidence(incident.photoURLs);
  const time = scoreTimeRecency(incident.createdAt);
  const source = scoreSourceAuthority(incident.source);
  const spamFlags = detectSpam(incident, allIncidents);

  const factors: Record<string, number> = {
    textQuality: textResult.score,
    reporterHistory: reporter,
    communityValidation: community,
    geographicPlausibility: geo,
    crossReference: crossRef.score,
    photoEvidence: photo,
    timeRecency: time,
    sourceAuthority: source,
  };

  let weighted =
    textResult.score * W.textQuality +
    reporter * W.reporterHistory +
    community * W.communityValidation +
    geo * W.geographicPlausibility +
    crossRef.score * W.crossReference +
    photo * W.photoEvidence +
    time * W.timeRecency +
    source * W.sourceAuthority;

  const allFlags = [...textResult.flags, ...crossRef.flags, ...spamFlags];

  if (spamFlags.includes('spam_high_frequency')) weighted -= 20;
  if (allFlags.includes('duplicate_from_same_reporter')) weighted -= 15;
  if (allFlags.includes('threat_keywords')) weighted = Math.min(weighted, 70);

  const score = clamp(Math.round(weighted));
  const level = getCredibilityLevel(score);

  return { score, level, factors, flags: allFlags };
}

function getCredibilityLevel(score: number): CredibilityLevel {
  if (score >= 80) return 'high';
  if (score >= 50) return 'medium';
  if (score >= 20) return 'low';
  return 'likely_fake';
}

export function getCredibilityBadge(level: CredibilityLevel): {
  label: string;
  color: string;
  bgColor: string;
} {
  switch (level) {
    case 'high':
      return { label: 'VERIFICADO', color: '#00FF88', bgColor: 'rgba(0,255,136,0.15)' };
    case 'medium':
      return { label: '', color: 'transparent', bgColor: 'transparent' };
    case 'low':
      return { label: 'SUSPEITO', color: '#FFD700', bgColor: 'rgba(255,215,0,0.15)' };
    case 'likely_fake':
      return { label: 'POSSÍVEL FALSO', color: '#FF4444', bgColor: 'rgba(255,68,68,0.15)' };
  }
}
