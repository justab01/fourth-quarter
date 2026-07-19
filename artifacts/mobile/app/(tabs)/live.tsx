import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  Pressable, Platform, Animated, type ScrollView as ScrollViewType
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { FONTS } from "@/constants/typography";
import { SPORT_CATEGORIES as MASTER_SPORT_CATEGORIES, type SportCategory as MasterSportCategory, prettyLeagueLabel } from "@/constants/sportCategories";
import { api } from "@/utils/api";
import type { Game } from "@/utils/api";
import { GameCard, TeamLogo } from "@/components/GameCard";
import { GameCardSkeleton } from "@/components/LoadingSkeleton";
import { usePreferences } from "@/context/PreferencesContext";
import { SearchButton } from "@/components/SearchButton";
import { ProfileButton } from "@/components/ProfileButton";
import { QuickGamePanel, type QuickGameTab } from "@/components/QuickGamePanel";

const C = Colors.dark;
const COMPACT_CONTROL_HIT_SLOP = { top: 8, bottom: 8, left: 0, right: 0 } as const;
const SUMMER_LEAGUE_FAMILY = "NBA_SUMMER_LEAGUE";
const SUMMER_LEAGUE_CIRCUITS = ["NBASLV", "NBASLC", "NBASLU"] as const;
const SUMMER_LEAGUE_CIRCUIT_SET = new Set<string>(SUMMER_LEAGUE_CIRCUITS);

function isSummerLeagueGame(game: Game): boolean {
  return game.competition?.key === SUMMER_LEAGUE_FAMILY || SUMMER_LEAGUE_CIRCUIT_SET.has(game.league);
}

function matchesLeagueFilter(game: Game, league: string): boolean {
  return league === SUMMER_LEAGUE_FAMILY ? isSummerLeagueGame(game) : game.league === league;
}

function scoreboardLeagueKey(game: Game): string {
  return isSummerLeagueGame(game) ? SUMMER_LEAGUE_FAMILY : game.league;
}

const LEAGUE_KEYS = Array.from(new Set(MASTER_SPORT_CATEGORIES.flatMap((sport) => sport.leagues.map((league) => league.key))));

type LeagueMeta = { color: string; icon: keyof typeof Ionicons.glyphMap; fullName: string; sportName?: string };

const LEAGUE_META: Record<string, LeagueMeta> = {
  NBA:    { color: C.nba,       icon: "basketball-outline", fullName: "NBA" },
  NBA_SUMMER_LEAGUE: { color: "#FF9A3D", icon: "sunny-outline", fullName: "NBA Summer League" },
  NBASLV: { color: "#FF9A3D", icon: "sunny-outline", fullName: "Las Vegas" },
  NBASLC: { color: "#F4C15D", icon: "sunny-outline", fullName: "California Classic" },
  NBASLU: { color: "#63B3ED", icon: "sunny-outline", fullName: "Salt Lake City" },
  NFL:    { color: C.nfl,       icon: "american-football-outline", fullName: "NFL" },
  MLB:    { color: C.mlb,       icon: "baseball-outline", fullName: "MLB" },
  MLS:    { color: C.mls,       icon: "football-outline", fullName: "MLS" },
  NHL:    { color: C.nhl,       icon: "disc-outline", fullName: "NHL" },
  WNBA:   { color: C.wnba,      icon: "basketball-outline", fullName: "WNBA" },
  NCAAB:  { color: C.ncaab,     icon: "school-outline", fullName: "NCAA Basketball" },
  NCAAF:  { color: C.ncaaf,     icon: "american-football-outline", fullName: "NCAA Football" },
  NCAAW:  { color: C.wnba,      icon: "basketball-outline", fullName: "NCAA Women's Basketball" },
  NCAABB: { color: C.mlb,       icon: "baseball-outline", fullName: "NCAA Baseball" },
  NCAAHM: { color: C.nhl,       icon: "disc-outline", fullName: "NCAA Men's Hockey" },
  NCAAHW: { color: C.nhl,       icon: "disc-outline", fullName: "NCAA Women's Hockey" },
  EPL:    { color: C.eplBright, icon: "football-outline", fullName: "Premier League" },
  UCL:    { color: C.ucl,       icon: "star-outline", fullName: "Champions League" },
  UEL:    { color: "#F68E1E",   icon: "football-outline", fullName: "Europa League" },
  UECL:   { color: "#19A87A",   icon: "football-outline", fullName: "Conference League" },
  LIGA:   { color: C.liga,      icon: "football-outline", fullName: "La Liga" },
  BUN:    { color: "#D50000",   icon: "football-outline", fullName: "Bundesliga" },
  SERA:   { color: "#009CDE",   icon: "football-outline", fullName: "Serie A" },
  LIG1:   { color: "#4F7CFF",   icon: "football-outline", fullName: "Ligue 1" },
  NWSL:   { color: "#FF6F61",   icon: "football-outline", fullName: "NWSL" },
  FWCM:   { color: "#C9A84C",   icon: "trophy-outline", fullName: "FIFA World Cup" },
  EURO:   { color: "#0056A0",   icon: "star-outline", fullName: "Euro Championship" },
  COPA:   { color: "#1F8A4D",   icon: "football-outline", fullName: "Copa America" },
  NCAASM: { color: C.ncaab,     icon: "school-outline", fullName: "NCAA Men's Soccer" },
  NCAASW: { color: C.wnba,      icon: "school-outline", fullName: "NCAA Women's Soccer" },
  UFC:    { color: C.ufc,       icon: "flash-outline", fullName: "UFC" },
  BELLATOR: { color: C.ufc,     icon: "flash-outline", fullName: "Bellator" },
  PFL:    { color: C.ufc,       icon: "flash-outline", fullName: "PFL" },
  BOXING: { color: C.boxing,    icon: "fitness-outline", fullName: "Boxing" },
  ATP:    { color: C.atp,       icon: "ellipse-outline", fullName: "ATP Tennis" },
  WTA:    { color: C.wta,       icon: "ellipse-outline", fullName: "WTA Tennis" },
  PGA:    { color: C.pga,       icon: "flag-outline", fullName: "PGA Tour" },
  LPGA:   { color: C.pga,       icon: "flag-outline", fullName: "LPGA" },
  LIV:    { color: C.liv,       icon: "flag-outline", fullName: "LIV Golf" },
  F1:     { color: C.f1,        icon: "speedometer-outline", fullName: "Formula 1" },
  NASCAR: { color: C.nascar,    icon: "speedometer-outline", fullName: "NASCAR" },
  IRL:    { color: C.accentBlue, icon: "speedometer-outline", fullName: "IndyCar" },
  OLYMPICS_SUMMER: { color: C.olympics, icon: "medal-outline", fullName: "Summer Olympics" },
  OLYMPICS_WINTER: { color: C.olympics, icon: "snow-outline", fullName: "Winter Olympics" },
  XGAMES_SUMMER: { color: C.xgames, icon: "bicycle-outline", fullName: "X Games Summer" },
  XGAMES_WINTER: { color: C.xgames, icon: "snow-outline", fullName: "X Games Winter" },
  DIAMOND_LEAGUE: { color: C.accentGold, icon: "stopwatch-outline", fullName: "Diamond League" },
  WORLD_ATHLETICS: { color: C.accentGold, icon: "stopwatch-outline", fullName: "World Athletics" },
  NCAALM: { color: C.accentBlue, icon: "school-outline", fullName: "NCAA Men's Lacrosse" },
  NCAALW: { color: C.accentBlue, icon: "school-outline", fullName: "NCAA Women's Lacrosse" },
  NCAAVW: { color: C.wnba, icon: "school-outline", fullName: "NCAA Volleyball" },
  NCAAWP: { color: C.accentBlue, icon: "school-outline", fullName: "NCAA Water Polo" },
  NCAAFH: { color: C.accentGreen, icon: "school-outline", fullName: "NCAA Field Hockey" },
  ESPORTS_LOL: { color: C.accent, icon: "game-controller-outline", fullName: "League of Legends" },
  ESPORTS_VAL: { color: C.accent, icon: "game-controller-outline", fullName: "Valorant" },
  ESPORTS_CS: { color: C.accent, icon: "game-controller-outline", fullName: "CS2" },
  ESPORTS_CDL: { color: C.accent, icon: "game-controller-outline", fullName: "Call of Duty League" },
};

function getMasterSportByLeague(league: string): { sport: MasterSportCategory; label: string } | null {
  for (const sport of MASTER_SPORT_CATEGORIES) {
    const match = sport.leagues.find((item) => item.key === league);
    if (match) return { sport, label: match.label };
  }
  return null;
}

