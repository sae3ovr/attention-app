import { useMemo } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';
import { useAccessibilityStore } from '../stores/accessibilityStore';
import { Colors, HighContrastColors, LightColors } from '../theme/colors';
import { createTypography } from '../theme/typography';
import { MIN_TOUCH_TARGET, LARGE_TOUCH_TARGET } from '../theme/spacing';

export function useA11y() {
  const prefs = useAccessibilityStore();

  const colors = useMemo(
    () =>
      prefs.highContrast
        ? HighContrastColors
        : prefs.lightTheme
          ? LightColors
          : Colors,
    [prefs.highContrast, prefs.lightTheme]
  );

  const typography = useMemo(
    () => createTypography(prefs.largeText),
    [prefs.largeText]
  );

  const minTarget = prefs.largeTargets ? LARGE_TOUCH_TARGET : MIN_TOUCH_TARGET;

  const animationDuration = prefs.reducedMotion ? 0 : undefined;

  return {
    ...prefs,
    colors,
    typography,
    minTarget,
    animationDuration,
  };
}

export function announce(message: string) {
  if (Platform.OS !== 'web') {
    AccessibilityInfo.announceForAccessibility(message);
  }
}

export function a11yProps(label: string, hint?: string, role?: string) {
  return {
    accessible: true,
    accessibilityLabel: label,
    ...(hint && { accessibilityHint: hint }),
    ...(role && { accessibilityRole: role as any }),
  };
}

export function a11yLiveRegion(mode: 'polite' | 'assertive' = 'polite') {
  return {
    accessibilityLiveRegion: mode as any,
  };
}
