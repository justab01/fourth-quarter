# Fourth Quarter Design System Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unify typography, colors, and architecture across Fourth Quarter mobile app for a cohesive premium experience.

**Architecture:** Update typography.ts to use Inter fonts (matching actual usage), add missing colors to colors.ts, create shared style patterns, then systematically fix all files.

**Tech Stack:** React Native (Expo), TypeScript, FONTS typography constants, C.* color constants

---

## Files Structure

| File | Purpose | Action |
|------|---------|--------|
| `constants/typography.ts` | Define font families | MODIFY - Use Inter fonts |
| `constants/colors.ts` | Color palette | MODIFY - Add error, glassMedium, glassHeavy |
| `constants/sharedStyles.ts` | Reusable style patterns | CREATE |
| `constants/leagueColors.ts` | League color constants | CREATE |
| `components/shared/PulsingLiveDot.tsx` | Animated live indicator | CREATE |
| `**/*.tsx` (30+ files) | Typography fixes | MODIFY |
| `**/*.tsx` (25+ files) | Color fixes | MODIFY |

---

## Task 1: Update Typography Constants

**Files:**
- Modify: `artifacts/mobile/constants/typography.ts`

- [ ] **Step 1: Update FONTS to use Inter**

Replace the entire FONTS export with:

```typescript
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
```

- [ ] **Step 2: Add missing font sizes**

Add to FONT_SIZES:

```typescript
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
```

- [ ] **Step 3: Commit**

```bash
git add artifacts/mobile/constants/typography.ts
git commit -m "feat: update typography constants to use Inter fonts"
```

---

## Task 2: Update Color Constants

**Files:**
- Modify: `artifacts/mobile/constants/colors.ts`

- [ ] **Step 1: Add missing colors to dark palette**

Add after `liveGlow`:

```typescript
    // Error/Loss
    error: "#EF4444",

    // Glass/overlay (for rgba replacements)
    glassLight: "rgba(255,255,255,0.04)",
    glassMedium: "rgba(255,255,255,0.08)",
    glassHeavy: "rgba(255,255,255,0.12)",
```

- [ ] **Step 2: Add deprecation comments**

Add comment above the legacy section:

```typescript
    // DEPRECATED — DO NOT USE (will be removed)
    // Replace C.electricLime with C.live
    // Remove C.vividTeal, C.brandGraphite, C.charcoal, C.graphite
```

- [ ] **Step 3: Commit**

```bash
git add artifacts/mobile/constants/colors.ts
git commit -m "feat: add error, glassMedium, glassHeavy colors"
```

---

## Task 3: Create Shared Styles

**Files:**
- Create: `artifacts/mobile/constants/sharedStyles.ts`

- [ ] **Step 1: Create sharedStyles.ts**

```typescript
import Colors from "./colors";
import { SPACING, RADIUS } from "./theme";

const C = Colors.dark;

export const sharedStyles = {
  // Standard card container
  cardContainer: {
    backgroundColor: C.card,
    borderRadius: RADIUS.lg,
    overflow: "hidden" as const,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },

  // Chip/pill button
  chipButton: {
    borderRadius: RADIUS.pill,
    backgroundColor: C.card,
    borderWidth: 1.5,
    borderColor: C.cardBorder,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },

  // Live badge
  liveBadge: {
    backgroundColor: C.live,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },

  // Section header text
  sectionHeader: {
    fontSize: 18,
    fontWeight: "800" as const,
    letterSpacing: -0.3,
  },

  // Glass overlay
  glassOverlay: {
    backgroundColor: C.glassLight,
  },
};

export default sharedStyles;
```

- [ ] **Step 2: Commit**

```bash
git add artifacts/mobile/constants/sharedStyles.ts
git commit -m "feat: create shared style patterns"
```

---

## Task 4: Create League Colors

**Files:**
- Create: `artifacts/mobile/constants/leagueColors.ts`

- [ ] **Step 1: Create leagueColors.ts**

```typescript
export const LEAGUE_COLORS: Record<string, string> = {
  NBA: "#EF7828",
  WNBA: "#FF6B35",
  NFL: "#4A90D9",
  MLB: "#E8162B",
  MLS: "#30D158",
  NHL: "#4A90D9",
  NCAAB: "#1D4ED8",
  NCAAF: "#7C3AED",
  EPL: "#38003C",
  EPLBright: "#9B59B6",
  UCL: "#1B3FAB",
  LIGA: "#EF4444",
  UFC: "#EF7828",
  BOXING: "#B91C1C",
  ATP: "#A3E635",
  WTA: "#EC4899",
  F1: "#E10600",
  NASCAR: "#F39C12",
  PGA: "#2ECC71",
  LIV: "#00D4FF",
};

export default LEAGUE_COLORS;
```

- [ ] **Step 2: Commit**

```bash
git add artifacts/mobile/constants/leagueColors.ts
git commit -m "feat: create centralized league colors"
```

