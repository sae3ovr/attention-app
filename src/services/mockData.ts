import type { Incident, UserProfile, FamilyGroup, FamilyMember, FeedItem } from '../types';

export const MOCK_USER: UserProfile = {
  uid: 'mock-user-001',
  displayName: 'Eduardo Q.',
  email: 'eduardo@example.com',
  photoURL: null,
  reputation: 203750,
  level: 31,
  levelName: 'Guardião',
  levelIcon: '🛡️',
  isGuardian: true,
  isProbationary: false,
  totalReports: 1842,
  totalConfirmations: 5670,
  reportsToday: 7,
  dailyReportLimit: -1,
  isGhostMode: false,
  familyGroupIds: ['family-001'],
  kidProfileIds: ['kid-lucas-001'],
  chainIds: ['chain-demo-001'],
  createdAt: Date.now() - 365 * 86400000,
  lastActiveAt: Date.now(),
  verifiedIncidents: 312,
  removedIncidents: 45,
  mentees: 8,
};

export const MOCK_INCIDENTS: Incident[] = [
  {
    id: 'inc-001',
    reporterUid: 'user-002',
    reporterName: 'Maria Lima',
    reporterLevel: 8,
    reporterBadge: 'Sentinela de Bairro',
    category: 'robbery',
    severity: 'high',
    title: 'Tentativa de assalto perto da estação de Maia',
    description: 'Dois indivíduos em uma moto tentaram roubar o celular de um pedestre perto da saída da estação da Maia.',
    location: { latitude: 41.2356, longitude: -8.6200 },
    geohash: 'ez3q6yf1x',
    address: 'R. Dr. Carlos Felgueiras, Maia Centro',
    photoURLs: [],
    confirmCount: 12,
    denyCount: 1,
    credibilityScore: 18.5,
    status: 'active',
    isVerified: true,
    isFakeReport: false,
    verifiedByUid: 'guardian-001',
    verifiedByName: 'Eduardo Q.',
    views: 135,
    commentCount: 8,
    comments: [],
    createdAt: Date.now() - 1200000,
    expiresAt: Date.now() + 85200000,
  },
  {
    id: 'inc-002',
    reporterUid: 'user-003',
    reporterName: 'João Costa',
    reporterLevel: 5,
    reporterBadge: 'Patrulheiro Local',
    category: 'accident',
    severity: 'medium',
    title: 'Colisão de carros na Av. Visconde de Barreiros',
    description: 'Dois veículos colidiram na rotunda. Sem ferimentos graves, mas o trânsito está bloqueado.',
    location: { latitude: 41.2450, longitude: -8.6350 },
    geohash: 'ez3q6ybcz',
    address: 'Av. Visconde de Barreiros, Castêlo da Maia',
    photoURLs: [],
    confirmCount: 8,
    denyCount: 0,
    credibilityScore: 12.0,
    status: 'active',
    isVerified: false,
    isFakeReport: false,
    verifiedByUid: null,
    views: 58,
    commentCount: 3,
    comments: [],
    createdAt: Date.now() - 2700000,
    expiresAt: Date.now() + 83700000,
  },
  {
    id: 'inc-003',
    reporterUid: 'user-004',
    reporterName: 'Ana Oliveira',
    reporterLevel: 15,
    reporterBadge: 'Escudo Popular',
    category: 'suspicious',
    severity: 'low',
    title: 'Pessoa suspeita observando carros estacionados',
    description: 'Uma pessoa está andando pelo estacionamento olhando dentro dos carros há 30 minutos.',
    location: { latitude: 41.2250, longitude: -8.6080 },
    geohash: 'ez3q6yf3q',
    address: 'Zona Industrial da Maia, Águas Santas',
    photoURLs: [],
    confirmCount: 3,
    denyCount: 2,
    credibilityScore: 4.0,
    status: 'active',
    isVerified: false,
    isFakeReport: false,
    verifiedByUid: null,
    views: 39,
    commentCount: 5,
    comments: [],
    createdAt: Date.now() - 5400000,
    expiresAt: Date.now() + 81000000,
  },
  {
    id: 'inc-004',
    reporterUid: 'user-005',
    reporterName: 'Carlos Melo',
    reporterLevel: 3,
    reporterBadge: 'Repórter de Rua',
    category: 'fire',
    severity: 'critical',
    title: 'Incêndio em edifício na R. do Lidador',
    description: 'Chamas visíveis e fumaça intensa saindo de um edifício. Os bombeiros foram chamados.',
    location: { latitude: 41.2480, longitude: -8.6100 },
    geohash: 'ez3q6yb9z',
    address: 'R. do Lidador, Moreira da Maia',
    photoURLs: [],
    confirmCount: 25,
    denyCount: 0,
    credibilityScore: 42.0,
    status: 'active',
    isVerified: true,
    isFakeReport: false,
    verifiedByUid: 'guardian-001',
    verifiedByName: 'Eduardo Q.',
    views: 276,
    commentCount: 15,
    comments: [],
    createdAt: Date.now() - 600000,
    expiresAt: Date.now() + 85800000,
  },
  {
    id: 'inc-005',
    reporterUid: 'user-006',
    reporterName: 'Lucia Ferreira',
    reporterLevel: 12,
    reporterBadge: 'Agente Comunitário',
    category: 'police',
    severity: 'medium',
    title: 'Blitz da GNR na EN13',
    description: 'A GNR montou uma blitz na estrada nacional. Espere atrasos de aproximadamente 20 minutos.',
    location: { latitude: 41.2180, longitude: -8.6380 },
    geohash: 'ez3q6yf6r',
    address: 'EN13, Pedrouços',
    photoURLs: [],
    confirmCount: 15,
    denyCount: 1,
    credibilityScore: 22.0,
    status: 'active',
    isVerified: false,
    isFakeReport: false,
    verifiedByUid: null,
    views: 107,
    commentCount: 7,
    comments: [],
    createdAt: Date.now() - 3600000,
    expiresAt: Date.now() + 82800000,
  },
  {
    id: 'inc-006',
    reporterUid: 'mock-user-001',
    reporterName: 'Eduardo Q.',
    reporterLevel: 31,
    reporterBadge: 'Guardian',
    category: 'traffic',
    severity: 'low',
    title: 'Engarrafamento perto do Maia Jardim',
    description: 'Trânsito intenso devido a obras perto do shopping center. Use rotas alternativas.',
    location: { latitude: 41.2520, longitude: -8.6450 },
    geohash: 'ez3q6ybwx',
    address: 'Maia Jardim, Vermoim',
    photoURLs: [],
    confirmCount: 6,
    denyCount: 0,
    credibilityScore: 9.0,
    status: 'active',
    isVerified: false,
    isFakeReport: false,
    verifiedByUid: null,
    views: 47,
    commentCount: 2,
    comments: [],
    createdAt: Date.now() - 7200000,
    expiresAt: Date.now() + 79200000,
  },
];

