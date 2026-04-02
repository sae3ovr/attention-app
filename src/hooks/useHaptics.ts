import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useAccessibilityStore } from '../stores/accessibilityStore';

const isNative = Platform.OS !== 'web';
const noop = () => {};

export function useHaptics() {
  const hapticEnabled = useAccessibilityStore((s) => s.hapticFeedback);

  if (!isNative) {
    return { light: noop, medium: noop, heavy: noop, success: noop, warning: noop, error: noop, selection: noop };
  }

  const light = () => {
    if (hapticEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const medium = () => {
    if (hapticEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const heavy = () => {
    if (hapticEnabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  };

  const success = () => {
    if (hapticEnabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const warning = () => {
    if (hapticEnabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  };

  const error = () => {
    if (hapticEnabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  };

  const selection = () => {
    if (hapticEnabled) Haptics.selectionAsync();
  };

  return { light, medium, heavy, success, warning, error, selection };
}
