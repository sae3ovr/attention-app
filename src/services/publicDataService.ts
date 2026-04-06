import type { Incident, IncidentCategory, IncidentSeverity, IncidentSource } from '../types';

function fetchWithTimeout(url: string, timeoutMs = 12000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(timer));
}

// ── UK Police API ──────────────────────────────────────────────────────────

interface UKCrime {
  category: string;
  location_type: string;
  location: { latitude: string; longitude: string; street: { id: number; name: string } };
  context: string;
  outcome_status: { category: string; date: string } | null;
  persistent_id: string;
  id: number;
  month: string;
}

const UK_CATEGORY_MAP: Record<string, IncidentCategory> = {
  'anti-social-behaviour': 'noise',
  'bicycle-theft': 'robbery',
  burglary: 'robbery',
  'criminal-damage-arson': 'fire',
  drugs: 'suspicious',
  'other-theft': 'robbery',
  'possession-of-weapons': 'suspicious',
  'public-order': 'hazard',
  robbery: 'robbery',
  shoplifting: 'robbery',
  'theft-from-the-person': 'robbery',
  'vehicle-crime': 'robbery',
  'violent-crime': 'robbery',
  'other-crime': 'other',
};

const UK_SEVERITY_MAP: Record<string, IncidentSeverity> = {
  'violent-crime': 'critical',
  robbery: 'high',
  'criminal-damage-arson': 'high',
  'possession-of-weapons': 'critical',
  burglary: 'medium',
  'anti-social-behaviour': 'low',
  drugs: 'medium',
  'public-order': 'medium',
};

function ukCrimeTitle(cat: string, street: string): string {
  const titles: Record<string, string> = {
    'anti-social-behaviour': 'Comportamento antissocial',
    'bicycle-theft': 'Furto de bicicleta',
    burglary: 'Arrombamento',
    'criminal-damage-arson': 'Dano criminal / Incêndio',
    drugs: 'Atividade relacionada a drogas',
    'other-theft': 'Furto',
    'possession-of-weapons': 'Posse de armas',
    'public-order': 'Distúrbio da ordem pública',
    robbery: 'Roubo',
    shoplifting: 'Furto em loja',
    'theft-from-the-person': 'Furto pessoal',
    'vehicle-crime': 'Crime de veículo',
    'violent-crime': 'Crime violento',
    'other-crime': 'Outro crime',
  };
  return `${titles[cat] || cat} — ${street}`;
}

function normalizeUKCrime(crime: UKCrime): Incident {
  const cat = UK_CATEGORY_MAP[crime.category] || 'other';
  const sev = UK_SEVERITY_MAP[crime.category] || 'low';
  const monthParts = crime.month.split('-');
  const ts = new Date(parseInt(monthParts[0]), parseInt(monthParts[1]) - 1).getTime();

  return {
    id: `uk-${crime.id}`,
    reporterUid: 'uk-police-api',
    reporterName: 'UK Police',
    reporterLevel: 10,
    reporterBadge: 'Dados Oficiais',
    category: cat,
    severity: sev,
    title: ukCrimeTitle(crime.category, crime.location.street.name),
    description: crime.context || `Registado pela polícia em ${crime.location.street.name}. Categoria: ${crime.category}.`,
    location: {
      latitude: parseFloat(crime.location.latitude),
      longitude: parseFloat(crime.location.longitude),
    },
    geohash: '',
    address: crime.location.street.name,
    photoURLs: [],
    confirmCount: 0,
    denyCount: 0,
    credibilityScore: 95,
    status: 'active',
    isVerified: true,
    isFakeReport: false,
    verifiedByUid: 'uk-police',
    verifiedByName: 'UK Police Data',
    views: 0,
    commentCount: 0,
    comments: [],
    source: 'uk_police',
    createdAt: ts,
    expiresAt: ts + 90 * 86400000,
  };
}

export async function fetchUKPoliceData(lat: number, lng: number): Promise<Incident[]> {
  try {
    const now = new Date();
    now.setMonth(now.getMonth() - 2);
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const url = `https://data.police.uk/api/crimes-street/all-crime?lat=${lat}&lng=${lng}&date=${dateStr}`;
    const res = await fetchWithTimeout(url);
    if (!res.ok) return [];
    const data: UKCrime[] = await res.json();
    return data
      .filter((c) => c.location?.latitude && c.location?.longitude)
      .slice(0, 50)
      .map(normalizeUKCrime);
  } catch {
    return [];
  }
}

// ── Washington DC Open Data ────────────────────────────────────────────────

interface DCFeature {
  properties: {
    OBJECTID: number;
    CCN: string;
    OFFENSE: string;
    METHOD: string;
    REPORT_DAT: string;
    SHIFT: string;
    BLOCK: string;
    WARD: number;
    DISTRICT: number;
  };
  geometry: { type: string; coordinates: [number, number] };
}

const DC_CATEGORY_MAP: Record<string, IncidentCategory> = {
  HOMICIDE: 'robbery',
  'SEX ABUSE': 'suspicious',
  ROBBERY: 'robbery',
  'ASSAULT W/DANGEROUS WEAPON': 'robbery',
  BURGLARY: 'robbery',
  'THEFT/OTHER': 'robbery',
  'THEFT F/AUTO': 'robbery',
  'MOTOR VEHICLE THEFT': 'robbery',
  ARSON: 'fire',
};