export const MOCK_FAMILY: FamilyGroup = {
  groupId: 'family-001',
  name: 'Querino Family',
  adminUid: 'mock-user-001',
  inviteCode: 'ATN3X8KP',
  memberCount: 4,
  maxMembers: 20,
  photoURL: null,
};

export const MOCK_FAMILY_MEMBERS: FamilyMember[] = [
  {
    uid: 'mock-user-001',
    displayName: 'Eduardo Q.',
    role: 'admin',
    locationSharingEnabled: true,
    location: { latitude: 41.2356, longitude: -8.6200 },
    isOnline: true,
    batteryLevel: 85,
  },
  {
    uid: 'family-member-002',
    displayName: 'Patricia Querino',
    role: 'member',
    locationSharingEnabled: true,
    location: { latitude: 41.2420, longitude: -8.6310 },
    isOnline: true,
    batteryLevel: 63,
  },
  {
    uid: 'family-member-003',
    displayName: 'Lucas Querino',
    role: 'kid',
    locationSharingEnabled: true,
    location: { latitude: 41.2290, longitude: -8.6120 },
    isOnline: true,
    batteryLevel: 72,
    isInSafeZone: true,
  },
  {
    uid: 'family-member-004',
    displayName: 'Sofia Querino',
    role: 'member',
    locationSharingEnabled: false,
    isOnline: false,
    batteryLevel: 14,
  },
];

