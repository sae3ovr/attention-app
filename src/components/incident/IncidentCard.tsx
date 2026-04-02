import React, { useRef } from 'react';
import { View, StyleSheet, Pressable, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GlassCard } from '../ui/GlassCard';
import { NeonText } from '../ui/NeonText';
import { BadgeIcon } from '../ui/BadgeIcon';
import { useA11y } from '../../hooks/useAccessibility';
import { useHaptics } from '../../hooks/useHaptics';
import { Spacing, Radius } from '../../theme/spacing';
import { Colors } from '../../theme/colors';
import { getCategoryMeta } from '../../constants/categories';
import { timeAgo } from '../../services/mockData';
import type { Incident } from '../../types';

interface IncidentCardProps {
  incident: Incident;
  onPress?: () => void;
  compact?: boolean;
}

export function IncidentCard({ incident, onPress, compact }: IncidentCardProps) {
  const { colors, typography } = useA11y();
  const haptics = useHaptics();
  const categoryMeta = getCategoryMeta(incident.category);
  const catColor = Colors.category[incident.category];
  const sevColor = Colors.severity[incident.severity];
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.96, useNativeDriver: true, speed: 50, bounciness: 4 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 8 }).start();
  };
  const handlePress = () => {
    haptics.light();
    onPress?.();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessible
        accessibilityLabel={`${incident.severity} severity ${categoryMeta.label} incident: ${incident.title}. Reported by ${incident.reporterName}, ${timeAgo(incident.createdAt)}. ${incident.confirmCount} confirmations.${incident.isVerified ? ' Verified by Guardian.' : ''}`}
        accessibilityHint="Double tap to view incident details"
        accessibilityRole="button"
      >
        <GlassCard glowColor={catColor + '40'} style={compact ? styles.compactCard : undefined}>
          <View style={styles.header}>
            <View style={[styles.categoryIcon, { backgroundColor: catColor + '20' }]}>
              <MaterialCommunityIcons
                name={categoryMeta.icon as any}
                size={20}
                color={catColor}
              />
            </View>
            <View style={styles.headerText}>
              <NeonText variant="bodySm" color={catColor}>
                {categoryMeta.label}
              </NeonText>
              <NeonText variant="caption" color={colors.textTertiary}>
                {timeAgo(incident.createdAt)}
              </NeonText>
            </View>
            <View style={[styles.severityDot, { backgroundColor: sevColor, shadowColor: sevColor }]} />
          </View>

          <View style={styles.titleRow}>
            <NeonText variant="h4" style={styles.title} numberOfLines={2}>
              {incident.title}
            </NeonText>
            {incident.isVerified && (
              <View style={styles.verifiedInline} accessibilityLabel="Verified by Guardian">
                <MaterialCommunityIcons name="shield-check" size={10} color={Colors.primary} />
                <NeonText variant="caption" color={Colors.primary} style={styles.verifiedInlineText}>
                  Verified
                </NeonText>
              </View>
            )}
          </View>

          {!compact && (
            <NeonText
              variant="bodySm"
              color={colors.textSecondary}
              numberOfLines={2}
              style={styles.description}
            >
              {incident.description}
            </NeonText>
          )}

          <View style={styles.footer}>
            <View style={styles.reporter}>
              <BadgeIcon level={incident.reporterLevel} size="sm" />
              <NeonText variant="caption" color={colors.textSecondary} style={styles.reporterName}>
                {incident.reporterName}
              </NeonText>
            </View>

            <View style={styles.stats} accessibilityLabel={`${incident.confirmCount} confirmations, ${incident.denyCount} denials`}>
              <View style={styles.stat}>
                <MaterialCommunityIcons name="check-circle" size={14} color={Colors.success} />
                <NeonText variant="caption" color={Colors.success}>
                  {incident.confirmCount}
                </NeonText>
              </View>
              <View style={styles.stat}>
                <MaterialCommunityIcons name="close-circle" size={14} color={Colors.error} />
                <NeonText variant="caption" color={Colors.error}>
                  {incident.denyCount}
                </NeonText>
              </View>
              <View style={styles.stat}>
                <MaterialCommunityIcons name="comment-outline" size={14} color={colors.textTertiary} />
                <NeonText variant="caption" color={colors.textTertiary}>
                  {incident.commentCount}
                </NeonText>
              </View>
            </View>
          </View>
        </GlassCard>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  compactCard: {
    padding: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  categoryIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  severityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.xs,
    flexWrap: 'wrap',
  },
  title: {
    flexShrink: 1,
  },
  verifiedInline: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '10',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    gap: 2,
  },
  verifiedInlineText: {
    fontWeight: '700',
    fontSize: 9,
  },
  description: {
    marginBottom: Spacing.md,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  reporter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reporterName: {
    marginLeft: Spacing.xs,
  },
  stats: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
});
