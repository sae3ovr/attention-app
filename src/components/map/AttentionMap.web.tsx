import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import type { AttentionMapProps, MapMarker } from './types';
import { DEFAULT_REGION } from './types';
import { Colors } from '../../theme/colors';
import { getCategoryMeta } from '../../constants/categories';
import { timeAgo } from '../../services/mockData';
import { WORLD_CAPITALS } from '../../data/worldCapitals';
import { WORLD_POIS, POI_META } from '../../data/worldPOIs';
import { MOCK_USER_PROFILES, type UserProfileCard } from '../../services/mockData';

declare const maplibregl: any;

type MapStyleKey = 'dark' | 'streets' | 'positron' | 'liberty';

const MAP_STYLES: Record<MapStyleKey, { label: string; icon: string; desc: string; previewBg: string; url: string }> = {
  dark:     { label: 'Escuro',    icon: '🌙', desc: 'Modo escuro · Visão noturna',    previewBg: 'linear-gradient(135deg, #0d1117 0%, #1a1a2e 50%, #0d1117 100%)', url: 'https://tiles.openfreemap.org/styles/dark' },
  streets:  { label: 'Ruas',     icon: '🗺️', desc: 'Ruas · Pontos · Trânsito',     previewBg: 'linear-gradient(135deg, #e8f5e9 0%, #fff9c4 50%, #e3f2fd 100%)', url: 'https://tiles.openfreemap.org/styles/bright' },
  positron: { label: 'Positron', icon: '⚡', desc: 'Claro · Limpo · Minimalista',   previewBg: 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 50%, #f5f5f5 100%)', url: 'https://tiles.openfreemap.org/styles/positron' },
  liberty:  { label: 'Liberty',  icon: '🌐', desc: 'Colorido · Detalhado · Clássico', previewBg: 'linear-gradient(135deg, #d7ccc8 0%, #a1887f 50%, #bcaaa4 100%)', url: 'https://tiles.openfreemap.org/styles/liberty' },
};

const MAP_STYLE_KEYS: MapStyleKey[] = ['dark', 'streets', 'positron', 'liberty'];

const EMOJI_MAP: Record<string, string> = {
  'shield-alert': '🚨', 'car-crash': '💥', 'eye-outline': '👁', 'fire': '🔥',
  'police-badge': '🚔', 'medical-bag': '🏥', 'traffic-light': '🚦',
  'volume-high': '📢', 'alert-outline': '⚠️', 'alert-octagon': '⚠️',
  'dots-horizontal-circle': '🔵', 'waves': '🌊', 'paw': '🐾',
  'office-building-cog': '🏚️',
};

function loadMapLibre(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof maplibregl !== 'undefined') { resolve(); return; }

    const existing = document.querySelector('script[src*="maplibre-gl"]') as HTMLScriptElement | null;
    if (existing) {
      if (typeof maplibregl !== 'undefined') { resolve(); return; }
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Failed to load MapLibre GL')));
      const timeout = setTimeout(() => {
        if (typeof maplibregl !== 'undefined') resolve();
        else reject(new Error('MapLibre GL script load timed out'));
      }, 15000);
      existing.addEventListener('load', () => clearTimeout(timeout));
      return;
    }

    if (!document.querySelector('link[href*="maplibre-gl"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css';
      document.head.appendChild(link);
    }

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js';
    script.async = true;
    script.onload = () => {
      if (typeof maplibregl !== 'undefined') resolve();
      else reject(new Error('MapLibre GL loaded but not available'));
    };
    script.onerror = () => reject(new Error('Failed to load MapLibre GL'));
    document.head.appendChild(script);
  });
}

