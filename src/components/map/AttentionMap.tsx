import React, { useRef, useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, Animated, Easing, Text, Platform } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Circle, Polyline } from 'react-native-maps';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { AttentionMapProps, MapMarker } from './types';
import { DEFAULT_REGION } from './types';
import { DARK_MAP_STYLE } from './mapStyles';
import { Colors } from '../../theme/colors';
import { getCategoryMeta } from '../../constants/categories';
import { WORLD_CAPITALS } from '../../data/worldCapitals';

function PulsingMarker({ marker, isSelected, onPress, dimmed }: {
  marker: MapMarker;
  isSelected: boolean;
  onPress: () => void;
  dimmed?: boolean;
}) {
  const pulse = useRef(new Animated.Value(1)).current;
  const catColor = Colors.category[marker.incident.category];
  const catMeta = getCategoryMeta(marker.incident.category);
  const sevColor = Colors.severity[marker.incident.severity];

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: isSelected ? 1.25 : 1.08,
          duration: isSelected ? 800 : 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: isSelected ? 800 : 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [isSelected]);

  return (
    <Marker
      coordinate={marker.coordinate}
      onPress={onPress}
      tracksViewChanges={false}
      anchor={{ x: 0.5, y: 0.5 }}
    >
      <Animated.View
        style={[
          styles.marker,
          {
            backgroundColor: isSelected ? catColor + '25' : 'transparent',
            borderColor: isSelected ? catColor : 'transparent',
            borderWidth: isSelected ? 2 : 0,
            transform: [{ scale: pulse }],
            shadowColor: catColor,
            shadowOpacity: isSelected ? 0.8 : 0.4,
            shadowRadius: isSelected ? 16 : 8,
            width: isSelected ? 44 : 32,
            height: isSelected ? 44 : 32,
            borderRadius: isSelected ? 22 : 16,
            opacity: dimmed ? 0.25 : 1,
          },
        ]}
      >
        <MaterialCommunityIcons
          name={catMeta.icon as any}
          size={isSelected ? 20 : 16}
          color={catColor}
        />
        <View style={[styles.severityDot, { backgroundColor: sevColor, borderColor: '#0d1117' }]} />
        {marker.incident.isVerified && (
          <View style={styles.verifiedBadge}>
            <Text style={{ fontSize: 8 }}>✅</Text>
          </View>
        )}
      </Animated.View>
    </Marker>
  );
}

