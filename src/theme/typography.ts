import { TextStyle } from 'react-native';

const BASE_SIZES = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
};

const LARGE_SIZES = {
  xs: 14,
  sm: 16,
  md: 18,
  lg: 21,
  xl: 25,
  '2xl': 30,
  '3xl': 36,
  '4xl': 44,
  '5xl': 56,
};

export function getFontSizes(largeText: boolean) {
  return largeText ? LARGE_SIZES : BASE_SIZES;
}

export function createTypography(largeText = false) {
  const sizes = getFontSizes(largeText);

  return {
    hero: {
      fontSize: sizes['5xl'],
      fontWeight: '800',
      letterSpacing: -1.5,
      lineHeight: sizes['5xl'] * 1.1,
    } satisfies TextStyle,

    h1: {
      fontSize: sizes['4xl'],
      fontWeight: '700',
      letterSpacing: -1,
      lineHeight: sizes['4xl'] * 1.2,
    } satisfies TextStyle,

    h2: {
      fontSize: sizes['3xl'],
      fontWeight: '700',
      letterSpacing: -0.5,
      lineHeight: sizes['3xl'] * 1.25,
    } satisfies TextStyle,

    h3: {
      fontSize: sizes['2xl'],
      fontWeight: '600',
      letterSpacing: -0.3,
      lineHeight: sizes['2xl'] * 1.3,
    } satisfies TextStyle,

    h4: {
      fontSize: sizes.xl,
      fontWeight: '600',
      letterSpacing: -0.2,
      lineHeight: sizes.xl * 1.35,
    } satisfies TextStyle,

    bodyLg: {
      fontSize: sizes.lg,
      fontWeight: '400',
      letterSpacing: 0,
      lineHeight: sizes.lg * 1.5,
    } satisfies TextStyle,

    body: {
      fontSize: sizes.md,
      fontWeight: '400',
      letterSpacing: 0,
      lineHeight: sizes.md * 1.55,
    } satisfies TextStyle,

    bodySm: {
      fontSize: sizes.sm,
      fontWeight: '400',
      letterSpacing: 0.1,
      lineHeight: sizes.sm * 1.5,
    } satisfies TextStyle,

    caption: {
      fontSize: sizes.xs,
      fontWeight: '400',
      letterSpacing: 0.2,
      lineHeight: sizes.xs * 1.45,
    } satisfies TextStyle,

    label: {
      fontSize: sizes.sm,
      fontWeight: '600',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      lineHeight: sizes.sm * 1.4,
    } satisfies TextStyle,

    button: {
      fontSize: sizes.md,
      fontWeight: '600',
      letterSpacing: 0.3,
      lineHeight: sizes.md * 1.2,
    } satisfies TextStyle,

    buttonSm: {
      fontSize: sizes.sm,
      fontWeight: '600',
      letterSpacing: 0.3,
      lineHeight: sizes.sm * 1.2,
    } satisfies TextStyle,

    mono: {
      fontSize: sizes.sm,
      fontWeight: '400',
      letterSpacing: 0,
      lineHeight: sizes.sm * 1.6,
      fontFamily: 'monospace',
    } satisfies TextStyle,
  };
}

export const Typography = createTypography(false);
export const LargeTypography = createTypography(true);
