import React, { useRef, useState } from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, StyleProp, ActivityIndicator, View, Animated, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useA11y, a11yProps } from '../../hooks/useAccessibility';
import { useHaptics } from '../../hooks/useHaptics';
import { Radius, Spacing, MIN_TOUCH_TARGET } from '../../theme/spacing';

interface NeonButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: string;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
}

export function NeonButton({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  loading,
  disabled,
  fullWidth,
  style,
  accessibilityHint,
}: NeonButtonProps) {
  const { colors, typography, minTarget } = useA11y();
  const haptics = useHaptics();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [hovered, setHovered] = useState(false);

  const variantStyles = {
    primary: {
      bg: colors.primary,
      bgPressed: colors.primaryDim,
      bgHover: colors.primary + 'DD',
      text: colors.background,
      glow: colors.primaryGlow,
      border: colors.primary,
    },
    secondary: {
      bg: 'transparent',
      bgPressed: colors.primary + '18',
      bgHover: colors.primary + '0D',
      text: colors.primary,
      glow: colors.primaryGlow,
      border: colors.primary + '60',
    },
    danger: {
      bg: colors.error,
      bgPressed: colors.errorDim,
      bgHover: colors.error + 'DD',
      text: '#FFFFFF',
      glow: colors.errorGlow,
      border: colors.error,
    },
    ghost: {
      bg: 'transparent',
      bgPressed: 'rgba(255,255,255,0.08)',
      bgHover: 'rgba(255,255,255,0.04)',
      text: colors.textSecondary,
      glow: 'transparent',
      border: colors.border,
    },
  };

  const sizeStyles = {
    sm: { height: Math.max(36, minTarget), px: Spacing.md, fontSize: typography.buttonSm },
    md: { height: Math.max(48, minTarget), px: Spacing.xl, fontSize: typography.button },
    lg: { height: Math.max(56, minTarget), px: Spacing['2xl'], fontSize: typography.button },
  };

  const v = variantStyles[variant];
  const s = sizeStyles[size];

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true, speed: 50, bounciness: 4 }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 8 }).start();
  };

  const handlePress = () => {
    if (disabled || loading) return;
    haptics.light();
    onPress();
  };

  const webHoverProps = Platform.OS === 'web' ? {
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => setHovered(false),
  } : {};

  return (
    <Animated.View
      style={[{ transform: [{ scale: scaleAnim }] }, fullWidth && styles.fullWidth, style]}
      {...webHoverProps}
    >
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        style={({ pressed }) => [
          styles.button,
          Platform.OS === 'web' && styles.webButton,
          {
            height: s.height,
            minHeight: minTarget,
            paddingHorizontal: s.px,
            backgroundColor: pressed ? v.bgPressed : hovered ? v.bgHover : v.bg,
            borderColor: disabled ? colors.textDisabled : pressed ? v.glow : hovered ? v.border : v.border,
            opacity: disabled ? 0.4 : 1,
            shadowColor: v.glow,
            shadowOpacity: variant === 'primary' && !disabled ? (pressed ? 0.9 : hovered ? 0.7 : 0.4) : 0,
            shadowRadius: pressed ? 28 : hovered ? 20 : 14,
            shadowOffset: { width: 0, height: pressed ? 2 : 4 },
            elevation: variant === 'primary' ? (pressed ? 12 : 8) : 0,
          },
          fullWidth && styles.fullWidth,
        ]}
        {...a11yProps(
          title,
          accessibilityHint ?? `Ativar ${title.toLowerCase()}`,
          'button'
        )}
      >
        {loading ? (
          <ActivityIndicator color={v.text} size="small" />
        ) : (
          <View style={styles.content}>
            {icon && (
              <MaterialCommunityIcons
                name={icon as any}
                size={s.fontSize.fontSize + 2}
                color={v.text}
                style={styles.icon}
              />
            )}
            <Text
              style={[
                s.fontSize,
                { color: v.text },
              ]}
              numberOfLines={1}
            >
              {title}
            </Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    overflow: 'hidden',
  },
  webButton: Platform.OS === 'web' ? {
    transition: 'all 0.25s cubic-bezier(0.25, 0.8, 0.25, 1)',
    cursor: 'pointer',
  } as any : {},
  fullWidth: {
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  icon: {
    marginRight: 2,
  },
});
