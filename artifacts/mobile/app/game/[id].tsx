import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  Platform, ActivityIndicator, Image, Animated,
  Linking, Share,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { FONTS, FONT_SIZES } from "@/constants/typography";
import { api, type PlayerStatLine } from "@/utils/api";
import { LEAGUE_COLORS } from "@/constants/sports";
import { goToTeam, goToPlayer } from "@/utils/navHelpers";
import { getEspnHeadshotUrl } from "@/constants/espnAthleteIds";
import { TeamLogo } from "@/components/GameCard";
import { ArenaRenderer } from "@/components/ArenaRenderer";
import { MomentumGraph } from "@/components/MomentumGraph";
import { useGameSocket } from "@/hooks/useGameSocket";
import { LiveTrackerPanel, computeTrackerState, type TrackerState } from "@/components/LiveTrackerPanel";
import { BaseballGamecast } from "@/components/BaseballGamecast";
import type { BaseballHubSection } from "@/components/gamecast/BaseballGameHub";

const C = Colors.dark;

type GameTab = "gamecast" | "boxscore" | "playbyplay" | "stats" | "lineups";
type GamePlay = { time: string; description: string; team: string };

const TABS: { key: GameTab; label: string; icon: string }[] = [
  { key: "gamecast",   label: "Gamecast",   icon: "tv-outline" },
  { key: "boxscore",   label: "Box Score",  icon: "grid-outline" },
  { key: "playbyplay", label: "Scoring",    icon: "list-outline" },
  { key: "stats",      label: "Stats",      icon: "bar-chart-outline" },
  { key: "lineups",    label: "Lineups",    icon: "people-outline" },
];

const GAME_TAB_KEYS = new Set<GameTab>(TABS.map((tab) => tab.key));

function normalizeGameTab(tab?: string | string[] | null): GameTab {
  const value = Array.isArray(tab) ? tab[0] : tab;
  return value && GAME_TAB_KEYS.has(value as GameTab) ? value as GameTab : "gamecast";
}

const BASEBALL_HUB_SECTIONS = new Set<BaseballHubSection>([
  "overview",
  "plays",
  "box",
  "stats",
  "lineups",
]);

function normalizeBaseballSection(section?: string | string[] | null): BaseballHubSection {
  const value = Array.isArray(section) ? section[0] : section;
  return value && BASEBALL_HUB_SECTIONS.has(value as BaseballHubSection)
    ? value as BaseballHubSection
    : "overview";
}

const PLAYER_STAT_COLS: Record<string, string[]> = {
  NBA:   ["MIN", "PTS", "REB", "AST", "FG"],
  WNBA:  ["MIN", "PTS", "REB", "AST", "FG"],
  NCAAB: ["MIN", "PTS", "REB", "AST", "FG"],
  NFL:   ["YDS", "TD", "INT", "C/ATT"],
  NCAAF: ["YDS", "TD", "INT", "C/ATT"],
  MLB:   ["H-AB", "R", "RBI", "HR", "BB", "K"],
  MLS:   ["MIN", "G", "A", "SHT"],
  EPL:   ["MIN", "G", "A", "SHT"],
  UCL:   ["MIN", "G", "A", "SHT"],
  LIGA:  ["MIN", "G", "A", "SHT"],
  BUN:   ["MIN", "G", "A", "SHT"],
  SERA:  ["MIN", "G", "A", "SHT"],
  LIG1:  ["MIN", "G", "A", "SHT"],
  UEL:   ["MIN", "G", "A", "SHT"],
  UECL:  ["MIN", "G", "A", "SHT"],
  NWSL:  ["MIN", "G", "A", "SHT"],
  FWCM:  ["MIN", "G", "A", "SHT"],
  EURO:  ["MIN", "G", "A", "SHT"],
  COPA:  ["MIN", "G", "A", "SHT"],
  NHL:   ["G", "A", "PTS", "+/-", "S", "TOI", "PIM"],
  UFC:   ["SLM", "SLA", "TD", "TD%", "SUB", "KD"],
  BOXING: ["SLM", "KD", "TD", "CTRL"],
  ATP:   ["ACES", "DF", "WIN", "UE", "1ST%", "BP"],
  WTA:   ["ACES", "DF", "WIN", "UE", "1ST%", "BP"],
};

const NHL_GOALIE_STAT_COLS = ["SV", "GA", "SA", "SV%", "TOI"];
const SOCCER_GK_STAT_COLS = ["MIN", "SV", "GA", "CS"];

const SOCCER_LEAGUES = new Set(["MLS", "EPL", "UCL", "LIGA", "BUN", "SERA", "LIG1", "UEL", "UECL", "NWSL", "FWCM", "EURO", "COPA"]);

// Map league codes to ESPN sport slugs for gamecast URLs
const ESPN_SPORT_SLUGS: Record<string, string> = {
  NBA: "nba", WNBA: "wnba", NCAAB: "mens-college-basketball",
  NFL: "nfl", NCAAF: "college-football",
  MLB: "mlb", NHL: "nhl",
  MLS: "mls", EPL: "epl", UCL: "champions-league",
  LIGA: "la-liga", BUN: "german-bundesliga", SERA: "italian-serie-a", LIG1: "french-ligue-1",
  UEL: "uefa-europa-league", UECL: "uefa-europa-conference-league",
  NWSL: "nwsl", ATP: "tennis", WTA: "tennis",
  UFC: "mma", BOXING: "boxing",
};

function getEspnGamecastUrl(league: string, gameId: string): string {
  const sport = ESPN_SPORT_SLUGS[league] ?? "sports";
  const rawGameId = gameId.includes("-") ? gameId.slice(gameId.indexOf("-") + 1) : gameId;
  return `https://www.espn.com/${sport}/game/_/gameId/${rawGameId}`;
}

function shortTeamName(teamName: string): string {
  return teamName.split(" ").slice(-1)[0] ?? teamName;
}

function formatGameStart(startTime?: string | null): string {
  if (!startTime) return "Time TBD";
  return new Date(startTime).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function scoreStatusLine(game: any): string {
  if (game.statusDetail) return game.statusDetail;
  if (game.status === "upcoming") return `Starts ${formatGameStart(game.startTime)}`;
  const away = game.awayScore ?? 0;
  const home = game.homeScore ?? 0;
  if (game.status === "finished") {
    if (away === home) return "Final score is tied";
    return `${shortTeamName(away > home ? game.awayTeam : game.homeTeam)} won by ${Math.abs(away - home)}`;
  }
  if (away === home) return "Tie game";
  return `${shortTeamName(away > home ? game.awayTeam : game.homeTeam)} leads by ${Math.abs(away - home)}`;
}

function comparableStatValue(value: string | number | undefined): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (value == null) return null;
  const raw = String(value).trim();
  if (!raw || raw === "—") return null;
  const madeAttempt = raw.match(/^(-?\d+(?:\.\d+)?)\s*-\s*(-?\d+(?:\.\d+)?)$/);
  if (madeAttempt) {
    const made = Number(madeAttempt[1]);
    const attempt = Number(madeAttempt[2]);
    return attempt > 0 ? made / attempt : made;
  }
  const pct = raw.match(/^(-?\d+(?:\.\d+)?)%$/);
  if (pct) return Number(pct[1]);
  const firstNumber = raw.match(/-?\d+(?:\.\d+)?/);
  return firstNumber ? Number(firstNumber[0]) : null;
}

function getSportVenueGradient(league: string): [string, string, string, string] {
  const map: Record<string, [string, string, string, string]> = {
    NBA:   ["#A9532A", "#5A3428", "#263648", "#17202A"],
    WNBA:  ["#AA5D36", "#57362E", "#263648", "#17202A"],
    NCAAB: ["#314F8D", "#263D69", "#213040", "#17202A"],
    NFL:   ["#315A7A", "#273B52", "#213040", "#17202A"],
    NCAAF: ["#8F6840", "#594435", "#253242", "#17202A"],
    MLB:   ["#8A3737", "#56313B", "#253242", "#17202A"],
    MLS:   ["#2E7552", "#284C42", "#213040", "#17202A"],
    EPL:   ["#623A68", "#47324F", "#253242", "#17202A"],
    UCL:   ["#354C8A", "#2C3D68", "#213040", "#17202A"],
    LIGA:  ["#8A3A3A", "#55313D", "#253242", "#17202A"],
    BUN:   ["#8B3E3A", "#56323A", "#253242", "#17202A"],
    SERA:  ["#2E7186", "#294A59", "#213040", "#17202A"],
    LIG1:  ["#315A7A", "#273B52", "#213040", "#17202A"],
    UEL:   ["#A96C32", "#5A4432", "#253242", "#17202A"],
    UECL:  ["#2E7552", "#284C42", "#213040", "#17202A"],
    NWSL:  ["#315A7A", "#273B52", "#213040", "#17202A"],
    FWCM:  ["#934D78", "#57364E", "#253242", "#17202A"],
    EURO:  ["#354C8A", "#2C3D68", "#213040", "#17202A"],
    COPA:  ["#6D8846", "#455C3C", "#223343", "#17202A"],
    NHL:   ["#315A7A", "#273B52", "#213040", "#17202A"],
  };
  return map[league] ?? ["#5E446E", "#3D334C", "#253242", "#17202A"];
}