---

## Task 5: Create PulsingLiveDot Component

**Files:**
- Create: `artifacts/mobile/components/shared/PulsingLiveDot.tsx`

- [ ] **Step 1: Create the component**

```typescript
import React, { useEffect, useRef } from "react";
import { View, Animated } from "react-native";
import Colors from "@/constants/colors";

const C = Colors.dark;

interface PulsingLiveDotProps {
  size?: number;
  color?: string;
}

export function PulsingLiveDot({ size = 6, color = C.live }: PulsingLiveDotProps) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.5] });
  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 0.2] });

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Animated.View
        style={{
          position: "absolute",
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          transform: [{ scale }],
          opacity,
        }}
      />
      <View style={{ width: size * 0.7, height: size * 0.7, borderRadius: (size * 0.7) / 2, backgroundColor: color }} />
    </View>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add artifacts/mobile/components/shared/PulsingLiveDot.tsx
git commit -m "feat: create shared PulsingLiveDot component"
```

---

## Task 6: Typography Fixes — Core Components (Batch 1)

**Files:**
- Modify: `artifacts/mobile/components/ProfileButton.tsx`
- Modify: `artifacts/mobile/components/RecapCard.tsx`
- Modify: `artifacts/mobile/components/LiveTrackerPanel.tsx`
- Modify: `artifacts/mobile/components/SearchModal.tsx`
- Modify: `artifacts/mobile/components/NewsCard.tsx`
- Modify: `artifacts/mobile/components/GameCard.tsx`

- [ ] **Step 1: Add FONTS import to each file**

At the top of each file, add:

```typescript
import { FONTS, FONT_SIZES } from "@/constants/typography";
```

- [ ] **Step 2: Replace all `"Inter_700Bold"` with `FONTS.bodyBold`**

Find and replace pattern across all 6 files.

- [ ] **Step 3: Replace all `"Inter_600SemiBold"` with `FONTS.bodySemiBold`**

- [ ] **Step 4: Replace all `"Inter_500Medium"` with `FONTS.bodyMedium`**

- [ ] **Step 5: Replace all `"Inter_400Regular"` with `FONTS.body`**

- [ ] **Step 6: Replace all `"Inter_800ExtraBold"` with `FONTS.bodyHeavy`**

- [ ] **Step 7: Commit**

```bash
git add artifacts/mobile/components/
git commit -m "fix: replace hardcoded fonts with FONTS constants (components)"
```

---

## Task 7: Typography Fixes — Team Components (Batch 2)

**Files:**
- Modify: `artifacts/mobile/components/team/TabBar.tsx`
- Modify: `artifacts/mobile/components/team/StatsTab.tsx`
- Modify: `artifacts/mobile/components/team/GameCard.tsx`
- Modify: `artifacts/mobile/components/team/HeroSection.tsx`
- Modify: `artifacts/mobile/components/team/RosterTab.tsx`

- [ ] **Step 1: Add FONTS import**

- [ ] **Step 2: Replace all Inter font strings with FONTS constants**

- [ ] **Step 3: Commit**

```bash
git add artifacts/mobile/components/team/
git commit -m "fix: replace hardcoded fonts in team components"
```

---

## Task 8: Typography Fixes — App Screens (Batch 3)

**Files:**
- Modify: `artifacts/mobile/app/(tabs)/index.tsx`
- Modify: `artifacts/mobile/app/(tabs)/live.tsx`
- Modify: `artifacts/mobile/app/(tabs)/profile.tsx`
- Modify: `artifacts/mobile/app/(tabs)/sports.tsx`
- Modify: `artifacts/mobile/app/(tabs)/news.tsx`
- Modify: `artifacts/mobile/app/(tabs)/standings.tsx`

- [ ] **Step 1: Add FONTS import**

- [ ] **Step 2: Replace all Inter font strings with FONTS constants**

- [ ] **Step 3: Commit**

```bash
git add artifacts/mobile/app/\(tabs\)/
git commit -m "fix: replace hardcoded fonts in tab screens"
```

---

## Task 9: Typography Fixes — Detail Screens (Batch 4)

**Files:**
- Modify: `artifacts/mobile/app/game/[id].tsx`
- Modify: `artifacts/mobile/app/player/[id].tsx`
- Modify: `artifacts/mobile/app/sport/[id].tsx`
- Modify: `artifacts/mobile/app/draft/[league].tsx`
- Modify: `artifacts/mobile/app/article/[id].tsx`
- Modify: `artifacts/mobile/app/onboarding.tsx`
- Modify: `artifacts/mobile/app/team/[id].tsx`

- [ ] **Step 1: Add FONTS import**

- [ ] **Step 2: Replace all Inter font strings with FONTS constants**

- [ ] **Step 3: Commit**

```bash
git add artifacts/mobile/app/
git commit -m "fix: replace hardcoded fonts in detail screens"
```

---

