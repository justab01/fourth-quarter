# Fourth Quarter Design System — Cohesive Redesign

**Date:** 2026-04-18
**Status:** Ready for Implementation

---

## Vision

"Fourth Quarter — The sports app for the modern excellence-focused human."

Premium, intentional, cohesive. Every element exists for a reason. No visual noise. No mixed signals. Just pure sports excellence.

---

## Phase 1: App-Wide Polish Pass

### Audit Findings Summary

| Audit | Files Affected | Issues Found |
|-------|---------------|--------------|
| Typography | 30+ files | All using hardcoded Inter fonts instead of FONTS system |
| Colors | 25+ files | 80+ hardcoded hex colors, deprecated color usage |
| Architecture | 10+ files | Large components (1000+ lines), duplicate patterns |

### Typography Issues

**Critical:** Only `BasketballHub.tsx` correctly uses the typography system.

**Problem:** 30+ files use hardcoded `"Inter_700Bold"`, `"Inter_600SemiBold"`, etc. instead of:
- `FONTS.display` (Oswald for scores/headers)
- `FONTS.body`, `FONTS.bodyBold` (Plus Jakarta Sans for text)
- `FONTS.mono` (DM Mono for data/tags)

**Fix Required:** Replace all `fontFamily: "Inter_*"` with `FONTS.*` constants.

### Color Issues

**Deprecated Colors Still Used:**
- `C.electricLime` (17 instances) → Replace with `C.live`
- `C.vividTeal`, `C.brandGraphite`, `C.charcoal`, `C.graphite` → Remove entirely

**Hardcoded Colors to Replace:**
- `#fff` (60+ instances) → `C.text`
- `#AEAEB2` (10+ instances) → `C.textSecondary`
- `#888` (15+ instances) → `C.textSecondary`
- `rgba(255,255,255,0.04-0.1)` (50+ instances) → `C.glassLight`, `C.glassBorder`

**Missing Colors to Define:**
- `C.error` — For loss/error states
- `C.glassMedium` — For medium opacity backgrounds
- `C.glassHeavy` — For heavy opacity backgrounds

### Architecture Issues

**Large Files to Split:**
| File | Lines | Action |
|------|-------|--------|
| `app/(tabs)/index.tsx` | 997 | Extract 8+ inline components |
| `components/GameCard.tsx` | 1024 | Split by variant (Hero, Compact, Default) |
| `app/(tabs)/live.tsx` | 823 | Extract CalendarStrip, LeagueSectionHeader |
| `components/BasketballHub.tsx` | 1162 | Already well-structured but could modularize |

**Duplicate Patterns to Extract:**
- `LEAGUE_COLORS` object → Create `constants/leagueColors.ts`
- `PulsingLiveDot` component → Create `components/shared/PulsingLiveDot.tsx`
- Card container styles → Create `constants/sharedStyles.ts`
- Chip/pill button styles → Create `constants/sharedStyles.ts`

---

## Phase 2: Brand Identity System

### Typography (ENFORCE STRICTLY)

```typescript
// constants/typography.ts — UPDATE TO MATCH ACTUAL USAGE
export const FONTS = {
  // Display — Scores, headers, big numbers
  display: "Oswald_700Bold",
  displayMedium: "Oswald_500Medium",
  
  // Body — All text content
  body: "Inter_400Regular",
  bodyMedium: "Inter_500Medium",
  bodySemiBold: "Inter_600SemiBold",
  bodyBold: "Inter_700Bold",
  bodyHeavy: "Inter_800ExtraBold",
  
  // Mono — Data, tags, league labels
  mono: "DMMono_400Regular",
  monoBold: "DMMono_500Medium",
} as const;
```

**Rules:**
- Scores → `FONTS.display`
- Body text → `FONTS.body` variants
- Data/tags → `FONTS.mono`
- NO other font families allowed

### Color System (CLEAN UP)

```typescript
// constants/colors.ts — ADD MISSING COLORS
export default {
  dark: {
    // Text hierarchy (warm cream)
    text: "#F0ECE4",
    textSecondary: "#8C8070",
    textTertiary: "#4A4035",
    
    // Backgrounds (warm dark)
    background: "#0A0805",
    backgroundSecondary: "#100E09",
    backgroundTertiary: "#16130D",
    
    // Cards
    card: "#16130D",
    cardElevated: "#1C1812",
    cardBorder: "rgba(255,200,100,0.07)",
    
    // Accents
    accent: "#E8820C",        // Primary amber
    live: "#00FF87",          // Neon green for LIVE
    accentGold: "#F1C40F",    // Gold
    accentGreen: "#2ECC71",   // Win/positive
    accentTeal: "#2CC4BF",    // Teal accent
    error: "#EF4444",         // NEW: Loss/error
    
    // Glass/overlay
    glassLight: "rgba(255,255,255,0.04)",
    glassMedium: "rgba(255,255,255,0.08)",
    glassBorder: "rgba(255,200,100,0.1)",
    overlay: "rgba(0,0,0,0.85)",
    
    // League colors (keep existing)
    nba: "#EF7828",
    nfl: "#4A90D9",
    // ... etc
    
    // DEPRECATED — REMOVE USAGE
    electricLime: "#BFFF00",   // Replace with C.live
    vividTeal: "#206E6B",      // Remove
    brandGraphite: "#504D47", // Remove
    charcoal: "#1F1F1F",      // Remove
    graphite: "#2A2A2A",       // Remove
  },
};
```

