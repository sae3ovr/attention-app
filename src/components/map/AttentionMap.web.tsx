import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import type { AttentionMapProps, MapMarker } from './types';
import { DEFAULT_REGION } from './types';
import { Colors } from '../../theme/colors';
import { getCategoryMeta } from '../../constants/categories';
import { timeAgo } from '../../services/mockData';
import { WORLD_CAPITALS } from '../../data/worldCapitals';

declare const maplibregl: any;

const STYLE_DARK = 'https://tiles.openfreemap.org/styles/dark';
const STYLE_LIGHT = 'https://tiles.openfreemap.org/styles/liberty';

function loadMapLibre(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof maplibregl !== 'undefined') { resolve(); return; }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/maplibre-gl@5.21.1/dist/maplibre-gl.css';
    document.head.appendChild(link);
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/maplibre-gl@5.21.1/dist/maplibre-gl.js';
    script.onload = () => resolve();
    document.head.appendChild(script);
  });
}

const EMOJI_MAP: Record<string, string> = {
  'shield-alert': '🚨', 'car-crash': '💥', 'eye-outline': '👁', 'fire': '🔥',
  'police-badge': '🚔', 'medical-bag': '🏥', 'traffic-light': '🚦',
  'volume-high': '📢', 'alert-outline': '⚠️', 'alert-octagon': '⚠️',
  'dots-horizontal-circle': '🔵',
};

const POIS: { type: string; emoji: string; lat: number; lng: number }[] = [
  { type: 'hospital', emoji: '🏥', lat: 41.2375, lng: -8.6215 },
  { type: 'hospital', emoji: '🏥', lat: 41.2200, lng: -8.6050 },
  { type: 'hospital', emoji: '🏥', lat: 41.2510, lng: -8.6400 },
  { type: 'taxi', emoji: '🚕', lat: 41.2345, lng: -8.6190 },
  { type: 'taxi', emoji: '🚕', lat: 41.2470, lng: -8.6330 },
  { type: 'police', emoji: '🚔', lat: 41.2360, lng: -8.6250 },
  { type: 'police', emoji: '🚔', lat: 41.2180, lng: -8.6150 },
  { type: 'fire', emoji: '🚒', lat: 41.2520, lng: -8.6200 },
  { type: 'fire', emoji: '🚒', lat: 41.2280, lng: -8.6380 },
  { type: 'vet', emoji: '🐾', lat: 41.2380, lng: -8.5980 },
  { type: 'vet', emoji: '🐾', lat: 41.2450, lng: -8.6470 },
];

