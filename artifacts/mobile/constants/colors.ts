// Fourth Quarter — Fitness/Sports Color Palette (March 2026)
// Primary:  Energy Orange #EF7828
// Secondary: Vivid Teal  #206E6B
// Neutral:  Graphite     #504D47
// Support:  Steel Blue   #687C88

const accent     = "#EF7828";   // Energy Orange — primary CTA, live dots, highlights
const accentTeal = "#206E6B";   // Vivid Teal — secondary accent, success, NFL/MLB
const accentGold = "#D4A843";   // Muted gold for AI recaps
const accentGreen= "#206E6B";   // Teal doubles as green for wins / positive
const accentBlue = "#687C88";   // Steel Blue — links, info
const graphite   = "#504D47";   // Graphite — card borders, dividers

export default {
  dark: {
    // Text
    text:              "#F5F1ED",
    textSecondary:     "rgba(245,241,237,0.68)",
    textTertiary:      "#687C88",

    // Backgrounds — warm dark (not cold black)
    background:        "#0A0907",
    backgroundSecondary: "#111009",
    backgroundTertiary:  "#181510",

    // Cards
    card:              "#161310",
    cardElevated:      "#201C18",
    cardBorder:        "rgba(80,77,71,0.45)",
    cardBorderActive:  "rgba(239,120,40,0.45)",

    // Accents
    tint:       accent,
    accent,                        // Energy Orange
    accentTeal,                    // Vivid Teal
    accentOrange: accent,
    accentGold,
    accentGreen,
    accentBlue,
    graphite,

    // Live indicator — energetic orange (not red)
    live:     "#EF7828",
    liveGlow: "rgba(239,120,40,0.35)",
    liveGreen: accentTeal,

    // Tab bar
    tabBarBg:         "rgba(10,9,7,0.92)",
    tabIconDefault:   "rgba(104,124,136,0.6)",
    tabIconSelected:  "#EF7828",

    // Separators / glass
    separator:    "rgba(80,77,71,0.3)",
    overlay:      "rgba(0,0,0,0.82)",
    glassLight:   "rgba(239,120,40,0.04)",
    glassBorder:  "rgba(80,77,71,0.4)",

    // League-specific accents
    nba:  "#EF7828",   // Energy Orange
    nfl:  "#206E6B",   // Vivid Teal
    mlb:  "#687C88",   // Steel Blue
    mls:  "#206E6B",   // Vivid Teal
    nhl:  "#687C88",   // Steel Blue
    ufc:  "#EF7828",   // Energy Orange
    ncaa: "#D4A843",   // Gold
  },
};