function injectMapStyles() {
  if (document.getElementById('attention-map-styles')) return;
  const style = document.createElement('style');
  style.id = 'attention-map-styles';
  style.textContent = `
    @keyframes marker-pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.1); } }
    @keyframes user-glow-pulse { 0%,100% { transform: scale(1); opacity:0.5; } 50% { transform: scale(1.6); opacity:0; } }
    @keyframes scan-pulse { 0% { transform: scale(0.3); opacity:0.5; } 100% { transform: scale(1); opacity:0; } }
    .attn-marker { cursor: pointer; transition: transform 0.25s cubic-bezier(.25,.8,.25,1), opacity 0.2s ease, visibility 0.15s ease, filter 0.25s ease; transform-origin: center center; overflow: visible; }
    .attn-marker:hover { transform: scale(1.25) !important; z-index: 500 !important; filter: brightness(1.3) drop-shadow(0 0 8px rgba(255,255,255,0.3)) !important; }
    .attn-marker.selected { animation: marker-pulse 1.5s ease-in-out infinite; z-index: 90 !important; }
    .hover-popup .maplibregl-popup-content { min-width: 180px !important; background: rgba(12,12,24,0.97) !important; border: 1px solid rgba(255,255,255,0.08) !important; pointer-events: none; }
    .hover-popup .maplibregl-popup-tip { border-top-color: rgba(12,12,24,0.97) !important; }
    .hover-popup .maplibregl-popup-close-button { display: none !important; }
    .maplibregl-marker { transform-origin: center center !important; overflow: visible !important; }
    .user-marker-root { z-index: 10000 !important; }
    .user-glow-ring { animation: user-glow-pulse 2.5s ease-out infinite; }
    .scan-pulse-ring { animation: scan-pulse 2s ease-out infinite; }

    .maplibregl-popup-content {
      background: rgba(20,20,32,0.95) !important; border-radius: 14px !important;
      padding: 0 !important; border: 1px solid rgba(255,255,255,0.08) !important;
      box-shadow: 0 8px 32px rgba(0,0,0,0.5) !important; min-width: 250px;
    }
    .maplibregl-popup-tip { border-top-color: rgba(20,20,32,0.95) !important; }
    .maplibregl-popup-close-button {
      color: #8A8A9A !important; font-size: 20px !important; padding: 4px 8px !important;
      right: 4px !important; top: 4px !important;
    }
    .maplibregl-popup-close-button:hover { color: #fff !important; background: transparent !important; }

    .map-ctrl-btn {
      width: 36px; height: 36px; border-radius: 8px; border: 1px solid rgba(0,0,0,0.15);
      display: flex; align-items: center; justify-content: center; cursor: pointer;
      transition: all 0.2s ease; box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    }
    .map-ctrl-btn:hover { border-color: rgba(0,170,255,0.4); }
    .map-ctrl-btn.active { border-color: ${Colors.primary}; background: ${Colors.primary}20 !important; }
    .capital-marker:hover { transform: scale(1.3); z-index: 50 !important; }
    .capital-marker:hover div:last-child { max-width: 120px !important; font-size: 8px !important; color: rgba(255,255,255,0.95) !important; }

    .incident-popup { padding: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .incident-popup h3 { margin: 0 0 6px; font-size: 14px; font-weight: 600; color: #fff; line-height: 1.3; }
    .incident-popup .meta { display:flex; align-items:center; gap:6px; margin-bottom:8px; font-size:11px; color:#8A8A9A; flex-wrap:wrap; }
    .incident-popup .stats { display:flex; gap:14px; font-size:12px; }
    .incident-popup .stat { display:flex; align-items:center; gap:3px; }

    .user-profile-card {
      position: absolute; bottom: 100%; left: 50%; transform: translateX(-50%);
      width: 260px; background: rgba(16,16,28,0.97); backdrop-filter: blur(24px);
      border: 1px solid rgba(255,255,255,0.1); border-radius: 16px;
      box-shadow: 0 12px 40px rgba(0,0,0,0.65), 0 0 20px rgba(0,170,255,0.08);
      padding: 0; margin-bottom: 8px; opacity: 0; pointer-events: none;
      transition: opacity 0.2s ease, transform 0.2s ease;
      transform: translateX(-50%) translateY(8px) scale(0.95); z-index: 9999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
    .user-profile-card.visible {
      opacity: 1; pointer-events: auto; transform: translateX(-50%) translateY(0) scale(1);
    }
    .user-profile-card::before {
      content: ''; position: absolute; bottom: -14px; left: 0; right: 0; height: 14px;
    }
    .user-profile-card::after {
      content: ''; position: absolute; bottom: -6px; left: 50%;
      width: 12px; height: 12px; background: rgba(16,16,28,0.97);
      border-right: 1px solid rgba(255,255,255,0.1); border-bottom: 1px solid rgba(255,255,255,0.1);
      transform: translateX(-50%) rotate(45deg);
    }
    .upc-header { padding: 14px 14px 10px; display: flex; gap: 10px; align-items: center; }
    .upc-avatar {
      width: 44px; height: 44px; border-radius: 50%; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      font-size: 20px; font-weight: 700; color: #fff;
      box-shadow: 0 0 12px var(--badge-glow, rgba(0,170,255,0.4));
    }
    .upc-info { flex: 1; min-width: 0; }
    .upc-name { color: #fff; font-size: 14px; font-weight: 700; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .upc-badge { display: inline-flex; align-items: center; gap: 3px; font-size: 10px; font-weight: 600; margin-top: 2px; padding: 1px 6px; border-radius: 6px; }
    .upc-fame { color: rgba(255,255,255,0.45); font-size: 10px; margin-top: 2px; font-style: italic; }
    .upc-stats { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0; border-top: 1px solid rgba(255,255,255,0.06); }
    .upc-stat { padding: 8px 6px; text-align: center; }
    .upc-stat:not(:last-child) { border-right: 1px solid rgba(255,255,255,0.06); }
    .upc-stat-val { color: #fff; font-size: 14px; font-weight: 800; }
    .upc-stat-label { color: rgba(255,255,255,0.4); font-size: 8px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 1px; }
    .upc-footer { padding: 8px 14px 10px; border-top: 1px solid rgba(255,255,255,0.06); display: flex; justify-content: space-between; align-items: center; }
    .upc-meta { color: rgba(255,255,255,0.35); font-size: 9px; }
    .upc-online { display: flex; align-items: center; gap: 4px; font-size: 9px; font-weight: 600; }
    .upc-online-dot { width: 6px; height: 6px; border-radius: 50%; }

    .maplibregl-ctrl-logo { display: none !important; }
    .maplibregl-ctrl-attrib { font-size: 9px !important; opacity: 0.5; }

    @keyframes cam-pulse { 0%,100% { box-shadow: 0 0 6px rgba(0,170,255,0.3); } 50% { box-shadow: 0 0 14px rgba(0,170,255,0.7); } }
    .pub-cam-marker {
      width: 28px; height: 28px; border-radius: 50%; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      background: rgba(0,170,255,0.15); border: 1.5px solid rgba(0,170,255,0.6);
      backdrop-filter: blur(4px); animation: cam-pulse 3s ease-in-out infinite;
      transition: transform 0.2s ease; transform-origin: center center;
      font-size: 14px; line-height: 1;
    }
    .pub-cam-marker:hover { transform: scale(1.3); z-index: 500 !important; border-color: rgba(0,170,255,1); filter: brightness(1.3) drop-shadow(0 0 8px rgba(0,170,255,0.5)); }
    .cam-popup { padding: 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .cam-popup h4 { margin: 0 0 6px; font-size: 13px; font-weight: 600; color: #fff; }
    .cam-popup .cam-meta { font-size: 10px; color: #8A8A9A; margin-bottom: 8px; }
    .cam-popup .cam-type-badge {
      display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 9px;
      font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-right: 4px;
    }
    .cam-popup .cam-view-btn {
      display: block; width: 100%; padding: 8px; border: none; border-radius: 8px;
      background: rgba(0,170,255,0.2); color: #00AAFF; font-size: 12px; font-weight: 700;
      cursor: pointer; text-align: center; transition: background 0.2s ease;
    }
    .cam-popup .cam-view-btn:hover { background: rgba(0,170,255,0.35); }
  `;
  document.head.appendChild(style);
}

function circlePolygon(center: [number, number], radiusMeters: number, steps = 64): [number, number][] {
  const km = radiusMeters / 1000;
  const coords: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * 2 * Math.PI;
    const dy = km * Math.cos(angle);
    const dx = km * Math.sin(angle);
    const lat = center[1] + dy / 110.574;
    const lng = center[0] + dx / (111.32 * Math.cos((center[1] * Math.PI) / 180));
    coords.push([lng, lat]);
  }
  return coords;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function createPopupHTML(marker: MapMarker): string {
  const inc = marker.incident;
  const catMeta = getCategoryMeta(inc.category);
  const catColor = Colors.category[inc.category];
  const sevColor = Colors.severity[inc.severity];
  const safeTitle = escapeHtml(inc.title);
  const safeDesc = escapeHtml(inc.description.length > 120 ? inc.description.slice(0, 120) + '...' : inc.description);
  const safeName = escapeHtml(inc.reporterName);
  return `
    <div class="incident-popup">
      <div class="meta">
        <span style="display:inline-flex;align-items:center;gap:3px;padding:2px 7px;border-radius:20px;
          background:${catColor}20;color:${catColor};font-weight:600;font-size:10px;text-transform:uppercase;">
          ${escapeHtml(catMeta.label)}
        </span>
        <span style="width:7px;height:7px;border-radius:50%;background:${sevColor};box-shadow:0 0 5px ${sevColor};display:inline-block;"></span>
        <span>${escapeHtml(timeAgo(inc.createdAt))}</span>
        ${inc.isVerified ? `<span style="color:${Colors.success};font-size:10px;font-weight:800;letter-spacing:0.5px;text-transform:uppercase;text-shadow:0 0 8px ${Colors.success},0 0 16px ${Colors.success}60;">Verificado</span>` : ''}
        ${inc.isFakeReport ? `<span style="color:${Colors.error};font-size:10px;font-weight:800;letter-spacing:0.5px;text-transform:uppercase;text-shadow:0 0 8px ${Colors.error},0 0 16px ${Colors.error}60;">Falso</span>` : ''}
      </div>
      <h3>${safeTitle}</h3>
      <p style="margin:0 0 10px;font-size:12px;color:#8A8A9A;line-height:1.4;">
        ${safeDesc}
      </p>
      <div class="stats">
        <div class="stat" style="color:${Colors.success}">👍 ${inc.confirmCount}/10</div>
        <div class="stat" style="color:${Colors.error}">👎 ${inc.denyCount}/10</div>
        <div class="stat" style="color:#8A8A9A">👁 ${inc.views}</div>
        <div class="stat" style="color:#8A8A9A">💬 ${inc.commentCount}</div>
      </div>
      <div style="margin-top:8px;font-size:10px;color:#5A5A6A;">por ${safeName} • Nível ${inc.reporterLevel}</div>
    </div>`;
}

