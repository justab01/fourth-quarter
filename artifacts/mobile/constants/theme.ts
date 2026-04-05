const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

const RADIUS = {
  xs: 6,
  sm: 8,
  md: 10,
  card: 14,
  lg: 16,
  hero: 20,
  pill: 22,
  circle: 999,
} as const;

const SCREEN_PADDING = SPACING.lg;

const SECTION_GAP = SPACING.md;

const TAB_BAR_HEIGHT = 72;

export { SPACING, RADIUS, SCREEN_PADDING, SECTION_GAP, TAB_BAR_HEIGHT };
