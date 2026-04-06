import React, { useRef, useState } from 'react';
import { View, StyleSheet, Pressable, Animated, TextInput, FlatList } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { GlassCard } from '../ui/GlassCard';
import { NeonText } from '../ui/NeonText';
import { BadgeIcon } from '../ui/BadgeIcon';
import { useA11y } from '../../hooks/useAccessibility';
import { useHaptics } from '../../hooks/useHaptics';
import { useIncidentStore } from '../../stores/incidentStore';
import { Spacing, Radius } from '../../theme/spacing';
import { Colors } from '../../theme/colors';
import { getCategoryMeta } from '../../constants/categories';
import { timeAgo } from '../../services/mockData';
import type { Incident, IncidentComment } from '../../types';

const VERIFY_THRESHOLD = 10;
const FAKE_THRESHOLD = 10;
const MAX_COMMENT_LENGTH = 200;

interface IncidentCardProps {
  incident: Incident;
  onPress?: () => void;
  compact?: boolean;
}

export function IncidentCard({ incident, onPress, compact }: IncidentCardProps) {
  const { colors, typography } = useA11y();
  const haptics = useHaptics();
  const confirmIncident = useIncidentStore((s) => s.confirmIncident);
  const denyIncident = useIncidentStore((s) => s.denyIncident);
  const viewIncident = useIncidentStore((s) => s.viewIncident);
  const addComment = useIncidentStore((s) => s.addComment);
  const categoryMeta = getCategoryMeta(incident.category);
  const catColor = Colors.category[incident.category];
  const sevColor = Colors.severity[incident.severity];
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const confirmScale = useRef(new Animated.Value(1)).current;
  const denyScale = useRef(new Animated.Value(1)).current;

  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');

  const isLocked = incident.isVerified || incident.isFakeReport;
  const confirmProgress = Math.min(incident.confirmCount / VERIFY_THRESHOLD, 1);
  const denyProgress = Math.min(incident.denyCount / FAKE_THRESHOLD, 1);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.96, useNativeDriver: true, speed: 50, bounciness: 4 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 8 }).start();
  };
  const handlePress = () => {
    haptics.light();
    viewIncident(incident.id);
    onPress?.();
  };

  const handleConfirm = () => {
    if (isLocked) return;
    haptics.medium();
    Animated.sequence([
      Animated.timing(confirmScale, { toValue: 1.3, duration: 100, useNativeDriver: true }),
      Animated.spring(confirmScale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 8 }),
    ]).start();
    confirmIncident(incident.id);
  };

  const handleDeny = () => {
    if (isLocked) return;
    haptics.medium();
    Animated.sequence([
      Animated.timing(denyScale, { toValue: 1.3, duration: 100, useNativeDriver: true }),
      Animated.spring(denyScale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 8 }),
    ]).start();
    denyIncident(incident.id);
  };

  const handleSubmitComment = () => {
    const trimmed = commentText.trim();
    if (!trimmed) return;
    haptics.light();
    addComment(incident.id, trimmed);
    setCommentText('');
  };

  const toggleComments = () => {
    haptics.light();
    setShowComments((prev) => !prev);
  };

  const renderComment = ({ item }: { item: IncidentComment }) => (
    <View style={styles.commentItem}>
      <View style={styles.commentHeader}>
        <BadgeIcon level={item.userLevel} size="sm" />
        <NeonText variant="caption" color={Colors.primary} style={styles.commentUser}>
          {item.userName}
        </NeonText>
        <NeonText variant="caption" color={colors.textTertiary} style={styles.commentTime}>
          {timeAgo(item.createdAt)}
        </NeonText>
      </View>
      <NeonText variant="bodySm" color={colors.textSecondary} style={styles.commentText}>
        {item.text}
      </NeonText>
    </View>
  );

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, incident.isFakeReport && { opacity: 0.5 }]}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessible
        accessibilityLabel={`Incidente ${categoryMeta.label} de severidade ${incident.severity}: ${incident.title}. Relatado por ${incident.reporterName}, ${timeAgo(incident.createdAt)}. ${incident.confirmCount} confirmações. ${incident.views} visualizações.${incident.isVerified ? ' Verificado.' : ''}${incident.isFakeReport ? ' Relato Falso.' : ''}`}
        accessibilityHint="Toque duas vezes para ver detalhes"
        accessibilityRole="button"
      >
        <GlassCard glowColor={incident.isFakeReport ? Colors.error + '20' : catColor + '40'} style={compact ? styles.compactCard : undefined}>
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
              <NeonText
                variant="caption"
                color={Colors.success}
                glow={Colors.success}
                style={styles.neonBadge}
                accessibilityLabel="Verificado pela Comunidade"
              >
                Verificado
              </NeonText>
            )}
            {incident.isFakeReport && (
              <NeonText
                variant="caption"
                color={Colors.error}
                glow={Colors.error}
                style={styles.neonBadge}
                accessibilityLabel="Relato Falso"
              >
                Falso
              </NeonText>
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

          {!compact && (
            <View style={styles.voteSection}>
              <View style={styles.voteBar}>
                <View style={[styles.voteBarFillConfirm, { width: `${confirmProgress * 100}%` }]} />
                <View style={[styles.voteBarFillDeny, { width: `${denyProgress * 100}%` }]} />
              </View>
              <View style={styles.voteRow}>
                <Pressable
                  onPress={handleConfirm}
                  disabled={isLocked}
                  style={({ pressed }) => [
                    styles.voteBtn,
                    styles.voteBtnConfirm,
                    pressed && !isLocked && styles.voteBtnPressed,
                    isLocked && styles.voteBtnDisabled,
                  ]}
                  accessibilityLabel={`Curtir incidente. ${incident.confirmCount} de ${VERIFY_THRESHOLD}`}
                  accessibilityRole="button"
                >
                  <Animated.View style={{ transform: [{ scale: confirmScale }], flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <MaterialCommunityIcons name="thumb-up" size={14} color={isLocked ? colors.textTertiary : Colors.success} />
                    <NeonText variant="caption" color={isLocked ? colors.textTertiary : Colors.success} style={{ fontWeight: '700' }}>
                      {incident.confirmCount}
                    </NeonText>
                  </Animated.View>
                </Pressable>

                <NeonText variant="caption" color={colors.textTertiary} style={{ fontSize: 9 }}>
                  {isLocked
                    ? (incident.isVerified ? 'VERIFICADO' : 'FALSO')
                    : `${Math.max(VERIFY_THRESHOLD - incident.confirmCount, 0)} p/ verificar · ${Math.max(FAKE_THRESHOLD - incident.denyCount, 0)} p/ denunciar`
                  }
                </NeonText>

                <Pressable
                  onPress={handleDeny}
                  disabled={isLocked}
                  style={({ pressed }) => [
                    styles.voteBtn,
                    styles.voteBtnDeny,
                    pressed && !isLocked && styles.voteBtnPressed,
                    isLocked && styles.voteBtnDisabled,
                  ]}
                  accessibilityLabel={`Não curtir incidente. ${incident.denyCount} de ${FAKE_THRESHOLD}`}
                  accessibilityRole="button"
                >
                  <Animated.View style={{ transform: [{ scale: denyScale }], flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <MaterialCommunityIcons name="thumb-down" size={14} color={isLocked ? colors.textTertiary : Colors.error} />
                    <NeonText variant="caption" color={isLocked ? colors.textTertiary : Colors.error} style={{ fontWeight: '700' }}>
                      {incident.denyCount}
                    </NeonText>
                  </Animated.View>
                </Pressable>
              </View>
            </View>
          )}

          <View style={styles.footer}>
            <View style={styles.reporter}>
              <BadgeIcon level={incident.reporterLevel} size="sm" />
              <NeonText variant="caption" color={colors.textSecondary} style={styles.reporterName}>
                {incident.reporterName}
              </NeonText>
            </View>

            <View style={styles.stats}>
              <View style={styles.stat}>
                <MaterialCommunityIcons name="eye-outline" size={14} color={colors.textTertiary} />
                <NeonText variant="caption" color={colors.textTertiary}>
                  {incident.views}
                </NeonText>
              </View>
              <Pressable style={styles.stat} onPress={toggleComments} accessibilityLabel={`${incident.commentCount} comentários`}>
                <MaterialCommunityIcons name="comment-outline" size={14} color={showComments ? Colors.primary : colors.textTertiary} />
                <NeonText variant="caption" color={showComments ? Colors.primary : colors.textTertiary}>
                  {incident.commentCount}
                </NeonText>
              </Pressable>
            </View>
          </View>

          {!compact && showComments && (
            <View style={styles.commentSection}>
              <View style={styles.commentDivider} />

              {incident.comments.length > 0 && (
                <FlatList
                  data={incident.comments.slice(-5)}
                  keyExtractor={(c) => c.id}
                  renderItem={renderComment}
                  scrollEnabled={false}
                  style={styles.commentList}
                />
              )}

              {incident.comments.length === 0 && (
                <NeonText variant="caption" color={colors.textTertiary} style={styles.noComments}>
                  Nenhum comentário ainda. Seja o primeiro!
                </NeonText>
              )}

              <View style={styles.commentInputRow}>
                <TextInput
                  style={[styles.commentInput, { color: colors.textPrimary, borderColor: colors.textTertiary + '40' }]}
                  placeholder="Adicionar comentário..."
                  placeholderTextColor={colors.textTertiary}
                  value={commentText}
                  onChangeText={(t) => setCommentText(t.slice(0, MAX_COMMENT_LENGTH))}
                  maxLength={MAX_COMMENT_LENGTH}
                  multiline={false}
                  returnKeyType="send"
                  onSubmitEditing={handleSubmitComment}
                />
                <Pressable
                  onPress={handleSubmitComment}
                  disabled={!commentText.trim()}
                  style={[styles.commentSendBtn, !commentText.trim() && { opacity: 0.3 }]}
                  accessibilityLabel="Enviar comentário"
                >
                  <MaterialCommunityIcons name="send" size={18} color={Colors.primary} />
                </Pressable>
              </View>
              <NeonText variant="caption" color={colors.textTertiary} style={styles.charCount}>
                {commentText.length}/{MAX_COMMENT_LENGTH}
              </NeonText>
            </View>
          )}
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
  neonBadge: {
    fontWeight: '800',
    fontSize: 10,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  description: {
    marginBottom: Spacing.sm,
  },
  voteSection: {
    marginBottom: Spacing.sm,
  },
  voteBar: {
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.06)',
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  voteBarFillConfirm: {
    height: '100%',
    backgroundColor: Colors.success,
    borderRadius: 2,
  },
  voteBarFillDeny: {
    height: '100%',
    backgroundColor: Colors.error,
    borderRadius: 2,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  voteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  voteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  voteBtnConfirm: {
    borderColor: Colors.success + '30',
    backgroundColor: Colors.success + '08',
  },
  voteBtnDeny: {
    borderColor: Colors.error + '30',
    backgroundColor: Colors.error + '08',
  },
  voteBtnPressed: {
    opacity: 0.7,
  },
  voteBtnDisabled: {
    opacity: 0.35,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'transparent',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
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
  commentSection: {
    marginTop: Spacing.sm,
  },
  commentDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginBottom: Spacing.sm,
  },
  commentList: {
    maxHeight: 200,
    marginBottom: Spacing.sm,
  },
  commentItem: {
    marginBottom: Spacing.sm,
    paddingLeft: 4,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  commentUser: {
    fontWeight: '700',
    marginLeft: 4,
  },
  commentTime: {
    marginLeft: 6,
    fontSize: 9,
  },
  commentText: {
    paddingLeft: 20,
    lineHeight: 16,
  },
  noComments: {
    textAlign: 'center',
    paddingVertical: Spacing.sm,
    fontStyle: 'italic',
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  commentInput: {
    flex: 1,
    height: 36,
    borderWidth: 1,
    borderRadius: Radius.sm,
    paddingHorizontal: 10,
    fontSize: 13,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  commentSendBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primary + '15',
  },
  charCount: {
    textAlign: 'right',
    marginTop: 2,
    fontSize: 9,
  },
});
