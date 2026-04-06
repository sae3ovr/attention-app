import { create } from 'zustand';
import type { UserProfile } from '../types';
import { MOCK_USER } from '../services/mockData';
import { isFirebaseConfigured } from '../config/firebase';
import {
  signInWithEmail,
  requestSignUp as authRequestSignUp,
  verifyCode as authVerifyCode,
  signOutUser,
  onAuthChange,
} from '../services/authService';

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authError: string | null;
  isDemoMode: boolean;
  pendingEmail: string | null;
  verificationCode: string | null;
  isVerifying: boolean;

  signIn: (email: string, password: string) => Promise<void>;
  requestSignUp: (email: string, password: string, displayName: string) => Promise<void>;
  verifyCode: (email: string, code: string) => Promise<void>;
  signInDemo: () => void;
  signOut: () => void;
  clearError: () => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  initAuthListener: () => () => void;
}

function firebaseUserToProfile(fbUser: any, existing?: UserProfile | null): UserProfile {
  return {
    uid: fbUser.uid,
    displayName: fbUser.displayName || 'Anonymous User',
    email: fbUser.email || '',
    photoURL: fbUser.photoURL || null,
    reputation: existing?.reputation ?? 0,
    level: existing?.level ?? 1,
    levelName: existing?.levelName ?? 'Observador Anônimo',
    levelIcon: existing?.levelIcon ?? '👁️',
    isGuardian: existing?.isGuardian ?? false,
    isProbationary: existing?.isProbationary ?? false,
    totalReports: existing?.totalReports ?? 0,
    totalConfirmations: existing?.totalConfirmations ?? 0,
    reportsToday: existing?.reportsToday ?? 0,
    dailyReportLimit: existing?.dailyReportLimit ?? 5,
    isGhostMode: existing?.isGhostMode ?? false,
    familyGroupIds: existing?.familyGroupIds ?? [],
    kidProfileIds: existing?.kidProfileIds ?? [],
    chainIds: existing?.chainIds ?? [],
    createdAt: existing?.createdAt ?? Date.now(),
    lastActiveAt: Date.now(),
    verifiedIncidents: existing?.verifiedIncidents ?? 0,
    removedIncidents: existing?.removedIncidents ?? 0,
    mentees: existing?.mentees ?? 0,
  };
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  authError: null,
  isDemoMode: false,
  pendingEmail: null,
  verificationCode: null,
  isVerifying: false,

  signIn: async (email: string, password: string) => {
    set({ isLoading: true, authError: null });
    if (!isFirebaseConfigured) {
      await new Promise((r) => setTimeout(r, 800));
      set({ user: MOCK_USER, isAuthenticated: true, isLoading: false, isDemoMode: true });
      return;
    }
    const result = await signInWithEmail(email, password);
    if (result.success && result.user) {
      set({ user: firebaseUserToProfile(result.user), isAuthenticated: true, isLoading: false, isDemoMode: false });
    } else {
      const msg = result.error || 'Sign in failed';
      set({ isLoading: false, authError: msg });
      throw new Error(msg);
    }
  },

  requestSignUp: async (email: string, password: string, displayName: string) => {
    set({ isLoading: true, authError: null });
    try {
      if (!isFirebaseConfigured) {
        await new Promise((r) => setTimeout(r, 600));
        const code = String(Math.floor(Math.random() * 1_000_000)).padStart(6, '0');
        set({
          isLoading: false,
          pendingEmail: email,
          verificationCode: code,
          isVerifying: true,
        });
        return;
      }
      const { code } = await authRequestSignUp(email, password, displayName);
      set({
        isLoading: false,
        pendingEmail: email,
        verificationCode: code,
        isVerifying: true,
      });
    } catch (e: any) {
      set({ isLoading: false, authError: e.message || 'Failed to initiate sign up' });
      throw e;
    }
  },

  verifyCode: async (email: string, code: string) => {
    set({ isLoading: true, authError: null });
    if (!isFirebaseConfigured) {
      await new Promise((r) => setTimeout(r, 800));
      const storedCode = get().verificationCode;
      if (code !== storedCode) {
        set({ isLoading: false, authError: 'Invalid verification code. Please try again.' });
        throw new Error('Invalid verification code');
      }
      set({
        user: { ...MOCK_USER, email, reputation: 0, level: 0, levelName: 'Observador Anônimo', levelIcon: '👁️' },
        isAuthenticated: true,
        isLoading: false,
        isDemoMode: true,
        isVerifying: false,
        pendingEmail: null,
        verificationCode: null,
      });
      return;
    }
    const result = await authVerifyCode(email, code);
    if (result.success && result.user) {
      set({
        user: firebaseUserToProfile(result.user),
        isAuthenticated: true,
        isLoading: false,
        isDemoMode: false,
        isVerifying: false,
        pendingEmail: null,
        verificationCode: null,
      });
    } else {
      const msg = result.error || 'Verification failed';
      set({ isLoading: false, authError: msg });
      throw new Error(msg);
    }
  },

  signInDemo: () => {
    set({ user: MOCK_USER, isAuthenticated: true, isLoading: false, isDemoMode: true, authError: null });
  },

  signOut: () => {
    signOutUser().catch(() => {});
    set({
      user: null,
      isAuthenticated: false,
      isDemoMode: false,
      authError: null,
      pendingEmail: null,
      verificationCode: null,
      isVerifying: false,
    });
  },

  clearError: () => set({ authError: null }),

  updateProfile: (updates) => {
    set((state) => ({
      user: state.user ? { ...state.user, ...updates } : null,
    }));
  },

  initAuthListener: () => {
    return onAuthChange((fbUser) => {
      if (fbUser) {
        const current = get().user;
        set({ user: firebaseUserToProfile(fbUser, current), isAuthenticated: true });
      } else if (!get().isDemoMode) {
        set({
          user: null,
          isAuthenticated: false,
          pendingEmail: null,
          verificationCode: null,
          isVerifying: false,
        });
      }
    });
  },
}));
