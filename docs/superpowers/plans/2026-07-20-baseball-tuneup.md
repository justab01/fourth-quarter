# Baseball Tune-Up Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish baseball to a polished bar — real ballpark photos, one unified stats surface, baseball-shaped standings, on-brand type — and fix the shared sport-page font that affects every sport.

**Architecture:** Phase 0 fixes typography in the shared `app/sport/[id].tsx`. Phase 1 adds a self-contained ballpark-image module consumed via one resolver, retires the legacy flat game tabs for MLB so the swipe-up hub is canonical, branches baseball standings into their own shape, and polishes the baseball sport page. Each task ships on its own branch off `main`, reviewed by a subagent, verified on the live Vercel deploy, then merged.

**Tech Stack:** Expo React Native (SDK 54, react-native-web), expo-router, TypeScript, StyleSheet, Oswald/Inter/DM Mono fonts, Express API server, Vercel git-connected auto-deploy.

## Global Constraints

- **No fabricated data.** Every optional field (attendance, weather, odds, stats) is sourced-or-omitted. Never invent placeholder metrics. (Verbatim principle from existing hub code.)
- **Fonts:** body/UI = Inter (`FONTS.body*`), display/scores/headers = Oswald (`FONTS.display` / `FONTS.displayMedium`), data/tags = DM Mono (`FONTS.mono*`). Defined in `artifacts/mobile/constants/typography.ts`.
- **Never a broken image.** Any unmapped/failed ballpark photo falls back to the existing gradient — no broken-image box.
- **MLB-scoped retirement.** Flat-tab removal applies to `league === "MLB"` only; other leagues keep their flat tabs untouched.
- **Verification per task:** `./node_modules/.bin/tsc --noEmit` (from `artifacts/mobile`, allow up to 560000ms) must pass; then subagent review; then live-deploy visual verify; then merge.
- **Repo:** `/Users/justab/Documents/The 4th Quarter` (note trailing space). No pnpm/corepack in shell — use `./node_modules/.bin/*` binaries directly.

---

### Task 0: Font foundation — Oswald display into sport pages (Phase 0)

**Files:**
- Modify: `artifacts/mobile/app/sport/[id].tsx` (StyleSheet block — header/title/big-number styles)
- Reference (do not modify): `artifacts/mobile/app/(tabs)/index.tsx` (home font usage), `artifacts/mobile/constants/typography.ts`

**Interfaces:**
- Consumes: `FONTS.display` (`"Oswald_700Bold"`), `FONTS.displayMedium` (`"Oswald_500Medium"`) from typography.ts.
- Produces: nothing new exported; a sport page whose header/stat-number typography matches home.

- [ ] **Step 1: Inventory the sport-page type hierarchy**

