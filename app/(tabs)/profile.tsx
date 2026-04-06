import React, { useRef } from 'react';
import { View, StyleSheet, ScrollView, Platform, Pressable, Linking, Animated, Image } from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NeonText } from '../../src/components/ui/NeonText';
import { NeonButton } from '../../src/components/ui/NeonButton';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { BadgeIcon } from '../../src/components/ui/BadgeIcon';
import { useA11y, announce } from '../../src/hooks/useAccessibility';
import { useHaptics } from '../../src/hooks/useHaptics';
import { useResponsive } from '../../src/hooks/useResponsive';
import { useAuthStore } from '../../src/stores/authStore';
import { getBadgeForReputation, getProgressToNextLevel } from '../../src/constants/badges';
import { LogoMark } from '../../src/components/ui/LogoMark';
import { Colors } from '../../src/theme/colors';
import { Spacing, Radius } from '../../src/theme/spacing';
import { useLanguageStore, AVAILABLE_LANGUAGES } from '../../src/i18n';
import { useAccessibilityStore } from '../../src/stores/accessibilityStore';

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: string | number; color: string }) {
  const { colors } = useA11y();
  return (
    <GlassCard style={styles.statCard} accessibilityLabel={`${label}: ${value}`}>
      <MaterialCommunityIcons name={icon as any} size={22} color={color} />
      <NeonText variant="h4" color={color} style={styles.statValue}>{value}</NeonText>
      <NeonText variant="caption" color={colors.textTertiary}>{label}</NeonText>
    </GlassCard>
  );
}

function MenuRow({ icon, label, hint, onPress, color, danger, badge }: {
  icon: string; label: string; hint: string; onPress: () => void;
  color?: string; danger?: boolean; badge?: string;
}) {
  const { colors, minTarget } = useA11y();
  const haptics = useHaptics();
  return (
    <Pressable onPress={() => { haptics.light(); onPress(); }}
      style={({ pressed }) => [styles.menuRow, {
        minHeight: minTarget,
        backgroundColor: pressed ? 'rgba(255,255,255,0.04)' : 'transparent',
        transform: [{ scale: pressed ? 0.98 : 1 }],
      }]}
      accessible accessibilityLabel={label} accessibilityHint={hint} accessibilityRole="button">
      <MaterialCommunityIcons name={icon as any} size={22}
        color={danger ? Colors.error : color ?? colors.textSecondary} />
      <NeonText variant="body" color={danger ? Colors.error : colors.textPrimary} style={styles.menuLabel}>
        {label}
      </NeonText>
      {badge && (
        <View style={[styles.menuBadge, { backgroundColor: Colors.primary + '20', borderWidth: 1, borderColor: Colors.primary + '30' }]}>
          <NeonText variant="caption" color={Colors.primary} style={{ fontWeight: '700', fontSize: 10 }}>{badge}</NeonText>
        </View>
      )}
      <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textTertiary} />
    </Pressable>
  );
}

const EMERGENCY_SERVICES = [
  { id: 'police', label: 'Polícia', icon: 'police-badge', color: '#3B7AFF', phone: '190' },
  { id: 'fire', label: 'Bombeiros', icon: 'fire-truck', color: '#FF5522', phone: '193' },
  { id: 'ambulance', label: 'Ambulância', icon: 'ambulance', color: '#FF3B7A', phone: '192' },
  { id: 'social', label: 'Serviço Social', icon: 'hand-heart', color: '#7B61FF', phone: '100' },
  { id: 'animals', label: 'Proteção Animal', icon: 'paw', color: '#FFB800', phone: '0800-111-000' },
  { id: 'civil', label: 'Defesa Civil', icon: 'shield-alert', color: '#00D4FF', phone: '199' },
];

