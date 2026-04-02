import React from 'react';
import { View, StyleSheet, ScrollView, Platform, Pressable, Switch } from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NeonText } from '../../src/components/ui/NeonText';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { useA11y, announce } from '../../src/hooks/useAccessibility';
import { useHaptics } from '../../src/hooks/useHaptics';
import { useAuthStore } from '../../src/stores/authStore';
import { Colors } from '../../src/theme/colors';
import { Spacing } from '../../src/theme/spacing';

function SettingRow({ icon, label, hint, value, onToggle, onPress, color }: {
  icon: string;
  label: string;
  hint: string;
  value?: boolean;
  onToggle?: (val: boolean) => void;
  onPress?: () => void;
  color?: string;
}) {
  const { colors, minTarget } = useA11y();
  const haptics = useHaptics();
  const isToggle = onToggle !== undefined;

  const content = (
    <View style={[styles.settingRow, { minHeight: minTarget }]}>
      <MaterialCommunityIcons name={icon as any} size={22} color={color ?? colors.textSecondary} />
      <View style={styles.settingText}>
        <NeonText variant="body">{label}</NeonText>
        <NeonText variant="caption" color={colors.textTertiary}>{hint}</NeonText>
      </View>
      {isToggle ? (
        <Switch
          value={value}
          onValueChange={(v) => { haptics.selection(); onToggle(v); }}
          trackColor={{ false: colors.glass.background, true: Colors.primary + '50' }}
          thumbColor={value ? Colors.primary : colors.textTertiary}
          accessible
          accessibilityLabel={`${label} toggle, currently ${value ? 'on' : 'off'}`}
          accessibilityRole="switch"
        />
      ) : (
        <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textTertiary} />
      )}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={() => { haptics.light(); onPress(); }}
        accessible
        accessibilityLabel={label}
        accessibilityHint={hint}
        accessibilityRole="button"
      >
        {content}
      </Pressable>
    );
  }

  return content;
}

export default function SettingsScreen() {
  const { colors, minTarget } = useA11y();
  const haptics = useHaptics();
  const { user, updateProfile } = useAuthStore();

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.scroll}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => { haptics.light(); router.back(); }}
          style={[styles.backBtn, { minHeight: minTarget, minWidth: minTarget }]}
          accessible
          accessibilityLabel="Go back to profile"
          accessibilityRole="button"
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
        </Pressable>
        <NeonText variant="h3">Settings</NeonText>
      </View>

      {/* Privacy */}
      <NeonText variant="label" color={colors.textSecondary} style={styles.sectionTitle}>
        Privacy & Location
      </NeonText>
      <GlassCard noPadding>
        <SettingRow
          icon="eye-off"
          label="Ghost Mode"
          hint="Hide yourself from the public map"
          value={user?.isGhostMode}
          onToggle={(v) => {
            updateProfile({ isGhostMode: v });
            announce(v ? 'Ghost mode enabled' : 'Ghost mode disabled');
          }}
        />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <SettingRow
          icon="blur"
          label="Fuzzy Location Sharing"
          hint="Add ±200m offset when sharing location"
          value={false}
          onToggle={() => {}}
        />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <SettingRow
          icon="map-clock"
          label="Location History"
          hint="Encrypted daily location summaries"
          value={true}
          onToggle={() => {}}
        />
      </GlassCard>

      {/* Notifications */}
      <NeonText variant="label" color={colors.textSecondary} style={styles.sectionTitle}>
        Notifications
      </NeonText>
      <GlassCard noPadding>
        <SettingRow
          icon="bell"
          label="Push Notifications"
          hint="Receive alerts for nearby incidents"
          value={true}
          onToggle={() => {}}
        />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <SettingRow
          icon="map-marker-radius"
          label="Alert Radius"
          hint="How far away incidents trigger alerts"
          onPress={() => {}}
        />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <SettingRow
          icon="moon-waning-crescent"
          label="Quiet Hours"
          hint="Silence notifications during set hours"
          onPress={() => {}}
        />
      </GlassCard>

      {/* Accessibility */}
      <NeonText variant="label" color={colors.textSecondary} style={styles.sectionTitle}>
        Accessibility
      </NeonText>
      <GlassCard noPadding>
        <SettingRow
          icon="human-accessible"
          label="Accessibility Settings"
          hint="High contrast, large text, screen reader, haptics, voice guidance"
          onPress={() => router.push('/settings/accessibility')}
          color={Colors.secondary}
        />
      </GlassCard>

      {/* Account */}
      <NeonText variant="label" color={colors.textSecondary} style={styles.sectionTitle}>
        Account
      </NeonText>
      <GlassCard noPadding>
        <SettingRow
          icon="translate"
          label="Language"
          hint="English"
          onPress={() => {}}
        />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <SettingRow
          icon="shield-lock"
          label="Two-Factor Authentication"
          hint="Add an extra layer of security"
          onPress={() => {}}
        />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <SettingRow
          icon="delete-forever"
          label="Delete Account"
          hint="Permanently delete all your data"
          onPress={() => {
            haptics.heavy();
            announce('Account deletion. This action is permanent and cannot be undone.');
          }}
          color={Colors.error}
        />
      </GlassCard>

      {/* App info */}
      <View style={styles.appInfo}>
        <NeonText variant="caption" color={colors.textTertiary} style={styles.appInfoText}>
          Attention v1.0.0
        </NeonText>
        <NeonText variant="caption" color={colors.textTertiary} style={styles.appInfoText}>
          Community safety, in your hands.
        </NeonText>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingBottom: Spacing['6xl'] },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    gap: Spacing.md,
  },
  backBtn: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.sm,
  },
  sectionTitle: {
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  settingText: {
    flex: 1,
    marginLeft: Spacing.md,
    marginRight: Spacing.md,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: Spacing['4xl'],
  },
  appInfo: {
    alignItems: 'center',
    paddingTop: Spacing['3xl'],
  },
  appInfoText: {
    textAlign: 'center',
  },
});