function createHoverHTML(marker: MapMarker): string {
  const inc = marker.incident;
  const catMeta = getCategoryMeta(inc.category);
  const catColor = Colors.category[inc.category] || '#8A8A9A';
  const sevColor = Colors.severity[inc.severity] || '#FFB800';
  const emoji = EMOJI_MAP[catMeta.icon] || '⚠️';
  const safeTitle = escapeHtml(inc.title.length > 60 ? inc.title.slice(0, 60) + '…' : inc.title);
  return `<div style="padding:10px 12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:rgba(12,12,24,0.96);border-radius:10px;border:1px solid ${catColor}30;max-width:240px;">
    <div style="display:flex;align-items:center;gap:6px;margin-bottom:5px;">
      <span style="font-size:16px">${emoji}</span>
      <span style="display:inline-block;padding:1px 6px;border-radius:4px;font-size:8px;font-weight:800;letter-spacing:.5px;text-transform:uppercase;background:${catColor}18;color:${catColor};border:1px solid ${catColor}30">${escapeHtml(catMeta.label)}</span>
      <span style="width:6px;height:6px;border-radius:50%;background:${sevColor};box-shadow:0 0 4px ${sevColor};flex-shrink:0"></span>
      ${inc.isVerified ? `<span style="font-size:8px;font-weight:800;color:${Colors.success}">✓</span>` : ''}
      <span style="font-size:9px;color:#666;margin-left:auto">${escapeHtml(timeAgo(inc.createdAt))}</span>
    </div>
    <div style="font-size:11px;font-weight:600;color:#E6EDF3;line-height:1.3;margin-bottom:4px">${safeTitle}</div>
    <div style="display:flex;gap:8px;font-size:9px;color:#555">
      <span>👍 ${inc.confirmCount}</span><span>👎 ${inc.denyCount}</span><span>👁 ${inc.views}</span>
    </div>
  </div>`;
}

function createMarkerEl(marker: MapMarker, isSelected: boolean): HTMLDivElement {
  const catColor = Colors.category[marker.incident.category] || '#8A8A9A';
  const sevColor = Colors.severity[marker.incident.severity] || '#FFB800';
  const catMeta = getCategoryMeta(marker.incident.category);
  const emoji = EMOJI_MAP[catMeta.icon] || '⚠️';

  const size = isSelected ? 52 : 42;
  const el = document.createElement('div');
  el.className = `attn-marker${isSelected ? ' selected' : ''}`;
  el.style.cssText = `width:${size}px;height:${size + 14}px;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;`;

  const isFake = marker.incident.isFakeReport;
  const verified = marker.incident.isVerified;
  const borderW = isSelected ? 2.5 : 2;
  const emojiSize = isSelected ? 22 : 18;

  const statusBadge = verified
    ? `<div style="position:absolute;bottom:-2px;right:-2px;width:14px;height:14px;border-radius:50%;
        background:#0d1117;display:flex;align-items:center;justify-content:center;border:1.5px solid ${Colors.success};">
        <span style="font-size:8px;line-height:1;color:${Colors.success};">✓</span></div>`
    : isFake
      ? `<div style="position:absolute;bottom:-2px;right:-2px;width:14px;height:14px;border-radius:50%;
          background:#0d1117;display:flex;align-items:center;justify-content:center;border:1.5px solid ${Colors.error};">
          <span style="font-size:8px;line-height:1;color:${Colors.error};">✗</span></div>`
      : '';

  el.innerHTML = `
    <div style="width:${size}px;height:${size}px;position:relative;flex-shrink:0;">
      <div style="position:absolute;inset:3px;border-radius:50%;background:${catColor}12;border:${borderW}px solid ${catColor}${isSelected ? '' : '90'};
        display:flex;align-items:center;justify-content:center;
        box-shadow:0 0 ${isSelected ? 24 : 12}px ${catColor}${isSelected ? '90' : '50'},0 2px 8px rgba(0,0,0,0.4);
        transition:all 0.2s ease;">
        <span style="font-size:${emojiSize}px;line-height:1;filter:drop-shadow(0 1px 2px rgba(0,0,0,0.5));">${emoji}</span>
      </div>
      <div style="position:absolute;top:1px;right:1px;width:10px;height:10px;background:${sevColor};
        border-radius:50%;border:1.5px solid #0d1117;box-shadow:0 0 6px ${sevColor};"></div>
      ${statusBadge}
    </div>
    <div style="margin-top:1px;font-size:8px;font-weight:700;color:${catColor};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
      text-shadow:0 1px 4px rgba(0,0,0,0.9),0 0 8px rgba(0,0,0,0.7);letter-spacing:0.3px;white-space:nowrap;
      max-width:60px;overflow:hidden;text-overflow:ellipsis;text-align:center;text-transform:uppercase;">
      ${escapeHtml(catMeta.label)}
    </div>`;

  return el;
}

function createUserEl(): HTMLDivElement {
  const el = document.createElement('div');
  el.className = 'user-marker-root';
  el.style.cssText = 'width:40px;height:40px;position:relative;cursor:pointer;transform-origin:center center;z-index:10000;';

  const inner = document.createElement('div');
  inner.style.cssText = 'width:40px;height:40px;display:flex;align-items:center;justify-content:center;position:relative;';

  const ring = document.createElement('div');
  ring.className = 'user-glow-ring';
  ring.style.cssText = 'position:absolute;top:0;left:0;width:40px;height:40px;border-radius:50%;border:2px solid rgba(33,150,255,0.3);pointer-events:none;';
  inner.appendChild(ring);

  const circle = document.createElement('div');
  circle.style.cssText = 'width:32px;height:32px;border-radius:50%;border:2.5px solid #fff;box-shadow:0 0 16px rgba(33,150,255,0.7),0 2px 8px rgba(0,0,0,0.4);z-index:2;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#2196FF 0%,#1565C0 100%);transition:all 0.2s ease;';

  const personImg = document.createElement('img');
  personImg.src = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>');
  personImg.style.cssText = 'width:18px;height:18px;';
  personImg.alt = 'Você';
  circle.appendChild(personImg);
  inner.appendChild(circle);

  const label = document.createElement('div');
  label.style.cssText = 'position:absolute;bottom:-12px;left:50%;transform:translateX(-50%);font-size:8px;color:#fff;font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-weight:700;text-shadow:0 1px 4px rgba(0,0,0,0.9);letter-spacing:0.5px;z-index:2;white-space:nowrap;';
  label.textContent = 'Você';
  inner.appendChild(label);

  el.appendChild(inner);

  const myProfile = MOCK_USER_PROFILES['mock-user-001'];
  if (myProfile) {
    const card = document.createElement('div');
    card.className = 'user-profile-card';
    card.innerHTML = buildProfileCardHTML(myProfile);
    el.appendChild(card);

    let hideTimeout: ReturnType<typeof setTimeout> | null = null;
    el.addEventListener('mouseenter', () => {
      if (hideTimeout) { clearTimeout(hideTimeout); hideTimeout = null; }
      card.classList.add('visible');
      el.style.zIndex = '9999';
      circle.style.transform = 'scale(1.15)';
      circle.style.boxShadow = '0 0 24px rgba(33,150,255,0.9),0 2px 8px rgba(0,0,0,0.4)';
    });
    el.addEventListener('mouseleave', () => {
      hideTimeout = setTimeout(() => {
        card.classList.remove('visible');
        el.style.zIndex = '';
        circle.style.transform = 'scale(1)';
        circle.style.boxShadow = '0 0 16px rgba(33,150,255,0.7),0 2px 8px rgba(0,0,0,0.4)';
      }, 120);
    });
  }

  return el;
}

function createSpeedCamEl(limit: number | null): HTMLDivElement {
  const el = document.createElement('div');
  el.className = 'attn-marker';
  el.style.cssText = 'width:28px;height:28px;display:flex;align-items:center;justify-content:center;';
  el.innerHTML = `
    <div style="width:28px;height:28px;background:rgba(255,60,60,0.15);border:2px solid #FF3C3C;
      border-radius:50%;display:flex;align-items:center;justify-content:center;
      box-shadow:0 0 8px rgba(255,60,60,0.4);position:relative;flex-shrink:0;">
      <span style="font-size:12px;line-height:1;">📷</span>
      ${limit ? `<div style="position:absolute;top:-6px;right:-6px;background:#FF3C3C;color:white;
        font-size:8px;font-weight:700;border-radius:4px;padding:0 3px;font-family:sans-serif;
        box-shadow:0 1px 4px rgba(0,0,0,0.3);line-height:14px;">${limit}</div>` : ''}
    </div>`;
  return el;
}

function formatMemberSince(ts: number): string {
  const days = Math.floor((Date.now() - ts) / 86400000);
  if (days < 1) return 'Hoje';
  if (days < 30) return `${days}d atrás`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} meses`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  return rem > 0 ? `${years}a ${rem}m` : `${years}a`;
}

