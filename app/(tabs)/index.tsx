import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, StyleSheet, Pressable, FlatList, Platform, ScrollView, Animated, Easing, TextInput } from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AttentionMap } from '../../src/components/map/AttentionMap';
import type { MapMarker, GuardScanConfig, NavigationRoute, SpeedCamera } from '../../src/components/map/types';
import { NeonText } from '../../src/components/ui/NeonText';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { BadgeIcon } from '../../src/components/ui/BadgeIcon';
import { LoadingRadar } from '../../src/components/ui/LoadingRadar';
import { IncidentCard } from '../../src/components/incident/IncidentCard';
import { useA11y, announce } from '../../src/hooks/useAccessibility';
import { useHaptics } from '../../src/hooks/useHaptics';
import { useResponsive } from '../../src/hooks/useResponsive';
import { useIncidentStore } from '../../src/stores/incidentStore';
import { useAuthStore } from '../../src/stores/authStore';
import { useFamilyStore } from '../../src/stores/familyStore';
import { useAccessibilityStore } from '../../src/stores/accessibilityStore';
import { Colors } from '../../src/theme/colors';
import { Spacing, Radius } from '../../src/theme/spacing';
import { getCategoryMeta } from '../../src/constants/categories';
import { timeAgo, formatDistance, MOCK_FEED } from '../../src/services/mockData';
import type { Incident, FeedItem } from '../../src/types';
import { seedDatabase } from '../../src/services/database';
import FamilyScreen from './family';
import ProfileScreen from './profile';
import ChainScreen from './chain';

const USER_LOCATION = { latitude: 41.2356, longitude: -8.6200 };

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)} min`;
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

function formatNavDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

async function fetchRoute(from: { lat: number; lng: number }, to: { lat: number; lng: number }): Promise<{ coordinates: [number, number][]; distance: number; duration: number } | null> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson&steps=true`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.code !== 'Ok' || !data.routes?.[0]) return null;
    const route = data.routes[0];
    return { coordinates: route.geometry.coordinates as [number, number][], distance: route.distance, duration: route.duration };
  } catch { return null; }
}

async function geocodePlace(query: string): Promise<{ lat: number; lng: number; name: string } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
    const res = await fetch(url, { headers: { 'User-Agent': 'AttentionApp/1.0' } });
    const data = await res.json();
    if (!data?.[0]) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), name: data[0].display_name.split(',')[0] };
  } catch { return null; }
}

async function fetchSpeedCameras(lat: number, lng: number, radius = 5000): Promise<SpeedCamera[]> {
  try {
    const query = `[out:json][timeout:10];(node["highway"="speed_camera"](around:${radius},${lat},${lng});node["enforcement"="maxspeed"](around:${radius},${lat},${lng}););out body;`;
    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
    const res = await fetch(url);
    const data = await res.json();
    return (data.elements || []).map((e: any) => ({
      id: `osm-cam-${e.id}`,
      lat: e.lat,
      lng: e.lon,
      speedLimit: e.tags?.maxspeed ? parseInt(e.tags.maxspeed) : null,
    }));
  } catch {
    return [];
  }
}

const FALLBACK_CAMERAS: SpeedCamera[] = [
  { id: 'cam-1', lat: 41.2380, lng: -8.6215, speedLimit: 50 },
  { id: 'cam-2', lat: 41.2330, lng: -8.6170, speedLimit: 60 },
  { id: 'cam-3', lat: 41.2400, lng: -8.6250, speedLimit: 40 },
  { id: 'cam-4', lat: 41.2310, lng: -8.6140, speedLimit: 50 },
  { id: 'cam-5', lat: 41.2365, lng: -8.6280, speedLimit: 70 },
  { id: 'cam-6', lat: 41.2420, lng: -8.6190, speedLimit: 50 },
  { id: 'cam-7', lat: 41.2290, lng: -8.6230, speedLimit: 50 },
];

const FEED_ICONS: Record<FeedItem['type'], { name: string; color: string }> = {
  new_incident: { name: 'alert-circle', color: Colors.warning },
  incident_verified: { name: 'check-decagram', color: Colors.primary },
  user_leveled_up: { name: 'arrow-up-bold-circle', color: Colors.secondary },
  user_became_guardian: { name: 'shield-star', color: Colors.primary },
};

const RADIUS_OPTIONS = [
  { label: '1km', value: 1000 },
  { label: '2km', value: 2000 },
  { label: '5km', value: 5000 },
  { label: '10km', value: 10000 },
  { label: '25km', value: 25000 },
];