Run from repo root:
```bash
cd "/Users/justab/Documents/The 4th Quarter" && grep -nE "fontFamily: (FONTS\.[A-Za-z]+|p)" artifacts/mobile/app/sport/\[id\].tsx
```
Identify the styles used for: the sport hero/title, section titles, and large stat numbers (leaders' values, ranking numbers). These are the ones that should be Oswald. Note the two `fontFamily: p` dynamic usages and what `p` resolves to.

- [ ] **Step 2: Cross-check home's display usage**

```bash
grep -nB2 -A1 "FONTS.display" artifacts/mobile/app/\(tabs\)/index.tsx
```
Confirm which roles use `FONTS.display` on home (hero numbers, big headers) so the sport page mirrors the same roles — not a blanket swap.

- [ ] **Step 3: Switch header/number styles to Oswald**

In `sport/[id].tsx` StyleSheet, change `fontFamily` to `FONTS.display` for: the sport hero title, primary section titles, and large stat/ranking numbers. Leave body/label/caption styles on Inter (`FONTS.body*`). Resolve any `fontFamily: p` to an explicit `FONTS.*` value matching its role. Do **not** change layout, sizes, or logic — font family only (adjust `letterSpacing`/`lineHeight` only if Oswald visibly needs it).

- [ ] **Step 4: Typecheck**

```bash
cd "/Users/justab/Documents/The 4th Quarter/artifacts/mobile" && ../../node_modules/.bin/tsc --noEmit
```
Expected: exit 0.

- [ ] **Step 5: Subagent review**

Dispatch `feature-dev:code-reviewer` on the `sport/[id].tsx` diff. Prompt: "Review this typography change for correctness and consistency: are display-font roles (hero title, section headers, big numbers) now Oswald while body copy stays Inter, matching app/(tabs)/index.tsx? Any header left flat that home would render as Oswald? Any role over-swapped (body text wrongly on Oswald)?" Fix any confirmed finding.

- [ ] **Step 6: Web-verify**

Build web export, serve locally, load the baseball sport page (`/sport/baseball`), confirm headers/numbers render in Oswald and match home's feel. Screenshot for the user.

- [ ] **Step 7: Commit + merge**

```bash
git add artifacts/mobile/app/sport/\[id\].tsx
git commit -m "style(sport): use Oswald display font for sport-page headers/numbers

Match home-page type treatment; body copy stays Inter."
```
Merge branch to `main`, push, confirm Vercel deploy.

---

### Task 1: Ballpark asset module + resolver (Phase 1A, data layer)

**Files:**
- Create: `artifacts/mobile/scripts/fetch-ballparks.mjs` (one-time sourcing helper)
- Create: `artifacts/mobile/assets/ballparks/*.jpg` (30 optimized photos)
- Create: `artifacts/mobile/constants/ballparks.ts` (venue→asset map + resolver)

**Interfaces:**
- Produces: `resolveBallparkImage(venue?: string): ImageSourcePropType | null` — returns a `require()`d asset for a known venue (normalized match), else `null`. Also `BALLPARK_BY_VENUE: Record<string, number>` (normalized venue name → asset module id).

- [ ] **Step 1: Hardcode the 30 park → source mapping**

In `fetch-ballparks.mjs`, define an array of `{ venue, wikiTitle, slug }` for all 30 current MLB parks (e.g. `{ venue: "Fenway Park", wikiTitle: "Fenway Park", slug: "fenway-park" }`). Venue strings must match the API feed's `game.venue` values (verify a few against live `/api/game/:id` responses; add aliases where the feed differs).

- [ ] **Step 2: Fetch lead images from Wikimedia Commons**

Script fetches each park's lead image via the MediaWiki API (`action=query&prop=pageimages&piprop=original&titles=<wikiTitle>` on `en.wikipedia.org`), downloading the original to `assets/ballparks/<slug>.src`. These pages' lead images are free-license (CC BY-SA / public domain). Log the source URL per park for attribution.

- [ ] **Step 3: Optimize to consistent format**

Convert/resize each to `<slug>.jpg` at a consistent width (e.g. 1200px wide, ~16:9 crop from center-top for a skyline-friendly framing), quality ~80, using an available tool (`sips` on macOS: `sips -Z 1200 --setProperty format jpeg`). Target < ~250KB each. Delete the `.src` originals.

- [ ] **Step 4: Human/agent verification pass**

Open the 30 optimized JPGs; confirm each is the correct stadium and a good angle. For any wrong/ugly/failed park, remove its asset (it will fall back to gradient). Record which parks are included vs. fell back.

- [ ] **Step 5: Write the resolver module**

`constants/ballparks.ts`:
```ts
import type { ImageSourcePropType } from "react-native";

// Static require map — RN requires literal paths. Only include verified parks.
const ASSETS: Record<string, ImageSourcePropType> = {
  "fenway park": require("../assets/ballparks/fenway-park.jpg"),
  // ...one line per verified park, key = normalized venue
};

function normalizeVenue(v: string): string {
  return v.trim().toLowerCase().replace(/\s+/g, " ");
}

export function resolveBallparkImage(venue?: string): ImageSourcePropType | null {
  if (!venue) return null;
  return ASSETS[normalizeVenue(venue)] ?? null;
}
```

- [ ] **Step 6: Typecheck**

```bash
cd "/Users/justab/Documents/The 4th Quarter/artifacts/mobile" && ../../node_modules/.bin/tsc --noEmit
```
Expected: exit 0.

- [ ] **Step 7: Commit**

```bash
git add artifacts/mobile/scripts/fetch-ballparks.mjs artifacts/mobile/assets/ballparks artifacts/mobile/constants/ballparks.ts
git commit -m "feat(ballparks): bundle MLB park photos + resolveBallparkImage resolver

Free-license photos (Wikimedia Commons) optimized + verified; resolver
returns null for unmapped venues (gradient fallback at render sites)."
```

---

### Task 2: Render real ballpark in hub DETAILS + game hero (Phase 1A, render layer)

**Files:**
- Modify: `artifacts/mobile/components/gamecast/BaseballGameHub.tsx` (`GameDetails`, ~702-744; venue styles)
- Modify: `artifacts/mobile/app/game/[id].tsx` (hero backdrop for MLB, ~399-497)

**Interfaces:**
- Consumes: `resolveBallparkImage` from `constants/ballparks.ts`.

- [ ] **Step 1: Ballpark photo in DETAILS card**

In `BaseballGameHub.tsx` `GameDetails`, replace the `venueDiamond` block with an `Image` (source = `resolveBallparkImage(g.venue)`) rendered as a rounded banner with the venue name + "THE BALLPARK" eyebrow overlaid (or beneath). If `resolveBallparkImage` returns `null`, keep the current `venueDiamond` graphic as fallback. Add/adjust styles (`venuePhoto`, overlay) near the existing `venue*` styles.

- [ ] **Step 2: Ballpark hero backdrop for MLB game detail**

In `app/game/[id].tsx`, for `game.league === "MLB"` with a resolved ballpark image, render that image as the hero backdrop (behind the score/teams) with a dark scrim for legibility, instead of the flat `venueGrad`. Non-MLB or unresolved → keep `venueGrad`. (Note: for MLB the hero is only shown when the hub is collapsed — verify placement against `isBaseballGamecast` gating.)

- [ ] **Step 3: Typecheck**

```bash
cd "/Users/justab/Documents/The 4th Quarter/artifacts/mobile" && ../../node_modules/.bin/tsc --noEmit
```
Expected: exit 0.

- [ ] **Step 4: Subagent review**

`feature-dev:code-reviewer` on the diff. Prompt: "Verify: (1) real ballpark photo renders in the baseball hub DETAILS card and as the MLB game hero; (2) unmapped venue and null source both fall back cleanly (no broken image); (3) text stays legible over the photo (scrim present); (4) no non-MLB regression." Fix confirmed findings.

- [ ] **Step 5: Web-verify on live deploy**

After merge+deploy, open a real MLB game on the live site, expand DETAILS, confirm the photo shows for a mapped park and gradient shows for an unmapped one. Screenshot for the user.

- [ ] **Step 6: Commit + merge**

```bash
git add artifacts/mobile/components/gamecast/BaseballGameHub.tsx artifacts/mobile/app/game/\[id\].tsx
git commit -m "feat(gamecast): real ballpark photo in DETAILS card + MLB game hero

Falls back to gradient/diamond when venue unmapped."
```
Merge to `main`, push, confirm deploy.

---

### Task 3: Retire flat stats tabs for MLB (Phase 1B)

**Files:**
- Modify: `artifacts/mobile/app/game/[id].tsx` (tab list/gating, empty-state pointer ~618, tab content ~522-665)

**Interfaces:**
- Consumes: existing `isBaseballGamecast`, `TABS`, `GameTab`, `TeamStatsSection`, hub `DETAILS`.

- [ ] **Step 1: Confirm data parity (hub covers flat Stats)**

Compare the flat `stats` tab (`TeamStatsSection`, home/away team totals) against hub `DETAILS` `CompareRow`s (HITS/ERRORS/LOB). List any team-total row present in `TeamStatsSection` but absent from DETAILS.

- [ ] **Step 2: Fold any missing team totals into hub DETAILS**

If Step 1 found gaps, add the missing rows to `GameDetails` in `BaseballGameHub.tsx` (sourced-or-omitted, no placeholders). If no gaps, skip.

- [ ] **Step 3: Remove the flat-tab pointer**

Delete the "Check the Stats tab for live team totals →" hint (`app/game/[id].tsx` ~616-620) — for MLB it points at a page being retired. Keep it for non-MLB if it's still valid there (gate on league or remove only if MLB-only).

- [ ] **Step 4: Make flat tabs MLB-unreachable**

For `game.league === "MLB"`, restrict `TABS` to only `gamecast` (the hub) so `boxscore/playbyplay/stats/lineups` flat tabs are neither shown nor selectable; `normalizeGameTab` for MLB coerces any tab param to `gamecast`. Non-MLB leagues keep the full `TABS` array. (Since the tab bar is already hidden for MLB gamecast, this closes the deep-link/back-door path to the flat pages.)

- [ ] **Step 5: Typecheck**

```bash
cd "/Users/justab/Documents/The 4th Quarter/artifacts/mobile" && ../../node_modules/.bin/tsc --noEmit
```
Expected: exit 0.

- [ ] **Step 6: Subagent review**

`feature-dev:code-reviewer`. Prompt: "For MLB games, is the swipe-up hub now the only stats surface (flat box/plays/stats/lineups unreachable, no dead pointer), with NO data regression vs the old flat Stats tab, and non-MLB leagues fully intact?" Fix confirmed findings.

- [ ] **Step 7: Web-verify + commit + merge**

Verify on live: MLB game shows only the hub; a `?tab=stats` deep link coerces to gamecast; a non-MLB game still shows its flat tabs. Screenshot. Then:
```bash
git add artifacts/mobile/app/game/\[id\].tsx artifacts/mobile/components/gamecast/BaseballGameHub.tsx
git commit -m "refactor(game): retire flat stats tabs for MLB — hub is the one surface

Removes redundant Box/Plays/Stats/Lineups flat pages + stale pointer for
MLB; non-MLB leagues unchanged; no team-total data lost."
```
Merge to `main`, push, confirm deploy.

---

### Task 4: Baseball-shaped standings (Phase 1C)

**Files:**
- Modify: `artifacts/mobile/app/(tabs)/standings.tsx` (add MLB render branch)

**Interfaces:**
- Consumes: the existing standings data feed/shape used by `standings.tsx`.

- [ ] **Step 1: Inspect current standings data + render**

```bash
grep -nE "league|division|conference|GB|streak|L10|record|wins|losses|pct|function .*Standings|render" artifacts/mobile/app/\(tabs\)/standings.tsx | head -60
```
Determine what the feed provides for MLB (division grouping? GB? L10? streak?) and where the generic table renders.

- [ ] **Step 2: Add an MLB render branch**

When the selected league is MLB, group teams by league (AL/NL) → division and render columns `W · L · PCT · GB · L10 · STRK`, including only fields the feed provides (omit missing — no placeholders). Leave the existing table path for all other sports.

- [ ] **Step 3: Typecheck**

```bash
cd "/Users/justab/Documents/The 4th Quarter/artifacts/mobile" && ../../node_modules/.bin/tsc --noEmit
```
Expected: exit 0.

- [ ] **Step 4: Subagent review**

`feature-dev:code-reviewer`. Prompt: "Does MLB standings now render divisionally with baseball columns (GB/L10/STRK where available, omitted when not), sourced honestly, with other sports' standings unchanged?" Fix confirmed findings.

- [ ] **Step 5: Web-verify + commit + merge**

Verify MLB standings on live show divisions + baseball columns; another sport unchanged. Screenshot. Then:
```bash
git add artifacts/mobile/app/\(tabs\)/standings.tsx
git commit -m "feat(standings): baseball-shaped MLB standings (divisions, GB, L10, STRK)"
```
Merge to `main`, push, confirm deploy.

---

### Task 5: Baseball sport-page polish (Phase 1D)

**Files:**
- Modify: `artifacts/mobile/app/sport/[id].tsx` (baseball archetype paths + layout)

**Interfaces:**
- Consumes: Task 0's Oswald typography (already merged); existing baseball archetype data.

- [ ] **Step 1: Load the baseball sport page + catalog issues**

Open `/sport/baseball` on the live/local build. Catalog concrete defects: overlapping elements ("behind" each other), wrong/misleading baseball info, wrong section labels, spacing. Cross-reference the archetype branches in `sport/[id].tsx` (`archetype === "baseball"` and shared paths).

- [ ] **Step 2: Fix layout overlaps**

Resolve z-index/absolute-position overlaps and spacing so nothing sits "behind" another element. Keep changes scoped to what affects baseball; don't regress other archetypes.

- [ ] **Step 3: Correct baseball info**

Ensure leaders, rankings labels, and sections show baseball-correct content (e.g., pitching vs hitting leaders labeled correctly; league label "MLB"). Sourced-or-omitted.

- [ ] **Step 4: Typecheck**

```bash
cd "/Users/justab/Documents/The 4th Quarter/artifacts/mobile" && ../../node_modules/.bin/tsc --noEmit
```
Expected: exit 0.

- [ ] **Step 5: Subagent review**

`feature-dev:code-reviewer`. Prompt: "Baseball sport page: any remaining overlap/behind-element bugs, incorrect baseball info, or regressions to other archetypes from these changes?" Fix confirmed findings.

- [ ] **Step 6: Web-verify + commit + merge**

Verify `/sport/baseball` on live: no overlap, on-brand Oswald headers, correct info. Screenshot. Then:
```bash
git add artifacts/mobile/app/sport/\[id\].tsx
git commit -m "fix(sport): polish baseball sport page — layout overlaps + correct info"
```
Merge to `main`, push, confirm deploy.

---

## Self-Review

**Spec coverage:**
- Phase 0 font foundation → Task 0. ✓
- 1A ballpark photos (data + render) → Tasks 1 & 2. ✓
- 1B retire flat tabs → Task 3. ✓
- 1C baseball standings → Task 4. ✓
- 1D baseball sport-page polish → Task 5. ✓
- Deferred (Golf, team/player) → not in plan by design. ✓

**Placeholder scan:** Tasks that inherently involve inspection (sourcing images, cataloging live defects) specify the exact mechanism (Wikimedia API call, `sips` command, grep commands, resolver code). No "TODO/handle edge cases" hand-waving.

**Type consistency:** `resolveBallparkImage(venue?: string)` defined in Task 1, consumed by Task 2. `BALLPARK_BY_VENUE`/`ASSETS` map keyed by normalized venue used consistently. `FONTS.display`/`FONTS.displayMedium` match typography.ts.

**Order rationale:** 0 (font) first so every later baseball screen is verified on-brand; 1→2 (asset then render); 3 (retire) after render so the hub is fully the destination; 4 standings and 5 sport page independent, last.
