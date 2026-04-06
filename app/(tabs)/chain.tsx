import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, StyleSheet, Pressable, FlatList, TextInput, Platform, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { NeonText } from '../../src/components/ui/NeonText';
import { LogoMark } from '../../src/components/ui/LogoMark';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { useA11y, announce } from '../../src/hooks/useAccessibility';
import { useHaptics } from '../../src/hooks/useHaptics';
import { useChainStore } from '../../src/stores/chainStore';
import { useAuthStore } from '../../src/stores/authStore';
import { Colors } from '../../src/theme/colors';
import { Spacing, Radius } from '../../src/theme/spacing';
import { timeAgo } from '../../src/services/mockData';
import type { ChainMember, ChainMessage, ChainMemberType } from '../../src/types';

const MEMBER_TYPE_META: Record<ChainMemberType, { icon: string; color: string; label: string }> = {
  friend: { icon: 'account', color: '#2196FF', label: 'Amigo' },
  pet: { icon: 'paw', color: '#FF9800', label: 'Pet' },
  vehicle: { icon: 'car', color: '#00E676', label: 'Veículo' },
  device: { icon: 'cellphone', color: '#AB47BC', label: 'Dispositivo' },
};

const MSG_TYPE_ICON: Record<string, { icon: string; color: string }> = {
  text: { icon: 'message-text', color: '#8A8AAA' },
  alert: { icon: 'alert-circle', color: Colors.warning },
  location: { icon: 'map-marker', color: '#2196FF' },
  sos: { icon: 'alert-octagon', color: Colors.error },
  check_in: { icon: 'check-circle', color: Colors.success },
  image: { icon: 'image', color: '#AB47BC' },
};

type ViewMode = 'members' | 'messages' | 'alerts' | 'add';