function injectMapStyles() {
  if (document.getElementById('attention-maplibre-styles')) return;
  const style = document.createElement('style');
  style.id = 'attention-maplibre-styles';
  style.textContent = `
    @keyframes marker-pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.1); } }
    @keyframes user-glow-pulse { 0%,100% { transform: scale(1); opacity:0.5; } 50% { transform: scale(1.6); opacity:0; } }
    @keyframes scan-pulse { 0% { transform: scale(0.3); opacity:0.5; } 100% { transform: scale(1); opacity:0; } }
    .attn-marker { cursor: pointer; transition: transform 0.2s ease; }
    .attn-marker:hover { transform: scale(1.2); z-index: 100 !important; }
    .attn-marker.selected { animation: marker-pulse 1.5s ease-in-out infinite; }
    .user-glow-ring { animation: user-glow-pulse 2.5s ease-out infinite; }
    .scan-pulse-ring { animation: scan-pulse 2s ease-out infinite; }
    .maplibregl-popup-content {
      background: rgba(20,20,32,0.95) !important; color: #fff !important;
      border: 1px solid rgba(255,255,255,0.08) !important; border-radius: 14px !important;
      box-shadow: 0 8px 32px rgba(0,0,0,0.5) !important; backdrop-filter: blur(16px);
      padding: 0 !important; min-width: 250px;
    }
    .maplibregl-popup-tip { border-top-color: rgba(20,20,32,0.95) !important; }
    .maplibregl-popup-close-button { color: #8A8A9A !important; font-size: 20px !important; padding: 6px 10px !important; }
    .maplibregl-popup-close-button:hover { color: #fff !important; }
    .map-ctrl-btn {
      width: 36px; height: 36px; border-radius: 8px; border: 1px solid rgba(0,0,0,0.15);
      display: flex; align-items: center; justify-content: center; cursor: pointer;
      transition: all 0.2s ease; box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    }
    .map-ctrl-btn:hover { border-color: rgba(0,170,255,0.4); }
    .map-ctrl-btn.active { border-color: ${Colors.primary}; background: ${Colors.primary}20 !important; }
    .light-map .maplibregl-popup-content {
      background: rgba(255,255,255,0.96) !important; color: #1a1d2e !important;
      border: 1px solid rgba(0,0,0,0.08) !important;
    }
    .light-map .maplibregl-popup-tip { border-top-color: rgba(255,255,255,0.96) !important; }
    .light-map .maplibregl-popup-close-button { color: #555B6E !important; }
    .light-map .maplibregl-popup-close-button:hover { color: #1a1d2e !important; }
    .light-map .incident-popup h3 { color: #1a1d2e !important; }
    .light-map .incident-popup .meta span { color: #555B6E; }
    .light-map .incident-popup p { color: #555B6E !important; }
    .incident-popup { padding: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .incident-popup h3 { margin: 0 0 6px; font-size: 14px; font-weight: 600; color: #fff; line-height: 1.3; }
    .incident-popup .meta { display:flex; align-items:center; gap:6px; margin-bottom:8px; font-size:11px; color:#8A8A9A; flex-wrap:wrap; }
    .incident-popup .stats { display:flex; gap:14px; font-size:12px; }
    .incident-popup .stat { display:flex; align-items:center; gap:3px; }
    .capital-marker:hover { transform: scale(1.3); z-index: 50 !important; }
    .capital-marker:hover div:last-child { max-width: 120px !important; font-size: 8px !important; color: rgba(255,255,255,0.95) !important; }
  `;
  document.head.appendChild(style);
}

function createPopupHTML(marker: MapMarker): string {
  const inc = marker.incident;
  const catMeta = getCategoryMeta(inc.category);
  const catColor = Colors.category[inc.category];
  const sevColor = Colors.severity[inc.severity];
  return `
    <div class="incident-popup">
      <div class="meta">
        <span style="display:inline-flex;align-items:center;gap:3px;padding:2px 7px;border-radius:20px;
          background:${catColor}20;color:${catColor};font-weight:600;font-size:10px;text-transform:uppercase;">
          ${catMeta.label}
        </span>
        <span style="width:7px;height:7px;border-radius:50%;background:${sevColor};box-shadow:0 0 5px ${sevColor};display:inline-block;"></span>
        <span>${timeAgo(inc.createdAt)}</span>
        ${inc.isVerified ? `<span style="color:${Colors.primary};font-size:10px;">✓ Verified</span>` : ''}
      </div>
      <h3>${inc.title}</h3>
      <p style="margin:0 0 10px;font-size:12px;color:#8A8A9A;line-height:1.4;">
        ${inc.description.length > 120 ? inc.description.slice(0, 120) + '...' : inc.description}
      </p>
      <div class="stats">
        <div class="stat" style="color:${Colors.success}">✓ ${inc.confirmCount}</div>
        <div class="stat" style="color:${Colors.error}">✗ ${inc.denyCount}</div>
        <div class="stat" style="color:${Colors.warning}">🔥 ${inc.reactions.useful}</div>
        <div class="stat" style="color:#8A8A9A">💬 ${inc.commentCount}</div>
      </div>
      <div style="margin-top:8px;font-size:10px;color:#5A5A6A;">by ${inc.reporterName} • Lvl ${inc.reporterLevel}</div>
    </div>`;
}

