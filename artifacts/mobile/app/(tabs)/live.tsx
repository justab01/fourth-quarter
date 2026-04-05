import React, { useState, useRef, useEffect } from "react";
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  Pressable, Platform, type ScrollView as ScrollViewType
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { api } from "@/utils/api";
import type { Game } from "@/utils/api";
import { GameCard } from "@/components/GameCard";
import { GameCardSkeleton } from "@/components/LoadingSkeleton";
import { usePreferences } from "@/context/PreferencesContext";
import { SearchButton } from "@/components/SearchButton";
import { ProfileButton } from "@/components/ProfileButton";

const C = Colors.dark;

const LEAGUE_KEYS = ["NBA", "NHL", "NFL", "MLB", "NCAAB", "MLS", "EPL", "UCL", "LIGA", "WNBA", "UFC", "BOXING", "ATP", "WTA"] as const;

const LEAGUE_META: Record<string, { color: string; emoji: string; fullName: string }> = {
  NBA:    { color: C.nba,       emoji: "🏀", fullName: "NBA" },
  NFL:    { color: C.nfl,       emoji: "🏈", fullName: "NFL" },
  MLB:    { color: C.mlb,       emoji: "⚾", fullName: "MLB" },
  MLS:    { color: C.mls,       emoji: "⚽", fullName: "MLS" },
  NHL:    { color: C.nhl,       emoji: "🏒", fullName: "NHL" },
  WNBA:   { color: C.wnba,      emoji: "🏀", fullName: "WNBA" },
  NCAAB:  { color: C.ncaab,     emoji: "🎓", fullName: "NCAA Basketball" },
  NCAAF:  { color: C.ncaaf,     emoji: "🏈", fullName: "NCAA Football" },
  EPL:    { color: C.eplBright, emoji: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", fullName: "Premier League" },
  UCL:    { color: C.ucl,       emoji: "⭐", fullName: "Champions League" },
  LIGA:   { color: C.liga,      emoji: "🇪🇸", fullName: "La Liga" },
  UFC:    { color: C.ufc,       emoji: "🥋", fullName: "UFC" },
  BOXING: { color: C.boxing,    emoji: "🥊", fullName: "Boxing" },
  ATP:    { color: C.atp,       emoji: "🎾", fullName: "ATP Tennis" },
  WTA:    { color: C.wta,       emoji: "🎾", fullName: "WTA Tennis" },
};

const STATUS_ORDER: Record<Game["status"], number> = { live: 0, upcoming: 1, finished: 2 };

function getUrgencyScore(game: Game, myTeams: string[]): number {
  let score = 0;
  const homeScore = game.homeScore ?? 0;
  const awayScore = game.awayScore ?? 0;
  const diff = Math.abs(homeScore - awayScore);
  const period = (game.quarter ?? "").toLowerCase();
  const isOT = period.includes("ot") || period.includes("overtime");
  const isLate = period.includes("4") || period.includes("q4") || period.includes("9th") || period.includes("3rd") || period.includes("2nd half");

  if (game.status === "live") {
    score += 50;
    if (isOT) score += 30;
    if (diff <= 3 && isLate) score += 25;
    else if (diff <= 5) score += 15;
    else if (diff <= 10) score += 8;
    if (diff >= 20) score -= 10;
    if (isLate) score += 10;
  } else if (game.status === "upcoming") {
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
  const isOT = period.includes("ot") || period.includes("overtime");
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

  const now = new Date();
  const month = now.getMonth();

  const isPlayoffBubble = (game.league === "NBA" && (month >= 2 && month <= 3)) ||
    (game.league === "NHL" && (month >= 2 && month <= 3)) ||
    (game.league === "MLB" && (month >= 8 && month <= 9));
  if (isPlayoffBubble) {
    tags.push({ label: "BUBBLE", color: "#F59E0B", bgColor: "#F59E0B15" });
  }

  const isPlayoffSeason = (game.league === "NBA" && (month >= 3 && month <= 6)) ||
    (game.league === "MLB" && month >= 9) ||
    (game.league === "NHL" && month >= 3) ||
    (game.league === "NCAAB" && month === 2);
  if (isPlayoffSeason && !isPlayoffBubble) {
    tags.push({ label: "PLAYOFF RACE", color: C.accentGreen, bgColor: `${C.accentGreen}18` });
  }

  return tags.slice(0, 2);
}

const CAL_DAYS_BACK  = 14;
const CAL_DAYS_FWD   = 14;
const CAL_TOTAL      = CAL_DAYS_BACK + 1 + CAL_DAYS_FWD;
const CAL_CELL_W     = 52;
const CAL_CELL_GAP   = 6;
const CAL_CELL_TOTAL = CAL_CELL_W + CAL_CELL_GAP;

const DAY_ABBR  = ["Su","Mo","Tu","We","Th","Fr","Sa"];
const MON_ABBR  = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function offsetToDate(offset: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d;
}

function offsetToYYYYMMDD(offset: number): string | undefined {
  if (offset === 0) return undefined;
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
          <Pressable key={dayOff} onPress={() => onChange(dayOff)}>
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
  strip: { marginBottom: 6 },
  row:   { gap: CAL_CELL_GAP, paddingHorizontal: 4 },
  cell: {
    width: CAL_CELL_W, alignItems: "center", paddingVertical: 8,
    borderRadius: 12, backgroundColor: C.card,
    borderWidth: 1.5, borderColor: C.cardBorder, gap: 2,
  },
  cellActive: { borderColor: C.accent, backgroundColor: `${C.accent}18` },
  cellPast:   { opacity: 0.7 },
  top:        { fontSize: 10, fontWeight: "700", color: C.textTertiary, letterSpacing: 0.4 },
  topActive:  { color: C.accent },
  num:        { fontSize: 18, fontWeight: "800", color: C.textSecondary, fontFamily: "Inter_700Bold" },
  numActive:  { color: C.text },
  numPast:    { color: C.textTertiary },
  liveDot:    { width: 6, height: 6, borderRadius: 3, backgroundColor: C.live },
  futureDot:  { width: 4, height: 4, borderRadius: 2, backgroundColor: `${C.accent}50` },
  dot:        { width: 4, height: 4 },
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
  text: { fontSize: 9, fontWeight: "900", letterSpacing: 0.8 },
});

function leagueEventWord(league: string, count: number): string {
  if (league === "UFC" || league === "BOXING") return count === 1 ? "bout" : "bouts";
  if (league === "ATP" || league === "WTA") return count === 1 ? "match" : "matches";
  return count === 1 ? "game" : "games";
}

function LeagueSectionHeader({ league, games }: { league: string; games: Game[] }) {
  const meta  = LEAGUE_META[league] ?? { color: C.accent, emoji: "🏆", fullName: league };
  const liveN = games.filter(g => g.status === "live").length;
  const word  = leagueEventWord(league, games.length);

  return (
    <View style={secH.row}>
      <View style={[secH.colorBar, { backgroundColor: meta.color }]} />
      <Text style={secH.emoji}>{meta.emoji}</Text>
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
  emoji: { fontSize: 16 },
  label: { fontSize: 16, fontWeight: "800", color: C.text, fontFamily: "Inter_700Bold", letterSpacing: -0.2 },
  livePill: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: C.live, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6,
  },
  liveDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: "#fff" },
  liveText: { color: "#fff", fontSize: 10, fontWeight: "900" },
  gameCount: { color: C.textTertiary, fontSize: 12, fontWeight: "600" },
});

