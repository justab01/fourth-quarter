// Fourth Quarter Typography Constants
// Plus Jakarta Sans (body/UI), Oswald (scores/display), DM Mono (data/tags)

export const FONTS = {
  display: "Oswald_700Bold",
  displayMedium: "Oswald_500Medium",
  body: "PlusJakartaSans_400Regular",
  bodyMedium: "PlusJakartaSans_600SemiBold",
  bodyBold: "PlusJakartaSans_700Bold",
  bodyHeavy: "PlusJakartaSans_800ExtraBold",
  mono: "DMMono_400Regular",
  monoBold: "DMMono_500Medium",
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

export const TYPO_PRESETS = {
  hero: {
    fontFamily: FONTS.display,
    fontSize: FONT_SIZES.hero,
    lineHeight: LINE_HEIGHTS.tight,
  } as const,

  sectionTitle: {
    fontFamily: FONTS.bodyHeavy,
    fontSize: FONT_SIZES.heading,
    lineHeight: LINE_HEIGHTS.tight,
  } as const,

  cardTitle: {
    fontFamily: FONTS.bodyBold,
    fontSize: FONT_SIZES.subheading,
    lineHeight: LINE_HEIGHTS.normal,
  } as const,

  body: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.body,
    lineHeight: LINE_HEIGHTS.normal,
  } as const,

  caption: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZES.caption,
    lineHeight: LINE_HEIGHTS.normal,
  } as const,

  data: {
    fontFamily: FONTS.mono,
    fontSize: FONT_SIZES.body,
    lineHeight: LINE_HEIGHTS.normal,
  } as const,
} as const;