// ── Play type classification ───────────────────────────────────────────────────
type PlayType = "three" | "basket" | "freethrow" | "timeout" | "sub" | "foul" | "goal" | "default";

function classifyPlay(description: string): PlayType {
  const d = description.toLowerCase();
  if (d.includes("timeout")) return "timeout";
  if (d.includes("enters the game") || d.includes("substitution")) return "sub";
  if (d.includes("foul")) return "foul";
  if (d.includes("three point") || d.includes("3-point") || d.includes("26-foot") || d.includes("25-foot")) return "three";
  if (d.includes("free throw")) return "freethrow";
  if (d.includes("goal") || d.includes("scores")) return "goal";
  if (d.includes("shot") || d.includes("makes") || d.includes("dunk") || d.includes("layup")) return "basket";
  return "default";
}

function playIcon(type: PlayType): { name: string; color: string } {
  switch (type) {
    case "three":     return { name: "nuclear-outline",          color: "#EF7828" };
    case "basket":    return { name: "basketball-outline",       color: "#EF7828" };
    case "freethrow": return { name: "radio-button-on-outline",  color: "#AAAAAA" };
    case "timeout":   return { name: "time-outline",             color: "#FFD700" };
    case "sub":       return { name: "swap-horizontal-outline",  color: "#4A90D9" };
    case "foul":      return { name: "alert-circle-outline",     color: "#E8162B" };
    case "goal":      return { name: "football-outline",         color: "#30D158" };
    default:          return { name: "ellipse-outline",          color: C.textTertiary };
  }
}

function playBadge(type: PlayType, desc: string): string | null {
  if (type === "three") return "+3";
  if (type === "basket" && !desc.toLowerCase().includes("free")) return "+2";
  if (type === "goal") return "GOAL";
  return null;
}

