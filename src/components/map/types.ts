import type { Incident, GeoPosition, FamilyMember } from '../../types';

export interface MapMarker {
  id: string;
  coordinate: GeoPosition;
  incident: Incident;
}

export interface GuardScanConfig {
  active: boolean;
  scanning: boolean;
  radiusMeters: number;
  center: GeoPosition;
}

export interface NavigationRoute {
  coordinates: [number, number][];
  distance: number;
  duration: number;
  destinationName: string;
  incidents: MapMarker[];
}

export interface SpeedCamera {
  id: string;
  lat: number;
  lng: number;
  speedLimit: number | null;
}

export interface AttentionMapProps {
  markers: MapMarker[];
  userLocation: GeoPosition | null;
  familyMembers?: FamilyMember[];
  onMarkerPress: (marker: MapMarker) => void;
  onMapPress?: () => void;
  onMapReady?: () => void;
  selectedMarkerId?: string | null;
  guardScan?: GuardScanConfig | null;
  lightTheme?: boolean;
  navigation?: NavigationRoute | null;
  driveMode?: boolean;
  speedCameras?: SpeedCamera[];
  initialRegion?: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
}

export const DEFAULT_REGION = {
  latitude: 41.2356,
  longitude: -8.6200,
  latitudeDelta: 0.06,
  longitudeDelta: 0.06,
};