function EmergencyButton({ service }: { service: typeof EMERGENCY_SERVICES[number] }) {
  const haptics = useHaptics();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.9, useNativeDriver: true, speed: 50, bounciness: 4 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 8 }).start();
  };

  const handleCall = () => {
    haptics.heavy();
    const phoneUrl = `tel:${service.phone}`;
    if (Platform.OS === 'web') {
      announce(`Calling ${service.label} at ${service.phone}`);
      try { window.open(phoneUrl, '_self'); } catch { announce(`Call ${service.phone} for ${service.label}`); }
    } else {
      Linking.canOpenURL(phoneUrl).then((supported) => {
        if (supported) { Linking.openURL(phoneUrl); }
        else { announce(`Call ${service.phone} for ${service.label}`); }
      });
    }
  };

  return (
    <Animated.View style={[styles.emergencyBtnWrapper, { transform: [{ scale: scaleAnim }] }]}>
      <Pressable
        onPress={handleCall}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={({ pressed }) => [
          styles.emergencyBtn,
          {
            backgroundColor: pressed ? service.color + '30' : service.color + '12',
            borderColor: service.color + '40',
            shadowColor: pressed ? service.color : 'transparent',
            shadowOpacity: pressed ? 0.5 : 0,
            shadowRadius: 12,
            elevation: pressed ? 8 : 0,
          },
        ]}
        accessible
        accessibilityLabel={`Ligar ${service.label} no ${service.phone}`}
        accessibilityRole="button"
      >
        <View style={[styles.emergencyIconBg, { backgroundColor: service.color + '20' }]}>
          <MaterialCommunityIcons name={service.icon as any} size={22} color={service.color} />
        </View>
        <NeonText variant="caption" color={service.color} style={styles.emergencyLabel} numberOfLines={1}>
          {service.label}
        </NeonText>
        <NeonText variant="caption" color={'rgba(255,255,255,0.4)'} style={{ fontSize: 9 }}>
          {service.phone}
        </NeonText>
      </Pressable>
    </Animated.View>
  );
}