export default function GameDetailScreen() {
  const {
    id,
    tab: tabParam,
    section: sectionParam,
    expanded: expandedParam,
    event: eventParam,
  } = useLocalSearchParams<{
    id: string;
    tab?: string;
    section?: string;
    expanded?: string;
    event?: string;
  }>();
  const insets = useSafeAreaInsets();
  const { width: viewportWidth, height: viewportHeight } = useWindowDimensions();
  const queryClient = useQueryClient();
  const gameScrollRef = useRef<ScrollView>(null);
  const [activeTab, setActiveTab] = useState<GameTab>(normalizeGameTab(tabParam));
  const [isGameHubExpanded, setIsGameHubExpanded] = useState(expandedParam === "1");
  const baseballSection = normalizeBaseballSection(sectionParam);
  const topPad = Platform.OS === "web"
    ? (viewportWidth >= 620 ? 52 : 14)
    : insets.top;
  const framedWeb = Platform.OS === "web" && viewportWidth >= 620;
  const appViewportHeight = framedWeb
    ? Math.min(900, viewportHeight - 28) - 25
    : viewportHeight;
  const gameContentWidth = framedWeb
    ? Math.min(430, viewportWidth - 48) - 14
    : viewportWidth;
  const gamecastHeight = Math.max(540, appViewportHeight - topPad - 60);

  const { data, isLoading } = useQuery({
    queryKey: ["game", id],
    queryFn: () => api.getGameDetail(id ?? ""),
    enabled: !!id,
    refetchInterval: (query) => {
      const status = (query.state.data as any)?.game?.status;
      return status === "live" ? 8_000 : 60_000;
    },
  });

  // WebSocket: invalidate query on push update
  const onWsUpdate = useCallback((wsData: unknown) => {
    queryClient.invalidateQueries({ queryKey: ["game", id] });
  }, [id, queryClient]);

  useGameSocket({
    gameId: id ?? "",
    enabled: !!id && data?.game?.status === "live",
    onUpdate: onWsUpdate,
  });

  useEffect(() => {
    const nextTab = normalizeGameTab(tabParam);
    setActiveTab((current) => current === nextTab ? current : nextTab);
  }, [tabParam]);

  useEffect(() => {
    setIsGameHubExpanded(expandedParam === "1");
  }, [expandedParam]);

  useEffect(() => {
    if (activeTab !== "gamecast") setIsGameHubExpanded(false);
  }, [activeTab]);

  const game = data?.game;
  const rawColor = game ? (LEAGUE_COLORS[game.league] ?? C.accent) : C.accent;
  const dc =
    rawColor === "#013087" || rawColor === "#002D72" ? "#4A90D9"
    : rawColor === "#1A1A2E" ? "#4CAF50"
    : rawColor;

  const venueGrad = game ? getSportVenueGradient(game.league) : ["#17202A", "#1D2936", "#253242", "#17202A"] as [string,string,string,string];

  const isLive     = game?.status === "live";
  const isFinished = game?.status === "finished";
  const isBaseballGamecast = game?.league === "MLB" && activeTab === "gamecast";

  useEffect(() => {
    if (isBaseballGamecast) {
      gameScrollRef.current?.scrollTo({ x: 0, y: 0, animated: false });
    }
  }, [isBaseballGamecast, isGameHubExpanded]);

  const playByPlayRows: GamePlay[] = game?.league === "MLB" && data?.baseballGamecast?.recentPlays?.length
    ? data.baseballGamecast.recentPlays.map((play) => ({
        time: play.inning != null
          ? `${play.inningHalf === "bottom" ? "Bot" : "Top"} ${play.inning}`
          : "",
        description: play.text,
        team: "",
      }))
    : data?.keyPlays ?? [];
  const awayWin = isFinished && (game?.awayScore ?? 0) > (game?.homeScore ?? 0);
  const homeWin = isFinished && (game?.homeScore ?? 0) > (game?.awayScore ?? 0);

  const handleShare = useCallback(() => {
    if (!game || !id) return;
    const url = getEspnGamecastUrl(game.league, id);
    Share.share({
      title: `${game.awayTeam} @ ${game.homeTeam}`,
      message: `${game.awayTeam} @ ${game.homeTeam}: ${url}`,
    }).catch(() => {
      Linking.openURL(url).catch(() => {});
    });
  }, [game, id]);

  const handleBack = useCallback(() => {
    if (isGameHubExpanded) {
      setIsGameHubExpanded(false);
      router.setParams({ expanded: undefined });
      return;
    }
    const canGoBack = typeof (router as any).canGoBack === "function" && (router as any).canGoBack();
    if (canGoBack) router.back();
    else router.replace("/");
  }, [isGameHubExpanded]);

  const selectTab = useCallback((tab: GameTab) => {
    setActiveTab(tab);
    router.setParams({ tab });
  }, []);

  const setGameHubExpanded = useCallback((expanded: boolean) => {
    setIsGameHubExpanded(expanded);
    router.setParams({ expanded: expanded ? "1" : undefined });
  }, []);

  const setBaseballSection = useCallback((section: BaseballHubSection) => {
    router.setParams({ section });
  }, []);

  const setBaseballEvent = useCallback((playId: string | null) => {
    router.setParams({ event: playId ?? undefined });
  }, []);

  return (
    <View style={[s.root, { paddingTop: topPad }]}>
      {/* ── Fixed top nav ──────────────────────────────────────────────────── */}
      <View style={s.nav}>
        <Pressable
          onPress={handleBack}
          style={s.navBack}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={22} color={C.text} />
        </Pressable>
        <Text style={s.navTitle} numberOfLines={1}>
          {game ? `${game.awayTeam} @ ${game.homeTeam}` : "Game Detail"}
        </Text>
        <Pressable
          onPress={handleShare}
          style={s.navRight}
          hitSlop={8}
          disabled={!game}
          accessibilityRole="button"
          accessibilityLabel={game ? `Share ${game.awayTeam} at ${game.homeTeam}` : "Share game"}
        >
          <Ionicons name="share-outline" size={20} color={C.textSecondary} />
        </Pressable>
      </View>

      {isLoading || !game ? (
        <View style={s.loading}>
          <ActivityIndicator size="large" color={dc} />
          <Text style={s.loadingText}>Loading game…</Text>
        </View>
      ) : (
        <ScrollView
          ref={gameScrollRef}
          showsVerticalScrollIndicator={false}
          stickyHeaderIndices={isBaseballGamecast ? undefined : [1]}
          scrollEnabled={!isBaseballGamecast}
          bounces={!isBaseballGamecast}
        >

          {/* ── Hero score section ─────────────────────────────────────────── */}
          {!isBaseballGamecast && <View>
            <LinearGradient colors={venueGrad} style={s.hero} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}>
              {/* League-color tint */}
              <LinearGradient
                colors={[`${dc}14`, "transparent", `${dc}08`]}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              />

              {/* Status pill */}
              <View style={[s.statusPill, { backgroundColor: `${dc}22`, borderColor: `${dc}44` }]}>
                <Text style={[s.statusLeague, { color: dc }]}>{game.league}</Text>
                {isLive && (
                  <>
                    <View style={s.liveDotPill} />
                    <Text style={s.liveLabel}>LIVE</Text>
                    <Text style={s.statusSep}>·</Text>
                    <Text style={s.statusExtra}>{game.quarter}{game.timeRemaining ? ` · ${game.timeRemaining}` : ""}</Text>
                  </>
                )}
                {isFinished && <Text style={s.statusExtra}> · FINAL</Text>}
                {!isLive && !isFinished && (game.statusDetail || game.startTime) && (
                  <Text style={s.statusExtra}>
                    {" · "}
                    {game.statusDetail ?? new Date(game.startTime).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                  </Text>
                )}
              </View>

              {/* Teams + score */}
              <View style={s.heroTeams}>
                {/* Away */}
                <Pressable
                  style={s.heroTeamCol}
                  onPress={() => goToTeam(game.awayTeam, game.league)}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={`Open ${game.awayTeam} team page`}
                >
                  <TeamLogo uri={game.awayTeamLogo} name={game.awayTeam} size={96} borderColor={`${dc}55`} />
                  <Text style={[s.heroTeamName, awayWin && { color: dc }]} numberOfLines={2}>{game.awayTeam}</Text>
                  <Text style={s.heroTeamLabel}>AWAY</Text>
                </Pressable>

                {/* Score */}
                <View style={s.heroScoreBlock}>
                  {isLive || isFinished ? (
                    <>
                      <View style={s.heroScoreRow}>
                        <Text style={[s.heroScore, !awayWin && isFinished && s.heroScoreDim]}>{game.awayScore ?? 0}</Text>
                        <Text style={s.heroScoreSep}>:</Text>
                        <Text style={[s.heroScore, !homeWin && isFinished && s.heroScoreDim]}>{game.homeScore ?? 0}</Text>
                      </View>
                      {isLive && game.timeRemaining && (
                        <View style={[s.clockPill, { borderColor: `${dc}40` }]}>
                          <Text style={[s.clockText, { color: dc }]}>{game.timeRemaining}</Text>
                        </View>
                      )}
                    </>
                  ) : (
                    <Text style={s.vsText}>VS</Text>
                  )}
                  {game.venue && (
                    <Text style={s.venueText} numberOfLines={1}>{game.venue}</Text>
                  )}
                </View>

                {/* Home */}
                <Pressable
                  style={[s.heroTeamCol, { alignItems: "flex-end" }]}
                  onPress={() => goToTeam(game.homeTeam, game.league)}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={`Open ${game.homeTeam} team page`}
                >
                  <TeamLogo uri={game.homeTeamLogo} name={game.homeTeam} size={96} borderColor={`${dc}55`} />
                  <Text style={[s.heroTeamName, { textAlign: "right" }, homeWin && { color: dc }]} numberOfLines={2}>{game.homeTeam}</Text>
                  <Text style={[s.heroTeamLabel, { textAlign: "right" }]}>HOME</Text>
                </Pressable>
              </View>

              {/* Watch live pill button */}
              {isLive && (
                <Pressable
                  style={[s.watchPill, { borderColor: `${dc}55`, backgroundColor: `${dc}18` }]}
                  onPress={() => {
                    const url = getEspnGamecastUrl(game.league, id);
                    Linking.openURL(url).catch(() => {});
                  }}
                  hitSlop={8}
                  accessibilityRole="link"
                  accessibilityLabel="Open ESPN Gamecast for this game"
                >
                  <Ionicons name="radio" size={13} color={dc} />
                  <Text style={[s.watchText, { color: dc }]}>ESPN Gamecast</Text>
                </Pressable>
              )}
            </LinearGradient>
          </View>}

          {/* ── Floating tab bar ───────────────────────────────────────────── */}
          {!isBaseballGamecast && <View style={s.tabBarWrap}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabBar}>
              {TABS.map(tab => {
                const active = activeTab === tab.key;
                const tabLabel = game.league === "MLB" && tab.key === "playbyplay" ? "Plays" : tab.label;
                return (
                  <Pressable
                    key={tab.key}
                    onPress={() => selectTab(tab.key)}
                    style={[s.tab, active && { borderBottomColor: dc }]}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={`Show ${tabLabel}`}
                  >
                    <Ionicons name={tab.icon as any} size={14} color={active ? dc : C.textTertiary} />
                    <Text style={[s.tabLabel, active && { color: dc, fontWeight: "800" }]}>{tabLabel}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>}

          {/* ── Tab content ────────────────────────────────────────────────── */}
          <View style={[s.content, isBaseballGamecast && s.baseballContent]}>

            {/* GAMECAST */}
            {activeTab === "gamecast" && (
              <GamecastTab
                data={data}
                game={game}
                dc={dc}
                onSelectTab={selectTab}
                gamecastHeight={gamecastHeight}
                contentWidth={gameContentWidth}
                isGameHubExpanded={isGameHubExpanded}
                onGameHubExpandedChange={setGameHubExpanded}
                baseballSection={baseballSection}
                onBaseballSectionChange={setBaseballSection}
                baseballEventId={eventParam}
                onBaseballEventChange={setBaseballEvent}
              />
            )}

            {/* BOX SCORE */}
            {activeTab === "boxscore" && (
              <View style={s.tabSection}>
                {(data.homePlayerStats?.length || data.awayPlayerStats?.length) ? (
                  <>
                    {game.league === "NHL" ? (
                      <>
                        {[
                          { team: game.awayTeam, logo: game.awayTeamLogo, players: data.awayPlayerStats ?? [] },
                          { team: game.homeTeam, logo: game.homeTeamLogo, players: data.homePlayerStats ?? [] },
                        ].map(({ team, logo, players }) => {
                          const skaters = players.filter((p) => p.stats?.role !== "G");
                          const goalies = players.filter((p) => p.stats?.role === "G");
                          return (
                            <View key={team}>
                              <PlayerBoxscore teamName={team} teamLogo={logo} players={skaters} league={game.league} dc={dc} />
                              {goalies.length > 0 && (
                                <PlayerBoxscore teamName={team} teamLogo={logo} players={goalies} league={game.league} dc={dc} overrideCols={NHL_GOALIE_STAT_COLS} sectionLabel="Goalies" />
                              )}
                            </View>
                          );
                        })}
                      </>
                    ) : SOCCER_LEAGUES.has(game.league) ? (
                      <>
                        {[
                          { team: game.awayTeam, logo: game.awayTeamLogo, players: data.awayPlayerStats ?? [] },
                          { team: game.homeTeam, logo: game.homeTeamLogo, players: data.homePlayerStats ?? [] },
                        ].map(({ team, logo, players }) => {
                          const outfield = players.filter((p) => p.stats?.role !== "GK");
                          const goalkeepers = players.filter((p) => p.stats?.role === "GK");
                          return (
                            <View key={team}>
                              <PlayerBoxscore teamName={team} teamLogo={logo} players={outfield} league={game.league} dc={dc} />
                              {goalkeepers.length > 0 && (
                                <PlayerBoxscore teamName={team} teamLogo={logo} players={goalkeepers} league={game.league} dc={dc} overrideCols={SOCCER_GK_STAT_COLS} sectionLabel="Goalkeepers" />
                              )}
                            </View>
                          );
                        })}
                      </>
                    ) : (
                      <>
                        <PlayerBoxscore teamName={game.awayTeam} teamLogo={game.awayTeamLogo} players={data.awayPlayerStats ?? []} league={game.league} dc={dc} />
                        <PlayerBoxscore teamName={game.homeTeam} teamLogo={game.homeTeamLogo} players={data.homePlayerStats ?? []} league={game.league} dc={dc} />
                      </>
                    )}
                  </>
                ) : (
                  <View style={s.emptyBoxState}>
                    <View style={[s.emptyBoxIconWrap, { borderColor: `${dc}30`, backgroundColor: `${dc}10` }]}>
                      <Ionicons
                        name={game.status === "live" ? "stats-chart-outline" : game.status === "upcoming" ? "time-outline" : "clipboard-outline"}
                        size={24}
                        color={dc}
                      />
                    </View>
                    <Text style={s.emptyBoxTitle}>
                      {game.status === "live"
                        ? "Stats Updating Live"
                        : game.status === "upcoming"
                        ? (game.statusDetail ? `Game ${game.statusDetail}` : "Pre-Game")
                        : "Stats Unavailable"}
                    </Text>
                    <Text style={s.emptyBoxMsg}>
                      {game.status === "live"
                        ? "Player stats are being compiled. They'll appear here shortly."
                        : game.status === "upcoming"
                        ? (game.statusDetail
                          ? "This game is not currently scheduled to begin. Check back for an updated start time."
                          : "Box score stats will appear here once the game begins.")
                        : "Detailed stats were not available for this game."}
                    </Text>
                    {game.status === "live" && (
                      <Text style={[s.emptyBoxHint, { color: dc }]}>
                        Check the Stats tab for live team totals →
                      </Text>
                    )}
                  </View>
                )}
              </View>
            )}

            {/* PLAY-BY-PLAY */}
            {activeTab === "playbyplay" && (
              <View style={s.tabSection}>
                {playByPlayRows.length === 0 ? (
                  <Text style={s.empty}>No ESPN play feed yet</Text>
                ) : (() => {
                  const reversed = [...playByPlayRows].reverse();
                  return (
                    <View style={s.playsCard}>
                      {reversed.map((play: any, i: number) => (
                        <PlayRow key={i} play={play} dc={dc} showDivider={i < reversed.length - 1} />
                      ))}
                    </View>
                  );
                })()}
              </View>
            )}

            {/* STATS */}
            {activeTab === "stats" && (
              <View style={s.tabSection}>
                <TeamStatsSection
                  homeTeam={game.homeTeam} awayTeam={game.awayTeam}
                  homeStats={data.homeStats} awayStats={data.awayStats}
                  dc={dc} league={game.league}
                />
              </View>
            )}

            {/* LINEUPS */}
            {activeTab === "lineups" && (
              <View style={s.tabSection}>
                <LineupSection teamName={game.awayTeam} teamLogo={game.awayTeamLogo} league={game.league}
                  players={data.awayPlayerStats ?? data.awayLineup.map(name => ({ name, starter: true, stats: {} }))} dc={dc} />
                <LineupSection teamName={game.homeTeam} teamLogo={game.homeTeamLogo} league={game.league}
                  players={data.homePlayerStats ?? data.homeLineup.map(name => ({ name, starter: true, stats: {} }))} dc={dc} />
              </View>
            )}

          </View>
        </ScrollView>
      )}
    </View>
  );
}

// ─── Win probability bar ──────────────────────────────────────────────────────
function computeWinProb(game: any): number {
  const homeScore = game.homeScore ?? 0;
  const awayScore = game.awayScore ?? 0;
  const diff = homeScore - awayScore;
  const period = (game.quarter ?? "").toLowerCase();

  let urgency = 1;
  if (period.includes("4") || period.includes("q4") || period.includes("3rd period") || period.includes("9th")) urgency = 2.5;
  else if (period.includes("3") || period.includes("q3") || period.includes("2nd period") || period.includes("7th")) urgency = 1.6;
  else if (/\b(?:ot|overtime|extra)\b/i.test(period)) urgency = 4;

  const adjustedDiff = diff * urgency * 1.5;
  return Math.min(0.97, Math.max(0.03, 1 / (1 + Math.exp(-adjustedDiff / 12))));
}

function WinProbBar({ game, dc }: { game: any; dc: string }) {
  if (game.status !== "live" && game.status !== "finished") return null;
  if ((game.homeScore ?? 0) === 0 && (game.awayScore ?? 0) === 0) return null;

  const homeWinProb = computeWinProb(game);
  const awayWinProb = 1 - homeWinProb;
  const homeLeading = homeWinProb > 0.5;
  const isToss = Math.abs(homeWinProb - 0.5) < 0.08;

  const homeShort = game.homeTeam.split(" ").slice(-1)[0].toUpperCase();
  const awayShort = game.awayTeam.split(" ").slice(-1)[0].toUpperCase();
  const awayPct  = Math.round(awayWinProb * 100);
  const homePct  = Math.round(homeWinProb * 100);

  return (
    <View style={wpb.wrap}>
      {/* Label row: AWAY 38%  |  COMPUTED WIN LEAN  |  62% HOME */}
      <View style={wpb.labelRow}>
        <View style={wpb.teamBlock}>
          <Text style={[wpb.pct, { color: !homeLeading ? dc : C.textTertiary }]}>{awayPct}%</Text>
          <Text style={[wpb.teamLabel, { color: !homeLeading ? dc : C.textTertiary }]}>{awayShort}</Text>
        </View>
        <Text style={wpb.centerLabel}>COMPUTED WIN LEAN</Text>
        <View style={[wpb.teamBlock, { alignItems: "flex-end" }]}>
          <Text style={[wpb.pct, { color: homeLeading ? dc : C.textTertiary }]}>{homePct}%</Text>
          <Text style={[wpb.teamLabel, { color: homeLeading ? dc : C.textTertiary }]}>{homeShort}</Text>
        </View>
      </View>
      {/* Split bar */}
      <View style={wpb.track}>
        <View style={[wpb.fill, { flex: awayWinProb, backgroundColor: !homeLeading ? dc : `${dc}30` }]} />
        <View style={wpb.divider} />
        <View style={[wpb.fill, { flex: homeWinProb, backgroundColor: homeLeading ? dc : `${dc}30` }]} />
      </View>
      {/* Favored label */}
      <Text style={wpb.favoredLabel}>
        {isToss ? "Toss-up estimate" : `${homeLeading ? homeShort : awayShort} edge based on score state`}
      </Text>
    </View>
  );
}

const wpb = StyleSheet.create({
  wrap: {
    backgroundColor: C.card, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: C.cardBorder, gap: 10,
  },
  labelRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  teamBlock: { alignItems: "flex-start", minWidth: 60 },
  pct: { fontSize: 22, fontWeight: "900", fontFamily: FONTS.bodyBold, lineHeight: 26 },
  teamLabel: { fontSize: 10, fontWeight: "700", letterSpacing: 1, fontFamily: FONTS.bodySemiBold, marginTop: 1 },
  centerLabel: { color: C.textTertiary, fontSize: 9, fontWeight: "700", letterSpacing: 1.5, textTransform: "uppercase", textAlign: "center" },
  track: { flexDirection: "row", height: 10, borderRadius: 5, overflow: "hidden", backgroundColor: C.cardBorder },
  fill: { height: "100%" },
  divider: { width: 2, height: "100%", backgroundColor: C.background },
  favoredLabel: { color: C.textTertiary, fontSize: 11, fontWeight: "600", textAlign: "center", letterSpacing: 0.3 },
});

// ─── Gamecast tab ──────────────────────────────────────────────────────────────
function GamecastTab({
  data,
  game,
  dc,
  onSelectTab,
  gamecastHeight,
  contentWidth,
  isGameHubExpanded,
  onGameHubExpandedChange,
  baseballSection,
  onBaseballSectionChange,
  baseballEventId,
  onBaseballEventChange,
}: {
  data: any;
  game: any;
  dc: string;
  onSelectTab: (tab: GameTab) => void;
  gamecastHeight: number;
  contentWidth: number;
  isGameHubExpanded: boolean;
  onGameHubExpandedChange: (expanded: boolean) => void;
  baseballSection: BaseballHubSection;
  onBaseballSectionChange: (section: BaseballHubSection) => void;
  baseballEventId?: string;
  onBaseballEventChange: (playId: string | null) => void;
}) {
  const isLive = game.status === "live";
  const isFinished = game.status === "finished";
  const keyPlays: GamePlay[] = data.keyPlays ?? [];

  if (game.league === "MLB") {
    return (
      <BaseballGamecast
        data={data}
        width={contentWidth}
        height={gamecastHeight}
        expanded={isGameHubExpanded}
        onExpandedChange={onGameHubExpandedChange}
        initialSection={baseballSection}
        onSectionChange={onBaseballSectionChange}
        initialSelectedPlayId={baseballEventId}
        onSelectedPlayChange={onBaseballEventChange}
      />
    );
  }

  // Compute canonical tracker state from play-by-play
  const trackerState = React.useMemo(
    () => computeTrackerState(keyPlays, game),
    [keyPlays, game],
  );

  // Key moments: pick the most notable plays for the horizontal strip
  const keyMoments = React.useMemo(() => {
    const plays = [...keyPlays].reverse();
    // First try score plays and notable events
    const hot = plays.filter((p: any) => {
      const d = (p.description ?? "").toLowerCase();
      return d.includes("three") || d.includes("goal") || d.includes("home run") ||
             d.includes("dunk") || d.includes("timeout") || d.includes("turnover") ||
             d.includes("interception") || d.includes("touchdown") || d.includes("save") ||
             d.includes("overtime") || d.includes("penalty");
    });
    return (hot.length >= 3 ? hot : plays).slice(0, 6);
  }, [keyPlays]);

  return (
    <View style={s.tabSection}>
      <GameCommandCenter
        game={game}
        dc={dc}
        keyPlays={keyPlays}
        trackerState={trackerState}
        hasTeamStats={Object.keys(data.homeStats ?? {}).length > 0}
        hasBoxScore={(data.homePlayerStats?.length ?? 0) + (data.awayPlayerStats?.length ?? 0) > 0}
        onSelectTab={onSelectTab}
      />

      {/* ── Arena (sport-specific SVG + live overlays) ────────────────────── */}
      <ArenaRenderer
        league={game.league}
        width={contentWidth - 32}
        accentColor={dc}
        homeScore={game.homeScore}
        awayScore={game.awayScore}
        homeTeam={game.homeTeam}
        awayTeam={game.awayTeam}
        status={game.status}
        shotTrail={trackerState.shotTrail}
        possession={trackerState.possession}
        runnersOnBase={trackerState.runnersOnBase}
        fieldPosition={trackerState.fieldPosition}
      />

      {/* ── AI Preview card for upcoming games ───────────────────────────── */}
      {!isLive && !isFinished && !game.statusDetail && (
        <AiPreviewCard gameId={game.id} dc={dc} />
      )}

      {/* ── Live Tracker Panel (situation · scoring run · why it matters) ─── */}
      {(isLive || isFinished) && (
        <LiveTrackerPanel state={trackerState} accentColor={dc} game={game} />
      )}

      {/* ── Win Probability ───────────────────────────────────────────────── */}
      <WinProbBar game={game} dc={dc} />

      {/* ── Momentum Wave ─────────────────────────────────────────────────── */}
      {(isLive || isFinished) && keyPlays.length > 0 && (
        <MomentumGraph
          plays={keyPlays}
          homeTeam={game.homeTeam}
          awayTeam={game.awayTeam}
          homeScore={game.homeScore ?? 0}
          awayScore={game.awayScore ?? 0}
          accentColor={dc}
          width={contentWidth - 32}
          league={game.league}
        />
      )}

      {/* ── AI "Why It Matters" card with pulsing LIVE badge ─────────────── */}
      {data.aiSummary && (
        <AiInsightCard summary={data.aiSummary} dc={dc} isLive={isLive} />
      )}

      {/* ── Key Moments horizontal strip ─────────────────────────────────── */}
      {keyMoments.length > 0 && (
        <KeyMomentsStrip moments={keyMoments} dc={dc} isLive={isLive} />
      )}

      {/* ── Quick team stats ─────────────────────────────────────────────── */}
      {Object.keys(data.homeStats ?? {}).length > 0 && (
        <>
          <View style={s.sectionHeader}>
            <View style={[s.sectionAccent, { backgroundColor: dc }]} />
            <Text style={s.sectionTitle}>Team Stats</Text>
          </View>
          <QuickStatsBar homeTeam={game.homeTeam} awayTeam={game.awayTeam} homeStats={data.homeStats} awayStats={data.awayStats} dc={dc} />
        </>
      )}
    </View>
  );
}

function GameCommandCenter({
  game,
  dc,
  keyPlays,
  trackerState,
  hasTeamStats,
  hasBoxScore,
  onSelectTab,
}: {
  game: any;
  dc: string;
  keyPlays: GamePlay[];
  trackerState: TrackerState;
  hasTeamStats: boolean;
  hasBoxScore: boolean;
  onSelectTab: (tab: GameTab) => void;
}) {
  const latestPlay = keyPlays[keyPlays.length - 1] ?? null;
  const isLive = game.status === "live";
  const isFinished = game.status === "finished";
  const hasScheduleUpdate = Boolean(game.statusDetail);
  const statusLabel = game.statusDetail ?? (isLive ? "Live now" : isFinished ? "Final" : "Upcoming");
  const periodLine = [game.quarter, game.timeRemaining].filter(Boolean).join(" · ");
  const situationLine =
    trackerState.situationLine ||
    periodLine ||
    (game.venue ? game.venue : scoreStatusLine(game));
  const feedLine = latestPlay
    ? `${keyPlays.length} ESPN feed ${keyPlays.length === 1 ? "event" : "events"}`
    : hasScheduleUpdate
      ? "Schedule update"
      : isLive
      ? "Scoreboard feed only so far"
      : isFinished
        ? "Scoring feed limited"
        : "Pregame feed";
  const insightLine = isLive || isFinished
    ? "Momentum and win lean below are computed from score/play feed."
    : hasScheduleUpdate
      ? "Projections stay hidden until the matchup has a confirmed start."
      : "Preview mode will fill in once the matchup gets closer.";

  const actions: { label: string; icon: string; tab: GameTab; enabled: boolean }[] = [
    { label: "Stats", icon: "bar-chart-outline", tab: "stats", enabled: hasTeamStats },
    { label: "Scoring", icon: "list-outline", tab: "playbyplay", enabled: keyPlays.length > 0 },
    { label: "Box", icon: "grid-outline", tab: "boxscore", enabled: hasBoxScore },
  ];

  if (!isLive && !isFinished && !hasScheduleUpdate) {
    actions.unshift({ label: "Lineups", icon: "people-outline", tab: "lineups", enabled: true });
  }

  return (
    <View style={[gcc.card, { borderColor: `${dc}28` }]}>
      <LinearGradient
        colors={[`${dc}12`, "transparent"]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <View style={gcc.topRow}>
        <View style={[gcc.statusIcon, { backgroundColor: `${dc}18`, borderColor: `${dc}35` }]}>
          <Ionicons name={isLive ? "radio" : isFinished ? "checkmark" : "time-outline"} size={16} color={dc} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={gcc.kicker}>Game Center</Text>
          <Text style={gcc.title}>{scoreStatusLine(game)}</Text>
        </View>
        <View style={[gcc.statusPill, isLive && { backgroundColor: C.liveGlow, borderColor: C.live }]}>
          {isLive && <View style={gcc.liveDot} />}
          <Text style={[gcc.statusText, isLive && { color: C.live }]}>{statusLabel}</Text>
        </View>
      </View>

      <View style={gcc.metaGrid}>
        <InfoPill icon={trackerState.situationIcon} label="Situation" value={situationLine || "Game state pending"} color={trackerState.situationColor || dc} />
        <InfoPill icon="server-outline" label="Feed" value={feedLine} color={dc} />
        <InfoPill
          icon="sparkles-outline"
          label="Insight"
          value={hasScheduleUpdate ? "On hold" : isLive || isFinished ? "Computed, not official" : "Pregame"}
          color={C.accentGold}
        />
      </View>

      {latestPlay && (
        <View style={gcc.latestPlay}>
          <View style={[gcc.latestIcon, { backgroundColor: `${dc}18` }]}>
            <Ionicons name={playIcon(classifyPlay(latestPlay.description)).name as any} size={14} color={dc} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={gcc.latestLabel}>Latest feed event {latestPlay.time ? `· ${latestPlay.time}` : ""}</Text>
            <Text style={gcc.latestText} numberOfLines={2}>{latestPlay.description}</Text>
          </View>
        </View>
      )}

      <View style={gcc.actionRow}>
        {actions.map((action) => (
          <Pressable
            key={action.label}
            disabled={!action.enabled}
            onPress={() => onSelectTab(action.tab)}
            style={({ pressed }) => [
              gcc.action,
              action.enabled && { borderColor: `${dc}30`, backgroundColor: `${dc}10` },
              !action.enabled && gcc.actionDisabled,
              pressed && action.enabled && { backgroundColor: `${dc}1A` },
            ]}
            accessibilityRole="button"
            accessibilityLabel={action.enabled ? `Open ${action.label}` : `${action.label} unavailable`}
          >
            <Ionicons name={action.icon as any} size={14} color={action.enabled ? dc : C.textTertiary} />
            <Text style={[gcc.actionText, action.enabled && { color: C.text }]}>{action.label}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={gcc.truthNote}>{insightLine}</Text>
    </View>
  );
}

function InfoPill({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
  return (
    <View style={gcc.infoPill}>
      <View style={[gcc.infoIcon, { backgroundColor: `${color}18` }]}>
        <Ionicons name={icon as any} size={12} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={gcc.infoLabel}>{label}</Text>
        <Text style={gcc.infoValue} numberOfLines={2}>{value}</Text>
      </View>
    </View>
  );
}

const gcc = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: C.card,
    overflow: "hidden",
    padding: 14,
    gap: 12,
  },
  topRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  statusIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  kicker: {
    color: C.textTertiary,
    fontSize: 10,
    fontFamily: FONTS.bodyHeavy,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  title: {
    color: C.text,
    fontSize: 17,
    fontFamily: FONTS.bodyHeavy,
    marginTop: 2,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.cardBorder,
    backgroundColor: C.glassMedium,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  liveDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: C.live },
  statusText: {
    color: C.textSecondary,
    fontSize: 10,
    fontFamily: FONTS.bodyHeavy,
    textTransform: "uppercase",
  },
  metaGrid: { gap: 8 },
  infoPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.cardBorder,
    backgroundColor: C.glassLight,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  infoIcon: {
    width: 26,
    height: 26,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  infoLabel: {
    color: C.textTertiary,
    fontSize: 9,
    fontFamily: FONTS.bodyHeavy,
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  infoValue: {
    color: C.text,
    fontSize: 12,
    fontFamily: FONTS.bodyMedium,
    lineHeight: 16,
    marginTop: 1,
  },
  latestPlay: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 12,
    backgroundColor: C.backgroundSecondary,
    padding: 10,
  },
  latestIcon: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  latestLabel: {
    color: C.textTertiary,
    fontSize: 10,
    fontFamily: FONTS.bodyHeavy,
    textTransform: "uppercase",
  },
  latestText: {
    color: C.text,
    fontSize: 13,
    fontFamily: FONTS.bodyMedium,
    lineHeight: 18,
    marginTop: 2,
  },
  actionRow: { flexDirection: "row", gap: 8 },
  action: {
    flex: 1,
    minHeight: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.cardBorder,
    backgroundColor: C.glassMedium,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 8,
  },
  actionDisabled: { opacity: 0.45, backgroundColor: C.glassLight },
  actionText: {
    color: C.textTertiary,
    fontSize: 12,
    fontFamily: FONTS.bodyHeavy,
  },
  truthNote: {
    color: C.textTertiary,
    fontSize: 11,
    fontFamily: FONTS.body,
    lineHeight: 16,
  },
});

// ─── AI Preview card for upcoming games ────────────────────────────────────────
function AiPreviewCard({ gameId, dc }: { gameId: string; dc: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["game-preview", gameId],
    queryFn: () => api.getGamePreview(gameId),
    staleTime: 600_000,
    retry: 1,
  });

  if (isLoading) {
    return (
      <View style={[prev.card, { borderColor: `${dc}30` }]}>
        <LinearGradient colors={[`${dc}0A`, "transparent"]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
        <View style={prev.header}>
          <Text style={[prev.sparkle, { color: dc }]}>✦</Text>
          <Text style={[prev.label, { color: dc }]}>AI PREVIEW</Text>
        </View>
        <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
          <ActivityIndicator size="small" color={dc} />
          <Text style={prev.loading}>Generating preview...</Text>
        </View>
      </View>
    );
  }

  const preview = data?.preview;
  if (!preview) return null;

  return (
    <View style={[prev.card, { borderColor: `${dc}30` }]}>
      <LinearGradient colors={[`${dc}0A`, "transparent"]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
      <View style={prev.header}>
        <Text style={[prev.sparkle, { color: dc }]}>✦</Text>
        <Text style={[prev.label, { color: dc }]}>AI PREVIEW</Text>
        <View style={prev.aiBadge}>
          <Text style={prev.aiBadgeText}>AI</Text>
        </View>
      </View>
      <Text style={prev.text}>{preview}</Text>
      <Text style={prev.footer}>Powered by Fourth Quarter AI</Text>
    </View>
  );
}

const prev = StyleSheet.create({
  card: {
    borderRadius: 14, borderWidth: 1, padding: 14,
    backgroundColor: C.card, overflow: "hidden", gap: 10,
  },
  header: { flexDirection: "row", alignItems: "center", gap: 6 },
  sparkle: { fontSize: 14, fontWeight: "900" },
  label: { fontSize: 10, fontWeight: "800", letterSpacing: 1.5, textTransform: "uppercase", flex: 1 },
  aiBadge: {
    backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 5,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  aiBadgeText: { color: "#fff", fontSize: 8, fontWeight: "900", letterSpacing: 0.8 },
  loading: { color: C.textTertiary, fontSize: 13, fontStyle: "italic" },
  text: { color: C.textSecondary, fontSize: 14, lineHeight: 21, fontFamily: FONTS.body },
  footer: { color: C.textTertiary, fontSize: 10, fontWeight: "500", letterSpacing: 0.3 },
});

// ─── AI Insight card with pulsing "UPDATING LIVE" ──────────────────────────────
function AiInsightCard({ summary, dc, isLive }: { summary: string; dc: string; isLive: boolean }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isLive) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.2, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,   duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [isLive, pulseAnim]);

  return (
    <View style={[aic.card, { borderColor: `${dc}30` }]}>
      <LinearGradient
        colors={[`${dc}0A`, "transparent"]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      />
      <View style={aic.header}>
        <Text style={[aic.sparkle, { color: dc }]}>✦</Text>
        <Text style={[aic.label, { color: dc }]}>WHY IT MATTERS</Text>
        {isLive && (
          <View style={aic.liveRow}>
            <Animated.View style={[aic.liveDot, { opacity: pulseAnim, backgroundColor: dc }]} />
            <Text style={[aic.liveText, { color: dc }]}>UPDATING LIVE</Text>
          </View>
        )}
      </View>
      <Text style={aic.text}>{summary}</Text>
    </View>
  );
}

const aic = StyleSheet.create({
  card: {
    borderRadius: 14, borderWidth: 1, padding: 14,
    backgroundColor: C.card, overflow: "hidden", gap: 10,
  },
  header: { flexDirection: "row", alignItems: "center", gap: 6 },
  sparkle: { fontSize: 14, fontWeight: "900" },
  label: { fontSize: 10, fontWeight: "800", letterSpacing: 1.5, textTransform: "uppercase", flex: 1 },
  liveRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  liveDot: { width: 5, height: 5, borderRadius: 3 },
  liveText: { fontSize: 9, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase" },
  text: { color: C.textSecondary, fontSize: 14, lineHeight: 21, fontFamily: FONTS.body },
});

// ─── Key Moments horizontal strip ─────────────────────────────────────────────
function KeyMomentsStrip({ moments, dc, isLive }: {
  moments: { time: string; description: string; team?: string }[];
  dc: string;
  isLive: boolean;
}) {
  return (
    <View>
      <View style={[s.sectionHeader, { marginBottom: 8 }]}>
        <View style={[s.sectionAccent, { backgroundColor: dc }]} />
        <Text style={s.sectionTitle}>Key Moments</Text>
        {isLive && (
          <>
            <View style={{ flex: 1 }} />
            <View style={s.liveChip}>
              <View style={s.liveDotSmall} />
              <Text style={s.liveChipText}>LIVE</Text>
            </View>
          </>
        )}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={km.strip}>
        {moments.map((m, i) => {
          const type = classifyPlay(m.description);
          const isHot = type === "three" || type === "basket" || type === "goal";
          return (
            <View key={i} style={[km.chip, isHot && { borderColor: `${dc}55`, backgroundColor: `${dc}08` }]}>
              <Text style={[km.qtr, isHot && { color: dc }]}>{m.time}</Text>
              <Text style={km.desc} numberOfLines={3}>{m.description}</Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const km = StyleSheet.create({
  strip: { paddingHorizontal: 0, paddingBottom: 4, gap: 8, flexDirection: "row" },
  chip: {
    width: 148, padding: 10, borderRadius: 10,
    backgroundColor: C.card, borderWidth: 1, borderColor: C.cardBorder,
  },
  qtr: { color: C.textTertiary, fontSize: 10, fontWeight: "700", letterSpacing: 0.8, marginBottom: 4, textTransform: "uppercase" },
  desc: { color: C.text, fontSize: 12, fontWeight: "600", lineHeight: 17 },
});

// ─── Individual play row ───────────────────────────────────────────────────────
function PlayRow({ play, dc, showDivider }: { play: { time: string; description: string; team: string }; dc: string; showDivider: boolean }) {
  const type = classifyPlay(play.description);
  const icon = playIcon(type);
  const badge = playBadge(type, play.description);
  const isTimeout = type === "timeout";
  const isSub = type === "sub";

  return (
    <View>
      <View style={[s.playRow, isTimeout && s.playRowTimeout, isSub && s.playRowSub]}>
        <View style={[s.playIconCircle, { backgroundColor: `${icon.color}18` }]}>
          <Ionicons name={icon.name as any} size={16} color={icon.color} />
        </View>
        <View style={s.playBody}>
          <View style={s.playMeta}>
            <Text style={s.playTime}>{play.time}</Text>
            {play.team ? <Text style={[s.playTeam, { color: dc }]}>{play.team.split(" ").slice(-1)[0]}</Text> : null}
          </View>
          <Text style={[s.playDesc, isTimeout && { color: "#FFD700", fontWeight: "700" }, isSub && { color: C.textSecondary }]}>
            {play.description}
          </Text>
        </View>
        {badge && (
          <View style={[s.playBadge, { backgroundColor: badge === "GOAL" ? "#30D158" : `${dc}22`, borderColor: badge === "GOAL" ? "#30D158" : dc }]}>
            <Text style={[s.playBadgeText, { color: badge === "GOAL" ? "#fff" : dc }]}>{badge}</Text>
          </View>
        )}
      </View>
      {showDivider && <View style={s.playDivider} />}
    </View>
  );
}

// ─── Quick stats bar (3-column) ───────────────────────────────────────────────
function QuickStatsBar({ homeTeam, awayTeam, homeStats, awayStats, dc }: {
  homeTeam: string; awayTeam: string;
  homeStats: Record<string, string | number>;
  awayStats: Record<string, string | number>;
  dc: string;
}) {
  const keys = Object.keys(homeStats).slice(0, 5);
  if (keys.length === 0) return null;
  return (
    <View style={s.quickStats}>
      {keys.map((key, i) => {
        const hv = comparableStatValue(homeStats[key]) ?? 0;
        const av = comparableStatValue(awayStats[key]) ?? 0;
        const total = Math.abs(hv) + Math.abs(av);
        const homePct = total > 0 ? Math.max(0.05, Math.min(0.95, Math.abs(hv) / total)) : 0.5;
        return (
          <View key={key} style={[s.quickStatRow, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.separator }]}>
            <Text style={s.quickStatVal}>{awayStats[key]}</Text>
            <View style={s.quickStatMid}>
              <Text style={s.quickStatKey}>{key}</Text>
              <View style={s.quickStatBar}>
                <View style={{ flex: 1 - homePct, height: 3, backgroundColor: `${dc}44`, borderRadius: 2 }} />
                <View style={{ flex: homePct, height: 3, backgroundColor: dc, borderRadius: 2 }} />
              </View>
            </View>
            <Text style={[s.quickStatVal, { textAlign: "right" }]}>{homeStats[key]}</Text>
          </View>
        );
      })}
    </View>
  );
}

// ─── Team aggregate stats table ───────────────────────────────────────────────
function TeamStatsSection({ homeTeam, awayTeam, homeStats, awayStats, dc, league }: {
  homeTeam: string; awayTeam: string;
  homeStats: Record<string, string | number>;
  awayStats: Record<string, string | number>;
  dc: string; league: string;
}) {
  const keys = Object.keys(homeStats);
  if (keys.length === 0) return <Text style={s.empty}>No stats available</Text>;
  return (
    <View style={s.statsCard}>
      <View style={s.statsHead}>
        <Pressable
          style={{ flex: 1 }}
          onPress={() => goToTeam(awayTeam, league)}
          accessibilityRole="button"
          accessibilityLabel={`Open ${awayTeam} team page`}
        >
          <Text style={[s.statsTeam, { color: dc }]} numberOfLines={1}>{awayTeam}</Text>
        </Pressable>
        <Text style={s.statsLabel}>TEAM STATS</Text>
        <Pressable
          style={{ flex: 1 }}
          onPress={() => goToTeam(homeTeam, league)}
          accessibilityRole="button"
          accessibilityLabel={`Open ${homeTeam} team page`}
        >
          <Text style={[s.statsTeam, { color: dc, textAlign: "right" }]} numberOfLines={1}>{homeTeam}</Text>
        </Pressable>
      </View>
      {keys.map((key, i) => {
        const hv = comparableStatValue(homeStats[key]) ?? 0;
        const av = comparableStatValue(awayStats[key]) ?? 0;
        const total = Math.abs(hv) + Math.abs(av);
        const homePct = total > 0 ? Math.max(0.05, Math.min(0.95, Math.abs(hv) / total)) : 0.5;
        return (
          <View key={key} style={[s.statRow, i === keys.length - 1 && { borderBottomWidth: 0 }]}>
            <Text style={[s.statVal, av >= hv && { color: dc }]}>{awayStats[key]}</Text>
            <View style={s.statMid}>
              <Text style={s.statKey}>{key}</Text>
              <View style={s.statBar}>
                <View style={{ flex: 1 - homePct, height: 3, backgroundColor: `${dc}33`, borderRadius: 2 }} />
                <View style={{ flex: homePct, height: 3, backgroundColor: dc, borderRadius: 2 }} />
              </View>
            </View>
            <Text style={[s.statVal, { textAlign: "right" }, hv > av && { color: dc }]}>{homeStats[key]}</Text>
          </View>
        );
      })}
    </View>
  );
}

// ─── Player boxscore ──────────────────────────────────────────────────────────
function PlayerBoxscore({ teamName, teamLogo, players, league, dc, overrideCols, sectionLabel }: {
  teamName: string; teamLogo?: string | null;
  players: PlayerStatLine[]; league: string; dc: string;
  overrideCols?: string[]; sectionLabel?: string;
}) {
  if (players.length === 0) return null;
  const cols = overrideCols ?? PLAYER_STAT_COLS[league] ?? ["PTS", "REB", "AST"];
  const availCols = cols.filter(c => players.some(p => p.stats[c] != null));
  if (availCols.length === 0) return null;

  return (
    <View style={s.boxCard}>
      <Pressable
        style={s.boxTeamHeader}
        onPress={() => goToTeam(teamName, league)}
        accessibilityRole="button"
        accessibilityLabel={`Open ${teamName} team page`}
      >
        <TeamLogo uri={teamLogo} name={teamName} size={28} borderColor={`${dc}44`} />
        <Text style={[s.boxTeamName, { color: dc }]}>{teamName}{sectionLabel ? ` — ${sectionLabel}` : ""}</Text>
      </Pressable>
      <View style={[s.boxRow, s.boxHeaderRow]}>
        <Text style={[s.boxPlayer, s.boxHeaderText]}>PLAYER</Text>
        {availCols.map(c => <Text key={c} style={[s.boxStat, s.boxHeaderText]}>{c}</Text>)}
      </View>
      {players.map(player => {
        const isGK = player.stats?.role === "GK";
        const isGoalie = player.stats?.role === "G";
        return (
          <Pressable
            key={player.name}
            style={s.boxRow}
            onPress={() => goToPlayer(player.name)}
            accessibilityRole="button"
            accessibilityLabel={`Open ${player.name} player page`}
          >
            <View style={s.boxPlayerCell}>
              {player.starter && <View style={[s.starterDot, { backgroundColor: dc }]} />}
              <Text style={s.boxPlayer} numberOfLines={1}>{player.name}</Text>
              {(isGK || isGoalie) && (
                <View style={{ backgroundColor: `${dc}22`, borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1, marginLeft: 4 }}>
                  <Text style={{ color: dc, fontSize: 9, fontWeight: "800", fontFamily: FONTS.bodyBold }}>{isGK ? "GK" : "G"}</Text>
                </View>
              )}
            </View>
            {availCols.map(c => <Text key={c} style={s.boxStat}>{player.stats[c] ?? "—"}</Text>)}
          </Pressable>
        );
      })}
      <Text style={s.boxNote}>● Starter</Text>
    </View>
  );
}

// ─── Lineup section ────────────────────────────────────────────────────────────
function LineupSection({ teamName, teamLogo, league, players, dc }: {
  teamName: string; teamLogo?: string | null;
  league: string; players: PlayerStatLine[]; dc: string;
}) {
  const starters = players.filter(p => p.starter);
  const bench = players.filter(p => !p.starter);
  return (
    <View style={s.lineupSection}>
      <Pressable
        style={s.lineupTeamHeader}
        onPress={() => goToTeam(teamName, league)}
        accessibilityRole="button"
        accessibilityLabel={`Open ${teamName} team page`}
      >
        <TeamLogo uri={teamLogo} name={teamName} size={32} borderColor={`${dc}44`} />
        <Text style={[s.lineupTeamName, { color: dc }]}>{teamName}</Text>
      </Pressable>
      {starters.length > 0 && (
        <>
          <Text style={s.rosterLabel}>STARTERS</Text>
          {starters.map((player, i) => (
            <PlayerRow key={player.name} player={player} idx={i} dc={dc} league={league} isStarter />
          ))}
        </>
      )}
      {bench.length > 0 && (
        <>
          <Text style={s.rosterLabel}>BENCH</Text>
          {bench.map((player, i) => (
            <PlayerRow key={player.name} player={player} idx={i} dc={dc} league={league} isStarter={false} />
          ))}
        </>
      )}
      {players.length === 0 && <Text style={s.empty}>No lineup data</Text>}
    </View>
  );
}

function PlayerRow({ player, idx, dc, league, isStarter }: {
  player: PlayerStatLine; idx: number; dc: string; league: string; isStarter: boolean;
}) {
  const [err, setErr] = useState(false);
  const url = getEspnHeadshotUrl(player.name, league);
  return (
    <Pressable
      style={s.playerRow}
      onPress={() => goToPlayer(player.name)}
      accessibilityRole="button"
      accessibilityLabel={`Open ${player.name} player page`}
    >
      <View style={[s.playerNumBadge, isStarter ? { backgroundColor: `${dc}22` } : { backgroundColor: "rgba(255,255,255,0.06)" }]}>
        <Text style={[s.playerNum, isStarter && { color: dc }]}>{idx + 1}</Text>
      </View>
      {url && !err ? (
        <Image source={{ uri: url }} style={s.playerHeadshot} onError={() => setErr(true)} />
      ) : (
        <View style={s.playerHeadshotPlaceholder}>
          <Text style={s.playerHeadshotInitial}>{player.name.charAt(0)}</Text>
        </View>
      )}
      <Text style={s.playerName} numberOfLines={1}>{player.name}</Text>
      <Ionicons name="chevron-forward" size={14} color={C.textTertiary} />
    </Pressable>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background },

  // nav
  nav: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 10 },
  navBack: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  navTitle: { flex: 1, textAlign: "center", color: C.text, fontSize: 15, fontWeight: "700", fontFamily: FONTS.bodyBold },
  navRight: { width: 40, alignItems: "flex-end", justifyContent: "center" },

  loading: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { color: C.textTertiary, fontSize: 14 },

  // hero
  hero: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 24, gap: 16, alignItems: "center" },
  statusPill: {
    flexDirection: "row", alignItems: "center", gap: 7,
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1,
  },
  statusLeague: { fontSize: 12, fontWeight: "900", letterSpacing: 1 },
  liveDotPill: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.live },
  liveLabel: { color: C.live, fontSize: 12, fontWeight: "800", letterSpacing: 0.5 },
  statusSep: { color: C.textTertiary, fontSize: 12 },
  statusExtra: { color: C.textSecondary, fontSize: 12, fontWeight: "500" },

  heroTeams: { flexDirection: "row", alignItems: "center", width: "100%", gap: 8 },
  heroTeamCol: { flex: 1, alignItems: "flex-start", gap: 8 },
  heroTeamName: { color: C.text, fontSize: 13, fontWeight: "700", fontFamily: FONTS.bodyBold, lineHeight: 17 },
  heroTeamLabel: { color: C.textTertiary, fontSize: 10, fontWeight: "600", letterSpacing: 0.8 },
  heroScoreBlock: { alignItems: "center", gap: 6, minWidth: 130 },
  heroScoreRow: { flexDirection: "row", alignItems: "baseline", gap: 4 },
  heroScore: { fontSize: 56, fontWeight: "900", color: C.text, fontFamily: FONTS.bodyBold, lineHeight: 62 },
  heroScoreSep: { fontSize: 32, color: C.textTertiary, fontWeight: "300" },
  heroScoreDim: { color: C.textTertiary },
  vsText: { fontSize: 28, fontWeight: "900", color: C.textTertiary, fontFamily: FONTS.bodyBold },
  clockPill: {
    borderWidth: 1, borderRadius: 14,
    paddingHorizontal: 12, paddingVertical: 3,
  },
  clockText: { fontSize: 12, fontWeight: "700", letterSpacing: 0.3 },
  venueText: { color: C.textTertiary, fontSize: 10, textAlign: "center" },
  watchPill: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderWidth: 1.5, borderRadius: 24,
    paddingHorizontal: 20, paddingVertical: 10,
    marginTop: 4,
  },
  watchText: { fontSize: 13, fontWeight: "800", letterSpacing: 0.4, fontFamily: FONTS.bodyBold },

  // tab bar
  tabBarWrap: { backgroundColor: C.background, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.cardBorder },
  tabBar: { flexDirection: "row", paddingHorizontal: 12, gap: 0 },
  tab: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 13,
    borderBottomWidth: 2.5, borderBottomColor: "transparent",
  },
  tabLabel: { color: C.textTertiary, fontSize: 13, fontWeight: "600", fontFamily: FONTS.bodySemiBold },

  // content
  content: { paddingBottom: 60 },
  baseballContent: { paddingBottom: 0 },
  tabSection: { padding: 16, gap: 14 },

  // win probability
  winProbCard: {
    backgroundColor: C.card, borderRadius: 16,
    padding: 16, gap: 8,
    borderWidth: 1, borderColor: C.cardBorder,
  },
  winProbLabel: { color: C.textTertiary, fontSize: 11, fontWeight: "700", letterSpacing: 0.8, textAlign: "center" },
  winProbRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  winProbTeam: { fontSize: 11, fontWeight: "700", width: 50 },
  winProbBar: { flex: 1, flexDirection: "row", height: 8, borderRadius: 4, overflow: "hidden" },
  winProbFillAway: { borderRadius: 2 },
  winProbFillHome: { borderRadius: 2 },
  winProbPcts: { flexDirection: "row", justifyContent: "space-between" },
  winProbPct: { color: C.textTertiary, fontSize: 11, fontWeight: "600" },

  // live chip in section header
  liveChip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "rgba(232,22,43,0.15)",
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 8,
  },
  liveDotSmall: { width: 5, height: 5, borderRadius: 3, backgroundColor: C.live },
  liveChipText: { color: C.live, fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },

  // section headers
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 4 },
  sectionAccent: { width: 4, height: 18, borderRadius: 2 },
  sectionTitle: { fontSize: 17, fontWeight: "800", color: C.text, fontFamily: FONTS.bodyBold },

  // plays
  playsCard: { backgroundColor: C.card, borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: C.cardBorder },
  playRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  playRowTimeout: { backgroundColor: "rgba(255,215,0,0.05)" },
  playRowSub: { backgroundColor: "rgba(74,144,217,0.05)" },
  playIconCircle: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 },
  playBody: { flex: 1, gap: 3 },
  playMeta: { flexDirection: "row", alignItems: "center", gap: 8 },
  playTime: { color: C.textTertiary, fontSize: 11, fontWeight: "600", fontFamily: FONTS.bodySemiBold },
  playTeam: { fontSize: 11, fontWeight: "700" },
  playDesc: { color: C.text, fontSize: 14, lineHeight: 20, fontFamily: FONTS.body },
  playBadge: {
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 8, borderWidth: 1,
    alignSelf: "center", flexShrink: 0,
  },
  playBadgeText: { fontSize: 11, fontWeight: "900", letterSpacing: 0.3 },
  playDivider: { height: StyleSheet.hairlineWidth, backgroundColor: C.separator, marginLeft: 60 },

  // quick stats
  quickStats: { backgroundColor: C.card, borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: C.cardBorder },
  quickStatRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingVertical: 12 },
  quickStatVal: { fontSize: 14, fontWeight: "700", color: C.text, fontFamily: FONTS.bodyBold, minWidth: 48 },
  quickStatMid: { flex: 1, gap: 4 },
  quickStatKey: { color: C.textTertiary, fontSize: 11, fontWeight: "600", textAlign: "center", letterSpacing: 0.5 },
  quickStatBar: { flexDirection: "row", height: 3, borderRadius: 2, overflow: "hidden" },

  // ai
  aiCard: { backgroundColor: C.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.cardBorder, gap: 10 },
  aiHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  aiTitle: { fontSize: 13, fontWeight: "700", letterSpacing: 0.5 },
  aiText: { color: C.textSecondary, fontSize: 14, lineHeight: 22, fontFamily: FONTS.body },

  // stats table
  statsCard: { backgroundColor: C.card, borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: C.cardBorder },
  statsHead: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.separator },
  statsTeam: { flex: 1, fontSize: 13, fontWeight: "700" },
  statsLabel: { color: C.textTertiary, fontSize: 10, fontWeight: "700", letterSpacing: 0.8, flex: 1, textAlign: "center" },
  statRow: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.separator,
    gap: 8,
  },
  statVal: { fontSize: 14, fontWeight: "700", color: C.text, fontFamily: FONTS.bodyBold, minWidth: 50 },
  statMid: { flex: 1, gap: 4 },
  statKey: { color: C.textTertiary, fontSize: 11, textAlign: "center", letterSpacing: 0.5 },
  statBar: { flexDirection: "row", height: 3, borderRadius: 2, overflow: "hidden" },

  // box score
  boxCard: { backgroundColor: C.card, borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: C.cardBorder },
  boxTeamHeader: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.separator },
  boxTeamName: { fontSize: 14, fontWeight: "800", fontFamily: FONTS.bodyBold },
  boxRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.separator },
  boxHeaderRow: { backgroundColor: "rgba(255,255,255,0.03)" },
  boxHeaderText: { color: C.textTertiary, fontSize: 10, fontWeight: "700", letterSpacing: 0.5 },
  boxPlayerCell: { flex: 1, flexDirection: "row", alignItems: "center", gap: 6 },
  boxPlayer: { flex: 1, color: C.text, fontSize: 13, fontFamily: FONTS.bodyMedium },
  boxStat: { width: 44, color: C.textSecondary, fontSize: 12, textAlign: "center", fontFamily: FONTS.bodyMedium },
  starterDot: { width: 5, height: 5, borderRadius: 3, flexShrink: 0 },
  boxNote: { color: C.textTertiary, fontSize: 10, padding: 10, fontFamily: FONTS.body },

  // lineups
  lineupSection: { gap: 6 },
  lineupTeamHeader: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8 },
  lineupTeamName: { fontSize: 15, fontWeight: "800", fontFamily: FONTS.bodyBold },
  rosterLabel: { color: C.textTertiary, fontSize: 10, fontWeight: "700", letterSpacing: 1, fontFamily: FONTS.bodyBold, marginTop: 4 },
  playerRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: C.card, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    borderWidth: 1, borderColor: C.cardBorder,
  },
  playerNumBadge: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  playerNum: { color: C.textTertiary, fontSize: 12, fontWeight: "700" },
  playerHeadshot: { width: 38, height: 38, borderRadius: 10, backgroundColor: C.glassMedium, overflow: "hidden" },
  playerHeadshotPlaceholder: { width: 38, height: 38, borderRadius: 10, backgroundColor: C.glassMedium, alignItems: "center", justifyContent: "center" },
  playerHeadshotInitial: { color: C.textTertiary, fontSize: 14, fontWeight: "700" },
  playerName: { flex: 1, color: C.text, fontSize: 15, fontFamily: FONTS.bodyMedium },

  empty: { color: C.textTertiary, fontSize: 14, textAlign: "center", paddingVertical: 20, fontFamily: FONTS.body },
  emptyBoxState: { alignItems: "center", paddingVertical: 40, paddingHorizontal: 24 },
  emptyBoxIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  emptyBoxTitle: { color: C.text, fontSize: 17, fontFamily: FONTS.bodyBold, marginBottom: 8, textAlign: "center" },
  emptyBoxMsg: { color: C.textSecondary, fontSize: 14, fontFamily: FONTS.body, textAlign: "center", lineHeight: 20, marginBottom: 12 },
  emptyBoxHint: { fontSize: 13, fontFamily: FONTS.bodySemiBold, textAlign: "center" },
});