**Rules:**
- Primary accent → `C.accent` (amber)
- LIVE indicator → `C.live` (neon green)
- Win → `C.accentGreen`
- Error/Loss → `C.error`
- NO hardcoded hex colors
- NO deprecated palette colors

### Spacing & Radius (ALREADY DEFINED, ENFORCE)

```typescript
SPACING = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 }
RADIUS = { xs: 6, sm: 8, md: 10, card: 14, lg: 16, hero: 20, pill: 22 }
```

**Rules:**
- Always use SPACING constants
- Always use RADIUS constants
- NO magic numbers for padding/margin/borderRadius

---

## Phase 3: Team Landing Page (Tighten Up)

Based on existing spec at `2026-04-18-team-landing-page-redesign.md`.

### Current State

Components exist in `components/team/`:
- `HeroSection.tsx` ✅ — Has personality badge, stat grid
- `TabBar.tsx` ✅ — Tab navigation
- `ScoresTab.tsx` ✅ — Recent games
- `StatsTab.tsx` ✅ — Team stats
- `RosterTab.tsx` ✅ — Player roster
- `StandingsTab.tsx` ✅ — Standings table
- `NewsTab.tsx` ✅ — Team news

### Fixes Needed

1. **Typography** — Replace hardcoded Inter with FONTS
2. **Colors** — Replace hardcoded colors with C.* constants
3. **Polish** — Add missing visual bars for stats
4. **Starter prominence** — Improve roster starter cards

---

## Implementation Plan

### Step 1: Update Typography System
1. Update `constants/typography.ts` to use Inter fonts (matching actual usage)
2. Create find-replace script for all `"Inter_*"` → `FONTS.*`
3. Run across all files

### Step 2: Update Color System
1. Add missing colors to `constants/colors.ts` (error, glassMedium, etc.)
2. Replace all `C.electricLime` with `C.live`
3. Replace all `#fff` with `C.text` (where appropriate)
4. Replace all `#AEAEB2` with `C.textSecondary`
5. Replace rgba() values with glass constants

### Step 3: Create Shared Styles
1. Create `constants/sharedStyles.ts` with:
   - `cardContainer` — Standard card styling
   - `chipButton` — Pill/chip button styling
   - `liveBadge` — Live indicator styling
   - `sectionHeader` — Section title styling
2. Import and use across components

### Step 4: Extract Duplicate Components
1. Create `constants/leagueColors.ts`
2. Create `components/shared/PulsingLiveDot.tsx`
3. Update imports in all files

### Step 5: Split Large Components
1. Split `GameCard.tsx` by variant
2. Split `index.tsx` home components
3. Split `live.tsx` calendar and headers

### Step 6: Polish Team Page
1. Apply typography fixes
2. Apply color fixes
3. Add visual stat bars
4. Improve starter cards

---

## Files to Modify (Priority Order)

| Priority | File | Changes |
|----------|------|---------|
| 1 | `constants/colors.ts` | Add error, glassMedium, glassHeavy |
| 2 | `constants/typography.ts` | Update FONTS to use Inter |
| 3 | All 30+ `.tsx` files | Typography fixes |
| 4 | All 25+ `.tsx` files | Color fixes |
| 5 | `constants/sharedStyles.ts` | CREATE - shared style patterns |
| 6 | `constants/leagueColors.ts` | CREATE - single source of truth |
| 7 | `components/shared/PulsingLiveDot.tsx` | CREATE - shared component |
| 8 | `components/team/*.tsx` | Polish team page |

---

## Success Criteria

1. **Zero hardcoded fonts** — All use FONTS.* constants
2. **Zero deprecated colors** — electricLime, vividTeal, etc. removed
3. **Minimal hardcoded hex** — Only team-specific colors
4. **Consistent spacing** — All use SPACING.* constants
5. **Shared patterns extracted** — No duplicate StyleSheet.create for same patterns
6. **Team page polished** — Matches design spec