export default function ProfileScreen() {
  const { colors } = useA11y();
  const haptics = useHaptics();
  const { isDesktop } = useResponsive();
  const { user, signOut } = useAuthStore();
  const currentLocale = useLanguageStore((s) => s.locale);
  const setLocale = useLanguageStore((s) => s.setLocale);
  const isLightTheme = useAccessibilityStore((s) => s.lightTheme);
  const setA11y = useAccessibilityStore((s) => s.set);

  if (!user) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <MaterialCommunityIcons name="shield-account" size={64} color={colors.textTertiary} />
        <NeonText variant="h4" color={colors.textSecondary} style={{ marginTop: Spacing.lg }}>
          Entre para continuar
        </NeonText>
        <NeonButton title="Entrar" onPress={() => router.replace('/(auth)/sign-in')} style={{ marginTop: Spacing.xl }} />
      </View>
    );
  }

  const badge = getBadgeForReputation(user.reputation);
  const maxWidth = isDesktop ? 640 : undefined;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.scrollContent, isDesktop && { alignItems: 'center' }]}
      showsVerticalScrollIndicator={false}>

      {/* Profile Header */}
      <View style={[styles.header, maxWidth ? { maxWidth, width: '100%' } : undefined]}>
        <View style={{ alignItems: 'center', marginBottom: 8 }}>
          <LogoMark size={36} color={Colors.primary} />
        </View>
        <View style={styles.profileHeader}>
          <View style={[styles.avatarLg, { borderColor: badge.color, shadowColor: badge.glowColor }]}>
            <NeonText variant="h1" style={{ fontSize: 32 }}>{user.displayName.charAt(0).toUpperCase()}</NeonText>
            {user.isGuardian && (
              <View style={[styles.guardianCrown, { backgroundColor: colors.background }]}>
                <NeonText style={{ fontSize: 16 }}>🛡️</NeonText>
              </View>
            )}
          </View>
          <NeonText variant="h3" style={styles.displayName}>{user.displayName}</NeonText>
          <BadgeIcon level={user.level} size="md" showName />
        </View>
      </View>

      {/* Guardian banner */}
      {user.isGuardian && (
        <GlassCard
          style={[styles.guardianBanner, maxWidth ? { maxWidth, width: '100%' } : undefined]}
          glowColor={Colors.primary + '30'}
          accessibilityLabel="Nível Guardião. Você tem poderes completos de moderação."
        >
          <View style={styles.guardianBannerRow}>
            <View style={styles.guardianBadge}>
              <NeonText style={{ fontSize: 28 }}>🛡️</NeonText>
            </View>
            <View style={styles.guardianBannerText}>
              <NeonText variant="h4" color={Colors.primary} glow={Colors.primary + '60'}>
                GUARDIAN
              </NeonText>
              <NeonText variant="caption" color={colors.textSecondary}>
                Poderes completos de moderação desbloqueados
              </NeonText>
            </View>
            <View style={styles.guardianLevel}>
              <NeonText variant="caption" color={colors.textTertiary}>Tier</NeonText>
              <NeonText variant="h3" color={Colors.primary} glow={Colors.primary + '60'}>
                ∞
              </NeonText>
            </View>
          </View>

          <View style={styles.guardianPowers}>
            {[
              { icon: 'check-decagram', label: 'Verificar Incidentes', count: user.verifiedIncidents },
              { icon: 'delete-circle', label: 'Remover Falsos', count: user.removedIncidents },
              { icon: 'account-supervisor', label: 'Mentorados', count: user.mentees },
            ].map((power) => (
              <View key={power.label} style={styles.powerItem}>
                <MaterialCommunityIcons name={power.icon as any} size={16} color={Colors.primary} />
                <NeonText variant="caption" color={colors.textSecondary}>{power.label}</NeonText>
                <NeonText variant="bodySm" color={Colors.primary} style={{ fontWeight: '700' }}>
                  {power.count?.toLocaleString() ?? 0}
                </NeonText>
              </View>
            ))}
          </View>
        </GlassCard>
      )}

      {/* Reputation card */}
      <GlassCard
        style={[styles.repCard, maxWidth ? { maxWidth, width: '100%' } : undefined]}
        glowColor={badge.glowColor + '30'}
        accessibilityLabel={`Reputation: ${user.reputation.toLocaleString()} points. ${badge.nameEN}.`}
      >
        <View style={styles.repRow}>
          <NeonText variant="label" color={colors.textSecondary}>Reputação</NeonText>
          <NeonText variant="h3" color={badge.color} glow={badge.glowColor}>
            {user.reputation.toLocaleString()}
          </NeonText>
        </View>
        {!user.isGuardian && (
          <View style={styles.progressContainer}>
            <View style={[styles.progressBg, { backgroundColor: colors.glass.background }]}>
              <View style={[styles.progressFill, {
                width: `${getProgressToNextLevel(user.reputation, badge) * 100}%`,
                backgroundColor: badge.color, shadowColor: badge.glowColor,
              }]} />
            </View>
          </View>
        )}
        {user.isGuardian && (
          <View style={[styles.progressBg, { backgroundColor: Colors.primary + '15', justifyContent: 'center', alignItems: 'center', height: 24, borderRadius: Radius.sm }]}>
            <NeonText variant="caption" color={Colors.primary} style={{ fontWeight: '700' }}>
              MAX LEVEL — UNLIMITED
            </NeonText>
          </View>
        )}
      </GlassCard>

      {/* Stats grid */}
      <View style={[styles.statsGrid, maxWidth ? { maxWidth, width: '100%' } : undefined]}>
        <StatCard icon="file-document-edit" label="Relatórios" value={user.totalReports.toLocaleString()} color={Colors.primary} />
        <StatCard icon="check-circle" label="Confirmações" value={user.totalConfirmations.toLocaleString()} color={Colors.success} />
        <StatCard icon="calendar-today" label="Hoje"
          value={user.dailyReportLimit === -1 ? `${user.reportsToday}/∞` : `${user.reportsToday}/${user.dailyReportLimit}`}
          color={Colors.warning} />
      </View>

      {user.isGuardian && (
        <View style={[styles.statsGrid, maxWidth ? { maxWidth, width: '100%' } : undefined]}>
          <StatCard icon="check-decagram" label="Verificados" value={user.verifiedIncidents ?? 0} color={Colors.primary} />
          <StatCard icon="delete-circle" label="Removidos" value={user.removedIncidents ?? 0} color={Colors.error} />
          <StatCard icon="account-supervisor" label="Mentorados" value={user.mentees ?? 0} color={Colors.secondary} />
        </View>
      )}

      {/* Emergency Services */}
      <View style={[styles.emergencySection, maxWidth ? { maxWidth, width: '100%' } : undefined]}>
        <View style={styles.emergencySectionHeader}>
          <MaterialCommunityIcons name="phone-alert" size={18} color={Colors.error} />
          <NeonText variant="label" color={Colors.error} style={{ marginLeft: Spacing.sm }}>
            Serviços de Emergência
          </NeonText>
        </View>
        <View style={styles.emergencyGrid}>
          {EMERGENCY_SERVICES.map((svc) => (
            <EmergencyButton key={svc.id} service={svc} />
          ))}
        </View>
      </View>

      {/* Theme & Language */}
      <View style={[styles.settingsSection, maxWidth ? { maxWidth, width: '100%' } : undefined]}>
        {/* Theme Toggle */}
        <View style={styles.settingRow}>
          <View style={styles.settingLabelRow}>
            <MaterialCommunityIcons name="theme-light-dark" size={18} color={colors.textSecondary} />
            <NeonText variant="bodySm" color={colors.textPrimary} style={{ marginLeft: Spacing.sm }}>
              Tema
            </NeonText>
          </View>
          <View style={styles.themeToggle}>
            <Pressable
              onPress={() => { haptics.light(); setA11y('lightTheme', false); }}
              style={({ pressed }) => [styles.themeBtn, {
                backgroundColor: !isLightTheme ? colors.primary + '20' : 'transparent',
                borderColor: !isLightTheme ? colors.primary : colors.border,
                transform: [{ scale: pressed ? 0.92 : 1 }],
              }]}
            >
              <MaterialCommunityIcons name="weather-night" size={16} color={!isLightTheme ? colors.primary : colors.textTertiary} />
              <NeonText variant="caption" color={!isLightTheme ? colors.primary : colors.textTertiary}> Escuro</NeonText>
            </Pressable>
            <Pressable
              onPress={() => { haptics.light(); setA11y('lightTheme', true); }}
              style={({ pressed }) => [styles.themeBtn, {
                backgroundColor: isLightTheme ? colors.primary + '20' : 'transparent',
                borderColor: isLightTheme ? colors.primary : colors.border,
                transform: [{ scale: pressed ? 0.92 : 1 }],
              }]}
            >
              <MaterialCommunityIcons name="white-balance-sunny" size={16} color={isLightTheme ? colors.primary : colors.textTertiary} />
              <NeonText variant="caption" color={isLightTheme ? colors.primary : colors.textTertiary}> Claro</NeonText>
            </Pressable>
          </View>
        </View>

        {/* Language Selector */}
        <View style={styles.settingRow}>
          <View style={styles.settingLabelRow}>
            <MaterialCommunityIcons name="translate" size={18} color={colors.textSecondary} />
            <NeonText variant="bodySm" color={colors.textPrimary} style={{ marginLeft: Spacing.sm }}>
              Idioma
            </NeonText>
          </View>
          <View style={styles.langRow}>
            {AVAILABLE_LANGUAGES.map((lang) => {
              const isActive = currentLocale === lang.code;
              return (
                <Pressable
                  key={lang.code}
                  onPress={() => { haptics.selection(); setLocale(lang.code); announce(`Language changed to ${lang.name}`); }}
                  style={({ pressed }) => [styles.langChip, {
                    backgroundColor: isActive ? colors.primary + '20' : 'transparent',
                    borderColor: isActive ? colors.primary : colors.border,
                    transform: [{ scale: pressed ? 0.92 : 1 }],
                  }]}
                >
                  <NeonText variant="caption" color={isActive ? colors.primary : colors.textTertiary} style={{ fontWeight: isActive ? '700' : '400' }}>
                    {lang.code === 'pt-BR' ? 'PT' : lang.code.toUpperCase()}
                  </NeonText>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>

      {/* QR Codes - Download on Mobile */}
      <GlassCard style={[styles.qrSection, maxWidth ? { maxWidth, width: '100%' } : undefined]}
        accessibilityLabel="Escaneie QR codes para baixar Alert.io no iOS ou Android">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.md }}>
          <MaterialCommunityIcons name="qrcode-scan" size={16} color={colors.primary} />
          <NeonText variant="label" color={colors.primary}>Baixe o App</NeonText>
        </View>
        <View style={styles.qrDualRow}>
          {/* iOS QR */}
          <View style={styles.qrCard}>
            <View style={[styles.qrBg, { backgroundColor: '#fff' }]}>
              <Image
                source={{ uri: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://apps.apple.com/app/alert-io/id0000000000&bgcolor=ffffff&color=0d1117' }}
                style={{ width: 90, height: 90 }}
                accessibilityLabel="QR code para baixar Alert.io na App Store"
              />
            </View>
            <View style={[styles.storeBadgeLg, { borderColor: colors.border, backgroundColor: colors.glass.background }]}>
              <MaterialCommunityIcons name="apple" size={16} color={colors.textPrimary} />
              <View style={{ marginLeft: 6 }}>
                <NeonText variant="caption" color={colors.textTertiary} style={{ fontSize: 8, lineHeight: 10 }}>Download on the</NeonText>
                <NeonText variant="caption" color={colors.textPrimary} style={{ fontSize: 11, fontWeight: '700', lineHeight: 14 }}>App Store</NeonText>
              </View>
            </View>
          </View>

          {/* Android QR */}
          <View style={styles.qrCard}>
            <View style={[styles.qrBg, { backgroundColor: '#fff' }]}>
              <Image
                source={{ uri: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://play.google.com/store/apps/details?id=io.alert.community&bgcolor=ffffff&color=0d1117' }}
                style={{ width: 90, height: 90 }}
                accessibilityLabel="QR code para baixar Alert.io no Google Play"
              />
            </View>
            <View style={[styles.storeBadgeLg, { borderColor: colors.border, backgroundColor: colors.glass.background }]}>
              <MaterialCommunityIcons name="google-play" size={16} color="#3DDC84" />
              <View style={{ marginLeft: 6 }}>
                <NeonText variant="caption" color={colors.textTertiary} style={{ fontSize: 8, lineHeight: 10 }}>Get it on</NeonText>
                <NeonText variant="caption" color={colors.textPrimary} style={{ fontSize: 11, fontWeight: '700', lineHeight: 14 }}>Google Play</NeonText>
              </View>
            </View>
          </View>
        </View>
      </GlassCard>

      {/* Menu items */}
      <GlassCard noPadding style={[styles.menuCard, maxWidth ? { maxWidth, width: '100%' } : undefined]}>
        <MenuRow icon="cog" label="Configurações" hint="Abrir configurações" onPress={() => router.push('/settings')} />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <MenuRow icon="human-accessible" label="Acessibilidade"
          hint="Configurar opções de acessibilidade" color={Colors.secondary}
          onPress={() => router.push('/settings/accessibility')} />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <MenuRow icon="eye-off" label={user.isGhostMode ? 'Modo Fantasma (ON)' : 'Modo Fantasma'}
          hint="Alternar visibilidade no mapa público"
          badge={user.isGhostMode ? 'ON' : undefined}
          onPress={() => {
            haptics.medium();
            useAuthStore.getState().updateProfile({ isGhostMode: !user.isGhostMode });
            announce(user.isGhostMode ? 'Modo fantasma desativado.' : 'Modo fantasma ativado.');
          }} />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <MenuRow icon="share-variant" label="Compartilhar Localização"
          hint="Criar link temporário de compartilhamento"
          onPress={() => { haptics.light(); announce('Link de localização criado'); }} />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <MenuRow icon="logout" label="Sair" hint="Sair da sua conta" danger
          onPress={() => { signOut(); router.replace('/(auth)/sign-in'); }} />
      </GlassCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: Spacing['6xl'] },
  header: {
    paddingTop: Platform.OS === 'web' ? 24 : Platform.OS === 'ios' ? 64 : 44,
    paddingHorizontal: Spacing.xl, paddingBottom: Spacing.lg,
  },
  profileHeader: { alignItems: 'center' },
  avatarLg: {
    width: 88, height: 88, borderRadius: 44, borderWidth: 3,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    shadowOpacity: 0.6, shadowRadius: 22, elevation: 8, marginBottom: Spacing.md,
    position: 'relative',
  },
  guardianCrown: {
    position: 'absolute', bottom: -4, right: -4,
    width: 28, height: 28, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: Colors.primary,
  },
  displayName: { marginBottom: Spacing.sm },

  guardianBanner: {
    marginHorizontal: Spacing.xl, marginBottom: Spacing.lg, padding: Spacing.xl,
    borderWidth: 1, borderColor: Colors.primary + '30',
  },
  guardianBannerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.lg },
  guardianBadge: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: Colors.primary + '15', borderWidth: 2, borderColor: Colors.primary + '40',
    justifyContent: 'center', alignItems: 'center',
  },
  guardianBannerText: { flex: 1, marginLeft: Spacing.md },
  guardianLevel: { alignItems: 'center' },
  guardianPowers: { flexDirection: 'row', justifyContent: 'space-around' },
  powerItem: { alignItems: 'center', gap: 4 },

  repCard: { marginHorizontal: Spacing.xl, marginBottom: Spacing.lg, padding: Spacing.xl },
  repRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: Spacing.md,
  },
  progressContainer: {},
  progressBg: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4, shadowOpacity: 0.6, shadowRadius: 6 },

  statsGrid: {
    flexDirection: 'row', paddingHorizontal: Spacing.xl,
    gap: Spacing.md, marginBottom: Spacing.lg,
  },
  statCard: { flex: 1, alignItems: 'center', padding: Spacing.lg },
  statValue: { marginTop: Spacing.xs, marginBottom: 2 },

  emergencySection: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  emergencySectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  emergencyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  emergencyBtnWrapper: {
    width: '31%',
    minWidth: 95,
    flexGrow: 1,
  },
  emergencyBtn: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.lg,
    borderWidth: 1,
    ...(Platform.OS === 'web' ? { transition: 'all 0.25s cubic-bezier(0.25,0.8,0.25,1)', cursor: 'pointer' } as any : {}),
  },
  emergencyIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  emergencyLabel: {
    fontWeight: '700',
    fontSize: 11,
    marginBottom: 2,
  },

  settingsSection: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  themeToggle: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  themeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    ...(Platform.OS === 'web' ? { transition: 'all 0.25s ease', cursor: 'pointer' } as any : {}),
  },
  langRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  langChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    minWidth: 36,
    alignItems: 'center',
    ...(Platform.OS === 'web' ? { transition: 'all 0.2s ease', cursor: 'pointer' } as any : {}),
  },
  qrSection: {
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
  },
  qrDualRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.xl,
    flexWrap: 'wrap',
  },
  qrCard: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  qrBg: {
    padding: 6,
    borderRadius: Radius.md,
  },
  storeBadgeLg: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  menuCard: { marginHorizontal: Spacing.xl },
  menuRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: Spacing.lg, paddingHorizontal: Spacing.lg,
    ...(Platform.OS === 'web' ? { transition: 'all 0.2s ease', cursor: 'pointer' } as any : {}),
  },
  menuLabel: { flex: 1, marginLeft: Spacing.md },
  menuBadge: {
    paddingHorizontal: Spacing.sm, paddingVertical: 2,
    borderRadius: Radius.sm, marginRight: Spacing.sm,
  },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: Spacing['4xl'] },
});
