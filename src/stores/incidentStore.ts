import { create } from 'zustand';
import type { Incident, IncidentCategory, IncidentSeverity, GeoPosition, IncidentComment } from '../types';
import { MOCK_INCIDENTS } from '../services/mockData';
import { useAuthStore } from './authStore';
import { analyzeCredibility } from '../services/credibilityEngine';
import { fetchAllPublicData } from '../services/publicDataService';

interface IncidentState {
  incidents: Incident[];
  selectedIncident: Incident | null;
  filterCategory: IncidentCategory | null;
  isLoading: boolean;
  publicDataLoaded: boolean;
  loadIncidents: () => Promise<void>;
  loadPublicData: (lat?: number, lng?: number) => Promise<void>;
  refreshPublicData: (lat?: number, lng?: number) => Promise<void>;
  selectIncident: (incident: Incident | null) => void;
  setFilter: (category: IncidentCategory | null) => void;
  confirmIncident: (incidentId: string) => void;
  denyIncident: (incidentId: string) => void;
  viewIncident: (incidentId: string) => void;
  addComment: (incidentId: string, text: string) => void;
  verifyIncident: (incidentId: string, guardianUid: string, guardianName: string) => void;
  createIncident: (data: {
    category: IncidentCategory;
    severity: IncidentSeverity;
    title: string;
    description: string;
    location: GeoPosition;
  }) => Promise<void>;
}