function getLeagueMeta(league: string): LeagueMeta {
  const master = getMasterSportByLeague(league);
  return LEAGUE_META[league] ?? {
    color: master?.sport.color ?? C.accent,
    icon: (master?.sport.icon ?? "trophy-outline") as keyof typeof Ionicons.glyphMap,
    fullName: master?.label ?? league,
    sportName: master?.sport.name,
  };
}

function leaguesForSports(sportIds: string[]) {
  const allowed = new Set(sportIds);
  return MASTER_SPORT_CATEGORIES
    .filter((sport) => allowed.has(sport.id))
    .flatMap((sport) => sport.leagues.map((league) => league.key));
}

type SportCategoryKey = "all" | "major" | "world" | "college" | "individual" | "fight" | "motor" | "culture";

const SCORE_SPORT_CATEGORIES: { key: SportCategoryKey; label: string; icon: keyof typeof Ionicons.glyphMap; leagues: string[] }[] = [
  { key: "all", label: "All", icon: "grid-outline", leagues: [] },
  { key: "major", label: "Daily", icon: "radio-outline", leagues: ["NBA", SUMMER_LEAGUE_FAMILY, "WNBA", "NFL", "MLB", "NHL"] },
  { key: "world", label: "World", icon: "earth-outline", leagues: leaguesForSports(["soccer"]) },
  { key: "college", label: "College", icon: "school-outline", leagues: LEAGUE_KEYS.filter((league) => league.startsWith("NCAA")) },
  { key: "individual", label: "Golf/Tennis", icon: "person-outline", leagues: leaguesForSports(["golf", "tennis"]) },
  { key: "fight", label: "Fight", icon: "flash-outline", leagues: leaguesForSports(["combat"]) },
  { key: "motor", label: "Motor", icon: "speedometer-outline", leagues: leaguesForSports(["motorsports"]) },
  { key: "culture", label: "Culture", icon: "calendar-outline", leagues: leaguesForSports(["more"]) },
];

const SCORE_EVENT_LANES: {
  label: string;
  detail: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  target: { type: "category"; key: SportCategoryKey } | { type: "route"; route: "sports" | "news" };
}[] = [
  {
    label: "World Tournaments",
    detail: "World Cup, Cups, finals",
    icon: "earth-outline",
    color: C.accentGreen,
    target: { type: "category", key: "world" },
  },
  {
    label: "College Belt",
    detail: "NCAA boards and events",
    icon: "school-outline",
    color: C.accentBlue,
    target: { type: "category", key: "college" },
  },
  {
    label: "Fight Week",
    detail: "Cards, bouts, weigh-ins",
    icon: "flame-outline",
    color: C.live,
    target: { type: "category", key: "fight" },
  },
  {
    label: "Culture Calendar",
    detail: "Drafts, awards, rooms",
    icon: "calendar-outline",
    color: C.accentGold,
    target: { type: "route", route: "sports" },
  },
];

function leagueMatchesCategory(league: string, category: SportCategoryKey): boolean {
  if (category === "all") return true;
  const normalizedLeague = SUMMER_LEAGUE_CIRCUIT_SET.has(league) ? SUMMER_LEAGUE_FAMILY : league;
  return SCORE_SPORT_CATEGORIES.find(c => c.key === category)?.leagues.includes(normalizedLeague) ?? true;
}

const STATUS_ORDER: Record<Game["status"], number> = { live: 0, upcoming: 1, finished: 2 };

function getStatusOrder(game: Game): number {
  return game.statusDetail ? 3 : STATUS_ORDER[game.status];
}

// ── Pulsing live dot animation ───────────────────────────────────────────────────
function PulsingLiveDot() {
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
    <View style={{ width: 8, height: 8, alignItems: "center", justifyContent: "center" }}>
      <Animated.View style={{ position: "absolute", width: 8, height: 8, borderRadius: 4, backgroundColor: C.live, transform: [{ scale }], opacity }} />
      <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: C.live }} />
    </View>
  );
}

function getUrgencyScore(game: Game, myTeams: string[]): number {
  let score = 0;
  const homeScore = game.homeScore ?? 0;
  const awayScore = game.awayScore ?? 0;
  const diff = Math.abs(homeScore - awayScore);
  const period = (game.quarter ?? "").toLowerCase();
  const isOT = /\b(?:ot|overtime)\b/i.test(period);
  const isLate = period.includes("4") || period.includes("q4") || period.includes("9th") || period.includes("3rd") || period.includes("2nd half");

  if (game.status === "live") {
    score += 50;
    if (isOT) score += 30;
    if (diff <= 3 && isLate) score += 25;
    else if (diff <= 5) score += 15;
    else if (diff <= 10) score += 8;
    if (diff >= 20) score -= 10;
    if (isLate) score += 10;
  } else if (game.status === "upcoming" && !game.statusDetail) {
    score += 10;
    const minsUntil = (new Date(game.startTime).getTime() - Date.now()) / 60000;
    if (minsUntil <= 30 && minsUntil > 0) score += 15;
    else if (minsUntil <= 60 && minsUntil > 0) score += 8;
  }

  if (myTeams.includes(game.homeTeam) || myTeams.includes(game.awayTeam)) score += 20;
  if (isRivalry(game.homeTeam, game.awayTeam)) score += 12;

  return score;
}

const RIVALRIES: [string, string][] = [
  ["Los Angeles Lakers", "Boston Celtics"],
  ["Los Angeles Lakers", "Los Angeles Clippers"],
  ["Golden State Warriors", "Los Angeles Lakers"],
  ["New York Knicks", "Brooklyn Nets"],
  ["Chicago Bulls", "Detroit Pistons"],
  ["Miami Heat", "Boston Celtics"],
  ["Dallas Cowboys", "Philadelphia Eagles"],
  ["Green Bay Packers", "Chicago Bears"],
  ["New England Patriots", "New York Jets"],
  ["Pittsburgh Steelers", "Baltimore Ravens"],
  ["San Francisco 49ers", "Seattle Seahawks"],
  ["New York Yankees", "Boston Red Sox"],
  ["Los Angeles Dodgers", "San Francisco Giants"],
  ["Houston Astros", "Texas Rangers"],
  ["Chicago Cubs", "St. Louis Cardinals"],
  ["Arsenal", "Tottenham Hotspur"],
  ["Manchester United", "Manchester City"],
  ["Liverpool", "Everton"],
  ["Real Madrid", "FC Barcelona"],
  ["Atletico Madrid", "Real Madrid"],
];

function isRivalry(homeTeam: string, awayTeam: string): boolean {
  return RIVALRIES.some(([a, b]) =>
    (a === homeTeam && b === awayTeam) || (a === awayTeam && b === homeTeam)
  );
}

interface ImportanceTag {
  label: string;
  color: string;
  bgColor: string;
}

function getImportanceTags(game: Game, myTeams: string[]): ImportanceTag[] {
  const tags: ImportanceTag[] = [];
  const homeScore = game.homeScore ?? 0;
  const awayScore = game.awayScore ?? 0;
  const diff = Math.abs(homeScore - awayScore);
  const period = (game.quarter ?? "").toLowerCase();
  const isOT = /\b(?:ot|overtime)\b/i.test(period);
  const isLate = period.includes("4") || period.includes("q4") || period.includes("9th") ||
    period.includes("3rd") || period.includes("2nd half");

  if (game.status === "finished") {
    if (isOT) tags.push({ label: "OT", color: "#7C3AED", bgColor: `#7C3AED18` });
    tags.push({ label: "FINAL", color: C.textTertiary, bgColor: `${C.textTertiary}15` });
    return tags.slice(0, 2);
  }

  if (game.status === "live") {
    const urgency = getUrgencyScore(game, myTeams);
    if (urgency >= 60) {
      tags.push({ label: "MUST WATCH", color: "#fff", bgColor: C.live });
    } else if (isOT) {
      tags.push({ label: "OT", color: "#fff", bgColor: "#7C3AED" });
    } else if (diff <= 3 && isLate) {
      tags.push({ label: "CLOSE", color: "#fff", bgColor: C.live });
    } else if (diff <= 5) {
      tags.push({ label: "TIGHT", color: C.live, bgColor: `${C.live}20` });
    }
    if (diff >= 20) tags.push({ label: "BLOWOUT", color: C.textTertiary, bgColor: `${C.textTertiary}18` });

    if (game.league === "NHL" && period.includes("power play")) {
      tags.push({ label: "POWER PLAY", color: "#60A5FA", bgColor: "#60A5FA18" });
    }
    if (game.league === "NFL" && diff <= 8 && isLate) {
      tags.push({ label: "RED ZONE", color: "#FF6B35", bgColor: "#FF6B3518" });
    }
    if (["ATP", "WTA"].includes(game.league) && diff <= 1 && isLate) {
      tags.push({ label: "MATCH POINT", color: "#F59E0B", bgColor: "#F59E0B18" });
    }
  }

  if (isRivalry(game.homeTeam, game.awayTeam)) {
    tags.push({ label: "RIVALRY", color: C.accentGold, bgColor: `${C.accentGold}18` });
  }

  // Only show BUBBLE for close games in playoff bubble months
  const now = new Date();
  const month = now.getMonth();
  const isPlayoffBubbleSeason = (game.league === "NBA" && (month >= 2 && month <= 3)) ||
    (game.league === "NHL" && (month >= 2 && month <= 3)) ||
    (game.league === "MLB" && (month >= 8 && month <= 9));
  // Only show BUBBLE for tight games (not already tagged) during bubble season
  if (isPlayoffBubbleSeason && diff <= 5 && !tags.some(t => t.label === "MUST WATCH" || t.label === "OT" || t.label === "CLOSE" || t.label === "TIGHT")) {
    tags.push({ label: "BUBBLE", color: "#F59E0B", bgColor: "#F59E0B15" });
  }

  const isPlayoffSeason = (game.league === "NBA" && (month >= 3 && month <= 6)) ||
    (game.league === "MLB" && month >= 9) ||
    (game.league === "NHL" && month >= 3) ||
    (game.league === "NCAAB" && month === 2);
  if (isPlayoffSeason && !isPlayoffBubbleSeason && tags.length < 2) {
    tags.push({ label: "PLAYOFF RACE", color: C.accentGreen, bgColor: `${C.accentGreen}18` });
  }

  return tags.slice(0, 2);
}

