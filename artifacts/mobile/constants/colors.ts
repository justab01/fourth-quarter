// Fourth Quarter — Livescore Dark Palette (March 2026)
// Inspired by premium dark sports apps: near-black surfaces, clean white text,
// red for LIVE, orange for favorites, muted gray for secondary info

const liveRed    = "#E8162B";   // LIVE badge — bright red
const orange     = "#EF7828";   // Energy Orange — primary CTA
const gold       = "#D4A843";   // AI recap gold
const green      = "#30D158";   // Wins / positive (Apple green)
const teal       = "#2CC4BF";   // Teal accent
const vividTeal   = "#206E6B";   // Vivid Teal — secondary CTA
const graphite    = "#504D47";   // Graphite — backgrounds
const electricLime = "#BFFF00";  // Electric Lime — highlights
const charcoal    = "#1F1F1F";   // Charcoal — deep surfaces

export default {
  dark: {
    // Text — crisp white hierarchy
    text:              "#FFFFFF",
    textSecondary:     "#8A8A8E",   // iOS muted gray
    textTertiary:      "#4A4A4F",   // Very muted

    // Backgrounds — near-pure black
    background:        "#0F0F0F",
    backgroundSecondary: "#141414",
    backgroundTertiary:  "#1A1A1A",

    // Cards — dark charcoal with subtle elevation
    card:              "#1C1C1E",   // Apple dark card
    cardElevated:      "#242424",
    cardBorder:        "#2A2A2A",
    cardBorderActive:  `${liveRed}55`,

    // Accents
    tint:       orange,
    accent:     orange,            // Orange — favorites / CTA
    accentOrange: orange,
    accentTeal: teal,
    accentGold: gold,
    accentGreen: green,
    accentBlue: "#4A90D9",

    // Brand Kit Colors
    vividTeal:      vividTeal,
    brandGraphite:  graphite,
    electricLime:   electricLime,
    charcoal:       charcoal,

    graphite:   "#2A2A2A",

    // Live indicator — ALWAYS red (Livescore style)
    live:     liveRed,
    liveGlow: "rgba(232,22,43,0.22)",
    liveGreen: green,

    // Tab bar — dark, white active
    tabBarBg:         "#0F0F0F",
    tabIconDefault:   "#4A4A4F",
    tabIconSelected:  "#FFFFFF",

    // Separators
    separator:    "#222222",
    overlay:      "rgba(0,0,0,0.85)",
    glassLight:   "rgba(255,255,255,0.04)",
    glassBorder:  "#2A2A2A",

    // League accent colors (vivid but not garish)
    nba:   "#EF7828",   // Orange — NBA
    nfl:   "#4A90D9",   // Blue — NFL
    mlb:   "#E8162B",   // Red — MLB
    mls:   "#30D158",   // Green — MLS
    nhl:   "#4A90D9",   // Blue — NHL
    wnba:  "#FF6B35",   // Sunset orange — WNBA
    ncaab: "#1D4ED8",   // Royal blue — NCAA Basketball
    ncaaf: "#7C3AED",   // Purple — NCAA Football
    epl:   "#38003C",   // Premier League purple (use as tint; show as bright purple)
    eplBright: "#9B59B6", // Bright purple for display
    ucl:   "#1B3FAB",   // UCL deep blue
    liga:  "#EF4444",   // La Liga red
    ufc:   "#EF7828",   // Orange — UFC
    ncaa:  "#D4A843",   // Gold — NCAA
    // ── New sports ─────────────────────────────────────────────────────────
    tennis:   "#A3E635",   // Lime green — Tennis (ATP)
    atp:      "#A3E635",   // Lime green — ATP Men's
    wta:      "#EC4899",   // Pink — WTA Women's
    boxing:   "#B91C1C",   // Deep crimson — Boxing
    olympics: "#D4A843",   // Gold — Olympics
    xgames:   "#3B82F6",   // Electric blue — X Games / Extreme
    pga:      "#2ECC71",   // Green — PGA Golf
    liv:      "#00D4FF",   // Cyan — LIV Golf
    f1:       "#E10600",   // F1 Red
    nascar:   "#F39C12",   // NASCAR Gold/Orange
  },
};
