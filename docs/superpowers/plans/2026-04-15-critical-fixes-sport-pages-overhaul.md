# Critical Fixes + Sport Pages Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix critical bugs and overhaul sport detail pages with brand kit integration to prepare the app for publishing.

**Architecture:** Fix Watch Live button with Linking, add brand colors and typography throughout, reorganize sports categories, and enhance sport detail pages with sport-specific hero sections.

**Tech Stack:** Expo React Native, TypeScript, React Query, Express.js API, Drizzle ORM, PostgreSQL

---

## File Structure

| File | Purpose |
|------|---------|
| `artifacts/mobile/app/game/[id].tsx` | Watch Live button fix, game detail styling |
| `artifacts/mobile/constants/colors.ts` | Brand color additions |
| `artifacts/mobile/constants/sportCategories.ts` | Sports reorganization |
| `artifacts/mobile/app/(tabs)/sports.tsx` | Updated sports grid |
| `artifacts/mobile/app/sport/[id].tsx` | Sport detail page overhaul |
| `artifacts/mobile/components/GameCard.tsx` | Brand styling |
| `artifacts/api-server/src/app.ts` | CORS security, rate limiting |

---

## Task 1: Watch Live Button Fix

**Status:** COMPLETED

The Watch Live button has been fixed in `artifacts/mobile/app/game/[id].tsx`:

- Added `Linking` import from `react-native`
- Added `ESPN_SPORT_SLUGS` mapping for league → ESPN sport slug conversion
- Added `getEspnGamecastUrl()` helper function
- Changed `<View>` to `<Pressable>` with `onPress` handler

---

## Task 2: Brand Colors Update

**Files:**
- Modify: `artifacts/mobile/constants/colors.ts`

### Step 1: Add brand palette colors

- [ ] **Add brand palette colors to colors.ts**

```typescript
// Add after line 9 (after const teal = ...):

const vividTeal   = "#206E6B";   // Vivid Teal — secondary CTA
const graphite    = "#504D47";   // Graphite — backgrounds
const electricLime = "#BFFF00";  // Electric Lime — highlights
const charcoal    = "#1F1F1F";   // Charcoal — deep surfaces
```

### Step 2: Add to dark theme object

- [ ] **Add brand colors to dark theme object**

Find the `dark:` object and add these properties:

```typescript
// Add inside dark object after accentBlue line:
    // Brand Kit Colors
    vividTeal:      vividTeal,
    graphite:       graphite,
    electricLime:   electricLime,
    charcoal:       charcoal,
```

---

## Task 3: Typography Constants

**Files:**
- Create: `artifacts/mobile/constants/typography.ts`

### Step 1: Create typography constants

- [ ] **Create typography.ts with brand fonts**

```typescript
// Fourth Quarter Typography Constants
// Black Ops One (display), Barlow Condensed (subheadings), Barlow (body), JetBrains Mono (data)

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
```

---

## Task 4: Sports Category Reorganization

**Files:**
- Modify: `artifacts/mobile/constants/sportCategories.ts`

### Step 1: Reorganize SPORT_CATEGORIES array

- [ ] **Update SPORT_CATEGORIES to use 10 parent categories**

The current structure already groups sports well. The main change is adding parent category metadata for filtering. Add `parentCategory` field to each entry:

```typescript
// Add after SportCategory type definition:
export type ParentCategory = 
  | "football" 
  | "basketball" 
  | "baseball" 
  | "hockey" 
  | "soccer" 
  | "combat" 
  | "tennis" 
  | "golf" 
  | "olympics" 
  | "xgames";

// Extend SportCategory type:
export type SportCategory = {
  id: string;
  name: string;
  emoji: string;
  icon: string;
  color: string;
  gradient: [string, string];
  leagues: SportLeague[];
  tagline: string;
  parentCategory?: ParentCategory;  // Add this
};
```

### Step 2: Add Olympics and X Games categories

- [ ] **Add Olympics and X Games entries to SPORT_CATEGORIES**

Add after the `college` entry:

```typescript
  {
    id: "olympics",
    name: "Olympics",
    emoji: "🏅",
    icon: "medal-outline",
    color: "#D4A843",
    gradient: ["#D4A843", "#8B6914"],
    tagline: "Summer · Winter Games",
    leagues: [
      { key: "OLYMPICS", label: "Olympics" },
    ],
    parentCategory: "olympics",
  },
  {
    id: "xgames",
    name: "X Games",
    emoji: "🛹",
    icon: "bicycle-outline",
    color: "#3B82F6",
    gradient: ["#3B82F6", "#1E40AF"],
    tagline: "Extreme Sports",
    leagues: [
      { key: "XGAMES", label: "X Games" },
    ],
    parentCategory: "xgames",
  },
```

---

## Task 5: Sport Detail Page Hero Enhancement

**Files:**
- Modify: `artifacts/mobile/app/sport/[id].tsx`

