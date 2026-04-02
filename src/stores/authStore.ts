import { create } from 'zustand';
import type { UserProfile } from '../types';
import { MOCK_USER } from '../services/mockData';

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: MOCK_USER,
  isAuthenticated: true,
  isLoading: false,

  signIn: async (_email: string, _password: string) => {
    set({ isLoading: true });
    await new Promise((r) => setTimeout(r, 800));
    set({ user: MOCK_USER, isAuthenticated: true, isLoading: false });
  },

  signUp: async (_email: string, _password: string, displayName: string) => {
    set({ isLoading: true });
    await new Promise((r) => setTimeout(r, 1000));
    set({
      user: { ...MOCK_USER, displayName, reputation: 0, level: 0, levelName: 'Observador Anônimo', levelIcon: '👁️' },
      isAuthenticated: true,
      isLoading: false,
    });
  },

  signOut: () => {
    set({ user: null, isAuthenticated: false });
  },

  updateProfile: (updates) => {
    set((state) => ({
      user: state.user ? { ...state.user, ...updates } : null,
    }));
  },
}));
