import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, StyleSheet, Pressable, Platform, ScrollView, Animated, Easing, TextInput } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
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
import { timeAgo, formatDistance } from '../../src/services/mockData';
import type { Incident, PublicCamera } from '../../src/types';
import { seedDatabase, IncidentDB } from '../../src/services/database';
import { generateWorldIncidents } from '../../src/data/worldIncidents';
import { generatePortugalIncidents } from '../../src/data/portugalIncidents';
import { LogoMark } from '../../src/components/ui/LogoMark';
import { CameraViewer } from '../../src/components/camera/CameraViewer';
import { TutorialOverlay } from '../../src/components/ui/TutorialOverlay';
import { fetchAllCameras } from '../../src/services/cameraService';
import FamilyScreen from './family';
import ProfileScreen from './profile';
import ChainScreen from './chain';

const USER_LOCATION = { latitude: 41.2356, longitude: -8.6200 };
const LANDING_PAGE_URL = 'http://localhost:8080';

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

function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 10000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer));
}

async function fetchRoute(from: { lat: number; lng: number }, to: { lat: number; lng: number }): Promise<{ coordinates: [number, number][]; distance: number; duration: number } | null> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson&steps=true`;
    const res = await fetchWithTimeout(url, {}, 12000);
    const data = await res.json();
    if (data.code !== 'Ok' || !data.routes?.[0]) return null;
    const route = data.routes[0];
    return { coordinates: route.geometry.coordinates as [number, number][], distance: route.distance, duration: route.duration };
  } catch { return null; }
}

async function geocodePlace(query: string): Promise<{ lat: number; lng: number; name: string } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
    const res = await fetchWithTimeout(url, { headers: { 'User-Agent': 'AlertIO/2.0' } }, 8000);
    const data = await res.json();
    if (!data?.[0]) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), name: data[0].display_name.split(',')[0] };
  } catch { return null; }
}

async function fetchSpeedCameras(lat: number, lng: number, radius = 5000): Promise<SpeedCamera[]> {
  try {
    const query = `[out:json][timeout:10];(node["highway"="speed_camera"](around:${radius},${lat},${lng});node["enforcement"="maxspeed"](around:${radius},${lat},${lng}););out body;`;
    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
    const res = await fetchWithTimeout(url, {}, 15000);
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

const FALLBACK_PUBLIC_CAMERAS: PublicCamera[] = [
  { id: 'fc-1', name: 'New York — Times Square', lat: 40.758, lng: -73.9855, streamUrl: 'https://www.youtube.com/embed/AdUw5RdyZxI?autoplay=1&mute=1', type: 'urban', country: 'USA', quality: 'high' },
  { id: 'fc-2', name: 'Tokyo — Shibuya Crossing', lat: 35.6595, lng: 139.7004, streamUrl: 'https://www.youtube.com/embed/3q2CnOmOPSA?autoplay=1&mute=1', type: 'urban', country: 'Japan', quality: 'high' },
  { id: 'fc-3', name: 'Jackson Hole — Town Square', lat: 43.4799, lng: -110.7624, streamUrl: 'https://www.youtube.com/embed/1EiC9bvVGnk?autoplay=1&mute=1', type: 'urban', country: 'USA', quality: 'high' },
  { id: 'fc-4', name: 'San Diego — Beaches 4K', lat: 32.7157, lng: -117.1611, streamUrl: 'https://www.youtube.com/embed/fFj4wnSTYtM?autoplay=1&mute=1', type: 'coastal', country: 'USA', quality: 'high' },
  { id: 'fc-5', name: 'Miami — Biscayne Bay', lat: 25.7907, lng: -80.1300, streamUrl: 'https://www.youtube.com/embed/5YCajRjvWCg?autoplay=1&mute=1', type: 'coastal', country: 'USA', quality: 'high' },
  { id: 'fc-6', name: 'Porto — Ribeira', lat: 41.1413, lng: -8.6130, streamUrl: 'https://www.skylinewebcams.com/webcam/portugal/north/porto/porto-ribeira.html', type: 'urban', country: 'Portugal', quality: 'standard' },
  { id: 'fc-7', name: 'Lisboa — Praça do Comércio', lat: 38.7075, lng: -9.1364, streamUrl: 'https://www.skylinewebcams.com/webcam/portugal/center-south/lisbon/praca-do-comercio.html', type: 'urban', country: 'Portugal', quality: 'standard' },
  { id: 'fc-8', name: 'Paris — Tour Eiffel', lat: 48.8584, lng: 2.2945, streamUrl: 'https://www.skylinewebcams.com/webcam/france/ile-de-france/paris/tour-eiffel.html', type: 'urban', country: 'France', quality: 'high' },
  { id: 'fc-9', name: 'Roma — Fontana di Trevi', lat: 41.9009, lng: 12.4833, streamUrl: 'https://www.skylinewebcams.com/webcam/italia/lazio/roma/fontana-di-trevi.html', type: 'urban', country: 'Italy', quality: 'high' },
  { id: 'fc-10', name: 'Barcelona — Port Vell', lat: 41.3818, lng: 2.1700, streamUrl: 'https://www.skylinewebcams.com/webcam/espana/comunidad-de-cataluna/barcelona/port-vell.html', type: 'coastal', country: 'Spain', quality: 'standard' },
  { id: 'fc-11', name: 'Venice — St. Mark\'s Square', lat: 45.4343, lng: 12.3388, streamUrl: 'https://www.youtube.com/embed/vPsAzqrdJeo?autoplay=1&mute=1', type: 'urban', country: 'Italy', quality: 'high' },
  { id: 'fc-12', name: 'Nashville — Broadway', lat: 36.1627, lng: -86.7816, streamUrl: 'https://www.youtube.com/embed/9VDGk2LvI_0?autoplay=1&mute=1', type: 'urban', country: 'USA', quality: 'high' },
];


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
          backgroundColor: active ? color + '18' : pressed ? color + '25' : hovered ? color + '10' : 'rgba(14,14,28,0.85)',
          borderColor: active ? color + '60' : hovered ? color + '40' : 'rgba(255,255,255,0.06)',
          shadowColor: color,
          shadowOpacity: active ? 0.5 : hovered ? 0.4 : 0,
          shadowRadius: active ? 16 : hovered ? 12 : 0,
          shadowOffset: { width: 0, height: 0 },
          transform: [{ scale: pressed ? 0.88 : hovered ? 1.08 : 1 }],
        }]}
        accessible accessibilityLabel={label} accessibilityRole="button"
      >
        <MaterialCommunityIcons name={icon as any} size={20} color={active || hovered ? color : color + '80'} />
      </Pressable>
    </View>
  );
}

function TopBarIcon({ icon, label, active, onPress, color, badge, compact }: {
  icon: string; label: string; active: boolean; onPress: () => void; color: string; badge?: boolean; compact?: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <Pressable
      onPress={onPress}
      // @ts-ignore web-only
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={({ pressed }) => ({
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        gap: compact ? 0 : 6,
        height: 34,
        paddingHorizontal: compact ? 0 : active ? 12 : hovered ? 10 : 8,
        paddingVertical: 0,
        borderRadius: 10,
        backgroundColor: active
          ? color + '18'
          : hovered
            ? color + '0C'
            : 'transparent',
        borderWidth: 1,
        borderColor: active
          ? color + '45'
          : hovered
            ? color + '25'
            : 'rgba(255,255,255,0.04)',
        transform: [{ scale: pressed ? 0.92 : hovered ? 1.04 : 1 }],
        shadowColor: color,
        shadowOpacity: active ? 0.5 : hovered ? 0.3 : 0,
        shadowRadius: active ? 14 : hovered ? 10 : 0,
        shadowOffset: { width: 0, height: 0 } as any,
        ...(Platform.OS === 'web'
          ? {
              transition: 'all 0.25s cubic-bezier(0.25,0.8,0.25,1)',
              cursor: 'pointer',
              width: compact ? 34 : 'auto',
              justifyContent: compact ? 'center' : 'flex-start',
            } as any
          : {}),
        position: 'relative' as const,
      })}
      accessible accessibilityLabel={label} accessibilityRole="button"
    >
      <MaterialCommunityIcons
        name={icon as any}
        size={compact ? 18 : 16}
        color={active ? color : hovered ? color : '#8A8AAA'}
      />
      {!compact && (
        <NeonText
          variant="caption"
          color={active ? color : hovered ? color : '#8A8AAA'}
          style={{
            fontSize: 10,
            fontWeight: active ? '800' : '600',
            letterSpacing: 0.4,
            ...(Platform.OS === 'web' ? { transition: 'color 0.2s ease' } as any : {}),
          }}
        >
          {label}
        </NeonText>
      )}
      {badge && (
        <View style={{
          position: 'absolute' as const, top: 3, right: 3, width: 7, height: 7,
          borderRadius: 4, backgroundColor: Colors.primary,
          shadowColor: Colors.primary, shadowOpacity: 0.8, shadowRadius: 3,
        }} />
      )}
    </Pressable>
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
    width: 44, height: 44, borderRadius: 14, borderWidth: 1,
    justifyContent: 'center', alignItems: 'center',
    ...(Platform.OS === 'web' ? { transition: 'all 0.28s cubic-bezier(0.25,0.8,0.25,1)', cursor: 'pointer' } as any : {}),
  },
});

export default function MapScreen() {
  const { colors } = useA11y();
  const haptics = useHaptics();
  const { showSidebar, sidebarWidth } = useResponsive();
  const { incidents, selectedIncident, isLoading, loadIncidents, loadPublicData, refreshPublicData, selectIncident } = useIncidentStore();
  const user = useAuthStore((s) => s.user);
  const familyMembers = useFamilyStore((s) => s.members);
  const loadFamily = useFamilyStore((s) => s.loadFamily);
  const lightTheme = useAccessibilityStore((s) => s.lightTheme);
  const searchParams = useLocalSearchParams<{ focusLat?: string; focusLng?: string; focusName?: string }>();

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
  const speedCamerasRef = useRef<SpeedCamera[]>([]);
  const [radarAlert, setRadarAlert] = useState<string | null>(null);
  const speedAnimRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [navRemaining, setNavRemaining] = useState<{ time: number; dist: number } | null>(null);
  const [focusLocation, setFocusLocation] = useState<{ latitude: number; longitude: number; zoom?: number } | null>(null);
  const [publicCameras, setPublicCameras] = useState<PublicCamera[]>([]);
  const [viewingCamera, setViewingCamera] = useState<PublicCamera | null>(null);
  const [showCameras, setShowCameras] = useState(false);
  const [camerasLoading, setCamerasLoading] = useState(false);
  const [showTutorial, setShowTutorial] = useState(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      return !localStorage.getItem('alertio_tutorial_done');
    }
    return false;
  });
  const [feedPage, setFeedPage] = useState(0);
  const [hoveredIncidentId, setHoveredIncidentId] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.focusLat && searchParams.focusLng) {
      const lat = parseFloat(searchParams.focusLat);
      const lng = parseFloat(searchParams.focusLng);
      if (!isNaN(lat) && !isNaN(lng)) {
        setActiveOverlay(null);
        setFocusLocation({ latitude: lat, longitude: lng, zoom: 17 });
      }
    }
  }, [searchParams.focusLat, searchParams.focusLng]);

  useEffect(() => {
    seedDatabase().then(async () => {
      const ptInc = generatePortugalIncidents();
      for (const inc of ptInc) {
        try { await IncidentDB.create(inc); } catch { /* skip duplicates */ }
      }
      const worldInc = generateWorldIncidents();
      for (const inc of worldInc) {
        try { await IncidentDB.create(inc); } catch { /* skip duplicates */ }
      }
      await loadIncidents();
      loadFamily();
      loadPublicData(USER_LOCATION.latitude, USER_LOCATION.longitude);
      fetchAllCameras()
        .then((cams) => setPublicCameras(cams.length > 0 ? cams : FALLBACK_PUBLIC_CAMERAS))
        .catch(() => setPublicCameras(FALLBACK_PUBLIC_CAMERAS));
      announce(`Mapa carregado com incidentes de Portugal e do mundo`);
    });
  }, []);

  // Auto-refresh public security data every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refreshPublicData(USER_LOCATION.latitude, USER_LOCATION.longitude);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Cycle live feed items every 8 seconds
  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(incidents.length / 5));
    const interval = setInterval(() => {
      setFeedPage((prev) => (prev + 1) % totalPages);
    }, 8000);
    return () => clearInterval(interval);
  }, [incidents.length]);

  useEffect(() => {
    if (scanning) {
      Animated.loop(Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.12, duration: 500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])).start();
    } else { pulseAnim.stopAnimation(); pulseAnim.setValue(1); }
  }, [scanning]);

  // Keep speedCameras ref in sync with state
  useEffect(() => { speedCamerasRef.current = speedCameras; }, [speedCameras]);

  // Drive mode: simulate speed, fetch cameras, update nav remaining
  useEffect(() => {
    if (driveMode) {
      fetchSpeedCameras(USER_LOCATION.latitude, USER_LOCATION.longitude).then((cams) => {
        const resolved = cams.length > 0 ? cams : FALLBACK_CAMERAS;
        setSpeedCameras(resolved);
        speedCamerasRef.current = resolved;
      });

      let speed = 0;
      let direction = 1;
      speedAnimRef.current = setInterval(() => {
        speed += direction * (Math.random() * 8 + 1);
        if (speed > 75) direction = -1;
        if (speed < 5) direction = 1;
        speed = Math.max(0, Math.min(90, speed));
        setCurrentSpeed(Math.round(speed));

        setNavRemaining((prev) => {
          if (!prev || prev.dist <= 0) return prev;
          const metersTraveled = speed * 1.2 / 3.6;
          const newDist = Math.max(0, prev.dist - metersTraveled);
          const newTime = Math.max(0, prev.time - 1.2);
          if (newDist <= 50 && prev.dist > 50) {
            setTimeout(() => announce('Chegou ao destino!'), 0);
          }
          return { time: newTime, dist: newDist };
        });

        const cams = speedCamerasRef.current.length > 0 ? speedCamerasRef.current : FALLBACK_CAMERAS;
        const nearest = cams
          .map((c) => ({
            ...c,
            dist: haversineDistance(USER_LOCATION, { latitude: c.lat, longitude: c.lng }),
          }))
          .sort((a, b) => a.dist - b.dist)[0];

        if (nearest && nearest.dist < 800) {
          setRadarAlert(`Radar a ${Math.round(nearest.dist)}m${nearest.speedLimit ? ` — Limite ${nearest.speedLimit} km/h` : ''}`);
          if (nearest.speedLimit) setSpeedLimit(nearest.speedLimit);
        } else {
          setRadarAlert(null);
          setSpeedLimit(60);
        }
      }, 1200);

      announce('Modo Condução ativado');
      return () => { if (speedAnimRef.current) clearInterval(speedAnimRef.current); };
    } else {
      if (speedAnimRef.current) clearInterval(speedAnimRef.current);
      setCurrentSpeed(0);
      setSpeedCameras([]);
      setRadarAlert(null);
      setSpeedLimit(60);
    }
  }, [driveMode]);

  useEffect(() => {
    if (navRoute) {
      setNavRemaining({ time: navRoute.duration, dist: navRoute.distance });
    } else {
      setNavRemaining(null);
    }
  }, [navRoute]);

  const guardScan: GuardScanConfig | null = (scanning || scanDone)
    ? { active: true, scanning, radiusMeters: scanRadius, center: USER_LOCATION }
    : null;

  const mapMarkers: MapMarker[] = incidents.map((inc) => ({
    id: inc.id, coordinate: inc.location, incident: inc,
  }));

  const handleMarkerPress = useCallback((marker: MapMarker) => {
    haptics.light();
    selectIncident(marker.incident);
    announce(`Selecionado: ${getCategoryMeta(marker.incident.category).label}, ${marker.incident.title}`);
  }, []);

  const handleMapPress = useCallback(() => {
    if (selectedIncident) selectIncident(null);
  }, [selectedIncident]);

  const handleReportPress = () => { haptics.medium(); router.push('/incident/report'); };

  const startNavigation = useCallback(async (query: string) => {
    if (!query.trim()) return;
    setNavLoading(true);
    announce(`Procurando ${query}`);
    const dest = await geocodePlace(query);
    if (!dest) { announce('Local não encontrado'); setNavLoading(false); return; }
    const route = await fetchRoute({ lat: USER_LOCATION.latitude, lng: USER_LOCATION.longitude }, { lat: dest.lat, lng: dest.lng });
    if (!route) { announce('Não foi possível calcular a rota'); setNavLoading(false); return; }
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
    const voiceMsg = `Navegando para ${dest.name}. ${formatNavDistance(route.distance)}, aproximadamente ${formatDuration(route.duration)}.${routeIncidents.length > 0 ? ` Atenção: ${routeIncidents.length} incidentes na rota.` : ' Rota livre.'}`;
    announce(voiceMsg);
    if (Platform.OS === 'web' && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(voiceMsg);
      utterance.lang = 'pt-BR';
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  }, [incidents]);

  const stopNavigation = useCallback(() => { setNavRoute(null); setNavInput(''); setNavRemaining(null); announce('Navegação parada'); }, []);

  const startVoiceInput = useCallback(() => {
    if (Platform.OS !== 'web' || !('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      announce('Entrada de voz não suportada');
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onstart = () => { setVoiceListening(true); announce('Ouvindo...'); };
    recognition.onresult = (event: any) => { const t = event.results[0][0].transcript; setNavInput(t); setVoiceListening(false); startNavigation(t); };
    recognition.onerror = () => { setVoiceListening(false); announce('Voz não reconhecida'); };
    recognition.onend = () => { setVoiceListening(false); };
    recognition.start();
  }, [startNavigation]);

  const startScan = useCallback(async () => {
    haptics.medium();
    setScanning(true);
    setScanDone(false);
    setFoundIncidents([]);
    announce(`Escaneando ${formatDistance(scanRadius)}`);
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
      announce(`${found.length} incidentes encontrados em ${formatDistance(scanRadius)}`);
    }, 2000);
  }, [scanRadius]);

  const completeTutorial = useCallback(() => {
    setShowTutorial(false);
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      localStorage.setItem('alertio_tutorial_done', '1');
    }
  }, []);

  const toggleCameras = useCallback(async () => {
    haptics.light();
    if (showCameras) {
      setShowCameras(false);
      return;
    }
    if (publicCameras.length > 0) {
      setShowCameras(true);
      return;
    }
    setCamerasLoading(true);
    try {
      const cams = await fetchAllCameras();
      setPublicCameras(cams.length > 0 ? cams : FALLBACK_PUBLIC_CAMERAS);
      setShowCameras(true);
    } catch {
      setPublicCameras(FALLBACK_PUBLIC_CAMERAS);
      setShowCameras(true);
    } finally {
      setCamerasLoading(false);
    }
  }, [showCameras, publicCameras.length]);

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
        <LoadingRadar size={140} message="Carregando mapa..." />
      </View>
    );
  }

  const incidentDetail = selectedIncident ? (
    <View style={[showSidebar ? styles.detailPanelDesktop : styles.detailPanelMobile, { backgroundColor: showSidebar ? 'transparent' : colors.surface }]}>
      {!showSidebar && <View style={[styles.sheetHandle, { backgroundColor: colors.textTertiary }]} />}
      {!showSidebar && (
        <Pressable onPress={() => selectIncident(null)} style={styles.closeBtn} accessible accessibilityLabel="Fechar" accessibilityRole="button">
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
        {selectedIncident.isVerified && (
          <NeonText variant="caption" color={Colors.success} glow={Colors.success} style={{ fontWeight: '800', fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase' }}>Verificado</NeonText>
        )}
      </View>
      <View style={styles.detailTitleRow}>
        <NeonText variant="h4" style={styles.detailTitle}>{selectedIncident.title}</NeonText>
      </View>
      <NeonText variant="bodySm" color={colors.textSecondary} numberOfLines={4}>{selectedIncident.description}</NeonText>
      <View style={styles.detailStats}>
        <View style={styles.detailStat}><MaterialCommunityIcons name="check-circle" size={16} color={Colors.success} /><NeonText variant="bodySm" color={Colors.success}>{selectedIncident.confirmCount}</NeonText></View>
        <View style={styles.detailStat}><MaterialCommunityIcons name="close-circle" size={16} color={Colors.error} /><NeonText variant="bodySm" color={Colors.error}>{selectedIncident.denyCount}</NeonText></View>
        <View style={styles.detailStat}><MaterialCommunityIcons name="eye-outline" size={16} color={Colors.warning} /><NeonText variant="bodySm" color={Colors.warning}>{selectedIncident.views}</NeonText></View>
      </View>
      <View style={styles.detailActions}>
        <Pressable onPress={() => { haptics.success(); useIncidentStore.getState().confirmIncident(selectedIncident.id); announce('Confirmado'); }}
          style={({ pressed }) => [styles.actionBtn, { backgroundColor: pressed ? Colors.success + '25' : Colors.success + '12', borderColor: Colors.success + '35', transform: [{ scale: pressed ? 0.95 : 1 }] }]}
          accessible accessibilityLabel="Confirmar" accessibilityRole="button">
          <MaterialCommunityIcons name="check" size={18} color={Colors.success} /><NeonText variant="buttonSm" color={Colors.success}>Confirmar</NeonText>
        </Pressable>
        <Pressable onPress={() => { haptics.warning(); useIncidentStore.getState().denyIncident(selectedIncident.id); announce('Negado'); }}
          style={({ pressed }) => [styles.actionBtn, { backgroundColor: pressed ? Colors.error + '25' : Colors.error + '12', borderColor: Colors.error + '35', transform: [{ scale: pressed ? 0.95 : 1 }] }]}
          accessible accessibilityLabel="Negar" accessibilityRole="button">
          <MaterialCommunityIcons name="close" size={18} color={Colors.error} /><NeonText variant="buttonSm" color={Colors.error}>Negar</NeonText>
        </Pressable>
      </View>
      {user?.isGuardian && !selectedIncident.isVerified && (
        <Pressable onPress={() => { haptics.heavy(); useIncidentStore.getState().verifyIncident(selectedIncident.id, user.uid, user.displayName); announce('Verificado!'); }}
          style={({ pressed }) => [styles.actionBtn, { backgroundColor: pressed ? Colors.primary + '25' : Colors.primary + '12', borderColor: Colors.primary + '40', marginBottom: Spacing.md, transform: [{ scale: pressed ? 0.96 : 1 }] }]}
          accessible accessibilityLabel="Verificar como Guardião" accessibilityRole="button">
          <MaterialCommunityIcons name="shield-check" size={18} color={Colors.primary} /><NeonText variant="buttonSm" color={Colors.primary}>Verificar como Guardião</NeonText>
        </Pressable>
      )}
      {selectedIncident.isVerified && selectedIncident.verifiedByName && (
        <NeonText variant="caption" color={colors.textTertiary} style={{ marginBottom: Spacing.xs }}>
          Verificado por {selectedIncident.verifiedByName}
        </NeonText>
      )}
      <View style={styles.detailReporter}>
        <BadgeIcon level={selectedIncident.reporterLevel} size="sm" />
        <NeonText variant="bodySm" color={colors.textSecondary} style={{ marginLeft: Spacing.sm }}>por {selectedIncident.reporterName}</NeonText>
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
                placeholder="Para onde?"
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
              <NeonText variant="caption" color={colors.primary} style={{ marginLeft: 6 }}>A calcular rota...</NeonText>
            </View>
          )}
          <Pressable onPress={() => startNavigation(navInput)} disabled={!navInput.trim() || navLoading}
            style={({ pressed }) => [styles.navGoBtn, { backgroundColor: !navInput.trim() ? colors.border : pressed ? colors.primaryDim : colors.primary, opacity: !navInput.trim() ? 0.4 : 1 }]}>
            <MaterialCommunityIcons name="navigation" size={16} color={colors.background} />
            <NeonText variant="caption" color={colors.background} style={{ fontWeight: '700', marginLeft: 4 }}>Navegar</NeonText>
          </Pressable>
        </>
      )}

      {navRoute && (
        <View style={styles.navActivePanel}>
          <View style={styles.navActiveHeader}>
            <View style={{ flex: 1 }}>
              <NeonText variant="caption" color={colors.textTertiary} style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: 1 }}>A navegar para</NeonText>
              <NeonText variant="label" color={colors.textPrimary} numberOfLines={1}>{navRoute.destinationName}</NeonText>
            </View>
            <Pressable onPress={stopNavigation} style={({ pressed }) => [styles.navStopBtn, { backgroundColor: pressed ? Colors.error + '30' : Colors.error + '15', borderColor: Colors.error + '40' }]}>
              <MaterialCommunityIcons name="close" size={14} color={Colors.error} />
              <NeonText variant="caption" color={Colors.error} style={{ fontWeight: '700', fontSize: 9, marginLeft: 2 }}>Parar</NeonText>
            </Pressable>
          </View>
          <View style={styles.navStats}>
            <View style={styles.navStatItem}>
              <MaterialCommunityIcons name="clock-outline" size={20} color="#00AAFF" />
              <NeonText variant="h4" color="#00AAFF" style={{ marginTop: 2 }}>{formatDuration(navRoute.duration)}</NeonText>
              <NeonText variant="caption" color={colors.textTertiary} style={{ fontSize: 9 }}>Chegada</NeonText>
            </View>
            <View style={[styles.navStatDivider, { backgroundColor: colors.border }]} />
            <View style={styles.navStatItem}>
              <MaterialCommunityIcons name="map-marker-distance" size={20} color={Colors.primary} />
              <NeonText variant="h4" color={Colors.primary} style={{ marginTop: 2 }}>{formatNavDistance(navRoute.distance)}</NeonText>
              <NeonText variant="caption" color={colors.textTertiary} style={{ fontSize: 9 }}>Distância</NeonText>
            </View>
            <View style={[styles.navStatDivider, { backgroundColor: colors.border }]} />
            <View style={styles.navStatItem}>
              <MaterialCommunityIcons name="alert-circle-outline" size={20}
                color={navRoute.incidents.length > 0 ? Colors.warning : Colors.success} />
              <NeonText variant="h4" color={navRoute.incidents.length > 0 ? Colors.warning : Colors.success} style={{ marginTop: 2 }}>
                {navRoute.incidents.length}
              </NeonText>
              <NeonText variant="caption" color={colors.textTertiary} style={{ fontSize: 9 }}>Incidentes</NeonText>
            </View>
          </View>
          {navRoute.incidents.length > 0 && (
            <View style={styles.navIncidents}>
              <NeonText variant="caption" color={Colors.warning} style={{ fontWeight: '700', marginBottom: 4 }}>⚠ Incidentes na rota:</NeonText>
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
          <NeonText variant="caption" color={scanning ? colors.primary : colors.background} style={{ fontWeight: '700' }}>{scanning ? 'A escanear...' : 'Escanear Área'}</NeonText>
        </Animated.View>
      </Pressable>
      {scanDone && (
        <View style={styles.scanResults}>
          <NeonText variant="caption" color={colors.primary} style={{ fontWeight: '700' }}>{foundIncidents.length} encontrados num raio de {formatDistance(scanRadius)}</NeonText>
          {foundIncidents.slice(0, 3).map((inc) => (
            <View key={inc.id} style={styles.scanResultRow}>
              <NeonText variant="caption" color={Colors.category[inc.category]} style={{ fontSize: 12 }}>{getCategoryMeta(inc.category).label}</NeonText>
              <NeonText variant="caption" color={colors.textTertiary} style={{ fontSize: 10 }}>{formatDistance(inc.distance)}</NeonText>
            </View>
          ))}
          {foundIncidents.length === 0 && <NeonText variant="caption" color={Colors.success}>Área limpa!</NeonText>}
        </View>
      )}
    </View>
  ) : null;

  const SOURCE_LABELS: Record<string, { label: string; color: string }> = {
    community: { label: 'Comunidade', color: Colors.primary },
    uk_police: { label: 'UK Police', color: '#3B7AFF' },
    dc_gov: { label: 'DC Gov', color: '#FF9800' },
    dados_gov: { label: 'Dados.gov.pt', color: '#00BCD4' },
  };

  const sortedFeedItems = incidents
    .slice()
    .sort((a, b) => b.createdAt - a.createdAt);
  const liveFeedItems = sortedFeedItems.slice(feedPage * 5, feedPage * 5 + 5);

  const nearbyIncidents = incidents
    .filter((inc) => {
      const dist = haversineDistance(USER_LOCATION, inc.location);
      return dist <= 25000;
    })
    .sort((a, b) => haversineDistance(USER_LOCATION, a.location) - haversineDistance(USER_LOCATION, b.location))
    .slice(0, 20);

  const feedSection = (
    <View style={styles.feedSection}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, paddingVertical: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {Platform.OS === 'web' && (
            <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#FF3B30', boxShadow: '0 0 6px #FF3B30, 0 0 12px #FF3B3050', animation: 'pulse-live 1.5s ease-in-out infinite' } as any} />
          )}
          {Platform.OS !== 'web' && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF3B30' }} />}
          <NeonText variant="caption" color="#FF3B30" style={{ fontWeight: '900', fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase' }}>LIVE</NeonText>
          <NeonText variant="caption" color={colors.primary} style={{ fontWeight: '700', fontSize: 10, letterSpacing: 0.5 }}>Feed ao Vivo</NeonText>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <NeonText variant="caption" color={colors.textTertiary} style={{ fontSize: 8 }}>{feedPage + 1}/{Math.max(1, Math.ceil(sortedFeedItems.length / 5))}</NeonText>
          <View style={{ width: 1, height: 8, backgroundColor: colors.border }} />
          <NeonText variant="caption" color={colors.textTertiary} style={{ fontSize: 8 }}>{incidents.length} total</NeonText>
        </View>
      </View>
      {Platform.OS === 'web' && <style>{`@keyframes pulse-live { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(0.8); } }`}</style>}
      {liveFeedItems.map((inc) => {
        const catMeta = getCategoryMeta(inc.category);
        const catColor = Colors.category[inc.category] || '#8A8A9A';
        const src = SOURCE_LABELS[(inc as any).source || 'community'] || SOURCE_LABELS.community;
        return (
          <Pressable key={inc.id} onPress={() => { haptics.light(); selectIncident(inc); }}
            style={({ pressed }) => [styles.feedItem, {
              borderBottomColor: colors.border,
              backgroundColor: pressed ? catColor + '08' : 'transparent',
              borderRadius: 8, paddingHorizontal: 4,
            }]}>
            <View style={[styles.feedDot, { backgroundColor: catColor }]} />
            <View style={styles.feedBody}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <NeonText variant="caption" color={catColor} style={{ fontWeight: '700', fontSize: 9, textTransform: 'uppercase' }}>{catMeta.label}</NeonText>
                <View style={{ width: 1, height: 10, backgroundColor: colors.border }} />
                <NeonText variant="caption" color={src.color} style={{ fontSize: 8, fontWeight: '600' }}>{src.label}</NeonText>
                {inc.isVerified && <NeonText variant="caption" color={Colors.success} style={{ fontSize: 8, fontWeight: '800' }}>✓ Verificado</NeonText>}
              </View>
              <NeonText variant="caption" numberOfLines={2} style={{ lineHeight: 16 }}>{inc.title}</NeonText>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 }}>
                <NeonText variant="caption" color={colors.textTertiary} style={{ fontSize: 10 }}>{timeAgo(inc.createdAt)}</NeonText>
                <NeonText variant="caption" color={colors.textTertiary} style={{ fontSize: 10 }}>👍 {inc.confirmCount} · 👎 {inc.denyCount} · 👁 {inc.views}</NeonText>
              </View>
            </View>
          </Pressable>
        );
      })}
    </View>
  );

  // Drive Mode HUD overlay
  const isOverspeed = currentSpeed > (speedLimit || 999);
  const glassWeb = (blur = 40) => Platform.OS === 'web' ? { backdropFilter: `blur(${blur}px)`, WebkitBackdropFilter: `blur(${blur}px)` } as any : {};
  const driveHUD = driveMode ? (
    <View style={[styles.driveHudContainer, { pointerEvents: 'box-none' }]}>

      {/* ── Top-left: Mode pill + destination ── */}
      <View style={[styles.driveTopLeftBar, { pointerEvents: 'auto' as const }]}>
        <View style={[styles.driveModePill, {
          backgroundColor: lightTheme ? 'rgba(255,255,255,0.15)' : 'rgba(10,10,26,0.18)',
          borderColor: 'rgba(0,170,255,0.2)',
          ...glassWeb(32),
          ...(Platform.OS === 'web' ? { boxShadow: '0 4px 20px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.06)' } as any : {}),
        }]}>
          <MaterialCommunityIcons name="steering" size={14} color="#00AAFF" />
          <NeonText variant="caption" color="#00AAFF" style={{ fontWeight: '800', fontSize: 9, letterSpacing: 1.5, marginLeft: 5 }}>CONDUÇÃO</NeonText>
          <Pressable onPress={toggleDriveMode} style={({ pressed }) => ({
            marginLeft: 8, padding: 4, borderRadius: 12,
            backgroundColor: pressed ? 'rgba(255,68,68,0.2)' : 'rgba(255,68,68,0.08)',
            transform: [{ scale: pressed ? 0.9 : 1 }],
            ...(Platform.OS === 'web' ? { cursor: 'pointer', transition: 'all 0.2s ease' } as any : {}),
          })}>
            <MaterialCommunityIcons name="close" size={12} color="#FF6666" />
          </Pressable>
        </View>
        {navRoute && navRemaining && (
          <View style={[styles.driveDestBadge, {
            backgroundColor: lightTheme ? 'rgba(255,255,255,0.12)' : 'rgba(10,10,26,0.15)',
            ...glassWeb(28),
            ...(Platform.OS === 'web' ? { boxShadow: '0 4px 16px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.05)' } as any : {}),
          }]}>
            <MaterialCommunityIcons name="navigation" size={11} color={Colors.primary} />
            <NeonText variant="caption" color={colors.textPrimary} numberOfLines={1} style={{ fontSize: 10, fontWeight: '700', marginLeft: 4, maxWidth: 140 }}>
              {navRoute.destinationName}
            </NeonText>
          </View>
        )}
      </View>

      {/* ── Top-right: Control buttons (vertical stack) ── */}
      <View style={[styles.driveTopRightControls, { pointerEvents: 'auto' as const }]}>
        <Pressable onPress={() => { haptics.medium(); setNavOpen(!navOpen); setScanOpen(false); }}
          style={({ pressed }) => [styles.driveControlBtn, {
            backgroundColor: navOpen ? 'rgba(0,170,255,0.12)' : lightTheme ? 'rgba(255,255,255,0.15)' : 'rgba(10,10,26,0.18)',
            borderColor: navOpen ? 'rgba(0,170,255,0.3)' : 'rgba(255,255,255,0.06)',
            transform: [{ scale: pressed ? 0.9 : 1 }],
            ...glassWeb(28),
            ...(Platform.OS === 'web' ? { boxShadow: navOpen ? '0 0 16px rgba(0,170,255,0.2)' : '0 4px 16px rgba(0,0,0,0.12)' } as any : {}),
          }]}>
          <MaterialCommunityIcons name="navigation-variant" size={20} color="#00AAFF" />
          <NeonText variant="caption" color="#00AAFF" style={{ fontSize: 7, fontWeight: '700', marginTop: 2, letterSpacing: 0.4 }}>Navegar</NeonText>
        </Pressable>
        <Pressable onPress={() => { haptics.medium(); setScanOpen(!scanOpen); setNavOpen(false); }}
          style={({ pressed }) => [styles.driveControlBtn, {
            backgroundColor: scanOpen ? 'rgba(0,255,170,0.1)' : lightTheme ? 'rgba(255,255,255,0.15)' : 'rgba(10,10,26,0.18)',
            borderColor: scanOpen ? 'rgba(0,255,170,0.3)' : 'rgba(255,255,255,0.06)',
            transform: [{ scale: pressed ? 0.9 : 1 }],
            ...glassWeb(28),
            ...(Platform.OS === 'web' ? { boxShadow: scanOpen ? '0 0 16px rgba(0,255,170,0.2)' : '0 4px 16px rgba(0,0,0,0.12)' } as any : {}),
          }]}>
          <MaterialCommunityIcons name="radar" size={20} color={Colors.primary} />
          <NeonText variant="caption" color={Colors.primary} style={{ fontSize: 7, fontWeight: '700', marginTop: 2, letterSpacing: 0.4 }}>Escanear</NeonText>
        </Pressable>
        <Pressable onPress={handleReportPress}
          style={({ pressed }) => [styles.driveControlBtn, {
            backgroundColor: lightTheme ? 'rgba(255,255,255,0.15)' : 'rgba(10,10,26,0.18)',
            borderColor: 'rgba(255,255,255,0.06)',
            transform: [{ scale: pressed ? 0.9 : 1 }],
            ...glassWeb(28),
            ...(Platform.OS === 'web' ? { boxShadow: '0 4px 16px rgba(0,0,0,0.12)' } as any : {}),
          }]}>
          <MaterialCommunityIcons name="plus-circle" size={20} color={Colors.warning} />
          <NeonText variant="caption" color={Colors.warning} style={{ fontSize: 7, fontWeight: '700', marginTop: 2, letterSpacing: 0.4 }}>Reportar</NeonText>
        </Pressable>
        {navRoute && (
          <Pressable onPress={stopNavigation}
            style={({ pressed }) => [styles.driveControlBtn, {
              backgroundColor: pressed ? 'rgba(255,68,68,0.12)' : lightTheme ? 'rgba(255,255,255,0.15)' : 'rgba(10,10,26,0.18)',
              borderColor: 'rgba(255,68,68,0.15)',
              transform: [{ scale: pressed ? 0.9 : 1 }],
              ...glassWeb(28),
              ...(Platform.OS === 'web' ? { boxShadow: pressed ? '0 0 16px rgba(255,68,68,0.15)' : '0 4px 16px rgba(0,0,0,0.12)' } as any : {}),
            }]}>
            <MaterialCommunityIcons name="stop-circle" size={20} color="#FF5555" />
            <NeonText variant="caption" color="#FF5555" style={{ fontSize: 7, fontWeight: '700', marginTop: 2, letterSpacing: 0.4 }}>Parar</NeonText>
          </Pressable>
        )}
      </View>

      {/* ── Center: Alert banners ── */}
      <View style={styles.driveAlertArea}>
        {radarAlert && (
          <View style={[styles.driveAlertBanner, {
            backgroundColor: 'rgba(255,50,50,0.06)',
            borderColor: 'rgba(255,60,60,0.12)',
            ...glassWeb(28),
            ...(Platform.OS === 'web' ? { boxShadow: '0 4px 24px rgba(255,60,60,0.1), inset 0 1px 0 rgba(255,120,120,0.06)' } as any : {}),
          }, { pointerEvents: 'auto' as const }]}>
            <View style={{ width: 30, height: 30, borderRadius: 10, backgroundColor: 'rgba(255,68,68,0.08)', alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons name="camera" size={16} color="#FF5555" />
            </View>
            <NeonText variant="bodySm" color="#FF7777" style={{ fontWeight: '700', marginLeft: 8, flex: 1, fontSize: 11 }}>{radarAlert}</NeonText>
            <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#FF4444' }} />
          </View>
        )}
        {navRoute && navRoute.incidents.length > 0 && (
          <View style={[styles.driveAlertBanner, {
            backgroundColor: 'rgba(255,170,0,0.04)',
            borderColor: 'rgba(255,170,0,0.1)',
            ...glassWeb(28),
            ...(Platform.OS === 'web' ? { boxShadow: '0 4px 24px rgba(255,170,0,0.08), inset 0 1px 0 rgba(255,200,100,0.05)' } as any : {}),
          }, { pointerEvents: 'auto' as const }]}>
            <View style={{ width: 30, height: 30, borderRadius: 10, backgroundColor: Colors.warning + '0A', alignItems: 'center', justifyContent: 'center' }}>
              <MaterialCommunityIcons name="alert-circle" size={16} color={Colors.warning} />
            </View>
            <NeonText variant="bodySm" color={Colors.warning} style={{ fontWeight: '700', marginLeft: 8, flex: 1, fontSize: 11 }}>
              {navRoute.incidents.length} incidente{navRoute.incidents.length > 1 ? 's' : ''} na rota
            </NeonText>
          </View>
        )}
      </View>

      {/* ── Bottom-left: Speed limit sign ── */}
      {speedLimit != null && (
        <View style={[styles.driveBottomLeft, { pointerEvents: 'auto' as const }]}>
          <View style={[styles.driveSpeedLimitSign, {
            borderColor: isOverspeed ? '#FF4444' : '#FF6633',
            backgroundColor: lightTheme ? 'rgba(255,255,255,0.18)' : 'rgba(20,20,30,0.2)',
            ...glassWeb(32),
            ...(Platform.OS === 'web' ? {
              boxShadow: isOverspeed
                ? '0 0 24px rgba(255,68,68,0.35), inset 0 0 12px rgba(255,68,68,0.06)'
                : '0 4px 20px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.06)',
            } as any : {}),
          }]}>
            <NeonText variant="h4" color={isOverspeed ? '#FF4444' : colors.textPrimary} style={{ fontSize: 22, fontWeight: '900' }}>
              {speedLimit}
            </NeonText>
          </View>
        </View>
      )}

      {/* ── Bottom-right: Speedometer + nav stats ── */}
      <View style={[styles.driveBottomRight, { pointerEvents: 'auto' as const }]}>
        {/* Nav stats (when navigating) */}
        {navRoute && navRemaining && (
          <View style={styles.driveNavStatsRow}>
            <View style={[styles.driveNavStatCard, {
              backgroundColor: 'rgba(0,170,255,0.04)',
              borderColor: 'rgba(0,170,255,0.1)',
              ...glassWeb(20),
              ...(Platform.OS === 'web' ? { boxShadow: '0 2px 12px rgba(0,0,0,0.1), inset 0 1px 0 rgba(0,170,255,0.06)' } as any : {}),
            }]}>
              <MaterialCommunityIcons name="clock-outline" size={13} color="#00AAFF" />
              <NeonText variant="label" color="#00AAFF" style={{ fontSize: 14, fontWeight: '900', marginTop: 1 }}>
                {formatDuration(navRemaining.time)}
              </NeonText>
              <NeonText variant="caption" color="#6A7A9A" style={{ fontSize: 7, letterSpacing: 0.6 }}>Chegada</NeonText>
            </View>
            <View style={[styles.driveNavStatCard, {
              backgroundColor: 'rgba(0,255,170,0.03)',
              borderColor: 'rgba(0,255,170,0.1)',
              ...glassWeb(20),
              ...(Platform.OS === 'web' ? { boxShadow: '0 2px 12px rgba(0,0,0,0.1), inset 0 1px 0 rgba(0,255,170,0.06)' } as any : {}),
            }]}>
              <MaterialCommunityIcons name="map-marker-distance" size={13} color={Colors.primary} />
              <NeonText variant="label" color={Colors.primary} style={{ fontSize: 14, fontWeight: '900', marginTop: 1 }}>
                {formatNavDistance(navRemaining.dist)}
              </NeonText>
              <NeonText variant="caption" color="#6A7A9A" style={{ fontSize: 7, letterSpacing: 0.6 }}>Distância</NeonText>
            </View>
            <View style={[styles.driveNavStatCard, {
              backgroundColor: navRoute.incidents.length > 0 ? 'rgba(255,170,0,0.04)' : 'rgba(52,199,89,0.03)',
              borderColor: navRoute.incidents.length > 0 ? 'rgba(255,170,0,0.1)' : 'rgba(52,199,89,0.1)',
              ...glassWeb(20),
              ...(Platform.OS === 'web' ? { boxShadow: '0 2px 12px rgba(0,0,0,0.1)' } as any : {}),
            }]}>
              <MaterialCommunityIcons name="alert-circle-outline" size={13}
                color={navRoute.incidents.length > 0 ? Colors.warning : Colors.success} />
              <NeonText variant="label" color={navRoute.incidents.length > 0 ? Colors.warning : Colors.success}
                style={{ fontSize: 14, fontWeight: '900', marginTop: 1 }}>
                {navRoute.incidents.length}
              </NeonText>
              <NeonText variant="caption" color="#6A7A9A" style={{ fontSize: 7, letterSpacing: 0.6 }}>Alertas</NeonText>
            </View>
          </View>
        )}
        {/* Speed gauge */}
        <View style={[styles.driveSpeedGauge, {
          borderColor: isOverspeed ? 'rgba(255,68,68,0.2)' : 'rgba(0,255,170,0.1)',
          backgroundColor: isOverspeed ? 'rgba(255,50,50,0.04)' : lightTheme ? 'rgba(255,255,255,0.12)' : 'rgba(8,8,22,0.15)',
          ...glassWeb(48),
          ...(Platform.OS === 'web' ? {
            boxShadow: isOverspeed
              ? '0 4px 32px rgba(255,68,68,0.2), inset 0 1px 0 rgba(255,255,255,0.06), inset 0 0 24px rgba(255,68,68,0.03)'
              : '0 4px 32px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.08), inset 0 0 24px rgba(0,255,170,0.015)',
          } as any : {}),
        }]}>
          <NeonText variant="caption" color={isOverspeed ? '#FF8888' : '#6A6A8A'} style={{ fontSize: 8, letterSpacing: 1.5, textTransform: 'uppercase' as const, marginBottom: 2 }}>Velocidade</NeonText>
          <NeonText variant="h3" color={isOverspeed ? '#FF4444' : '#fff'} style={{ fontSize: 48, fontWeight: '900', lineHeight: 52 }} glow={isOverspeed ? '#FF4444' : Colors.primary}>
            {currentSpeed}
          </NeonText>
          <NeonText variant="caption" color="#6A6A8A" style={{ fontSize: 10, marginTop: -3, letterSpacing: 1 }}>km/h</NeonText>
        </View>
      </View>

    </View>
  ) : null;

  const overlayMeta: Record<string, { title: string; icon: string; color: string }> = {
    family: { title: 'Família', icon: 'account-group', color: Colors.secondary },
    chain: { title: 'Chain', icon: 'link-variant', color: '#FF9800' },
    profile: { title: 'Perfil', icon: 'account-circle', color: Colors.primary },
  };

  const overlayPanel = activeOverlay ? (
    <View style={styles.overlayContainer}>
      <Pressable style={styles.overlayBackdrop} onPress={() => setActiveOverlay(null)} />
      <View style={[styles.overlaySheet, {
        backgroundColor: lightTheme ? 'rgba(250,252,255,0.82)' : 'rgba(10,10,24,0.78)',
        borderColor: lightTheme ? 'rgba(0,0,0,0.05)' : overlayMeta[activeOverlay].color + '18',
        ...(Platform.OS === 'web' ? {
          backdropFilter: 'blur(40px) saturate(1.4)',
          WebkitBackdropFilter: 'blur(40px) saturate(1.4)',
          animation: 'overlay-slide-in 0.3s cubic-bezier(0.16,1,0.3,1) both',
        } as any : {}),
      }]}>
        <View style={[styles.overlayHeader, {
          borderBottomColor: lightTheme ? 'rgba(0,0,0,0.04)' : overlayMeta[activeOverlay].color + '12',
        }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{
              width: 30, height: 30, borderRadius: 8,
              backgroundColor: overlayMeta[activeOverlay].color + '15',
              borderWidth: 1, borderColor: overlayMeta[activeOverlay].color + '30',
              justifyContent: 'center', alignItems: 'center',
            }}>
              <MaterialCommunityIcons name={overlayMeta[activeOverlay].icon as any} size={16} color={overlayMeta[activeOverlay].color} />
            </View>
            <NeonText variant="h4" color={colors.textPrimary} glow={overlayMeta[activeOverlay].color + '40'}>
              {overlayMeta[activeOverlay].title}
            </NeonText>
          </View>
          <Pressable onPress={() => setActiveOverlay(null)}
            style={({ pressed }) => [styles.overlayCloseBtn, {
              transform: [{ scale: pressed ? 0.88 : 1 }],
              backgroundColor: pressed ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.05)',
              borderColor: pressed ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.08)',
              ...(Platform.OS === 'web' ? { transition: 'all 0.2s ease' } as any : {}),
            }]}>
            <MaterialCommunityIcons name="close" size={18} color={colors.textSecondary} />
          </Pressable>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }}>
          {activeOverlay === 'family' ? <FamilyScreen /> : activeOverlay === 'chain' ? <ChainScreen /> : <ProfileScreen />}
        </ScrollView>
      </View>
    </View>
  ) : null;

  // ── DESKTOP LAYOUT ──
  if (showSidebar) {
    return (
      <View style={[styles.desktopContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.sidebar, {
          width: sidebarWidth,
          backgroundColor: lightTheme ? 'rgba(245,247,252,0.85)' : 'rgba(8,8,20,0.9)',
          borderRightColor: lightTheme ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.05)',
          ...(Platform.OS === 'web' ? { backdropFilter: 'blur(24px)' } as any : {}),
        }]}>
          <View style={styles.sidebarHeader}>
            <View style={[styles.appNameBox, {
              backgroundColor: lightTheme ? 'rgba(255,255,255,0.6)' : 'rgba(0,255,170,0.04)',
              borderColor: lightTheme ? 'rgba(0,0,0,0.06)' : 'rgba(0,255,170,0.10)',
              shadowColor: Colors.primary,
            }]}>
              <LogoMark size={24} color={Colors.primary} />
              <NeonText variant="h3" glow={colors.primaryGlow} style={{ fontFamily: Platform.OS === 'web' ? "'Courier New', monospace" : 'monospace', letterSpacing: 2, fontWeight: '700' }}>ALERT<NeonText variant="h3" color={Colors.primary} style={{ fontFamily: Platform.OS === 'web' ? "'Courier New', monospace" : 'monospace', fontWeight: '400' }}>.IO</NeonText></NeonText>
            </View>
            <NeonText variant="caption" color={colors.textSecondary} style={{ marginTop: 6, letterSpacing: 0.3 }}>{incidents.length} incidentes ativos por perto</NeonText>
            {/* Navigation buttons - row 1: main actions */}
            <View style={[styles.navButtonRow, { marginTop: 12, flexWrap: 'wrap', gap: 6 }]}>
              <TopBarIcon icon="link-variant" label="Chain" active={activeOverlay === 'chain'} color="#FF9800" onPress={() => openOverlay('chain')} />
              <TopBarIcon icon="account-group" label="Família" active={activeOverlay === 'family'} color={Colors.secondary} onPress={() => openOverlay('family')} />
              <TopBarIcon icon="account-circle" label="Perfil" active={activeOverlay === 'profile'} color={Colors.primary} onPress={() => openOverlay('profile')} badge={user?.isGuardian} />
            </View>
            <View style={[styles.navButtonRow, { marginTop: 6, flexWrap: 'wrap', gap: 6 }]}>
              <TopBarIcon icon="steering" label="Condução" active={driveMode} color="#00AAFF" onPress={toggleDriveMode} />
              <TopBarIcon icon="web" label="alert.io" active={false} color="#9C27B0" onPress={() => {
                if (Platform.OS === 'web' && typeof window !== 'undefined') {
                  window.open(LANDING_PAGE_URL, '_blank');
                }
              }} />
            </View>
          </View>

          {incidentDetail && (
            <GlassCard style={styles.sidebarDetail} glowColor={Colors.category[selectedIncident!.category] + '25'}>
              <View style={styles.sidebarDetailClose}>
                <Pressable onPress={() => selectIncident(null)} accessible accessibilityLabel="Desmarcar" accessibilityRole="button">
                  <MaterialCommunityIcons name="close" size={18} color={colors.textTertiary} />
                </Pressable>
              </View>
              {incidentDetail}
            </GlassCard>
          )}

          {/* Stacked layout: Feed on top, Nearby below */}
          <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: Spacing['4xl'] }}>

            {/* ── ATIVIDADE (Live Feed) ── */}
            <View style={{ paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm }}>
              {feedSection}
            </View>

            {/* ── POR PERTO (Nearby Reports) ── */}
            <View style={{ paddingHorizontal: Spacing.md, marginTop: Spacing.md }}>
              <View style={{
                flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8,
                paddingVertical: 4, paddingHorizontal: 4,
                borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border,
              }}>
                <MaterialCommunityIcons name="map-marker-radius" size={13} color={colors.primary} />
                <NeonText variant="caption" color={colors.primary} style={{ fontWeight: '800', fontSize: 9, letterSpacing: 1.2, textTransform: 'uppercase' }}>Por Perto</NeonText>
                <View style={{ flex: 1 }} />
                <View style={{ backgroundColor: colors.primary + '15', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 8 }}>
                  <NeonText variant="caption" color={colors.primary} style={{ fontSize: 8, fontWeight: '700' }}>{nearbyIncidents.length}</NeonText>
                </View>
              </View>
              {nearbyIncidents.map((item, idx) => {
                const catColor = Colors.category[item.category] || '#8A8A9A';
                const sevColor = Colors.severity[item.severity] || '#FFB800';
                const catMeta = getCategoryMeta(item.category);
                const dist = haversineDistance(USER_LOCATION, item.location);
                const distLabel = dist < 1000 ? `${Math.round(dist)}m` : `${(dist / 1000).toFixed(1)}km`;
                const isHovered = hoveredIncidentId === item.id;
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => { haptics.light(); selectIncident(item); }}
                    // @ts-ignore web-only
                    onMouseEnter={() => setHoveredIncidentId(item.id)}
                    onMouseLeave={() => setHoveredIncidentId(null)}
                    style={({ pressed }) => ({
                      flexDirection: 'row', alignItems: 'center', gap: 6,
                      paddingVertical: 6, paddingHorizontal: 6,
                      borderRadius: 8, marginBottom: 1,
                      backgroundColor: isHovered ? catColor + '14' : pressed ? catColor + '0C' : 'transparent',
                      borderLeftWidth: 3,
                      borderLeftColor: isHovered ? catColor : 'transparent',
                      ...(Platform.OS === 'web' ? { transition: 'all 0.18s ease', cursor: 'pointer' } as any : {}),
                    })}
                  >
                    <View style={{
                      width: 28, height: 28, borderRadius: 8,
                      backgroundColor: catColor + '18', borderWidth: 1, borderColor: catColor + '30',
                      justifyContent: 'center', alignItems: 'center', flexShrink: 0,
                    }}>
                      <MaterialCommunityIcons name={catMeta.icon as any} size={14} color={catColor} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <NeonText variant="caption" color={catColor} style={{ fontSize: 8, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }} numberOfLines={1}>{catMeta.label}</NeonText>
                        <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: sevColor }} />
                        {item.isVerified && <NeonText variant="caption" color={Colors.success} style={{ fontSize: 7, fontWeight: '800' }}>✓</NeonText>}
                      </View>
                      <NeonText variant="caption" numberOfLines={1} style={{ fontSize: 10, lineHeight: 13, marginTop: 1 }}>{item.title}</NeonText>
                    </View>
                    <View style={{ alignItems: 'flex-end', flexShrink: 0 }}>
                      <NeonText variant="caption" color={colors.textTertiary} style={{ fontSize: 9, fontWeight: '700' }}>{distLabel}</NeonText>
                      <NeonText variant="caption" color={colors.textTertiary} style={{ fontSize: 7, marginTop: 1 }}>{timeAgo(item.createdAt)}</NeonText>
                    </View>
                  </Pressable>
                );
              })}
              {nearbyIncidents.length === 0 && (
                <View style={{ alignItems: 'center', paddingVertical: Spacing.lg }}>
                  <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.success + '12', justifyContent: 'center', alignItems: 'center', marginBottom: 8 }}>
                    <MaterialCommunityIcons name="shield-check" size={24} color={Colors.success} />
                  </View>
                  <NeonText variant="caption" color={Colors.success} style={{ fontWeight: '700', fontSize: 10 }}>Área Segura</NeonText>
                  <NeonText variant="caption" color={colors.textTertiary} style={{ marginTop: 2, textAlign: 'center', fontSize: 9 }}>Nenhum incidente reportado por perto</NeonText>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Branded landing page link */}
          <Pressable
            onPress={() => { if (Platform.OS === 'web' && typeof window !== 'undefined') window.open(LANDING_PAGE_URL, '_blank'); }}
            style={({ pressed }) => ({
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
              paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth,
              borderTopColor: lightTheme ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)',
              backgroundColor: pressed ? Colors.primary + '08' : 'transparent',
              ...(Platform.OS === 'web' ? { cursor: 'pointer', transition: 'background 0.2s ease' } as any : {}),
            })}
            accessibilityLabel="Visitar www.alert.io" accessibilityRole="link"
          >
            <LogoMark size={16} color={Colors.primary} spinning={false} />
            <NeonText variant="caption" color={Colors.primary} style={{ fontSize: 11, fontWeight: '700', letterSpacing: 0.5 }}>www.alert.io</NeonText>
            <MaterialCommunityIcons name="open-in-new" size={12} color={Colors.primary + '80'} />
          </Pressable>
        </View>

        <View style={styles.mapArea}>
          <AttentionMap markers={mapMarkers} userLocation={USER_LOCATION} familyMembers={familyMembers}
            onMarkerPress={handleMarkerPress} onMapPress={handleMapPress}
            onMapReady={() => {}} selectedMarkerId={selectedIncident?.id}
            highlightedMarkerId={hoveredIncidentId}
            lightTheme={lightTheme} guardScan={guardScan} navigation={navRoute}
            driveMode={driveMode} speedCameras={speedCameras} focusLocation={focusLocation}
            cameras={publicCameras} onCameraPress={(cam) => setViewingCamera(cam)}
            showCameras={showCameras} onToggleCameras={toggleCameras} />

          {viewingCamera && (
            <CameraViewer
              camera={viewingCamera}
              onClose={() => setViewingCamera(null)}
              onReportIncident={(lat, lng) => {
                setViewingCamera(null);
                setFocusLocation({ latitude: lat, longitude: lng, zoom: 17 });
              }}
            />
          )}

          {!driveMode && (
            <View style={[styles.desktopControls, {
              backgroundColor: lightTheme ? 'rgba(255,255,255,0.75)' : 'rgba(8,8,20,0.6)',
              ...(Platform.OS === 'web' ? { backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' } as any : {}),
            }]}>
              <MapFab icon="plus" color={Colors.warning} label="Reportar" onPress={handleReportPress} />
              <MapFab icon="navigation-variant" color="#00AAFF" label="Navegar" active={navOpen} onPress={() => { haptics.medium(); setNavOpen(!navOpen); setScanOpen(false); }} />
              <MapFab icon="radar" color={colors.primary} label="GuardScan" active={scanOpen} onPress={() => { haptics.medium(); setScanOpen(!scanOpen); setNavOpen(false); }} />
              <MapFab icon="cctv" color="#00BCD4" label={camerasLoading ? 'A carregar...' : `Câmeras (${publicCameras.length})`} active={showCameras} onPress={toggleCameras} />
            </View>
          )}

          {navPanel && <View style={[styles.navPanelPos, driveMode && { zIndex: 30 }]}>{navPanel}</View>}
          {guardScanPanel && <View style={[styles.scanPanelPos, driveMode && { zIndex: 30 }]}>{guardScanPanel}</View>}

          {scanning && (
            <View style={styles.scanLabel}>
              <GlassCard style={styles.scanLabelCard}>
                <MaterialCommunityIcons name="radar" size={14} color={colors.primary} />
                <NeonText variant="caption" color={colors.primary} style={{ marginLeft: 4 }}>A escanear {formatDistance(scanRadius)}...</NeonText>
              </GlassCard>
            </View>
          )}

          {driveHUD}
          {overlayPanel}
        </View>

        {showTutorial && (
          <TutorialOverlay sidebarWidth={sidebarWidth} isDesktop onComplete={completeTutorial} />
        )}
      </View>
    );
  }

  // ── MOBILE LAYOUT ──
  return (
    <View style={[styles.mobileContainer, { backgroundColor: colors.background }]}>
      <AttentionMap markers={mapMarkers} userLocation={USER_LOCATION} familyMembers={familyMembers}
        onMarkerPress={handleMarkerPress} onMapPress={handleMapPress}
        onMapReady={() => {}} selectedMarkerId={selectedIncident?.id}
        highlightedMarkerId={hoveredIncidentId}
        lightTheme={lightTheme} guardScan={guardScan} navigation={navRoute}
        driveMode={driveMode} speedCameras={speedCameras} focusLocation={focusLocation}
        cameras={publicCameras} onCameraPress={(cam) => setViewingCamera(cam)}
        showCameras={showCameras} onToggleCameras={toggleCameras} />

      {viewingCamera && (
        <CameraViewer
          camera={viewingCamera}
          onClose={() => setViewingCamera(null)}
          onReportIncident={(lat, lng) => {
            setViewingCamera(null);
            setFocusLocation({ latitude: lat, longitude: lng, zoom: 17 });
          }}
        />
      )}

      {!driveMode && (
        <View style={[styles.mobileTopBar, {
          backgroundColor: lightTheme ? 'rgba(255,255,255,0.75)' : 'rgba(8,8,20,0.7)',
          ...(Platform.OS === 'web' ? { backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' } as any : {}),
          flexDirection: 'column', alignItems: 'stretch',
        }]}>
          <View style={[styles.appNameBoxMobile, {
            backgroundColor: lightTheme ? 'rgba(255,255,255,0.6)' : 'rgba(0,255,170,0.04)',
            borderColor: lightTheme ? 'rgba(0,0,0,0.06)' : 'rgba(0,255,170,0.10)',
            shadowColor: Colors.primary,
            alignSelf: 'flex-start',
          }]}>
            <LogoMark size={20} color={Colors.primary} />
            <NeonText variant="h4" glow={colors.primaryGlow} style={{ fontFamily: Platform.OS === 'web' ? "'Courier New', monospace" : 'monospace', letterSpacing: 2, fontWeight: '700' }}>ALERT<NeonText variant="h4" color={Colors.primary} style={{ fontFamily: Platform.OS === 'web' ? "'Courier New', monospace" : 'monospace', fontWeight: '400' }}>.IO</NeonText></NeonText>
          </View>
          <View style={[styles.navButtonRow, { marginTop: 6, flexWrap: 'wrap', gap: 5 }]}>
            <TopBarIcon icon="link-variant" label="Chain" active={activeOverlay === 'chain'} color="#FF9800" onPress={() => openOverlay('chain')} compact />
            <TopBarIcon icon="account-group" label="Família" active={activeOverlay === 'family'} color={Colors.secondary} onPress={() => openOverlay('family')} compact />
            <TopBarIcon icon="account-circle" label="Perfil" active={activeOverlay === 'profile'} color={Colors.primary} onPress={() => openOverlay('profile')} badge={user?.isGuardian} compact />
            <TopBarIcon icon="steering" label="Condução" active={driveMode} color="#00AAFF" onPress={toggleDriveMode} compact />
            <TopBarIcon icon="web" label="alert.io" active={false} color="#9C27B0" onPress={() => {
              if (Platform.OS === 'web' && typeof window !== 'undefined') {
                window.open(LANDING_PAGE_URL, '_blank');
              }
            }} compact />
          </View>
        </View>
      )}

      {!driveMode && (
        <View style={[styles.mobileBottomFabs, {
          backgroundColor: lightTheme ? 'rgba(255,255,255,0.75)' : 'rgba(8,8,20,0.65)',
          ...(Platform.OS === 'web' ? { backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' } as any : {}),
        }]}>
          <MapFab icon="plus" color={Colors.warning} label="Reportar" onPress={handleReportPress} />
          <MapFab icon="navigation-variant" color="#00AAFF" label="Navegar" active={navOpen} onPress={() => { haptics.medium(); setNavOpen(!navOpen); setScanOpen(false); }} />
          <MapFab icon="radar" color={colors.primary} label="GuardScan" active={scanOpen} onPress={() => { haptics.medium(); setScanOpen(!scanOpen); setNavOpen(false); }} />
          <MapFab icon="cctv" color="#00BCD4" label={camerasLoading ? 'A carregar...' : `Câmeras (${publicCameras.length})`} active={showCameras} onPress={toggleCameras} />
        </View>
      )}

      {navPanel && <View style={[styles.navPanelPosMobile, driveMode && { zIndex: 30, top: 60 }]}>{navPanel}</View>}
      {guardScanPanel && <View style={[styles.scanPanelPosMobile, driveMode && { zIndex: 30, top: 60 }]}>{guardScanPanel}</View>}

      {selectedIncident && (
        <View style={[styles.mobileSheet, {
          backgroundColor: lightTheme ? 'rgba(245,247,252,0.95)' : 'rgba(10,10,22,0.92)',
          ...(Platform.OS === 'web' ? { backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)' } as any : {}),
        }]}>
          <ScrollView showsVerticalScrollIndicator={false} style={styles.mobileSheetScroll}>{incidentDetail}</ScrollView>
        </View>
      )}

      {driveHUD}
      {overlayPanel}

      {showTutorial && (
        <TutorialOverlay sidebarWidth={0} isDesktop={false} onComplete={completeTutorial} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  desktopContainer: { flex: 1, flexDirection: 'row' },
  sidebar: { borderRightWidth: 1, flexShrink: 0 },
  sidebarHeader: { paddingTop: Platform.OS === 'web' ? 20 : 60, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md },
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
    paddingHorizontal: 10, paddingVertical: 10,
    borderRadius: 18, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 20,
    shadowOffset: { width: 0, height: 4 }, elevation: 14,
  },
  appNameBox: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 10, borderWidth: 1,
    shadowOpacity: 0.15, shadowRadius: 10,
    shadowOffset: { width: 0, height: 1 }, elevation: 3,
    ...(Platform.OS === 'web' ? { transition: 'all 0.3s ease' } as any : {}),
  },
  appNameBoxMobile: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 8, borderWidth: 1,
    shadowOpacity: 0.15, shadowRadius: 8,
    shadowOffset: { width: 0, height: 1 }, elevation: 3,
    ...(Platform.OS === 'web' ? { transition: 'all 0.3s ease' } as any : {}),
  },
  navButtonRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', gap: 6,
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
    paddingBottom: Spacing.md, paddingHorizontal: Spacing.md,
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', zIndex: 10,
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 }, elevation: 10,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.03)',
  },
  mobileLeftFabs: { position: 'absolute', bottom: 90, left: 16, gap: Spacing.sm, zIndex: 20 },
  mobileBottomFabs: {
    position: 'absolute', bottom: 24, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'center', gap: Spacing.md,
    alignSelf: 'center',
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 22, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    shadowColor: '#000', shadowOpacity: 0.45, shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 }, elevation: 16,
    zIndex: 20,
    ...(Platform.OS === 'web' ? { width: 'fit-content', marginLeft: 'auto', marginRight: 'auto' } as any : {}),
  },
  mobileFab: {
    display: 'none',
  },
  mobileSheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0, maxHeight: '55%',
    borderTopLeftRadius: Radius['3xl'], borderTopRightRadius: Radius['3xl'],
    paddingTop: Spacing.md,
    shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 28, elevation: 22, zIndex: 15,
    borderWidth: 1, borderBottomWidth: 0,
    borderColor: 'rgba(255,255,255,0.06)',
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
    gap: Spacing.sm, paddingVertical: Spacing.md, borderRadius: Radius.lg, borderWidth: 1, minHeight: 48,
    ...(Platform.OS === 'web' ? { transition: 'all 0.2s ease', cursor: 'pointer' } as any : {}),
  },
  detailReporter: { flexDirection: 'row', alignItems: 'center' },

  // Drive Mode HUD
  driveHudContainer: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 25,
  },
  driveTopLeftBar: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 54 : Platform.OS === 'android' ? 36 : 16,
    left: 16,
    gap: 8, zIndex: 26,
  },
  driveModePill: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 22, borderWidth: 1,
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 }, elevation: 8,
  },
  driveDestBadge: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 18,
    borderWidth: 1, borderColor: 'rgba(0,255,170,0.15)',
    maxWidth: 200,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 }, elevation: 6,
  },
  driveTopRightControls: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 54 : Platform.OS === 'android' ? 36 : 16,
    right: 16,
    gap: 8, zIndex: 26,
  },
  driveAlertArea: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 110 : Platform.OS === 'android' ? 90 : 70,
    left: 0, right: 0,
    alignItems: 'center', zIndex: 26,
    pointerEvents: 'box-none' as const,
  },
  driveAlertBanner: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 8, paddingHorizontal: 12,
    borderRadius: 16, borderWidth: 1,
    marginBottom: 6, maxWidth: 380,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 }, elevation: 8,
  },
  driveBottomLeft: {
    position: 'absolute', bottom: 28, left: 20, zIndex: 26,
  },
  driveSpeedLimitSign: {
    width: 60, height: 60, borderRadius: 30, borderWidth: 3.5,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#FF3C3C', shadowOpacity: 0.25, shadowRadius: 12,
    shadowOffset: { width: 0, height: 2 }, elevation: 10,
  },
  driveBottomRight: {
    position: 'absolute', bottom: 20, right: 16, zIndex: 26,
    alignItems: 'flex-end',
  },
  driveSpeedGauge: {
    alignItems: 'center',
    paddingHorizontal: 28, paddingVertical: 12,
    borderRadius: 22, borderWidth: 1.5,
    shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 }, elevation: 12,
  },
  driveNavStatsRow: {
    flexDirection: 'row', gap: 6,
    marginBottom: 8,
  },
  driveNavStatCard: {
    alignItems: 'center',
    paddingVertical: 6, paddingHorizontal: 10,
    borderRadius: 12, borderWidth: 1,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }, elevation: 4,
  } as any,
  driveControlBtn: {
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, paddingHorizontal: 10,
    borderRadius: 16, borderWidth: 1, minWidth: 56,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 }, elevation: 6,
    ...(Platform.OS === 'web' ? { cursor: 'pointer', transition: 'all 0.25s cubic-bezier(0.25, 0.8, 0.25, 1)' } as any : {}),
  },

  // Overlay for Family / Profile
  overlayContainer: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 30,
    justifyContent: 'center', alignItems: 'center',
  },
  overlayBackdrop: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
    ...(Platform.OS === 'web' ? { backdropFilter: 'blur(4px)' } as any : {}),
  },
  overlaySheet: {
    width: '92%', maxWidth: 520, maxHeight: '85%',
    borderRadius: 22, borderWidth: 1,
    shadowColor: '#000', shadowOpacity: 0.6, shadowRadius: 48, elevation: 32,
    overflow: 'hidden',
  },
  overlayHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  overlayCloseBtn: {
    width: 32, height: 32, borderRadius: 8, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
});
