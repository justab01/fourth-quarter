// Fourth Quarter — Warm Dark Palette (April 2026)
// Warm dark sports OS: amber accent, neon green for LIVE,
// near-black warm surfaces, cream text

const amber    = "#E8820C";   // Primary warm amber
const amber2   = "#F5A340";   // Lighter amber
const neonGreen = "#00FF87";  // Neon green — LIVE indicator
const gold     = "#F1C40F";   // Gold accent
const green    = "#2ECC71";   // Win / positive green
const blue     = "#3498DB";   // Blue accent

export default {
  dark: {
    // Text — warm cream hierarchy
    text:              "#F0ECE4",
    textSecondary:     "#8C8070",
    textTertiary:      "#4A4035",

    // Backgrounds — warm dark
    background:        "#0A0805",
    backgroundSecondary: "#100E09",
    backgroundTertiary:  "#16130D",

    // Cards — warm charcoal surfaces
    card:              "#16130D",
    cardElevated:      "#1C1812",
    cardBorder:        "rgba(255,200,100,0.07)",
    cardBorderActive:  "rgba(255,200,100,0.22)",

    // Accents
    tint:           amber,
    accent:         amber,
    accentOrange:   amber,
    accentTeal:     "#2CC4BF",
    accentGold:     gold,
    accentGreen:    green,
    accentBlue:     blue,
    accentAmber2:   amber2,

    // Live indicator — neon green
    live:     neonGreen,
    liveGlow: "rgba(0,255,135,0.22)",
    liveGreen: green,

    // Error/Loss
    error: "#EF4444",

    // Tab bar / floating nav
    tabBarBg:         "rgba(14,12,9,0.94)",
    tabIconDefault:   "#4A4035",
    tabIconSelected:  amber,

    // Separators
    separator:    "rgba(255,200,100,0.07)",
    overlay:      "rgba(0,0,0,0.85)",
    glassLight:   "rgba(255,255,255,0.04)",
    glassMedium:  "rgba(255,255,255,0.08)",
    glassHeavy:   "rgba(255,255,255,0.12)",
    glassBorder:  "rgba(255,200,100,0.1)",

    // League accent colors
    nba:   "#EF7828",
    nfl:   "#4A90D9",
    mlb:   "#E8162B",
    mls:   "#30D158",
    nhl:   "#4A90D9",
    wnba:  "#FF6B35",
    ncaab: "#1D4ED8",
    ncaaf: "#7C3AED",
    epl:   "#38003C",
    eplBright: "#9B59B6",
    ucl:   "#1B3FAB",
    liga:  "#EF4444",
    ufc:   "#EF7828",
    ncaa:  "#D4A843",
    tennis:   "#A3E635",
    atp:      "#A3E635",
    wta:      "#EC4899",
    boxing:   "#B91C1C",
    olympics: "#D4A843",
    xgames:   "#3B82F6",
    pga:      "#2ECC71",
    liv:      "#00D4FF",
    f1:       "#E10600",
    nascar:   "#F39C12",

    // DEPRECATED — DO NOT USE (will be removed)
    // Replace C.electricLime with C.live
    // Remove C.vividTeal, C.brandGraphite, C.charcoal, C.graphite
    vividTeal:      "#206E6B",
    brandGraphite:  "#504D47",
    electricLime:   "#BFFF00",
    charcoal:       "#1F1F1F",
    graphite:       "#2A2A2A",
  },
};