## Task 10: Color Fixes — Replace electricLime

**Files:**
- Modify: `artifacts/mobile/components/GameCard.tsx`
- Modify: `artifacts/mobile/app/(tabs)/live.tsx`
- Modify: `artifacts/mobile/app/(tabs)/sports.tsx`
- Modify: `artifacts/mobile/app/sport/[id].tsx`

- [ ] **Step 1: Replace all `C.electricLime` with `C.live`**

Find and replace: `C.electricLime` → `C.live`

- [ ] **Step 2: Commit**

```bash
git add artifacts/mobile/
git commit -m "fix: replace deprecated C.electricLime with C.live"
```

---

## Task 11: Color Fixes — Replace #fff with C.text

**Files:**
- 25+ files across components and app

- [ ] **Step 1: Replace `color: "#fff"` with `color: C.text`**

Use find and replace. Skip cases where `#fff` is intentionally contrasting on a colored background.

- [ ] **Step 2: Replace `color: "#FFF"` with `color: C.text`**

- [ ] **Step 3: Commit**

```bash
git add artifacts/mobile/
git commit -m "fix: replace hardcoded #fff with C.text"
```

---

## Task 12: Color Fixes — Replace gray colors

**Files:**
- Multiple files

- [ ] **Step 1: Replace `color: "#AEAEB2"` with `color: C.textSecondary`**

- [ ] **Step 2: Replace `color: "#888"` with `color: C.textSecondary`**

- [ ] **Step 3: Replace `color: "#8A8A8E"` with `color: C.textSecondary`**

- [ ] **Step 4: Commit**

```bash
git add artifacts/mobile/
git commit -m "fix: replace hardcoded gray colors with C.textSecondary"
```

---

## Task 13: Color Fixes — Replace rgba values

**Files:**
- Multiple files

- [ ] **Step 1: Replace `rgba(255,255,255,0.04)` with `C.glassLight`**

- [ ] **Step 2: Replace `rgba(255,255,255,0.08)` with `C.glassMedium`**

- [ ] **Step 3: Commit**

```bash
git add artifacts/mobile/
git commit -m "fix: replace rgba values with glass constants"
```

---

## Task 14: Remove deprecated color usage

**Files:**
- Multiple files

- [ ] **Step 1: Remove any usage of C.vividTeal, C.brandGraphite, C.charcoal, C.graphite**

Search for these and replace with appropriate alternatives:
- `C.vividTeal` → `C.accentTeal`
- `C.brandGraphite` → `C.textSecondary`
- `C.charcoal` → `C.backgroundSecondary`
- `C.graphite` → `C.textSecondary`

- [ ] **Step 2: Commit**

```bash
git add artifacts/mobile/
git commit -m "fix: remove deprecated color usage"
```

---

## Task 15: Polish Team Landing Page

**Files:**
- Modify: `artifacts/mobile/components/team/HeroSection.tsx`
- Modify: `artifacts/mobile/components/team/TabBar.tsx`
- Modify: `artifacts/mobile/components/team/ScoresTab.tsx`
- Modify: `artifacts/mobile/components/team/StatsTab.tsx`
- Modify: `artifacts/mobile/components/team/RosterTab.tsx`
- Modify: `artifacts/mobile/components/team/StandingsTab.tsx`
- Modify: `artifacts/mobile/components/team/NewsTab.tsx`

- [ ] **Step 1: Ensure all FONTS imports present**

- [ ] **Step 2: Ensure all Colors imports use C.* constants**

- [ ] **Step 3: Replace any remaining hardcoded colors**

- [ ] **Step 4: Verify visual appearance**

Run the app and check team page at `/team/houston-rockets`

- [ ] **Step 5: Commit**

```bash
git add artifacts/mobile/components/team/
git commit -m "polish: team landing page typography and colors"
```

---

## Task 16: Final Verification

**Files:**
- All modified files

- [ ] **Step 1: Search for remaining hardcoded fonts**

```bash
grep -r "Inter_" artifacts/mobile --include="*.tsx" | grep -v "node_modules"
```

Expected: Only legitimate uses (like font loading in _layout.tsx)

- [ ] **Step 2: Search for remaining deprecated colors**

```bash
grep -r "electricLime\|vividTeal\|brandGraphite\|charcoal\|graphite" artifacts/mobile --include="*.tsx" | grep -v "node_modules\|colors.ts"
```

Expected: No results

- [ ] **Step 3: Search for remaining #fff outside of valid contexts**

```bash
grep -r 'color: "#fff' artifacts/mobile --include="*.tsx" | grep -v "node_modules\|gradient\|background"
```

Expected: Minimal results (only intentional uses)

- [ ] **Step 4: Run type check**

```bash
cd artifacts/mobile && pnpm typecheck
```

Expected: No errors

- [ ] **Step 5: Commit any final fixes**

```bash
git add .
git commit -m "chore: final verification and cleanup"
```