type ChipType = "league" | "filter";
interface FilterChip {
  key: string;
  label: string;
  type: ChipType;
  color: string;
  icon?: string;
  emoji?: string;
}

const FILTER_CHIPS: FilterChip[] = [
  { key: "All", label: "All", type: "league", color: C.accent },
  { key: "My Teams", label: "My Teams", type: "filter", color: C.accent, icon: "star" },
  { key: "close", label: "Close", type: "filter", color: C.live, icon: "flame" },
  { key: "rivalry", label: "Rivalry", type: "filter", color: C.accentGold, icon: "flash" },
];

const LEAGUE_CHIPS: FilterChip[] = LEAGUE_KEYS.map(l => ({
  key: l,
  label: l,
  type: "league" as ChipType,
  color: LEAGUE_META[l]?.color ?? C.accent,
  emoji: LEAGUE_META[l]?.emoji,
}));

const ALL_CHIPS: FilterChip[] = [
  ...FILTER_CHIPS,
  ...LEAGUE_CHIPS,
];

export default function LiveScreen() {
  const insets = useSafeAreaInsets();
  const { preferences } = usePreferences();
  const [activeChip, setActiveChip] = useState("All");
  const [dateOffset, setDateOffset] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [compactMode, setCompactMode] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 + 84 : insets.bottom + 72;

  const dateParam = offsetToYYYYMMDD(dateOffset);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["live-games", dateParam ?? "today"],
    queryFn: () => api.getGames(undefined, dateParam),
    refetchInterval: dateOffset === 0 ? 30000 : false,
    staleTime: dateOffset === 0 ? 20000 : 300_000,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const all = data?.games ?? [];
  const myTeams = preferences.favoriteTeams;
  const isFav = (g: Game) => myTeams.includes(g.homeTeam) || myTeams.includes(g.awayTeam);
  const totalLive = all.filter(g => g.status === "live").length;

  const isFilterChip = activeChip === "My Teams" || activeChip === "close" || activeChip === "rivalry";

  let filteredBase: Game[];
  if (activeChip === "My Teams") {
    filteredBase = all.filter(g => isFav(g));
  } else if (activeChip === "close") {
    filteredBase = all.filter(g => g.status === "live" && Math.abs((g.homeScore ?? 0) - (g.awayScore ?? 0)) <= 5);
  } else if (activeChip === "rivalry") {
    filteredBase = all.filter(g => isRivalry(g.homeTeam, g.awayTeam));
  } else if (activeChip === "All") {
    filteredBase = all;
  } else {
    filteredBase = all.filter(g => g.league === activeChip);
  }

  const leagueList = (isFilterChip || activeChip === "All")
    ? LEAGUE_KEYS as readonly string[]
    : [activeChip];

  const leagueSections = leagueList
    .map(league => ({
      league,
      games: filteredBase
        .filter(g => g.league === league)
        .sort((a, b) => {
          const statusDiff = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
          if (statusDiff !== 0) return statusDiff;
          return getUrgencyScore(b, myTeams) - getUrgencyScore(a, myTeams);
        }),
    }))
    .filter(s => s.games.length > 0);

  const isPastDay  = dateOffset < 0;
  const isFutureDay = dateOffset > 0;

  const summaryParts: string[] = [];
  if (totalLive > 0) summaryParts.push(`${totalLive} live`);
  if (all.length > 0) summaryParts.push(`${all.length} events`);
  const summaryText = summaryParts.join(" · ");

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
            {dateOffset === 0 ? (
              summaryText ? (
                <View style={styles.summaryRow}>
                  {totalLive > 0 && <View style={styles.liveDotSmall} />}
                  <Text style={styles.summaryText}>{summaryText}</Text>
                </View>
              ) : null
            ) : (
              <Text style={styles.dateHeading}>
                {isPastDay ? "Final scores" : "Scheduled matchups"} · {offsetToDate(dateOffset).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </Text>
            )}
          </View>
          <View style={styles.headerRight}>
            <Pressable
              style={[styles.modeToggle, compactMode && styles.modeToggleActive]}
              onPress={() => setCompactMode(v => !v)}
              hitSlop={8}
            >
              <Ionicons name={compactMode ? "list" : "grid-outline"} size={15} color={compactMode ? C.accent : C.textSecondary} />
              <Text style={[styles.modeLabel, compactMode && { color: C.accent }]}>
                {compactMode ? "Compact" : "Full"}
              </Text>
            </Pressable>
            <SearchButton />
            <ProfileButton />
          </View>
        </View>

        {/* ── CALENDAR DATE STRIP ── */}
        <CalendarStrip offset={dateOffset} onChange={setDateOffset} liveToday={totalLive} />

        {/* ── UNIFIED FILTER BAR (smart filters + league chips in one row) ── */}
        <ScrollView
          horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow} style={styles.filterScroll}
        >
          {ALL_CHIPS.map((chip, idx) => {
            const active = activeChip === chip.key;
            const color = chip.color;
            const count = chip.key === "All" ? all.length
              : chip.key === "My Teams" ? all.filter(g => isFav(g)).length
              : chip.key === "close" ? all.filter(g => g.status === "live" && Math.abs((g.homeScore ?? 0) - (g.awayScore ?? 0)) <= 5).length
              : chip.key === "rivalry" ? all.filter(g => isRivalry(g.homeTeam, g.awayTeam)).length
              : all.filter(g => g.league === chip.key).length;
            const liveCount = chip.type === "league" && chip.key !== "All"
              ? all.filter(g => g.league === chip.key && g.status === "live").length
              : chip.key === "All" ? totalLive
              : 0;

            const showDivider = idx === FILTER_CHIPS.length;

            return (
              <React.Fragment key={chip.key}>
                {showDivider && <View style={styles.chipDivider} />}
                <Pressable onPress={() => setActiveChip(chip.key)}>
                  <View style={[styles.chip, active && { borderColor: color, backgroundColor: `${color}1A` }]}>
                    {chip.icon ? (
                      <Ionicons name={chip.icon as any} size={11} color={active ? color : C.textTertiary} />
                    ) : chip.emoji ? (
                      <Text style={styles.chipEmoji}>{chip.emoji}</Text>
                    ) : null}
                    <Text style={[styles.chipText, active && { color }]}>{chip.label}</Text>
                    {liveCount > 0 ? (
                      <View style={[styles.chipLive, active && { backgroundColor: `${color}40` }]}>
                        <View style={[styles.chipLiveDot, { backgroundColor: active ? color : C.live }]} />
                        <Text style={[styles.chipLiveText, active && { color }]}>{liveCount}</Text>
                      </View>
                    ) : count > 0 && chip.key !== "All" ? (
                      <View style={[styles.chipCount, active && { backgroundColor: `${color}30` }]}>
                        <Text style={[styles.chipCountText, active && { color }]}>{count}</Text>
                      </View>
                    ) : null}
                  </View>
                </Pressable>
              </React.Fragment>
            );
          })}
        </ScrollView>

        {/* ── GAME SECTIONS ── */}
        {isLoading ? (
          <View style={styles.list}>
            {[1, 2, 3].map(i => <GameCardSkeleton key={i} />)}
          </View>
        ) : leagueSections.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name={isFutureDay ? "calendar-outline" : "tv-outline"} size={52} color={C.textTertiary} />
            <Text style={styles.emptyTitle}>
              {isFutureDay ? "Nothing Scheduled" : isPastDay ? "No Games Played" : isFilterChip ? "No Matches" : "No Games Today"}
            </Text>
            <Text style={styles.emptyText}>
              {isFilterChip
                ? `No games match the "${ALL_CHIPS.find(c => c.key === activeChip)?.label}" filter`
                : isFutureDay
                  ? "No events are scheduled for this day yet"
                  : isPastDay
                    ? "No games were played on this day"
                    : "Check back for live matchups"}
            </Text>
            {dateOffset !== 0 && (
              <Pressable style={styles.backTodayBtn} onPress={() => setDateOffset(0)}>
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
                <View style={styles.listCard}>
                  {games.map((game, idx) => {
                    const tags = getImportanceTags(game, myTeams);
                    const hasRivalry = isRivalry(game.homeTeam, game.awayTeam);
                    return (
                      <View key={game.id}>
                        {idx > 0 && <View style={styles.rowDivider} />}
                        <View style={[hasRivalry && styles.rivalryRow]}>
                          <ImportanceTags tags={tags} />
                          <GameCard
                            game={game}
                            isFavorite={isFav(game)}
                            grouped
                            variant={compactMode ? "compact" : "default"}
                            onPress={() => router.push({ pathname: "/game/[id]", params: { id: game.id } } as any)}
                          />
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            ))}
            {dateOffset !== 0 && (
              <Pressable style={styles.backTodayBtn} onPress={() => setDateOffset(0)}>
                <Ionicons name="today-outline" size={14} color="#fff" />
                <Text style={styles.backTodayText}>Back to Today</Text>
              </Pressable>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  scroll: { paddingHorizontal: 16, gap: 0 },

  header: {
    flexDirection: "row", alignItems: "flex-start",
    justifyContent: "space-between",
    paddingTop: 14, paddingBottom: 8, paddingHorizontal: 4,
  },
  title: { fontSize: 26, fontWeight: "900", color: C.text, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  summaryRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 },
  liveDotSmall: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.live },
  summaryText: { color: C.textTertiary, fontSize: 12, fontWeight: "600" },
  dateHeading: { fontSize: 12, color: C.textTertiary, fontWeight: "600", marginTop: 2 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10, paddingTop: 4 },
  modeToggle: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: C.card, borderWidth: 1.5, borderColor: C.cardBorder,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10,
  },
  modeToggleActive: { borderColor: `${C.accent}55`, backgroundColor: `${C.accent}10` },
  modeLabel: { color: C.textSecondary, fontSize: 12, fontWeight: "700" },

  filterScroll: { marginBottom: 12 },
  filterRow: { gap: 7, paddingRight: 16 },
  chipDivider: { width: 1, height: 24, backgroundColor: C.separator, marginHorizontal: 2, alignSelf: "center" },
  chip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 20, backgroundColor: C.card, borderWidth: 1.5, borderColor: C.cardBorder,
  },
  chipEmoji: { fontSize: 12 },
  chipText: { color: C.textSecondary, fontSize: 13, fontWeight: "700" },
  chipLive: {
    flexDirection: "row", alignItems: "center", gap: 3,
    backgroundColor: `${C.live}20`, borderRadius: 7, paddingHorizontal: 5, paddingVertical: 1,
  },
  chipLiveDot: { width: 5, height: 5, borderRadius: 3 },
  chipLiveText: { fontSize: 10, fontWeight: "800", color: C.live },
  chipCount: {
    backgroundColor: C.cardBorder, borderRadius: 7,
    paddingHorizontal: 5, paddingVertical: 1, minWidth: 18, alignItems: "center",
  },
  chipCountText: { fontSize: 10, fontWeight: "700", color: C.textTertiary },

  sections: { gap: 20, paddingVertical: 6 },
  section: { gap: 10 },
  list: { gap: 0 },
  listCard: {
    backgroundColor: C.card, borderRadius: 16, overflow: "hidden",
    borderWidth: 1, borderColor: C.cardBorder,
  },
  rowDivider: { height: StyleSheet.hairlineWidth, backgroundColor: C.separator, marginLeft: 70 },
  rivalryRow: { borderLeftWidth: 2, borderLeftColor: `${C.accentGold}60` },

  empty: { alignItems: "center", paddingVertical: 80, gap: 12 },
  emptyTitle: { fontSize: 20, fontWeight: "800", color: C.textSecondary, fontFamily: "Inter_700Bold" },
  emptyText: { fontSize: 14, color: C.textTertiary, textAlign: "center", paddingHorizontal: 24 },

  backTodayBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: C.accent, paddingHorizontal: 18, paddingVertical: 10,
    borderRadius: 12, marginTop: 8, alignSelf: "center",
  },
  backTodayText: { color: "#fff", fontSize: 13, fontWeight: "800" },
});