function haversineDistance(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }): number {
  const R = 6371000;
  const dLat = (b.latitude - a.latitude) * Math.PI / 180;
  const dLon = (b.longitude - a.longitude) * Math.PI / 180;
  const lat1 = a.latitude * Math.PI / 180;
  const lat2 = b.latitude * Math.PI / 180;
  const x = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function MapFab({ icon, color, label, onPress, active, style }: {
  icon: string; color: string; label: string; onPress: () => void; active?: boolean; style?: any;
}) {
  const [hovered, setHovered] = useState(false);
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(glowAnim, {
      toValue: hovered ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [hovered]);

  return (
    <View style={[fabStyles.wrapper, style]}>
      {hovered && (
        <View style={[fabStyles.tooltip, { backgroundColor: 'rgba(20,20,35,0.95)', borderColor: color + '40' }]}>
          <NeonText variant="caption" color="#fff" style={{ fontSize: 10, fontWeight: '600' }}>{label}</NeonText>
        </View>
      )}
      <Pressable
        onPress={onPress}
        // @ts-ignore web-only
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={({ pressed }) => [fabStyles.btn, {
          backgroundColor: active ? color + '22' : pressed ? color + '30' : hovered ? color + '18' : 'rgba(26,26,37,0.9)',
          borderColor: active ? color + '70' : hovered ? color + '55' : 'rgba(255,255,255,0.08)',
          shadowColor: color,
          shadowOpacity: active ? 0.5 : hovered ? 0.35 : 0,
          shadowRadius: active ? 14 : hovered ? 10 : 0,
          shadowOffset: { width: 0, height: 0 },
          transform: [{ scale: pressed ? 0.88 : hovered ? 1.08 : 1 }],
        }]}
        accessible accessibilityLabel={label} accessibilityRole="button"
      >
        <MaterialCommunityIcons name={icon as any} size={20} color={active || hovered ? color : color + '99'} />
      </Pressable>
    </View>
  );
}

function TopBarIcon({ icon, label, active, onPress, color, badge }: {
  icon: string; label: string; active: boolean; onPress: () => void; color: string; badge?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const [tooltip, setTooltip] = useState(false);

  useEffect(() => {
    if (hovered) {
      const t = setTimeout(() => setTooltip(true), 350);
      return () => clearTimeout(t);
    }
    setTooltip(false);
  }, [hovered]);

  return (
    <View style={{ position: 'relative' as const, alignItems: 'center' as const }}>
      {tooltip && (
        <View style={{
          position: 'absolute' as const, bottom: -24, zIndex: 100,
          backgroundColor: 'rgba(20,20,35,0.95)', paddingHorizontal: 8, paddingVertical: 3,
          borderRadius: 6, borderWidth: 1, borderColor: color + '30',
          ...(Platform.OS === 'web' ? { whiteSpace: 'nowrap' } as any : {}),
        }}>
          <NeonText variant="caption" color="#fff" style={{ fontSize: 9, fontWeight: '600' }}>{label}</NeonText>
        </View>
      )}
      <Pressable
        onPress={onPress}
        // @ts-ignore web-only
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={({ pressed }) => ({
          width: 36, height: 36, borderRadius: 10,
          alignItems: 'center' as const, justifyContent: 'center' as const,
          backgroundColor: active ? color + '20' : hovered ? color + '12' : 'transparent',
          borderWidth: 1,
          borderColor: active ? color + '50' : hovered ? color + '30' : 'transparent',
          transform: [{ scale: pressed ? 0.85 : hovered ? 1.1 : 1 }],
          shadowColor: color,
          shadowOpacity: active ? 0.5 : hovered ? 0.3 : 0,
          shadowRadius: active ? 10 : hovered ? 8 : 0,
          shadowOffset: { width: 0, height: 0 } as any,
          ...(Platform.OS === 'web' ? { transition: 'all 0.2s cubic-bezier(0.25,0.8,0.25,1)', cursor: 'pointer' } as any : {}),
          position: 'relative' as const,
        })}
        accessible accessibilityLabel={label} accessibilityRole="button"
      >
        <MaterialCommunityIcons name={icon as any} size={20} color={active ? color : hovered ? color : '#8A8AAA'} />
        {badge && (
          <View style={{
            position: 'absolute', top: 4, right: 4, width: 7, height: 7,
            borderRadius: 4, backgroundColor: Colors.primary,
            shadowColor: Colors.primary, shadowOpacity: 0.8, shadowRadius: 3,
          }} />
        )}
      </Pressable>
    </View>
  );
}

const fabStyles = StyleSheet.create({
  wrapper: { alignItems: 'center' },
  tooltip: {
    position: 'absolute', top: -28,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 6, borderWidth: 1, zIndex: 100,
    ...(Platform.OS === 'web' ? { whiteSpace: 'nowrap', pointerEvents: 'none' } as any : {}),
  },
  btn: {
    width: 42, height: 42, borderRadius: 12, borderWidth: 1,
    justifyContent: 'center', alignItems: 'center',
    ...(Platform.OS === 'web' ? { transition: 'all 0.22s cubic-bezier(0.25,0.8,0.25,1)', cursor: 'pointer' } as any : {}),
  },
});

export default function MapScreen() {
  const { colors, typography, minTarget } = useA11y();
  const haptics = useHaptics();
  const { showSidebar, sidebarWidth, isWeb, isDesktop } = useResponsive();
  const { incidents, selectedIncident, isLoading, loadIncidents, selectIncident } = useIncidentStore();
  const user = useAuthStore((s) => s.user);
  const familyMembers = useFamilyStore((s) => s.members);
  const loadFamily = useFamilyStore((s) => s.loadFamily);
  const lightTheme = useAccessibilityStore((s) => s.lightTheme);
  const [mapReady, setMapReady] = useState(false);

  const [sidebarMode, setSidebarMode] = useState<'nearby' | 'feed'>('nearby');
  const [navRoute, setNavRoute] = useState<NavigationRoute | null>(null);
  const [navInput, setNavInput] = useState('');
  const [navLoading, setNavLoading] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [voiceListening, setVoiceListening] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [scanRadius, setScanRadius] = useState(5000);
  const [scanning, setScanning] = useState(false);
  const [scanDone, setScanDone] = useState(false);
  const [foundIncidents, setFoundIncidents] = useState<(Incident & { distance: number })[]>([]);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const [activeOverlay, setActiveOverlay] = useState<'family' | 'profile' | 'chain' | null>(null);
  const [driveMode, setDriveMode] = useState(false);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [speedLimit, setSpeedLimit] = useState<number | null>(60);
  const [speedCameras, setSpeedCameras] = useState<SpeedCamera[]>([]);
  const [radarAlert, setRadarAlert] = useState<string | null>(null);
  const speedAnimRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    seedDatabase().then(() => {
      loadIncidents().then(() => announce(`Map loaded with ${incidents.length} incidents nearby`));
      loadFamily();
    });
  }, []);

  useEffect(() => {
    if (scanning) {
      Animated.loop(Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.12, duration: 500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])).start();
    } else { pulseAnim.stopAnimation(); pulseAnim.setValue(1); }
  }, [scanning]);

  // Drive mode: simulate speed and fetch cameras
  useEffect(() => {
    if (driveMode) {
      fetchSpeedCameras(USER_LOCATION.latitude, USER_LOCATION.longitude).then((cams) => {
        setSpeedCameras(cams.length > 0 ? cams : FALLBACK_CAMERAS);
      });

      let speed = 0;
      let direction = 1;
      speedAnimRef.current = setInterval(() => {
        speed += direction * (Math.random() * 8 + 1);
        if (speed > 75) direction = -1;
        if (speed < 5) direction = 1;
        speed = Math.max(0, Math.min(90, speed));
        setCurrentSpeed(Math.round(speed));

        const nearest = (speedCameras.length > 0 ? speedCameras : FALLBACK_CAMERAS)
          .map((c) => ({
            ...c,
            dist: haversineDistance(USER_LOCATION, { latitude: c.lat, longitude: c.lng }),
          }))
          .sort((a, b) => a.dist - b.dist)[0];

        if (nearest && nearest.dist < 800) {
          setRadarAlert(`Speed camera in ${Math.round(nearest.dist)}m${nearest.speedLimit ? ` — Limit ${nearest.speedLimit} km/h` : ''}`);
          if (nearest.speedLimit) setSpeedLimit(nearest.speedLimit);
        } else {
          setRadarAlert(null);
          setSpeedLimit(60);
        }
      }, 1200);

      announce('Drive Mode activated');
      return () => { if (speedAnimRef.current) clearInterval(speedAnimRef.current); };
    } else {
      if (speedAnimRef.current) clearInterval(speedAnimRef.current);
      setCurrentSpeed(0);
      setSpeedCameras([]);
      setRadarAlert(null);
      setSpeedLimit(60);
    }
  }, [driveMode]);

  const guardScan: GuardScanConfig | null = (scanning || scanDone)
    ? { active: true, scanning, radiusMeters: scanRadius, center: USER_LOCATION }
    : null;

  const mapMarkers: MapMarker[] = incidents.map((inc) => ({
    id: inc.id, coordinate: inc.location, incident: inc,
  }));

  const handleMarkerPress = useCallback((marker: MapMarker) => {
    haptics.light();
    selectIncident(marker.incident);
    announce(`Selected: ${getCategoryMeta(marker.incident.category).label}, ${marker.incident.title}`);
  }, []);

  const handleMapPress = useCallback(() => {
    if (selectedIncident) selectIncident(null);
  }, [selectedIncident]);

  const handleReportPress = () => { haptics.medium(); router.push('/incident/report'); };

  const startNavigation = useCallback(async (query: string) => {
    if (!query.trim()) return;
    setNavLoading(true);
    announce(`Searching for ${query}`);
    const dest = await geocodePlace(query);
    if (!dest) { announce('Place not found'); setNavLoading(false); return; }
    const route = await fetchRoute({ lat: USER_LOCATION.latitude, lng: USER_LOCATION.longitude }, { lat: dest.lat, lng: dest.lng });
    if (!route) { announce('Could not calculate route'); setNavLoading(false); return; }
    const routeIncidents = incidents.filter((inc) => {
      for (const coord of route.coordinates) {
        const dlat = inc.location.latitude - coord[1];
        const dlng = inc.location.longitude - coord[0];
        if (Math.sqrt(dlat * dlat + dlng * dlng) < 0.003) return true;
      }
      return false;
    }).map((inc) => ({ id: inc.id, coordinate: inc.location, incident: inc }));
    setNavRoute({ coordinates: route.coordinates, distance: route.distance, duration: route.duration, destinationName: dest.name, incidents: routeIncidents });
    setNavLoading(false);
    setNavOpen(false);
    const voiceMsg = `Navigating to ${dest.name}. ${formatNavDistance(route.distance)}, about ${formatDuration(route.duration)}.${routeIncidents.length > 0 ? ` Warning: ${routeIncidents.length} incidents on your route.` : ' Route is clear.'}`;
    announce(voiceMsg);
    if (Platform.OS === 'web' && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(voiceMsg);
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  }, [incidents]);

  const stopNavigation = useCallback(() => { setNavRoute(null); setNavInput(''); announce('Navigation stopped'); }, []);

  const startVoiceInput = useCallback(() => {
    if (Platform.OS !== 'web' || !('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      announce('Voice input not supported');
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onstart = () => { setVoiceListening(true); announce('Listening...'); };
    recognition.onresult = (event: any) => { const t = event.results[0][0].transcript; setNavInput(t); setVoiceListening(false); startNavigation(t); };
    recognition.onerror = () => { setVoiceListening(false); announce('Voice not recognized'); };
    recognition.onend = () => { setVoiceListening(false); };
    recognition.start();
  }, [startNavigation]);

  const startScan = useCallback(async () => {
    haptics.medium();
    setScanning(true);
    setScanDone(false);
    setFoundIncidents([]);
    announce(`Scanning ${formatDistance(scanRadius)}`);
    await loadIncidents();
    const fresh = useIncidentStore.getState().incidents;
    setTimeout(() => {
      const found = fresh
        .map((inc) => ({ ...inc, distance: haversineDistance(USER_LOCATION, inc.location) }))
        .filter((inc) => inc.distance <= scanRadius)
        .sort((a, b) => a.distance - b.distance);
      setFoundIncidents(found);
      setScanning(false);
      setScanDone(true);
      haptics.success();
      announce(`Found ${found.length} incidents within ${formatDistance(scanRadius)}`);
    }, 2000);
  }, [scanRadius]);

  const toggleDriveMode = useCallback(() => {
    haptics.medium();
    setDriveMode((prev) => !prev);
    setActiveOverlay(null);
  }, []);

  const openOverlay = useCallback((panel: 'family' | 'profile' | 'chain') => {
    haptics.light();
    setActiveOverlay((prev) => prev === panel ? null : panel);
    setDriveMode(false);
  }, []);

  if (isLoading && incidents.length === 0) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <LoadingRadar size={140} message="Loading map..." />
      </View>
    );
  }

  const incidentDetail = selectedIncident ? (
    <View style={[showSidebar ? styles.detailPanelDesktop : styles.detailPanelMobile, { backgroundColor: showSidebar ? 'transparent' : colors.surface }]}>
      {!showSidebar && <View style={[styles.sheetHandle, { backgroundColor: colors.textTertiary }]} />}
      {!showSidebar && (
        <Pressable onPress={() => selectIncident(null)} style={styles.closeBtn} accessible accessibilityLabel="Close" accessibilityRole="button">
          <MaterialCommunityIcons name="close" size={22} color={colors.textSecondary} />
        </Pressable>
      )}
      <View style={styles.detailHeader}>
        <View style={[styles.detailCatIcon, { backgroundColor: Colors.category[selectedIncident.category] + '20' }]}>
          <MaterialCommunityIcons name={getCategoryMeta(selectedIncident.category).icon as any} size={24} color={Colors.category[selectedIncident.category]} />
        </View>
        <View style={styles.detailHeaderText}>
          <NeonText variant="label" color={Colors.category[selectedIncident.category]}>{getCategoryMeta(selectedIncident.category).label}</NeonText>
          <NeonText variant="caption" color={colors.textTertiary}>{timeAgo(selectedIncident.createdAt)}{selectedIncident.address ? ` • ${selectedIncident.address}` : ''}</NeonText>
        </View>
        {selectedIncident.isVerified && <MaterialCommunityIcons name="check-decagram" size={22} color={colors.primary} />}
      </View>
      <View style={styles.detailTitleRow}>
        <NeonText variant="h4" style={styles.detailTitle}>{selectedIncident.title}</NeonText>
        {selectedIncident.isVerified && (
          <View style={styles.verifiedInline}>
            <MaterialCommunityIcons name="shield-check" size={10} color={Colors.primary} />
            <NeonText variant="caption" color={Colors.primary} style={{ fontWeight: '700', fontSize: 9, marginLeft: 2 }}>Verified</NeonText>
          </View>
        )}
      </View>
      <NeonText variant="bodySm" color={colors.textSecondary} numberOfLines={4}>{selectedIncident.description}</NeonText>
      <View style={styles.detailStats}>
        <View style={styles.detailStat}><MaterialCommunityIcons name="check-circle" size={16} color={Colors.success} /><NeonText variant="bodySm" color={Colors.success}>{selectedIncident.confirmCount}</NeonText></View>
        <View style={styles.detailStat}><MaterialCommunityIcons name="close-circle" size={16} color={Colors.error} /><NeonText variant="bodySm" color={Colors.error}>{selectedIncident.denyCount}</NeonText></View>
        <View style={styles.detailStat}><MaterialCommunityIcons name="fire" size={16} color={Colors.warning} /><NeonText variant="bodySm" color={Colors.warning}>{selectedIncident.reactions.useful}</NeonText></View>
      </View>
      <View style={styles.detailActions}>
        <Pressable onPress={() => { haptics.success(); useIncidentStore.getState().confirmIncident(selectedIncident.id); announce('Confirmed'); }}
          style={({ pressed }) => [styles.actionBtn, { backgroundColor: pressed ? Colors.success + '25' : Colors.success + '12', borderColor: Colors.success + '35', transform: [{ scale: pressed ? 0.95 : 1 }] }]}
          accessible accessibilityLabel="Confirm" accessibilityRole="button">
          <MaterialCommunityIcons name="check" size={18} color={Colors.success} /><NeonText variant="buttonSm" color={Colors.success}>Confirm</NeonText>
        </Pressable>
        <Pressable onPress={() => { haptics.warning(); useIncidentStore.getState().denyIncident(selectedIncident.id); announce('Denied'); }}
          style={({ pressed }) => [styles.actionBtn, { backgroundColor: pressed ? Colors.error + '25' : Colors.error + '12', borderColor: Colors.error + '35', transform: [{ scale: pressed ? 0.95 : 1 }] }]}
          accessible accessibilityLabel="Deny" accessibilityRole="button">
          <MaterialCommunityIcons name="close" size={18} color={Colors.error} /><NeonText variant="buttonSm" color={Colors.error}>Deny</NeonText>
        </Pressable>
      </View>
      {user?.isGuardian && !selectedIncident.isVerified && (
        <Pressable onPress={() => { haptics.heavy(); useIncidentStore.getState().verifyIncident(selectedIncident.id, user.uid, user.displayName); announce('Verified!'); }}
          style={({ pressed }) => [styles.actionBtn, { backgroundColor: pressed ? Colors.primary + '25' : Colors.primary + '12', borderColor: Colors.primary + '40', marginBottom: Spacing.md, transform: [{ scale: pressed ? 0.96 : 1 }] }]}
          accessible accessibilityLabel="Verify as Guardian" accessibilityRole="button">
          <MaterialCommunityIcons name="shield-check" size={18} color={Colors.primary} /><NeonText variant="buttonSm" color={Colors.primary}>Verify as Guardian</NeonText>
        </Pressable>
      )}
      {selectedIncident.isVerified && selectedIncident.verifiedByName && (
        <NeonText variant="caption" color={colors.textTertiary} style={{ marginBottom: Spacing.xs }}>
          Verified by {selectedIncident.verifiedByName}
        </NeonText>
      )}
      <View style={styles.detailReporter}>
        <BadgeIcon level={selectedIncident.reporterLevel} size="sm" />
        <NeonText variant="bodySm" color={colors.textSecondary} style={{ marginLeft: Spacing.sm }}>by {selectedIncident.reporterName}</NeonText>
      </View>
    </View>
  ) : null;

  const navPanel = (navOpen || navRoute) ? (
    <View style={[styles.navPanel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {!navRoute && (
        <>
          <View style={styles.navSearchRow}>
            <View style={[styles.navSearchInput, { borderColor: colors.border, backgroundColor: colors.glass.background }]}>
              <MaterialCommunityIcons name="map-search" size={16} color={colors.primary} />
              <TextInput
                value={navInput}
                onChangeText={setNavInput}
                placeholder="Where to?"
                placeholderTextColor={colors.textTertiary}
                style={[styles.navTextInput, { color: colors.textPrimary }]}
                onSubmitEditing={() => startNavigation(navInput)}
                returnKeyType="go"
                autoFocus
              />
              {navInput.length > 0 && (
                <Pressable onPress={() => setNavInput('')} style={{ padding: 2 }}>
                  <MaterialCommunityIcons name="close-circle" size={14} color={colors.textTertiary} />
                </Pressable>
              )}
            </View>
            <Pressable onPress={startVoiceInput}
              style={({ pressed }) => [styles.navVoiceBtn, {
                backgroundColor: voiceListening ? Colors.error + '20' : pressed ? colors.primary + '20' : 'transparent',
                borderColor: voiceListening ? Colors.error : colors.border,
              }]}>
              <MaterialCommunityIcons name={voiceListening ? 'microphone' : 'microphone-outline'} size={18}
                color={voiceListening ? Colors.error : colors.primary} />
            </Pressable>
          </View>
          {navLoading && (
            <View style={styles.navLoading}>
              <MaterialCommunityIcons name="loading" size={16} color={colors.primary} />
              <NeonText variant="caption" color={colors.primary} style={{ marginLeft: 6 }}>Finding route...</NeonText>
            </View>
          )}
          <Pressable onPress={() => startNavigation(navInput)} disabled={!navInput.trim() || navLoading}
            style={({ pressed }) => [styles.navGoBtn, { backgroundColor: !navInput.trim() ? colors.border : pressed ? colors.primaryDim : colors.primary, opacity: !navInput.trim() ? 0.4 : 1 }]}>
            <MaterialCommunityIcons name="navigation" size={16} color={colors.background} />
            <NeonText variant="caption" color={colors.background} style={{ fontWeight: '700', marginLeft: 4 }}>Navigate</NeonText>
          </Pressable>
        </>
      )}

      {navRoute && (
        <View style={styles.navActivePanel}>
          <View style={styles.navActiveHeader}>
            <View style={{ flex: 1 }}>
              <NeonText variant="caption" color={colors.textTertiary} style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: 1 }}>Navigating to</NeonText>
              <NeonText variant="label" color={colors.textPrimary} numberOfLines={1}>{navRoute.destinationName}</NeonText>
            </View>
            <Pressable onPress={stopNavigation} style={({ pressed }) => [styles.navStopBtn, { backgroundColor: pressed ? Colors.error + '30' : Colors.error + '15', borderColor: Colors.error + '40' }]}>
              <MaterialCommunityIcons name="close" size={14} color={Colors.error} />
              <NeonText variant="caption" color={Colors.error} style={{ fontWeight: '700', fontSize: 9, marginLeft: 2 }}>Stop</NeonText>
            </Pressable>
          </View>
          <View style={styles.navStats}>
            <View style={styles.navStatItem}>
              <MaterialCommunityIcons name="clock-outline" size={20} color="#00AAFF" />
              <NeonText variant="h4" color="#00AAFF" style={{ marginTop: 2 }}>{formatDuration(navRoute.duration)}</NeonText>
              <NeonText variant="caption" color={colors.textTertiary} style={{ fontSize: 9 }}>ETA</NeonText>
            </View>
            <View style={[styles.navStatDivider, { backgroundColor: colors.border }]} />
            <View style={styles.navStatItem}>
              <MaterialCommunityIcons name="map-marker-distance" size={20} color={Colors.primary} />
              <NeonText variant="h4" color={Colors.primary} style={{ marginTop: 2 }}>{formatNavDistance(navRoute.distance)}</NeonText>
              <NeonText variant="caption" color={colors.textTertiary} style={{ fontSize: 9 }}>Distance</NeonText>
            </View>
            <View style={[styles.navStatDivider, { backgroundColor: colors.border }]} />
            <View style={styles.navStatItem}>
              <MaterialCommunityIcons name="alert-circle-outline" size={20}
                color={navRoute.incidents.length > 0 ? Colors.warning : Colors.success} />
              <NeonText variant="h4" color={navRoute.incidents.length > 0 ? Colors.warning : Colors.success} style={{ marginTop: 2 }}>
                {navRoute.incidents.length}
              </NeonText>
              <NeonText variant="caption" color={colors.textTertiary} style={{ fontSize: 9 }}>Incidents</NeonText>
            </View>
          </View>
          {navRoute.incidents.length > 0 && (
            <View style={styles.navIncidents}>
              <NeonText variant="caption" color={Colors.warning} style={{ fontWeight: '700', marginBottom: 4 }}>⚠ Incidents on route:</NeonText>
              {navRoute.incidents.slice(0, 3).map((inc) => (
                <View key={inc.id} style={styles.navIncidentRow}>
                  <NeonText variant="caption" color={Colors.category[inc.incident.category]} style={{ fontSize: 10 }}>{getCategoryMeta(inc.incident.category).label}</NeonText>
                  <NeonText variant="caption" color={colors.textTertiary} style={{ fontSize: 10 }} numberOfLines={1}>{inc.incident.title}</NeonText>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  ) : null;

  const guardScanPanel = scanOpen ? (
    <View style={[styles.scanPanel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.scanPanelHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <MaterialCommunityIcons name="radar" size={18} color={colors.primary} />
          <NeonText variant="label" color={colors.primary} style={{ marginLeft: 6 }}>GuardScan</NeonText>
        </View>
        <Pressable onPress={() => { setScanOpen(false); setScanDone(false); }} style={({ pressed }) => [{ opacity: pressed ? 0.5 : 1, padding: 4 }]}>
          <MaterialCommunityIcons name="close" size={16} color={colors.textTertiary} />
        </Pressable>
      </View>
      <View style={styles.scanRadiusRow}>
        {RADIUS_OPTIONS.map((opt) => (
          <Pressable key={opt.value} onPress={() => { haptics.selection(); setScanRadius(opt.value); setScanDone(false); }}
            style={({ pressed }) => [styles.scanRadiusChip, {
              backgroundColor: scanRadius === opt.value ? colors.primary + '20' : 'transparent',
              borderColor: scanRadius === opt.value ? colors.primary : colors.border,
              transform: [{ scale: pressed ? 0.9 : 1 }],
            }]}>
            <NeonText variant="caption" color={scanRadius === opt.value ? colors.primary : colors.textSecondary} style={{ fontSize: 10 }}>{opt.label}</NeonText>
          </Pressable>
        ))}
      </View>
      <Pressable onPress={startScan} disabled={scanning}
        style={({ pressed }) => [styles.scanBtn, { backgroundColor: scanning ? colors.primary + '20' : pressed ? colors.primaryDim : colors.primary }]}>
        <Animated.View style={{ transform: [{ scale: scanning ? pulseAnim : 1 }], flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <MaterialCommunityIcons name="radar" size={16} color={scanning ? colors.primary : colors.background} />
          <NeonText variant="caption" color={scanning ? colors.primary : colors.background} style={{ fontWeight: '700' }}>{scanning ? 'Scanning...' : 'Scan Area'}</NeonText>
        </Animated.View>
      </Pressable>
      {scanDone && (
        <View style={styles.scanResults}>
          <NeonText variant="caption" color={colors.primary} style={{ fontWeight: '700' }}>{foundIncidents.length} found within {formatDistance(scanRadius)}</NeonText>
          {foundIncidents.slice(0, 3).map((inc) => (
            <View key={inc.id} style={styles.scanResultRow}>
              <NeonText variant="caption" color={Colors.category[inc.category]} style={{ fontSize: 12 }}>{getCategoryMeta(inc.category).label}</NeonText>
              <NeonText variant="caption" color={colors.textTertiary} style={{ fontSize: 10 }}>{formatDistance(inc.distance)}</NeonText>
            </View>
          ))}
          {foundIncidents.length === 0 && <NeonText variant="caption" color={Colors.success}>Area is clear!</NeonText>}
        </View>
      )}
    </View>
  ) : null;

  const feedSection = (
    <View style={styles.feedSection}>
      {MOCK_FEED.slice(0, 6).map((item) => {
        const meta = FEED_ICONS[item.type];
        return (
          <View key={item.id} style={[styles.feedItem, { borderBottomColor: colors.border }]}>
            <View style={[styles.feedDot, { backgroundColor: meta.color }]} />
            <View style={styles.feedBody}>
              <NeonText variant="caption" numberOfLines={2} style={{ lineHeight: 16 }}>{item.summary}</NeonText>
              <NeonText variant="caption" color={colors.textTertiary} style={{ fontSize: 10, marginTop: 2 }}>{timeAgo(item.createdAt)}</NeonText>
            </View>
          </View>
        );
      })}
    </View>
  );

  // Drive Mode HUD overlay
  const driveHUD = driveMode ? (
    <View style={[styles.driveHudContainer, { pointerEvents: 'box-none' }]}>
      {/* Speed display */}
      <View style={[styles.driveSpeedBox, {
        backgroundColor: lightTheme ? 'rgba(255,255,255,0.88)' : 'rgba(13,17,23,0.88)',
        borderColor: currentSpeed > (speedLimit || 999) ? '#FF4444' : Colors.primary + '40',
        ...(Platform.OS === 'web' ? { backdropFilter: 'blur(16px)' } as any : {}),
      }]}>
        <NeonText variant="caption" color={currentSpeed > (speedLimit || 999) ? '#FF6666' : '#8A8AAA'} style={{ fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' as const }}>Speed</NeonText>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
          <NeonText variant="h3" color={currentSpeed > (speedLimit || 999) ? '#FF4444' : '#fff'} style={{ fontSize: 42, fontWeight: '900', lineHeight: 46 }}>
            {currentSpeed}
          </NeonText>
          <NeonText variant="caption" color="#8A8AAA" style={{ fontSize: 14, marginBottom: 6, marginLeft: 4 }}>km/h</NeonText>
        </View>
      </View>

      {/* Speed limit sign */}
      {speedLimit && (
        <View style={[styles.driveSpeedLimit, {
          borderColor: currentSpeed > speedLimit ? '#FF4444' : '#FF6633',
          backgroundColor: lightTheme ? 'rgba(255,255,255,0.92)' : 'rgba(20,20,30,0.92)',
        }]}>
          <NeonText variant="h4" color={currentSpeed > speedLimit ? '#FF4444' : '#fff'} style={{ fontSize: 24, fontWeight: '900' }}>
            {speedLimit}
          </NeonText>
        </View>
      )}

      {/* Radar alert banner */}
      {radarAlert && (
        <View style={[styles.driveRadarAlert, {
          backgroundColor: 'rgba(255,60,60,0.12)',
          borderColor: '#FF3C3C40',
          ...(Platform.OS === 'web' ? { backdropFilter: 'blur(12px)' } as any : {}),
        }]}>
          <MaterialCommunityIcons name="camera" size={18} color="#FF4444" />
          <NeonText variant="bodySm" color="#FF6666" style={{ fontWeight: '700', marginLeft: 8, flex: 1 }}>{radarAlert}</NeonText>
          <MaterialCommunityIcons name="alert" size={16} color="#FF4444" />
        </View>
      )}

      {/* Drive mode indicator */}
      <View style={[styles.driveModeLabel, {
        backgroundColor: lightTheme ? 'rgba(255,255,255,0.85)' : 'rgba(13,17,23,0.85)',
        ...(Platform.OS === 'web' ? { backdropFilter: 'blur(12px)' } as any : {}),
      }]}>
        <MaterialCommunityIcons name="steering" size={14} color="#00AAFF" />
        <NeonText variant="caption" color="#00AAFF" style={{ fontWeight: '700', marginLeft: 4, fontSize: 10 }}>DRIVE MODE</NeonText>
        <Pressable onPress={toggleDriveMode} style={{ marginLeft: 8, padding: 2 }}>
          <MaterialCommunityIcons name="close-circle" size={14} color="#FF6666" />
        </Pressable>
      </View>
    </View>
  ) : null;

  // Overlay panel for Family / Profile
  const overlayPanel = activeOverlay ? (
    <View style={styles.overlayContainer}>
      <Pressable style={styles.overlayBackdrop} onPress={() => setActiveOverlay(null)} />
      <View style={[styles.overlaySheet, {
        backgroundColor: lightTheme ? 'rgba(245,247,250,0.93)' : 'rgba(13,17,23,0.93)',
        borderColor: lightTheme ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)',
        ...(Platform.OS === 'web' ? { backdropFilter: 'blur(24px)' } as any : {}),
      }]}>
        <View style={styles.overlayHeader}>
          <NeonText variant="h4" color={colors.textPrimary}>
            {activeOverlay === 'family' ? 'Family' : activeOverlay === 'chain' ? 'Chain' : 'Profile'}
          </NeonText>
          <Pressable onPress={() => setActiveOverlay(null)}
            style={({ pressed }) => [styles.overlayCloseBtn, { transform: [{ scale: pressed ? 0.9 : 1 }] }]}>
            <MaterialCommunityIcons name="close" size={20} color={colors.textSecondary} />
          </Pressable>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
          {activeOverlay === 'family' ? <FamilyScreen /> : activeOverlay === 'chain' ? <ChainScreen /> : <ProfileScreen />}
        </ScrollView>
      </View>
    </View>
  ) : null;

  // ── DESKTOP LAYOUT ──
  if (showSidebar) {
    return (
      <View style={[styles.desktopContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.sidebar, { width: sidebarWidth, backgroundColor: colors.background, borderRightColor: colors.border }]}>
          <View style={styles.sidebarHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={[styles.appNameBox, {
                backgroundColor: lightTheme ? 'rgba(255,255,255,0.5)' : 'rgba(0,170,255,0.06)',
                borderColor: lightTheme ? 'rgba(0,0,0,0.06)' : 'rgba(0,170,255,0.12)',
                shadowColor: Colors.primary,
              }]}>
                <NeonText variant="h3" glow={colors.primaryGlow} style={{ fontFamily: Platform.OS === 'web' ? '"Orbitron", sans-serif' : undefined, letterSpacing: 3, fontWeight: '900' }}>ATTENTI◎N</NeonText>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <TopBarIcon icon="link-variant" label="Chain" active={activeOverlay === 'chain'} color="#FF9800" onPress={() => openOverlay('chain')} />
                <TopBarIcon icon="account-group" label="Family" active={activeOverlay === 'family'} color={Colors.secondary} onPress={() => openOverlay('family')} />
                <TopBarIcon icon="account-circle" label="Profile" active={activeOverlay === 'profile'} color={Colors.primary} onPress={() => openOverlay('profile')} badge={user?.isGuardian} />
                <TopBarIcon icon="steering" label="Drive Mode" active={driveMode} color="#00AAFF" onPress={toggleDriveMode} />
              </View>
            </View>
            <NeonText variant="caption" color={colors.textSecondary} style={{ marginTop: 2 }}>{incidents.length} active incidents nearby</NeonText>
          </View>

          {incidentDetail && (
            <GlassCard style={styles.sidebarDetail} glowColor={Colors.category[selectedIncident!.category] + '25'}>
              <View style={styles.sidebarDetailClose}>
                <Pressable onPress={() => selectIncident(null)} accessible accessibilityLabel="Deselect" accessibilityRole="button">
                  <MaterialCommunityIcons name="close" size={18} color={colors.textTertiary} />
                </Pressable>
              </View>
              {incidentDetail}
            </GlassCard>
          )}

          <View style={styles.sidebarTabs}>
            <Pressable onPress={() => setSidebarMode('nearby')}
              style={[styles.sidebarTab, sidebarMode === 'nearby' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}>
              <MaterialCommunityIcons name="map-marker-multiple" size={14} color={sidebarMode === 'nearby' ? colors.primary : colors.textTertiary} />
              <NeonText variant="caption" color={sidebarMode === 'nearby' ? colors.primary : colors.textTertiary} style={{ marginLeft: 4, fontWeight: '700' }}>Nearby</NeonText>
            </Pressable>
            <Pressable onPress={() => setSidebarMode('feed')}
              style={[styles.sidebarTab, sidebarMode === 'feed' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}>
              <MaterialCommunityIcons name="newspaper-variant-outline" size={14} color={sidebarMode === 'feed' ? colors.primary : colors.textTertiary} />
              <NeonText variant="caption" color={sidebarMode === 'feed' ? colors.primary : colors.textTertiary} style={{ marginLeft: 4, fontWeight: '700' }}>Feed</NeonText>
            </Pressable>
          </View>

          {sidebarMode === 'nearby' ? (
            <FlatList data={incidents} keyExtractor={(i) => i.id}
              renderItem={({ item }) => <IncidentCard incident={item} compact onPress={() => { haptics.light(); selectIncident(item); }} />}
              contentContainerStyle={styles.sidebarList} showsVerticalScrollIndicator={false} />
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: Spacing.lg, paddingBottom: Spacing['4xl'] }}>
              {feedSection}
            </ScrollView>
          )}
        </View>

        <View style={styles.mapArea}>
          <AttentionMap markers={mapMarkers} userLocation={USER_LOCATION} familyMembers={familyMembers}
            onMarkerPress={handleMarkerPress} onMapPress={handleMapPress}
            onMapReady={() => setMapReady(true)} selectedMarkerId={selectedIncident?.id}
            lightTheme={lightTheme} guardScan={guardScan} navigation={navRoute}
            driveMode={driveMode} speedCameras={speedCameras} />

          <View style={[styles.desktopControls, {
            backgroundColor: lightTheme ? 'rgba(255,255,255,0.7)' : 'rgba(13,17,23,0.65)',
            ...(Platform.OS === 'web' ? { backdropFilter: 'blur(16px)' } as any : {}),
          }]}>
            <MapFab icon="plus" color={Colors.warning} label="Report" onPress={handleReportPress} />
            <MapFab icon="navigation-variant" color="#00AAFF" label="Navigate" active={navOpen} onPress={() => { haptics.medium(); setNavOpen(!navOpen); setScanOpen(false); }} />
            <MapFab icon="radar" color={colors.primary} label="GuardScan" active={scanOpen} onPress={() => { haptics.medium(); setScanOpen(!scanOpen); setNavOpen(false); }} />
          </View>

          {navPanel && <View style={styles.navPanelPos}>{navPanel}</View>}
          {guardScanPanel && <View style={styles.scanPanelPos}>{guardScanPanel}</View>}

          {scanning && (
            <View style={styles.scanLabel}>
              <GlassCard style={styles.scanLabelCard}>
                <MaterialCommunityIcons name="radar" size={14} color={colors.primary} />
                <NeonText variant="caption" color={colors.primary} style={{ marginLeft: 4 }}>Scanning {formatDistance(scanRadius)}...</NeonText>
              </GlassCard>
            </View>
          )}

          {driveHUD}
          {overlayPanel}
        </View>
      </View>
    );
  }

  // ── MOBILE LAYOUT ──
  return (
    <View style={[styles.mobileContainer, { backgroundColor: colors.background }]}>
      <AttentionMap markers={mapMarkers} userLocation={USER_LOCATION} familyMembers={familyMembers}
        onMarkerPress={handleMarkerPress} onMapPress={handleMapPress}
        onMapReady={() => setMapReady(true)} selectedMarkerId={selectedIncident?.id}
        lightTheme={lightTheme} guardScan={guardScan} navigation={navRoute}
        driveMode={driveMode} speedCameras={speedCameras} />

      <View style={[styles.mobileTopBar, {
        backgroundColor: lightTheme ? 'rgba(255,255,255,0.7)' : 'rgba(13,17,23,0.65)',
        ...(Platform.OS === 'web' ? { backdropFilter: 'blur(16px)' } as any : {}),
      }]}>
        <View style={[styles.appNameBoxMobile, {
          backgroundColor: lightTheme ? 'rgba(255,255,255,0.5)' : 'rgba(0,170,255,0.06)',
          borderColor: lightTheme ? 'rgba(0,0,0,0.06)' : 'rgba(0,170,255,0.12)',
          shadowColor: Colors.primary,
        }]}>
          <NeonText variant="h4" glow={colors.primaryGlow} style={{ fontFamily: Platform.OS === 'web' ? '"Orbitron", sans-serif' : undefined, letterSpacing: 3, fontWeight: '900' }}>ATTENTI◎N</NeonText>
        </View>
        <View style={{ flexDirection: 'row', gap: 4 }}>
          <TopBarIcon icon="link-variant" label="Chain" active={activeOverlay === 'chain'} color="#FF9800" onPress={() => openOverlay('chain')} />
          <TopBarIcon icon="account-group" label="Family" active={activeOverlay === 'family'} color={Colors.secondary} onPress={() => openOverlay('family')} />
          <TopBarIcon icon="account-circle" label="Profile" active={activeOverlay === 'profile'} color={Colors.primary} onPress={() => openOverlay('profile')} badge={user?.isGuardian} />
          <TopBarIcon icon="steering" label="Drive Mode" active={driveMode} color="#00AAFF" onPress={toggleDriveMode} />
        </View>
      </View>

      <View style={[styles.mobileBottomFabs, {
        backgroundColor: lightTheme ? 'rgba(255,255,255,0.7)' : 'rgba(13,17,23,0.65)',
        ...(Platform.OS === 'web' ? { backdropFilter: 'blur(16px)' } as any : {}),
      }]}>
        <MapFab icon="plus" color={Colors.warning} label="Report" onPress={handleReportPress} />
        <MapFab icon="navigation-variant" color="#00AAFF" label="Navigate" active={navOpen} onPress={() => { haptics.medium(); setNavOpen(!navOpen); setScanOpen(false); }} />
        <MapFab icon="radar" color={colors.primary} label="GuardScan" active={scanOpen} onPress={() => { haptics.medium(); setScanOpen(!scanOpen); setNavOpen(false); }} />
      </View>

      {navPanel && <View style={styles.navPanelPosMobile}>{navPanel}</View>}
      {guardScanPanel && <View style={styles.scanPanelPosMobile}>{guardScanPanel}</View>}

      {selectedIncident && (
        <View style={[styles.mobileSheet, { backgroundColor: colors.surface }]}>
          <View style={[styles.sheetHandle, { backgroundColor: colors.textTertiary }]} />
          <Pressable onPress={() => selectIncident(null)} style={styles.closeBtn} accessible accessibilityLabel="Close" accessibilityRole="button">
            <MaterialCommunityIcons name="close" size={22} color={colors.textSecondary} />
          </Pressable>
          <ScrollView showsVerticalScrollIndicator={false} style={styles.mobileSheetScroll}>{incidentDetail}</ScrollView>
        </View>
      )}

      {driveHUD}
      {overlayPanel}
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  desktopContainer: { flex: 1, flexDirection: 'row' },
  sidebar: { borderRightWidth: 1, flexShrink: 0 },
  sidebarHeader: { paddingTop: Platform.OS === 'web' ? 20 : 60, paddingHorizontal: Spacing.xl, paddingBottom: Spacing.sm },
  sidebarDetail: { marginHorizontal: Spacing.lg, marginBottom: Spacing.md, padding: Spacing.lg },
  sidebarDetailClose: { alignItems: 'flex-end', marginBottom: Spacing.xs },
  sidebarTabs: {
    flexDirection: 'row', borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    marginHorizontal: Spacing.lg, marginBottom: Spacing.sm,
  },
  sidebarTab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: Spacing.sm, borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  sidebarList: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing['4xl'], gap: Spacing.sm },
  mapArea: { flex: 1, position: 'relative' },

  desktopControls: {
    position: 'absolute', top: 16, right: 16,
    flexDirection: 'row', gap: Spacing.sm, zIndex: 10,
    paddingHorizontal: 8, paddingVertical: 8,
    borderRadius: 16, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 }, elevation: 12,
  },
  appNameBox: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 12, borderWidth: 1,
    shadowOpacity: 0.2, shadowRadius: 12,
    shadowOffset: { width: 0, height: 2 }, elevation: 4,
  },
  appNameBoxMobile: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 10, borderWidth: 1,
    shadowOpacity: 0.2, shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 }, elevation: 4,
  },

  navPanelPos: { position: 'absolute', top: 76, right: 16, zIndex: 16 },
  navPanelPosMobile: { position: 'absolute', top: 80, left: 16, right: 16, zIndex: 16 },
  navPanel: {
    borderRadius: Radius.lg, borderWidth: 1, padding: Spacing.md,
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 14, elevation: 12,
    ...(Platform.OS === 'web' ? { backdropFilter: 'blur(14px)' } as any : {}),
    minWidth: 280,
  },
  navSearchRow: { flexDirection: 'row', gap: 6, marginBottom: Spacing.sm },
  navSearchInput: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderRadius: Radius.md, paddingHorizontal: 10, height: 36,
  },
  navTextInput: {
    flex: 1, fontSize: 13, marginLeft: 6, height: 36,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}),
  },
  navVoiceBtn: {
    width: 36, height: 36, borderRadius: Radius.md, borderWidth: 1,
    justifyContent: 'center', alignItems: 'center',
  },
  navLoading: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  navGoBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 8, borderRadius: Radius.md,
  },
  navActivePanel: {},
  navActiveHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
  navStopBtn: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: Radius.full, borderWidth: 1,
  },
  navStats: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', marginBottom: Spacing.sm },
  navStatItem: { alignItems: 'center', flex: 1 },
  navStatDivider: { width: 1, height: 36 },
  navIncidents: { marginTop: Spacing.xs, paddingTop: Spacing.xs, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.06)' },
  navIncidentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 2, gap: 8 },

  scanPanelPos: { position: 'absolute', top: 76, right: 16, zIndex: 15 },
  scanPanelPosMobile: { position: 'absolute', top: 80, left: 16, right: 16, zIndex: 15 },
  scanPanel: {
    borderRadius: Radius.lg, borderWidth: 1, padding: Spacing.md,
    shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 12, elevation: 10,
    ...(Platform.OS === 'web' ? { backdropFilter: 'blur(12px)' } as any : {}),
    minWidth: 240,
  },
  scanPanelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  scanRadiusRow: { flexDirection: 'row', gap: 6, marginBottom: Spacing.sm },
  scanRadiusChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full, borderWidth: 1 },
  scanBtn: {
    paddingVertical: 8, borderRadius: Radius.md,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  scanResults: { marginTop: Spacing.xs, gap: 4 },
  scanResultRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 2 },
  scanLabel: { position: 'absolute', top: 16, left: 0, right: 0, alignItems: 'center', zIndex: 10 },
  scanLabelCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: Spacing.md },

  feedSection: { gap: 0 },
  feedItem: { flexDirection: 'row', paddingVertical: Spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth },
  feedDot: { width: 8, height: 8, borderRadius: 4, marginTop: 5, marginRight: Spacing.sm },
  feedBody: { flex: 1 },

  mobileContainer: { flex: 1, position: 'relative' },
  mobileTopBar: {
    position: 'absolute', top: 0, left: 0, right: 0,
    paddingTop: Platform.OS === 'ios' ? 54 : Platform.OS === 'android' ? 36 : 16,
    paddingBottom: Spacing.sm, paddingHorizontal: Spacing.md,
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', zIndex: 10,
    shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 }, elevation: 8,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  mobileLeftFabs: { position: 'absolute', bottom: 90, left: 16, gap: Spacing.sm, zIndex: 20 },
  mobileBottomFabs: {
    position: 'absolute', bottom: 24, alignSelf: 'center', left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'center', gap: Spacing.sm,
    alignSelf: 'center',
    paddingHorizontal: 10, paddingVertical: 8,
    borderRadius: 18, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 }, elevation: 14,
    zIndex: 20,
    ...(Platform.OS === 'web' ? { width: 'fit-content', marginLeft: 'auto', marginRight: 'auto' } as any : {}),
  },
  mobileFab: {
    display: 'none',
  },
  mobileSheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0, maxHeight: '55%',
    borderTopLeftRadius: Radius['2xl'], borderTopRightRadius: Radius['2xl'],
    paddingTop: Spacing.md, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 20, elevation: 20, zIndex: 15,
  },
  mobileSheetScroll: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing['3xl'] },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.md },
  closeBtn: { position: 'absolute', top: Spacing.md, right: Spacing.lg, padding: Spacing.sm, zIndex: 5 },

  detailPanelDesktop: {},
  detailPanelMobile: { paddingBottom: Spacing['3xl'] },
  detailHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  detailCatIcon: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  detailHeaderText: { flex: 1, marginLeft: Spacing.md },
  detailTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.sm, flexWrap: 'wrap' },
  detailTitle: { flexShrink: 1 },
  verifiedInline: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.primary + '10', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4, gap: 2,
  },
  detailStats: { flexDirection: 'row', gap: Spacing.xl, marginTop: Spacing.lg, marginBottom: Spacing.lg },
  detailStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  detailActions: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.lg },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, paddingVertical: Spacing.md, borderRadius: Radius.md, borderWidth: 1, minHeight: 48,
  },
  detailReporter: { flexDirection: 'row', alignItems: 'center' },

  // Drive Mode HUD
  driveHudContainer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingBottom: 24, paddingHorizontal: 20,
    zIndex: 25,
  },
  driveSpeedBox: {
    alignSelf: 'center', alignItems: 'center',
    paddingHorizontal: 22, paddingVertical: 10, borderRadius: 16, borderWidth: 1.5,
    shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 20, elevation: 15,
    marginBottom: 8,
  },
  driveSpeedLimit: {
    position: 'absolute', bottom: 70, left: 16,
    width: 46, height: 46, borderRadius: 23, borderWidth: 3,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#FF3C3C', shadowOpacity: 0.3, shadowRadius: 8,
  },
  driveRadarAlert: {
    alignSelf: 'center', flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, paddingHorizontal: 16,
    borderRadius: 14, borderWidth: 1,
    marginBottom: 10, maxWidth: 400,
  },
  driveModeLabel: {
    position: 'absolute', top: 16, left: 16,
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 6, paddingHorizontal: 12,
    borderRadius: 10, borderWidth: 1, borderColor: '#00AAFF30',
  },

  // Overlay for Family / Profile
  overlayContainer: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 30,
  },
  overlayBackdrop: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  overlaySheet: {
    position: 'absolute', top: 10, left: 10, right: 10, bottom: 10,
    borderRadius: 20, borderWidth: 1,
    shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 30, elevation: 25,
    overflow: 'hidden',
  },
  overlayHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  overlayCloseBtn: {
    width: 32, height: 32, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
});