const DC_SEVERITY_MAP: Record<string, IncidentSeverity> = {
  HOMICIDE: 'critical',
  'SEX ABUSE': 'critical',
  ROBBERY: 'high',
  'ASSAULT W/DANGEROUS WEAPON': 'critical',
  BURGLARY: 'medium',
  'THEFT/OTHER': 'low',
  'THEFT F/AUTO': 'low',
  'MOTOR VEHICLE THEFT': 'medium',
  ARSON: 'high',
};

function normalizeDCCrime(f: DCFeature): Incident {
  const cat = DC_CATEGORY_MAP[f.properties.OFFENSE] || 'other';
  const sev = DC_SEVERITY_MAP[f.properties.OFFENSE] || 'low';
  const ts = new Date(f.properties.REPORT_DAT).getTime() || Date.now();

  return {
    id: `dc-${f.properties.OBJECTID}`,
    reporterUid: 'dc-gov-api',
    reporterName: 'DC Metropolitan Police',
    reporterLevel: 10,
    reporterBadge: 'Dados Oficiais',
    category: cat,
    severity: sev,
    title: `${f.properties.OFFENSE} — ${f.properties.BLOCK}`,
    description: `Método: ${f.properties.METHOD}. Turno: ${f.properties.SHIFT}. Distrito: ${f.properties.DISTRICT}, Ward ${f.properties.WARD}.`,
    location: {
      latitude: f.geometry.coordinates[1],
      longitude: f.geometry.coordinates[0],
    },
    geohash: '',
    address: f.properties.BLOCK,
    photoURLs: [],
    confirmCount: 0,
    denyCount: 0,
    credibilityScore: 95,
    status: 'active',
    isVerified: true,
    isFakeReport: false,
    verifiedByUid: 'dc-gov',
    verifiedByName: 'DC Gov Open Data',
    views: 0,
    commentCount: 0,
    comments: [],
    source: 'dc_gov',
    createdAt: ts,
    expiresAt: ts + 90 * 86400000,
  };
}

export async function fetchDCData(): Promise<Incident[]> {
  try {
    const url =
      'https://maps2.dcgis.dc.gov/dcgis/rest/services/FEEDS/MPD/MapServer/8/query?where=1%3D1&outFields=*&resultRecordCount=40&orderByFields=REPORT_DAT+DESC&f=geojson';
    const res = await fetchWithTimeout(url);
    if (!res.ok) return [];
    const geojson = await res.json();
    if (!geojson.features) return [];
    return (geojson.features as DCFeature[])
      .filter((f) => f.geometry?.coordinates?.length === 2)
      .map(normalizeDCCrime);
  } catch {
    return [];
  }
}

// ── Portugal dados.gov.pt seed ─────────────────────────────────────────────

export function loadPortugalSeedData(): Incident[] {
  try {
    const data = require('../data/portugalCrimeStats.json') as Array<{
      id: string;
      cat: string;
      sev: string;
      title: string;
      desc: string;
      lat: number;
      lng: number;
      region: string;
    }>;
    return data.map((d) => ({
      id: `pt-${d.id}`,
      reporterUid: 'dados-gov-pt',
      reporterName: 'dados.gov.pt',
      reporterLevel: 10,
      reporterBadge: 'Dados Oficiais',
      category: (d.cat as IncidentCategory) || 'other',
      severity: (d.sev as IncidentSeverity) || 'low',
      title: d.title,
      description: d.desc,
      location: { latitude: d.lat, longitude: d.lng },
      geohash: '',
      address: d.region,
      photoURLs: [],
      confirmCount: 0,
      denyCount: 0,
      credibilityScore: 90,
      status: 'active' as const,
      isVerified: true,
      isFakeReport: false,
      verifiedByUid: 'dados-gov',
      verifiedByName: 'dados.gov.pt',
      views: 0,
      commentCount: 0,
      comments: [],
      source: 'dados_gov' as IncidentSource,
      createdAt: Date.now() - Math.random() * 30 * 86400000,
      expiresAt: Date.now() + 180 * 86400000,
    }));
  } catch {
    return [];
  }
}

// ── Aggregate all sources ──────────────────────────────────────────────────

export async function fetchAllPublicData(
  userLat?: number,
  userLng?: number
): Promise<Incident[]> {
  const tasks: Promise<Incident[]>[] = [];

  if (userLat && userLng) {
    tasks.push(fetchUKPoliceData(userLat, userLng));
  } else {
    tasks.push(fetchUKPoliceData(51.5074, -0.1278)); // London fallback
  }

  tasks.push(fetchDCData());

  const results = await Promise.allSettled(tasks);
  let all: Incident[] = [];
  for (const r of results) {
    if (r.status === 'fulfilled') all = all.concat(r.value);
  }

  try {
    all = all.concat(loadPortugalSeedData());
  } catch { /* seed not available */ }

  return all;
}
