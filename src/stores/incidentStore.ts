import { create } from 'zustand';
import type { Incident, IncidentCategory, IncidentSeverity, GeoPosition } from '../types';
import { MOCK_INCIDENTS } from '../services/mockData';

interface IncidentState {
  incidents: Incident[];
  selectedIncident: Incident | null;
  filterCategory: IncidentCategory | null;
  isLoading: boolean;
  loadIncidents: () => Promise<void>;
  selectIncident: (incident: Incident | null) => void;
  setFilter: (category: IncidentCategory | null) => void;
  confirmIncident: (incidentId: string) => void;
  denyIncident: (incidentId: string) => void;
  verifyIncident: (incidentId: string, guardianUid: string, guardianName: string) => void;
  addReaction: (incidentId: string, reaction: 'useful' | 'beCareful' | 'watching') => void;
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

  loadIncidents: async () => {
    set({ isLoading: true });
    await new Promise((r) => setTimeout(r, 500));
    set({ incidents: MOCK_INCIDENTS, isLoading: false });
  },

  selectIncident: (incident) => set({ selectedIncident: incident }),

  setFilter: (category) => set({ filterCategory: category }),

  confirmIncident: (incidentId) => {
    set((state) => ({
      incidents: state.incidents.map((inc) =>
        inc.id === incidentId
          ? { ...inc, confirmCount: inc.confirmCount + 1, credibilityScore: inc.credibilityScore + 1.5 }
          : inc
      ),
      selectedIncident:
        state.selectedIncident?.id === incidentId
          ? {
              ...state.selectedIncident,
              confirmCount: state.selectedIncident.confirmCount + 1,
              credibilityScore: state.selectedIncident.credibilityScore + 1.5,
            }
          : state.selectedIncident,
    }));
  },

  denyIncident: (incidentId) => {
    set((state) => ({
      incidents: state.incidents.map((inc) =>
        inc.id === incidentId
          ? { ...inc, denyCount: inc.denyCount + 1, credibilityScore: inc.credibilityScore - 1 }
          : inc
      ),
      selectedIncident:
        state.selectedIncident?.id === incidentId
          ? {
              ...state.selectedIncident,
              denyCount: state.selectedIncident.denyCount + 1,
              credibilityScore: state.selectedIncident.credibilityScore - 1,
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

  addReaction: (incidentId, reaction) => {
    set((state) => ({
      incidents: state.incidents.map((inc) =>
        inc.id === incidentId
          ? { ...inc, reactions: { ...inc.reactions, [reaction]: inc.reactions[reaction] + 1 } }
          : inc
      ),
      selectedIncident:
        state.selectedIncident?.id === incidentId
          ? {
              ...state.selectedIncident,
              reactions: {
                ...state.selectedIncident.reactions,
                [reaction]: state.selectedIncident.reactions[reaction] + 1,
              },
            }
          : state.selectedIncident,
    }));
  },

  createIncident: async (data) => {
    set({ isLoading: true });
    await new Promise((r) => setTimeout(r, 600));
    const newIncident: Incident = {
      id: `inc-${Date.now()}`,
      reporterUid: 'mock-user-001',
      reporterName: 'Eduardo Q.',
      reporterLevel: 31,
      reporterBadge: 'Guardian',
      ...data,
      geohash: 'mock_hash',
      address: null,
      photoURLs: [],
      confirmCount: 0,
      denyCount: 0,
      credibilityScore: 0,
      status: 'active',
      isVerified: false,
      verifiedByUid: null,
      verifiedByName: null,
      reactions: { useful: 0, beCareful: 0, watching: 0 },
      commentCount: 0,
      createdAt: Date.now(),
      expiresAt: Date.now() + 86400000,
    };
    set((state) => ({
      incidents: [newIncident, ...state.incidents],
      isLoading: false,
    }));
  },
}));
