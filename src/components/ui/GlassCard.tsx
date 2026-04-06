import React, { useState, useRef, useCallback } from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, Platform, Animated } from 'react-native';
import { useA11y } from '../../hooks/useAccessibility';
import { Radius, Spacing } from '../../theme/spacing';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  noPadding?: boolean;
  glowColor?: string;
  accessibilityLabel?: string;
  hoverScale?: boolean;
}

export function GlassCard({ children, style, noPadding, glowColor, accessibilityLabel, hoverScale }: GlassCardProps) {
  const { colors } = useA11y();
  const [hovered, setHovered] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const onHoverIn = useCallback(() => {
    setHovered(true);
    if (hoverScale) {
      Animated.spring(scaleAnim, { toValue: 1.015, useNativeDriver: true, speed: 40, bounciness: 6 }).start();
    }
  }, [hoverScale]);

  const onHoverOut = useCallback(() => {
    setHovered(false);
    if (hoverScale) {
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 4 }).start();
    }
  }, [hoverScale]);

  const webHoverProps = Platform.OS === 'web' ? {
    onMouseEnter: onHoverIn,
    onMouseLeave: onHoverOut,
  } : {};

  const card = (
    <View
      style={[
        styles.card,
        {
          backgroundColor: hovered ? colors.glass.backgroundHover : colors.glass.background,
          borderColor: hovered
            ? (glowColor || colors.glass.border)
            : colors.glass.border,
        },
        Platform.OS === 'web' && styles.webGlass,
        glowColor && {
          borderColor: hovered ? glowColor : glowColor + 'AA',
          shadowColor: glowColor,
          shadowOpacity: hovered ? 0.5 : 0.3,
          shadowRadius: hovered ? 24 : 16,
          shadowOffset: { width: 0, height: 2 },
          elevation: 10,
        },
        !noPadding && styles.padding,
        style,
      ]}
      accessible={!!accessibilityLabel}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityLabel ? 'none' : undefined}
      {...webHoverProps}
    >
      <View style={[styles.topEdge, hovered && styles.topEdgeHover]} />
      <View style={styles.innerGlow} />
      {children}
    </View>
  );

  if (hoverScale) {
    return (
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        {card}
      </Animated.View>
    );
  }

  return card;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  webGlass: Platform.OS === 'web' ? {
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
  } as any : {},
  padding: {
    padding: Spacing.lg,
  },
  topEdge: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
  },
  topEdgeHover: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  innerGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
  },
});