function UserLocationMarker({ coordinate }: { coordinate: { latitude: number; longitude: number } }) {
  const ring = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(ring, { toValue: 1.8, duration: 1500, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(ring, { toValue: 1, duration: 1500, easing: Easing.in(Easing.ease), useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  const opacity = ring.interpolate({
    inputRange: [1, 1.8],
    outputRange: [0.5, 0],
  });

  return (
    <Marker coordinate={coordinate} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
      <View style={styles.userContainer}>
        <Animated.View
          style={[styles.userRing, { transform: [{ scale: ring }], opacity, borderColor: 'rgba(33,150,255,0.5)' }]}
        />
        <View style={styles.userDot}>
          <MaterialCommunityIcons name="account" size={12} color="#fff" />
        </View>
        <Text style={styles.userLabel}>You</Text>
      </View>
    </Marker>
  );
}

function FamilyMarker({ member }: { member: any }) {
  if (!member.location || member.uid === 'mock-user-001') return null;
  const color = member.role === 'kid' ? Colors.warning : member.role === 'admin' ? Colors.primary : Colors.secondary;
  const initial = member.displayName.charAt(0).toUpperCase();

  return (
    <Marker coordinate={member.location} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
      <View style={{ alignItems: 'center', opacity: member.isOnline ? 1 : 0.4 }}>
        <View style={[styles.familyCircle, { backgroundColor: color + '30', borderColor: color }]}>
          <Text style={[styles.familyInitial, { color }]}>{initial}</Text>
        </View>
        <Text style={[styles.familyName, { color }]}>{member.displayName.split(' ')[0]}</Text>
        {member.isOnline && <View style={[styles.onlineDot, { backgroundColor: Colors.success }]} />}
      </View>
    </Marker>
  );
}

function SpeedCameraMarker({ camera }: { camera: { lat: number; lng: number; speedLimit: number | null } }) {
  return (
    <Marker coordinate={{ latitude: camera.lat, longitude: camera.lng }} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
      <View style={styles.cameraMarker}>
        <Text style={{ fontSize: 12 }}>📷</Text>
        {camera.speedLimit && (
          <View style={styles.cameraBadge}>
            <Text style={styles.cameraBadgeText}>{camera.speedLimit}</Text>
          </View>
        )}
      </View>
    </Marker>
  );
}

function haversineDistance(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }): number {
  const R = 6371000;
  const dLat = (b.latitude - a.latitude) * Math.PI / 180;
  const dLon = (b.longitude - a.longitude) * Math.PI / 180;
  const lat1 = a.latitude * Math.PI / 180;
  const lat2 = b.latitude * Math.PI / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

export function AttentionMap({
  markers,
  userLocation,
  familyMembers,
  onMarkerPress,
  onMapPress,
  onMapReady,
  selectedMarkerId,
  guardScan,
  lightTheme,
  navigation,
  driveMode,
  speedCameras,
  initialRegion,
}: AttentionMapProps) {
  const mapViewRef = useRef<MapView>(null);
  const [zoomLevel, setZoomLevel] = useState(13);

  const handleRegionChange = useCallback((region: any) => {
    const zoom = Math.round(Math.log(360 / region.latitudeDelta) / Math.LN2);
    setZoomLevel(zoom);
  }, []);

  useEffect(() => {
    if (driveMode && mapViewRef.current) {
      mapViewRef.current.animateCamera({ pitch: 55, heading: 0 }, { duration: 800 });
    } else if (mapViewRef.current) {
      mapViewRef.current.animateCamera({ pitch: 0, heading: 0 }, { duration: 600 });
    }
  }, [driveMode]);

  const routeCoords = navigation?.coordinates?.map(([lng, lat]) => ({ latitude: lat, longitude: lng })) || [];

  return (
    <View style={styles.container}>
      <MapView
        ref={mapViewRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        customMapStyle={lightTheme ? undefined : DARK_MAP_STYLE}
        initialRegion={initialRegion || DEFAULT_REGION}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        rotateEnabled={driveMode}
        pitchEnabled={driveMode}
        onPress={() => onMapPress?.()}
        onMapReady={() => onMapReady?.()}
        onRegionChangeComplete={handleRegionChange}
        accessibilityLabel="Interactive map showing community incidents"
      >
        {userLocation && <UserLocationMarker coordinate={userLocation} />}

        {familyMembers?.map((m) => (
          <FamilyMarker key={m.uid} member={m} />
        ))}

        {markers.map((m) => {
          const isDimmed = driveMode && userLocation
            ? haversineDistance(userLocation, m.coordinate) > 1500
            : false;
          return (
            <PulsingMarker
              key={m.id}
              marker={m}
              isSelected={m.id === selectedMarkerId}
              onPress={() => onMarkerPress(m)}
              dimmed={isDimmed}
            />
          );
        })}

        {speedCameras?.map((cam) => (
          <SpeedCameraMarker key={cam.id} camera={cam} />
        ))}

        {guardScan?.active && guardScan.center && (
          <>
            <Circle
              center={guardScan.center}
              radius={guardScan.radiusMeters}
              fillColor={guardScan.scanning ? Colors.primary + '18' : Colors.primary + '08'}
              strokeColor={Colors.primary + '99'}
              strokeWidth={2}
            />
          </>
        )}

        {routeCoords.length > 1 && (
          <Polyline
            coordinates={routeCoords}
            strokeColor="#00AAFF"
            strokeWidth={4}
            lineDashPattern={[0]}
          />
        )}

        {navigation && routeCoords.length > 0 && (
          <Marker
            coordinate={routeCoords[routeCoords.length - 1]}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={false}
          >
            <View style={styles.destMarker}>
              <Text style={{ fontSize: 14 }}>📍</Text>
            </View>
          </Marker>
        )}

        {zoomLevel < 7 && WORLD_CAPITALS.map((cap) => (
          <Marker
            key={cap.country}
            coordinate={{ latitude: cap.lat, longitude: cap.lng }}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={false}
          >
            <View style={styles.capitalMarker}>
              <View style={styles.capitalCircle}>
                <Text style={{ fontSize: 10 }}>{cap.flag}</Text>
              </View>
              <Text style={styles.capitalLabel} numberOfLines={1}>{cap.city}</Text>
            </View>
          </Marker>
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  marker: {
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowOffset: { width: 0, height: 0 },
    position: 'relative',
  },
  severityDot: {
    position: 'absolute',
    top: -1,
    right: -1,
    width: 7,
    height: 7,
    borderRadius: 4,
    borderWidth: 1.5,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -3,
    right: -3,
  },
  userContainer: {
    width: 48,
    height: 56,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  userDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2.5,
    borderColor: '#fff',
    backgroundColor: '#2196FF',
    shadowColor: '#2196FF',
    shadowOpacity: 0.7,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  userRing: {
    position: 'absolute',
    top: 4,
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
  },
  userLabel: {
    fontSize: 7,
    color: '#fff',
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    marginTop: 1,
  },
  familyCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 4,
  },
  familyInitial: {
    fontSize: 12,
    fontWeight: '700',
  },
  familyName: {
    fontSize: 7,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    marginTop: 1,
  },
  onlineDot: {
    position: 'absolute',
    top: -1,
    right: -1,
    width: 6,
    height: 6,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: '#0d1117',
  },
  cameraMarker: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,60,60,0.15)',
    borderWidth: 2,
    borderColor: '#FF3C3C',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cameraBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#FF3C3C',
    borderRadius: 3,
    paddingHorizontal: 2,
  },
  cameraBadgeText: {
    fontSize: 7,
    fontWeight: '700',
    color: '#fff',
  },
  destMarker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,170,255,0.15)',
    borderWidth: 2.5,
    borderColor: '#00AAFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00AAFF',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 6,
  },
  capitalMarker: {
    alignItems: 'center',
  },
  capitalCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(20,20,32,0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  capitalLabel: {
    fontSize: 6,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    maxWidth: 50,
    textAlign: 'center',
    marginTop: 1,
  },
});
