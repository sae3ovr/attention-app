import { create } from 'zustand';
import type { Chain, ChainMember, ChainMessage, ChainAlert, ChainMemberType, GeoPosition, ChainMemberMeta } from '../types';
import { ChainDB, ChainMemberDB, ChainMessageDB, ChainAlertDB } from '../services/database';

interface ChainState {
  chains: Chain[];
  activeChain: Chain | null;
  members: ChainMember[];
  messages: ChainMessage[];
  alerts: ChainAlert[];
  isLoading: boolean;

  loadChains: (uid: string) => Promise<void>;
  selectChain: (chain: Chain | null) => void;
  createChain: (uid: string, name: string) => Promise<string>;
  joinChain: (code: string, uid: string) => Promise<boolean>;

  addMember: (data: {
    chainId: string;
    type: ChainMemberType;
    name: string;
    ownerUid: string;
    metadata: ChainMemberMeta;
  }) => Promise<string>;
  removeMember: (id: string, uid: string) => Promise<void>;
  updateMemberLocation: (id: string, location: GeoPosition) => Promise<void>;

  sendMessage: (chainId: string, senderUid: string, senderName: string, type: ChainMessage['type'], content: string, extra?: { location?: GeoPosition; alertLevel?: ChainAlert['severity'] }) => Promise<void>;
  sendAlert: (chainId: string, senderUid: string, senderName: string, type: ChainAlert['type'], title: string, message: string, severity: ChainAlert['severity'], location?: GeoPosition) => Promise<void>;
  acknowledgeAlert: (alertId: string, uid: string) => Promise<void>;
  triggerSOS: (chainId: string, uid: string, name: string, location: GeoPosition) => Promise<void>;
}

export const useChainStore = create<ChainState>()((set, get) => ({
  chains: [],
  activeChain: null,
  members: [],
  messages: [],
  alerts: [],
  isLoading: false,

  loadChains: async (uid) => {
    set({ isLoading: true });
    const chains = await ChainDB.getByUser(uid);
    set({ chains, isLoading: false });

    if (chains.length > 0 && !get().activeChain) {
      const chain = chains[0];
      set({ activeChain: chain });
      const members = await ChainMemberDB.getByChain(chain.id);
      const messages = await ChainMessageDB.getByChain(chain.id);
      const alerts = await ChainAlertDB.getByChain(chain.id);
      set({ members, messages, alerts });
    }
  },

  selectChain: async (chain) => {
    set({ activeChain: chain });
    if (chain) {
      const members = await ChainMemberDB.getByChain(chain.id);
      const messages = await ChainMessageDB.getByChain(chain.id);
      const alerts = await ChainAlertDB.getByChain(chain.id);
      set({ members, messages, alerts });
    } else {
      set({ members: [], messages: [], alerts: [] });
    }
  },

  createChain: async (uid, name) => {
    const id = await ChainDB.create(uid, name);
    const chains = await ChainDB.getByUser(uid);
    set({ chains });
    return id;
  },

  joinChain: async (code, uid) => {
    const chainId = await ChainDB.joinByCode(code, uid);
    if (!chainId) return false;
    const chains = await ChainDB.getByUser(uid);
    set({ chains });
    return true;
  },

  addMember: async (data) => {
    const id = await ChainMemberDB.add({
      ...data,
      avatar: null,
      locationSharingEnabled: true,
      isOnline: false,
      batteryLevel: undefined,
    });
    if (get().activeChain?.id === data.chainId) {
      const members = await ChainMemberDB.getByChain(data.chainId);
      set({ members });
    }
    return id;
  },

  removeMember: async (id, uid) => {
    const member = get().members.find((m) => m.id === id);
    await ChainMemberDB.remove(id, uid);
    if (member && get().activeChain?.id === member.chainId) {
      const members = await ChainMemberDB.getByChain(member.chainId);
      set({ members });
    }
  },

  updateMemberLocation: async (id, location) => {
    await ChainMemberDB.updateLocation(id, location);
    const activeChain = get().activeChain;
    if (activeChain) {
      const members = await ChainMemberDB.getByChain(activeChain.id);
      set({ members });
    }
  },

  sendMessage: async (chainId, senderUid, senderName, type, content, extra) => {
    await ChainMessageDB.send({
      chainId, senderUid, senderName, type, content,
      location: extra?.location,
      alertLevel: extra?.alertLevel,
    });
    const messages = await ChainMessageDB.getByChain(chainId);
    set({ messages });
  },

  sendAlert: async (chainId, senderUid, senderName, type, title, message, severity, location) => {
    await ChainAlertDB.create({
      chainId, senderUid, senderName, type, title, message, severity, location,
    });
    const alerts = await ChainAlertDB.getByChain(chainId);
    set({ alerts });
  },

  acknowledgeAlert: async (alertId, uid) => {
    await ChainAlertDB.acknowledge(alertId, uid);
    const activeChain = get().activeChain;
    if (activeChain) {
      const alerts = await ChainAlertDB.getByChain(activeChain.id);
      set({ alerts });
    }
  },

  triggerSOS: async (chainId, uid, name, location) => {
    await ChainAlertDB.create({
      chainId, senderUid: uid, senderName: name,
      type: 'sos', title: 'SOS EMERGENCY',
      message: `${name} triggered an SOS alert! They may need immediate help.`,
      severity: 'critical', location,
    });
    await ChainMessageDB.send({
      chainId, senderUid: uid, senderName: name,
      type: 'sos', content: `🚨 SOS! I need help! My location has been shared.`,
      location,
    });
    const alerts = await ChainAlertDB.getByChain(chainId);
    const messages = await ChainMessageDB.getByChain(chainId);
    set({ alerts, messages });
  },
}));
