import React, { useState } from 'react';
import { View, StyleSheet, FlatList, Platform, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NeonText } from '../../src/components/ui/NeonText';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { BadgeIcon } from '../../src/components/ui/BadgeIcon';
import { useA11y, announce } from '../../src/hooks/useAccessibility';
import { useHaptics } from '../../src/hooks/useHaptics';
import { useResponsive } from '../../src/hooks/useResponsive';
import { useAuthStore } from '../../src/stores/authStore';
import { Colors } from '../../src/theme/colors';
import { Spacing, Radius } from '../../src/theme/spacing';
import { MOCK_FEED, timeAgo } from '../../src/services/mockData';
import type { FeedItem } from '../../src/types';

type FeedFilter = 'all' | 'incidents' | 'verified' | 'community';

const FEED_ICONS: Record<FeedItem['type'], { name: string; color: string }> = {
  new_incident: { name: 'alert-circle', color: Colors.warning },
  incident_verified: { name: 'check-decagram', color: Colors.primary },
  user_leveled_up: { name: 'arrow-up-bold-circle', color: Colors.secondary },
  user_became_guardian: { name: 'shield-star', color: Colors.primary },
};

const FILTERS: { key: FeedFilter; label: string; icon: string }[] = [
  { key: 'all', label: 'All', icon: 'format-list-bulleted' },
  { key: 'incidents', label: 'Incidents', icon: 'alert-circle' },
  { key: 'verified', label: 'Verified', icon: 'check-decagram' },
  { key: 'community', label: 'Community', icon: 'account-group' },
];

const FILTER_MAP: Record<FeedFilter, FeedItem['type'][]> = {
  all: ['new_incident', 'incident_verified', 'user_leveled_up', 'user_became_guardian'],
  incidents: ['new_incident'],
  verified: ['incident_verified'],
  community: ['user_leveled_up', 'user_became_guardian'],
};

function FeedCard({ item, isGuardian }: { item: FeedItem; isGuardian: boolean }) {
  const { colors, minTarget } = useA11y();
  const haptics = useHaptics();
  const meta = FEED_ICONS[item.type];
  const [reacted, setReacted] = useState(false);

  return (
    <GlassCard style={styles.feedCard} accessibilityLabel={`${item.summary}. ${timeAgo(item.createdAt)}`}>
      <View style={styles.feedRow}>
        <View style={[styles.feedIconBg, { backgroundColor: meta.color + '15' }]}>
          <MaterialCommunityIcons name={meta.name as any} size={22} color={meta.color} />
        </View>
        <View style={styles.feedContent}>
          <NeonText variant="bodySm" style={styles.feedText}>{item.summary}</NeonText>
          <View style={styles.feedMeta}>
            <BadgeIcon level={item.actorLevel} size="sm" />
            <NeonText variant="caption" color={colors.textTertiary} style={styles.feedTime}>
              {timeAgo(item.createdAt)}
            </NeonText>
          </View>

          {/* Action buttons */}
          <View style={styles.feedActions}>
            <Pressable onPress={() => { haptics.light(); setReacted(!reacted); }}
              style={({ pressed }) => [styles.feedActionBtn,
                reacted && { backgroundColor: Colors.primary + '12' },
                pressed && { backgroundColor: Colors.primary + '20', transform: [{ scale: 0.93 }] },
              ]}
              accessible accessibilityLabel={reacted ? 'Remove reaction' : 'React useful'}
              accessibilityRole="button">
              <MaterialCommunityIcons name={reacted ? 'thumb-up' : 'thumb-up-outline'} size={14}
                color={reacted ? Colors.primary : colors.textTertiary} />
              <NeonText variant="caption" color={reacted ? Colors.primary : colors.textTertiary}>
                Useful
              </NeonText>
            </Pressable>

            {item.type === 'new_incident' && isGuardian && (
              <Pressable onPress={() => { haptics.medium(); announce('Incident verified by Guardian'); }}
                style={({ pressed }) => [styles.feedActionBtn,
                  pressed && { backgroundColor: Colors.primary + '20', transform: [{ scale: 0.93 }] },
                ]}
                accessible accessibilityLabel="Verify as Guardian" accessibilityRole="button">
                <MaterialCommunityIcons name="shield-check" size={14} color={Colors.primary} />
                <NeonText variant="caption" color={Colors.primary}>Verify</NeonText>
              </Pressable>
            )}

            <Pressable onPress={() => { haptics.light(); announce('Shared!'); }}
              style={({ pressed }) => [styles.feedActionBtn,
                pressed && { backgroundColor: 'rgba(255,255,255,0.08)', transform: [{ scale: 0.93 }] },
              ]}
              accessible accessibilityLabel="Share this update" accessibilityRole="button">
              <MaterialCommunityIcons name="share-outline" size={14} color={colors.textTertiary} />
              <NeonText variant="caption" color={colors.textTertiary}>Share</NeonText>
            </Pressable>
          </View>
        </View>
      </View>
    </GlassCard>
  );
}

