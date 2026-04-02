import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { useA11y } from '../../hooks/useAccessibility';
import { Radius, Spacing } from '../../theme/spacing';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  noPadding?: boolean;
  glowColor?: string;
  accessibilityLabel?: string;
}

export function GlassCard({ children, style, noPadding, glowColor, accessibilityLabel }: GlassCardProps) {
  const { colors } = useA11y();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.glass.background,
          borderColor: colors.glass.border,
        },
        glowColor && {
          borderColor: glowColor,
          shadowColor: glowColor,
          shadowOpacity: 0.3,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 2 },
          elevation: 10,
        },
        !noPadding && styles.padding,
        style,
      ]}
      accessible={!!accessibilityLabel}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityLabel ? 'summary' : undefined}
    >
      {/* Top highlight edge for 3D depth feel */}
      <View style={styles.topEdge} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  padding: {
    padding: Spacing.lg,
  },
  topEdge: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
});
