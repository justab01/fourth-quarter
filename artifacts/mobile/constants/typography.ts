// Fourth Quarter Typography Constants
// Brand fonts: Black Ops One (display), Barlow Condensed (subheadings),
// Barlow (body), JetBrains Mono (data)

export const FONTS = {
  display: "BlackOpsOne_400Regular",
  subheading: "BarlowCondensed_600SemiBold",
  body: "Barlow_400Regular",
  bodyMedium: "Barlow_500Medium",
  bodyBold: "Barlow_700Bold",
  mono: "JetBrainsMono_400Regular",
  monoBold: "JetBrainsMono_700Bold",
} as const;

export const FONT_SIZES = {
  hero: 32,
  title: 24,
  heading: 20,
  subheading: 16,
  body: 14,
  caption: 12,
  tiny: 10,
} as const;

export const LINE_HEIGHTS = {
  tight: 1.1,
  normal: 1.4,
  relaxed: 1.6,
} as const;

// Typography presets for common use cases
export const TYPO_PRESETS = {
  // Hero text - sport headers, scores
  hero: {
    fontFamily: FONTS.display,
    fontSize: FONT_SIZES.hero,
    lineHeight: LINE_HEIGHTS.tight,
  } as const,

  // Section titles
  sectionTitle: {
    fontFamily: FONTS.subheading,
    fontSize: FONT_SIZES.heading,
    lineHeight: LINE_HEIGHTS.tight,
  } as const,

  // Card titles
  cardTitle: {
    fontFamily: FONTS.bodyBold,
    fontSize: FONT_SIZES.subheading,
    lineHeight: LINE_HEIGHTS.normal,
  } as const,

  // Body text
  body: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.body,
    lineHeight: LINE_HEIGHTS.normal,
  } as const,

  // Labels and captions
  caption: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.caption,
    lineHeight: LINE_HEIGHTS.normal,
  } as const,

  // Data/numbers
  data: {
    fontFamily: FONTS.mono,
    fontSize: FONT_SIZES.body,
    lineHeight: LINE_HEIGHTS.normal,
  } as const,
} as const;