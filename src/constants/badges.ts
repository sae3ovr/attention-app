import type { Badge } from '../types';

export const BADGES: Badge[] = [
  { badgeId: '0', level: 0, name: 'Observador Anônimo', nameEN: 'Anonymous Observer', icon: '👁️', minReputation: 0, maxReputation: 49, dailyReportLimit: 5, color: '#6B7280', glowColor: '#374151', perks: ['basic_map', 'create_reports'] },
  { badgeId: '1', level: 1, name: 'Cidadão Alerta', nameEN: 'Alert Citizen', icon: '🔔', minReputation: 50, maxReputation: 99, dailyReportLimit: 5, color: '#9CA3AF', glowColor: '#4B5563', perks: ['confirm_deny'] },
  { badgeId: '2', level: 2, name: 'Vigia Iniciante', nameEN: 'Beginner Watchman', icon: '🔍', minReputation: 100, maxReputation: 199, dailyReportLimit: 5, color: '#60A5FA', glowColor: '#2563EB', perks: ['comments'] },
  { badgeId: '3', level: 3, name: 'Repórter de Rua', nameEN: 'Street Reporter', icon: '📝', minReputation: 200, maxReputation: 349, dailyReportLimit: 8, color: '#34D399', glowColor: '#059669', perks: ['photos', '8_reports'] },
  { badgeId: '4', level: 4, name: 'Olheiro Comunitário', nameEN: 'Community Scout', icon: '👀', minReputation: 350, maxReputation: 499, dailyReportLimit: 8, color: '#A78BFA', glowColor: '#7C3AED', perks: ['view_profiles'] },
  { badgeId: '5', level: 5, name: 'Patrulheiro Local', nameEN: 'Local Patroller', icon: '🛡️', minReputation: 500, maxReputation: 749, dailyReportLimit: 8, color: '#F59E0B', glowColor: '#D97706', perks: ['comments', 'public_profile'] },
  { badgeId: '6', level: 6, name: 'Informante Confiável', nameEN: 'Trusted Informant', icon: '📡', minReputation: 750, maxReputation: 999, dailyReportLimit: 12, color: '#10B981', glowColor: '#047857', perks: ['wider_radius'] },
  { badgeId: '7', level: 7, name: 'Vigia Dedicado', nameEN: 'Dedicated Watchman', icon: '🔦', minReputation: 1000, maxReputation: 1499, dailyReportLimit: 12, color: '#3B82F6', glowColor: '#1D4ED8', perks: ['follow_users', 'feed'] },
  { badgeId: '8', level: 8, name: 'Sentinela de Bairro', nameEN: 'Neighborhood Sentinel', icon: '🏘️', minReputation: 1500, maxReputation: 1999, dailyReportLimit: 12, color: '#8B5CF6', glowColor: '#6D28D9', perks: ['12_reports'] },
  { badgeId: '9', level: 9, name: 'Guardião de Esquina', nameEN: 'Corner Guardian', icon: '🚦', minReputation: 2000, maxReputation: 2999, dailyReportLimit: 12, color: '#EC4899', glowColor: '#BE185D', perks: ['guardscan_3km'] },
  { badgeId: '10', level: 10, name: 'Sentinela Urbano', nameEN: 'Urban Sentinel', icon: '🌃', minReputation: 3000, maxReputation: 3999, dailyReportLimit: 12, color: '#14B8A6', glowColor: '#0D9488', perks: ['leaderboard'] },
  { badgeId: '11', level: 11, name: 'Protetor de Zona', nameEN: 'Zone Protector', icon: '🗺️', minReputation: 4000, maxReputation: 4999, dailyReportLimit: 18, color: '#F97316', glowColor: '#EA580C', perks: ['18_reports'] },
  { badgeId: '12', level: 12, name: 'Agente Comunitário', nameEN: 'Community Agent', icon: '🤝', minReputation: 5000, maxReputation: 6499, dailyReportLimit: 18, color: '#06B6D4', glowColor: '#0891B2', perks: ['community_alerts'] },
  { badgeId: '13', level: 13, name: 'Vigilante de Área', nameEN: 'Area Vigilante', icon: '🔭', minReputation: 6500, maxReputation: 7999, dailyReportLimit: 18, color: '#84CC16', glowColor: '#65A30D', perks: ['highlighted_markers'] },
  { badgeId: '14', level: 14, name: 'Guardião da Vizinhança', nameEN: 'Neighborhood Guardian', icon: '🏰', minReputation: 8000, maxReputation: 9999, dailyReportLimit: 18, color: '#EAB308', glowColor: '#CA8A04', perks: ['guardscan_4km'] },
  { badgeId: '15', level: 15, name: 'Escudo Popular', nameEN: "People's Shield", icon: '⚔️', minReputation: 10000, maxReputation: 12499, dailyReportLimit: 18, color: '#EF4444', glowColor: '#DC2626', perks: ['auto_boost_feed'] },
  { badgeId: '16', level: 16, name: 'Sentinela Avançado', nameEN: 'Advanced Sentinel', icon: '🎯', minReputation: 12500, maxReputation: 14999, dailyReportLimit: 25, color: '#8B5CF6', glowColor: '#7C3AED', perks: ['25_reports', 'area_analytics'] },
  { badgeId: '17', level: 17, name: 'Defensor Regional', nameEN: 'Regional Defender', icon: '🦅', minReputation: 15000, maxReputation: 17999, dailyReportLimit: 25, color: '#0EA5E9', glowColor: '#0284C7', perks: ['heatmap'] },
  { badgeId: '18', level: 18, name: 'Protetor Regional', nameEN: 'Regional Protector', icon: '🌐', minReputation: 18000, maxReputation: 21999, dailyReportLimit: 25, color: '#22D3EE', glowColor: '#06B6D4', perks: ['route_safety'] },
  { badgeId: '19', level: 19, name: 'Guardião de Elite', nameEN: 'Elite Guardian', icon: '💎', minReputation: 22000, maxReputation: 25999, dailyReportLimit: 25, color: '#A855F7', glowColor: '#9333EA', perks: ['priority_weight'] },
  { badgeId: '20', level: 20, name: 'Sentinela de Ouro', nameEN: 'Gold Sentinel', icon: '🏅', minReputation: 26000, maxReputation: 30999, dailyReportLimit: 25, color: '#FBBF24', glowColor: '#F59E0B', perks: ['guardscan_5km'] },
  { badgeId: '21', level: 21, name: 'Vigilante Supremo', nameEN: 'Supreme Vigilante', icon: '⭐', minReputation: 31000, maxReputation: 35999, dailyReportLimit: 35, color: '#FCD34D', glowColor: '#FBBF24', perks: ['35_reports', 'mentor_badge'] },
  { badgeId: '22', level: 22, name: 'Protetor Supremo', nameEN: 'Supreme Protector', icon: '🌟', minReputation: 36000, maxReputation: 41999, dailyReportLimit: 35, color: '#FB923C', glowColor: '#F97316', perks: ['mentor_users'] },
  { badgeId: '23', level: 23, name: 'Guardião Máximo', nameEN: 'Maximum Guardian', icon: '👑', minReputation: 42000, maxReputation: 49999, dailyReportLimit: 35, color: '#F472B6', glowColor: '#EC4899', perks: ['pinned_reports_8h'] },
  { badgeId: '24', level: 24, name: 'Comandante de Alerta', nameEN: 'Alert Commander', icon: '🎖️', minReputation: 50000, maxReputation: 57999, dailyReportLimit: 35, color: '#E879F9', glowColor: '#D946EF', perks: ['area_push_notifs'] },
  { badgeId: '25', level: 25, name: 'Sentinela Lendário', nameEN: 'Legendary Sentinel', icon: '🔱', minReputation: 58000, maxReputation: 65999, dailyReportLimit: 35, color: '#C084FC', glowColor: '#A855F7', perks: ['custom_marker'] },
  { badgeId: '26', level: 26, name: 'Defensor Lendário', nameEN: 'Legendary Defender', icon: '🛡️', minReputation: 66000, maxReputation: 74999, dailyReportLimit: 50, color: '#818CF8', glowColor: '#6366F1', perks: ['50_reports'] },
  { badgeId: '27', level: 27, name: 'Protetor Absoluto', nameEN: 'Absolute Protector', icon: '⚡', minReputation: 75000, maxReputation: 84999, dailyReportLimit: 50, color: '#38BDF8', glowColor: '#0EA5E9', perks: ['animated_badge'] },
  { badgeId: '28', level: 28, name: 'Guardião Imortal', nameEN: 'Immortal Guardian', icon: '🔥', minReputation: 85000, maxReputation: 92999, dailyReportLimit: 50, color: '#FB7185', glowColor: '#F43F5E', perks: ['custom_alert_sound'] },
  { badgeId: '29', level: 29, name: 'Mestre da Atenção', nameEN: 'Attention Expert', icon: '💫', minReputation: 93000, maxReputation: 99999, dailyReportLimit: 50, color: '#FACC15', glowColor: '#EAB308', perks: ['all_standard_perks'] },
  { badgeId: '30', level: 30, name: 'Attention Master', nameEN: 'Attention Master', icon: '🏆', minReputation: 100000, maxReputation: 199999, dailyReportLimit: 50, color: '#FFD700', glowColor: '#FFA500', perks: ['elite_marker', 'all_features', 'max_standard_level'] },
  { badgeId: 'guardian', level: 31, name: 'Guardian', nameEN: 'Guardian', icon: '🛡️', minReputation: 200000, maxReputation: null, dailyReportLimit: -1, color: '#00FFAA', glowColor: '#00FF88', perks: ['verify_incidents', 'review_reports', 'remove_incidents', 'moderation_dashboard', 'unlimited_reports', 'instant_verification', 'animated_guardian_badge', 'area_statistics'] },
];

export function getBadgeForLevel(level: number): Badge {
  return BADGES.find((b) => b.level === level) ?? BADGES[0];
}

export function getBadgeForReputation(reputation: number): Badge {
  if (reputation >= 200000) return BADGES[BADGES.length - 1];
  for (let i = BADGES.length - 2; i >= 0; i--) {
    if (reputation >= BADGES[i].minReputation) return BADGES[i];
  }
  return BADGES[0];
}

export function getProgressToNextLevel(reputation: number, currentBadge: Badge): number {
  if (currentBadge.maxReputation === null) return 1;
  const range = currentBadge.maxReputation - currentBadge.minReputation + 1;
  const progress = reputation - currentBadge.minReputation;
  return Math.min(progress / range, 1);
}