export const useIncidentStore = create<IncidentState>()((set, get) => ({
  incidents: [],
  selectedIncident: null,
  filterCategory: null,
  isLoading: false,
  publicDataLoaded: false,

  loadIncidents: async () => {
    set({ isLoading: true });
    const existing = get().incidents;
    const mockIds = new Set(MOCK_INCIDENTS.map((i) => i.id));
    const hasMocks = existing.some((i) => mockIds.has(i.id));
    if (!hasMocks) {
      set((state) => ({
        incidents: [...MOCK_INCIDENTS, ...state.incidents],
        isLoading: false,
      }));
    } else {
      set({ isLoading: false });
    }
  },

  loadPublicData: async (lat?: number, lng?: number) => {
    if (get().publicDataLoaded) return;
    set({ publicDataLoaded: true });
    try {
      const publicIncidents = await fetchAllPublicData(lat, lng);
      const existingIds = new Set(get().incidents.map((i) => i.id));
      const newOnes = publicIncidents.filter((i) => !existingIds.has(i.id));
      if (newOnes.length > 0) {
        set((state) => ({
          incidents: [...state.incidents, ...newOnes],
        }));
      }
    } catch { /* silent */ }
  },

  refreshPublicData: async (lat?: number, lng?: number) => {
    try {
      const publicIncidents = await fetchAllPublicData(lat, lng);
      const existingIds = new Set(get().incidents.map((i) => i.id));
      const newOnes = publicIncidents.filter((i) => !existingIds.has(i.id));
      if (newOnes.length > 0) {
        set((state) => ({
          incidents: [...state.incidents, ...newOnes],
        }));
      }
    } catch { /* silent */ }
  },

  selectIncident: (incident) => set({ selectedIncident: incident }),

  setFilter: (category) => set({ filterCategory: category }),

  confirmIncident: (incidentId) => {
    set((state) => {
      const allIncidents = state.incidents;
      return {
        incidents: allIncidents.map((inc) => {
          if (inc.id !== incidentId || inc.isFakeReport) return inc;
          const updated = { ...inc, confirmCount: inc.confirmCount + 1 };
          const result = analyzeCredibility(updated, allIncidents);
          const autoVerified = !inc.isVerified && updated.confirmCount >= 10;
          return {
            ...updated,
            credibilityScore: result.score,
            ...(autoVerified && {
              isVerified: true,
              verifiedByUid: 'community',
              verifiedByName: 'Community Verified',
            }),
          };
        }),
        selectedIncident: (() => {
          const sel = state.selectedIncident;
          if (!sel || sel.id !== incidentId || sel.isFakeReport) return sel;
          const updated = { ...sel, confirmCount: sel.confirmCount + 1 };
          const result = analyzeCredibility(updated, allIncidents);
          const autoVerified = !sel.isVerified && updated.confirmCount >= 10;
          return {
            ...updated,
            credibilityScore: result.score,
            ...(autoVerified && {
              isVerified: true,
              verifiedByUid: 'community',
              verifiedByName: 'Community Verified',
            }),
          };
        })(),
      };
    });
  },

  denyIncident: (incidentId) => {
    set((state) => {
      const allIncidents = state.incidents;
      return {
        incidents: allIncidents.map((inc) => {
          if (inc.id !== incidentId || inc.isFakeReport) return inc;
          const updated = { ...inc, denyCount: inc.denyCount + 1 };
          const result = analyzeCredibility(updated, allIncidents);
          const autoFake = !inc.isFakeReport && updated.denyCount >= 10;
          return {
            ...updated,
            credibilityScore: result.score,
            ...(autoFake && {
              isFakeReport: true,
              status: 'removed' as const,
            }),
          };
        }),
        selectedIncident: (() => {
          const sel = state.selectedIncident;
          if (!sel || sel.id !== incidentId || sel.isFakeReport) return sel;
          const updated = { ...sel, denyCount: sel.denyCount + 1 };
          const result = analyzeCredibility(updated, allIncidents);
          const autoFake = !sel.isFakeReport && updated.denyCount >= 10;
          return {
            ...updated,
            credibilityScore: result.score,
            ...(autoFake && {
              isFakeReport: true,
              status: 'removed' as const,
            }),
          };
        })(),
      };
    });
  },

  viewIncident: (incidentId) => {
    set((state) => ({
      incidents: state.incidents.map((inc) =>
        inc.id === incidentId ? { ...inc, views: inc.views + 1 } : inc
      ),
      selectedIncident:
        state.selectedIncident?.id === incidentId
          ? { ...state.selectedIncident, views: state.selectedIncident.views + 1 }
          : state.selectedIncident,
    }));
  },

  addComment: (incidentId, text) => {
    const trimmed = text.slice(0, 200);
    if (!trimmed.trim()) return;
    const authUser = useAuthStore.getState().user;
    const comment: IncidentComment = {
      id: `cmt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      uid: authUser?.uid ?? 'anonymous',
      userName: authUser?.displayName ?? 'Anonymous',
      userLevel: authUser?.level ?? 1,
      text: trimmed,
      createdAt: Date.now(),
    };
    set((state) => ({
      incidents: state.incidents.map((inc) =>
        inc.id === incidentId
          ? { ...inc, comments: [...inc.comments, comment], commentCount: inc.commentCount + 1 }
          : inc
      ),
      selectedIncident:
        state.selectedIncident?.id === incidentId
          ? {
              ...state.selectedIncident,
              comments: [...state.selectedIncident.comments, comment],
              commentCount: state.selectedIncident.commentCount + 1,
            }
          : state.selectedIncident,
    }));
  },

  verifyIncident: (incidentId, guardianUid, guardianName) => {
    set((state) => ({
      incidents: state.incidents.map((inc) =>
        inc.id === incidentId
          ? { ...inc, isVerified: true, verifiedByUid: guardianUid, verifiedByName: guardianName }
          : inc
      ),
      selectedIncident:
        state.selectedIncident?.id === incidentId
          ? { ...state.selectedIncident, isVerified: true, verifiedByUid: guardianUid, verifiedByName: guardianName }
          : state.selectedIncident,
    }));
  },

  createIncident: async (data) => {
    set({ isLoading: true });
    await new Promise((r) => setTimeout(r, 600));
    const authUser = useAuthStore.getState().user;
    const newIncident: Incident = {
      id: `inc-${Date.now()}`,
      reporterUid: authUser?.uid ?? 'anonymous',
      reporterName: authUser?.displayName ?? 'Anônimo',
      reporterLevel: authUser?.level ?? 1,
      reporterBadge: authUser?.badge ?? 'Observador',
      ...data,
      geohash: 'mock_hash',
      address: null,
      photoURLs: [],
      confirmCount: 0,
      denyCount: 0,
      credibilityScore: 50,
      status: 'active',
      isVerified: false,
      isFakeReport: false,
      verifiedByUid: null,
      verifiedByName: null,
      views: 0,
      commentCount: 0,
      comments: [],
      source: 'community',
      createdAt: Date.now(),
      expiresAt: Date.now() + 86400000,
    };
    const result = analyzeCredibility(newIncident, get().incidents);
    newIncident.credibilityScore = result.score;
    if (result.level === 'likely_fake') {
      newIncident.isFakeReport = true;
      newIncident.status = 'removed';
    }
    set((state) => ({
      incidents: [newIncident, ...state.incidents],
      isLoading: false,
    }));
  },
}));