export default function ChainScreen() {
  const { colors } = useA11y();
  const haptics = useHaptics();
  const user = useAuthStore((s) => s.user);
  const {
    chains, activeChain, members, messages, alerts,
    loadChains, selectChain, createChain, joinChain,
    addMember, sendMessage, sendAlert, triggerSOS, acknowledgeAlert,
  } = useChainStore();

  const [viewMode, setViewMode] = useState<ViewMode>('members');
  const [msgInput, setMsgInput] = useState('');
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<ChainMemberType>('friend');
  const [addField, setAddField] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const msgListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (user) loadChains(user.uid);
  }, [user?.uid]);

  const handleSend = useCallback(() => {
    if (!msgInput.trim() || !activeChain || !user) return;
    haptics.light();
    sendMessage(activeChain.id, user.uid, user.displayName, 'text', msgInput.trim());
    setMsgInput('');
  }, [msgInput, activeChain, user]);

  const handleSOS = useCallback(() => {
    if (!activeChain || !user) return;
    haptics.heavy();
    triggerSOS(activeChain.id, user.uid, user.displayName, { latitude: 41.2356, longitude: -8.6200 });
    announce('Alerta SOS enviado para todos os membros!');
  }, [activeChain, user]);

  const handleAddMember = useCallback(() => {
    if (!newName.trim() || !activeChain || !user) return;
    haptics.medium();
    addMember({
      chainId: activeChain.id,
      type: newType,
      name: newName.trim(),
      ownerUid: user.uid,
      metadata: { notes: addField },
    });
    setNewName('');
    setAddField('');
    setViewMode('members');
    announce(`${newName} adicionado como ${MEMBER_TYPE_META[newType].label}`);
  }, [newName, newType, addField, activeChain, user]);

  const handleCreateChain = useCallback(async () => {
    if (!user) return;
    haptics.medium();
    await createChain(user.uid, 'Minha Cadeia de Segurança');
    announce('Nova cadeia criada');
  }, [user]);

  const handleJoin = useCallback(async () => {
    if (!joinCode.trim() || !user) return;
    haptics.medium();
    const ok = await joinChain(joinCode.trim(), user.uid);
    announce(ok ? 'Entrou na cadeia com sucesso' : 'Código de convite inválido');
    setJoinCode('');
  }, [joinCode, user]);

  const goToMemberLocation = useCallback((member: ChainMember) => {
    if (!member.location) {
      announce('Localização indisponível para este membro');
      return;
    }
    haptics.medium();
    router.push({
      pathname: '/(tabs)',
      params: {
        focusLat: member.location.latitude.toString(),
        focusLng: member.location.longitude.toString(),
        focusName: member.name,
      },
    });
  }, [haptics]);

  const renderMember = ({ item }: { item: ChainMember }) => {
    const meta = MEMBER_TYPE_META[item.type];
    const hasLocation = !!item.location;
    return (
      <GlassCard style={s.memberCard}>
        <View style={[s.memberAvatar, { backgroundColor: meta.color + '20', borderColor: meta.color + '40' }]}>
          <MaterialCommunityIcons name={meta.icon as any} size={22} color={meta.color} />
        </View>
        <View style={s.memberInfo}>
          <NeonText variant="label" color={colors.textPrimary}>{item.name}</NeonText>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
            <View style={[s.typeBadge, { backgroundColor: meta.color + '15', borderColor: meta.color + '30' }]}>
              <NeonText variant="caption" color={meta.color} style={{ fontSize: 9, fontWeight: '700' }}>{meta.label}</NeonText>
            </View>
            {item.isOnline && <View style={[s.onlineDot, { backgroundColor: Colors.success }]} />}
            {item.batteryLevel !== undefined && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                <MaterialCommunityIcons
                  name={(item.batteryLevel > 60 ? 'battery' : item.batteryLevel > 20 ? 'battery-50' : 'battery-alert') as any}
                  size={12}
                  color={item.batteryLevel > 20 ? Colors.success : Colors.error}
                />
                <NeonText variant="caption" color={colors.textTertiary} style={{ fontSize: 9 }}>{item.batteryLevel}%</NeonText>
              </View>
            )}
          </View>
          {item.location && (
            <NeonText variant="caption" color={colors.textTertiary} style={{ fontSize: 9, marginTop: 2 }}>
              📍 {item.location.latitude.toFixed(4)}, {item.location.longitude.toFixed(4)}
            </NeonText>
          )}
        </View>
        <View style={s.memberActions}>
          <Pressable
            onPress={() => goToMemberLocation(item)}
            style={({ pressed }) => [
              s.locateBtn,
              {
                backgroundColor: hasLocation
                  ? pressed ? meta.color + '30' : meta.color + '12'
                  : colors.border + '30',
                borderColor: hasLocation ? meta.color + '40' : colors.border,
                transform: [{ scale: pressed ? 0.9 : 1 }],
              },
            ]}
            accessibilityLabel={`Ir à localização de ${item.name}`}
            accessibilityRole="button"
            disabled={!hasLocation}
          >
            <MaterialCommunityIcons name="crosshairs-gps" size={15} color={hasLocation ? meta.color : colors.textTertiary} />
            <NeonText variant="caption" color={hasLocation ? meta.color : colors.textTertiary} style={{ fontSize: 8, fontWeight: '800', marginTop: 1 }}>
              IR
            </NeonText>
          </Pressable>
          <Pressable
            onPress={() => {
              if (!item.location) { announce('Localização indisponível'); return; }
              haptics.light();
              if (activeChain && user) {
                sendAlert(activeChain.id, user.uid, user.displayName, {
                  title: `Ping: ${item.name}`,
                  message: `Pedido de localização para ${item.name}`,
                  severity: 'info',
                  type: 'location',
                });
                announce(`Ping enviado para ${item.name}`);
              }
            }}
            style={({ pressed }) => [
              s.locateBtn,
              {
                backgroundColor: pressed ? '#2196FF30' : '#2196FF12',
                borderColor: '#2196FF40',
                transform: [{ scale: pressed ? 0.9 : 1 }],
              },
            ]}
            accessibilityLabel={`Enviar ping para ${item.name}`}
            accessibilityRole="button"
          >
            <MaterialCommunityIcons name="bell-ring-outline" size={14} color="#2196FF" />
            <NeonText variant="caption" color="#2196FF" style={{ fontSize: 8, fontWeight: '800', marginTop: 1 }}>
              PING
            </NeonText>
          </Pressable>
        </View>
      </GlassCard>
    );
  };

  const renderMessage = ({ item }: { item: ChainMessage }) => {
    const isMe = item.senderUid === user?.uid;
    const meta = MSG_TYPE_ICON[item.type] || MSG_TYPE_ICON.text;
    const isSOS = item.type === 'sos';

    return (
      <View style={[s.msgBubble, isMe ? s.msgBubbleMe : s.msgBubbleOther, isSOS && { borderColor: Colors.error + '60', backgroundColor: Colors.error + '10' }]}>
        {!isMe && <NeonText variant="caption" color={meta.color} style={{ fontSize: 9, fontWeight: '700', marginBottom: 2 }}>{item.senderName}</NeonText>}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          {item.type !== 'text' && <MaterialCommunityIcons name={meta.icon as any} size={14} color={meta.color} />}
          <NeonText variant="bodySm" color={colors.textPrimary} style={{ flex: 1 }}>{item.content}</NeonText>
        </View>
        <NeonText variant="caption" color={colors.textTertiary} style={{ fontSize: 8, textAlign: isMe ? 'right' : 'left', marginTop: 2 }}>{timeAgo(item.createdAt)}</NeonText>
      </View>
    );
  };

  if (!activeChain) {
    return (
      <View style={[s.container, { backgroundColor: colors.background }]}>
        <View style={s.emptyContainer}>
          <LogoMark size={40} color={Colors.primary} />
          <MaterialCommunityIcons name="link-variant" size={64} color={colors.primary} />
          <NeonText variant="h3" style={{ marginTop: Spacing.lg, textAlign: 'center' }}>Sistema Chain</NeonText>
          <NeonText variant="body" color={colors.textSecondary} style={{ textAlign: 'center', marginTop: Spacing.sm, marginBottom: Spacing.xl }}>
            Conecte amigos, pets, veículos e dispositivos. Compartilhe localização, envie alertas e mantenha todos seguros.
          </NeonText>

          <Pressable onPress={handleCreateChain}
            style={({ pressed }) => [s.actionButton, { backgroundColor: pressed ? colors.primaryDim : colors.primary, transform: [{ scale: pressed ? 0.96 : 1 }] }]}>
            <MaterialCommunityIcons name="plus" size={20} color={colors.background} />
            <NeonText variant="buttonSm" color={colors.background} style={{ fontWeight: '700', marginLeft: 6 }}>Criar Nova Cadeia</NeonText>
          </Pressable>

          <View style={[s.joinRow, { borderColor: colors.border }]}>
            <TextInput
              value={joinCode}
              onChangeText={setJoinCode}
              placeholder="Código de convite..."
              placeholderTextColor={colors.textTertiary}
              style={[s.joinInput, { color: colors.textPrimary, borderColor: colors.border }]}
            />
            <Pressable onPress={handleJoin} style={({ pressed }) => [s.joinBtn, { backgroundColor: pressed ? Colors.secondary + '80' : Colors.secondary, opacity: joinCode.trim() ? 1 : 0.4 }]}>
              <NeonText variant="caption" color="#fff" style={{ fontWeight: '700' }}>Entrar</NeonText>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[s.header, { borderBottomColor: colors.border }]}>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <LogoMark size={24} color={Colors.primary} />
            <NeonText variant="h4" color={colors.primary}>{activeChain.name}</NeonText>
          </View>
          <NeonText variant="caption" color={colors.textTertiary}>{members.length} membros • Código: {activeChain.inviteCode}</NeonText>
        </View>
        <Pressable onPress={handleSOS}
          style={({ pressed }) => [s.sosBtn, { transform: [{ scale: pressed ? 0.85 : 1 }] }]}>
          <MaterialCommunityIcons name="alert-octagon" size={20} color="#fff" />
          <NeonText variant="caption" color="#fff" style={{ fontWeight: '900', fontSize: 9, marginTop: 1 }}>SOS</NeonText>
        </Pressable>
      </View>

      {/* Tabs */}
      <View style={[s.tabs, { borderBottomColor: colors.border }]}>
        {(['members', 'messages', 'alerts', 'add'] as ViewMode[]).map((tab) => {
          const active = viewMode === tab;
          const icons: Record<ViewMode, string> = { members: 'account-group', messages: 'message-text', alerts: 'bell', add: 'plus-circle' };
          const labels: Record<ViewMode, string> = { members: 'Membros', messages: 'Chat', alerts: 'Alertas', add: 'Adicionar' };
          const unread = tab === 'alerts' ? alerts.filter((a) => !a.isAcknowledged).length : 0;

          return (
            <Pressable key={tab} onPress={() => { haptics.selection(); setViewMode(tab); }}
              style={[s.tab, active && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}>
              <View style={{ position: 'relative' }}>
                <MaterialCommunityIcons name={icons[tab] as any} size={16} color={active ? colors.primary : colors.textTertiary} />
                {unread > 0 && <View style={s.tabBadge}><NeonText variant="caption" color="#fff" style={{ fontSize: 7, fontWeight: '900' }}>{unread}</NeonText></View>}
              </View>
              <NeonText variant="caption" color={active ? colors.primary : colors.textTertiary} style={{ fontWeight: '700', fontSize: 10, marginLeft: 4 }}>{labels[tab]}</NeonText>
            </Pressable>
          );
        })}
      </View>

      {/* Members View */}
      {viewMode === 'members' && (
        <FlatList
          data={members}
          keyExtractor={(m) => m.id}
          renderItem={renderMember}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<NeonText variant="body" color={colors.textTertiary} style={{ textAlign: 'center', marginTop: Spacing['3xl'] }}>Nenhum membro ainda. Adicione amigos, pets, veículos ou dispositivos.</NeonText>}
        />
      )}

      {/* Messages View */}
      {viewMode === 'messages' && (
        <View style={{ flex: 1 }}>
          <FlatList
            ref={msgListRef}
            data={messages}
            keyExtractor={(m) => m.id}
            renderItem={renderMessage}
            contentContainerStyle={[s.listContent, { paddingBottom: 60 }]}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => msgListRef.current?.scrollToEnd({ animated: true })}
          />
          <View style={[s.msgInputRow, { borderTopColor: colors.border, backgroundColor: colors.surface }]}>
            <Pressable onPress={() => {
              if (activeChain && user) {
                sendMessage(activeChain.id, user.uid, user.displayName, 'location', 'Shared current location', { location: { latitude: 41.2356, longitude: -8.6200 } });
              }
            }} style={{ padding: 4 }}>
              <MaterialCommunityIcons name="map-marker" size={22} color="#2196FF" />
            </Pressable>
            <TextInput
              value={msgInput}
              onChangeText={setMsgInput}
              placeholder="Digite uma mensagem..."
              placeholderTextColor={colors.textTertiary}
              style={[s.msgTextInput, { color: colors.textPrimary, backgroundColor: colors.glass.background, borderColor: colors.border }]}
              onSubmitEditing={handleSend}
              returnKeyType="send"
            />
            <Pressable onPress={handleSend} style={({ pressed }) => [s.sendBtn, { backgroundColor: msgInput.trim() ? colors.primary : colors.border, transform: [{ scale: pressed ? 0.85 : 1 }] }]}>
              <MaterialCommunityIcons name="send" size={16} color={colors.background} />
            </Pressable>
          </View>
        </View>
      )}

      {/* Alerts View */}
      {viewMode === 'alerts' && (
        <FlatList
          data={alerts}
          keyExtractor={(a) => a.id}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<NeonText variant="body" color={colors.textTertiary} style={{ textAlign: 'center', marginTop: Spacing['3xl'] }}>Nenhum alerta ainda.</NeonText>}
          renderItem={({ item }) => {
            const sevColor = item.severity === 'critical' ? Colors.error : item.severity === 'warning' ? Colors.warning : '#2196FF';
            return (
              <GlassCard style={[s.alertCard, { borderColor: sevColor + '40' }]}>
                <View style={[s.alertIcon, { backgroundColor: sevColor + '20' }]}>
                  <MaterialCommunityIcons name={item.type === 'sos' ? 'alert-octagon' : 'bell-ring'} size={20} color={sevColor} />
                </View>
                <View style={{ flex: 1 }}>
                  <NeonText variant="label" color={sevColor}>{item.title}</NeonText>
                  <NeonText variant="caption" color={colors.textSecondary} style={{ marginTop: 2 }}>{item.message}</NeonText>
                  <NeonText variant="caption" color={colors.textTertiary} style={{ fontSize: 9, marginTop: 4 }}>{timeAgo(item.createdAt)} • by {item.senderName}</NeonText>
                </View>
                {!item.isAcknowledged && (
                  <Pressable onPress={() => { haptics.light(); acknowledgeAlert(item.id, user?.uid || ''); }}
                    style={({ pressed }) => [s.ackBtn, { backgroundColor: pressed ? sevColor + '30' : sevColor + '15', borderColor: sevColor + '30' }]}>
                    <MaterialCommunityIcons name="check" size={14} color={sevColor} />
                  </Pressable>
                )}
              </GlassCard>
            );
          }}
        />
      )}

      {/* Add Member View */}
      {viewMode === 'add' && (
        <ScrollView contentContainerStyle={s.listContent} showsVerticalScrollIndicator={false}>
          <NeonText variant="h4" style={{ marginBottom: Spacing.lg }}>Adicionar à Cadeia</NeonText>

          <NeonText variant="label" color={colors.textSecondary} style={{ marginBottom: Spacing.sm }}>Tipo</NeonText>
          <View style={s.typeRow}>
            {(Object.keys(MEMBER_TYPE_META) as ChainMemberType[]).map((type) => {
              const meta = MEMBER_TYPE_META[type];
              const active = newType === type;
              return (
                <Pressable key={type} onPress={() => { haptics.selection(); setNewType(type); }}
                  style={[s.typeChip, { backgroundColor: active ? meta.color + '20' : colors.glass.background, borderColor: active ? meta.color : colors.border }]}>
                  <MaterialCommunityIcons name={meta.icon as any} size={18} color={active ? meta.color : colors.textTertiary} />
                  <NeonText variant="caption" color={active ? meta.color : colors.textSecondary} style={{ fontSize: 10, fontWeight: '700', marginTop: 2 }}>{meta.label}</NeonText>
                </Pressable>
              );
            })}
          </View>

          <NeonText variant="label" color={colors.textSecondary} style={{ marginTop: Spacing.lg, marginBottom: Spacing.sm }}>Nome *</NeonText>
          <TextInput
            value={newName}
            onChangeText={setNewName}
            placeholder={newType === 'pet' ? 'ex: Rex' : newType === 'vehicle' ? 'ex: Audi A3' : newType === 'device' ? 'ex: AirTag Chaves' : 'ex: Patrícia'}
            placeholderTextColor={colors.textTertiary}
            style={[s.input, { color: colors.textPrimary, backgroundColor: colors.glass.background, borderColor: colors.border }]}
          />

          <NeonText variant="label" color={colors.textSecondary} style={{ marginTop: Spacing.md, marginBottom: Spacing.sm }}>Notas (opcional)</NeonText>
          <TextInput
            value={addField}
            onChangeText={setAddField}
            placeholder="Telefone, raça, placa, etc."
            placeholderTextColor={colors.textTertiary}
            style={[s.input, { color: colors.textPrimary, backgroundColor: colors.glass.background, borderColor: colors.border }]}
          />

          <Pressable onPress={handleAddMember} disabled={!newName.trim()}
            style={({ pressed }) => [s.actionButton, {
              backgroundColor: !newName.trim() ? colors.border : pressed ? colors.primaryDim : colors.primary,
              opacity: !newName.trim() ? 0.4 : 1, marginTop: Spacing.xl,
              transform: [{ scale: pressed ? 0.96 : 1 }],
            }]}>
            <MaterialCommunityIcons name="plus" size={18} color={colors.background} />
            <NeonText variant="buttonSm" color={colors.background} style={{ fontWeight: '700', marginLeft: 6 }}>Adicionar {MEMBER_TYPE_META[newType].label}</NeonText>
          </Pressable>
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 54 : Platform.OS === 'android' ? 36 : 20,
    paddingBottom: Spacing.sm, paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
  },
  sosBtn: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: Colors.error, alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.error, shadowOpacity: 0.5, shadowRadius: 12, elevation: 8,
  },
  tabs: {
    flexDirection: 'row', borderBottomWidth: 1, paddingHorizontal: Spacing.sm,
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: Spacing.sm, borderBottomWidth: 2, borderBottomColor: 'transparent',
    ...(Platform.OS === 'web' ? { transition: 'all 0.2s ease', cursor: 'pointer' } as any : {}),
  },
  tabBadge: {
    position: 'absolute', top: -4, right: -6,
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: Colors.error, alignItems: 'center', justifyContent: 'center',
  },
  listContent: { padding: Spacing.lg, gap: Spacing.sm },

  memberCard: {
    flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: Spacing.md,
    ...(Platform.OS === 'web' ? { transition: 'all 0.2s ease' } as any : {}),
  },
  memberAvatar: { width: 44, height: 44, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  memberInfo: { flex: 1 },
  typeBadge: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4, borderWidth: 1 },
  onlineDot: { width: 6, height: 6, borderRadius: 3 },
  memberActions: { flexDirection: 'row', gap: 6 },
  locateBtn: {
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1,
    minWidth: 44,
    ...(Platform.OS === 'web' ? { transition: 'all 0.2s ease', cursor: 'pointer' } as any : {}),
  },

  msgBubble: { maxWidth: '80%', padding: Spacing.sm, borderRadius: 14, borderWidth: 1, marginBottom: Spacing.xs },
  msgBubbleMe: { alignSelf: 'flex-end', backgroundColor: 'rgba(0,170,255,0.08)', borderColor: 'rgba(0,170,255,0.15)' },
  msgBubbleOther: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' },
  msgInputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderTopWidth: 1,
  },
  msgTextInput: {
    flex: 1, height: 38, borderRadius: 19, borderWidth: 1,
    paddingHorizontal: Spacing.md, fontSize: 13,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}),
  },
  sendBtn: {
    width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center',
    ...(Platform.OS === 'web' ? { transition: 'all 0.2s ease', cursor: 'pointer' } as any : {}),
  },

  alertCard: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: Spacing.md },
  alertIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  ackBtn: { width: 32, height: 32, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },

  typeRow: { flexDirection: 'row', gap: Spacing.sm },
  typeChip: {
    flex: 1, alignItems: 'center', paddingVertical: Spacing.md,
    borderRadius: Radius.md, borderWidth: 1.5,
    ...(Platform.OS === 'web' ? { transition: 'all 0.2s ease', cursor: 'pointer' } as any : {}),
  },
  input: {
    borderWidth: 1, borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, fontSize: 14,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}),
  },
  actionButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: Spacing.md, borderRadius: Radius.md,
    ...(Platform.OS === 'web' ? { transition: 'all 0.25s ease', cursor: 'pointer' } as any : {}),
  },

  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing['3xl'] },
  joinRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xl, width: '100%', maxWidth: 320 },
  joinInput: {
    flex: 1, borderWidth: 1, borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, height: 42, fontSize: 14,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}),
  },
  joinBtn: { height: 42, paddingHorizontal: Spacing.lg, borderRadius: Radius.md, justifyContent: 'center' },
});
