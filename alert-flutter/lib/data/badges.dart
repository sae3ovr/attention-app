import 'dart:ui';

Color _hex(String hex) => Color(int.parse(hex.replaceFirst('#', 'FF'), radix: 16));

class Badge {
  final String badgeId;
  final int level;
  final String name;
  final String nameEN;
  final String icon;
  final int minReputation;
  final int? maxReputation;
  final int dailyReportLimit;
  final Color color;
  final Color glowColor;

  const Badge._({
    required this.badgeId,
    required this.level,
    required this.name,
    required this.nameEN,
    required this.icon,
    required this.minReputation,
    this.maxReputation,
    required this.dailyReportLimit,
    required this.color,
    required this.glowColor,
  });
}

final allBadges = [
  Badge._(badgeId: '0',  level: 0,  name: 'Observador Iniciante',     nameEN: 'Beginner observer',      icon: '👀',     minReputation: 0,      maxReputation: 49,     dailyReportLimit: 5,  color: _hex('#6B7280'), glowColor: _hex('#374151')),
  Badge._(badgeId: '1',  level: 1,  name: 'Vigia Desperto',           nameEN: 'Awakened watcher',        icon: '👁️‍🗨️', minReputation: 50,     maxReputation: 99,     dailyReportLimit: 5,  color: _hex('#9CA3AF'), glowColor: _hex('#4B5563')),
  Badge._(badgeId: '2',  level: 2,  name: 'Batedor Novato',           nameEN: 'Rookie scout',            icon: '🧭',     minReputation: 100,    maxReputation: 199,    dailyReportLimit: 5,  color: _hex('#60A5FA'), glowColor: _hex('#2563EB')),
  Badge._(badgeId: '3',  level: 3,  name: 'Repórter de Rua',          nameEN: 'Street reporter',         icon: '📰',     minReputation: 200,    maxReputation: 349,    dailyReportLimit: 8,  color: _hex('#34D399'), glowColor: _hex('#059669')),
  Badge._(badgeId: '4',  level: 4,  name: 'Olheiro do Bairro',        nameEN: 'Neighborhood lookout',    icon: '🏘️',    minReputation: 350,    maxReputation: 499,    dailyReportLimit: 8,  color: _hex('#A78BFA'), glowColor: _hex('#7C3AED')),
  Badge._(badgeId: '5',  level: 5,  name: 'Ronda Noturna',            nameEN: 'Night patrol',            icon: '🔦',     minReputation: 500,    maxReputation: 749,    dailyReportLimit: 8,  color: _hex('#F59E0B'), glowColor: _hex('#D97706')),
  Badge._(badgeId: '6',  level: 6,  name: 'Vigia de Sinais',          nameEN: 'Signal watcher',          icon: '📡',     minReputation: 750,    maxReputation: 999,    dailyReportLimit: 12, color: _hex('#10B981'), glowColor: _hex('#047857')),
  Badge._(badgeId: '7',  level: 7,  name: 'Guarda da Torre',          nameEN: 'Tower guard',             icon: '🗼',     minReputation: 1000,   maxReputation: 1499,   dailyReportLimit: 12, color: _hex('#3B82F6'), glowColor: _hex('#1D4ED8')),
  Badge._(badgeId: '8',  level: 8,  name: 'Sentinela de Ferro',       nameEN: 'Iron sentinel',           icon: '🔩',     minReputation: 1500,   maxReputation: 1999,   dailyReportLimit: 12, color: _hex('#8B5CF6'), glowColor: _hex('#6D28D9')),
  Badge._(badgeId: '9',  level: 9,  name: 'Intendente de Rua',        nameEN: 'Street warden',           icon: '🚧',     minReputation: 2000,   maxReputation: 2999,   dailyReportLimit: 12, color: _hex('#EC4899'), glowColor: _hex('#BE185D')),
  Badge._(badgeId: '10', level: 10, name: 'Vigia da Cidade',          nameEN: 'City watchman',           icon: '🌆',     minReputation: 3000,   maxReputation: 3999,   dailyReportLimit: 12, color: _hex('#14B8A6'), glowColor: _hex('#0D9488')),
  Badge._(badgeId: '11', level: 11, name: 'Defensor da Lei',          nameEN: 'Law enforcer',            icon: '👮',     minReputation: 4000,   maxReputation: 4999,   dailyReportLimit: 18, color: _hex('#F97316'), glowColor: _hex('#EA580C')),
  Badge._(badgeId: '12', level: 12, name: 'Agente de Campo',          nameEN: 'Field agent',             icon: '🕵️',    minReputation: 5000,   maxReputation: 6499,   dailyReportLimit: 18, color: _hex('#06B6D4'), glowColor: _hex('#0891B2')),
  Badge._(badgeId: '13', level: 13, name: 'Falcão Vigilante',         nameEN: 'Vigilant hawk',           icon: '🦅',     minReputation: 6500,   maxReputation: 7999,   dailyReportLimit: 18, color: _hex('#84CC16'), glowColor: _hex('#65A30D')),
  Badge._(badgeId: '14', level: 14, name: 'Protetor do Distrito',     nameEN: 'District protector',      icon: '🏛️',    minReputation: 8000,   maxReputation: 9999,   dailyReportLimit: 18, color: _hex('#EAB308'), glowColor: _hex('#CA8A04')),
  Badge._(badgeId: '15', level: 15, name: 'Porta-Escudo',             nameEN: 'Shield bearer',           icon: '🛡️',    minReputation: 10000,  maxReputation: 12499,  dailyReportLimit: 18, color: _hex('#EF4444'), glowColor: _hex('#DC2626')),
  Badge._(badgeId: '16', level: 16, name: 'Observador Tático',        nameEN: 'Tactical observer',       icon: '🎯',     minReputation: 12500,  maxReputation: 14999,  dailyReportLimit: 25, color: _hex('#8B5CF6'), glowColor: _hex('#7C3AED')),
  Badge._(badgeId: '17', level: 17, name: 'Comandante de Zona',       nameEN: 'Zone commander',          icon: '📯',     minReputation: 15000,  maxReputation: 17999,  dailyReportLimit: 25, color: _hex('#0EA5E9'), glowColor: _hex('#0284C7')),
  Badge._(badgeId: '18', level: 18, name: 'Oráculo da Segurança',     nameEN: 'Security oracle',         icon: '🔮',     minReputation: 18000,  maxReputation: 21999,  dailyReportLimit: 25, color: _hex('#22D3EE'), glowColor: _hex('#06B6D4')),
  Badge._(badgeId: '19', level: 19, name: 'Vigia de Elite',           nameEN: 'Elite watcher',           icon: '🔭',     minReputation: 22000,  maxReputation: 25999,  dailyReportLimit: 25, color: _hex('#A855F7'), glowColor: _hex('#9333EA')),
  Badge._(badgeId: '20', level: 20, name: 'Guardião de Ouro',         nameEN: 'Gold guardian',           icon: '🥇',     minReputation: 26000,  maxReputation: 30999,  dailyReportLimit: 25, color: _hex('#FBBF24'), glowColor: _hex('#F59E0B')),
  Badge._(badgeId: '21', level: 21, name: 'Sentinela Estelar',        nameEN: 'Star sentinel',           icon: '⭐',     minReputation: 31000,  maxReputation: 35999,  dailyReportLimit: 35, color: _hex('#FCD34D'), glowColor: _hex('#FBBF24')),
  Badge._(badgeId: '22', level: 22, name: 'Protetor Supremo',         nameEN: 'Supreme protector',       icon: '🦾',     minReputation: 36000,  maxReputation: 41999,  dailyReportLimit: 35, color: _hex('#FB923C'), glowColor: _hex('#F97316')),
  Badge._(badgeId: '23', level: 23, name: 'Guardião da Coroa',        nameEN: 'Crown warden',            icon: '👑',     minReputation: 42000,  maxReputation: 49999,  dailyReportLimit: 35, color: _hex('#F472B6'), glowColor: _hex('#EC4899')),
  Badge._(badgeId: '24', level: 24, name: 'Chefe da Vigília',         nameEN: 'Chief of watch',          icon: '📜',     minReputation: 50000,  maxReputation: 57999,  dailyReportLimit: 35, color: _hex('#E879F9'), glowColor: _hex('#D946EF')),
  Badge._(badgeId: '25', level: 25, name: 'Guardião Lendário',        nameEN: 'Legendary guardian',      icon: '🌟',     minReputation: 58000,  maxReputation: 65999,  dailyReportLimit: 35, color: _hex('#C084FC'), glowColor: _hex('#A855F7')),
  Badge._(badgeId: '26', level: 26, name: 'Escudo Mítico',            nameEN: 'Mythic shield',           icon: '🧱',     minReputation: 66000,  maxReputation: 74999,  dailyReportLimit: 50, color: _hex('#818CF8'), glowColor: _hex('#6366F1')),
  Badge._(badgeId: '27', level: 27, name: 'Guardião do Trovão',       nameEN: 'Thunder guardian',        icon: '⚡',     minReputation: 75000,  maxReputation: 84999,  dailyReportLimit: 50, color: _hex('#38BDF8'), glowColor: _hex('#0EA5E9')),
  Badge._(badgeId: '28', level: 28, name: 'Sentinela Eterna',         nameEN: 'Eternal sentinel',        icon: '🕰️',    minReputation: 85000,  maxReputation: 92999,  dailyReportLimit: 50, color: _hex('#FB7185'), glowColor: _hex('#F43F5E')),
  Badge._(badgeId: '29', level: 29, name: 'Vigia Ômega',              nameEN: 'Omega watcher',           icon: '⭕',     minReputation: 93000,  maxReputation: 99999,  dailyReportLimit: 50, color: _hex('#FACC15'), glowColor: _hex('#EAB308')),
  Badge._(badgeId: '30', level: 30, name: 'Guardião Grão-Mestre',     nameEN: 'Grand master guardian',   icon: '🏆',     minReputation: 100000, maxReputation: 199999, dailyReportLimit: 50, color: _hex('#FFD700'), glowColor: _hex('#FFA500')),
  Badge._(badgeId: 'guardian', level: 31, name: 'Guardião Supremo',   nameEN: 'Supreme guardian',        icon: '🔐',     minReputation: 200000, maxReputation: null,   dailyReportLimit: -1, color: _hex('#00FFAA'), glowColor: _hex('#00FF88')),
];

Badge getBadgeForLevel(int level) {
  return allBadges.firstWhere((b) => b.level == level, orElse: () => allBadges.first);
}

Badge getBadgeForReputation(int reputation) {
  if (reputation >= 200000) return allBadges.last;
  for (int i = allBadges.length - 2; i >= 0; i--) {
    if (reputation >= allBadges[i].minReputation) return allBadges[i];
  }
  return allBadges.first;
}

double getProgressToNextLevel(int reputation, Badge currentBadge) {
  if (currentBadge.maxReputation == null) return 1.0;
  final range = currentBadge.maxReputation! - currentBadge.minReputation + 1;
  final progress = reputation - currentBadge.minReputation;
  return (progress / range).clamp(0.0, 1.0);
}
