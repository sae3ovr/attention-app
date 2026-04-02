export const Spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,
} as const;

export const Radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  full: 9999,
} as const;

export const MIN_TOUCH_TARGET = 48;
export const LARGE_TOUCH_TARGET = 56;

export const Layout = {
  screenPaddingH: Spacing.xl,
  screenPaddingV: Spacing.lg,
  cardPadding: Spacing.lg,
  sectionGap: Spacing['3xl'],
  itemGap: Spacing.md,
  iconSize: 24,
  iconSizeLg: 32,
  iconSizeSm: 18,
  avatarSm: 32,
  avatarMd: 48,
  avatarLg: 72,
  headerHeight: 56,
  tabBarHeight: 80,
  bottomSheetHandle: 4,
} as const;