export interface UserProfileCard {
  uid: string;
  displayName: string;
  photoURL: string | null;
  reputation: number;
  level: number;
  levelName: string;
  levelIcon: string;
  badge: string;
  badgeColor: string;
  isGuardian: boolean;
  totalReports: number;
  totalConfirmations: number;
  verifiedIncidents: number;
  memberSince: number;
  lastActive: number;
  fame: string;
  role?: string;
  batteryLevel?: number;
  isOnline?: boolean;
}

export const MOCK_USER_PROFILES: Record<string, UserProfileCard> = {
  'mock-user-001': {
    uid: 'mock-user-001',
    displayName: 'Eduardo Q.',
    photoURL: null,
    reputation: 203750,
    level: 31,
    levelName: 'Guardião',
    levelIcon: '🛡️',
    badge: 'Guardião',
    badgeColor: '#00FFAA',
    isGuardian: true,
    totalReports: 1842,
    totalConfirmations: 5670,
    verifiedIncidents: 312,
    memberSince: Date.now() - 365 * 86400000,
    lastActive: Date.now(),
    fame: 'Protetor Lendário',
    role: 'admin',
    batteryLevel: 85,
    isOnline: true,
  },
  'family-member-002': {
    uid: 'family-member-002',
    displayName: 'Patricia Querino',
    photoURL: null,
    reputation: 8450,
    level: 14,
    levelName: 'Guardiã da Vizinhança',
    levelIcon: '🏰',
    badge: 'Guardião da Vizinhança',
    badgeColor: '#EAB308',
    isGuardian: false,
    totalReports: 267,
    totalConfirmations: 892,
    verifiedIncidents: 0,
    memberSince: Date.now() - 280 * 86400000,
    lastActive: Date.now() - 1200000,
    fame: 'Vigilante de Confiança',
    role: 'member',
    batteryLevel: 63,
    isOnline: true,
  },
  'family-member-003': {
    uid: 'family-member-003',
    displayName: 'Lucas Querino',
    photoURL: null,
    reputation: 350,
    level: 4,
    levelName: 'Olheiro Comunitário',
    levelIcon: '👀',
    badge: 'Olheiro Comunitário',
    badgeColor: '#A78BFA',
    isGuardian: false,
    totalReports: 18,
    totalConfirmations: 45,
    verifiedIncidents: 0,
    memberSince: Date.now() - 90 * 86400000,
    lastActive: Date.now() - 300000,
    fame: 'Estrela em Ascensão',
    role: 'kid',
    batteryLevel: 72,
    isOnline: true,
  },
  'family-member-004': {
    uid: 'family-member-004',
    displayName: 'Sofia Querino',
    photoURL: null,
    reputation: 2800,
    level: 9,
    levelName: 'Guardiã de Esquina',
    levelIcon: '🚦',
    badge: 'Guardião de Esquina',
    badgeColor: '#EC4899',
    isGuardian: false,
    totalReports: 134,
    totalConfirmations: 412,
    verifiedIncidents: 0,
    memberSince: Date.now() - 200 * 86400000,
    lastActive: Date.now() - 7200000,
    fame: 'Repórter Confiável',
    role: 'member',
    batteryLevel: 14,
    isOnline: false,
  },
};

