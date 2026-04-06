import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import type { PublicCamera } from '../../types';
import { Colors } from '../../theme/colors';

interface CameraViewerProps {
  camera: PublicCamera;
  onClose: () => void;
  onReportIncident?: (lat: number, lng: number) => void;
}

const TYPE_META: Record<string, { label: string; color: string; icon: string }> = {
  traffic: { label: 'Trânsito', color: '#FF9800', icon: '🚦' },
  urban: { label: 'Urbana', color: '#00AAFF', icon: '🏙️' },
  coastal: { label: 'Costeira', color: '#00BCD4', icon: '🌊' },
  nature: { label: 'Natureza', color: '#4CAF50', icon: '🌿' },
  other: { label: 'Outra', color: '#9E9E9E', icon: '📷' },
};

function toEmbedUrl(url: string): string {
  // youtube.com/watch?v=ID → youtube.com/embed/ID
  const watchMatch = url.match(/youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/);
  if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}?autoplay=1&mute=1`;

  // youtube.com/live/ID → youtube.com/embed/ID
  const liveMatch = url.match(/youtube\.com\/live\/([a-zA-Z0-9_-]+)/);
  if (liveMatch) return `https://www.youtube.com/embed/${liveMatch[1]}?autoplay=1&mute=1`;

  // youtu.be/ID → youtube.com/embed/ID
  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
  if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}?autoplay=1&mute=1`;

  // already an embed URL — ensure autoplay params
  if (url.includes('youtube.com/embed/') && !url.includes('autoplay')) {
    return url + (url.includes('?') ? '&' : '?') + 'autoplay=1&mute=1';
  }

  return url;
}

function isImageStream(url: string): boolean {
  return (
    url.endsWith('.jpg') ||
    url.endsWith('.jpeg') ||
    url.endsWith('.png') ||
    url.endsWith('.gif') ||
    url.includes('snapshot') ||
    url.includes('mjpg') ||
    url.includes('cgi-bin')
  );
}

function isYouTube(url: string): boolean {
  return url.includes('youtube.com') || url.includes('youtu.be');
}

export function CameraViewer({ camera, onClose, onReportIncident }: CameraViewerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const meta = TYPE_META[camera.type] || TYPE_META.other;
  const embedUrl = toEmbedUrl(camera.streamUrl);
  const imageMode = isImageStream(camera.streamUrl);
  const ytMode = isYouTube(camera.streamUrl);

  const handleReport = useCallback(() => {
    if (onReportIncident) onReportIncident(camera.lat, camera.lng);
  }, [camera, onReportIncident]);

  const openExternal = useCallback(() => {
    if (typeof window !== 'undefined') {
      const externalUrl = ytMode
        ? camera.streamUrl.replace('/embed/', '/watch?v=').split('?')[0]
        : camera.streamUrl;
      window.open(externalUrl, '_blank');
    }
  }, [camera.streamUrl, ytMode]);

  if (Platform.OS !== 'web') {
    return (
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{meta.icon} {camera.name}</Text>
              <Text style={styles.subtitle}>{camera.country} · {meta.label}</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>
          <View style={styles.streamContainer}>
            <Text style={styles.nativeMsg}>
              Câmeras ao vivo não estão disponíveis no app nativo.{'\n'}
              Use a versão web para assistir.
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.overlay}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.modal}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Text style={styles.title}>{meta.icon} {camera.name}</Text>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '2px 8px', borderRadius: 10,
                background: 'rgba(255,59,48,0.15)', border: '1px solid rgba(255,59,48,0.3)',
              }}>
                <div style={{
                  width: 6, height: 6, borderRadius: '50%', backgroundColor: '#FF3B30',
                  boxShadow: '0 0 6px #FF3B30',
                  animation: 'cam-live-pulse 1.5s ease-in-out infinite',
                } as any} />
                <span style={{ color: '#FF3B30', fontSize: 9, fontWeight: 800, letterSpacing: 1 }}>LIVE</span>
              </div>
            </View>
            <View style={styles.metaRow}>
              <View style={[styles.typeBadge, { backgroundColor: meta.color + '22', borderColor: meta.color + '44' }]}>
                <Text style={[styles.typeBadgeText, { color: meta.color }]}>{meta.label}</Text>
              </View>
              <Text style={styles.subtitle}>{camera.country}</Text>
              <Text style={styles.qualityText}>
                {camera.quality === 'high' ? '🟢 HD' : camera.quality === 'low' ? '🔴 Baixa' : '🟡 Padrão'}
              </Text>
            </View>
          </View>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </Pressable>
        </View>

        <View style={styles.streamContainer}>
          {loading && !error && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Conectando à câmera ao vivo...</Text>
            </View>
          )}
          {error && (
            <View style={styles.loadingOverlay}>
              <Text style={{ fontSize: 48 }}>📷</Text>
              <Text style={styles.errorText}>Stream indisponível</Text>
              <Text style={styles.errorSub}>A câmera pode estar offline ou bloqueada pelo navegador.</Text>
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
                <Pressable style={styles.retryBtn} onPress={() => { setError(false); setLoading(true); }}>
                  <Text style={styles.retryBtnText}>↻ Tentar Novamente</Text>
                </Pressable>
                <Pressable style={[styles.retryBtn, { backgroundColor: 'rgba(0,255,136,0.12)', borderColor: 'rgba(0,255,136,0.3)' }]} onPress={openExternal}>
                  <Text style={[styles.retryBtnText, { color: Colors.primary }]}>↗ Abrir no Navegador</Text>
                </Pressable>
              </View>
            </View>
          )}
          {imageMode ? (
            <img
              src={camera.streamUrl}
              alt={camera.name}
              style={{
                width: '100%', height: '100%', objectFit: 'contain',
                display: error ? 'none' : 'block',
              }}
              onLoad={() => setLoading(false)}
              onError={() => { setLoading(false); setError(true); }}
            />
          ) : (
            <iframe
              src={embedUrl}
              title={camera.name}
              style={{
                width: '100%', height: '100%', border: 'none',
                display: error ? 'none' : 'block',
              }}
              allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
              allowFullScreen
              referrerPolicy="no-referrer"
              onLoad={() => setLoading(false)}
              onError={() => { setLoading(false); setError(true); }}
            />
          )}
          <style>{`@keyframes cam-live-pulse { 0%,100% { opacity:1; } 50% { opacity:0.3; } }`}</style>
        </View>

        <View style={styles.footer}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={styles.coordText}>📍 {camera.lat.toFixed(4)}, {camera.lng.toFixed(4)}</Text>
            {ytMode && <Text style={{ color: '#FF0000', fontSize: 10, fontWeight: '700' }}>▶ YouTube Live</Text>}
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {onReportIncident && (
              <Pressable style={[styles.reportBtn, { flex: 1 }]} onPress={handleReport}>
                <Text style={styles.reportBtnText}>🚨 Reportar Incidente</Text>
              </Pressable>
            )}
            <Pressable style={[styles.externalBtn, { flex: 1 }]} onPress={openExternal}>
              <Text style={styles.externalBtnText}>↗ Abrir em Nova Aba</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute' as any,
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    position: 'absolute' as any,
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.75)',
  },
  modal: {
    width: '92%',
    maxWidth: 800,
    maxHeight: '88%',
    backgroundColor: 'rgba(12,12,24,0.98)',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    zIndex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  subtitle: {
    color: '#8A8A9A',
    fontSize: 12,
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  qualityText: {
    color: '#8A8A9A',
    fontSize: 11,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#8A8A9A',
    fontSize: 16,
    fontWeight: '600',
  },
  streamContainer: {
    width: '100%',
    height: 440,
    backgroundColor: '#000',
    position: 'relative' as any,
  },
  loadingOverlay: {
    position: 'absolute' as any,
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.85)',
    zIndex: 2,
  },
  loadingText: {
    color: '#8A8A9A',
    fontSize: 12,
    marginTop: 10,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
  },
  errorSub: {
    color: '#8A8A9A',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(0,170,255,0.12)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,170,255,0.3)',
  },
  retryBtnText: {
    color: '#00AAFF',
    fontSize: 12,
    fontWeight: '700',
  },
  nativeMsg: {
    color: '#8A8A9A',
    fontSize: 14,
    textAlign: 'center',
    padding: 40,
    lineHeight: 22,
  },
  footer: {
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    gap: 10,
  },
  coordRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coordText: {
    color: '#8A8A9A',
    fontSize: 11,
    fontFamily: Platform.OS === 'web' ? "'Courier New', monospace" : 'monospace',
  },
  reportBtn: {
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255,68,68,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,68,68,0.25)',
    alignItems: 'center',
  },
  reportBtnText: {
    color: '#FF4444',
    fontSize: 12,
    fontWeight: '700',
  },
  externalBtn: {
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(0,170,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0,170,255,0.2)',
    alignItems: 'center',
  },
  externalBtnText: {
    color: '#00AAFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