function formatReputation(rep: number): string {
  if (rep >= 1000000) return `${(rep / 1000000).toFixed(1)}M`;
  if (rep >= 1000) return `${(rep / 1000).toFixed(1)}K`;
  return `${rep}`;
}

function buildProfileCardHTML(profile: UserProfileCard): string {
  const avatarBg = `linear-gradient(135deg, ${profile.badgeColor}40 0%, ${profile.badgeColor}15 100%)`;
  const safeName = escapeHtml(profile.displayName);
  const initial = safeName.charAt(0).toUpperCase();
  const onlineColor = profile.isOnline ? '#34C759' : '#6B7280';
  const onlineLabel = profile.isOnline ? 'Online' : `Ativo ${formatMemberSince(profile.lastActive)}`;
  const safeFame = escapeHtml(profile.fame);
  const safeLevelName = escapeHtml(profile.levelName);

  return `
    <div class="upc-header">
      <div class="upc-avatar" style="background:${avatarBg};border:2px solid ${profile.badgeColor};--badge-glow:${profile.badgeColor}60;">
        ${profile.photoURL ? `<img src="${escapeHtml(profile.photoURL)}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;" />` : initial}
      </div>
      <div class="upc-info">
        <div class="upc-name">${safeName} ${profile.isGuardian ? '🛡️' : ''}</div>
        <div class="upc-badge" style="background:${profile.badgeColor}18;color:${profile.badgeColor};">
          ${escapeHtml(profile.levelIcon)} Nv ${profile.level} · ${safeLevelName}
        </div>
        <div class="upc-fame">"${safeFame}"</div>
      </div>
    </div>
    <div class="upc-stats">
      <div class="upc-stat">
        <div class="upc-stat-val" style="color:${profile.badgeColor};">${formatReputation(profile.reputation)}</div>
        <div class="upc-stat-label">Reputação</div>
      </div>
      <div class="upc-stat">
        <div class="upc-stat-val">${profile.totalReports}</div>
        <div class="upc-stat-label">Relatos</div>
      </div>
      <div class="upc-stat">
        <div class="upc-stat-val">${profile.totalConfirmations}</div>
        <div class="upc-stat-label">Confirmações</div>
      </div>
    </div>
    <div class="upc-footer">
      <span class="upc-meta">Membro há ${formatMemberSince(profile.memberSince)}${profile.verifiedIncidents > 0 ? ` · ${profile.verifiedIncidents} verificados` : ''}</span>
      <span class="upc-online">
        <span class="upc-online-dot" style="background:${onlineColor};box-shadow:0 0 4px ${onlineColor};"></span>
        <span style="color:${onlineColor};">${onlineLabel}</span>
      </span>
    </div>
  `;
}

function createFamilyEl(uid: string, name: string, role: string, isOnline: boolean): HTMLDivElement {
  const color = role === 'kid' ? Colors.warning : role === 'admin' ? Colors.primary : Colors.secondary;
  const initial = name.charAt(0).toUpperCase();
  const el = document.createElement('div');
  el.style.cssText = `width:36px;height:46px;position:relative;cursor:pointer;opacity:${isOnline ? 1 : 0.4};`;

  const inner = document.createElement('div');
  inner.style.cssText = 'width:36px;height:46px;display:flex;flex-direction:column;align-items:center;';
  inner.innerHTML = `
    <div style="width:30px;height:30px;background:${color}30;border:2px solid ${color};border-radius:50%;
      display:flex;align-items:center;justify-content:center;box-shadow:0 0 8px ${color}60;
      font-size:13px;font-weight:700;color:${color};font-family:sans-serif;transition:all 0.2s ease;">${initial}</div>
    <div style="margin-top:2px;font-size:8px;color:${color};font-family:sans-serif;font-weight:600;
      text-shadow:0 0 4px #000,0 1px 2px #000;white-space:nowrap;">${name.split(' ')[0]}</div>
    ${isOnline ? `<div style="position:absolute;top:-2px;right:-2px;width:7px;height:7px;
      background:${Colors.success};border-radius:50%;border:1.5px solid #0d1117;box-shadow:0 0 4px ${Colors.success};"></div>` : ''}`;
  el.appendChild(inner);

  const profile = MOCK_USER_PROFILES[uid];
  if (profile) {
    const card = document.createElement('div');
    card.className = 'user-profile-card';
    card.innerHTML = buildProfileCardHTML(profile);
    el.appendChild(card);

    let hideTimeout: ReturnType<typeof setTimeout> | null = null;
    el.addEventListener('mouseenter', () => {
      if (hideTimeout) { clearTimeout(hideTimeout); hideTimeout = null; }
      card.classList.add('visible');
      el.style.zIndex = '9999';
      const circleEl = inner.querySelector('div:first-child') as HTMLElement;
      if (circleEl) { circleEl.style.transform = 'scale(1.2)'; circleEl.style.boxShadow = `0 0 16px ${color}`; }
    });
    el.addEventListener('mouseleave', () => {
      hideTimeout = setTimeout(() => {
        card.classList.remove('visible');
        el.style.zIndex = '';
        const circleEl = inner.querySelector('div:first-child') as HTMLElement;
        if (circleEl) { circleEl.style.transform = 'scale(1)'; circleEl.style.boxShadow = `0 0 8px ${color}60`; }
      }, 120);
    });
  }

  return el;
}

function createPOIEl(emoji: string, name: string, color: string): HTMLDivElement {
  const el = document.createElement('div');
  el.className = 'attn-marker';
  el.style.cssText = 'width:26px;height:26px;display:flex;align-items:center;justify-content:center;';
  const inner = document.createElement('div');
  inner.style.cssText = 'width:26px;height:26px;display:flex;align-items:center;justify-content:center;';
  inner.innerHTML = `
    <div style="width:24px;height:24px;border-radius:50%;background:${color}18;border:1.5px solid ${color}50;
      display:flex;align-items:center;justify-content:center;font-size:13px;line-height:1;
      box-shadow:0 2px 6px rgba(0,0,0,0.3);transition:all 0.2s ease;">${emoji}</div>`;

  const tooltip = document.createElement('div');
  tooltip.style.cssText = 'position:absolute;top:100%;left:50%;transform:translateX(-50%);margin-top:2px;font-size:7px;color:rgba(255,255,255,0.6);font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-weight:600;text-shadow:0 1px 3px rgba(0,0,0,0.9);white-space:nowrap;max-width:70px;overflow:hidden;text-overflow:ellipsis;text-align:center;opacity:0;transition:opacity 0.2s ease;pointer-events:none;';
  tooltip.textContent = name;
  el.appendChild(inner);
  el.appendChild(tooltip);

  el.addEventListener('mouseenter', () => {
    tooltip.style.opacity = '1';
    const icon = inner.querySelector('div:first-child') as HTMLElement;
    if (icon) { icon.style.transform = 'scale(1.25)'; icon.style.boxShadow = `0 0 12px ${color}60`; }
  });
  el.addEventListener('mouseleave', () => {
    tooltip.style.opacity = '0';
    const icon = inner.querySelector('div:first-child') as HTMLElement;
    if (icon) { icon.style.transform = 'scale(1)'; icon.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)'; }
  });
  return el;
}