function createMarkerEl(marker: MapMarker, isSelected: boolean): HTMLDivElement {
  const catColor = Colors.category[marker.incident.category] || '#8A8A9A';
  const sevColor = Colors.severity[marker.incident.severity] || '#FFB800';
  const catMeta = getCategoryMeta(marker.incident.category);
  const emoji = EMOJI_MAP[catMeta.icon] || '⚠️';

  const el = document.createElement('div');
  el.className = `attn-marker${isSelected ? ' selected' : ''}`;

  if (isSelected) {
    el.style.cssText = 'width:42px;height:42px;position:relative;';
    el.innerHTML = `
      <div style="width:42px;height:42px;background:radial-gradient(circle,${catColor}40 0%,${catColor}10 70%);
        border:2px solid ${catColor};border-radius:50%;display:flex;align-items:center;justify-content:center;
        box-shadow:0 0 20px ${catColor},0 0 40px ${catColor}60;position:relative;">
        <span style="font-size:18px;">${emoji}</span>
        <div style="position:absolute;top:-2px;right:-2px;width:9px;height:9px;background:${sevColor};
          border-radius:50%;border:1.5px solid #0d1117;box-shadow:0 0 5px ${sevColor};"></div>
      </div>
      ${marker.incident.isVerified ? '<div style="position:absolute;bottom:-3px;right:-3px;font-size:10px;">✅</div>' : ''}`;
  } else {
    el.style.cssText = 'width:28px;height:28px;position:relative;cursor:pointer;display:flex;align-items:center;justify-content:center;';
    el.innerHTML = `
      <span style="font-size:18px;filter:drop-shadow(0 1px 3px rgba(0,0,0,0.5)) drop-shadow(0 0 6px ${catColor}80);
        transition:transform 0.15s ease;" class="marker-emoji">${emoji}</span>
      <div style="position:absolute;top:-2px;right:-2px;width:8px;height:8px;background:${sevColor};
        border-radius:50%;border:1.5px solid #0d1117;box-shadow:0 0 4px ${sevColor};"></div>
      ${marker.incident.isVerified ? '<div style="position:absolute;bottom:-4px;right:-4px;font-size:9px;">✅</div>' : ''}`;
  }

  return el;
}

function createUserEl(): HTMLDivElement {
  const el = document.createElement('div');
  el.style.cssText = 'width:48px;height:56px;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;position:relative;cursor:default;';

  const ring = document.createElement('div');
  ring.className = 'user-glow-ring';
  ring.style.cssText = 'position:absolute;top:4px;left:6px;width:36px;height:36px;border-radius:50%;border:2px solid rgba(33,150,255,0.3);pointer-events:none;';
  el.appendChild(ring);

  const circle = document.createElement('div');
  circle.style.cssText = 'width:32px;height:32px;border-radius:50%;border:2.5px solid #fff;box-shadow:0 0 16px rgba(33,150,255,0.7),0 2px 8px rgba(0,0,0,0.4);z-index:2;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#2196FF 0%,#1565C0 100%);margin-top:4px;';

  const personImg = document.createElement('img');
  personImg.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>');
  personImg.style.cssText = 'width:18px;height:18px;';
  personImg.alt = 'You';
  circle.appendChild(personImg);
  el.appendChild(circle);

  const label = document.createElement('div');
  label.style.cssText = 'margin-top:2px;font-size:8px;color:#fff;font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-weight:700;text-shadow:0 1px 4px rgba(0,0,0,0.9);letter-spacing:0.5px;z-index:2;';
  label.textContent = 'You';
  el.appendChild(label);

  return el;
}

