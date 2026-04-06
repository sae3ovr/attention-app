import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, Pressable, Animated, Platform, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NeonText } from './NeonText';
import { Colors } from '../../theme/colors';

const { width: SW, height: SH } = Dimensions.get('window');

interface SpotlightTarget {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface TutorialStep {
  icon: string;
  title: string;
  body: string;
  target: SpotlightTarget;
  tipSide: 'top' | 'bottom' | 'left' | 'right';
  color: string;
}

function getDesktopSteps(sidebarW: number): TutorialStep[] {
  return [
    {
      icon: 'map',
      title: 'Mapa Interativo',
      body: 'Este é o mapa em tempo real. Veja todos os incidentes reportados pela comunidade e fontes públicas. Clique nos marcadores para ver detalhes.',
      target: { x: sidebarW, y: 0, w: SW - sidebarW, h: SH },
      tipSide: 'left',
      color: Colors.primary,
    },
    {
      icon: 'map-marker-multiple',
      title: 'Incidentes por Perto',
      body: 'A barra lateral mostra os incidentes próximos à sua localização. Clique num incidente para o ver no mapa.',
      target: { x: 0, y: 160, w: sidebarW, h: SH - 200 },
      tipSide: 'right',
      color: Colors.cyan,
    },
    {
      icon: 'plus-circle',
      title: 'Reportar Incidente',
      body: 'Viu algo suspeito? Toque em "Reportar" para criar um alerta. O algoritmo de credibilidade analisa cada reporte para manter a comunidade segura.',
      target: { x: sidebarW + 16, y: 8, w: 52, h: 52 },
      tipSide: 'bottom',
      color: Colors.warning,
    },
    {
      icon: 'link-variant',
      title: 'Cadeia, Família & Perfil',
      body: 'Use os botões do topo para aceder ao sistema de Cadeia (conecte-se com vizinhos), Família (acompanhe familiares) e o seu Perfil.',
      target: { x: 12, y: 90, w: sidebarW - 24, h: 40 },
      tipSide: 'bottom',
      color: '#FF9800',
    },
    {
      icon: 'steering',
      title: 'Modo Condução & Câmeras',
      body: 'Active o Modo Condução para navegar com alertas em tempo real, radares e limite de velocidade. Use o botão de câmeras para ver câmeras públicas no mapa.',
      target: { x: sidebarW + SW * 0.35, y: SH - 80, w: 200, h: 52 },
      tipSide: 'top',
      color: '#00AAFF',
    },
  ];
}

function getMobileSteps(): TutorialStep[] {
  return [
    {
      icon: 'map',
      title: 'Mapa Interativo',
      body: 'Este é o mapa em tempo real. Veja todos os incidentes reportados pela comunidade e fontes públicas de segurança.',
      target: { x: 0, y: 0, w: SW, h: SH },
      tipSide: 'top',
      color: Colors.primary,
    },
    {
      icon: 'plus-circle',
      title: 'Reportar Incidente',
      body: 'Viu algo suspeito? Toque no botão "+" para criar um alerta com foto e localização automática.',
      target: { x: SW * 0.3, y: SH - 80, w: SW * 0.4, h: 56 },
      tipSide: 'top',
      color: Colors.warning,
    },
    {
      icon: 'navigation-variant',
      title: 'Navegar & Escanear',
      body: 'Use os botões de Navegação e GuardScan para planear rotas seguras e escanear a área à sua volta.',
      target: { x: SW * 0.4, y: SH - 80, w: SW * 0.35, h: 56 },
      tipSide: 'top',
      color: '#00AAFF',
    },
    {
      icon: 'link-variant',
      title: 'Cadeia & Família',
      body: 'Aceda ao sistema de Cadeia e Família através dos ícones no topo. Conecte-se com vizinhos e acompanhe familiares.',
      target: { x: 8, y: 50, w: SW - 16, h: 44 },
      tipSide: 'bottom',
      color: '#FF9800',
    },
    {
      icon: 'steering',
      title: 'Modo Condução',
      body: 'Active o Modo Condução para navegar com velocímetro, alertas de radar e incidentes na estrada em tempo real.',
      target: { x: SW - 60, y: 50, w: 44, h: 44 },
      tipSide: 'bottom',
      color: Colors.secondary,
    },
  ];
}

function SpotlightBackdrop({ target, opacity }: { target: SpotlightTarget; opacity: number }) {
  const pad = 8;
  const r = 14;
  const sx = target.x - pad;
  const sy = target.y - pad;
  const sw = target.w + pad * 2;
  const sh = target.h + pad * 2;

  if (Platform.OS !== 'web') {
    return <View style={{ position: 'absolute', inset: 0, backgroundColor: `rgba(0,0,0,${opacity * 0.7})` }} />;
  }

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'auto',
      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    }}>
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <mask id="spotlight-mask">
            <rect width="100%" height="100%" fill="white" />
            <rect x={sx} y={sy} width={sw} height={sh} rx={r} ry={r} fill="black" />
          </mask>
        </defs>
        <rect width="100%" height="100%" fill={`rgba(6,6,16,${opacity * 0.72})`} mask="url(#spotlight-mask)" />
        <rect x={sx} y={sy} width={sw} height={sh} rx={r} ry={r}
          fill="none" stroke={Colors.primary} strokeWidth="1.5" strokeDasharray="6 4" opacity="0.5" />
      </svg>
    </div>
  );
}

