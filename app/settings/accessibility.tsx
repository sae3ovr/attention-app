import React from 'react';
import { View, StyleSheet, ScrollView, Platform, Pressable, Switch } from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NeonText } from '../../src/components/ui/NeonText';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { NeonButton } from '../../src/components/ui/NeonButton';
import { useA11y, announce } from '../../src/hooks/useAccessibility';
import { useHaptics } from '../../src/hooks/useHaptics';
import { useAccessibilityStore } from '../../src/stores/accessibilityStore';
import { Colors } from '../../src/theme/colors';
import { Spacing, Radius } from '../../src/theme/spacing';

interface A11yToggleProps {
  icon: string;
  label: string;
  description: string;
  value: boolean;
  onToggle: (val: boolean) => void;
  color?: string;
}

function A11yToggle({ icon, label, description, value, onToggle, color }: A11yToggleProps) {
  const { colors, minTarget } = useA11y();
  const haptics = useHaptics();

  return (
    <View style={[styles.toggleRow, { minHeight: minTarget }]}>
      <View
        style={[styles.toggleIcon, { backgroundColor: (color ?? Colors.secondary) + '15' }]}
        accessible={false}
      >
        <MaterialCommunityIcons name={icon as any} size={22} color={color ?? Colors.secondary} />
      </View>
      <View style={styles.toggleText}>
        <NeonText variant="body" style={{ fontWeight: '600' }}>
          {label}
        </NeonText>
        <NeonText variant="caption" color={colors.textTertiary}>
          {description}
        </NeonText>
      </View>
      <Switch
        value={value}
        onValueChange={(v) => {
          haptics.selection();
          onToggle(v);
          announce(`${label} ${v ? 'enabled' : 'disabled'}`);
        }}
        trackColor={{ false: colors.glass.background, true: (color ?? Colors.secondary) + '50' }}
        thumbColor={value ? (color ?? Colors.secondary) : colors.textTertiary}
        accessible
        accessibilityLabel={`${label}, currently ${value ? 'enabled' : 'disabled'}`}
        accessibilityHint={description}
        accessibilityRole="switch"
      />
    </View>
  );
}

