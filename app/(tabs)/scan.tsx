import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, StyleSheet, Pressable, Platform, Animated, Easing, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AttentionMap } from '../../src/components/map/AttentionMap';
import type { MapMarker, GuardScanConfig } from '../../src/components/map/types';
import { NeonText } from '../../src/components/ui/NeonText';
import { LogoMark } from '../../src/components/ui/LogoMark';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { useA11y, announce } from '../../src/hooks/useAccessibility';
import { useHaptics } from '../../src/hooks/useHaptics';
import { useResponsive } from '../../src/hooks/useResponsive';
import { useIncidentStore } from '../../src/stores/incidentStore';
import { useAccessibilityStore } from '../../src/stores/accessibilityStore';
import { Colors } from '../../src/theme/colors';
import { Spacing, Radius } from '../../src/theme/spacing';
import { getCategoryMeta } from '../../src/constants/categories';
import { timeAgo, formatDistance } from '../../src/services/mockData';
import type { Incident } from '../../src/types';

const EMOJI_MAP: Record<string, string> = {
  'shield-alert': '🚨', 'car-crash': '💥', 'eye-outline': '👁', 'fire': '🔥',
  'police-badge': '🚔', 'medical-bag': '🏥', 'traffic-light': '🚦', 'volume-high': '📢',
  'alert-outline': '⚠️', 'alert-octagon': '⚠️', 'dots-horizontal-circle': '🔵',
};

const USER_LOCATION = { latitude: 41.2356, longitude: -8.6200 };

