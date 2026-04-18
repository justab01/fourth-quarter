// Fourth Quarter Typography Constants
// Inter (body/UI), Oswald (scores/display), DM Mono (data/tags)

export const FONTS = {
  // Display — Scores, headers, big numbers
  display: "Oswald_700Bold",
  displayMedium: "Oswald_500Medium",

  // Body — All text content (Inter matches what's actually loaded)
  body: "Inter_400Regular",
  bodyMedium: "Inter_500Medium",
  bodySemiBold: "Inter_600SemiBold",
  bodyBold: "Inter_700Bold",
  bodyHeavy: "Inter_800ExtraBold",

  // Mono — Data, tags, league labels
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
  micro: 9,
  small: 11,
  medium: 13,
  large: 15,
  xlarge: 17,
  xxlarge: 18,
  huge: 22,
  giant: 26,
  massive: 30,
  display: 40,
  jumbo: 52,
  colossal: 56,
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