function createSpeedCamEl(limit: number | null): HTMLDivElement {
  const el = document.createElement('div');
  el.className = 'attn-marker';
  el.style.cssText = 'width:28px;height:28px;cursor:pointer;';
  el.innerHTML = `
    <div style="width:28px;height:28px;background:rgba(255,60,60,0.15);border:2px solid #FF3C3C;
      border-radius:50%;display:flex;align-items:center;justify-content:center;
      box-shadow:0 0 8px rgba(255,60,60,0.4);">
      <span style="font-size:12px;">📷</span>
    </div>
    ${limit ? `<div style="position:absolute;top:-8px;right:-8px;background:#FF3C3C;color:white;
      font-size:8px;font-weight:700;border-radius:4px;padding:0 3px;font-family:sans-serif;
      box-shadow:0 1px 4px rgba(0,0,0,0.3);">${limit}</div>` : ''}`;
  return el;
}

function createFamilyEl(name: string, role: string, isOnline: boolean): HTMLDivElement {
  const color = role === 'kid' ? Colors.warning : role === 'admin' ? Colors.primary : Colors.secondary;
  const initial = name.charAt(0).toUpperCase();
  const el = document.createElement('div');
  el.style.cssText = `opacity:${isOnline ? 1 : 0.4};display:flex;flex-direction:column;align-items:center;position:relative;`;
  el.innerHTML = `
    <div style="width:30px;height:30px;background:${color}30;border:2px solid ${color};border-radius:50%;
      display:flex;align-items:center;justify-content:center;box-shadow:0 0 8px ${color}60;
      font-size:13px;font-weight:700;color:${color};font-family:sans-serif;">${initial}</div>
    <div style="margin-top:2px;font-size:8px;color:${color};font-family:sans-serif;font-weight:600;
      text-shadow:0 0 4px #000,0 1px 2px #000;white-space:nowrap;">${name.split(' ')[0]}</div>
    ${isOnline ? `<div style="position:absolute;top:-2px;right:-2px;width:7px;height:7px;
      background:${Colors.success};border-radius:50%;border:1.5px solid #0d1117;box-shadow:0 0 4px ${Colors.success};"></div>` : ''}`;
  return el;
}

function createPOIEl(emoji: string): HTMLDivElement {
  const el = document.createElement('div');
  el.style.cssText = 'width:22px;height:22px;display:flex;align-items:center;justify-content:center;opacity:0.5;font-size:14px;';
  el.textContent = emoji;
  return el;
}

function createCapitalEl(flag: string, city: string): HTMLDivElement {
  const el = document.createElement('div');
  el.className = 'capital-marker';
  el.style.cssText = 'display:flex;flex-direction:column;align-items:center;cursor:pointer;transition:transform 0.15s ease,opacity 0.15s ease;';
  el.innerHTML = `
    <div style="width:20px;height:20px;border-radius:50%;background:rgba(20,20,32,0.85);border:1.5px solid rgba(255,255,255,0.15);
      display:flex;align-items:center;justify-content:center;font-size:11px;
      box-shadow:0 2px 6px rgba(0,0,0,0.4);">${flag}</div>
    <div style="margin-top:1px;font-size:7px;color:rgba(255,255,255,0.7);font-family:-apple-system,BlinkMacSystemFont,sans-serif;
      font-weight:600;text-shadow:0 1px 3px rgba(0,0,0,0.9);white-space:nowrap;max-width:60px;overflow:hidden;text-overflow:ellipsis;
      text-align:center;">${city}</div>`;
  return el;
}

