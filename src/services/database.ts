import { COLLECTIONS } from '../config/firebase';
import type {
  UserProfile, Incident, IncidentComment, Chain, ChainMember, ChainMessage,
  ChainAlert, FamilyGroup, FamilyMember, ActivityLog, LogAction,
  GeoPosition, NotificationItem, FeedItem,
} from '../types';

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

type CollectionStore<T> = Map<string, T>;

const stores: Record<string, CollectionStore<any>> = {
  [COLLECTIONS.USERS]: new Map<string, UserProfile>(),
  [COLLECTIONS.INCIDENTS]: new Map<string, Incident>(),
  [COLLECTIONS.CHAINS]: new Map<string, Chain>(),
  [COLLECTIONS.CHAIN_MEMBERS]: new Map<string, ChainMember>(),
  [COLLECTIONS.CHAIN_MESSAGES]: new Map<string, ChainMessage>(),
  [COLLECTIONS.CHAIN_ALERTS]: new Map<string, ChainAlert>(),
  [COLLECTIONS.FAMILIES]: new Map<string, FamilyGroup>(),
  [COLLECTIONS.FAMILY_MEMBERS]: new Map<string, FamilyMember>(),
  [COLLECTIONS.ACTIVITY_LOGS]: new Map<string, ActivityLog>(),
  [COLLECTIONS.NOTIFICATIONS]: new Map<string, NotificationItem>(),
  [COLLECTIONS.FEED]: new Map<string, FeedItem>(),
};

type Listener<T> = (data: T[]) => void;
const listeners: Record<string, Set<Listener<any>>> = {};

function notifyListeners(collection: string) {
  const subs = listeners[collection];
  if (!subs) return;
  const data = Array.from(stores[collection]?.values() || []);
  subs.forEach((cb) => cb(data));
}

function subscribe<T>(collection: string, callback: Listener<T>): () => void {
  if (!listeners[collection]) listeners[collection] = new Set();
  listeners[collection].add(callback);
  const data = Array.from(stores[collection]?.values() || []);
  callback(data as T[]);
  return () => { listeners[collection]?.delete(callback); };
}

// ─── USERS ───

export const UserDB = {
  async create(user: UserProfile): Promise<void> {
    stores[COLLECTIONS.USERS].set(user.uid, user);
    notifyListeners(COLLECTIONS.USERS);
    await LogDB.write(user.uid, 'user_signup');
  },

  async get(uid: string): Promise<UserProfile | null> {
    return stores[COLLECTIONS.USERS].get(uid) || null;
  },

  async update(uid: string, updates: Partial<UserProfile>): Promise<void> {
    const existing = stores[COLLECTIONS.USERS].get(uid);
    if (existing) {
      stores[COLLECTIONS.USERS].set(uid, { ...existing, ...updates });
      notifyListeners(COLLECTIONS.USERS);
      await LogDB.write(uid, 'profile_updated');
    }
  },

  async updateLocation(uid: string, location: GeoPosition): Promise<void> {
    const existing = stores[COLLECTIONS.USERS].get(uid);
    if (existing) {
      stores[COLLECTIONS.USERS].set(uid, { ...existing, lastActiveAt: Date.now(), lastLocation: location });
      notifyListeners(COLLECTIONS.USERS);
    }
  },

  subscribe(callback: Listener<UserProfile>) {
    return subscribe<UserProfile>(COLLECTIONS.USERS, callback);
  },
};

// ─── INCIDENTS ───