### Step 1: Add sport-specific gradient backgrounds

- [ ] **Update hero section with sport-specific gradients**

The file already has `getSportVenueGradient` in game detail. Add similar function to sport page:

```typescript
// Add after existing imports around line 29:

function getSportHeroGradient(sportId: string): [string, string, string] {
  const gradients: Record<string, [string, string, string]> = {
    basketball: ["#E8503A", "#9B2617", "#4A0A05"],
    football:   ["#8B7355", "#52432F", "#1A1208"],
    baseball:   ["#3B6DB8", "#1E3D6B", "#0A1525"],
    hockey:     ["#4A90D9", "#1E5293", "#0A1835"],
    soccer:     ["#27AE60", "#145A32", "#052A12"],
    golf:       ["#2ECC71", "#0E6B38", "#053320"],
    tennis:     ["#CDDC39", "#4A5010", "#1A1D05"],
    combat:     ["#E74C3C", "#7B241C", "#2A0A08"],
    college:    ["#5B3E96", "#2E1F4D", "#120A1F"],
    olympics:   ["#D4A843", "#8B6914", "#2A1D05"],
    xgames:     ["#3B82F6", "#1E40AF", "#0A1535"],
  };
  return gradients[sportId] ?? ["#333333", "#1A1A1A", "#0F0F0F"];
}
```

---

## Task 6: API Security Hardening

**Files:**
- Modify: `artifacts/api-server/src/app.ts`

### Step 1: Add rate limiting

- [ ] **Install and configure express-rate-limit**

```bash
pnpm add express-rate-limit --filter @workspace/api-server
```

```typescript
// Add to app.ts after cors import:
import rateLimit from "express-rate-limit";

// Add after cors middleware:
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);
```

### Step 2: Restrict CORS origins

- [ ] **Configure CORS with origin whitelist**

```typescript
// Replace app.use(cors()) with:
app.use(cors({
  origin: [
    "http://localhost:19006",     // Expo dev
    "http://localhost:3000",       // Local web
    "http://localhost:8081",       // Expo alternative
    /^exp:\/\/\d+\.\d+\.\d+\.\d+:\d+$/, // Expo LAN URLs
  ],
  credentials: true,
}));
```

---

## Task 7: GameCard Brand Styling

**Files:**
- Modify: `artifacts/mobile/components/GameCard.tsx`

### Step 1: Update colors to use brand palette

- [ ] **Import and use brand colors in GameCard**

```typescript
// At top of file, add after Colors import:
import Colors, { vividTeal, electricLime } from "@/constants/colors";

// In styles, update accent colors:
const C = Colors.dark;

// Update live badge to use electricLime for highlights
liveBadge: {
  backgroundColor: electricLime,
  // ... rest of styles
},
```

---

## Task 8: Error Boundary Brand Styling

**Files:**
- Modify: `artifacts/mobile/components/ErrorFallback.tsx`

### Step 1: Update error fallback with brand styling

- [ ] **Apply brand colors to error fallback**

```typescript
// Update ErrorFallback.tsx to use brand colors
import Colors from "@/constants/colors";

const C = Colors.dark;

// Use C.accent for retry button
// Use C.text for error message
// Use C.graphite for background
```

---

## Task 9: Verification

### Step 1: Run type checking

- [ ] **Run TypeScript type checking**

```bash
pnpm run typecheck
```

### Step 2: Test Watch Live button

- [ ] **Verify Watch Live button opens ESPN gamecast**

1. Open app in Expo
2. Navigate to a live game
3. Tap "Watch Live" pill
4. Verify ESPN gamecast URL opens in browser

### Step 3: Test sport pages

- [ ] **Verify sport pages load correctly**

1. Navigate to Sports tab
2. Tap each sport category
3. Verify page loads with correct gradient and data

---

## Task 10: Commit Changes

### Step 1: Stage and commit

- [ ] **Commit all changes**

```bash
git add artifacts/mobile/app/game/[id].tsx
git add artifacts/mobile/constants/colors.ts
git add artifacts/mobile/constants/sportCategories.ts
git add artifacts/mobile/app/sport/[id].tsx
git add artifacts/api-server/src/app.ts
git add artifacts/mobile/components/
git commit -m "feat: fix Watch Live button, add brand kit colors, harden API security

- Fix Watch Live button to open ESPN gamecast URL
- Add brand palette (vivid teal, graphite, electric lime, charcoal)
- Add typography constants for Black Ops One, Barlow, JetBrains Mono
- Add Olympics and X Games sport categories
- Add rate limiting and CORS restrictions to API
- Apply brand styling to GameCard and ErrorFallback

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Summary

This plan covers:
1. ✅ Watch Live button fix (completed)
2. Brand color palette additions
3. Typography constants
4. Sports category reorganization
5. Sport detail page hero enhancements
6. API security hardening
7. Component brand styling
8. Verification and commit

Each task is self-contained and produces working, testable software.