import { Platform } from 'react-native';
import { UserDB, IncidentDB, ChainDB, ChainAlertDB, ChainMessageDB, ChainMemberDB, LogDB } from '../services/database';
import type { GeoPosition, Incident, Chain, ChainAlert, ChainMessage, ChainMember } from '../types';
import type {
  AttentionConfig,
  AttentionUser,
  SafetyEvent,
  SafetyEventType,
  OnEventCallback,
  Geofence,
  SOSPayload,
  IncidentPayload,
  LocationPayload,
  AlertPayload,
} from './types';

const SDK_VERSION = '1.0.0';

class AttentionSDKSingleton {
  private _initialized = false;
  private _config: AttentionConfig | null = null;
  private _user: AttentionUser | null = null;
  private _listeners: Set<OnEventCallback> = new Set();
  private _locationWatchId: number | null = null;
  private _geofences: Geofence[] = [];
  private _lastKnownLocation: GeoPosition | null = null;
  private _nearbyCheckInterval: ReturnType<typeof setInterval> | null = null;
  private _unsubscribers: (() => void)[] = [];

  get version() { return SDK_VERSION; }
  get isInitialized() { return this._initialized; }
  get currentUser() { return this._user; }
  get currentLocation() { return this._lastKnownLocation; }
  get config() { return this._config; }

  async init(config: AttentionConfig): Promise<void> {
    if (this._initialized) {
      this._log('SDK already initialized. Call destroy() first to reinitialize.');
      return;
    }

    if (!config.apiKey) {
      throw new Error('[AttentionSDK] apiKey is required');
    }

    this._config = {
      environment: 'production',
      theme: 'auto',
      language: 'en',
      enableSOS: true,
      enableIncidentAlerts: true,
      enableLocationSharing: true,
      enableChain: true,
      enableDriveMode: true,
      alertRadius: 5000,
      debug: false,
      ...config,
    };

    this._geofences = config.geofences || [];

    if (config.onEvent) {
      this._listeners.add(config.onEvent);
    }

    this._initialized = true;
    this._emit('sdk_ready', { version: SDK_VERSION, platform: Platform.OS });
    this._log(`SDK v${SDK_VERSION} initialized on ${Platform.OS}`);
  }

  async setUser(user: AttentionUser): Promise<void> {
    this._assertInit();
    this._user = user;

    const existing = await UserDB.get(user.uid);
    if (!existing) {
      await UserDB.create({
        uid: user.uid,
        displayName: user.displayName,
        email: user.email || '',
        photoURL: user.photoURL || null,
        reputation: 0,
        level: 1,
        levelName: 'Newcomer',
        levelIcon: '🌱',
        isGuardian: false,
        isProbationary: false,
        totalReports: 0,
        totalConfirmations: 0,
        reportsToday: 0,
        dailyReportLimit: 3,
        isGhostMode: false,
        familyGroupIds: [],
        kidProfileIds: [],
        chainIds: [],
        createdAt: Date.now(),
        lastActiveAt: Date.now(),
      });
    }

    this._startNearbyMonitoring();
    this._log(`User set: ${user.displayName} (${user.uid})`);
  }

  async clearUser(): Promise<void> {
    this._stopNearbyMonitoring();
    this._user = null;
    this._log('User cleared');
  }

  // ─── SOS ───

  async triggerSOS(payload?: Partial<SOSPayload>): Promise<string> {
    this._assertInit();
    this._assertUser();

    const location = payload?.location || this._lastKnownLocation;
    if (!location) throw new Error('[AttentionSDK] Location required for SOS');

    const user = this._user!;
    const chains = await ChainDB.getByUser(user.uid);
    const targetChainIds = payload?.chainIds || chains.map(c => c.id);

    const alertIds: string[] = [];
    for (const chainId of targetChainIds) {
      const alertId = await ChainAlertDB.create({
        chainId,
        senderUid: user.uid,
        senderName: user.displayName,
        type: 'sos',
        title: 'SOS EMERGENCY',
        message: payload?.message || `${user.displayName} triggered SOS!`,
        location,
        severity: 'critical',
      });
      alertIds.push(alertId);

      await ChainMessageDB.send({
        chainId,
        senderUid: user.uid,
        senderName: user.displayName,
        type: 'sos',
        content: `🚨 SOS: ${payload?.message || 'Emergency! I need help!'}`,
        location,
        alertLevel: 'danger',
      });
    }

    this._emit('sos_triggered', { alertIds, location, chainIds: targetChainIds });
    this._log(`SOS triggered to ${targetChainIds.length} chain(s)`);
    return alertIds[0] || '';
  }

  async cancelSOS(): Promise<void> {
    this._assertInit();
    this._emit('sos_cancelled', {});
    this._log('SOS cancelled');
  }

  // ─── INCIDENTS ───

