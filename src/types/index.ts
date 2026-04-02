export type IncidentCategory =
  | 'robbery'
  | 'accident'
  | 'suspicious'
  | 'hazard'
  | 'police'
  | 'fire'
  | 'medical'
  | 'traffic'
  | 'noise'
  | 'other';

export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical';
export type IncidentStatus = 'active' | 'resolved' | 'expired' | 'removed';

export interface GeoPosition {
  latitude: number;
  longitude: number;
}

export interface Incident {
  id: string;
  reporterUid: string;
  reporterName: string;
  reporterLevel: number;
  reporterBadge: string;
  category: IncidentCategory;
  severity: IncidentSeverity;
  title: string;
  description: string;
  location: GeoPosition;
  geohash: string;
  address: string | null;
  photoURLs: string[];
  confirmCount: number;
  denyCount: number;
  credibilityScore: number;
  status: IncidentStatus;
  isVerified: boolean;
  verifiedByUid: string | null;
  verifiedByName?: string | null;
  reactions: {
    useful: number;
    beCareful: number;
    watching: number;
  };
  commentCount: number;
  createdAt: number;
  expiresAt: number;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string | null;
  reputation: number;
  level: number;
  levelName: string;
  levelIcon: string;
  isGuardian: boolean;
  isProbationary: boolean;
  totalReports: number;
  totalConfirmations: number;
  reportsToday: number;
  dailyReportLimit: number;
  isGhostMode: boolean;
  familyGroupIds: string[];
  kidProfileIds: string[];
  chainIds: string[];
  createdAt: number;
  lastActiveAt: number;
  verifiedIncidents?: number;
  removedIncidents?: number;
  mentees?: number;
}

export interface Badge {
  badgeId: string;
  level: number;
  name: string;
  nameEN: string;
  icon: string;
  minReputation: number;
  maxReputation: number | null;
  dailyReportLimit: number;
  color: string;
  glowColor: string;
  perks: string[];
}

export interface FamilyGroup {
  groupId: string;
  name: string;
  adminUid: string;
  inviteCode: string;
  memberCount: number;
  maxMembers: number;
  photoURL: string | null;
}

export interface FamilyMember {
  uid: string;
  displayName: string;
  role: 'admin' | 'member' | 'kid';
  locationSharingEnabled: boolean;
  location?: GeoPosition;
  isOnline?: boolean;
  batteryLevel?: number;
  isInSafeZone?: boolean;
}

export interface KidProfile {
  kidId: string;
  kidUid: string;
  kidName: string;
  kidPhotoURL: string | null;
  parentUids: string[];
  familyGroupId: string;
  isActive: boolean;
  safeZones: SafeZone[];
}

export interface SafeZone {
  zoneId: string;
  name: string;
  type: 'circle' | 'polygon';
  center?: GeoPosition;
  radiusMeters?: number;
  polygon?: GeoPosition[];
  isActive: boolean;
}

export interface FeedItem {
  id: string;
  type: 'new_incident' | 'incident_verified' | 'user_leveled_up' | 'user_became_guardian';
  actorName: string;
  actorLevel: number;
  summary: string;
  createdAt: number;
}

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: number;
}

export interface AccessibilityPreferences {
  highContrast: boolean;
  lightTheme: boolean;
  largeText: boolean;
  reducedMotion: boolean;
  screenReaderEnabled: boolean;
  hapticFeedback: boolean;
  voiceGuidance: boolean;
  largeTargets: boolean;
  simplifiedUI: boolean;
}

// ─── CHAIN SYSTEM ───

export type ChainMemberType = 'friend' | 'pet' | 'vehicle' | 'device';

export interface ChainMember {
  id: string;
  chainId: string;
  type: ChainMemberType;
  name: string;
  avatar: string | null;
  ownerUid: string;
  locationSharingEnabled: boolean;
  location?: GeoPosition;
  lastLocationUpdate?: number;
  isOnline: boolean;
  batteryLevel?: number;
  metadata: ChainMemberMeta;
  addedAt: number;
}

export interface ChainMemberMeta {
  breed?: string;
  species?: string;
  make?: string;
  model?: string;
  plate?: string;
  deviceType?: string;
  bluetoothId?: string;
  trackerModel?: string;
  phone?: string;
  email?: string;
  notes?: string;
}

export interface Chain {
  id: string;
  name: string;
  ownerUid: string;
  inviteCode: string;
  members: string[];
  memberCount: number;
  photoURL: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface ChainMessage {
  id: string;
  chainId: string;
  senderUid: string;
  senderName: string;
  type: 'text' | 'alert' | 'location' | 'sos' | 'check_in' | 'image';
  content: string;
  location?: GeoPosition;
  alertLevel?: 'info' | 'warning' | 'danger';
  readBy: string[];
  createdAt: number;
}

export interface ChainAlert {
  id: string;
  chainId: string;
  senderUid: string;
  senderName: string;
  memberTargetId?: string;
  type: 'geofence_exit' | 'sos' | 'low_battery' | 'offline' | 'speed_alert' | 'custom';
  title: string;
  message: string;
  location?: GeoPosition;
  severity: 'info' | 'warning' | 'critical';
  isAcknowledged: boolean;
  acknowledgedBy: string[];
  createdAt: number;
}

// ─── ACTIVITY LOGS ───

export type LogAction =
  | 'user_signup'
  | 'user_login'
  | 'user_logout'
  | 'incident_created'
  | 'incident_confirmed'
  | 'incident_denied'
  | 'incident_verified'
  | 'incident_removed'
  | 'chain_created'
  | 'chain_member_added'
  | 'chain_member_removed'
  | 'chain_message_sent'
  | 'chain_alert_sent'
  | 'chain_sos_triggered'
  | 'location_shared'
  | 'profile_updated'
  | 'family_created'
  | 'family_member_added';

export interface ActivityLog {
  id: string;
  uid: string;
  action: LogAction;
  targetId?: string;
  targetType?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  deviceInfo?: string;
  location?: GeoPosition;
  createdAt: number;
}
