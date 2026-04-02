import { create } from 'zustand';
import type { AccessibilityPreferences } from '../types';

interface AccessibilityState extends AccessibilityPreferences {
  set: <K extends keyof AccessibilityPreferences>(key: K, value: AccessibilityPreferences[K]) => void;
  reset: () => void;
}

const DEFAULTS: AccessibilityPreferences = {
  highContrast: false,
  lightTheme: false,
  largeText: false,
  reducedMotion: false,
  screenReaderEnabled: false,
  hapticFeedback: true,
  voiceGuidance: false,
  largeTargets: false,
  simplifiedUI: false,
};

export const useAccessibilityStore = create<AccessibilityState>()((setState) => ({
  ...DEFAULTS,
  set: (key, value) => setState({ [key]: value }),
  reset: () => setState(DEFAULTS),
}));
