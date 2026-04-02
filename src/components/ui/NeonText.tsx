import React from 'react';
import { Text, TextStyle, StyleProp, TextProps } from 'react-native';
import { useA11y } from '../../hooks/useAccessibility';

interface NeonTextProps extends TextProps {
  variant?: 'hero' | 'h1' | 'h2' | 'h3' | 'h4' | 'bodyLg' | 'body' | 'bodySm' | 'caption' | 'label' | 'button' | 'buttonSm';
  color?: string;
  glow?: string;
  style?: StyleProp<TextStyle>;
  children: React.ReactNode;
}

export function NeonText({
  variant = 'body',
  color,
  glow,
  style,
  children,
  ...rest
}: NeonTextProps) {
  const { colors, typography } = useA11y();

  return (
    <Text
      style={[
        typography[variant],
        { color: color ?? colors.textPrimary },
        glow && {
          textShadowColor: glow,
          textShadowOffset: { width: 0, height: 0 },
          textShadowRadius: 12,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </Text>
  );
}
