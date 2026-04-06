import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing, Platform, StyleSheet } from 'react-native';
import Svg, { Circle, Line, Path, Defs, RadialGradient, Stop, G } from 'react-native-svg';

interface LogoMarkProps {
  size?: number;
  color?: string;
  spinning?: boolean;
}

const AnimatedG = Animated.createAnimatedComponent(G);

export function LogoMark({ size = 40, color = '#00FF88', spinning = true }: LogoMarkProps) {
  const cx = 24;
  const cy = 24;
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!spinning) return;
    const anim = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 8000,
        easing: Easing.linear,
        useNativeDriver: Platform.OS !== 'web',
      })
    );
    anim.start();
    return () => anim.stop();
  }, [spinning]);

  const rotate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (Platform.OS === 'web') {
    return (
      <View style={{ width: size, height: size }}>
        <div style={{
          width: size, height: size, position: 'relative',
        }}>
          {/* Static rings + ticks layer */}
          <svg width={size} height={size} viewBox="0 0 48 48" fill="none"
            style={{ position: 'absolute', top: 0, left: 0 }}>
            <defs>
              <radialGradient id={`rg-${size}`} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={color} stopOpacity="0.12" />
                <stop offset="100%" stopColor={color} stopOpacity="0" />
              </radialGradient>
            </defs>
            <circle cx={cx} cy={cy} r={22} fill={`url(#rg-${size})`} />
            <circle cx={cx} cy={cy} r={21} stroke={color} strokeWidth="0.6" opacity="0.15"
              fill="none" strokeDasharray="3 4" />
            <circle cx={cx} cy={cy} r={17} stroke={color} strokeWidth="0.7" opacity="0.22" fill="none" />
            <circle cx={cx} cy={cy} r={12} stroke={color} strokeWidth="0.9" opacity="0.38" fill="none" />
            <circle cx={cx} cy={cy} r={7} stroke={color} strokeWidth="1.1" opacity="0.6" fill="none" />
            <circle cx={cx} cy={cy} r={2.8} fill={color} opacity="0.85" />
            {/* Crosshairs */}
            <line x1={cx} y1={1.5} x2={cx} y2={5.5} stroke={color} strokeWidth="0.7" strokeLinecap="round" opacity="0.3" />
            <line x1={cx} y1={42.5} x2={cx} y2={46.5} stroke={color} strokeWidth="0.7" strokeLinecap="round" opacity="0.3" />
            <line x1={1.5} y1={cy} x2={5.5} y2={cy} stroke={color} strokeWidth="0.7" strokeLinecap="round" opacity="0.3" />
            <line x1={42.5} y1={cy} x2={46.5} y2={cy} stroke={color} strokeWidth="0.7" strokeLinecap="round" opacity="0.3" />
            {/* Blips */}
            <circle cx={cx - 10} cy={cy - 7} r={1.3} fill={color} opacity="0.5" />
            <circle cx={cx + 6} cy={cy + 11} r={1} fill={color} opacity="0.35" />
            <circle cx={cx + 13} cy={cy - 3} r={0.8} fill={color} opacity="0.25" />
          </svg>
          {/* Spinning sweep layer */}
          <svg width={size} height={size} viewBox="0 0 48 48" fill="none"
            style={{
              position: 'absolute', top: 0, left: 0,
              animation: spinning ? 'alertio-radar-spin 8s linear infinite' : 'none',
              transformOrigin: '50% 50%',
            }}>
            <path d={`M ${cx} ${cy} L ${cx + 14.5} ${cy - 11} A 18.2 18.2 0 0 0 ${cx + 5} ${cy - 18} Z`}
              fill={color} opacity="0.10" />
            <line x1={cx} y1={cy} x2={cx + 15} y2={cy - 15}
              stroke={color} strokeWidth="1.4" strokeLinecap="round" opacity="0.75" />
          </svg>
          <style>{`@keyframes alertio-radar-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
      </View>
    );
  }

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <Defs>
          <RadialGradient id="radarGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={color} stopOpacity={0.12} />
            <Stop offset="100%" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={cx} cy={cy} r={22} fill="url(#radarGlow)" />
        <Circle cx={cx} cy={cy} r={21} stroke={color} strokeWidth={0.6} opacity={0.15} fill="none" strokeDasharray="3 4" />
        <Circle cx={cx} cy={cy} r={17} stroke={color} strokeWidth={0.7} opacity={0.22} fill="none" />
        <Circle cx={cx} cy={cy} r={12} stroke={color} strokeWidth={0.9} opacity={0.38} fill="none" />
        <Circle cx={cx} cy={cy} r={7} stroke={color} strokeWidth={1.1} opacity={0.6} fill="none" />
        <Circle cx={cx} cy={cy} r={2.8} fill={color} opacity={0.85} />

        <AnimatedG style={{ transform: [{ rotate }] }} origin={`${cx}, ${cy}`}>
          <Path d={`M ${cx} ${cy} L ${cx + 14.5} ${cy - 11} A 18.2 18.2 0 0 0 ${cx + 5} ${cy - 18} Z`}
            fill={color} opacity={0.1} />
          <Line x1={cx} y1={cy} x2={cx + 15} y2={cy - 15}
            stroke={color} strokeWidth={1.4} strokeLinecap="round" opacity={0.75} />
        </AnimatedG>

        <Line x1={cx} y1={1.5} x2={cx} y2={5.5} stroke={color} strokeWidth={0.7} strokeLinecap="round" opacity={0.3} />
        <Line x1={cx} y1={42.5} x2={cx} y2={46.5} stroke={color} strokeWidth={0.7} strokeLinecap="round" opacity={0.3} />
        <Line x1={1.5} y1={cy} x2={5.5} y2={cy} stroke={color} strokeWidth={0.7} strokeLinecap="round" opacity={0.3} />
        <Line x1={42.5} y1={cy} x2={46.5} y2={cy} stroke={color} strokeWidth={0.7} strokeLinecap="round" opacity={0.3} />
        <Circle cx={cx - 10} cy={cy - 7} r={1.3} fill={color} opacity={0.5} />
        <Circle cx={cx + 6} cy={cy + 11} r={1} fill={color} opacity={0.35} />
        <Circle cx={cx + 13} cy={cy - 3} r={0.8} fill={color} opacity={0.25} />
      </Svg>
    </View>
  );
}