export function AttentionMap({
  markers, userLocation, familyMembers, onMarkerPress, onMapPress, onMapReady,
  selectedMarkerId, guardScan, lightTheme, navigation, driveMode, speedCameras,
  initialRegion,
}: AttentionMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const glMap = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const popupRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const familyMarkersRef = useRef<any[]>([]);
  const poiMarkersRef = useRef<any[]>([]);
  const camMarkersRef = useRef<any[]>([]);
  const capitalMarkersRef = useRef<any[]>([]);
  const scanSourceAdded = useRef(false);
  const routeSourceAdded = useRef(false);
  const destMarkerRef = useRef<any>(null);
  const userLocationRef = useRef(userLocation);
  const [loaded, setLoaded] = useState(false);
  const [is3D, setIs3D] = useState(false);
  const buildingsAdded = useRef(false);

  useEffect(() => { userLocationRef.current = userLocation; }, [userLocation]);

  useEffect(() => {
    injectMapStyles();
    loadMapLibre().then(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (!loaded || !mapRef.current || glMap.current) return;
    const region = initialRegion || DEFAULT_REGION;
    const styleUrl = lightTheme ? STYLE_LIGHT : STYLE_DARK;

    const map = new maplibregl.Map({
      container: mapRef.current,
      style: styleUrl,
      center: [region.longitude, region.latitude],
      zoom: 13,
      pitch: 0,
      bearing: 0,
      antialias: true,
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: true, showZoom: true }), 'bottom-right');
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-left');

    map.on('click', (e: any) => {
      const features = map.queryRenderedFeatures(e.point);
      const isMarkerClick = features.some((f: any) => f.source === 'incidents');
      if (!isMarkerClick) onMapPress?.();
    });

    map.on('load', () => {
      addScanSource(map);
      addRouteSource(map);
      onMapReady?.();
    });

    glMap.current = map;

    return () => { map.remove(); glMap.current = null; buildingsAdded.current = false; scanSourceAdded.current = false; routeSourceAdded.current = false; };
  }, [loaded]);

  useEffect(() => {
    if (!glMap.current) return;
    const styleUrl = lightTheme ? STYLE_LIGHT : STYLE_DARK;
    const map = glMap.current;
    const center = map.getCenter();
    const zoom = map.getZoom();
    const pitch = map.getPitch();
    const bearing = map.getBearing();

    map.setStyle(styleUrl);
    map.once('style.load', () => {
      map.jumpTo({ center, zoom, pitch, bearing });
      buildingsAdded.current = false;
      scanSourceAdded.current = false;
      routeSourceAdded.current = false;
      addScanSource(map);
      addRouteSource(map);
      if (is3D) add3DBuildings(map);
      reAddPOIs();
      addCapitalMarkers();
    });
  }, [lightTheme]);

  function addRouteSource(map: any) {
    if (routeSourceAdded.current) return;
    try {
      map.addSource('nav-route', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
      map.addLayer({
        id: 'nav-route-outline',
        type: 'line',
        source: 'nav-route',
        paint: { 'line-color': '#00AAFF', 'line-width': 8, 'line-opacity': 0.25 },
        layout: { 'line-cap': 'round', 'line-join': 'round' },
      });
      map.addLayer({
        id: 'nav-route-line',
        type: 'line',
        source: 'nav-route',
        paint: {
          'line-color': '#00AAFF',
          'line-width': 4,
          'line-opacity': 0.9,
        },
        layout: { 'line-cap': 'round', 'line-join': 'round' },
      });
      routeSourceAdded.current = true;
    } catch (_) {}
  }

  function addScanSource(map: any) {
    if (scanSourceAdded.current) return;
    try {
      map.addSource('guardscan', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
      map.addLayer({
        id: 'guardscan-fill',
        type: 'fill',
        source: 'guardscan',
        paint: { 'fill-color': Colors.primary, 'fill-opacity': 0.06 },
      });
      map.addLayer({
        id: 'guardscan-outline',
        type: 'line',
        source: 'guardscan',
        paint: { 'line-color': Colors.primary, 'line-width': 2, 'line-opacity': 0.6 },
      });
      scanSourceAdded.current = true;
    } catch (_) { /* source may exist */ }
  }

  function add3DBuildings(map: any) {
    if (buildingsAdded.current) return;
    const layers = map.getStyle()?.layers;
    if (!layers) return;

    let labelLayerId: string | undefined;
    for (const layer of layers) {
      if (layer.type === 'symbol' && layer.layout?.['text-field']) {
        labelLayerId = layer.id;
        break;
      }
    }

    const existingSources = Object.keys(map.getStyle()?.sources || {});
    const buildingSource = existingSources.find(s => {
      const src = map.getSource(s);
      return src && src.type === 'vector';
    });

    if (!buildingSource) return;

    try {
      map.addLayer({
        id: '3d-buildings',
        source: buildingSource,
        'source-layer': 'building',
        type: 'fill-extrusion',
        minzoom: 14,
        paint: {
          'fill-extrusion-color': lightTheme
            ? ['interpolate', ['linear'], ['get', 'render_height'], 0, '#d4d8e0', 50, '#b8c0cc', 150, '#a0aab8']
            : ['interpolate', ['linear'], ['get', 'render_height'], 0, '#1a1a2e', 50, '#252540', 150, '#303050'],
          'fill-extrusion-height': ['interpolate', ['linear'], ['zoom'], 14, 0, 15.5, ['get', 'render_height']],
          'fill-extrusion-base': ['case', ['>=', ['get', 'render_min_height'], 0], ['get', 'render_min_height'], 0],
          'fill-extrusion-opacity': 0.7,
        },
      }, labelLayerId);
      buildingsAdded.current = true;
    } catch (_) { /* layer may already exist */ }
  }

  function remove3DBuildings(map: any) {
    try {
      if (map.getLayer('3d-buildings')) map.removeLayer('3d-buildings');
      buildingsAdded.current = false;
    } catch (_) {}
  }

  const toggle3D = useCallback(() => {
    const map = glMap.current;
    if (!map) return;
    const new3D = !is3D;
    setIs3D(new3D);

    if (new3D) {
      map.easeTo({ pitch: 55, bearing: -17, duration: 1200 });
      add3DBuildings(map);
    } else {
      map.easeTo({ pitch: 0, bearing: 0, duration: 1000 });
      remove3DBuildings(map);
    }
  }, [is3D, lightTheme]);

  const centerOnUser = useCallback(() => {
    const map = glMap.current;
    const loc = userLocationRef.current;
    if (map && loc) {
      map.flyTo({ center: [loc.longitude, loc.latitude], zoom: 16, duration: 800 });
    }
  }, []);

  useEffect(() => {
    const map = glMap.current;
    if (!map) return;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    if (popupRef.current) { popupRef.current.remove(); popupRef.current = null; }

    markers.forEach((m) => {
      const isSelected = m.id === selectedMarkerId;
      const el = createMarkerEl(m, isSelected);

      if (driveMode && userLocation) {
        const dlat = m.coordinate.latitude - userLocation.latitude;
        const dlng = m.coordinate.longitude - userLocation.longitude;
        const dist = Math.sqrt(dlat * dlat + dlng * dlng);
        if (dist > 0.015) {
          el.style.opacity = '0.2';
          el.style.filter = 'grayscale(0.7)';
          el.style.transform = 'scale(0.7)';
        } else {
          el.style.opacity = '1';
          el.style.filter = 'none';
        }
      }

      const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat([m.coordinate.longitude, m.coordinate.latitude])
        .addTo(map);

      el.addEventListener('click', (e: MouseEvent) => {
        e.stopPropagation();
        onMarkerPress(m);

        if (popupRef.current) popupRef.current.remove();
        const popup = new maplibregl.Popup({ offset: 25, closeButton: true, maxWidth: '320px' })
          .setLngLat([m.coordinate.longitude, m.coordinate.latitude])
          .setHTML(createPopupHTML(m))
          .addTo(map);
        popupRef.current = popup;
      });

      if (isSelected) {
        const popup = new maplibregl.Popup({ offset: 25, closeButton: true, maxWidth: '320px' })
          .setLngLat([m.coordinate.longitude, m.coordinate.latitude])
          .setHTML(createPopupHTML(m))
          .addTo(map);
        popupRef.current = popup;
      }

      markersRef.current.push(marker);
    });
  }, [markers, selectedMarkerId, driveMode]);

  useEffect(() => {
    const map = glMap.current;
    if (!map || !userLocation) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.setLngLat([userLocation.longitude, userLocation.latitude]);
    } else {
      const el = createUserEl();
      userMarkerRef.current = new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat([userLocation.longitude, userLocation.latitude])
        .addTo(map);
    }
  }, [userLocation]);

  useEffect(() => {
    const map = glMap.current;
    if (!map) return;

    familyMarkersRef.current.forEach(m => m.remove());
    familyMarkersRef.current = [];

    if (!familyMembers) return;
    familyMembers.forEach((m) => {
      if (!m.location || m.uid === 'mock-user-001') return;
      const el = createFamilyEl(m.displayName, m.role, m.isOnline ?? false);
      const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat([m.location.longitude, m.location.latitude])
        .addTo(map);
      familyMarkersRef.current.push(marker);
    });
  }, [familyMembers]);

  function reAddPOIs() {
    const map = glMap.current;
    if (!map) return;
    poiMarkersRef.current.forEach(m => m.remove());
    poiMarkersRef.current = [];
    POIS.forEach((poi) => {
      const el = createPOIEl(poi.emoji);
      const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat([poi.lng, poi.lat])
        .addTo(map);
      poiMarkersRef.current.push(marker);
    });
  }

  useEffect(() => {
    if (!glMap.current) return;
    reAddPOIs();
  }, [loaded]);

  function addCapitalMarkers() {
    const map = glMap.current;
    if (!map) return;
    capitalMarkersRef.current.forEach((m: any) => m.remove());
    capitalMarkersRef.current = [];

    WORLD_CAPITALS.forEach((cap) => {
      const el = createCapitalEl(cap.flag, cap.city);
      const m = new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat([cap.lng, cap.lat])
        .addTo(map);
      capitalMarkersRef.current.push(m);
    });

    updateCapitalVisibility();
  }

  function updateCapitalVisibility() {
    const map = glMap.current;
    if (!map) return;
    const zoom = map.getZoom();
    const show = zoom < 7;
    capitalMarkersRef.current.forEach((m: any) => {
      const el = m.getElement();
      if (el) el.style.display = show ? 'flex' : 'none';
    });
  }

  useEffect(() => {
    const map = glMap.current;
    if (!map || !loaded) return;

    addCapitalMarkers();

    const onZoom = () => updateCapitalVisibility();
    map.on('zoom', onZoom);
    return () => { map.off('zoom', onZoom); };
  }, [loaded]);

  useEffect(() => {
    const map = glMap.current;
    if (!map || !scanSourceAdded.current) return;

    const src = map.getSource('guardscan');
    if (!src) return;

    if (!guardScan?.active) {
      src.setData({ type: 'FeatureCollection', features: [] });
      return;
    }

    const { center, radiusMeters } = guardScan;
    const steps = 64;
    const coords: [number, number][] = [];
    for (let i = 0; i <= steps; i++) {
      const angle = (i / steps) * 2 * Math.PI;
      const dx = radiusMeters * Math.cos(angle);
      const dy = radiusMeters * Math.sin(angle);
      const lat = center.latitude + (dy / 111320);
      const lng = center.longitude + (dx / (111320 * Math.cos(center.latitude * Math.PI / 180)));
      coords.push([lng, lat]);
    }

    src.setData({
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        geometry: { type: 'Polygon', coordinates: [coords] },
        properties: {},
      }],
    });

    map.setPaintProperty('guardscan-fill', 'fill-opacity', guardScan.scanning ? 0.1 : 0.04);
  }, [guardScan?.active, guardScan?.radiusMeters, guardScan?.scanning, guardScan?.center?.latitude, guardScan?.center?.longitude]);

  useEffect(() => {
    const map = glMap.current;
    if (!map || !routeSourceAdded.current) return;

    const src = map.getSource('nav-route');
    if (!src) return;

    if (destMarkerRef.current) { destMarkerRef.current.remove(); destMarkerRef.current = null; }

    if (!navigation) {
      src.setData({ type: 'FeatureCollection', features: [] });
      return;
    }

    src.setData({
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: navigation.coordinates },
        properties: {},
      }],
    });

    const lastCoord = navigation.coordinates[navigation.coordinates.length - 1];
    if (lastCoord) {
      const destEl = document.createElement('div');
      destEl.style.cssText = 'width:36px;height:36px;display:flex;align-items:center;justify-content:center;';
      destEl.innerHTML = `
        <div style="width:28px;height:28px;background:rgba(0,170,255,0.15);border:2.5px solid #00AAFF;
          border-radius:50%;display:flex;align-items:center;justify-content:center;
          box-shadow:0 0 14px rgba(0,170,255,0.5);">
          <div style="font-size:14px;">📍</div>
        </div>`;
      destMarkerRef.current = new maplibregl.Marker({ element: destEl, anchor: 'center' })
        .setLngLat(lastCoord)
        .addTo(map);
    }

    const bounds = navigation.coordinates.reduce(
      (b: any, c: [number, number]) => b.extend(c),
      new maplibregl.LngLatBounds(navigation.coordinates[0], navigation.coordinates[0])
    );
    map.fitBounds(bounds, { padding: { top: 80, bottom: 120, left: 60, right: 60 }, duration: 1000 });
  }, [navigation]);

  useEffect(() => {
    const map = glMap.current;
    if (!map) return;
    camMarkersRef.current.forEach((m: any) => m.remove());
    camMarkersRef.current = [];
    if (!speedCameras?.length) return;
    speedCameras.forEach((cam) => {
      const el = createSpeedCamEl(cam.speedLimit);
      const m = new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat([cam.lng, cam.lat])
        .addTo(map);
      camMarkersRef.current.push(m);
    });
  }, [speedCameras]);

  useEffect(() => {
    const map = glMap.current;
    if (!map) return;
    if (driveMode) {
      map.easeTo({ pitch: 60, bearing: 0, duration: 800 });
    } else {
      map.easeTo({ pitch: 0, bearing: 0, duration: 600 });
    }
  }, [driveMode]);

  return (
    <View style={mapStyles.container}>
      <div ref={mapRef} className={lightTheme ? 'light-map' : ''} style={{ width: '100%', height: '100%', backgroundColor: lightTheme ? '#f0f2f5' : '#0d1117' }}
        role="application" aria-label="Interactive map showing community incidents" />

      {loaded && (
        <div style={{
          position: 'absolute', top: 180, right: 12, display: 'flex', flexDirection: 'column', gap: 6, zIndex: 10,
        }}>
          {/* 3D Toggle */}
          <div
            className={`map-ctrl-btn${is3D ? ' active' : ''}`}
            style={{ background: is3D ? `${Colors.primary}15` : lightTheme ? 'rgba(255,255,255,0.92)' : 'rgba(20,20,32,0.9)' }}
            onClick={toggle3D}
            title={is3D ? 'Switch to 2D' : 'Switch to 3D'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={is3D ? Colors.primary : '#8A8A9A'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {is3D ? (
                <>
                  <path d="M12 3L2 8l10 5 10-5-10-5z" /><path d="M2 16l10 5 10-5" /><path d="M2 12l10 5 10-5" />
                </>
              ) : (
                <>
                  <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18" /><path d="M9 3v18" />
                </>
              )}
            </svg>
          </div>

          {/* Center on user */}
          <div
            className="map-ctrl-btn"
            style={{ background: lightTheme ? 'rgba(255,255,255,0.92)' : 'rgba(20,20,32,0.9)' }}
            onClick={centerOnUser}
            title="Center on your location"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2196FF" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="12" cy="12" r="3" /><path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
            </svg>
          </div>
        </div>
      )}

      {!loaded && (
        <View style={mapStyles.loading}>
          <div style={{ color: Colors.primary, fontSize: 14, fontFamily: 'sans-serif' }}>Loading map...</div>
        </View>
      )}
    </View>
  );
}

const mapStyles = StyleSheet.create({
  container: { flex: 1, overflow: 'hidden' },
  loading: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center', alignItems: 'center', backgroundColor: '#0d1117',
  },
});
