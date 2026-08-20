# Scores Sport Family Skins Design

Date: 2026-08-20
Status: Approved for prototype planning
Scope: Final visual and filtering layer for the personalized accordion Scores design
Extends: `2026-08-20-scores-personalized-accordion-design.md`

## Objective

Organize Scores by recognizable sport families and make every selected family inherit the design language already established by its sports homepage. Preserve the approved personalized rail, accordion structure, compact rows, and same-page navigation.

## Two-Level Filtering

The primary horizontal rail contains:

- All Sports
- Baseball
- Basketball
- Football
- Hockey
- Soccer
- Golf
- Tennis
- Combat
- Motorsports
- More, only when supported events exist

Selecting a sport family displays a secondary league rail only when that family has multiple relevant leagues.

Examples:

- Baseball: All Baseball, MLB, NCAA Baseball
- Basketball: All Basketball, NBA, WNBA, Summer League, NCAA Men's, NCAA Women's
- Football: All Football, NFL, NCAA Football
- Hockey: All Hockey, NHL, NCAA Men's, NCAA Women's
- Soccer: All Soccer, Premier League, La Liga, Bundesliga, Serie A, Ligue 1, MLS, NWSL, Cups, International, College
- Golf: All Golf, PGA Tour, LPGA Tour, LIV Golf
- Tennis: All Tennis, ATP, WTA
- Combat: All Combat, UFC, PFL, Bellator, Boxing
- Motorsports: All Motorsports, Formula 1, NASCAR, IndyCar

Only leagues with events for the selected day and intent filter appear. The architecture must allow a future favorite-sports preference to prioritize or preselect primary and secondary chips without changing the page structure.

## Navigation

There is no Back to All Sports control inside a selected family or league board. The All Sports chip remains visible in the primary rail and is the only control required to return.

Selecting a primary family preserves the date and intent filter. Selecting a secondary league narrows the current family without navigating away or creating another page shell.

## Sport Home Skin Packs

The shared score structure stays consistent, but the content area inherits the visual language of the matching sports homepage. A skin pack controls surfaces, borders, selected controls, number styling, subtle background motifs, and native event details. It does not recolor the shared application header, followed-team rail, date strip, or bottom navigation.

### Baseball

- cream score-paper surfaces
- navy structural color
- red live and decisive accents
- restrained ballpark or scorebook line details
- classic, editorial hierarchy consistent with the existing baseball homepage

### Basketball

- warm court-inspired neutrals
- orange or burnt-red energy accents
- dark plum or charcoal supporting surfaces
- stronger possession and run-state number treatment when verified

### Football

- turf green, leather brown, and warm off-white
- field-line and drive-marker motifs
- heavier game-day labels and clock presentation

### Hockey

- ice blue, cold white, deep navy, and restrained red
- crisp dividers and glass-like panels
- compact power-play or empty-net indicators when verified

### Soccer

- pitch green, deep blue-green, and competition-specific marks
- clean international score treatment
- league and cup identity remains visible in the secondary rail and event rows

### Golf

- egret, deep green, sage, sand, and charcoal matching the golf homepage
- editorial tournament names
- course contour motifs
- leaderboard rows with real headshots when available

### Tennis

- court green, ball yellow, warm white, and charcoal
- set-grid rhythm and current-server emphasis

### Combat

- black, deep red, warm white, and muted metallic accents
- bout-card and fight-poster character without oversized imagery

### Motorsports

- carbon, asphalt, warm white, signal yellow, and red
- timing-board rhythm, lap state, and session identity

### More and Multi-Event Sports

Each supported family maps to its existing sports-home language when available. Otherwise it uses a restrained neutral event-board skin and native event structure rather than an unrelated sport's styling.

## All Sports Presentation

All Sports retains the single-open league accordion. Accordion headers use a small identity preview from their family skin, while the surrounding page remains cohesive. Opening an accordion renders up to five events. Opening another closes the previous accordion.

The All Sports state does not add a global expansion page or global View All action.

## Selected Family and League Boards

Selecting a family applies its full skin to the score-content area and shows all matching events. Selecting a secondary league retains that skin and narrows the event collection.

Approximately five team matchups should remain visible per phone viewport after the fixed controls. Non-team sports use equally compact native rows or carousels.

## Golf Refinement

The golf accordion and selected Golf board use a horizontally swipeable tournament carousel.

Every tournament card displays:

- tour mark and tournament name
- live, scheduled, or final status
- round and course
- at least three leaderboard rows when three are available
- player headshot, position, name, score to par, and holes completed
- one verified course-state line when available

The carousel shows a visible portion of the next card and pagination dots. The active dot updates as the user swipes. When only one tournament exists, dots are omitted and the card uses the available width.

## Data and Fallback Rules

- Never fabricate possession, pitch count, timeout, power-play, course, or player context.
- Omit unsupported secondary lines.
- Use official marks and existing asset fallbacks.
- League and family counts derive from the filtered collection.
- Prototype data remains illustrative; production live facts come from existing APIs.

## Prototype Acceptance Criteria

1. Primary sport-family rail replaces the league-only primary rail.
2. Selecting Soccer reveals a working secondary rail including La Liga.
3. Selected Baseball, Basketball, Football, Hockey, Soccer, and Golf boards visibly inherit their sports-home design language.
4. Shared header, followed-team rail, date strip, and navigation remain stable across skins.
5. No Back to All Sports button appears.
6. All Sports remains a single-open accordion view.
7. Golf shows two swipeable tournament cards, three leaders per supported card, visible continuation, and pagination dots.
8. Family and league filters preserve date and intent state.
9. Mobile layout remains legible at 390×844 without horizontal page overflow.