interface TutorialOverlayProps {
  sidebarWidth: number;
  isDesktop: boolean;
  onComplete: () => void;
}

export function TutorialOverlay({ sidebarWidth, isDesktop, onComplete }: TutorialOverlayProps) {
  const [step, setStep] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const tipSlide = useRef(new Animated.Value(20)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;

  const steps = isDesktop ? getDesktopSteps(sidebarWidth) : getMobileSteps();
  const total = steps.length;
  const current = steps[step];
  const isLast = step === total - 1;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(tipSlide, { toValue: 0, useNativeDriver: true, speed: 14, bounciness: 6 }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 1200, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const animateStep = useCallback((next: number) => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(tipSlide, { toValue: 20, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      setStep(next);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(tipSlide, { toValue: 0, useNativeDriver: true, speed: 14, bounciness: 8 }),
      ]).start();
    });
  }, []);

  const goNext = () => {
    if (isLast) { onComplete(); return; }
    animateStep(step + 1);
  };

  const goBack = () => {
    if (step > 0) animateStep(step - 1);
  };

  const tipPos = getTipPosition(current.target, current.tipSide);

  return (
    <View style={{
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9000,
    }} pointerEvents="box-none">

      <SpotlightBackdrop target={current.target} opacity={1} />

      {/* Animated pulse ring around target center */}
      {Platform.OS === 'web' && (
        <Animated.View style={{
          position: 'absolute',
          left: current.target.x + current.target.w / 2 - 30,
          top: current.target.y + current.target.h / 2 - 30,
          width: 60, height: 60, borderRadius: 30,
          borderWidth: 2, borderColor: current.color + '50',
          opacity: pulseAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.6, 0, 0.6] }),
          transform: [{ scale: pulseAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 2.5, 1] }) }],
          pointerEvents: 'none',
        } as any} />
      )}

      {/* Tooltip card */}
      <Animated.View style={[{
        position: 'absolute',
        ...tipPos,
        opacity: fadeAnim,
        transform: [
          { translateY: current.tipSide === 'bottom' ? tipSlide : current.tipSide === 'top' ? Animated.multiply(tipSlide, -1) : 0 },
          { translateX: current.tipSide === 'right' ? tipSlide : current.tipSide === 'left' ? Animated.multiply(tipSlide, -1) : 0 },
        ],
        zIndex: 9999,
        pointerEvents: 'auto',
      } as any]}>
        <View style={{
          width: 320, maxWidth: SW - 40,
          backgroundColor: 'rgba(14,14,28,0.96)',
          borderRadius: 18, borderWidth: 1.5,
          borderColor: current.color + '35',
          padding: 0, overflow: 'hidden',
          ...(Platform.OS === 'web' ? {
            backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)',
            boxShadow: `0 12px 48px rgba(0,0,0,0.6), 0 0 32px ${current.color}15`,
          } as any : {}),
        }}>
          {/* Top accent bar */}
          <View style={{
            height: 3, backgroundColor: current.color,
            ...(Platform.OS === 'web' ? { boxShadow: `0 0 12px ${current.color}` } as any : {}),
          }} />

          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, paddingBottom: 10 }}>
            <View style={{
              width: 40, height: 40, borderRadius: 12,
              backgroundColor: current.color + '15', borderWidth: 1, borderColor: current.color + '30',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <MaterialCommunityIcons name={current.icon as any} size={20} color={current.color} />
            </View>
            <View style={{ flex: 1 }}>
              <NeonText style={{ color: '#fff', fontSize: 15, fontWeight: '800', letterSpacing: -0.3 }}>{current.title}</NeonText>
              <NeonText style={{ color: current.color, fontSize: 9, fontWeight: '700', letterSpacing: 2, marginTop: 1, textTransform: 'uppercase' }}>
                Passo {step + 1} de {total}
              </NeonText>
            </View>
            <Pressable onPress={onComplete} hitSlop={12}
              style={({ pressed }) => ({
                width: 28, height: 28, borderRadius: 8,
                alignItems: 'center', justifyContent: 'center',
                backgroundColor: pressed ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.05)',
                ...(Platform.OS === 'web' ? { cursor: 'pointer' } as any : {}),
              })}>
              <MaterialCommunityIcons name="close" size={14} color="#8A8A9A" />
            </Pressable>
          </View>

          {/* Body */}
          <View style={{ paddingHorizontal: 16, paddingBottom: 14 }}>
            <NeonText style={{ color: '#B0B8C8', fontSize: 13, lineHeight: 20 }}>{current.body}</NeonText>
          </View>

          {/* Footer: dots + buttons */}
          <View style={{
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            paddingHorizontal: 16, paddingVertical: 12,
            borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)',
            backgroundColor: 'rgba(255,255,255,0.02)',
          }}>
            {/* Dots */}
            <View style={{ flexDirection: 'row', gap: 5, alignItems: 'center' }}>
              {steps.map((_, i) => (
                <View key={i} style={{
                  width: i === step ? 18 : 6, height: 6, borderRadius: 3,
                  backgroundColor: i === step ? current.color : 'rgba(255,255,255,0.15)',
                  ...(Platform.OS === 'web' ? { transition: 'all 0.3s ease' } as any : {}),
                }} />
              ))}
            </View>

            {/* Buttons */}
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {step > 0 && (
                <Pressable onPress={goBack}
                  style={({ pressed }) => ({
                    paddingVertical: 7, paddingHorizontal: 14, borderRadius: 10,
                    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
                    backgroundColor: pressed ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
                    ...(Platform.OS === 'web' ? { cursor: 'pointer', transition: 'all 0.2s ease' } as any : {}),
                  })}>
                  <NeonText style={{ color: '#8A8A9A', fontSize: 12, fontWeight: '600' }}>Voltar</NeonText>
                </Pressable>
              )}
              <Pressable onPress={goNext}
                style={({ pressed }) => ({
                  paddingVertical: 7, paddingHorizontal: 18, borderRadius: 10,
                  backgroundColor: pressed ? current.color + 'DD' : current.color,
                  ...(Platform.OS === 'web' ? {
                    cursor: 'pointer', transition: 'all 0.2s ease',
                    boxShadow: `0 2px 12px ${current.color}40`,
                  } as any : {}),
                  transform: [{ scale: 1 }],
                })}>
                <NeonText style={{ color: '#0D1117', fontSize: 12, fontWeight: '800' }}>
                  {isLast ? 'Começar!' : 'Próximo →'}
                </NeonText>
              </Pressable>
            </View>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

function getTipPosition(target: SpotlightTarget, side: string): Record<string, number> {
  const pad = 16;
  switch (side) {
    case 'bottom':
      return { top: target.y + target.h + pad, left: Math.max(20, Math.min(target.x + target.w / 2 - 160, SW - 340)) };
    case 'top':
      return { bottom: SH - target.y + pad, left: Math.max(20, Math.min(target.x + target.w / 2 - 160, SW - 340)) };
    case 'right':
      return { top: Math.max(20, target.y + target.h / 2 - 100), left: target.x + target.w + pad };
    case 'left':
      return { top: Math.max(20, target.y + target.h / 2 - 100), right: SW - target.x + pad };
    default:
      return { top: target.y + target.h + pad, left: 20 };
  }
}
