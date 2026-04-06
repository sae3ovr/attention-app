import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, Platform, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NeonText } from '../../src/components/ui/NeonText';
import { LogoMark } from '../../src/components/ui/LogoMark';
import { NeonButton } from '../../src/components/ui/NeonButton';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { useA11y, announce } from '../../src/hooks/useAccessibility';
import { useHaptics } from '../../src/hooks/useHaptics';
import { useResponsive } from '../../src/hooks/useResponsive';
import { useFamilyStore } from '../../src/stores/familyStore';
import { Colors } from '../../src/theme/colors';
import { Spacing, Radius } from '../../src/theme/spacing';
import type { FamilyMember } from '../../src/types';

const roleColors: Record<string, string> = {
  admin: Colors.primary, member: Colors.secondary, kid: Colors.warning,
};
const roleLabels: Record<string, string> = {
  admin: 'Admin', member: 'Membro', kid: 'Modo Criança',
};
const roleIcons: Record<string, string> = {
  admin: 'shield-account', member: 'account', kid: 'account-child',
};

function MemberCard({ member, onLocate }: { member: FamilyMember; onLocate: () => void }) {
  const { colors, minTarget } = useA11y();
  const haptics = useHaptics();
  const color = roleColors[member.role];

  const statusLabel = member.isOnline
    ? member.role === 'kid'
      ? member.isInSafeZone ? 'Na zona segura' : '⚠ Fora da zona segura!'
      : 'Online'
    : 'Offline';

  return (
    <GlassCard style={styles.memberCard}
      glowColor={member.role === 'kid' && !member.isInSafeZone ? Colors.error + '20' : undefined}
      accessibilityLabel={`${member.displayName}, ${roleLabels[member.role]}, ${statusLabel}${member.batteryLevel != null ? `, battery ${member.batteryLevel}%` : ''}`}>
      <View style={styles.memberRow}>
        <View style={[styles.avatar, { backgroundColor: color + '15', borderColor: color }]}>
          <MaterialCommunityIcons name={roleIcons[member.role] as any} size={24} color={color} />
          {member.isOnline && (
            <View style={[styles.onlineDot, { backgroundColor: Colors.success, borderColor: colors.surface }]} />
          )}
        </View>

        <View style={styles.memberInfo}>
          <View style={styles.memberNameRow}>
            <NeonText variant="body" style={{ fontWeight: '600' }}>{member.displayName}</NeonText>
            {member.role === 'kid' && (
              <View style={[styles.kidTag, { backgroundColor: Colors.warning + '15' }]}>
                <NeonText variant="caption" color={Colors.warning} style={{ fontWeight: '700', fontSize: 10 }}>
                  KID
                </NeonText>
              </View>
            )}
          </View>
          <View style={styles.memberMeta}>
            <NeonText variant="caption" color={color}>{roleLabels[member.role]}</NeonText>
            {member.role === 'kid' && member.isInSafeZone !== undefined && (
              <View style={styles.safeZoneTag}>
                <MaterialCommunityIcons
                  name={member.isInSafeZone ? 'check-circle' : 'alert-circle'} size={12}
                  color={member.isInSafeZone ? Colors.success : Colors.error} />
                <NeonText variant="caption" color={member.isInSafeZone ? Colors.success : Colors.error}>
                  {member.isInSafeZone ? 'Zona Segura' : 'Fora da Zona'}
                </NeonText>
              </View>
            )}
          </View>
        </View>

        <View style={styles.memberActions}>
          {member.batteryLevel != null && (
            <View style={styles.battery} accessible accessibilityLabel={`Battery ${member.batteryLevel}%`}>
              <MaterialCommunityIcons
                name={member.batteryLevel > 50 ? 'battery-high' : member.batteryLevel > 20 ? 'battery-medium' : 'battery-low'}
                size={16}
                color={member.batteryLevel > 50 ? Colors.success : member.batteryLevel > 20 ? Colors.warning : Colors.error} />
              <NeonText variant="caption" color={colors.textTertiary}>{member.batteryLevel}%</NeonText>
            </View>
          )}
          {member.locationSharingEnabled && member.isOnline && member.location && (
            <Pressable onPress={() => { haptics.light(); onLocate(); }}
              style={({ pressed }) => [styles.locateBtn, {
                backgroundColor: pressed ? Colors.primary + '30' : Colors.primary + '12',
                transform: [{ scale: pressed ? 0.88 : 1 }],
              }]}
              accessible accessibilityLabel={`Locate ${member.displayName} on map`} accessibilityRole="button">
              <MaterialCommunityIcons name="crosshairs-gps" size={16} color={Colors.primary} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Kid details expanded */}
      {member.role === 'kid' && member.isOnline && (
        <View style={[styles.kidDetails, { borderTopColor: colors.border }]}>
          <View style={styles.kidDetailRow}>
            <MaterialCommunityIcons name="map-marker-radius" size={14} color={Colors.primary} />
            <NeonText variant="caption" color={colors.textSecondary} style={{ marginLeft: 4 }}>
              Localização: Ativa • Atualiza a cada 30s
            </NeonText>
          </View>
          <View style={styles.kidDetailRow}>
            <MaterialCommunityIcons name="shield-check" size={14} color={Colors.success} />
            <NeonText variant="caption" color={colors.textSecondary} style={{ marginLeft: 4 }}>
              Zona Segura: Escola (raio de 500m) — {member.isInSafeZone ? 'Dentro' : 'FORA'}
            </NeonText>
          </View>
          <View style={styles.kidDetailRow}>
            <MaterialCommunityIcons name="bell-ring" size={14} color={Colors.warning} />
            <NeonText variant="caption" color={colors.textSecondary} style={{ marginLeft: 4 }}>
              Alertas: Saída de zona, Bateria fraca, SOS
            </NeonText>
          </View>
        </View>
      )}
    </GlassCard>
  );
}

export default function FamilyScreen() {
  const { colors, minTarget } = useA11y();
  const haptics = useHaptics();
  const { isDesktop } = useResponsive();
  const { activeGroup, members, isLoading, loadFamily, sendCheckIn } = useFamilyStore();
  const [checkInSent, setCheckInSent] = useState(false);

  useEffect(() => { loadFamily(); }, []);

  const maxWidth = isDesktop ? 640 : undefined;

  const handleCheckIn = () => {
    haptics.success();
    sendCheckIn();
    setCheckInSent(true);
    announce("Check-in enviado! Sua família sabe que está bem.");
    setTimeout(() => setCheckInSent(false), 3000);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }, isDesktop && { alignItems: 'center' }]}>
      <View style={[styles.header, maxWidth ? { maxWidth, width: '100%' } : undefined]}>
        <View style={styles.headerTitleRow}>
          <LogoMark size={28} color={Colors.primary} />
          <View style={styles.headerTitleText}>
            <NeonText variant="h2" glow={colors.primaryGlow}>Família</NeonText>
            {activeGroup && (
              <NeonText variant="bodySm" color={colors.textSecondary}>
                {activeGroup.name} • {activeGroup.memberCount}/{activeGroup.maxMembers} membros
              </NeonText>
            )}
          </View>
        </View>
      </View>

      {activeGroup && (
        <FlatList
          data={[null, ...members]}
          keyExtractor={(item, i) => item?.uid ?? `header-${i}`}
          contentContainerStyle={[styles.list, maxWidth ? { maxWidth, width: '100%', alignSelf: 'center' } : undefined]}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <>
              {/* Invite code */}
              <GlassCard style={styles.inviteCard} glowColor={colors.primary + '20'}>
                <View style={styles.inviteRow}>
                  <View>
                    <NeonText variant="label" color={colors.textSecondary}>Código de Convite</NeonText>
                    <NeonText variant="h3" color={colors.primary} glow={colors.primaryGlow}>
                      {activeGroup.inviteCode}
                    </NeonText>
                  </View>
                  <Pressable onPress={() => { haptics.light(); announce('Código de convite copiado'); }}
                    style={[styles.copyBtn, { backgroundColor: colors.primary + '15', minHeight: minTarget, minWidth: minTarget }]}
                    accessible accessibilityLabel={`Copy invite code ${activeGroup.inviteCode}`} accessibilityRole="button">
                    <MaterialCommunityIcons name="content-copy" size={20} color={colors.primary} />
                  </Pressable>
                </View>
              </GlassCard>

              {/* Quick actions */}
              <View style={styles.quickActions}>
                <NeonButton
                  title={checkInSent ? "Enviado! ✓" : "Estou Bem"}
                  icon={checkInSent ? "check-circle" : "hand-wave"}
                  onPress={handleCheckIn}
                  size="md" style={styles.quickBtn}
                  disabled={checkInSent}
                  accessibilityHint="Enviar check-in de segurança para sua família" />
                <NeonButton
                  title="Compartilhar Localização" icon="map-marker-radius"
                  onPress={() => { haptics.light(); announce('Localização compartilhada com a família'); }}
                  variant="secondary" size="md" style={styles.quickBtn}
                  accessibilityHint="Compartilhar localização em tempo real com familiares" />
              </View>

              {/* Kid mode status */}
              {members.some((m) => m.role === 'kid') && (
                <GlassCard style={styles.kidModeCard} glowColor={Colors.warning + '15'}>
                  <View style={styles.kidModeHeader}>
                    <MaterialCommunityIcons name="account-child-circle" size={22} color={Colors.warning} />
                    <NeonText variant="label" color={Colors.warning} style={{ marginLeft: Spacing.sm }}>
                      Modo Criança Ativo
                    </NeonText>
                  </View>
                  <NeonText variant="caption" color={colors.textSecondary}>
                    Rastreamento em tempo real, monitoramento de zona segura e alertas instantâneos para crianças.
                  </NeonText>
                </GlassCard>
              )}

              <NeonText variant="label" color={colors.textSecondary} style={styles.sectionTitle}>
                Membros ({members.length})
              </NeonText>
            </>
          }
          renderItem={({ item }) =>
            item ? (
              <MemberCard member={item} onLocate={() => announce(`Locating ${item.displayName} on map`)} />
            ) : null
          }
        />
      )}

      {!activeGroup && !isLoading && (
        <View style={styles.empty}>
          <MaterialCommunityIcons name="account-group" size={64} color={colors.textTertiary} />
          <NeonText variant="h4" color={colors.textSecondary} style={styles.emptyTitle}>
            Nenhum Grupo Familiar
          </NeonText>
          <NeonText variant="body" color={colors.textTertiary} style={styles.emptyDesc}>
            Crie ou entre num grupo familiar para compartilhar localizações e manter-se conectado
          </NeonText>
          <View style={styles.emptyActions}>
            <NeonButton title="Criar Grupo" icon="plus" onPress={() => haptics.light()} />
            <NeonButton title="Entrar no Grupo" icon="login" onPress={() => haptics.light()} variant="secondary" />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: Platform.OS === 'web' ? 24 : Platform.OS === 'ios' ? 64 : 44,
    paddingHorizontal: Spacing.xl, paddingBottom: Spacing.md,
  },
  headerTitleRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm,
  },
  headerTitleText: { flex: 1 },
  list: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing['5xl'], gap: Spacing.sm },
  inviteCard: { marginBottom: Spacing.lg, padding: Spacing.lg },
  inviteRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  copyBtn: {
    borderRadius: Radius.md, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.md,
    ...(Platform.OS === 'web' ? { transition: 'all 0.2s ease', cursor: 'pointer' } as any : {}),
  },
  quickActions: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.lg },
  quickBtn: { flex: 1 },

  kidModeCard: { padding: Spacing.lg, marginBottom: Spacing.lg },
  kidModeHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },

  sectionTitle: { marginBottom: Spacing.md },
  memberCard: {
    padding: Spacing.lg,
    ...(Platform.OS === 'web' ? { transition: 'all 0.2s ease' } as any : {}),
  },
  memberRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 48, height: 48, borderRadius: 24, borderWidth: 1.5,
    justifyContent: 'center', alignItems: 'center', position: 'relative',
  },
  onlineDot: {
    position: 'absolute', bottom: 0, right: 0,
    width: 12, height: 12, borderRadius: 6, borderWidth: 2,
  },
  memberInfo: { flex: 1, marginLeft: Spacing.md },
  memberNameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  kidTag: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 },
  memberMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: 2 },
  safeZoneTag: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  memberActions: { alignItems: 'center', gap: Spacing.xs },
  battery: { alignItems: 'center' },
  locateBtn: {
    width: 32, height: 32, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
    ...(Platform.OS === 'web' ? { transition: 'all 0.2s ease', cursor: 'pointer' } as any : {}),
  },
  kidDetails: {
    marginTop: Spacing.md, paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth, gap: Spacing.xs,
  },
  kidDetailRow: { flexDirection: 'row', alignItems: 'center' },
  empty: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: Spacing['3xl'],
  },
  emptyTitle: { marginTop: Spacing.lg },
  emptyDesc: { textAlign: 'center', marginTop: Spacing.sm, marginBottom: Spacing.xl },
  emptyActions: { flexDirection: 'row', gap: Spacing.md },
});