function createCapitalEl(flag: string, city: string): HTMLDivElement {
  const el = document.createElement('div');
  el.className = 'capital-marker';
  el.style.cssText = 'width:22px;height:22px;display:flex;align-items:center;justify-content:center;';

  const icon = document.createElement('div');
  icon.style.cssText = 'width:20px;height:20px;border-radius:50%;background:rgba(20,20,32,0.85);border:1.5px solid rgba(255,255,255,0.15);display:flex;align-items:center;justify-content:center;font-size:11px;line-height:1;box-shadow:0 2px 6px rgba(0,0,0,0.4);flex-shrink:0;';
  icon.textContent = flag;
  el.appendChild(icon);

  const labelEl = document.createElement('div');
  labelEl.style.cssText = 'position:absolute;top:100%;left:50%;transform:translateX(-50%);margin-top:1px;font-size:7px;color:rgba(255,255,255,0.7);font-family:-apple-system,BlinkMacSystemFont,sans-serif;font-weight:600;text-shadow:0 1px 3px rgba(0,0,0,0.9);white-space:nowrap;max-width:60px;overflow:hidden;text-overflow:ellipsis;text-align:center;pointer-events:none;';
  labelEl.textContent = city;
  el.appendChild(labelEl);

  return el;
}

export function AttentionMap({
  markers, userLocation, familyMembers, onMarkerPress, onMapPress, onMapReady,
  selectedMarkerId, highlightedMarkerId, guardScan, lightTheme, navigation, driveMode, speedCameras,
  initialRegion, focusLocation, cameras, onCameraPress, showCameras, onToggleCameras,
}: AttentionMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const glMap = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const popupRef = useRef<any>(null);
  const hoverPopupRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const familyMarkersRef = useRef<any[]>([]);
  const poiMarkersRef = useRef<any[]>([]);
  const camMarkersRef = useRef<any[]>([]);
  const capitalMarkersRef = useRef<any[]>([]);
  const publicCamMarkersRef = useRef<any[]>([]);
  const destMarkerRef = useRef<any>(null);
  const userLocationRef = useRef(userLocation);
  const guardScanRef = useRef(guardScan);
  const navigationRef = useRef(navigation);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [is3D, setIs3D] = useState(false);
  const is3DRef = useRef(false);
  const [mapStyle, setMapStyle] = useState<MapStyleKey>('dark');
  const [showStylePicker, setShowStylePicker] = useState(false);
  const isLightStyle = mapStyle === 'streets' || mapStyle === 'positron';

  useEffect(() => { userLocationRef.current = userLocation; }, [userLocation]);
  useEffect(() => { guardScanRef.current = guardScan; }, [guardScan]);
  useEffect(() => { navigationRef.current = navigation; }, [navigation]);

  useEffect(() => {
    injectMapStyles();
    loadMapLibre()
      .then(() => setLoaded(true))
      .catch((err) => setLoadError(err?.message || 'Failed to load map'));
  }, []);

  function ensureBuilding3D(map: any) {
    if (!is3DRef.current) return;
    if (map.getLayer('building-3d')) return;

    try {
      const isDark = map.getStyle()?.layers?.some((l: any) => l.id === 'background' && l.paint?.['background-color']?.includes?.('#'));
      const bg = isDark ? '#1a1a2e' : 'hsl(35,8%,85%)';
      const edgeColor = isDark ? '#252540' : 'hsl(35,6%,78%)';
      map.addLayer({
        id: 'building-3d',
        type: 'fill-extrusion',
        source: 'openmaptiles',
        'source-layer': 'building',
        minzoom: 13,
        paint: {
          'fill-extrusion-base': ['get', 'render_min_height'],
          'fill-extrusion-color': [
            'interpolate', ['linear'], ['get', 'render_height'],
            0, bg,
            50, isDark ? '#22223a' : 'hsl(35,8%,82%)',
            150, isDark ? '#2a2a48' : 'hsl(35,8%,78%)',
          ],
          'fill-extrusion-height': ['get', 'render_height'],
          'fill-extrusion-opacity': [
            'interpolate', ['linear'], ['zoom'],
            13, 0.3,
            15, 0.75,
            18, 0.85,
          ],
          'fill-extrusion-vertical-gradient': true,
        },
      });

      if (!map.getLayer('building-3d-edge')) {
        map.addLayer({
          id: 'building-3d-edge',
          type: 'fill-extrusion',
          source: 'openmaptiles',
          'source-layer': 'building',
          minzoom: 15,
          paint: {
            'fill-extrusion-base': ['get', 'render_min_height'],
            'fill-extrusion-color': edgeColor,
            'fill-extrusion-height': ['+', ['get', 'render_height'], 0.3],
            'fill-extrusion-opacity': 0.15,
          },
        });
      }
    } catch (_) { /* source not available yet */ }
  }

  function removeBuilding3DIfCustom(map: any) {
    try { if (map.getLayer('building-3d-edge')) map.removeLayer('building-3d-edge'); } catch (_) {}
    try { if (map.getLayer('building-3d')) map.removeLayer('building-3d'); } catch (_) {}
  }

  function addCustomLayers(map: any) {
    if (is3DRef.current) ensureBuilding3D(map);

    const gs = guardScanRef.current;
    if (gs?.active) {
      const coords = circlePolygon([gs.center.longitude, gs.center.latitude], gs.radiusMeters);
      if (!map.getSource('guard-scan')) {
        map.addSource('guard-scan', {
          type: 'geojson',
          data: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [coords] }, properties: {} },
        });
        map.addLayer({ id: 'guard-scan-fill', type: 'fill', source: 'guard-scan', paint: { 'fill-color': Colors.primary, 'fill-opacity': gs.scanning ? 0.1 : 0.04 } });
        map.addLayer({ id: 'guard-scan-line', type: 'line', source: 'guard-scan', paint: { 'line-color': Colors.primary, 'line-width': 2, 'line-opacity': 0.6 } });
      }
    }

    const nav = navigationRef.current;
    if (nav) {
      if (!map.getSource('nav-route')) {
        map.addSource('nav-route', {
          type: 'geojson',
          data: { type: 'Feature', geometry: { type: 'LineString', coordinates: nav.coordinates }, properties: {} },
        });
        map.addLayer({ id: 'nav-route-outline', type: 'line', source: 'nav-route', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#00AAFF', 'line-width': 8, 'line-opacity': 0.25 } });
        map.addLayer({ id: 'nav-route-line', type: 'line', source: 'nav-route', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#00AAFF', 'line-width': 4, 'line-opacity': 0.9 } });
      }
    }
  }

  // Initialize map
  useEffect(() => {
    if (!loaded || !mapRef.current || glMap.current) return;
    const region = initialRegion || DEFAULT_REGION;

    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    const map = new maplibregl.Map({
      container: mapRef.current,
      style: MAP_STYLES[mapStyle].url,
      center: [region.longitude, region.latitude],
      zoom: 15.5,
      minZoom: 0,
      pitch: 0,
      bearing: 0,
      attributionControl: true,
      maxPitch: 85,
      projection: { type: 'globe' },
      pixelRatio: dpr,
      antialias: true,
    });

    is3DRef.current = false;
    setIs3D(false);

    map.on('click', () => {
      onMapPress?.();
      setShowStylePicker(false);
    });

    map.on('load', () => {
      onMapReady?.();
      addCustomLayers(map);
    });

    map.on('style.load', () => {
      addCustomLayers(map);
    });

    map.on('error', (e: any) => {
      if (e?.error?.status === 0 || e?.error?.message?.includes('Failed to fetch')) {
        console.warn('[AttentionMap] Tile/network error — possible offline or slow connection:', e.error?.message);
      }
    });

    glMap.current = map;

    return () => {
      map.remove();
      glMap.current = null;
    };
  }, [loaded]);

  // Style changes
  useEffect(() => {
    const map = glMap.current;
    if (!map) return;
    map.setStyle(MAP_STYLES[mapStyle].url);
  }, [mapStyle]);

  const toggle3D = useCallback(() => {
    const map = glMap.current;
    if (!map) return;
    const new3D = !is3D;
    setIs3D(new3D);
    is3DRef.current = new3D;

    if (new3D) {
      ensureBuilding3D(map);
      map.easeTo({ pitch: 60, bearing: -17, duration: 600 });
    } else {
      removeBuilding3DIfCustom(map);
      map.easeTo({ pitch: 0, bearing: 0, duration: 600 });
    }
  }, [is3D]);

  const centerOnUser = useCallback(() => {
    const map = glMap.current;
    const loc = userLocationRef.current;
    if (map && loc) {
      map.flyTo({ center: [loc.longitude, loc.latitude], zoom: 16, duration: 800 });
    }
  }, []);

  // Focus on a specific location (e.g. from chain member navigation)
  useEffect(() => {
    const map = glMap.current;
    if (!map || !focusLocation) return;
    map.flyTo({
      center: [focusLocation.longitude, focusLocation.latitude],
      zoom: focusLocation.zoom ?? 16,
      duration: 1200,
      essential: true,
    });
  }, [focusLocation]);

  // Incident markers
  useEffect(() => {
    const map = glMap.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    if (popupRef.current) { popupRef.current.remove(); popupRef.current = null; }
    if (hoverPopupRef.current) { hoverPopupRef.current.remove(); hoverPopupRef.current = null; }

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
        }
      }

      const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat([m.coordinate.longitude, m.coordinate.latitude])
        .addTo(map);

      el.addEventListener('mouseenter', () => {
        if (hoverPopupRef.current) { hoverPopupRef.current.remove(); hoverPopupRef.current = null; }
        const hp = new maplibregl.Popup({ offset: 20, closeButton: false, closeOnClick: false, maxWidth: '260px', className: 'hover-popup' })
          .setLngLat([m.coordinate.longitude, m.coordinate.latitude])
          .setHTML(createHoverHTML(m))
          .addTo(map);
        hoverPopupRef.current = hp;
      });

      el.addEventListener('mouseleave', () => {
        if (hoverPopupRef.current) { hoverPopupRef.current.remove(); hoverPopupRef.current = null; }
      });

      el.addEventListener('click', (e: MouseEvent) => {
        e.stopPropagation();
        if (hoverPopupRef.current) { hoverPopupRef.current.remove(); hoverPopupRef.current = null; }
        onMarkerPress(m);

        if (popupRef.current) popupRef.current.remove();
        const popup = new maplibregl.Popup({ offset: 25, maxWidth: '320px', closeOnClick: true })
          .setHTML(createPopupHTML(m))
          .setLngLat([m.coordinate.longitude, m.coordinate.latitude])
          .addTo(map);
        popupRef.current = popup;
      });

      if (isSelected) {
        const popup = new maplibregl.Popup({ offset: 25, maxWidth: '320px', closeOnClick: true })
          .setHTML(createPopupHTML(m))
          .setLngLat([m.coordinate.longitude, m.coordinate.latitude])
          .addTo(map);
        popupRef.current = popup;
      }

      (marker as any)._incidentId = m.id;
      markersRef.current.push(marker);
    });

    declutterIncidentMarkers();
  }, [markers, selectedMarkerId, driveMode]);

  // Highlight marker on hover from sidebar nearby list
  useEffect(() => {
    markersRef.current.forEach((m: any) => {
      const el = m.getElement();
      if (!el) return;
      const id = m._incidentId;
      if (id === highlightedMarkerId) {
        el.style.filter = 'brightness(1.6) drop-shadow(0 0 12px rgba(0,255,136,0.8))';
        el.style.zIndex = '300';
        el.style.transform = 'scale(1.35)';
      } else {
        el.style.filter = '';
        el.style.transform = '';
        if (!el.classList.contains('selected')) {
          el.style.zIndex = '100';
        }
      }
    });
  }, [highlightedMarkerId]);

  // User location — always rendered last so it's on top of everything
  useEffect(() => {
    const map = glMap.current;
    if (!map || !userLocation) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.setLngLat([userLocation.longitude, userLocation.latitude]);
      const el = userMarkerRef.current.getElement();
      if (el) el.style.zIndex = '10000';
    } else {
      const el = createUserEl();
      el.style.zIndex = '10000';
      userMarkerRef.current = new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat([userLocation.longitude, userLocation.latitude])
        .addTo(map);
    }
  }, [userLocation, loaded]);

  // Family markers
  useEffect(() => {
    const map = glMap.current;
    if (!map) return;

    familyMarkersRef.current.forEach((m) => m.remove());
    familyMarkersRef.current = [];

    if (!familyMembers) return;
    familyMembers.forEach((m) => {
      if (!m.location || m.uid === 'mock-user-001') return;
      const el = createFamilyEl(m.uid, m.displayName, m.role, m.isOnline ?? false);
      const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat([m.location.longitude, m.location.latitude])
        .addTo(map);
      familyMarkersRef.current.push(marker);
    });
  }, [familyMembers, loaded]);

  // POI markers
  function reAddPOIs() {
    const map = glMap.current;
    if (!map) return;
    poiMarkersRef.current.forEach((m) => m.remove());
    poiMarkersRef.current = [];
    WORLD_POIS.forEach((poi) => {
      const meta = POI_META[poi.type];
      const el = createPOIEl(meta.emoji, poi.name, meta.color);
      const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat([poi.lng, poi.lat])
        .addTo(map);
      poiMarkersRef.current.push(marker);
    });
    updatePOIVisibility();
  }

  useEffect(() => {
    if (!glMap.current) return;
    reAddPOIs();
  }, [loaded]);

  // Capital markers
  function addCapitalMarkers() {
    const map = glMap.current;
    if (!map) return;
    capitalMarkersRef.current.forEach((m: any) => m.remove());
    capitalMarkersRef.current = [];

    WORLD_CAPITALS.forEach((cap) => {
      const el = createCapitalEl(cap.flag, cap.city);
      const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat([cap.lng, cap.lat])
        .addTo(map);
      capitalMarkersRef.current.push(marker);
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
      if (el) { el.style.visibility = show ? 'visible' : 'hidden'; el.style.pointerEvents = show ? 'auto' : 'none'; }
    });
  }

  function updatePOIVisibility() {
    const map = glMap.current;
    if (!map) return;
    const zoom = map.getZoom();
    const show = zoom >= 10;
    poiMarkersRef.current.forEach((m: any) => {
      const el = m.getElement();
      if (el) { el.style.visibility = show ? 'visible' : 'hidden'; el.style.pointerEvents = show ? 'auto' : 'none'; }
    });
  }

  function declutterIncidentMarkers() {
    const map = glMap.current;
    if (!map) return;
    const zoom = map.getZoom();
    const canvas = map.getCanvas();
    const w = canvas.width;
    const h = canvas.height;
    const pad = 40;

    const gridSize = zoom >= 15 ? 28 : zoom >= 13 ? 34 : zoom >= 11 ? 42 : zoom >= 8 ? 55 : 75;
    const occupied = new Set<string>();

    const loc = userLocationRef.current;
    if (loc) {
      const userPt = map.project([loc.longitude, loc.latitude]);
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          occupied.add(`${Math.floor(userPt.x / gridSize) + dx},${Math.floor(userPt.y / gridSize) + dy}`);
        }
      }
    }

    markersRef.current.forEach((m: any) => {
      const el = m.getElement();
      if (!el) return;
      const lngLat = m.getLngLat();
      const pt = map.project(lngLat);
      const isSelected = el.classList.contains('selected');

      const outOfView = pt.x < -pad || pt.x > w + pad || pt.y < -pad || pt.y > h + pad;
      if (outOfView && !isSelected) {
        el.style.display = 'none';
        return;
      }

      const cellKey = `${Math.floor(pt.x / gridSize)},${Math.floor(pt.y / gridSize)}`;
      if (!isSelected && occupied.has(cellKey)) {
        el.style.display = 'none';
      } else {
        occupied.add(cellKey);
        el.style.display = 'flex';
        el.style.zIndex = isSelected ? '200' : '100';
      }
    });
  }

  useEffect(() => {
    const map = glMap.current;
    if (!map || !loaded) return;

    addCapitalMarkers();

    const onZoom = () => {
      updateCapitalVisibility();
      updatePOIVisibility();
      declutterIncidentMarkers();
    };
    map.on('zoom', onZoom);
    map.on('move', declutterIncidentMarkers);
    map.on('moveend', declutterIncidentMarkers);
    return () => {
      map.off('zoom', onZoom);
      map.off('move', declutterIncidentMarkers);
      map.off('moveend', declutterIncidentMarkers);
    };
  }, [loaded]);

  // Guard scan circle
  useEffect(() => {
    const map = glMap.current;
    if (!map) return;

    if (!guardScan?.active) {
      if (map.getSource('guard-scan')) {
        if (map.getLayer('guard-scan-fill')) map.removeLayer('guard-scan-fill');
        if (map.getLayer('guard-scan-line')) map.removeLayer('guard-scan-line');
        map.removeSource('guard-scan');
      }
      return;
    }

    const coords = circlePolygon([guardScan.center.longitude, guardScan.center.latitude], guardScan.radiusMeters);
    const data = { type: 'Feature' as const, geometry: { type: 'Polygon' as const, coordinates: [coords] }, properties: {} };

    if (map.getSource('guard-scan')) {
      (map.getSource('guard-scan') as any).setData(data);
      if (map.getLayer('guard-scan-fill')) {
        map.setPaintProperty('guard-scan-fill', 'fill-opacity', guardScan.scanning ? 0.1 : 0.04);
      }
    } else {
      try {
        map.addSource('guard-scan', { type: 'geojson', data });
        map.addLayer({ id: 'guard-scan-fill', type: 'fill', source: 'guard-scan', paint: { 'fill-color': Colors.primary, 'fill-opacity': guardScan.scanning ? 0.1 : 0.04 } });
        map.addLayer({ id: 'guard-scan-line', type: 'line', source: 'guard-scan', paint: { 'line-color': Colors.primary, 'line-width': 2, 'line-opacity': 0.6 } });
      } catch (_) { /* style not loaded yet, will be added on style.load */ }
    }
  }, [guardScan?.active, guardScan?.radiusMeters, guardScan?.scanning, guardScan?.center?.latitude, guardScan?.center?.longitude]);

  // Navigation route
  useEffect(() => {
    const map = glMap.current;
    if (!map) return;

    if (destMarkerRef.current) { destMarkerRef.current.remove(); destMarkerRef.current = null; }

    if (!navigation) {
      if (map.getSource('nav-route')) {
        if (map.getLayer('nav-route-line')) map.removeLayer('nav-route-line');
        if (map.getLayer('nav-route-outline')) map.removeLayer('nav-route-outline');
        map.removeSource('nav-route');
      }
      return;
    }

    const data = { type: 'Feature' as const, geometry: { type: 'LineString' as const, coordinates: navigation.coordinates }, properties: {} };

    if (map.getSource('nav-route')) {
      (map.getSource('nav-route') as any).setData(data);
    } else {
      try {
        map.addSource('nav-route', { type: 'geojson', data });
        map.addLayer({ id: 'nav-route-outline', type: 'line', source: 'nav-route', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#00AAFF', 'line-width': 8, 'line-opacity': 0.25 } });
        map.addLayer({ id: 'nav-route-line', type: 'line', source: 'nav-route', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#00AAFF', 'line-width': 4, 'line-opacity': 0.9 } });
      } catch (_) { /* style not loaded yet */ }
    }

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
        .setLngLat([lastCoord[0], lastCoord[1]])
        .addTo(map);
    }

    const bounds = new maplibregl.LngLatBounds();
    navigation.coordinates.forEach(([lng, lat]: [number, number]) => bounds.extend([lng, lat]));
    map.fitBounds(bounds, { padding: { top: 80, bottom: 120, left: 60, right: 60 }, duration: 600 });
  }, [navigation]);

  // Speed cameras
  useEffect(() => {
    const map = glMap.current;
    if (!map) return;
    camMarkersRef.current.forEach((m: any) => m.remove());
    camMarkersRef.current = [];
    if (!speedCameras?.length) return;
    speedCameras.forEach((cam) => {
      const el = createSpeedCamEl(cam.speedLimit);
      const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat([cam.lng, cam.lat])
        .addTo(map);
      camMarkersRef.current.push(marker);
    });
  }, [speedCameras]);

  // Public cameras with hover tooltips and viewport culling
  useEffect(() => {
    const map = glMap.current;
    if (!map || !loaded) return;
    publicCamMarkersRef.current.forEach((m: any) => m.remove());
    publicCamMarkersRef.current = [];
    if (!cameras?.length || !showCameras) return;

    const CAM_TYPE_COLORS: Record<string, string> = {
      traffic: '#FF9800', urban: '#00AAFF', coastal: '#00BCD4', nature: '#4CAF50', other: '#9E9E9E',
    };
    const CAM_TYPE_LABELS: Record<string, string> = {
      traffic: 'Trânsito', urban: 'Urbana', coastal: 'Costeira', nature: 'Natureza', other: 'Outra',
    };

    cameras.forEach((cam) => {
      const el = document.createElement('div');
      el.className = 'pub-cam-marker';
      el.innerHTML = '📷';

      let hoverPopup: any = null;

      el.addEventListener('mouseenter', () => {
        if (hoverPopup) return;
        const typeColor = CAM_TYPE_COLORS[cam.type] || '#9E9E9E';
        const typeLabel = CAM_TYPE_LABELS[cam.type] || cam.type;
        const safe = (s: string) => s.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        hoverPopup = new maplibregl.Popup({ offset: 18, closeButton: false, closeOnClick: false, maxWidth: '260px' })
          .setLngLat([cam.lng, cam.lat])
          .setHTML(`<div style="padding:10px 12px;font-family:'Courier New',monospace;background:rgba(14,14,28,0.96);border-radius:10px;border:1px solid ${typeColor}30">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:5px">
              <span style="font-size:14px">📷</span>
              <span style="font-size:11px;font-weight:700;color:#E6EDF3;flex:1">${safe(cam.name)}</span>
            </div>
            <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
              <span style="display:inline-block;padding:2px 6px;border-radius:4px;font-size:8px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;background:${typeColor}18;color:${typeColor};border:1px solid ${typeColor}35">${typeLabel}</span>
              <span style="font-size:9px;color:#8B949E">${cam.country}</span>
              <span style="font-size:9px;color:#8B949E">· ${cam.quality === 'high' ? 'HD' : cam.quality === 'low' ? 'Baixa' : 'Padrão'}</span>
              ${(cam as any).scene ? `<span style="font-size:8px;color:#555;margin-left:auto">${(cam as any).scene}</span>` : ''}
            </div>
            <div style="margin-top:6px;font-size:8px;color:#00FF88;font-weight:600;letter-spacing:.5px">CLIQUE PARA VER AO VIVO ▶</div>
          </div>`)
          .addTo(map);
      });

      el.addEventListener('mouseleave', () => {
        if (hoverPopup) { hoverPopup.remove(); hoverPopup = null; }
      });

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        if (hoverPopup) { hoverPopup.remove(); hoverPopup = null; }
        if (onCameraPress) onCameraPress(cam);
      });

      const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat([cam.lng, cam.lat])
        .addTo(map);
      (marker as any)._camData = cam;
      publicCamMarkersRef.current.push(marker);
    });

    function updateCamVisibility() {
      const z = map.getZoom();
      const canvas = map.getCanvas();
      const w = canvas.width;
      const h = canvas.height;

      const gridSize = z >= 14 ? 20 : z >= 11 ? 30 : z >= 8 ? 45 : 60;
      const camOccupied = new Set<string>();

      publicCamMarkersRef.current.forEach((m: any) => {
        const el = m.getElement();
        if (!el) return;
        if (z < 6) { el.style.display = 'none'; return; }

        const lngLat = m.getLngLat();
        const pt = map.project(lngLat);

        if (pt.x < -20 || pt.x > w + 20 || pt.y < -20 || pt.y > h + 20) {
          el.style.display = 'none';
          return;
        }

        const cellKey = `${Math.floor(pt.x / gridSize)},${Math.floor(pt.y / gridSize)}`;
        if (camOccupied.has(cellKey)) {
          el.style.display = 'none';
        } else {
          camOccupied.add(cellKey);
          el.style.display = 'flex';
          const scale = z < 10 ? 0.55 : z < 13 ? 0.7 : z < 16 ? 0.85 : 1;
          el.style.transform = `scale(${scale})`;
        }
      });
    }

    map.on('zoom', updateCamVisibility);
    map.on('moveend', updateCamVisibility);
    updateCamVisibility();

    return () => { map.off('zoom', updateCamVisibility); map.off('moveend', updateCamVisibility); };
  }, [cameras, loaded, onCameraPress, showCameras]);

  // Drive mode
  useEffect(() => {
    const map = glMap.current;
    if (!map) return;
    if (driveMode) {
      map.easeTo({ pitch: 60, bearing: 0, duration: 500 });
    } else if (!is3DRef.current) {
      map.easeTo({ pitch: 0, bearing: 0, duration: 500 });
    }
  }, [driveMode]);

  return (
    <View style={mapStyles.container}>
      <div ref={mapRef} style={{ width: '100%', height: '100%', backgroundColor: '#0d1117' }}
        role="application" aria-label="Interactive map showing community incidents — OpenFreeMap" />

      {/* Map style picker panel */}
      {loaded && showStylePicker && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute', bottom: 60, left: '50%', transform: 'translateX(-50%)',
            display: 'flex', flexDirection: 'row', gap: 8, padding: 10, borderRadius: 16,
            background: isLightStyle ? 'rgba(255,255,255,0.96)' : 'rgba(16,16,28,0.96)',
            backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
            border: `1px solid ${isLightStyle ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
            boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(0,0,0,0.05)',
            zIndex: 50, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          }}
        >
          {MAP_STYLE_KEYS.map((key) => {
            const s = MAP_STYLES[key];
            const isActive = mapStyle === key;
            return (
              <div
                key={key}
                onClick={() => { setMapStyle(key); setShowStylePicker(false); }}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                  padding: '8px 8px 6px', borderRadius: 12, cursor: 'pointer', width: 80,
                  background: isActive ? `${Colors.primary}12` : 'transparent',
                  border: isActive ? `2px solid ${Colors.primary}` : '2px solid transparent',
                  transition: 'all 0.18s ease',
                  transform: isActive ? 'scale(1.04)' : 'scale(1)',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.background = isLightStyle ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)';
                    (e.currentTarget as HTMLElement).style.transform = 'scale(1.04)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.background = 'transparent';
                    (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
                  }
                }}
              >
                <div style={{
                  width: 60, height: 42, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, background: s.previewBg, position: 'relative', overflow: 'hidden',
                  border: isActive ? `1.5px solid ${Colors.primary}60` : `1px solid ${isLightStyle ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'}`,
                  boxShadow: isActive ? `0 0 12px ${Colors.primary}25` : '0 2px 6px rgba(0,0,0,0.15)',
                }}>
                  {s.icon}
                  {isActive && (
                    <div style={{
                      position: 'absolute', top: 3, right: 3, width: 12, height: 12, borderRadius: '50%',
                      background: Colors.primary, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <span style={{ color: '#fff', fontSize: 8, fontWeight: '900', lineHeight: 1 }}>✓</span>
                    </div>
                  )}
                </div>
                <span style={{
                  fontSize: 11, fontWeight: isActive ? '700' : '600',
                  color: isActive ? Colors.primary : (isLightStyle ? '#333' : '#ccc'),
                }}>{s.label}</span>
                <span style={{
                  fontSize: 7, color: isLightStyle ? '#888' : '#666',
                  textAlign: 'center', lineHeight: '1.3', maxWidth: 72,
                }}>{s.desc}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Control buttons */}
      {loaded && (
        <div style={{
          position: 'absolute', top: 180, right: 12, display: 'flex', flexDirection: 'column', gap: 6, zIndex: 10,
        }}>
          {/* Map Style Button */}
          <div
            className={`map-ctrl-btn${showStylePicker ? ' active' : ''}`}
            style={{
              background: showStylePicker ? `${Colors.primary}15` : isLightStyle ? 'rgba(255,255,255,0.92)' : 'rgba(20,20,32,0.9)',
              position: 'relative',
            }}
            onClick={() => setShowStylePicker(!showStylePicker)}
            title="Alterar estilo do mapa"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={showStylePicker ? Colors.primary : '#8A8A9A'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
            </svg>
          </div>

          {/* 3D Toggle */}
          <div
            className={`map-ctrl-btn${is3D ? ' active' : ''}`}
            style={{ background: is3D ? `${Colors.primary}15` : isLightStyle ? 'rgba(255,255,255,0.92)' : 'rgba(20,20,32,0.9)' }}
            onClick={toggle3D}
            title={is3D ? 'Mudar para 2D' : 'Mudar para 3D'}
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

          {/* Zoom In */}
          <div
            className="map-ctrl-btn"
            style={{ background: isLightStyle ? 'rgba(255,255,255,0.92)' : 'rgba(20,20,32,0.9)' }}
            onClick={() => { const map = glMap.current; if (map) map.zoomIn({ duration: 300 }); }}
            title="Aproximar"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8A8A9A" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </div>

          {/* Zoom Out */}
          <div
            className="map-ctrl-btn"
            style={{ background: isLightStyle ? 'rgba(255,255,255,0.92)' : 'rgba(20,20,32,0.9)' }}
            onClick={() => { const map = glMap.current; if (map) map.zoomOut({ duration: 300 }); }}
            title="Afastar"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8A8A9A" strokeWidth="2.5" strokeLinecap="round">
              <path d="M5 12h14" />
            </svg>
          </div>

          {/* Center on user */}
          <div
            className="map-ctrl-btn"
            style={{ background: isLightStyle ? 'rgba(255,255,255,0.92)' : 'rgba(20,20,32,0.9)' }}
            onClick={centerOnUser}
            title="Centralizar na sua localização"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2196FF" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="12" cy="12" r="3" /><path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
            </svg>
          </div>

        </div>
      )}

      {!loaded && !loadError && (
        <View style={mapStyles.loading}>
          <div style={{ color: Colors.primary, fontSize: 14, fontFamily: 'sans-serif' }}>Carregando mapa...</div>
        </View>
      )}
      {loadError && (
        <View style={mapStyles.loading}>
          <div style={{ color: '#FF4444', fontSize: 14, fontFamily: 'sans-serif', textAlign: 'center', padding: 20 }}>
            {loadError}
          </div>
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
