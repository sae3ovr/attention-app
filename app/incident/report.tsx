import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TextInput, Platform, Pressable } from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NeonText } from '../../src/components/ui/NeonText';
import { NeonButton } from '../../src/components/ui/NeonButton';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { AccessibleTouchable } from '../../src/components/ui/AccessibleTouchable';
import { useA11y, announce } from '../../src/hooks/useAccessibility';
import { useHaptics } from '../../src/hooks/useHaptics';
import { useIncidentStore } from '../../src/stores/incidentStore';
import { CATEGORIES } from '../../src/constants/categories';
import { LogoMark } from '../../src/components/ui/LogoMark';
import { Colors } from '../../src/theme/colors';
import { Spacing, Radius } from '../../src/theme/spacing';
import type { IncidentCategory, IncidentSeverity } from '../../src/types';

const SEVERITIES: { key: IncidentSeverity; label: string; color: string; description: string }[] = [
  { key: 'low', label: 'Low', color: Colors.severity.low, description: 'Minor issue, no immediate danger' },
  { key: 'medium', label: 'Medium', color: Colors.severity.medium, description: 'Moderate concern, be cautious' },
  { key: 'high', label: 'High', color: Colors.severity.high, description: 'Serious threat, stay alert' },
  { key: 'critical', label: 'Critical', color: Colors.severity.critical, description: 'Immediate danger, avoid area' },
];