export default function AccessibilityScreen() {
  const { colors, minTarget } = useA11y();
  const haptics = useHaptics();
  const store = useAccessibilityStore();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scroll}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => { haptics.light(); router.back(); }}
          style={[styles.backBtn, { minHeight: minTarget, minWidth: minTarget }]}
          accessible
          accessibilityLabel="Go back to settings"
          accessibilityRole="button"
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
        </Pressable>
        <View>
          <NeonText variant="h3">Accessibility</NeonText>
          <NeonText variant="bodySm" color={colors.textSecondary}>
            Customize the app for your needs
          </NeonText>
        </View>
      </View>

      {/* Vision */}
      <NeonText variant="label" color={Colors.secondary} style={styles.sectionTitle}>
        Vision
      </NeonText>
      <GlassCard noPadding style={styles.card}>
        <A11yToggle
          icon="contrast-box"
          label="High Contrast Mode"
          description="Increases color contrast for better readability. Borders become more visible and text colors are brighter."
          value={store.highContrast}
          onToggle={(v) => store.set('highContrast', v)}
          color="#00CCFF"
        />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <A11yToggle
          icon="format-size"
          label="Large Text"
          description="Increases all text sizes throughout the app for easier reading. All fonts scale up proportionally."
          value={store.largeText}
          onToggle={(v) => store.set('largeText', v)}
          color="#FFB800"
        />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <A11yToggle
          icon="text-to-speech"
          label="Screen Reader Optimized"
          description="Optimizes layouts and labels for VoiceOver and TalkBack. Adds extra context to all interactive elements."
          value={store.screenReaderEnabled}
          onToggle={(v) => store.set('screenReaderEnabled', v)}
          color="#7B61FF"
        />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <A11yToggle
          icon="account-voice"
          label="Voice Guidance"
          description="Provides audio descriptions of map events and navigation cues. Reads aloud incident alerts and status changes."
          value={store.voiceGuidance}
          onToggle={(v) => store.set('voiceGuidance', v)}
          color="#FF3B7A"
        />
      </GlassCard>

      {/* Motor */}
      <NeonText variant="label" color={Colors.primary} style={styles.sectionTitle}>
        Motor & Interaction
      </NeonText>
      <GlassCard noPadding style={styles.card}>
        <A11yToggle
          icon="gesture-tap-button"
          label="Large Touch Targets"
          description="Increases all button and interactive areas to 56px minimum for easier tapping. Recommended for users with motor impairments."
          value={store.largeTargets}
          onToggle={(v) => store.set('largeTargets', v)}
          color={Colors.primary}
        />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <A11yToggle
          icon="vibrate"
          label="Haptic Feedback"
          description="Provides tactile vibration feedback on button presses, confirmations, and alerts. Essential for hearing impaired users."
          value={store.hapticFeedback}
          onToggle={(v) => store.set('hapticFeedback', v)}
          color={Colors.primary}
        />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <A11yToggle
          icon="animation-play"
          label="Reduce Motion"
          description="Disables all animations including radar sweep, marker pulsing, and transition effects. Prevents motion sickness triggers."
          value={store.reducedMotion}
          onToggle={(v) => store.set('reducedMotion', v)}
          color={Colors.primary}
        />
      </GlassCard>

      {/* Cognitive */}
      <NeonText variant="label" color={Colors.warning} style={styles.sectionTitle}>
        Cognitive & Simplification
      </NeonText>
      <GlassCard noPadding style={styles.card}>
        <A11yToggle
          icon="puzzle-outline"
          label="Simplified Interface"
          description="Reduces visual complexity by hiding secondary information. Shows only essential content on each screen. Ideal for cognitive accessibility."
          value={store.simplifiedUI}
          onToggle={(v) => store.set('simplifiedUI', v)}
          color={Colors.warning}
        />
      </GlassCard>

      {/* Info box */}
      <GlassCard style={styles.infoCard} glowColor={Colors.secondary + '15'}>
        <MaterialCommunityIcons name="information" size={24} color={Colors.secondary} />
        <View style={styles.infoText}>
          <NeonText variant="bodySm" style={{ fontWeight: '600' }}>
            System Accessibility
          </NeonText>
          <NeonText variant="caption" color={colors.textSecondary}>
            This app also respects your device's system accessibility settings including Dynamic Type,
            Bold Text, Reduce Motion, VoiceOver (iOS), and TalkBack (Android). Configure those in your
            device Settings for the best experience.
          </NeonText>
        </View>
      </GlassCard>

      {/* Reset */}
      <View style={styles.resetSection}>
        <NeonButton
          title="Reset to Defaults"
          onPress={() => {
            haptics.medium();
            store.reset();
            announce('All accessibility settings have been reset to defaults');
          }}
          variant="ghost"
          icon="refresh"
          accessibilityHint="Reset all accessibility settings to their default values"
        />
      </View>

      {/* A11y quick summary */}
      <GlassCard style={styles.summaryCard}>
        <NeonText variant="label" color={colors.textSecondary} style={styles.summaryTitle}>
          Active Accessibility Features
        </NeonText>
        <View style={styles.summaryChips}>
          {store.highContrast && <Chip label="High Contrast" color="#00CCFF" />}
          {store.largeText && <Chip label="Large Text" color="#FFB800" />}
          {store.screenReaderEnabled && <Chip label="Screen Reader" color="#7B61FF" />}
          {store.voiceGuidance && <Chip label="Voice Guidance" color="#FF3B7A" />}
          {store.largeTargets && <Chip label="Large Targets" color={Colors.primary} />}
          {store.hapticFeedback && <Chip label="Haptics" color={Colors.primary} />}
          {store.reducedMotion && <Chip label="Reduced Motion" color={Colors.primary} />}
          {store.simplifiedUI && <Chip label="Simplified UI" color={Colors.warning} />}
          {!store.highContrast && !store.largeText && !store.screenReaderEnabled && !store.voiceGuidance && !store.largeTargets && !store.reducedMotion && !store.simplifiedUI && store.hapticFeedback && (
            <NeonText variant="caption" color={colors.textTertiary}>Default settings (haptics only)</NeonText>
          )}
        </View>
      </GlassCard>
    </ScrollView>
  );
}

function Chip({ label, color }: { label: string; color: string }) {
  return (
    <View
      style={[styles.chip, { backgroundColor: color + '15', borderColor: color + '40' }]}
      accessible
      accessibilityLabel={`${label} is enabled`}
    >
      <NeonText variant="caption" color={color}>
        {label}
      </NeonText>
    </View>
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
    paddingBottom: Spacing.md,
    gap: Spacing.md,
  },
  backBtn: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.sm,
  },
  sectionTitle: {
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing['2xl'],
    marginBottom: Spacing.md,
  },
  card: {
    marginHorizontal: Spacing.xl,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  toggleIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleText: {
    flex: 1,
    marginLeft: Spacing.md,
    marginRight: Spacing.md,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: Spacing['5xl'],
  },
  infoCard: {
    flexDirection: 'row',
    marginHorizontal: Spacing.xl,
    marginTop: Spacing['2xl'],
    padding: Spacing.lg,
    gap: Spacing.md,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    gap: Spacing.xs,
  },
  resetSection: {
    alignItems: 'center',
    paddingTop: Spacing['2xl'],
  },
  summaryCard: {
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.xl,
    padding: Spacing.lg,
  },
  summaryTitle: {
    marginBottom: Spacing.md,
  },
  summaryChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
});