const FEED_NAMES = [
  'Eduardo Q.', 'Maria Lima', 'Carlos Melo', 'João Costa', 'Ana Oliveira',
  'Lucia Ferreira', 'Renata Alves', 'Diego Martins', 'Sofia Mendes', 'Pedro Rocha',
  'Beatriz Santos', 'Rafael Nunes', 'Inês Cardoso', 'Tiago Moreira', 'Clara Vieira',
  'Bruno Lopes', 'Mariana Pinto', 'André Sousa', 'Helena Ribeiro', 'Gustavo Correia',
];

const FEED_LOCATIONS = [
  'R. do Lidador', 'Av. da República', 'Praça do Infante', 'R. de Santa Catarina',
  'Cais de Gaia', 'Ponte D. Luís I', 'Estação de São Bento', 'Foz do Douro',
  'Zona Industrial da Maia', 'EN13', 'R. Dr. Carlos Felgueiras', 'Parque da Cidade',
  'Av. dos Aliados', 'Mercado do Bolhão', 'R. das Flores', 'Hospital S. João',
  'Universidade do Porto', 'Centro Comercial NorteShopping', 'Matosinhos Sul', 'Praça da Batalha',
];

const FEED_INCIDENT_TYPES = [
  'assalto', 'incêndio', 'acidente de trânsito', 'pessoa suspeita', 'atividade policial',
  'emergência médica', 'ruído excessivo', 'inundação', 'veículo abandonado', 'fuga de gás',
  'roubo de veículo', 'agressão', 'vandalismo', 'queda de árvore', 'animal ferido',
];

function generateRandomFeed(count: number): FeedItem[] {
  const items: FeedItem[] = [];
  const types: FeedItem['type'][] = ['new_incident', 'incident_verified', 'user_leveled_up', 'user_became_guardian'];
  const weights = [0.5, 0.25, 0.15, 0.1];

  for (let i = 0; i < count; i++) {
    const rand = Math.random();
    let type: FeedItem['type'] = 'new_incident';
    let cumulative = 0;
    for (let j = 0; j < types.length; j++) {
      cumulative += weights[j];
      if (rand < cumulative) { type = types[j]; break; }
    }

    const name = FEED_NAMES[Math.floor(Math.random() * FEED_NAMES.length)];
    const loc = FEED_LOCATIONS[Math.floor(Math.random() * FEED_LOCATIONS.length)];
    const incType = FEED_INCIDENT_TYPES[Math.floor(Math.random() * FEED_INCIDENT_TYPES.length)];
    const level = type === 'user_became_guardian' ? 31 : type === 'incident_verified' ? Math.floor(Math.random() * 10) + 22 : Math.floor(Math.random() * 28) + 1;
    const firstName = name.split(' ')[0];

    let summary: string;
    switch (type) {
      case 'new_incident':
        summary = `${firstName} relatou ${incType} perto de ${loc}`;
        break;
      case 'incident_verified':
        summary = `Guardião ${firstName} verificou ${incType} na ${loc}`;
        break;
      case 'user_leveled_up':
        summary = `${firstName} alcançou o Nível ${level} — ${level >= 20 ? 'Sentinela de Ouro' : level >= 10 ? 'Vigilante' : 'Patrulheiro'}!`;
        break;
      case 'user_became_guardian':
        summary = `${firstName} alcançou 200.000 pts e se tornou Guardião!`;
        break;
    }

    const timeOffset = i === 0
      ? Math.floor(Math.random() * 120000)
      : Math.floor(Math.random() * 3600000) + i * 300000;

    items.push({
      id: `feed-${String(i + 1).padStart(3, '0')}`,
      type,
      actorName: name,
      actorLevel: level,
      summary,
      createdAt: Date.now() - timeOffset,
    });
  }

  return items.sort((a, b) => b.createdAt - a.createdAt);
}

export const MOCK_FEED: FeedItem[] = generateRandomFeed(30);

export function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'agora mesmo';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m atrás`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h atrás`;
  const days = Math.floor(hours / 24);
  return `${days}d atrás`;
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}