export default function ReportScreen() {
  const { colors, typography, minTarget } = useA11y();
  const haptics = useHaptics();
  const createIncident = useIncidentStore((s) => s.createIncident);
  const isLoading = useIncidentStore((s) => s.isLoading);

  const [step, setStep] = useState(0);
  const [category, setCategory] = useState<IncidentCategory | null>(null);
  const [severity, setSeverity] = useState<IncidentSeverity>('medium');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async () => {
    if (!category || !title) {
      haptics.warning();
      announce('Please fill in the required fields: category and title');
      return;
    }

    await createIncident({
      category,
      severity,
      title,
      description,
      location: { latitude: 41.2356, longitude: -8.6200 },
    });

    haptics.success();
    announce('Incident reported successfully! You earned 10 reputation points.');
    router.back();
  };

  const stepTitles = ['Category', 'Details', 'Confirm'];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => {
            haptics.light();
            if (step > 0) setStep(step - 1);
            else router.back();
          }}
          style={[styles.backBtn, { minHeight: minTarget, minWidth: minTarget }]}
          accessible
          accessibilityLabel={step > 0 ? 'Go back to previous step' : 'Close report form'}
          accessibilityRole="button"
        >
          <MaterialCommunityIcons
            name={step > 0 ? 'arrow-left' : 'close'}
            size={24}
            color={colors.textPrimary}
          />
        </Pressable>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <LogoMark size={22} color={Colors.primary} />
          <NeonText variant="h4">Reportar Incidente</NeonText>
        </View>
        <NeonText variant="bodySm" color={colors.textTertiary}>
          Step {step + 1}/3
        </NeonText>
      </View>

      {/* Step indicators */}
      <View style={styles.steps} accessible accessibilityLabel={`Step ${step + 1} of 3: ${stepTitles[step]}`}>
        {stepTitles.map((t, i) => (
          <View key={t} style={styles.stepItem}>
            <View
              style={[
                styles.stepDot,
                {
                  backgroundColor: i <= step ? colors.primary : colors.glass.background,
                  borderColor: i <= step ? colors.primary : colors.border,
                },
              ]}
            />
            <NeonText variant="caption" color={i <= step ? colors.primary : colors.textTertiary}>
              {t}
            </NeonText>
          </View>
        ))}
        <View style={[styles.stepLine, { backgroundColor: colors.border }]}>
          <View style={[styles.stepLineFill, { width: `${(step / 2) * 100}%`, backgroundColor: colors.primary }]} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Step 0: Category */}
        {step === 0 && (
          <View>
            <NeonText variant="h3" style={styles.stepTitle}>
              What happened?
            </NeonText>
            <NeonText variant="body" color={colors.textSecondary} style={styles.stepDesc}>
              Select the incident category
            </NeonText>

            <View style={styles.categoryGrid} accessibilityRole="radiogroup" accessibilityLabel="Incident category">
              {CATEGORIES.map((cat) => {
                const selected = category === cat.key;
                const catColor = Colors.category[cat.key];
                return (
                  <Pressable
                    key={cat.key}
                    onPress={() => {
                      haptics.selection();
                      setCategory(cat.key);
                      announce(`Selected category: ${cat.label}`);
                    }}
                    style={[
                      styles.categoryCard,
                      {
                        backgroundColor: selected ? catColor + '15' : colors.glass.background,
                        borderColor: selected ? catColor : colors.border,
                        minHeight: minTarget,
                      },
                    ]}
                    accessible
                    accessibilityLabel={cat.accessibilityLabel}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                  >
                    <MaterialCommunityIcons name={cat.icon as any} size={28} color={catColor} />
                    <NeonText
                      variant="bodySm"
                      color={selected ? catColor : colors.textSecondary}
                      style={styles.categoryLabel}
                    >
                      {cat.label}
                    </NeonText>
                  </Pressable>
                );
              })}
            </View>

            <NeonButton
              title="Next"
              onPress={() => {
                if (!category) {
                  haptics.warning();
                  announce('Please select a category first');
                  return;
                }
                setStep(1);
                announce('Step 2: Add details about the incident');
              }}
              fullWidth
              disabled={!category}
              icon="arrow-right"
              style={styles.nextBtn}
              accessibilityHint="Proceed to add incident details"
            />
          </View>
        )}

        {/* Step 1: Details */}
        {step === 1 && (
          <View>
            <NeonText variant="h3" style={styles.stepTitle}>
              Describe the incident
            </NeonText>

            {/* Severity */}
            <NeonText variant="label" color={colors.textSecondary} style={styles.fieldLabel}>
              Severity Level
            </NeonText>
            <View
              style={styles.severityRow}
              accessibilityRole="radiogroup"
              accessibilityLabel="Incident severity level"
            >
              {SEVERITIES.map((sev) => {
                const selected = severity === sev.key;
                return (
                  <Pressable
                    key={sev.key}
                    onPress={() => {
                      haptics.selection();
                      setSeverity(sev.key);
                      announce(`Severity set to ${sev.label}: ${sev.description}`);
                    }}
                    style={[
                      styles.severityChip,
                      {
                        backgroundColor: selected ? sev.color + '20' : colors.glass.background,
                        borderColor: selected ? sev.color : colors.border,
                        minHeight: minTarget,
                      },
                    ]}
                    accessible
                    accessibilityLabel={`${sev.label} severity: ${sev.description}`}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                  >
                    <View style={[styles.sevDot, { backgroundColor: sev.color }]} />
                    <NeonText variant="buttonSm" color={selected ? sev.color : colors.textSecondary}>
                      {sev.label}
                    </NeonText>
                  </Pressable>
                );
              })}
            </View>

            {/* Title */}
            <NeonText variant="label" color={colors.textSecondary} style={styles.fieldLabel}>
              Title *
            </NeonText>
            <TextInput
              style={[styles.input, { backgroundColor: colors.glass.background, borderColor: colors.border, color: colors.textPrimary, ...typography.body, minHeight: minTarget }]}
              value={title}
              onChangeText={setTitle}
              placeholder="Brief summary of the incident"
              placeholderTextColor={colors.textTertiary}
              maxLength={120}
              accessible
              accessibilityLabel="Incident title, required"
              accessibilityHint="Enter a brief summary, max 120 characters"
            />
            <NeonText variant="caption" color={colors.textTertiary} style={styles.charCount}>
              {title.length}/120
            </NeonText>

            {/* Description */}
            <NeonText variant="label" color={colors.textSecondary} style={styles.fieldLabel}>
              Description
            </NeonText>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: colors.glass.background, borderColor: colors.border, color: colors.textPrimary, ...typography.body }]}
              value={description}
              onChangeText={setDescription}
              placeholder="Provide more details about what you saw..."
              placeholderTextColor={colors.textTertiary}
              multiline
              numberOfLines={4}
              maxLength={1000}
              textAlignVertical="top"
              accessible
              accessibilityLabel="Incident description, optional"
              accessibilityHint="Provide additional details, max 1000 characters"
            />
            <NeonText variant="caption" color={colors.textTertiary} style={styles.charCount}>
              {description.length}/1000
            </NeonText>

            {/* Photo placeholder */}
            <Pressable
              onPress={() => {
                haptics.light();
                announce('Photo attachment. This feature will open your camera or gallery.');
              }}
              style={[styles.photoBtn, { borderColor: colors.border, minHeight: minTarget }]}
              accessible
              accessibilityLabel="Attach a photo to this incident report"
              accessibilityRole="button"
            >
              <MaterialCommunityIcons name="camera-plus" size={32} color={colors.textTertiary} />
              <NeonText variant="bodySm" color={colors.textTertiary}>
                Add Photo (optional)
              </NeonText>
            </Pressable>

            <NeonButton
              title="Next"
              onPress={() => {
                if (!title.trim()) {
                  haptics.warning();
                  announce('Please enter a title for the incident');
                  return;
                }
                setStep(2);
                announce('Step 3: Review and confirm your report');
              }}
              fullWidth
              disabled={!title.trim()}
              icon="arrow-right"
              style={styles.nextBtn}
              accessibilityHint="Review your incident report before submitting"
            />
          </View>
        )}

        {/* Step 2: Confirm */}
        {step === 2 && category && (
          <View>
            <NeonText variant="h3" style={styles.stepTitle}>
              Review & Submit
            </NeonText>
            <NeonText variant="body" color={colors.textSecondary} style={styles.stepDesc}>
              Please confirm the details are correct
            </NeonText>

            <GlassCard
              style={styles.reviewCard}
              accessibilityLabel={`Review: ${CATEGORIES.find((c) => c.key === category)?.label} incident, ${severity} severity. Title: ${title}. ${description ? 'Description: ' + description : 'No description.'}`}
            >
              <View style={styles.reviewRow}>
                <NeonText variant="label" color={colors.textTertiary}>Category</NeonText>
                <View style={styles.reviewValue}>
                  <MaterialCommunityIcons
                    name={CATEGORIES.find((c) => c.key === category)?.icon as any}
                    size={18}
                    color={Colors.category[category]}
                  />
                  <NeonText variant="body" color={Colors.category[category]}>
                    {CATEGORIES.find((c) => c.key === category)?.label}
                  </NeonText>
                </View>
              </View>

              <View style={[styles.reviewDivider, { backgroundColor: colors.border }]} />

              <View style={styles.reviewRow}>
                <NeonText variant="label" color={colors.textTertiary}>Severity</NeonText>
                <View style={styles.reviewValue}>
                  <View style={[styles.sevDotSm, { backgroundColor: Colors.severity[severity] }]} />
                  <NeonText variant="body" color={Colors.severity[severity]}>
                    {severity.charAt(0).toUpperCase() + severity.slice(1)}
                  </NeonText>
                </View>
              </View>

              <View style={[styles.reviewDivider, { backgroundColor: colors.border }]} />

              <View style={styles.reviewRow}>
                <NeonText variant="label" color={colors.textTertiary}>Title</NeonText>
                <NeonText variant="body" style={styles.reviewTitle}>{title}</NeonText>
              </View>

              {description !== '' && (
                <>
                  <View style={[styles.reviewDivider, { backgroundColor: colors.border }]} />
                  <View style={styles.reviewRow}>
                    <NeonText variant="label" color={colors.textTertiary}>Description</NeonText>
                    <NeonText variant="bodySm" color={colors.textSecondary} style={styles.reviewTitle}>
                      {description}
                    </NeonText>
                  </View>
                </>
              )}
            </GlassCard>

            <GlassCard style={styles.rewardCard} glowColor={Colors.primary + '20'}>
              <MaterialCommunityIcons name="star-circle" size={24} color={Colors.primary} />
              <NeonText variant="bodySm" color={colors.textSecondary} style={{ marginLeft: Spacing.md, flex: 1 }}>
                You'll earn <NeonText variant="bodySm" color={Colors.primary}>+10 reputation points</NeonText> for this report
              </NeonText>
            </GlassCard>

            <NeonButton
              title="Submit Report"
              onPress={handleSubmit}
              fullWidth
              loading={isLoading}
              icon="check-circle"
              size="lg"
              style={styles.nextBtn}
              accessibilityHint="Submit this incident report to the community"
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  steps: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing['3xl'],
    paddingBottom: Spacing.lg,
    position: 'relative',
  },
  stepItem: { alignItems: 'center', gap: 4, zIndex: 2 },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
  stepLine: {
    position: 'absolute',
    top: 5,
    left: 50,
    right: 50,
    height: 2,
    borderRadius: 1,
    zIndex: 1,
  },
  stepLineFill: { height: '100%', borderRadius: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing['5xl'],
  },
  stepTitle: { marginBottom: Spacing.xs },
  stepDesc: { marginBottom: Spacing.xl },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  categoryCard: {
    width: '30%',
    flexGrow: 1,
    minWidth: 95,
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
  },
  categoryLabel: { marginTop: Spacing.sm, textAlign: 'center' },
  nextBtn: { marginTop: Spacing.md },
  fieldLabel: { marginBottom: Spacing.sm, marginTop: Spacing.lg },
  input: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  textArea: {
    minHeight: 100,
    paddingTop: Spacing.md,
  },
  charCount: { textAlign: 'right', marginTop: Spacing.xs },
  severityRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  severityChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  sevDot: { width: 8, height: 8, borderRadius: 4 },
  sevDotSm: { width: 6, height: 6, borderRadius: 3 },
  photoBtn: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: Radius.lg,
    paddingVertical: Spacing['2xl'],
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  reviewCard: { padding: Spacing.xl, marginBottom: Spacing.lg },
  reviewRow: { paddingVertical: Spacing.md },
  reviewValue: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.xs },
  reviewDivider: { height: StyleSheet.hairlineWidth },
  reviewTitle: { marginTop: Spacing.xs },
  rewardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
});