const CAL_DAYS_BACK  = 14;
const CAL_DAYS_FWD   = 14;
const CAL_TOTAL      = CAL_DAYS_BACK + 1 + CAL_DAYS_FWD;
const CAL_CELL_W     = 46;
const CAL_CELL_GAP   = 6;
const CAL_CELL_TOTAL = CAL_CELL_W + CAL_CELL_GAP;

const DAY_ABBR  = ["Su","Mo","Tu","We","Th","Fr","Sa"];
const MON_ABBR  = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function offsetToDate(offset: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d;
}

function offsetToYYYYMMDD(offset: number): string {
  const d = offsetToDate(offset);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

function CalendarStrip({ offset, onChange, liveToday }: {
  offset: number;
  onChange: (o: number) => void;
  liveToday: number;
}) {
  const scrollRef = useRef<ScrollViewType>(null);

  useEffect(() => {
    const activeIdx = offset + CAL_DAYS_BACK;
    const x = activeIdx * CAL_CELL_TOTAL - 140;
    scrollRef.current?.scrollTo({ x: Math.max(0, x), animated: true });
  }, [offset]);

  const days = Array.from({ length: CAL_TOTAL }, (_, i) => i - CAL_DAYS_BACK);

  return (
    <ScrollView
      ref={scrollRef as any}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={cal.row}
      style={cal.strip}
    >
      {days.map(dayOff => {
        const d        = offsetToDate(dayOff);
        const isActive = dayOff === offset;
        const isToday  = dayOff === 0;
        const isFuture = dayOff > 0;
        const isPast   = dayOff < 0;
        const dateNum  = d.getDate();
        const showMon  = dateNum === 1;

        return (
          <Pressable
            key={dayOff}
            accessibilityRole="button"
            accessibilityLabel={`Show games for ${d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}`}
            accessibilityState={{ selected: isActive }}
            onPress={() => onChange(dayOff)}
          >
            <View style={[cal.cell, isActive && cal.cellActive, isPast && cal.cellPast]}>
              {showMon ? (
                <Text style={[cal.top, isActive && cal.topActive]}>{MON_ABBR[d.getMonth()]}</Text>
              ) : (
                <Text style={[cal.top, isActive && cal.topActive]}>
                  {isToday ? "Today" : DAY_ABBR[d.getDay()]}
                </Text>
              )}
              <Text style={[cal.num, isActive && cal.numActive, isPast && cal.numPast]}>{dateNum}</Text>
              {isToday && liveToday > 0 ? (
                <View style={cal.liveDot} />
              ) : isFuture ? (
                <View style={cal.futureDot} />
              ) : (
                <View style={cal.dot} />
              )}
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const cal = StyleSheet.create({
  strip: { marginBottom: 4 },
  row:   { gap: CAL_CELL_GAP, paddingHorizontal: 4 },
  cell: {
    width: CAL_CELL_W, alignItems: "center", paddingVertical: 7,
    borderRadius: 11, backgroundColor: C.card,
    borderWidth: 1, borderColor: C.cardBorder, gap: 1,
  },
  cellActive: { borderColor: C.accent, backgroundColor: `${C.accent}18` },
  cellPast:   { opacity: 0.7 },
  top:        { fontSize: 10, fontWeight: "700", color: C.textTertiary, letterSpacing: 0.4, fontFamily: FONTS.bodyBold },
  topActive:  { color: C.accent },
  num:        { fontSize: 16, fontWeight: "800", color: C.textSecondary, fontFamily: FONTS.bodyHeavy },
  numActive:  { color: C.text },
  numPast:    { color: C.textTertiary },
  liveDot:    { width: 6, height: 6, borderRadius: 3, backgroundColor: C.live },
  futureDot:  { width: 4, height: 4, borderRadius: 2, backgroundColor: `${C.accent}50` },
  dot:        { width: 4, height: 4 },
});

function ScoreEventRail({
  activeCategory,
  onSelectCategory,
}: {
  activeCategory: SportCategoryKey;
  onSelectCategory: (category: SportCategoryKey) => void;
}) {
  return (
    <View style={eventRail.wrap}>
      <View style={eventRail.header}>
        <Text style={eventRail.title}>Event lanes</Text>
        <Text style={eventRail.sub}>Scores stay clean. Culture has a door.</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={eventRail.track}>
        {SCORE_EVENT_LANES.map((lane) => {
          const selected = lane.target.type === "category" && activeCategory === lane.target.key;
          const handlePress = () => {
            if (lane.target.type === "category") {
              onSelectCategory(lane.target.key);
            } else if (lane.target.route === "sports") {
              router.push("/(tabs)/sports" as any);
            } else {
              router.push("/(tabs)/news" as any);
            }
          };

          return (
            <Pressable
              key={lane.label}
              accessibilityRole="button"
              accessibilityLabel={`Open ${lane.label}`}
              accessibilityState={{ selected }}
              onPress={handlePress}
              style={({ pressed }) => [
                eventRail.card,
                selected && { borderColor: `${lane.color}66`, backgroundColor: `${lane.color}14` },
                pressed && eventRail.pressed,
              ]}
            >
              <View style={[eventRail.iconWrap, { borderColor: `${lane.color}44`, backgroundColor: `${lane.color}16` }]}>
                <Ionicons name={lane.icon} size={15} color={lane.color} />
              </View>
              <View style={eventRail.copy}>
                <Text style={eventRail.label} numberOfLines={1}>{lane.label}</Text>
                <Text style={eventRail.detail} numberOfLines={1}>{lane.detail}</Text>
              </View>
              <Ionicons name="chevron-forward" size={13} color={selected ? lane.color : C.textTertiary} />
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const eventRail = StyleSheet.create({
  wrap: {
    gap: 8,
    marginBottom: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 2,
  },
  title: {
    color: C.text,
    fontSize: 13,
    fontFamily: FONTS.bodyHeavy,
  },
  sub: {
    flexShrink: 1,
    color: C.textTertiary,
    fontSize: 10,
    fontFamily: FONTS.bodyMedium,
    textAlign: "right",
  },
  track: {
    gap: 8,
    paddingRight: 14,
  },
  card: {
    width: 194,
    minHeight: 62,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 14,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  pressed: { opacity: 0.78 },
  iconWrap: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    borderWidth: 1,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  label: {
    color: C.text,
    fontSize: 12,
    fontFamily: FONTS.bodyHeavy,
  },
  detail: {
    color: C.textSecondary,
    fontSize: 10,
    fontFamily: FONTS.bodyMedium,
  },
});

function ScoreboardDeck({
  topGame,
  counts,
  dateOffset,
  compactMode,
  setCompactMode,
  onGamePress,
}: {
  topGame: Game | null;
  counts: { live: number; upcoming: number; finished: number };
  dateOffset: number;
  compactMode: boolean;
  setCompactMode: (value: boolean) => void;
  onGamePress: (game: Game) => void;
}) {
  const dateLabel = formatDateLabel(dateOffset);
  // On today the title already reads "Today", so use a section label for the
  // eyebrow instead of repeating it ("TODAY / Today").
  const slateLabel = dateOffset === 0 ? "Scoreboard" : dateOffset < 0 ? "Past slate" : "Upcoming slate";
  const topMeta = topGame ? getLeagueMeta(topGame.league) : null;

  return (
    <View style={deck.card}>
      <View style={deck.top}>
        <View>
          <Text style={deck.kicker}>{slateLabel}</Text>
          <Text style={deck.title}>{dateLabel}</Text>
        </View>
        <View style={deck.modeGroup}>
          <Pressable
            style={[deck.modeBtn, !compactMode && deck.modeBtnActive]}
            onPress={() => setCompactMode(false)}
            hitSlop={COMPACT_CONTROL_HIT_SLOP}
            accessibilityRole="button"
            accessibilityState={{ selected: !compactMode }}
            accessibilityLabel="Use full scores view"
          >
            <Ionicons name="albums-outline" size={14} color={!compactMode ? C.accent : C.textTertiary} />
            <Text style={[deck.modeText, !compactMode && { color: C.accent }]}>Cards</Text>
          </Pressable>
          <Pressable
            style={[deck.modeBtn, compactMode && deck.modeBtnActive]}
            onPress={() => setCompactMode(true)}
            hitSlop={COMPACT_CONTROL_HIT_SLOP}
            accessibilityRole="button"
            accessibilityState={{ selected: compactMode }}
            accessibilityLabel="Use compact scores view"
          >
            <Ionicons name="list" size={14} color={compactMode ? C.accent : C.textTertiary} />
            <Text style={[deck.modeText, compactMode && { color: C.accent }]}>List</Text>
          </Pressable>
        </View>
      </View>

      <View style={deck.metrics}>
        <DeckMetric label="Live" value={counts.live} color={C.live} icon="radio" />
        <DeckMetric label="Next" value={counts.upcoming} color={C.accentBlue} icon="time-outline" />
        <DeckMetric label="Final" value={counts.finished} color={C.textSecondary} icon="checkmark-circle-outline" />
      </View>

      {topGame ? (
        <Pressable
          style={({ pressed }) => [deck.topGame, pressed && { opacity: 0.82 }]}
          onPress={() => onGamePress(topGame)}
          accessibilityRole="button"
          accessibilityLabel={
            isEventLeague(topGame.league)
              ? `Open ${topGame.eventTitle ?? topGame.homeTeam}`
              : `Open ${topGame.awayTeam} at ${topGame.homeTeam}`
          }
        >
          {isEventLeague(topGame.league) ? (
            <View style={[deck.topIcon, { backgroundColor: `${topMeta!.color}18` }]}>
              <Ionicons name={topMeta!.icon} size={15} color={topMeta!.color} />
            </View>
          ) : (
            <View style={deck.logoStack}>
              <TeamLogo uri={topGame.awayTeamLogo} name={topGame.awayTeam} size={26} borderColor={`${topMeta!.color}55`} fontSize={8} />
              <View style={deck.logoOverlap}>
                <TeamLogo uri={topGame.homeTeamLogo} name={topGame.homeTeam} size={26} borderColor={`${topMeta!.color}55`} fontSize={8} />
              </View>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={deck.topLabel}>
              {topGame.statusDetail
                ? "Schedule update"
                : topGame.status === "live"
                  ? "Best live window"
                  : topGame.status === "upcoming"
                    ? "Next up"
                    : "Recent final"}
            </Text>
            <Text style={deck.topTitle} numberOfLines={1}>
              {isEventLeague(topGame.league)
                ? (topGame.eventTitle ?? topGame.homeTeam)
                : `${compactTeamName(topGame.awayTeam)} @ ${compactTeamName(topGame.homeTeam)}`}
            </Text>
          </View>
          <Text style={[deck.topClock, { color: topMeta!.color }]}>{formatGameClock(topGame)}</Text>
          <Ionicons name="chevron-forward" size={14} color={C.textTertiary} />
        </Pressable>
      ) : (
        <View style={deck.topGame}>
          <View style={deck.topIcon}>
            <Ionicons name="calendar-outline" size={15} color={C.textTertiary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={deck.topLabel}>No events</Text>
            <Text style={deck.topTitle}>Try another day or filter</Text>
          </View>
        </View>
      )}
    </View>
  );
}

function DeckMetric({ label, value, color, icon }: { label: string; value: number; color: string; icon: string }) {
  return (
    <View style={deck.metric}>
      <Ionicons name={icon as any} size={12} color={color} />
      <Text style={[deck.metricValue, { color }]}>{value}</Text>
      <Text style={deck.metricLabel}>{label}</Text>
    </View>
  );
}

const deck = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.cardBorder,
    backgroundColor: C.card,
    padding: 10,
    gap: 10,
    marginBottom: 10,
  },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  kicker: { color: C.textTertiary, fontSize: 10, fontFamily: FONTS.bodyHeavy, textTransform: "uppercase", letterSpacing: 0.8 },
  title: { color: C.text, fontSize: 20, fontFamily: FONTS.bodyHeavy, marginTop: 1 },
  modeGroup: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.cardBorder,
    backgroundColor: C.backgroundSecondary,
    padding: 3,
  },
  modeBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 8, paddingVertical: 6, borderRadius: 9 },
  modeBtnActive: { backgroundColor: C.glassMedium },
  modeText: { color: C.textTertiary, fontSize: 11, fontFamily: FONTS.bodyHeavy },
  metrics: { flexDirection: "row", gap: 8 },
  metric: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.cardBorder,
    backgroundColor: C.glassLight,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  metricValue: { fontSize: 18, fontFamily: FONTS.bodyHeavy, lineHeight: 21 },
  metricLabel: { color: C.textTertiary, fontSize: 9, fontFamily: FONTS.bodyBold, textTransform: "uppercase" },
  topGame: {
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
    backgroundColor: C.backgroundSecondary,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  topIcon: { width: 30, height: 30, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: C.glassMedium },
  logoStack: { width: 45, flexDirection: "row", alignItems: "center" },
  logoOverlap: { marginLeft: -7 },
  topLabel: { color: C.textTertiary, fontSize: 10, fontFamily: FONTS.bodyHeavy, textTransform: "uppercase", letterSpacing: 0.7 },
  topTitle: { color: C.text, fontSize: 13, fontFamily: FONTS.bodyHeavy, marginTop: 1 },
  topClock: { fontSize: 11, fontFamily: FONTS.bodyHeavy },
});

function CompactScoreRow({
  game,
  isFavorite,
  expanded,
  onToggle,
}: {
  game: Game;
  isFavorite: boolean;
  expanded: boolean;
  onToggle: () => void;
}) {
  const meta = getLeagueMeta(game.league);
  const chevronProgress = useRef(new Animated.Value(expanded ? 1 : 0)).current;
  const isLive = game.status === "live";
  const isFinished = game.status === "finished";
  const shouldShowScore = isLive || isFinished;
  const awayLost = isFinished &&
    game.awayScore != null &&
    game.homeScore != null &&
    game.awayScore < game.homeScore;
  const homeLost = isFinished &&
    game.homeScore != null &&
    game.awayScore != null &&
    game.homeScore < game.awayScore;
  const eventMode = isEventLeague(game.league) || game.sportArchetype === "golf" || game.sportArchetype === "racing";
  const accessibleGameName = eventMode
    ? (game.eventTitle ?? game.homeTeam)
    : `${game.awayTeam} at ${game.homeTeam}`;

  useEffect(() => {
    Animated.timing(chevronProgress, {
      toValue: expanded ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [chevronProgress, expanded]);

  const chevron = (
    <Animated.View
      style={{
        transform: [{
          rotate: chevronProgress.interpolate({
            inputRange: [0, 1],
            outputRange: ["0deg", "90deg"],
          }),
        }],
      }}
    >
      <Ionicons name="chevron-forward" size={13} color={expanded ? meta.color : C.textTertiary} />
    </Animated.View>
  );

  if (eventMode) {
    return (
      <Pressable
        style={({ pressed }) => [compact.row, expanded && compact.rowExpanded, pressed && compact.rowPressed]}
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={`${expanded ? "Collapse" : "Expand"} quick view for ${accessibleGameName}`}
      >
        <View style={[compact.statusRail, { backgroundColor: meta.color }]} />
        <View style={compact.statusCol}>
          <Text style={[compact.statusText, isLive && { color: C.live }]}>
            {game.statusDetail ?? (isLive ? "LIVE" : isFinished ? "FINAL" : formatTime(game.startTime))}
          </Text>
          <Text style={compact.leagueText}>{game.competition?.circuitLabel ?? prettyLeagueLabel(game.league)}</Text>
        </View>
        <View style={[compact.icon, { backgroundColor: `${meta.color}18` }]}>
          <Ionicons name={meta.icon} size={14} color={meta.color} />
        </View>
        <View style={compact.eventBody}>
          <Text style={compact.eventTitle} numberOfLines={1}>{game.eventTitle ?? game.homeTeam}</Text>
          <Text style={compact.eventMeta} numberOfLines={1}>{game.circuitName ?? game.venue ?? game.awayTeam}</Text>
        </View>
        {isFavorite && <Ionicons name="star" size={12} color={C.accentGold} />}
        {chevron}
      </Pressable>
    );
  }

  return (
    <Pressable
      style={({ pressed }) => [compact.row, expanded && compact.rowExpanded, pressed && compact.rowPressed]}
      onPress={onToggle}
      accessibilityRole="button"
      accessibilityState={{ expanded }}
      accessibilityLabel={`${expanded ? "Collapse" : "Expand"} quick view for ${accessibleGameName}`}
    >
      <View style={[compact.statusRail, { backgroundColor: isLive ? C.live : meta.color }]} />
      <View style={compact.statusCol}>
        <Text style={[compact.statusText, isLive && { color: C.live }]}>{formatGameClock(game)}</Text>
        <Text style={compact.leagueText}>{game.competition?.circuitLabel ?? prettyLeagueLabel(game.league)}</Text>
      </View>
      <View style={compact.teams}>
        <View style={compact.teamLine}>
          <TeamLogo uri={game.awayTeamLogo} name={game.awayTeam} size={18} borderColor="rgba(255,255,255,0.10)" fontSize={7} />
          <Text style={[compact.teamName, awayLost && compact.dimmed]} numberOfLines={1}>
            {compactTeamName(game.awayTeam)}
          </Text>
          {shouldShowScore && (
            <Text style={[compact.score, awayLost && compact.dimmed]}>
              {game.awayScore ?? "—"}
            </Text>
          )}
        </View>
        <View style={compact.teamLine}>
          <TeamLogo uri={game.homeTeamLogo} name={game.homeTeam} size={18} borderColor="rgba(255,255,255,0.10)" fontSize={7} />
          <Text style={[compact.teamName, homeLost && compact.dimmed]} numberOfLines={1}>
            {compactTeamName(game.homeTeam)}
          </Text>
          {shouldShowScore && (
            <Text style={[compact.score, homeLost && compact.dimmed]}>
              {game.homeScore ?? "—"}
            </Text>
          )}
        </View>
      </View>
      <View style={compact.trailing}>
        {isFavorite && <Ionicons name="star" size={12} color={C.accentGold} />}
        {chevron}
      </View>
    </Pressable>
  );
}

const compact = StyleSheet.create({
  row: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.card,
  },
  rowPressed: { backgroundColor: C.glassMedium },
  rowExpanded: { backgroundColor: C.backgroundSecondary },
  statusRail: { width: 3, alignSelf: "stretch" },
  statusCol: { width: 58, paddingHorizontal: 8, gap: 2 },
  statusText: { color: C.textSecondary, fontSize: 10, fontFamily: FONTS.bodyHeavy },
  leagueText: { color: C.textTertiary, fontSize: 9, fontFamily: FONTS.bodyBold },
  icon: { width: 28, height: 28, borderRadius: 9, alignItems: "center", justifyContent: "center", marginRight: 9 },
  eventBody: { flex: 1, minWidth: 0 },
  eventTitle: { color: C.text, fontSize: 13, fontFamily: FONTS.bodyHeavy },
  eventMeta: { color: C.textTertiary, fontSize: 11, fontFamily: FONTS.bodyMedium, marginTop: 2 },
  teams: { flex: 1, gap: 3, minWidth: 0 },
  teamLine: { flexDirection: "row", alignItems: "center", gap: 7 },
  teamName: { flex: 1, color: C.text, fontSize: 12, fontFamily: FONTS.bodySemiBold },
  score: { color: C.text, fontSize: 15, fontFamily: FONTS.bodyHeavy, minWidth: 24, textAlign: "right" },
  dimmed: { color: C.textTertiary },
  trailing: { minWidth: 24, alignItems: "flex-end", justifyContent: "center", gap: 4, paddingRight: 10 },
});

function ImportanceTags({ tags }: { tags: ImportanceTag[] }) {
  if (tags.length === 0) return null;
  return (
    <View style={importStyles.row}>
      {tags.map((tag, i) => (
        <View key={i} style={[importStyles.pill, { backgroundColor: tag.bgColor }]}>
          <Text style={[importStyles.text, { color: tag.color }]}>{tag.label}</Text>
        </View>
      ))}
    </View>
  );
}

const importStyles = StyleSheet.create({
  row: { flexDirection: "row", gap: 5, paddingHorizontal: 12, paddingTop: 8, paddingBottom: 2 },
  pill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5 },
  text: { fontSize: 9, fontWeight: "900", letterSpacing: 0.8, fontFamily: FONTS.bodyHeavy },
});

function leagueEventWord(league: string, count: number): string {
  if (league === "UFC" || league === "BOXING") return count === 1 ? "bout" : "bouts";
  if (league === "ATP" || league === "WTA") return count === 1 ? "match" : "matches";
  if (league === "PGA" || league === "LPGA" || league === "LIV") return count === 1 ? "tournament" : "tournaments";
  if (league === "F1" || league === "NASCAR" || league === "IRL") return count === 1 ? "race" : "races";
  return count === 1 ? "game" : "games";
}

function formatDateLabel(offset: number): string {
  if (offset === 0) return "Today";
  if (offset === -1) return "Yesterday";
  if (offset === 1) return "Tomorrow";
  return offsetToDate(offset).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function formatTime(startTime: string): string {
  const date = new Date(startTime);
  if (Number.isNaN(date.getTime())) return "TBD";
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function formatGameClock(game: Game): string {
  if (game.statusDetail) return game.statusDetail;
  if (game.status === "live") {
    return [game.quarter, game.timeRemaining].filter(Boolean).join(" · ") || "Live";
  }
  if (game.status === "finished") return "Final";
  return formatTime(game.startTime);
}

function compactTeamName(name: string): string {
  const parts = name.split(" ").filter(Boolean);
  if (name.length <= 18) return name;
  return parts.slice(-1)[0] ?? name;
}

function isEventLeague(league: string): boolean {
  return ["PGA", "LPGA", "LIV", "F1", "NASCAR", "IRL"].includes(league);
}

function getScoreboardCounts(games: Game[]) {
  return {
    live: games.filter(g => g.status === "live").length,
    upcoming: games.filter(g => g.status === "upcoming" && !g.statusDetail).length,
    finished: games.filter(g => g.status === "finished").length,
  };
}

function LeagueSectionHeader({ league, games }: { league: string; games: Game[] }) {
  const meta  = getLeagueMeta(league);
  const liveN = games.filter(g => g.status === "live").length;
  const word  = leagueEventWord(league, games.length);

  return (
    <View style={secH.row}>
      <View style={[secH.colorBar, { backgroundColor: meta.color }]} />
      <Ionicons name={meta.icon} size={16} color={meta.color} />
      <Text style={secH.label}>{meta.fullName}</Text>
      {liveN > 0 && (
        <View style={secH.livePill}>
          <View style={secH.liveDot} />
          <Text style={secH.liveText}>{liveN} live</Text>
        </View>
      )}
      <View style={{ flex: 1 }} />
      <Text style={secH.gameCount}>{games.length} {word}</Text>
    </View>
  );
}

const secH = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 2 },
  colorBar: { width: 4, height: 20, borderRadius: 2, flexShrink: 0 },
  label: { fontSize: 16, fontWeight: "800", color: C.text, fontFamily: FONTS.bodyHeavy, letterSpacing: 0 },
  livePill: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: C.live, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6,
  },
  liveDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: "#fff" },
  liveText: { color: "#fff", fontSize: 10, fontWeight: "900", fontFamily: FONTS.bodyHeavy },
  gameCount: { color: C.textTertiary, fontSize: 12, fontWeight: "700", fontFamily: FONTS.bodyMedium },
});

type SmartFilterKey = "none" | "live" | "my-teams" | "close" | "upcoming" | "finished" | "rivalry";
const SMART_FILTERS: { key: SmartFilterKey; label: string; icon: string; color: string }[] = [
  { key: "none", label: "All", icon: "grid", color: C.textSecondary },
  { key: "live", label: "Live", icon: "radio", color: C.live },
  { key: "my-teams", label: "My Teams", icon: "star", color: C.accent },
  { key: "close", label: "Close", icon: "flame", color: C.live },
  { key: "upcoming", label: "Next", icon: "time-outline", color: C.accentBlue },
  { key: "finished", label: "Final", icon: "checkmark-circle-outline", color: C.textSecondary },
  { key: "rivalry", label: "Rivalry", icon: "flash", color: C.accentGold },
];

export default function LiveScreen() {
  const insets = useSafeAreaInsets();
  const { preferences } = usePreferences();
  const params = useLocalSearchParams<{ filter?: string }>();
  const [activeLeague, setActiveLeague] = useState<string>("All");
  const [activeCategory, setActiveCategory] = useState<SportCategoryKey>("all");
  const [smartFilter, setSmartFilter] = useState<SmartFilterKey>("none");
  const [dateOffset, setDateOffset] = useState(0);
  const [showSportGroups, setShowSportGroups] = useState(false);

  // Apply filter from navigation params (e.g., tapping "nail-biters" on Home)
  useEffect(() => {
    const f = params.filter;
    if (f === "live" || f === "close" || f === "rivalry" || f === "my-teams" || f === "upcoming" || f === "finished") {
      setSmartFilter(f as SmartFilterKey);
    } else {
      setSmartFilter("none");
    }
  }, [params.filter]);
  const [refreshing, setRefreshing] = useState(false);
  const [compactMode, setCompactMode] = useState(true);
  const [expandedGameId, setExpandedGameId] = useState<string | null>(null);

  useEffect(() => {
    setExpandedGameId(null);
  }, [activeCategory, activeLeague, compactMode, dateOffset, smartFilter]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 + 84 : insets.bottom + 72;

  const dateParam = offsetToYYYYMMDD(dateOffset);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["games", dateParam],
    queryFn: () => api.getGames(undefined, dateParam),
    refetchInterval: dateOffset === 0 ? 30000 : false,
    staleTime: dateOffset === 0 ? 20000 : 300_000,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const toggleQuickView = (gameId: string) => {
    setExpandedGameId(current => current === gameId ? null : gameId);
  };

  const openGameTab = (gameId: string, tab: QuickGameTab) => {
    router.push({ pathname: "/game/[id]", params: { id: gameId, tab } } as any);
  };

  const all = data?.games ?? [];

  useEffect(() => {
    if (expandedGameId && data && !data.games.some(game => game.id === expandedGameId)) {
      setExpandedGameId(null);
    }
  }, [data, expandedGameId]);

  const myTeams = preferences.favoriteTeams;
  const nerdMode = preferences.appMode === "nerd";
  const isFav = (g: Game) => myTeams.includes(g.homeTeam) || myTeams.includes(g.awayTeam);
  const totalLive = all.filter(g => g.status === "live").length;
  const activeSmartMeta = SMART_FILTERS.find(f => f.key === smartFilter)!;
  const allLeagueKeys = useMemo(() => {
    const seen = new Set<string>();
    [...LEAGUE_KEYS, ...all.map(g => g.league)].forEach(league => {
      if (!league) return;
      // Vegas / California Classic / Salt Lake are circuits WITHIN the NBA Summer
      // League, not siblings of it — collapse them into one "Summer League" chip.
      seen.add(SUMMER_LEAGUE_CIRCUIT_SET.has(league) ? SUMMER_LEAGUE_FAMILY : league);
    });
    return Array.from(seen);
  }, [all]);
  const categoryLeagues = allLeagueKeys
    .filter(league => leagueMatchesCategory(league, activeCategory))
    .sort((a, b) => {
      // Circuits are collapsed into SUMMER_LEAGUE_FAMILY before this runs, so
      // they never appear here — order the family right after NBA.
      const summerOrder = ["NBA", SUMMER_LEAGUE_FAMILY];
      const aIndex = summerOrder.indexOf(a);
      const bIndex = summerOrder.indexOf(b);
      if (aIndex >= 0 || bIndex >= 0) return (aIndex >= 0 ? aIndex : 100) - (bIndex >= 0 ? bIndex : 100);
      return 0;
    });
  const leagueFilters = ["All", ...categoryLeagues];
  const activeCategoryMeta = SCORE_SPORT_CATEGORIES.find(category => category.key === activeCategory) ?? SCORE_SPORT_CATEGORIES[0];

  const myTeamGames = all
    .filter(g => isFav(g))
    .sort((a, b) => {
      const statusDiff = getStatusOrder(a) - getStatusOrder(b);
      if (statusDiff !== 0) return statusDiff;
      return getUrgencyScore(b, myTeams) - getUrgencyScore(a, myTeams);
    });
  const showPinnedMyTeams = myTeamGames.length > 0
    && smartFilter === "none"
    && activeLeague === "All"
    && activeCategory === "all";
  const pinnedMyTeamIds = showPinnedMyTeams
    ? new Set(myTeamGames.map(game => game.id))
    : null;

  let filteredBase: Game[] = activeLeague === "All" ? all : all.filter(g => matchesLeagueFilter(g, activeLeague));
  filteredBase = filteredBase.filter(g => leagueMatchesCategory(g.league, activeCategory));

  if (smartFilter === "my-teams") {
    filteredBase = filteredBase.filter(g => isFav(g));
  } else if (smartFilter === "live") {
    filteredBase = filteredBase.filter(g => g.status === "live");
  } else if (smartFilter === "close") {
    filteredBase = filteredBase.filter(g =>
      g.status === "live" &&
      g.homeScore != null &&
      g.awayScore != null &&
      Math.abs(g.homeScore - g.awayScore) <= 5
    );
  } else if (smartFilter === "rivalry") {
    filteredBase = filteredBase.filter(g => isRivalry(g.homeTeam, g.awayTeam));
  } else if (smartFilter === "upcoming") {
    filteredBase = filteredBase.filter(g => g.status === "upcoming" && !g.statusDetail);
  } else if (smartFilter === "finished") {
    filteredBase = filteredBase.filter(g => g.status === "finished");
  }
  const counts = getScoreboardCounts(filteredBase);

  const leagueList = activeLeague === "All"
    ? Array.from(new Set(filteredBase.map(scoreboardLeagueKey)))
    : [activeLeague as string];

  const leagueSections = leagueList
    .map(league => ({
      league,
      games: filteredBase
        .filter(g => matchesLeagueFilter(g, league) && !pinnedMyTeamIds?.has(g.id))
        .sort((a, b) => {
          const statusDiff = getStatusOrder(a) - getStatusOrder(b);
          if (statusDiff !== 0) return statusDiff;
          return getUrgencyScore(b, myTeams) - getUrgencyScore(a, myTeams);
        }),
    }))
    .filter(s => s.games.length > 0);

  const isPastDay  = dateOffset < 0;
  const isFutureDay = dateOffset > 0;

  const topGame = [...filteredBase].sort((a, b) => getUrgencyScore(b, myTeams) - getUrgencyScore(a, myTeams))[0] ?? null;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: topPad, paddingBottom: botPad }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.live} />}
      >
        {/* ── HEADER (compact: title + inline summary + toggle + search + profile) ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Scores</Text>
            {dateOffset !== 0 && (
              <Text style={styles.dateHeading}>
                {isPastDay ? "Final scores" : "Scheduled matchups"} · {offsetToDate(dateOffset).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </Text>
            )}
          </View>
          <View style={styles.headerRight}>
            <SearchButton />
            <ProfileButton />
          </View>
        </View>

        <ScoreboardDeck
          topGame={topGame}
          counts={counts}
          dateOffset={dateOffset}
          compactMode={compactMode}
          setCompactMode={setCompactMode}
          onGamePress={(game) => router.push({ pathname: "/game/[id]", params: { id: game.id } } as any)}
        />

        {/* ── CALENDAR DATE STRIP ── */}
        <CalendarStrip offset={dateOffset} onChange={setDateOffset} liveToday={totalLive} />

        {/* ── FILTERS: state, sport family, league ── */}
        <View style={styles.filterArea}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.smartRail}>
            {SMART_FILTERS.map(filter => {
              const active = smartFilter === filter.key;
              return (
                <Pressable
                  key={filter.key}
                  onPress={() => setSmartFilter(filter.key)}
                  hitSlop={COMPACT_CONTROL_HIT_SLOP}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={`Filter scores by ${filter.label}`}
                >
                  <View style={[styles.smartChip, active && { borderColor: filter.color, backgroundColor: `${filter.color}18` }]}>
                    <Ionicons name={filter.icon as any} size={13} color={active ? filter.color : C.textTertiary} />
                    <Text style={[styles.smartChipText, active && { color: filter.color }]}>{filter.label}</Text>
                  </View>
                </Pressable>
              );
            })}
            <Pressable
              onPress={() => setShowSportGroups(value => !value)}
              hitSlop={COMPACT_CONTROL_HIT_SLOP}
              accessibilityRole="button"
              accessibilityState={{ expanded: showSportGroups, selected: activeCategory !== "all" }}
              accessibilityLabel="Choose sports group"
            >
              <View style={[styles.smartChip, (showSportGroups || activeCategory !== "all") && { borderColor: C.accent, backgroundColor: `${C.accent}16` }]}>
                <Ionicons name={showSportGroups ? "chevron-up" : "options-outline"} size={13} color={(showSportGroups || activeCategory !== "all") ? C.accent : C.textTertiary} />
                <Text style={[styles.smartChipText, (showSportGroups || activeCategory !== "all") && { color: C.accent }]}>
                  {activeCategory === "all" ? "Sports" : activeCategoryMeta.label}
                </Text>
              </View>
            </Pressable>
          </ScrollView>

          {showSportGroups && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRail}>
              {SCORE_SPORT_CATEGORIES.map(category => {
                const active = activeCategory === category.key;
                const count = category.key === "all"
                  ? all.length
                  : all.filter(game => leagueMatchesCategory(game.league, category.key)).length;
                if (category.key !== "all" && count === 0) return null;
                return (
                  <Pressable
                    key={category.key}
                    onPress={() => { setActiveCategory(category.key); setActiveLeague("All"); setShowSportGroups(false); }}
                    hitSlop={COMPACT_CONTROL_HIT_SLOP}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={`Show ${category.label} scores`}
                  >
                    <View style={[styles.categoryChip, active && styles.categoryChipActive]}>
                      <Ionicons name={category.icon} size={13} color={active ? C.accent : C.textTertiary} />
                      <Text style={[styles.categoryText, active && { color: C.accent }]}>{category.label}</Text>
                      <Text style={[styles.categoryCount, active && { color: C.accent }]}>{count}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}

          <ScrollView
            horizontal showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
            style={styles.filterChipScroll}
          >
            {leagueFilters.map(league => {
              const active = activeLeague === league;
              const meta = league === "All" ? null : getLeagueMeta(league);
              const color = league === "All" ? C.accent : (meta?.color ?? C.accent);
              const categoryGames = all.filter(g => leagueMatchesCategory(g.league, activeCategory));
              const leagueGames = league === "All" ? categoryGames : all.filter(g => matchesLeagueFilter(g, league));
              const count = leagueGames.length;
              const liveCount = leagueGames.filter(g => g.status === "live").length;
              // Circuits are collapsed into the family above, so the family chip
              // covers all of Vegas / California / Salt Lake under one label.
              const chipLabel = league === SUMMER_LEAGUE_FAMILY
                ? "Summer League"
                : prettyLeagueLabel(league);

              if (league !== "All" && count === 0) return null;

              return (
                <Pressable
                  key={league}
                  onPress={() => setActiveLeague(league)}
                  hitSlop={COMPACT_CONTROL_HIT_SLOP}
                  accessibilityRole="button"
                  accessibilityLabel={`Show ${meta?.fullName ?? league} scores`}
                  accessibilityState={{ selected: active }}
                >
                  <View style={[styles.chip, active && { borderColor: color, backgroundColor: `${color}1A` }]}>
                    {meta?.icon ? (
                      <Ionicons name={meta.icon} size={12} color={active ? color : C.textTertiary} />
                    ) : league === "All" ? (
                      <Ionicons name="grid" size={11} color={active ? color : C.textTertiary} />
                    ) : null}
                    <Text style={[styles.chipText, active && { color }]}>{chipLabel}</Text>
                    {liveCount > 0 ? (
                      <View style={[styles.chipLive, active && { backgroundColor: `${color}40` }]}>
                        <View style={[styles.chipLiveDot, { backgroundColor: active ? color : C.live }]} />
                        <Text style={[styles.chipLiveText, active && { color }]}>{liveCount}</Text>
                      </View>
                    ) : count > 0 && league !== "All" ? (
                      <View style={[styles.chipCount, active && { backgroundColor: `${color}30` }]}>
                        <Text style={[styles.chipCountText, active && { color }]}>{count}</Text>
                      </View>
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* ── GAME SECTIONS ── */}
        {isLoading ? (
          <View style={styles.list}>
            {[1, 2, 3].map(i => <GameCardSkeleton key={i} />)}
          </View>
        ) : isError ? (
          <View style={styles.empty}>
            <Ionicons name="cloud-offline-outline" size={52} color={C.textTertiary} />
            <Text style={styles.emptyTitle}>Scores unavailable</Text>
            <Text style={styles.emptyText}>
              Live sports data could not be reached. Check your connection and try again.
            </Text>
            <Pressable
              style={({ pressed }) => [styles.retryBtn, pressed && styles.retryBtnPressed]}
              onPress={() => void refetch()}
              accessibilityRole="button"
              accessibilityLabel="Try loading scores again"
            >
              <Ionicons name="refresh" size={15} color="#fff" />
              <Text style={styles.retryText}>Try again</Text>
            </Pressable>
          </View>
        ) : showPinnedMyTeams ? (
          <View style={styles.sections}>
            {/* ── MY TEAMS pinned section ── */}
            <View style={styles.section}>
              <View style={styles.myTeamsHeader}>
                <Ionicons name="star" size={12} color={C.accentGold} />
                <Text style={styles.myTeamsTitle}>MY TEAMS</Text>
                <View style={styles.myTeamsLiveBadge}>
                  {myTeamGames.some(g => g.status === "live") && (
                    <>
                      <PulsingLiveDot />
                      <Text style={styles.myTeamsLiveText}>{myTeamGames.filter(g => g.status === "live").length} LIVE</Text>
                    </>
                  )}
                </View>
              </View>
              <View style={[styles.listCard, compactMode && styles.compactListCard]}>
                {myTeamGames.map((game, idx) => {
                  const tags = getImportanceTags(game, myTeams);
                  const hasRivalry = isRivalry(game.homeTeam, game.awayTeam);
                  return (
                    <View key={game.id}>
                      {idx > 0 && <View style={styles.rowDivider} />}
                      <View style={[hasRivalry && styles.rivalryRow]}>
                        {compactMode ? (
                          <>
                            <CompactScoreRow
                              game={game}
                              isFavorite={true}
                              expanded={expandedGameId === game.id}
                              onToggle={() => toggleQuickView(game.id)}
                            />
                            {expandedGameId === game.id && (
                              <QuickGamePanel
                                game={game}
                                accentColor={getLeagueMeta(game.league).color}
                                onOpenTab={(tab) => openGameTab(game.id, tab)}
                              />
                            )}
                          </>
                        ) : (
                          <>
                            <ImportanceTags tags={tags} />
                            <GameCard
                              game={game}
                              isFavorite={true}
                              grouped
                              nerdMode={nerdMode}
                              variant="default"
                              onPress={() => router.push({ pathname: "/game/[id]", params: { id: game.id } } as any)}
                            />
                          </>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* ── Rest of league sections ── */}
            {leagueSections.map(({ league, games }) => (
              <View key={league} style={styles.section}>
                <LeagueSectionHeader league={league} games={games} />
                <View style={[styles.listCard, compactMode && styles.compactListCard]}>
                  {games.map((game, idx) => {
                    const tags = getImportanceTags(game, myTeams);
                    const hasRivalry = isRivalry(game.homeTeam, game.awayTeam);
                    return (
                      <View key={game.id}>
                        {idx > 0 && <View style={styles.rowDivider} />}
                        <View style={[hasRivalry && styles.rivalryRow]}>
                          {compactMode ? (
                            <>
                              <CompactScoreRow
                                game={game}
                                isFavorite={isFav(game)}
                                expanded={expandedGameId === game.id}
                                onToggle={() => toggleQuickView(game.id)}
                              />
                              {expandedGameId === game.id && (
                                <QuickGamePanel
                                  game={game}
                                  accentColor={getLeagueMeta(game.league).color}
                                  onOpenTab={(tab) => openGameTab(game.id, tab)}
                                />
                              )}
                            </>
                          ) : (
                            <>
                              <ImportanceTags tags={tags} />
                              <GameCard
                                game={game}
                                isFavorite={isFav(game)}
                                grouped
                                nerdMode={nerdMode}
                                variant="default"
                                onPress={() => router.push({ pathname: "/game/[id]", params: { id: game.id } } as any)}
                              />
                            </>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            ))}
            {dateOffset !== 0 && (
              <Pressable
                style={styles.backTodayBtn}
                onPress={() => setDateOffset(0)}
                accessibilityRole="button"
                accessibilityLabel="Back to today"
              >
                <Ionicons name="today-outline" size={14} color="#fff" />
                <Text style={styles.backTodayText}>Back to Today</Text>
              </Pressable>
            )}
          </View>
        ) : leagueSections.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name={isFutureDay ? "calendar-outline" : "tv-outline"} size={52} color={C.textTertiary} />
            <Text style={styles.emptyTitle}>
              {isFutureDay ? "Nothing Scheduled" : isPastDay ? "No Games Played" : smartFilter !== "none" ? "No Matches" : "No Games Today"}
            </Text>
            <Text style={styles.emptyText}>
              {smartFilter !== "none"
                ? `No games match the "${activeSmartMeta.label}" filter`
                : isFutureDay
                  ? "No events are scheduled for this day yet"
                  : isPastDay
                    ? "No games were played on this day"
                    : "Check back for live matchups"}
            </Text>
            {dateOffset !== 0 && (
              <Pressable
                style={styles.backTodayBtn}
                onPress={() => setDateOffset(0)}
                accessibilityRole="button"
                accessibilityLabel="Back to today"
              >
                <Ionicons name="today-outline" size={14} color="#fff" />
                <Text style={styles.backTodayText}>Back to Today</Text>
              </Pressable>
            )}
          </View>
        ) : (
          <View style={styles.sections}>
            {leagueSections.map(({ league, games }) => (
              <View key={league} style={styles.section}>
                <LeagueSectionHeader league={league} games={games} />
                <View style={[styles.listCard, compactMode && styles.compactListCard]}>
                  {games.map((game, idx) => {
                    const tags = getImportanceTags(game, myTeams);
                    const hasRivalry = isRivalry(game.homeTeam, game.awayTeam);
                    return (
                      <View key={game.id}>
                        {idx > 0 && <View style={styles.rowDivider} />}
                        <View style={[hasRivalry && styles.rivalryRow]}>
                        {compactMode ? (
                          <>
                            <CompactScoreRow
                              game={game}
                              isFavorite={isFav(game)}
                              expanded={expandedGameId === game.id}
                              onToggle={() => toggleQuickView(game.id)}
                            />
                            {expandedGameId === game.id && (
                              <QuickGamePanel
                                game={game}
                                accentColor={getLeagueMeta(game.league).color}
                                onOpenTab={(tab) => openGameTab(game.id, tab)}
                              />
                            )}
                          </>
                          ) : (
                            <>
                              <ImportanceTags tags={tags} />
                              <GameCard
                                game={game}
                                isFavorite={isFav(game)}
                                grouped
                                nerdMode={nerdMode}
                                variant="default"
                                onPress={() => router.push({ pathname: "/game/[id]", params: { id: game.id } } as any)}
                              />
                            </>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            ))}
            {dateOffset !== 0 && (
              <Pressable
                style={styles.backTodayBtn}
                onPress={() => setDateOffset(0)}
                accessibilityRole="button"
                accessibilityLabel="Back to today"
              >
                <Ionicons name="today-outline" size={14} color="#fff" />
                <Text style={styles.backTodayText}>Back to Today</Text>
              </Pressable>
            )}
          </View>
        )}

        <ScoreEventRail
          activeCategory={activeCategory}
          onSelectCategory={(category) => {
            setActiveCategory(category);
            setActiveLeague("All");
            setShowSportGroups(false);
          }}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  scroll: { paddingHorizontal: 14, gap: 0 },

  header: {
    flexDirection: "row", alignItems: "flex-start",
    justifyContent: "space-between",
    paddingTop: 12, paddingBottom: 6, paddingHorizontal: 4,
  },
  title: { fontSize: 26, fontWeight: "900", color: C.text, fontFamily: FONTS.bodyHeavy, letterSpacing: 0 },
  summaryRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 },
  liveDotSmall: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.live },
  summaryText: { color: C.textTertiary, fontSize: 12, fontWeight: "700", fontFamily: FONTS.bodyMedium },
  dateHeading: { fontSize: 12, color: C.textTertiary, fontWeight: "700", fontFamily: FONTS.bodyMedium, marginTop: 2 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10, paddingTop: 4 },
  modeToggle: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: C.card, borderWidth: 1.5, borderColor: C.cardBorder,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10,
  },
  modeToggleActive: { borderColor: `${C.accent}55`, backgroundColor: `${C.accent}10` },
  modeLabel: { color: C.textSecondary, fontSize: 12, fontWeight: "800", fontFamily: FONTS.bodyBold },

  filterArea: { marginBottom: 10, zIndex: 10 },
  smartRail: { gap: 6, paddingRight: 14, marginBottom: 6 },
  smartChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  smartChipText: { color: C.textSecondary, fontSize: 11, fontFamily: FONTS.bodyHeavy },
  categoryRail: { gap: 6, paddingRight: 14, marginBottom: 6 },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 11,
    backgroundColor: C.backgroundSecondary,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  categoryChipActive: { backgroundColor: `${C.accent}12`, borderColor: `${C.accent}35` },
  categoryText: { color: C.textSecondary, fontSize: 11, fontFamily: FONTS.bodyHeavy },
  categoryCount: { color: C.textTertiary, fontSize: 10, fontFamily: FONTS.bodyHeavy },
  filterDropdownWrap: { zIndex: 20, marginBottom: 8 },
  filterBtn: {
    flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start",
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 10, backgroundColor: C.card, borderWidth: 1.5, borderColor: C.cardBorder,
  },
  filterBtnText: { color: C.textSecondary, fontSize: 13, fontWeight: "800", fontFamily: FONTS.bodyBold },
  filterMenu: {
    position: "absolute", top: 42, left: 0, zIndex: 30,
    backgroundColor: C.card, borderRadius: 12, borderWidth: 1, borderColor: C.cardBorder,
    paddingVertical: 4, minWidth: 180,
    ...Platform.select({
      web: { boxShadow: "0 8px 24px rgba(0,0,0,0.5)" },
      default: {},
    }),
  },
  filterMenuItem: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  filterMenuText: { color: C.textSecondary, fontSize: 14, fontWeight: "800", fontFamily: FONTS.bodyBold },
  filterOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 5 },
  filterChipScroll: {},
  filterRow: { gap: 6, paddingRight: 14 },
  chip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 18, backgroundColor: C.card, borderWidth: 1, borderColor: C.cardBorder,
  },
  chipText: { color: C.textSecondary, fontSize: 12, fontWeight: "800", fontFamily: FONTS.bodyBold },
  chipLive: {
    flexDirection: "row", alignItems: "center", gap: 3,
    backgroundColor: `${C.live}20`, borderRadius: 7, paddingHorizontal: 5, paddingVertical: 1,
  },
  chipLiveDot: { width: 5, height: 5, borderRadius: 3 },
  chipLiveText: { fontSize: 10, fontWeight: "900", color: C.live, fontFamily: FONTS.bodyHeavy },
  chipCount: {
    backgroundColor: C.cardBorder, borderRadius: 7,
    paddingHorizontal: 5, paddingVertical: 1, minWidth: 18, alignItems: "center",
  },
  chipCountText: { fontSize: 10, fontWeight: "800", color: C.textTertiary, fontFamily: FONTS.bodyBold },

  sections: { gap: 11, paddingVertical: 5 },
  section: { gap: 7 },

  myTeamsHeader: {
    flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 4,
  },
  myTeamsTitle: {
    fontSize: 12, fontWeight: "900", color: C.accentGold,
    letterSpacing: 1.2, textTransform: "uppercase", fontFamily: FONTS.bodyBold,
    flex: 1,
  },
  myTeamsLiveBadge: { flexDirection: "row", alignItems: "center", gap: 4 },
  myTeamsLiveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.live },
  myTeamsLiveText: { color: C.live, fontSize: 10, fontWeight: "900", letterSpacing: 0.5, fontFamily: FONTS.bodyHeavy },
  list: { gap: 0 },
  listCard: {
    backgroundColor: C.card, borderRadius: 14, overflow: "hidden",
    borderWidth: 1, borderColor: C.cardBorder,
  },
  compactListCard: { borderRadius: 12 },
  rowDivider: { height: StyleSheet.hairlineWidth, backgroundColor: C.separator, marginLeft: 70 },
  rivalryRow: { borderLeftWidth: 2, borderLeftColor: `${C.accentGold}60` },

  empty: { alignItems: "center", paddingVertical: 80, gap: 12 },
  emptyTitle: { fontSize: 20, fontWeight: "800", color: C.textSecondary, fontFamily: FONTS.bodyBold },
  emptyText: { fontSize: 14, color: C.textTertiary, textAlign: "center", paddingHorizontal: 24, fontFamily: FONTS.bodyMedium },
  retryBtn: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: C.accent,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryBtnPressed: { opacity: 0.78 },
  retryText: { color: "#fff", fontSize: 13, fontFamily: FONTS.bodyHeavy },

  backTodayBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: C.accent, paddingHorizontal: 18, paddingVertical: 10,
    borderRadius: 12, marginTop: 8, alignSelf: "center",
  },
  backTodayText: { color: "#fff", fontSize: 13, fontWeight: "900", fontFamily: FONTS.bodyHeavy },
});