  async reportIncident(payload: IncidentPayload): Promise<string> {
    this._assertInit();
    this._assertUser();

    const user = this._user!;
    const id = await IncidentDB.create({
      reporterUid: user.uid,
      reporterName: user.displayName,
      reporterLevel: 1,
      reporterBadge: '🌱',
      category: payload.category,
      severity: payload.severity,
      title: payload.title,
      description: payload.description || '',
      location: payload.location,
      geohash: '',
      address: null,
      photoURLs: payload.photoURLs || [],
      confirmCount: 0,
      denyCount: 0,
      credibilityScore: 5,
      status: 'active',
      isVerified: false,
      isFakeReport: false,
      verifiedByUid: null,
      views: 0,
      commentCount: 0,
      comments: [],
      createdAt: Date.now(),
      expiresAt: Date.now() + 86400000,
    });

    this._emit('incident_reported', { incidentId: id, category: payload.category, location: payload.location });
    this._log(`Incident reported: ${payload.title}`);
    return id;
  }

  async getNearbyIncidents(radius?: number): Promise<Incident[]> {
    this._assertInit();
    const location = this._lastKnownLocation;
    if (!location) return [];

    const radiusKm = (radius || this._config!.alertRadius || 5000) / 1000;
    return IncidentDB.getByLocation(location, radiusKm);
  }

  // ─── LOCATION ───

  async updateLocation(payload: LocationPayload): Promise<void> {
    this._assertInit();
    this._lastKnownLocation = payload.location;

    if (this._user) {
      await UserDB.updateLocation(this._user.uid, payload.location);
    }

    this._checkGeofences(payload.location);

    if (payload.speed !== undefined && this._config?.enableDriveMode) {
      this._checkSpeedAlerts(payload.speed, payload.location);
    }

    this._emit('location_updated', payload);
  }

  startLocationTracking(intervalMs = 10000): void {
    this._assertInit();
    if (this._locationWatchId !== null) return;

    this._locationWatchId = setInterval(async () => {
      try {
        const { getCurrentPositionAsync } = await import('expo-location');
        const pos = await getCurrentPositionAsync({ accuracy: 4 });
        await this.updateLocation({
          location: { latitude: pos.coords.latitude, longitude: pos.coords.longitude },
          accuracy: pos.coords.accuracy ?? undefined,
          speed: pos.coords.speed ?? undefined,
          heading: pos.coords.heading ?? undefined,
          altitude: pos.coords.altitude ?? undefined,
          timestamp: pos.timestamp,
        });
      } catch {
        this._log('Location tracking error');
      }
    }, intervalMs) as any;
    this._log(`Location tracking started (${intervalMs}ms interval)`);
  }

  stopLocationTracking(): void {
    if (this._locationWatchId !== null) {
      clearInterval(this._locationWatchId);
      this._locationWatchId = null;
      this._log('Location tracking stopped');
    }
  }

  // ─── CHAIN ───

  async createChain(name: string): Promise<string> {
    this._assertInit();
    this._assertUser();
    return ChainDB.create(this._user!.uid, name);
  }

  async joinChain(inviteCode: string): Promise<string | null> {
    this._assertInit();
    this._assertUser();
    return ChainDB.joinByCode(inviteCode, this._user!.uid);
  }

  async getUserChains(): Promise<Chain[]> {
    this._assertInit();
    this._assertUser();
    return ChainDB.getByUser(this._user!.uid);
  }

  async sendChainMessage(chainId: string, content: string, type: 'text' | 'alert' | 'location' = 'text'): Promise<string> {
    this._assertInit();
    this._assertUser();
    const user = this._user!;
    return ChainMessageDB.send({
      chainId,
      senderUid: user.uid,
      senderName: user.displayName,
      type,
      content,
      location: type === 'location' ? this._lastKnownLocation || undefined : undefined,
      alertLevel: type === 'alert' ? 'warning' : undefined,
    });
  }

  async sendChainAlert(chainId: string, alert: Omit<AlertPayload, 'targetChainIds'>): Promise<string> {
    this._assertInit();
    this._assertUser();
    const user = this._user!;
    return ChainAlertDB.create({
      chainId,
      senderUid: user.uid,
      senderName: user.displayName,
      type: alert.type,
      title: alert.title,
      message: alert.message,
      severity: alert.severity,
      location: alert.location || this._lastKnownLocation || undefined,
    });
  }

  // ─── GEOFENCES ───

  addGeofence(geofence: Geofence): void {
    this._assertInit();
    this._geofences.push(geofence);
    this._log(`Geofence added: ${geofence.name}`);
  }

  removeGeofence(id: string): void {
    this._geofences = this._geofences.filter(g => g.id !== id);
    this._log(`Geofence removed: ${id}`);
  }

  getGeofences(): Geofence[] {
    return [...this._geofences];
  }

  // ─── EVENTS ───

  on(callback: OnEventCallback): () => void {
    this._listeners.add(callback);
    return () => { this._listeners.delete(callback); };
  }

  off(callback: OnEventCallback): void {
    this._listeners.delete(callback);
  }

  // ─── SAFETY SCORE ───

