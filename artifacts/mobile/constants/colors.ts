// Fourth Quarter — Monotone Matchday Palette (July 2026)
// Light mode follows cream/sand/orange. Night mode follows deep navy,
// lifted charcoal, and warm amber heat so the app no longer reads near-black.

const amber = "#F2A65A";      // Primary warm amber
const amber2 = "#FFC06F";     // Lighter amber
const copper = "#C86F43";     // Burnt orange / heat
const neonGreen = "#39E58C";  // LIVE indicator
const gold = "#EEC46D";       // Gold accent
const green = "#55D17F";      // Win / positive green
const blue = "#6EA7D8";       // Blue accent

export default {
  light: {
    // Text — ink over warm paper
    text:              "#243044",
    textSecondary:     "#69707A",
    textTertiary:      "#9C968D",

    // Backgrounds — left reference: paper, sand, soft warmth
    background:        "#F4EFE5",
    backgroundSecondary: "#EEE6D8",
    backgroundTertiary:  "#E3D8C8",

    // Cards — soft cream surfaces
    card:              "#FFF8EC",
    cardElevated:      "#F8F0E3",
    cardWarm:          "#F3E2CF",
    editorialSurface:  "#F6E9D9",
    previewSurface:    "#ECE5D8",
    cardBorder:        "rgba(83,64,43,0.10)",
    cardBorderActive:  "rgba(200,111,67,0.28)",

    tint:           copper,
    accent:         copper,
    accentOrange:   copper,
    accentTeal:     "#2E9D9A",
    accentGold:     "#B98232",
    accentGreen:    "#25885A",
    accentBlue:     "#426F93",
    accentAmber2:   amber2,

    live:     "#18A95D",
    liveGlow: "rgba(24,169,93,0.18)",
    liveGreen: "#25885A",

    error: "#C5483D",
    warning: "#B98232",
    success: "#25885A",

    tabBarBg:         "rgba(255,248,236,0.92)",
    tabIconDefault:   "#9C968D",
    tabIconSelected:  copper,

    separator:    "rgba(83,64,43,0.10)",
    overlay:      "rgba(36,48,68,0.38)",
    glassLight:   "rgba(36,48,68,0.04)",
    glassMedium:  "rgba(36,48,68,0.08)",
    glassHeavy:   "rgba(36,48,68,0.13)",
    glassBorder:  "rgba(200,111,67,0.18)",

    nba:   "#C85F3D",
    nfl:   "#426F93",
    mlb:   "#B9493E",
    mls:   "#2E8D66",
    nhl:   "#426F93",
    wnba:  "#D67842",
    ncaab: "#466FA9",
    ncaaf: "#73599B",
    epl:   "#4A344F",
    eplBright: "#946AA0",
    ucl:   "#415D9A",
    liga:  "#B9493E",
    ufc:   "#C85F3D",
    ncaa:  "#B98232",
    tennis:   "#82A94C",
    atp:      "#82A94C",
    wta:      "#B7558C",
    boxing:   "#9D3D35",
    olympics: "#B98232",
    xgames:   "#4C83BE",
    pga:      "#25885A",
    liv:      "#338DA6",
    f1:       "#B72E27",
    nascar:   "#B98232",

    electricLime:   "#82A94C",
  },

  dark: {
    // Text — warm cream hierarchy
    text:              "#F4EEE5",
    textSecondary:     "#B8B5AD",
    textTertiary:      "#7F8790",

    // Backgrounds — right reference: navy-charcoal night, not pure black
    background:        "#17202A",
    backgroundSecondary: "#1D2936",
    backgroundTertiary:  "#253242",

    // Cards — lifted panels with amber warmth
    card:              "#213040",
    cardElevated:      "#263648",
    cardWarm:          "#2C3540",
    editorialSurface:  "#2D3846",
    previewSurface:    "#223343",
    cardBorder:        "rgba(255,198,126,0.11)",
    cardBorderActive:  "rgba(255,198,126,0.30)",

    // Accents
    tint:           amber,
    accent:         amber,
    accentOrange:   copper,
    accentTeal:     "#57C7BD",
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
    warning: "#F59E0B",
    success: green,

    // Tab bar / floating nav
    tabBarBg:         "rgba(29,41,54,0.94)",
    tabIconDefault:   "#7F8790",
    tabIconSelected:  amber,

    // Separators
    separator:    "rgba(255,198,126,0.10)",
    overlay:      "rgba(13,19,26,0.78)",
    glassLight:   "rgba(255,248,232,0.055)",
    glassMedium:  "rgba(255,248,232,0.095)",
    glassHeavy:   "rgba(255,248,232,0.14)",
    glassBorder:  "rgba(255,198,126,0.16)",

    // League accent colors
    nba:   "#F07A3B",
    nfl:   "#6EA7D8",
    mlb:   "#E45B54",
    mls:   "#5CD28D",
    nhl:   "#6EA7D8",
    wnba:  "#EF8955",
    ncaab: "#6B8ED8",
    ncaaf: "#9D78D8",
    epl:   "#62466B",
    eplBright: "#B984C8",
    ucl:   "#637FD1",
    liga:  "#E45B54",
    ufc:   "#F07A3B",
    ncaa:  "#EEC46D",
    tennis:   "#B6DF65",
    atp:      "#B6DF65",
    wta:      "#E477AF",
    boxing:   "#CF554D",
    olympics: "#EEC46D",
    xgames:   "#72A5EA",
    pga:      "#55D17F",
    liv:      "#5ECFE4",
    f1:       "#E5483C",
    nascar:   "#F2A65A",

    // DEPRECATED — DO NOT USE (will be removed)
    // Replace C.electricLime with C.live
    electricLime:   "#B6DF65",
  },
};
