import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Easing } from 'react-native';
import { useA11y } from '../../hooks/useAccessibility';
import { NeonText } from './NeonText';

interface LoadingRadarProps {
  size?: number;
  message?: string;
}

export function LoadingRadar({ size = 120, message }: LoadingRadarProps) {
  const { colors, reducedMotion } = useA11y();
  const rotation = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    if (reducedMotion) return;

    const spin = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    const breathing = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.6, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );

    spin.start();
    breathing.start();

    return () => {
      spin.stop();
      breathing.stop();
    };
  }, [reducedMotion]);

  const rotate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const halfSize = size / 2;

  return (
    <View
      style={styles.container}
      accessible
      accessibilityLabel={message ?? 'Loading'}
      accessibilityRole="progressbar"
    >
      <View style={[styles.radar, { width: size, height: size }]}>
        {/* Outer ring */}
        <Animated.View
          style={[
            styles.ring,
            {
              width: size,
              height: size,
              borderRadius: halfSize,
              borderColor: colors.primary + '40',
              opacity: pulse,
            },
          ]}
        />
        {/* Middle ring */}
        <View
          style={[
            styles.ring,
            styles.centered,
            {
              width: size * 0.65,
              height: size * 0.65,
              borderRadius: (size * 0.65) / 2,
              borderColor: colors.primary + '25',
            },
          ]}
        />
        {/* Inner ring */}
        <View
          style={[
            styles.ring,
            styles.centered,
            {
              width: size * 0.3,
              height: size * 0.3,
              borderRadius: (size * 0.3) / 2,
              borderColor: colors.primary + '15',
            },
          ]}
        />
        {/* Sweep line */}
        <Animated.View
          style={[
            styles.sweep,
            {
              width: 2,
              height: halfSize,
              backgroundColor: colors.primary,
              bottom: halfSize,
              left: halfSize - 1,
              transformOrigin: 'bottom',
              transform: [{ rotate }],
              shadowColor: colors.primary,
              shadowOpacity: 0.8,
              shadowRadius: 6,
            },
          ]}
        />
        {/* Center dot */}
        <View
          style={[
            styles.dot,
            styles.centered,
            {
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: colors.primary,
              shadowColor: colors.primary,
              shadowOpacity: 1,
              shadowRadius: 8,
            },
          ]}
        />
      </View>
      {message && (
        <NeonText
          variant="bodySm"
          color={colors.textSecondary}
          style={styles.message}
        >
          {message}
        </NeonText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  radar: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ring: {
    position: 'absolute',
    borderWidth: 1,
  },
  centered: {
    position: 'absolute',
  },
  sweep: {
    position: 'absolute',
  },
  dot: {
    position: 'absolute',
    elevation: 4,
  },
  message: {
    marginTop: 16,
  },
});