  async getSafetyScore(): Promise<{ score: number; level: string; factors: Record<string, number> }> {
    this._assertInit();
    const location = this._lastKnownLocation;

    let incidentFactor = 100;
    if (location) {
      const nearby = await IncidentDB.getByLocation(location, 2);
      incidentFactor = Math.max(0, 100 - (nearby.length * 15));
    }

    const chainFactor = this._user
      ? Math.min(100, (await ChainDB.getByUser(this._user.uid)).length * 25)
      : 0;

    const locationFactor = location ? 20 : 0;
    const score = Math.round((incidentFactor * 0.5) + (chainFactor * 0.3) + (locationFactor * 0.2));
    const level = score >= 80 ? 'safe' : score >= 50 ? 'moderate' : 'caution';

    return { score, level, factors: { incidents: incidentFactor, chain: chainFactor, location: locationFactor } };
  }

  // ─── SUBSCRIPTIONS (real-time) ───

  subscribeIncidents(callback: (incidents: Incident[]) => void): () => void {
    const unsub = IncidentDB.subscribe(callback);
    this._unsubscribers.push(unsub);
    return unsub;
  }

  subscribeChainMessages(chainId: string, callback: (messages: ChainMessage[]) => void): () => void {
    const unsub = ChainMessageDB.subscribeToChain(chainId, callback);
    this._unsubscribers.push(unsub);
    return unsub;
  }

  subscribeChainAlerts(chainId: string, callback: (alerts: ChainAlert[]) => void): () => void {
    const unsub = ChainAlertDB.subscribeToChain(chainId, callback);
    this._unsubscribers.push(unsub);
    return unsub;
  }

  // ─── LIFECYCLE ───

  async destroy(): Promise<void> {
    this.stopLocationTracking();
    this._stopNearbyMonitoring();
    this._unsubscribers.forEach(unsub => unsub());
    this._unsubscribers = [];
    this._listeners.clear();
    this._geofences = [];
    this._lastKnownLocation = null;
    this._user = null;
    this._config = null;
    this._initialized = false;
    this._log('SDK destroyed');
  }

  // ─── INTERNALS ───

  private _emit(type: SafetyEventType, data: Record<string, any>) {
    const event: SafetyEvent = {
      type,
      timestamp: Date.now(),
      data,
      location: this._lastKnownLocation || undefined,
      userId: this._user?.uid,
    };
    this._listeners.forEach(cb => {
      try { cb(event); } catch (e) { /* swallow listener errors */ }
    });
  }

  private _assertInit() {
    if (!this._initialized) throw new Error('[AttentionSDK] Not initialized. Call AttentionSDK.init() first.');
  }

  private _assertUser() {
    if (!this._user) throw new Error('[AttentionSDK] No user set. Call AttentionSDK.setUser() first.');
  }

  private _log(msg: string) {
    if (this._config?.debug) {
      console.log(`[AttentionSDK] ${msg}`);
    }
  }

  private _checkGeofences(location: GeoPosition) {
    for (const fence of this._geofences) {
      const dist = this._haversineMeters(location, fence.center);
      const inside = dist <= fence.radiusMeters;

      const fenceKey = `_gf_${fence.id}_inside`;
      const wasInside = (this as any)[fenceKey];

      if (inside && !wasInside) {
        (this as any)[fenceKey] = true;
        fence.onEnter?.();
        this._emit('geofence_enter', { geofence: fence, location });
      } else if (!inside && wasInside) {
        (this as any)[fenceKey] = false;
        fence.onExit?.();
        this._emit('geofence_exit', { geofence: fence, location });
      }
    }
  }

  private _checkSpeedAlerts(speedMs: number, location: GeoPosition) {
    const speedKmh = speedMs * 3.6;
    if (speedKmh > 130) {
      this._emit('speed_alert', { speedKmh, location, limit: 120 });
    }
  }

  private _startNearbyMonitoring() {
    if (this._nearbyCheckInterval) return;
    this._nearbyCheckInterval = setInterval(async () => {
      if (!this._lastKnownLocation || !this._config?.enableIncidentAlerts) return;
      const nearby = await IncidentDB.getByLocation(this._lastKnownLocation, 2);
      const critical = nearby.filter(i => i.severity === 'critical' || i.severity === 'high');
      if (critical.length > 0) {
        this._emit('incident_nearby', { incidents: critical, count: critical.length });
      }
    }, 30000);
  }

  private _stopNearbyMonitoring() {
    if (this._nearbyCheckInterval) {
      clearInterval(this._nearbyCheckInterval);
      this._nearbyCheckInterval = null;
    }
  }

  private _haversineMeters(a: GeoPosition, b: GeoPosition): number {
    const R = 6371000;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(b.latitude - a.latitude);
    const dLon = toRad(b.longitude - a.longitude);
    const lat1 = toRad(a.latitude);
    const lat2 = toRad(b.latitude);
    const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  }
}

export const AttentionSDK = new AttentionSDKSingleton();
