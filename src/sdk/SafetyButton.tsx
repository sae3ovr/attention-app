import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Platform,
  Vibration,
  PanResponder,
} from 'react-native';
import { AttentionSDK } from './AttentionSDK';
import type { SafetyButtonProps } from './types';

const COLORS = {
  sos: '#FF3B30',
  sosActive: '#CC0000',
  report: '#FF9500',
  alerts: '#007AFF',
  chain: '#34C759',
  location: '#AF52DE',
  bg: 'rgba(30,30,40,0.92)',
  text: '#FFFFFF',
  subtle: 'rgba(255,255,255,0.6)',
};

interface MiniAction {
  key: string;
  icon: string;
  label: string;
  color: string;
  onPress: () => void;
}

/**
 * Drop-in floating safety button for any React Native app.
 * Provides instant access to SOS, incident reporting, alerts, and chain messaging.
 *
 * <SafetyButton position="bottom-right" size="medium" />
 */
export function SafetyButton({
  position = 'bottom-right',
  size = 'medium',
  showLabel = false,
  color,
  sosHoldDuration = 2000,
  onSOSTrigger,
  onPress,
  features = ['sos', 'report', 'alerts', 'chain', 'location'],
  style,
}: SafetyButtonProps) {
  const [expanded, setExpanded] = useState(false);
  const [sosCountdown, setSOSCountdown] = useState(false);
  const [sosProgress, setSOSProgress] = useState(0);
  const expandAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const sosTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sosInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const btnSize = size === 'small' ? 48 : size === 'large' ? 72 : 60;
  const iconSize = size === 'small' ? 20 : size === 'large' ? 32 : 26;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const toggleExpand = useCallback(() => {
    if (onPress) { onPress(); return; }
    const toValue = expanded ? 0 : 1;
    Animated.spring(expandAnim, { toValue, friction: 8, tension: 60, useNativeDriver: true }).start();
    setExpanded(!expanded);
  }, [expanded, onPress]);

  const startSOS = useCallback(() => {
    setSOSCountdown(true);
    setSOSProgress(0);
    if (Platform.OS !== 'web') {
      Vibration.vibrate([0, 100, 50, 100]);
    }

    const stepMs = 50;
    let elapsed = 0;
    sosInterval.current = setInterval(() => {
      elapsed += stepMs;
      setSOSProgress(Math.min(1, elapsed / sosHoldDuration));
    }, stepMs);

    sosTimer.current = setTimeout(async () => {
      if (sosInterval.current) clearInterval(sosInterval.current);
      setSOSCountdown(false);
      setSOSProgress(0);
      if (Platform.OS !== 'web') {
        Vibration.vibrate([0, 500, 200, 500]);
      }
      try {
        const alertId = await AttentionSDK.triggerSOS();
        onSOSTrigger?.({ location: AttentionSDK.currentLocation!, contacts: [], message: 'SOS via SafetyButton' });
      } catch { /* no location */ }
    }, sosHoldDuration);
  }, [sosHoldDuration, onSOSTrigger]);

  const cancelSOS = useCallback(() => {
    if (sosTimer.current) clearTimeout(sosTimer.current);
    if (sosInterval.current) clearInterval(sosInterval.current);
    setSOSCountdown(false);
    setSOSProgress(0);
  }, []);

  const actions: MiniAction[] = [];

  if (features.includes('sos')) {
    actions.push({
      key: 'sos',
      icon: '🆘',
      label: 'SOS',
      color: COLORS.sos,
      onPress: () => { startSOS(); setTimeout(cancelSOS, sosHoldDuration + 500); },
    });
  }
  if (features.includes('report')) {
    actions.push({
      key: 'report',
      icon: '⚠️',
      label: 'Report',
      color: COLORS.report,
      onPress: async () => {
        try {
          await AttentionSDK.reportIncident({
            category: 'suspicious',
            severity: 'medium',
            title: 'Quick Report',
            location: AttentionSDK.currentLocation || { latitude: 0, longitude: 0 },
          });
        } catch { /* silently fail */ }
      },
    });
  }
  if (features.includes('alerts')) {
    actions.push({
      key: 'alerts',
      icon: '🔔',
      label: 'Alerts',
      color: COLORS.alerts,
      onPress: async () => {
        const incidents = await AttentionSDK.getNearbyIncidents();
        console.log(`[Attention] ${incidents.length} nearby incidents`);
      },
    });
  }
  if (features.includes('chain')) {
    actions.push({
      key: 'chain',
      icon: '🔗',
      label: 'Chain',
      color: COLORS.chain,
      onPress: async () => {
        const chains = await AttentionSDK.getUserChains();
        if (chains[0]) {
          await AttentionSDK.sendChainMessage(chains[0].id, '📍 Check-in: I\'m safe', 'text');
        }
      },
    });
  }
  if (features.includes('location')) {
    actions.push({
      key: 'location',
      icon: '📍',
      label: 'Share',
      color: COLORS.location,
      onPress: async () => {
        const chains = await AttentionSDK.getUserChains();
        if (chains[0] && AttentionSDK.currentLocation) {
          await AttentionSDK.sendChainMessage(chains[0].id, 'Shared location', 'location');
        }
      },
    });
  }

  const posStyle = getPositionStyle(position);

  return (
    <View style={[styles.container, posStyle, style]} pointerEvents="box-none">
      {expanded && (
        <View style={styles.actionsContainer}>
          {actions.map((action, idx) => {
            const translateY = expandAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, -(idx + 1) * (btnSize * 0.85)],
            });
            const opacity = expandAnim.interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [0, 0.5, 1],
            });

            return (
              <Animated.View
                key={action.key}
                style={[styles.actionBtn, {
                  transform: [{ translateY }, { scale: expandAnim }],
                  opacity,
                  width: btnSize * 0.75,
                  height: btnSize * 0.75,
                  borderRadius: btnSize * 0.375,
                  backgroundColor: action.color,
                }]}
              >
                <TouchableOpacity
                  onPress={action.onPress}
                  style={styles.actionTouchable}
                  activeOpacity={0.7}
                  accessibilityLabel={`Attention ${action.label}`}
                  accessibilityRole="button"
                >
                  <Text style={[styles.actionIcon, { fontSize: iconSize * 0.7 }]}>{action.icon}</Text>
                </TouchableOpacity>
                {showLabel && (
                  <Text style={[styles.actionLabel, { right: btnSize * 0.85 }]}>{action.label}</Text>
                )}
              </Animated.View>
            );
          })}
        </View>
      )}

      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <TouchableOpacity
          onPress={toggleExpand}
          onLongPress={features.includes('sos') ? startSOS : undefined}
          onPressOut={sosCountdown ? cancelSOS : undefined}
          delayLongPress={300}
          style={[
            styles.mainButton,
            {
              width: btnSize,
              height: btnSize,
              borderRadius: btnSize / 2,
              backgroundColor: sosCountdown ? COLORS.sosActive : (color || COLORS.bg),
            },
          ]}
          activeOpacity={0.8}
          accessibilityLabel="Alert.io Safety Button"
          accessibilityRole="button"
          accessibilityHint="Tap to expand safety options. Long press for SOS."
        >
          {sosCountdown ? (
            <View style={styles.sosProgressContainer}>
              <View style={[styles.sosProgressBar, { width: `${sosProgress * 100}%` as any }]} />
              <Text style={[styles.mainIcon, { fontSize: iconSize }]}>🆘</Text>
            </View>
          ) : (
            <Text style={[styles.mainIcon, { fontSize: iconSize }]}>
              {expanded ? '✕' : '🛡️'}
            </Text>
          )}
        </TouchableOpacity>
      </Animated.View>

      {showLabel && !expanded && (
        <Text style={styles.label}>Safety</Text>
      )}
    </View>
  );
}

function getPositionStyle(position: string) {
  switch (position) {
    case 'bottom-left': return { bottom: 24, left: 16 };
    case 'bottom-center': return { bottom: 24, left: '50%' as any, marginLeft: -30 };
    case 'top-right': return { top: 60, right: 16 };
    case 'top-left': return { top: 60, left: 16 };
    default: return { bottom: 24, right: 16 };
  }
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 9999,
    alignItems: 'center',
  },
  mainButton: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 10,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  mainIcon: {
    textAlign: 'center',
  },
  actionsContainer: {
    position: 'absolute',
    bottom: 0,
    alignItems: 'center',
  },
  actionBtn: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  actionTouchable: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  actionIcon: {
    textAlign: 'center',
  },
  actionLabel: {
    position: 'absolute',
    color: COLORS.text,
    fontSize: 11,
    fontWeight: '600',
    backgroundColor: COLORS.bg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: 'hidden',
  },
  label: {
    color: COLORS.subtle,
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
  sosProgressContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderRadius: 999,
  },
  sosProgressBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,0,0,0.4)',
  },
});