export const IncidentDB = {
  async create(data: Omit<Incident, 'id'>): Promise<string> {
    const id = generateId('inc');
    const incident: Incident = { ...data, id };
    stores[COLLECTIONS.INCIDENTS].set(id, incident);
    notifyListeners(COLLECTIONS.INCIDENTS);
    await LogDB.write(data.reporterUid, 'incident_created', id, 'incident');
    return id;
  },

  async get(id: string): Promise<Incident | null> {
    return stores[COLLECTIONS.INCIDENTS].get(id) || null;
  },

  async getAll(): Promise<Incident[]> {
    return Array.from(stores[COLLECTIONS.INCIDENTS].values())
      .sort((a, b) => b.createdAt - a.createdAt);
  },

  async getByLocation(center: GeoPosition, radiusKm: number): Promise<Incident[]> {
    const all = Array.from(stores[COLLECTIONS.INCIDENTS].values());
    return all.filter((inc) => {
      const dlat = inc.location.latitude - center.latitude;
      const dlng = inc.location.longitude - center.longitude;
      const dist = Math.sqrt(dlat * dlat + dlng * dlng) * 111;
      return dist <= radiusKm;
    });
  },

  async update(id: string, updates: Partial<Incident>): Promise<void> {
    const existing = stores[COLLECTIONS.INCIDENTS].get(id);
    if (existing) {
      stores[COLLECTIONS.INCIDENTS].set(id, { ...existing, ...updates });
      notifyListeners(COLLECTIONS.INCIDENTS);
    }
  },

  async confirm(id: string, uid: string): Promise<void> {
    const inc = stores[COLLECTIONS.INCIDENTS].get(id);
    if (!inc || inc.isFakeReport) return;
    const newCount = inc.confirmCount + 1;
    const autoVerified = !inc.isVerified && newCount >= 10;
    stores[COLLECTIONS.INCIDENTS].set(id, {
      ...inc,
      confirmCount: newCount,
      credibilityScore: inc.credibilityScore + 1.5,
      ...(autoVerified && {
        isVerified: true,
        verifiedByUid: 'community',
        verifiedByName: 'Community Verified',
      }),
    });
    notifyListeners(COLLECTIONS.INCIDENTS);
    await LogDB.write(uid, 'incident_confirmed', id, 'incident');
    if (autoVerified) {
      await LogDB.write('system', 'incident_verified', id, 'incident', { method: 'community_vote', confirms: newCount });
    }
  },

  async deny(id: string, uid: string): Promise<void> {
    const inc = stores[COLLECTIONS.INCIDENTS].get(id);
    if (!inc || inc.isFakeReport) return;
    const newCount = inc.denyCount + 1;
    const autoFake = !inc.isFakeReport && newCount >= 10;
    stores[COLLECTIONS.INCIDENTS].set(id, {
      ...inc,
      denyCount: newCount,
      credibilityScore: inc.credibilityScore - 1,
      ...(autoFake && {
        isFakeReport: true,
        status: 'removed' as const,
      }),
    });
    notifyListeners(COLLECTIONS.INCIDENTS);
    await LogDB.write(uid, 'incident_denied', id, 'incident');
    if (autoFake) {
      await LogDB.write('system', 'incident_removed', id, 'incident', { method: 'community_vote', denies: newCount });
    }
  },

  async view(id: string, uid: string): Promise<void> {
    const inc = stores[COLLECTIONS.INCIDENTS].get(id);
    if (inc) {
      stores[COLLECTIONS.INCIDENTS].set(id, { ...inc, views: inc.views + 1 });
      notifyListeners(COLLECTIONS.INCIDENTS);
      await LogDB.write(uid, 'incident_viewed', id, 'incident');
    }
  },

  async addComment(id: string, uid: string, userName: string, userLevel: number, text: string): Promise<void> {
    const inc = stores[COLLECTIONS.INCIDENTS].get(id);
    if (!inc) return;
    const trimmed = text.slice(0, 200);
    if (!trimmed.trim()) return;
    const comment: IncidentComment = {
      id: `cmt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      uid,
      userName,
      userLevel,
      text: trimmed,
      createdAt: Date.now(),
    };
    stores[COLLECTIONS.INCIDENTS].set(id, {
      ...inc,
      comments: [...inc.comments, comment],
      commentCount: inc.commentCount + 1,
    });
    notifyListeners(COLLECTIONS.INCIDENTS);
    await LogDB.write(uid, 'incident_commented', id, 'incident');
  },

  async verify(id: string, guardianUid: string, guardianName: string): Promise<void> {
    const inc = stores[COLLECTIONS.INCIDENTS].get(id);
    if (inc) {
      stores[COLLECTIONS.INCIDENTS].set(id, {
        ...inc,
        isVerified: true,
        verifiedByUid: guardianUid,
        verifiedByName: guardianName,
      });
      notifyListeners(COLLECTIONS.INCIDENTS);
      await LogDB.write(guardianUid, 'incident_verified', id, 'incident');
    }
  },

  subscribe(callback: Listener<Incident>) {
    return subscribe<Incident>(COLLECTIONS.INCIDENTS, callback);
  },
};

// ─── CHAINS ───

export const ChainDB = {
  async create(ownerUid: string, name: string): Promise<string> {
    const id = generateId('chain');
    const inviteCode = Math.random().toString(36).slice(2, 8).toUpperCase();
    const chain: Chain = {
      id, name, ownerUid, inviteCode,
      members: [ownerUid], memberCount: 1,
      photoURL: null,
      createdAt: Date.now(), updatedAt: Date.now(),
    };
    stores[COLLECTIONS.CHAINS].set(id, chain);
    notifyListeners(COLLECTIONS.CHAINS);
    await LogDB.write(ownerUid, 'chain_created', id, 'chain');
    return id;
  },

  async get(id: string): Promise<Chain | null> {
    return stores[COLLECTIONS.CHAINS].get(id) || null;
  },

  async getByUser(uid: string): Promise<Chain[]> {
    return Array.from(stores[COLLECTIONS.CHAINS].values())
      .filter((c) => c.members.includes(uid));
  },

  async getByInviteCode(code: string): Promise<Chain | null> {
    return Array.from(stores[COLLECTIONS.CHAINS].values())
      .find((c) => c.inviteCode === code) || null;
  },

  async joinByCode(code: string, uid: string): Promise<string | null> {
    const chain = await ChainDB.getByInviteCode(code);
    if (!chain) return null;
    if (!chain.members.includes(uid)) {
      chain.members.push(uid);
      chain.memberCount = chain.members.length;
      chain.updatedAt = Date.now();
      stores[COLLECTIONS.CHAINS].set(chain.id, chain);
      notifyListeners(COLLECTIONS.CHAINS);
    }
    return chain.id;
  },

  async update(id: string, updates: Partial<Chain>): Promise<void> {
    const existing = stores[COLLECTIONS.CHAINS].get(id);
    if (existing) {
      stores[COLLECTIONS.CHAINS].set(id, { ...existing, ...updates, updatedAt: Date.now() });
      notifyListeners(COLLECTIONS.CHAINS);
    }
  },

  subscribe(callback: Listener<Chain>) {
    return subscribe<Chain>(COLLECTIONS.CHAINS, callback);
  },
};

// ─── CHAIN MEMBERS (friends, pets, vehicles, devices) ───

export const ChainMemberDB = {
  async add(member: Omit<ChainMember, 'id' | 'addedAt'>): Promise<string> {
    const id = generateId('cm');
    const full: ChainMember = { ...member, id, addedAt: Date.now() };
    stores[COLLECTIONS.CHAIN_MEMBERS].set(id, full);
    notifyListeners(COLLECTIONS.CHAIN_MEMBERS);
    await LogDB.write(member.ownerUid, 'chain_member_added', id, member.type);
    return id;
  },

  async getByChain(chainId: string): Promise<ChainMember[]> {
    return Array.from(stores[COLLECTIONS.CHAIN_MEMBERS].values())
      .filter((m) => m.chainId === chainId)
      .sort((a, b) => a.addedAt - b.addedAt);
  },

  async getByOwner(ownerUid: string): Promise<ChainMember[]> {
    return Array.from(stores[COLLECTIONS.CHAIN_MEMBERS].values())
      .filter((m) => m.ownerUid === ownerUid);
  },

  async updateLocation(id: string, location: GeoPosition): Promise<void> {
    const existing = stores[COLLECTIONS.CHAIN_MEMBERS].get(id);
    if (existing) {
      stores[COLLECTIONS.CHAIN_MEMBERS].set(id, {
        ...existing, location, lastLocationUpdate: Date.now(), isOnline: true,
      });
      notifyListeners(COLLECTIONS.CHAIN_MEMBERS);
    }
  },

  async update(id: string, updates: Partial<ChainMember>): Promise<void> {
    const existing = stores[COLLECTIONS.CHAIN_MEMBERS].get(id);
    if (existing) {
      stores[COLLECTIONS.CHAIN_MEMBERS].set(id, { ...existing, ...updates });
      notifyListeners(COLLECTIONS.CHAIN_MEMBERS);
    }
  },

  async remove(id: string, uid: string): Promise<void> {
    stores[COLLECTIONS.CHAIN_MEMBERS].delete(id);
    notifyListeners(COLLECTIONS.CHAIN_MEMBERS);
    await LogDB.write(uid, 'chain_member_removed', id, 'chain_member');
  },

  subscribe(callback: Listener<ChainMember>) {
    return subscribe<ChainMember>(COLLECTIONS.CHAIN_MEMBERS, callback);
  },
};

// ─── CHAIN MESSAGES ───

export const ChainMessageDB = {
  async send(msg: Omit<ChainMessage, 'id' | 'readBy' | 'createdAt'>): Promise<string> {
    const id = generateId('msg');
    const full: ChainMessage = {
      ...msg, id, readBy: [msg.senderUid], createdAt: Date.now(),
    };
    stores[COLLECTIONS.CHAIN_MESSAGES].set(id, full);
    notifyListeners(COLLECTIONS.CHAIN_MESSAGES);
    await LogDB.write(msg.senderUid, 'chain_message_sent', id, 'message');
    return id;
  },

  async getByChain(chainId: string, limit = 50): Promise<ChainMessage[]> {
    return Array.from(stores[COLLECTIONS.CHAIN_MESSAGES].values())
      .filter((m) => m.chainId === chainId)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit)
      .reverse();
  },

  async markRead(messageId: string, uid: string): Promise<void> {
    const msg = stores[COLLECTIONS.CHAIN_MESSAGES].get(messageId);
    if (msg && !msg.readBy.includes(uid)) {
      msg.readBy.push(uid);
      stores[COLLECTIONS.CHAIN_MESSAGES].set(messageId, msg);
      notifyListeners(COLLECTIONS.CHAIN_MESSAGES);
    }
  },

  subscribeToChain(chainId: string, callback: Listener<ChainMessage>): () => void {
    const wrapped = (all: ChainMessage[]) => {
      callback(all.filter((m) => m.chainId === chainId).sort((a, b) => a.createdAt - b.createdAt));
    };
    return subscribe<ChainMessage>(COLLECTIONS.CHAIN_MESSAGES, wrapped);
  },
};

// ─── CHAIN ALERTS ───

export const ChainAlertDB = {
  async create(alert: Omit<ChainAlert, 'id' | 'isAcknowledged' | 'acknowledgedBy' | 'createdAt'>): Promise<string> {
    const id = generateId('alert');
    const full: ChainAlert = {
      ...alert, id, isAcknowledged: false, acknowledgedBy: [], createdAt: Date.now(),
    };
    stores[COLLECTIONS.CHAIN_ALERTS].set(id, full);
    notifyListeners(COLLECTIONS.CHAIN_ALERTS);
    await LogDB.write(alert.senderUid, 'chain_alert_sent', id, 'alert');
    return id;
  },

  async getByChain(chainId: string): Promise<ChainAlert[]> {
    return Array.from(stores[COLLECTIONS.CHAIN_ALERTS].values())
      .filter((a) => a.chainId === chainId)
      .sort((a, b) => b.createdAt - a.createdAt);
  },

  async acknowledge(alertId: string, uid: string): Promise<void> {
    const alert = stores[COLLECTIONS.CHAIN_ALERTS].get(alertId);
    if (alert && !alert.acknowledgedBy.includes(uid)) {
      alert.acknowledgedBy.push(uid);
      alert.isAcknowledged = true;
      stores[COLLECTIONS.CHAIN_ALERTS].set(alertId, alert);
      notifyListeners(COLLECTIONS.CHAIN_ALERTS);
    }
  },

  subscribeToChain(chainId: string, callback: Listener<ChainAlert>): () => void {
    const wrapped = (all: ChainAlert[]) => {
      callback(all.filter((a) => a.chainId === chainId).sort((a, b) => b.createdAt - a.createdAt));
    };
    return subscribe<ChainAlert>(COLLECTIONS.CHAIN_ALERTS, wrapped);
  },
};

// ─── ACTIVITY LOGS ───

export const LogDB = {
  async write(uid: string, action: LogAction, targetId?: string, targetType?: string, details?: Record<string, any>): Promise<void> {
    const id = generateId('log');
    const log: ActivityLog = {
      id, uid, action, targetId, targetType, details, createdAt: Date.now(),
    };
    stores[COLLECTIONS.ACTIVITY_LOGS].set(id, log);
  },

  async getByUser(uid: string, limit = 100): Promise<ActivityLog[]> {
    return Array.from(stores[COLLECTIONS.ACTIVITY_LOGS].values())
      .filter((l) => l.uid === uid)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
  },

  async getAll(limit = 500): Promise<ActivityLog[]> {
    return Array.from(stores[COLLECTIONS.ACTIVITY_LOGS].values())
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
  },
};

// ─── SEED FUNCTION (loads mock data into local DB) ───

export async function seedDatabase(): Promise<void> {
  const { MOCK_USER, MOCK_INCIDENTS, MOCK_FAMILY, MOCK_FAMILY_MEMBERS, MOCK_FEED } = await import('./mockData');

  if (!stores[COLLECTIONS.USERS].has(MOCK_USER.uid)) {
    stores[COLLECTIONS.USERS].set(MOCK_USER.uid, { ...MOCK_USER, chainIds: [], lastActiveAt: Date.now() });
  }

  MOCK_INCIDENTS.forEach((inc) => {
    if (!stores[COLLECTIONS.INCIDENTS].has(inc.id)) {
      stores[COLLECTIONS.INCIDENTS].set(inc.id, inc);
    }
  });

  if (!stores[COLLECTIONS.FAMILIES].has(MOCK_FAMILY.groupId)) {
    stores[COLLECTIONS.FAMILIES].set(MOCK_FAMILY.groupId, MOCK_FAMILY);
  }

  MOCK_FAMILY_MEMBERS.forEach((m) => {
    if (!stores[COLLECTIONS.FAMILY_MEMBERS].has(m.uid)) {
      stores[COLLECTIONS.FAMILY_MEMBERS].set(m.uid, m);
    }
  });

  MOCK_FEED.forEach((f) => {
    if (!stores[COLLECTIONS.FEED].has(f.id)) {
      stores[COLLECTIONS.FEED].set(f.id, f);
    }
  });

  const demoChainId = 'chain-demo-001';
  if (!stores[COLLECTIONS.CHAINS].has(demoChainId)) {
    const chain: Chain = {
      id: demoChainId, name: 'My Safety Chain', ownerUid: MOCK_USER.uid,
      inviteCode: 'ATN001', members: [MOCK_USER.uid], memberCount: 1,
      photoURL: null, createdAt: Date.now() - 86400000, updatedAt: Date.now(),
    };
    stores[COLLECTIONS.CHAINS].set(demoChainId, chain);

    const demoMembers: Omit<ChainMember, 'id' | 'addedAt'>[] = [
      {
        chainId: demoChainId, type: 'friend', name: 'Patricia Querino',
        avatar: null, ownerUid: MOCK_USER.uid, locationSharingEnabled: true,
        location: { latitude: 41.2420, longitude: -8.6310 }, isOnline: true, batteryLevel: 63,
        metadata: { phone: '+351912345678', email: 'patricia@example.com' },
      },
      {
        chainId: demoChainId, type: 'pet', name: 'Rex',
        avatar: null, ownerUid: MOCK_USER.uid, locationSharingEnabled: true,
        location: { latitude: 41.2340, longitude: -8.6180 }, isOnline: true, batteryLevel: 88,
        metadata: { species: 'Dog', breed: 'German Shepherd', trackerModel: 'Tractive GPS' },
      },
      {
        chainId: demoChainId, type: 'vehicle', name: 'Audi A3',
        avatar: null, ownerUid: MOCK_USER.uid, locationSharingEnabled: true,
        location: { latitude: 41.2365, longitude: -8.6210 }, isOnline: true, batteryLevel: 100,
        metadata: { make: 'Audi', model: 'A3', plate: '00-AB-00' },
      },
      {
        chainId: demoChainId, type: 'device', name: 'AirTag - Keys',
        avatar: null, ownerUid: MOCK_USER.uid, locationSharingEnabled: true,
        location: { latitude: 41.2356, longitude: -8.6200 }, isOnline: true, batteryLevel: 72,
        metadata: { deviceType: 'Bluetooth Tracker', trackerModel: 'Apple AirTag' },
      },
    ];

    demoMembers.forEach((m, i) => {
      const id = `cm-demo-${i}`;
      stores[COLLECTIONS.CHAIN_MEMBERS].set(id, { ...m, id, addedAt: Date.now() - (i * 3600000) });
    });

    const demoMessages: Omit<ChainMessage, 'id' | 'readBy' | 'createdAt'>[] = [
      { chainId: demoChainId, senderUid: MOCK_USER.uid, senderName: 'Eduardo Q.', type: 'text', content: 'Chain is set up! Everyone connected.' },
      { chainId: demoChainId, senderUid: 'family-member-002', senderName: 'Patricia Querino', type: 'check_in', content: 'Just arrived home safely.' },
      { chainId: demoChainId, senderUid: MOCK_USER.uid, senderName: 'Eduardo Q.', type: 'alert', content: 'Speed camera detected on EN13. Drive carefully!', alertLevel: 'warning' },
      { chainId: demoChainId, senderUid: MOCK_USER.uid, senderName: 'Eduardo Q.', type: 'location', content: 'Shared current location', location: { latitude: 41.2356, longitude: -8.6200 } },
    ];

    demoMessages.forEach((m, i) => {
      const id = `msg-demo-${i}`;
      stores[COLLECTIONS.CHAIN_MESSAGES].set(id, {
        ...m, id, readBy: [m.senderUid], createdAt: Date.now() - ((demoMessages.length - i) * 600000),
      });
    });
  }

  Object.keys(stores).forEach((col) => notifyListeners(col));
}
