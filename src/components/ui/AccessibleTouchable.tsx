import React from 'react';
import { Pressable, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { useA11y } from '../../hooks/useAccessibility';
import { useHaptics } from '../../hooks/useHaptics';

interface AccessibleTouchableProps {
  children: React.ReactNode;
  onPress: () => void;
  accessibilityLabel: string;
  accessibilityHint?: string;
  accessibilityRole?: 'button' | 'link' | 'tab' | 'menuitem' | 'checkbox' | 'radio';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  hapticType?: 'light' | 'medium' | 'selection';
}

export function AccessibleTouchable({
  children,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = 'button',
  disabled,
  style,
  hapticType = 'light',
}: AccessibleTouchableProps) {
  const { minTarget, colors } = useA11y();
  const haptics = useHaptics();

  const handlePress = () => {
    if (disabled) return;
    haptics[hapticType]();
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      accessible
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityRole={accessibilityRole}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.base,
        { minHeight: minTarget, minWidth: minTarget, opacity: disabled ? 0.4 : pressed ? 0.7 : 1 },
        pressed && { backgroundColor: colors.glass.backgroundHover },
        style,
      ]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