export default function FeedScreen() {
  const { colors, minTarget } = useA11y();
  const haptics = useHaptics();
  const { isDesktop } = useResponsive();
  const user = useAuthStore((s) => s.user);
  const [filter, setFilter] = useState<FeedFilter>('all');

  const maxWidth = isDesktop ? 680 : undefined;
  const filteredFeed = MOCK_FEED.filter((item) => FILTER_MAP[filter].includes(item.type));

  return (
    <View style={[styles.container, { backgroundColor: colors.background }, isDesktop && { alignItems: 'center' }]}>
      <View style={[styles.header, maxWidth ? { maxWidth, width: '100%' } : undefined]}>
        <View style={styles.headerRow}>
          <View>
            <NeonText variant="h2" glow={colors.primaryGlow}>Activity</NeonText>
            <NeonText variant="bodySm" color={colors.textSecondary}>
              What's happening in your community
            </NeonText>
          </View>
          {user?.isGuardian && (
            <View style={[styles.guardianTag, { backgroundColor: Colors.primary + '15', borderColor: Colors.primary + '30' }]}>
              <NeonText style={{ fontSize: 12 }}>🛡️</NeonText>
              <NeonText variant="caption" color={Colors.primary} style={{ fontWeight: '700' }}>
                Guardian
              </NeonText>
            </View>
          )}
        </View>

        {/* Filter bar */}
        <View style={styles.filterRow}>
          {FILTERS.map((f) => (
            <Pressable key={f.key}
              onPress={() => { haptics.selection(); setFilter(f.key); }}
              style={({ pressed }) => [styles.filterChip, {
                backgroundColor: filter === f.key ? colors.primary + '15' : pressed ? 'rgba(255,255,255,0.06)' : 'transparent',
                borderColor: filter === f.key ? colors.primary : colors.border,
                transform: [{ scale: pressed ? 0.94 : 1 }],
              }]}>
              <MaterialCommunityIcons name={f.icon as any} size={14}
                color={filter === f.key ? colors.primary : colors.textTertiary} />
              <NeonText variant="caption" color={filter === f.key ? colors.primary : colors.textTertiary}
                style={{ marginLeft: 4 }}>
                {f.label}
              </NeonText>
            </Pressable>
          ))}
        </View>
      </View>

      <FlatList
        data={filteredFeed}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <FeedCard item={item} isGuardian={user?.isGuardian ?? false} />}
        contentContainerStyle={[styles.list, maxWidth ? { maxWidth, width: '100%', alignSelf: 'center' } : undefined]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons name="newspaper-variant-outline" size={48} color={colors.textTertiary} />
            <NeonText variant="body" color={colors.textTertiary} style={styles.emptyText}>
              No activity matching this filter
            </NeonText>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: Platform.OS === 'web' ? 24 : Platform.OS === 'ios' ? 64 : 44,
    paddingHorizontal: Spacing.xl, paddingBottom: Spacing.sm,
  },
  headerRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: Spacing.md,
  },
  guardianTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: Spacing.sm, paddingVertical: 4,
    borderRadius: Radius.full, borderWidth: 1,
  },
  filterRow: {
    flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm,
  },
  filterChip: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: 6,
    borderRadius: Radius.full, borderWidth: 1,
  },
  list: {
    paddingHorizontal: Spacing.xl, paddingBottom: Spacing['5xl'], gap: Spacing.md,
  },
  feedCard: { padding: Spacing.lg },
  feedRow: { flexDirection: 'row', alignItems: 'flex-start' },
  feedIconBg: {
    width: 42, height: 42, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  feedContent: { flex: 1, marginLeft: Spacing.md },
  feedText: { marginBottom: Spacing.sm },
  feedMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  feedTime: { marginLeft: Spacing.xs },
  feedActions: {
    flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.sm,
    paddingTop: Spacing.sm, borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  feedActionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: 4, paddingHorizontal: Spacing.sm, borderRadius: Radius.sm,
  },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyText: { marginTop: Spacing.md },
});
