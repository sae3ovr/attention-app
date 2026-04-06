export const Colors = {
  background: '#0D1117',
  backgroundLight: '#161B22',
  surface: '#1C2333',
  surfaceLight: '#21293A',

  primary: '#00FF88',
  primaryDim: '#00CC6E',
  primaryGlow: 'rgba(0, 255, 136, 0.35)',
  primarySubtle: 'rgba(0, 255, 136, 0.08)',

  secondary: '#7B61FF',
  secondaryDim: '#6248D6',
  secondaryGlow: 'rgba(123, 97, 255, 0.35)',

  accent: '#FF3B7A',
  accentDim: '#D6305F',
  accentGlow: 'rgba(255, 59, 122, 0.35)',

  warning: '#FFB800',
  warningDim: '#CC9400',
  warningGlow: 'rgba(255, 184, 0, 0.35)',

  error: '#FF4444',
  errorDim: '#CC3636',
  errorGlow: 'rgba(255, 68, 68, 0.35)',

  success: '#00FF88',
  successGlow: 'rgba(0, 255, 136, 0.35)',

  cyan: '#00D4FF',
  cyanGlow: 'rgba(0, 212, 255, 0.35)',

  textPrimary: '#E6EDF3',
  textSecondary: '#8B949E',
  textTertiary: '#6E7681',
  textDisabled: '#484F58',

  border: 'rgba(255, 255, 255, 0.08)',
  borderLight: 'rgba(255, 255, 255, 0.04)',
  borderFocused: 'rgba(0, 255, 170, 0.5)',

  glass: {
    background: 'rgba(13, 17, 23, 0.75)',
    backgroundHover: 'rgba(22, 27, 34, 0.85)',
    border: 'rgba(255, 255, 255, 0.08)',
    borderLight: 'rgba(255, 255, 255, 0.04)',
    shadow: 'rgba(0, 0, 0, 0.6)',
  },

  severity: {
    low: '#00FF88',
    medium: '#FFB800',
    high: '#FF7A3B',
    critical: '#FF4444',
  },

  category: {
    robbery: '#FF4444',
    accident: '#FF7A3B',
    suspicious: '#FFB800',
    hazard: '#FF3B7A',
    police: '#3B7AFF',
    fire: '#FF5522',
    medical: '#FF3B7A',
    traffic: '#FFB800',
    noise: '#7B61FF',
    flood: '#0EA5E9',
    injured_animal: '#F59E0B',
    building_risk: '#DC2626',
    other: '#8A8A9A',
  },

  overlay: 'rgba(0, 0, 0, 0.75)',
  scrim: 'rgba(6, 6, 16, 0.88)',

  guardian: '#00FF88',
  guardianGlow: 'rgba(0, 255, 136, 0.45)',
} as const;

export const LightColors = {
  background: '#FAFBFE',
  backgroundLight: '#F0F2F8',
  surface: '#FFFFFF',
  surfaceLight: '#F5F6FA',

  primary: '#009973',
  primaryDim: '#007A5E',
  primaryGlow: 'rgba(0, 153, 115, 0.15)',
  primarySubtle: 'rgba(0, 153, 115, 0.06)',

  secondary: '#5B42D6',
  secondaryDim: '#4830B0',
  secondaryGlow: 'rgba(91, 66, 214, 0.15)',

  accent: '#D42B63',
  accentDim: '#B02452',
  accentGlow: 'rgba(212, 43, 99, 0.15)',

  warning: '#D69500',
  warningDim: '#B07A00',
  warningGlow: 'rgba(214, 149, 0, 0.15)',

  error: '#D43B3B',
  errorDim: '#B03030',
  errorGlow: 'rgba(212, 59, 59, 0.15)',

  success: '#00B85E',
  successGlow: 'rgba(0, 184, 94, 0.15)',

  cyan: '#0099CC',
  cyanGlow: 'rgba(0, 153, 204, 0.15)',

  textPrimary: '#1A1D2E',
  textSecondary: '#555B6E',
  textTertiary: '#8B92A5',
  textDisabled: '#C5CAD6',

  border: 'rgba(0, 0, 0, 0.07)',
  borderLight: 'rgba(0, 0, 0, 0.03)',
  borderFocused: 'rgba(0, 153, 115, 0.5)',

  glass: {
    background: 'rgba(255, 255, 255, 0.90)',
    backgroundHover: 'rgba(255, 255, 255, 0.95)',
    border: 'rgba(0, 0, 0, 0.06)',
    borderLight: 'rgba(0, 0, 0, 0.03)',
    shadow: 'rgba(0, 20, 60, 0.06)',
  },

  severity: {
    low: '#00A85A',
    medium: '#D69500',
    high: '#D66028',
    critical: '#D43B3B',
  },

  category: {
    robbery: '#D43B3B',
    accident: '#D66028',
    suspicious: '#D69500',
    hazard: '#D42B63',
    police: '#2860D6',
    fire: '#D64418',
    medical: '#D42B63',
    traffic: '#D69500',
    noise: '#5B42D6',
    flood: '#0284C7',
    injured_animal: '#D97706',
    building_risk: '#B91C1C',
    other: '#6E7588',
  },

  overlay: 'rgba(0, 0, 0, 0.35)',
  scrim: 'rgba(250, 251, 254, 0.94)',

  guardian: '#009973',
  guardianGlow: 'rgba(0, 153, 115, 0.2)',
} as const;

export const HighContrastColors = {
  ...Colors,
  background: '#000000',
  backgroundLight: '#0A0A0A',
  surface: '#1A1A1A',
  surfaceLight: '#2A2A2A',

  primary: '#00FFCC',
  secondary: '#9B81FF',
  accent: '#FF5B9A',
  warning: '#FFD800',
  error: '#FF6666',
  success: '#00FF88',

  textPrimary: '#FFFFFF',
  textSecondary: '#CCCCCC',
  textTertiary: '#999999',

  border: 'rgba(255, 255, 255, 0.25)',
  borderLight: 'rgba(255, 255, 255, 0.15)',
  borderFocused: 'rgba(0, 255, 204, 0.8)',

  glass: {
    background: 'rgba(255, 255, 255, 0.12)',
    backgroundHover: 'rgba(255, 255, 255, 0.18)',
    border: 'rgba(255, 255, 255, 0.25)',
    borderLight: 'rgba(255, 255, 255, 0.15)',
    shadow: 'rgba(0, 0, 0, 0.7)',
  },
} as const;