const RADIUS_OPTIONS = [
  { label: '500m', value: 500 },
  { label: '1km', value: 1000 },
  { label: '2km', value: 2000 },
  { label: '3km', value: 3000 },
  { label: '5km', value: 5000 },
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

export default function ScanScreen() {
  const { colors, minTarget } = useA11y();
  const haptics = useHaptics();
  const { showSidebar } = useResponsive();
  const incidents = useIncidentStore((s) => s.incidents);
  const loadIncidents = useIncidentStore((s) => s.loadIncidents);
  const lightTheme = useAccessibilityStore((s) => s.lightTheme);

  const [selectedRadius, setSelectedRadius] = useState(2000);
  const [scanning, setScanning] = useState(false);
  const [scanDone, setScanDone] = useState(false);
  const [foundIncidents, setFoundIncidents] = useState<(Incident & { distance: number })[]>([]);
  const [scanCenter] = useState(USER_LOCATION);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => { loadIncidents(); }, []);

  useEffect(() => {
    if (scanning) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.15, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [scanning]);

  const guardScan: GuardScanConfig | null = (scanning || scanDone)
    ? { active: true, scanning, radiusMeters: selectedRadius, center: scanCenter }
    : null;

  const mapMarkers: MapMarker[] = (scanDone ? foundIncidents : incidents).map((inc) => ({
    id: inc.id,
    coordinate: inc.location,
    incident: inc,
  }));

  const startScan = useCallback(async () => {
    haptics.medium();
    setScanning(true);
    setScanDone(false);
    setFoundIncidents([]);
    announce(`A escanear incidentes num raio de ${formatDistance(selectedRadius)}`);

    await loadIncidents();

    const freshIncidents = useIncidentStore.getState().incidents;

    setTimeout(() => {
      const found = freshIncidents
        .map((inc) => ({ ...inc, distance: haversineDistance(scanCenter, inc.location) }))
        .filter((inc) => inc.distance <= selectedRadius)
        .sort((a, b) => a.distance - b.distance);

      setFoundIncidents(found);
      setScanning(false);
      setScanDone(true);
      haptics.success();
      announce(`Varredura completa. ${found.length} incidentes encontrados num raio de ${formatDistance(selectedRadius)}`);
    }, 2000);
  }, [selectedRadius, scanCenter]);

  const handleMarkerPress = useCallback((marker: MapMarker) => {
    haptics.light();
    announce(`${getCategoryMeta(marker.incident.category).label}: ${marker.incident.title}`);
  }, []);

  const resultPanel = (
    <View style={[styles.panel, { backgroundColor: showSidebar ? colors.background : colors.surface }]}>
      <View style={styles.panelHeader}>
        <View style={styles.panelTitleRow}>
          <LogoMark size={28} color={Colors.primary} />
          <NeonText variant="h3" glow={colors.primaryGlow} style={{ marginLeft: Spacing.sm }}>
            GuardScan
          </NeonText>
        </View>
        <NeonText variant="caption" color={colors.textSecondary}>
          Varredura em tempo real de incidentes na área
        </NeonText>
      </View>

      {/* Radius selector */}
      <View style={styles.radiusRow} accessible accessibilityRole="radiogroup"
        accessibilityLabel={`Raio de varredura: ${formatDistance(selectedRadius)}`}>
        {RADIUS_OPTIONS.map((opt) => (
          <Pressable key={opt.value}
            onPress={() => { haptics.selection(); setSelectedRadius(opt.value); setScanDone(false); }}
            style={({ pressed }) => [styles.radiusChip, {
              backgroundColor: selectedRadius === opt.value ? colors.primary + '20' : pressed ? 'rgba(255,255,255,0.08)' : colors.glass.background,
              borderColor: selectedRadius === opt.value ? colors.primary : colors.border,
              minHeight: minTarget, minWidth: minTarget,
              transform: [{ scale: pressed ? 0.92 : 1 }],
            }]}
            accessible accessibilityLabel={`Raio de ${opt.label}`}
            accessibilityRole="radio" accessibilityState={{ selected: selectedRadius === opt.value }}>
            <NeonText variant="buttonSm" color={selectedRadius === opt.value ? colors.primary : colors.textSecondary}>
              {opt.label}
            </NeonText>
          </Pressable>
        ))}
      </View>

      {/* Scan button */}
      <Pressable onPress={startScan} disabled={scanning}
        style={({ pressed }) => [styles.scanButton, {
          backgroundColor: scanning ? colors.primary + '20' : pressed ? colors.primaryDim : colors.primary,
          opacity: scanning ? 0.7 : 1,
        }]}
        accessible accessibilityLabel={scanning ? 'Escaneando...' : 'Iniciar GuardScan'}
        accessibilityRole="button">
        <Animated.View style={{ transform: [{ scale: scanning ? pulseAnim : 1 }], flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
          <MaterialCommunityIcons name="radar" size={20} color={scanning ? colors.primary : colors.background} />
          <NeonText variant="button" color={scanning ? colors.primary : colors.background}>
            {scanning ? 'A escanear...' : 'Iniciar Varredura'}
          </NeonText>
        </Animated.View>
      </Pressable>

      {/* Results */}
      {scanDone && (
        <View style={styles.results}>
          <View style={styles.resultsHeader}>
            <NeonText variant="label" color={colors.primary}>
              {foundIncidents.length} incidentes encontrados
            </NeonText>
            <NeonText variant="caption" color={colors.textTertiary}>
              num raio de {formatDistance(selectedRadius)}
            </NeonText>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.resultsList}
            contentContainerStyle={styles.resultsContent}>
            {foundIncidents.map((inc) => {
              const catMeta = getCategoryMeta(inc.category);
              const catColor = Colors.category[inc.category];
              return (
                <GlassCard key={inc.id} style={styles.resultCard}
                  accessibilityLabel={`${catMeta.label}: ${inc.title}, ${formatDistance(inc.distance)} away`}>
                  <View style={styles.resultRow}>
                    <View style={[styles.resultIcon, { backgroundColor: catColor + '18' }]}>
                      <View style={[styles.sevDot, { backgroundColor: Colors.severity[inc.severity] }]} />
                      <NeonText variant="caption" color={catColor} style={{ fontSize: 16 }}>
                        {EMOJI_MAP[catMeta.icon] || '⚠️'}
                      </NeonText>
                    </View>
                    <View style={styles.resultContent}>
                      <NeonText variant="bodySm" numberOfLines={1} style={{ fontWeight: '600' }}>
                        {inc.title}
                      </NeonText>
                      <View style={styles.resultMeta}>
                        <NeonText variant="caption" color={catColor}>{catMeta.label}</NeonText>
                        <NeonText variant="caption" color={colors.textTertiary}> • </NeonText>
                        <NeonText variant="caption" color={colors.textTertiary}>{formatDistance(inc.distance)}</NeonText>
                        <NeonText variant="caption" color={colors.textTertiary}> • </NeonText>
                        <NeonText variant="caption" color={colors.textTertiary}>{timeAgo(inc.createdAt)}</NeonText>
                      </View>
                      <View style={styles.resultStats}>
                        <NeonText variant="caption" color={Colors.success}>✓{inc.confirmCount}</NeonText>
                        <NeonText variant="caption" color={Colors.error}>✗{inc.denyCount}</NeonText>
                        <NeonText variant="caption" color={Colors.warning}>👁 {inc.views}</NeonText>
                        {inc.isVerified && (
                          <NeonText variant="caption" color={Colors.success} glow={Colors.success} style={{ fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' }}>Verificado</NeonText>
                        )}
                      </View>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textTertiary} />
                  </View>
                </GlassCard>
              );
            })}
            {foundIncidents.length === 0 && (
              <View style={styles.emptyResults}>
                <MaterialCommunityIcons name="check-circle" size={36} color={Colors.success} />
                <NeonText variant="body" color={Colors.success} style={{ marginTop: Spacing.sm }}>
                  Área limpa!
                </NeonText>
                <NeonText variant="caption" color={colors.textTertiary} style={{ marginTop: Spacing.xs }}>
                  Nenhum incidente num raio de {formatDistance(selectedRadius)}
                </NeonText>
              </View>
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );

  if (showSidebar) {
    return (
      <View style={[styles.desktopContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.sidebar, { borderRightColor: colors.border }]}>
          {resultPanel}
        </View>
        <View style={styles.mapArea}>
          <AttentionMap
            markers={mapMarkers}
            userLocation={USER_LOCATION}
            onMarkerPress={handleMarkerPress}
            onMapPress={() => {}}
            guardScan={guardScan}
            lightTheme={lightTheme}
          />
          {scanning && (
            <View style={styles.scanningOverlayLabel}>
              <GlassCard style={styles.scanLabelCard}>
                <MaterialCommunityIcons name="radar" size={16} color={colors.primary} />
                <NeonText variant="bodySm" color={colors.primary} style={{ marginLeft: Spacing.xs }}>
                  Escaneando raio de {formatDistance(selectedRadius)}...
                </NeonText>
              </GlassCard>
            </View>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.mobileContainer, { backgroundColor: colors.background }]}>
      <AttentionMap
        markers={mapMarkers}
        userLocation={USER_LOCATION}
        onMarkerPress={handleMarkerPress}
        onMapPress={() => {}}
        guardScan={guardScan}
        lightTheme={lightTheme}
      />

      {/* Top bar */}
      <View style={[styles.topBar, { backgroundColor: colors.scrim }]}>
        <View style={styles.panelTitleRow}>
          <LogoMark size={28} color={Colors.primary} />
          <NeonText variant="h4" glow={colors.primaryGlow} style={{ marginLeft: Spacing.xs }}>
            GuardScan
          </NeonText>
        </View>
        {scanDone && (
          <NeonText variant="bodySm" color={colors.primary}>{foundIncidents.length} found</NeonText>
        )}
      </View>

      {/* Bottom controls */}
      <View style={[styles.bottomControls, { backgroundColor: colors.surface }]}>
        <View style={styles.radiusRow}>
          {RADIUS_OPTIONS.map((opt) => (
            <Pressable key={opt.value}
              onPress={() => { haptics.selection(); setSelectedRadius(opt.value); setScanDone(false); }}
              style={({ pressed }) => [styles.radiusChipSm, {
                backgroundColor: selectedRadius === opt.value ? colors.primary + '20' : pressed ? 'rgba(255,255,255,0.06)' : 'transparent',
                borderColor: selectedRadius === opt.value ? colors.primary : colors.border,
                transform: [{ scale: pressed ? 0.92 : 1 }],
              }]}>
              <NeonText variant="caption" color={selectedRadius === opt.value ? colors.primary : colors.textSecondary}>
                {opt.label}
              </NeonText>
            </Pressable>
          ))}
        </View>

        <Pressable onPress={startScan} disabled={scanning}
          style={({ pressed }) => [styles.scanButtonMobile, {
            backgroundColor: scanning ? colors.primary + '20' : pressed ? colors.primaryDim : colors.primary,
            transform: [{ scale: pressed ? 0.94 : 1 }],
          }]}>
          <MaterialCommunityIcons name="radar" size={18} color={scanning ? colors.primary : colors.background} />
          <NeonText variant="buttonSm" color={scanning ? colors.primary : colors.background} style={{ marginLeft: Spacing.xs }}>
            {scanning ? 'Escaneando...' : 'Escanear'}
          </NeonText>
        </Pressable>

        {scanDone && foundIncidents.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mobileResults}
            contentContainerStyle={styles.mobileResultsContent}>
            {foundIncidents.slice(0, 5).map((inc) => {
              const catMeta = getCategoryMeta(inc.category);
              return (
                <GlassCard key={inc.id} style={styles.mobileResultCard}>
                  <NeonText variant="caption" color={Colors.category[inc.category]} style={{ fontWeight: '700' }}>
                    {catMeta.label}
                  </NeonText>
                  <NeonText variant="caption" numberOfLines={1} style={{ maxWidth: 140 }}>
                    {inc.title}
                  </NeonText>
                  <NeonText variant="caption" color={colors.textTertiary}>
                    {formatDistance(inc.distance)}
                  </NeonText>
                </GlassCard>
              );
            })}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  desktopContainer: { flex: 1, flexDirection: 'row' },
  sidebar: { width: 380, borderRightWidth: 1, flexShrink: 0 },
  mapArea: { flex: 1, position: 'relative' },
  mobileContainer: { flex: 1, position: 'relative' },

  panel: { flex: 1 },
  panelHeader: {
    paddingTop: Platform.OS === 'web' ? 24 : Platform.OS === 'ios' ? 64 : 44,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  panelTitleRow: { flexDirection: 'row', alignItems: 'center' },

  radiusRow: {
    flexDirection: 'row', justifyContent: 'center', gap: Spacing.sm,
    paddingHorizontal: Spacing.lg, marginBottom: Spacing.md,
  },
  radiusChip: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: Radius.full, borderWidth: 1,
    justifyContent: 'center', alignItems: 'center',
    ...(Platform.OS === 'web' ? { transition: 'all 0.2s ease', cursor: 'pointer' } as any : {}),
  },
  radiusChipSm: {
    paddingHorizontal: Spacing.sm, paddingVertical: 4,
    borderRadius: Radius.full, borderWidth: 1,
  },

  scanButton: {
    marginHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.lg,
    ...(Platform.OS === 'web' ? { transition: 'all 0.25s ease', cursor: 'pointer' } as any : {}),
  },
  scanButtonMobile: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: Spacing.sm, paddingHorizontal: Spacing.xl,
    borderRadius: Radius.full, alignSelf: 'center', marginBottom: Spacing.sm,
  },

  results: { flex: 1 },
  resultsHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.xl, marginBottom: Spacing.md,
  },
  resultsList: { flex: 1 },
  resultsContent: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing['5xl'], gap: Spacing.sm },
  resultCard: {
    padding: Spacing.md,
    ...(Platform.OS === 'web' ? { transition: 'all 0.2s ease' } as any : {}),
  },
  resultRow: { flexDirection: 'row', alignItems: 'center' },
  resultIcon: {
    width: 38, height: 38, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center', position: 'relative',
  },
  sevDot: {
    position: 'absolute', top: -2, right: -2,
    width: 8, height: 8, borderRadius: 4,
  },
  resultContent: { flex: 1, marginLeft: Spacing.md },
  resultMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  resultStats: { flexDirection: 'row', gap: Spacing.md, marginTop: 4 },

  emptyResults: { alignItems: 'center', paddingVertical: Spacing['3xl'] },

  topBar: {
    position: 'absolute', top: 0, left: 0, right: 0,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: Spacing.sm, paddingHorizontal: Spacing.xl,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    zIndex: 10,
  },
  bottomControls: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingTop: Spacing.md, paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    borderTopLeftRadius: Radius['2xl'], borderTopRightRadius: Radius['2xl'],
    zIndex: 10,
  },
  mobileResults: { maxHeight: 80, marginTop: Spacing.xs },
  mobileResultsContent: { paddingHorizontal: Spacing.md, gap: Spacing.sm },
  mobileResultCard: { padding: Spacing.sm, minWidth: 160 },

  scanningOverlayLabel: {
    position: 'absolute', top: 20, left: 0, right: 0,
    alignItems: 'center', zIndex: 10,
  },
  scanLabelCard: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: Spacing.sm, paddingHorizontal: Spacing.lg,
  },
});
