import React, { useState, useCallback, useEffect, useRef, useMemo } from "react";
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  Pressable, Platform, FlatList, ActivityIndicator, Animated, useWindowDimensions
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { FONTS } from "@/constants/typography";
import { api } from "@/utils/api";
import type { Game, NewsArticle, StandingEntry } from "@/utils/api";
import { usePreferences } from "@/context/PreferencesContext";
import { useSearch } from "@/context/SearchContext";
import { GameCard, TeamLogo } from "@/components/GameCard";
import { MomentGraphic } from "@/components/MomentGraphic";
import { RecapCard } from "@/components/RecapCard";
import { GameCardSkeleton } from "@/components/LoadingSkeleton";
import { ProfileButton } from "@/components/ProfileButton";
import { goToTeam } from "@/utils/navHelpers";
import { ALL_TEAMS } from "@/constants/allPlayers";
import { isTennisLeague, isCombatLeague, shortAthleteName } from "@/utils/sportArchetype";
import { getCreatorPreviews } from "@/constants/communityPreview";

const C = Colors.dark;

function getTeamEspnLogoUrl(teamName: string, league: string): string | null {
  const team = ALL_TEAMS.find(t => t.name === teamName);
  if (!team?.abbr) return null;
  const abbr = team.abbr.toLowerCase();
  // ESPN sport slugs for team logos
  const sportMap: Record<string, string> = {
    NBA: "nba", WNBA: "wnba",
    NFL: "nfl", NCAAF: "college-football",
    MLB: "mlb", NCAABB: "college-baseball",
    NHL: "nhl", NCAAHM: "mens-college-hockey", NCAAHW: "womens-college-hockey",
    MLS: "soccer", NWSL: "soccer",
    EPL: "soccer", LIGA: "soccer", BUN: "soccer", SERA: "soccer", LIG1: "soccer",
    UCL: "soccer", UEL: "soccer", UECL: "soccer",
    NCAAB: "mens-college-basketball", NCAAW: "womens-college-basketball",
    ATP: "tennis", WTA: "tennis",
    UFC: "mma", BELLATOR: "mma", PFL: "mma",
    F1: "racing", NASCAR: "racing",
  };
  const sport = sportMap[league];
  if (!sport) return null;
  return `https://a.espncdn.com/i/teamlogos/${sport}/500/${abbr}.png`;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

const HOUSTON_TEAMS = ["Houston Rockets", "Houston Astros", "Houston Texans"];
const SPORTS = ["NBA", "MLB", "MLS", "NFL"] as const;
type SportKey = typeof SPORTS[number];

const SPORT_COLOR: Record<SportKey, string> = {
  NBA: "#E8503A", MLB: "#3B6DB8", MLS: "#206E6B", NFL: "#687C88",
};

const STATUS_RANK: Record<Game["status"], number> = { live: 0, upcoming: 1, finished: 2 };
function sortByStatus(arr: Game[]): Game[] {
  return [...arr].sort((a, b) => STATUS_RANK[a.status] - STATUS_RANK[b.status]);
}

const LEAGUE_COLORS: Record<string, string> = {
  NBA: C.nba, NFL: C.nfl, MLB: C.mlb, MLS: C.mls, NHL: C.accentBlue,
  EPL: C.eplBright, UCL: C.ucl, LIGA: C.liga, NCAAB: C.ncaab, WNBA: C.wnba,
  UFC: C.ufc, BOXING: C.boxing, ATP: C.atp, WTA: C.wta,
  OLYMPICS: C.olympics, XGAMES: C.xgames,
};
function getLeagueColor(l: string) { return LEAGUE_COLORS[l] ?? C.accent; }

function getScoreUnit(league: string, value: number) {
  const singular =
    league === "MLB" ? "run"
    : ["MLS", "EPL", "UCL", "LIGA", "BUN", "SERA", "LIG1", "UEL", "UECL", "NWSL", "FWCM", "EURO", "COPA", "NHL"].includes(league) ? "goal"
    : "point";
  return value === 1 ? singular : `${singular}s`;
}

function getLeadDescriptor(league: string, value: number) {
  const singular =
    league === "MLB" ? "run"
    : ["MLS", "EPL", "UCL", "LIGA", "BUN", "SERA", "LIG1", "UEL", "UECL", "NWSL", "FWCM", "EURO", "COPA", "NHL"].includes(league) ? "goal"
    : "point";
  return `${value}-${singular} lead`;
}

function getLiveActionPrompt(league: string) {
  if (league === "MLB") return "Tap in before the next swing.";
  if (["NBA", "WNBA", "NCAAB", "NCAAW"].includes(league)) return "Tap in before the next run.";
  if (["NFL", "NCAAF"].includes(league)) return "Tap in before the next drive.";
  if (["MLS", "EPL", "UCL", "LIGA", "BUN", "SERA", "LIG1", "UEL", "UECL", "NWSL", "FWCM", "EURO", "COPA", "NHL"].includes(league)) return "Tap in before the next chance.";
  return "Tap in while the live thread is open.";
}

function getGameContext(game: Game, myTeams: string[]): string | null {
  const homeScore = game.homeScore ?? 0;
  const awayScore = game.awayScore ?? 0;
  const diff = Math.abs(homeScore - awayScore);
  const isMyTeam = myTeams.includes(game.homeTeam) || myTeams.includes(game.awayTeam);
  const period = game.quarter ?? "";
  const time = game.timeRemaining ?? "";
  const awayShort = shortAthleteName(game.awayTeam);
  const homeShort = shortAthleteName(game.homeTeam);

  if (isTennisLeague(game.league)) {
    if (game.status === "live") {
      const setsLeader = homeScore > awayScore ? homeShort : awayScore > homeScore ? awayShort : null;
      if (time) return `${awayShort} vs ${homeShort} — ${time} (${period})`;
      if (setsLeader) return `${setsLeader} leads ${homeScore}–${awayScore} sets`;
      return `On serve — ${period}`;
    }
    if (game.status === "upcoming") {
      const d = new Date(game.startTime);
      const t = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
      const now = new Date();
      const minsUntil = Math.floor((d.getTime() - now.getTime()) / 60000);
      if (minsUntil > 0 && minsUntil <= 60) return `Starting in ${minsUntil}m`;
      return t;
    }
    if (game.status === "finished") {
      const winner = homeScore > awayScore ? homeShort : awayShort;
      return `${winner} wins ${homeScore > awayScore ? homeScore : awayScore}–${homeScore > awayScore ? awayScore : homeScore} sets`;
    }
    return null;
  }

  if (isCombatLeague(game.league)) {
    if (game.status === "live") {
      if (period) return `${period}${time ? ` — ${time}` : ""} · ${awayShort} vs ${homeShort}`;
      return "Fight in progress";
    }
    if (game.status === "upcoming") {
      const d = new Date(game.startTime);
      const t = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
      const now = new Date();
      const minsUntil = Math.floor((d.getTime() - now.getTime()) / 60000);
      if (minsUntil > 0 && minsUntil <= 60) return `Card starts in ${minsUntil}m`;
      return `Main event at ${t}`;
    }
    if (game.status === "finished") {
      const winner = homeScore > awayScore ? homeShort : homeScore < awayScore ? awayShort : null;
      const method = period && period !== "Final" ? ` by ${period}` : "";
      if (winner) return `${winner} wins${method}`;
      return "Decision";
    }
    return null;
  }

  if (game.status === "live") {
    const leader = homeScore > awayScore ? game.homeTeam : game.awayTeam;
    const leaderShort = leader.split(" ").slice(-1)[0];
    const isOT = /\b(?:ot|overtime)\b/i.test(period);
    if (isOT) return "Overtime thriller";
    if (diff <= 3 && (period.includes("4") || period.includes("Q4") || period.includes("9") || period.includes("3rd")))
      return `Down to the wire — ${diff === 0 ? "tied" : `${leaderShort} up ${diff}`}`;
    if (diff === 0) return "Tied game — next swing matters";
    if (diff <= 5) return `Tight game — ${leaderShort} leads by ${diff} ${getScoreUnit(game.league, diff)}`;
    if (diff >= 20) return `${leaderShort} in control`;
    if (isMyTeam) return `${time ? time + " left" : period} · ${leaderShort} +${diff}`;
    return null;
  }
  if (game.status === "upcoming") {
    const d = new Date(game.startTime);
    const t = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    const now = new Date();
    const minsUntil = Math.floor((d.getTime() - now.getTime()) / 60000);
    if (minsUntil > 0 && minsUntil <= 60) return `Starts in ${minsUntil}m`;
    return `Starts at ${t}`;
  }
  if (game.status === "finished") {
    if (!isMyTeam) return null;
    const myScore = myTeams.includes(game.homeTeam) ? homeScore : awayScore;
    const oppScore = myTeams.includes(game.homeTeam) ? awayScore : homeScore;
    const won = myScore > oppScore;
    return won ? `Won ${myScore}–${oppScore}` : `Final: Lost ${myScore}–${oppScore}`;
  }
  return null;
}

function cleanContextLine(value: string | null) {
  return value?.replace(/^[^\w\d]+/u, "").trim() ?? null;
}

function isThinBreathSummary(summary?: string) {
  if (!summary) return true;
  return /games live across|games on tap|quiet day across/i.test(summary);
}

function buildLocalBreathRead(allGames: Game[]) {
  const live = allGames.filter((g) => g.status === "live");
  const upcoming = allGames.filter((g) => g.status === "upcoming");
  const finished = allGames.filter((g) => g.status === "finished");
  const closeLive = live.filter((g) => Math.abs((g.homeScore ?? 0) - (g.awayScore ?? 0)) <= 5);
  const featured = closeLive[0] ?? live[0] ?? finished[0] ?? upcoming[0] ?? null;

  if (!featured) {
    return {
      summary: "The board is quiet right now, so this is a catch-up window: scan finals, reset your teams, and let the next slate come to you.",
      focus: "Daily read",
      angle: "Reset the board",
    };
  }

  const focus = `${featured.league} spotlight`;
  const angle = closeLive.length > 0
    ? `${closeLive.length} tight live`
    : live.length > 0
      ? `${live.length} live now`
      : upcoming.length > 0
        ? `${upcoming.length} ahead`
        : `${finished.length} final`;

  if (featured.status === "live") {
    const context = cleanContextLine(getGameContext(featured, []));
    return {
      summary: `${featured.awayTeam} at ${featured.homeTeam} is the first tap: ${getScoreLine(featured)} ${context ?? "That is the cleanest live thread on the board."}`,
      focus,
      angle,
    };
  }

  if (featured.status === "finished") {
    const homeWon = (featured.homeScore ?? 0) > (featured.awayScore ?? 0);
    const winner = homeWon ? featured.homeTeam : featured.awayTeam;
    return {
      summary: `${winner} already shaped the day with ${getScoreLine(featured)} Start there, then use the rest of the board for catch-up and recaps.`,
      focus,
      angle,
    };
  }

  const starts = new Date(featured.startTime).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  return {
    summary: `${featured.awayTeam} at ${featured.homeTeam} is the next circle on the board at ${starts}. Use the live and final tabs now, then come back when this one becomes the main thread.`,
    focus,
    angle,
  };
}

function SectionHeading({ label, accentColor, onSeeAll, badge }: {
  label: string; accentColor?: string; onSeeAll?: () => void; badge?: React.ReactNode;
}) {
  return (
    <View style={secStyles.row}>
      {accentColor && <View style={[secStyles.accent, { backgroundColor: accentColor }]} />}
      <Text style={secStyles.label}>{label}</Text>
      {badge}
      <View style={{ flex: 1 }} />
      {onSeeAll && (
        <Pressable onPress={onSeeAll} style={secStyles.arrowBtn} hitSlop={8}>
          <Text style={secStyles.arrowLabel}>See all</Text>
          <Ionicons name="chevron-forward" size={13} color={C.accent} />
        </Pressable>
      )}
    </View>
  );
}

const secStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  accent: { width: 4, height: 18, borderRadius: 2, flexShrink: 0 },
  label: { fontSize: 18, fontWeight: "900", color: C.text, fontFamily: FONTS.bodyHeavy },
  arrowBtn: { flexDirection: "row", alignItems: "center", gap: 1 },
  arrowLabel: { color: C.accent, fontSize: 13, fontWeight: "600", fontFamily: FONTS.bodySemiBold },
});

type BreathMoment = {
  id: string;
  type: "game" | "news" | "quiet";
  statusLabel: string;
  leagueLabel?: string;
  title: string;
  lines: string[];
  accentColor: string;
  game?: Game;
  article?: NewsArticle;
};

function isOvertimePeriod(period?: string | null) {
  return /\b(?:ot|overtime|extra)\b/i.test(period ?? "");
}

function isCloseGame(game: Game) {
  if (game.homeScore == null || game.awayScore == null) return false;
  return Math.abs(game.homeScore - game.awayScore) <= 5;
}

function getTeamAbbr(teamName: string) {
  return ALL_TEAMS.find((team) => team.name === teamName)?.abbr
    ?? teamName.split(" ").slice(-1)[0].slice(0, 3).toUpperCase();
}

function getMomentTitle(game: Game, myTeams: string[]) {
  const follows = myTeams.includes(game.homeTeam) || myTeams.includes(game.awayTeam);
  const homeScore = game.homeScore ?? 0;
  const awayScore = game.awayScore ?? 0;
  const diff = Math.abs(homeScore - awayScore);
  const leader = homeScore >= awayScore ? game.homeTeam : game.awayTeam;
  const leaderShort = shortAthleteName(leader);

  if (game.status === "live") {
    if (diff === 0) return `${shortAthleteName(game.homeTeam)} and ${shortAthleteName(game.awayTeam)} are tied.`;
    if (isCloseGame(game)) return `${leaderShort} protecting a ${getLeadDescriptor(game.league, diff)}.`;
    if (follows) return `${leaderShort} is driving your board.`;
    return `${game.league} has the live window.`;
  }

  if (game.status === "finished") {
    return `${leaderShort} already shaped the day.`;
  }

  return `${shortAthleteName(game.awayTeam)} at ${shortAthleteName(game.homeTeam)} is next.`;
}

function getMomentLines(game: Game, myTeams: string[]) {
  const scoreLine = getScoreLine(game).replace(/\.$/, "");
  const context = cleanContextLine(getGameContext(game, myTeams));
  const clock = [game.quarter, game.timeRemaining].filter(Boolean).join(" ");

  if (game.status === "live") {
    return [
      scoreLine,
      clock || context || "Live thread is open.",
      context && context !== clock ? context : getLiveActionPrompt(game.league),
    ].slice(0, 3);
  }

  if (game.status === "finished") {
    return [
      scoreLine,
      context || "Final is ready for the recap.",
    ];
  }

  return [
    scoreLine,
    game.venue ? game.venue : "Set your board before it starts.",
  ];
}

function rankGameMoment(game: Game, myTeams: string[]) {
  let score = 0;
  const follows = myTeams.includes(game.homeTeam) || myTeams.includes(game.awayTeam);
  if (follows) score += 100;
  if (game.status === "live") score += 80;
  if (game.status === "finished") score += 35;
  if (game.status === "upcoming") score += 25;
  if (isOvertimePeriod(game.quarter)) score += 40;
  if (isCloseGame(game)) score += 30;
  const startsIn = (new Date(game.startTime).getTime() - Date.now()) / 60000;
  if (game.status === "upcoming" && startsIn > 0 && startsIn <= 90) score += 20;
  return score;
}

function buildBreathMoments(allGames: Game[], articles: NewsArticle[], myTeams: string[]): BreathMoment[] {
  const gameMoments = [...allGames]
    .sort((a, b) => rankGameMoment(b, myTeams) - rankGameMoment(a, myTeams))
    .slice(0, 3)
    .map((game): BreathMoment => ({
      id: `game-${game.id}`,
      type: "game",
      statusLabel: game.status === "live" ? "LIVE" : game.status === "finished" ? "FINAL" : "NEXT",
      leagueLabel: game.league,
      title: getMomentTitle(game, myTeams),
      lines: getMomentLines(game, myTeams),
      accentColor: game.status === "live" ? C.live : getLeagueColor(game.league),
      game,
    }));

  if (gameMoments.length >= 3) return gameMoments;

  const newsMoments = articles.slice(0, 3 - gameMoments.length).map((article): BreathMoment => ({
    id: `news-${article.id}`,
    type: "news",
    statusLabel: "NEWS",
    leagueLabel: article.leagues?.[0] ?? article.source,
    title: article.title,
    lines: [article.summary || "Real story available now."],
    accentColor: C.accentBlue,
    article,
  }));

  const moments = [...gameMoments, ...newsMoments];
  if (moments.length > 0) return moments;

  return [{
    id: "quiet-board",
    type: "quiet",
    statusLabel: "QUIET",
    leagueLabel: "Pulse",
    title: "Quiet board right now.",
    lines: [
      "No major live swing yet.",
      "Check latest finals or add teams to personalize the pulse.",
    ],
    accentColor: C.accentGold,
  }];
}

function InOneBreath({
  allGames,
  articles,
  myTeams,
  screenWidth,
  isLoading,
  onGamePress,
  onArticlePress,
}: {
  allGames: Game[];
  articles: NewsArticle[];
  myTeams: string[];
  screenWidth: number;
  isLoading: boolean;
  onGamePress: (g: Game) => void;
  onArticlePress: (a: NewsArticle) => void;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const moments = useMemo(() => buildBreathMoments(allGames, articles, myTeams), [allGames, articles, myTeams]);
  const cardWidth = Math.max(260, Math.min(320, screenWidth - 56));

  const handlePress = (moment: BreathMoment) => {
    if (moment.game) onGamePress(moment.game);
    else if (moment.article) onArticlePress(moment.article);
    else router.push("/(tabs)/profile" as any);
  };

  if (isLoading && allGames.length === 0 && articles.length === 0) {
    return (
      <View style={breathStyles.wrap}>
        <View style={breathStyles.sectionRow}>
          <View style={breathStyles.titleRow}>
            <Ionicons name="flash" size={16} color={C.accentGold} />
            <Text style={breathStyles.sectionTitle}>IN ONE BREATH</Text>
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={breathStyles.track}>
          {[1, 2].map((item) => <View key={item} style={[breathStyles.card, { width: cardWidth }]} />)}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={breathStyles.wrap}>
      <View style={breathStyles.sectionRow}>
        <View style={breathStyles.titleRow}>
          <Ionicons name="flash" size={16} color={C.accentGold} />
          <Text style={breathStyles.sectionTitle}>IN ONE BREATH</Text>
        </View>
        <Text style={breathStyles.counter}>{Math.min(activeIndex + 1, moments.length)} of {moments.length}</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={cardWidth + 12}
        decelerationRate="fast"
        contentContainerStyle={breathStyles.track}
        onMomentumScrollEnd={(event) => {
          setActiveIndex(Math.round(event.nativeEvent.contentOffset.x / (cardWidth + 12)));
        }}
      >
        {moments.map((moment) => (
          <Pressable
            key={moment.id}
            accessibilityRole="button"
            accessibilityLabel={moment.game ? `Open ${moment.game.awayTeam} at ${moment.game.homeTeam}` : moment.article ? `Open story: ${moment.article.title}` : "Open profile to personalize the pulse"}
            onPress={() => handlePress(moment)}
            style={({ pressed }) => [breathStyles.card, { width: cardWidth, borderColor: `${moment.accentColor}55` }, pressed && breathStyles.cardPressed]}
          >
            <View style={breathStyles.cardTop}>
              <View style={[breathStyles.statusPill, { backgroundColor: `${moment.accentColor}22`, borderColor: `${moment.accentColor}44` }]}>
                <Text style={[breathStyles.statusText, { color: moment.accentColor }]}>{moment.statusLabel}</Text>
              </View>
              {moment.leagueLabel ? <Text style={breathStyles.leagueText}>{moment.leagueLabel}</Text> : null}
            </View>

            <View style={breathStyles.bodyRow}>
              <View style={breathStyles.copyColumn}>
                <Text style={breathStyles.cardTitle} numberOfLines={3}>{moment.title}</Text>
                <View style={breathStyles.lineStack}>
                  {moment.lines.slice(0, 3).map((line, index) => (
                    <Text key={`${moment.id}-${index}`} style={breathStyles.cardLine} numberOfLines={2}>{line}</Text>
                  ))}
                </View>
                <View style={breathStyles.actionPill}>
                  <Text style={breathStyles.actionText}>{moment.game ? "Gamecast" : moment.article ? "Read" : "Personalize"}</Text>
                  <Ionicons name="chevron-forward" size={13} color={C.text} />
                </View>
              </View>
              <MomentGraphic moment={moment} />
            </View>
          </Pressable>
        ))}
      </ScrollView>

      {moments.length > 1 ? (
        <View style={breathStyles.dots}>
          {moments.map((moment, index) => (
            <View key={`${moment.id}-dot`} style={[breathStyles.dot, index === activeIndex && breathStyles.dotActive]} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const breathStyles = StyleSheet.create({
  wrap: { gap: 10 },
  sectionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionTitle: { color: C.text, fontSize: 14, fontWeight: "900", fontFamily: FONTS.bodyHeavy, letterSpacing: 0.6 },
  counter: { color: C.textSecondary, fontSize: 12, fontWeight: "800", fontFamily: FONTS.bodyBold },
  track: { gap: 12, paddingRight: 16 },
  card: {
    minHeight: 214,
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 18,
    backgroundColor: C.editorialSurface,
    borderWidth: 1,
    overflow: "hidden",
  },
  cardPressed: { opacity: 0.88 },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10 },
  statusPill: { borderWidth: 1, borderRadius: 7, paddingHorizontal: 8, paddingVertical: 4 },
  statusText: { fontSize: 10, fontWeight: "900", fontFamily: FONTS.bodyHeavy, letterSpacing: 0.6 },
  leagueText: { color: C.textTertiary, fontSize: 11, fontWeight: "900", fontFamily: FONTS.bodyBold },
  bodyRow: { flexDirection: "row", alignItems: "stretch", gap: 12, flex: 1 },
  copyColumn: { flex: 1, justifyContent: "space-between", gap: 10, minWidth: 0 },
  cardTitle: { color: C.text, fontSize: 20, lineHeight: 24, fontWeight: "900", fontFamily: FONTS.bodyHeavy },
  lineStack: { gap: 3 },
  cardLine: { color: C.textSecondary, fontSize: 14, lineHeight: 19, fontFamily: FONTS.bodyMedium },
  actionPill: {
    alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 5,
    minHeight: 36, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
    backgroundColor: C.glassMedium, borderWidth: 1, borderColor: C.glassBorder,
  },
  actionText: { color: C.text, fontSize: 13, fontWeight: "900", fontFamily: FONTS.bodyBold },
  dots: { flexDirection: "row", justifyContent: "center", gap: 8, paddingTop: 2 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.glassHeavy },
  dotActive: { width: 18, backgroundColor: C.accentGold },
});

function MoversChips({ allGames }: { allGames: Game[] }) {
  const liveGames = allGames.filter(g => g.status === "live");
  const closeGames = liveGames.filter(g => Math.abs((g.homeScore ?? 0) - (g.awayScore ?? 0)) <= 5);
  const blowoutGames = liveGames.filter(g => Math.abs((g.homeScore ?? 0) - (g.awayScore ?? 0)) >= 20);
  const upcomingCount = allGames.filter(g => g.status === "upcoming").length;

  const chips: { label: string; color: string; icon: string; filter: string }[] = [];
  if (closeGames.length > 0) {
    chips.push({ label: `${closeGames.length} nail-biter${closeGames.length > 1 ? "s" : ""}`, color: C.live, icon: "flame", filter: "close" });
  }
  if (blowoutGames.length > 0) {
    chips.push({ label: `${blowoutGames.length} blowout${blowoutGames.length > 1 ? "s" : ""}`, color: C.textTertiary, icon: "trending-up", filter: "none" });
  }
  if (upcomingCount > 0) {
    chips.push({ label: `${upcomingCount} upcoming`, color: C.accent, icon: "time-outline", filter: "upcoming" });
  }
  if (chips.length === 0) return null;

  return (
    <View style={chipStyles.row}>
      {chips.map((c, i) => (
        <Pressable
          key={i}
          style={chipStyles.chip}
          onPress={() => router.push({ pathname: "/(tabs)/live", params: { filter: c.filter } } as any)}
        >
          <Ionicons name={c.icon as any} size={11} color={c.color} />
          <Text style={[chipStyles.chipText, { color: c.color }]}>{c.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const chipStyles = StyleSheet.create({
  row: { flexDirection: "row", gap: 8, flexWrap: "wrap", paddingHorizontal: 4 },
  chip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  chipText: { fontSize: 11, fontWeight: "700", fontFamily: FONTS.bodySemiBold },
});

function SportsPulseCard({
  allGames,
  articles,
}: {
  allGames: Game[];
  articles: NewsArticle[];
}) {
  const liveCount = allGames.filter((game) => game.status === "live").length;
  const closeOrOtCount = allGames.filter((game) => game.status === "live" && (isCloseGame(game) || isOvertimePeriod(game.quarter))).length;
  const startingSoonCount = allGames.filter((game) => {
    if (game.status !== "upcoming") return false;
    const startsIn = (new Date(game.startTime).getTime() - Date.now()) / 60000;
    return startsIn > 0 && startsIn <= 120;
  }).length;
  const breakingCount = articles.filter((article) => {
    const publishedAt = new Date(article.publishedAt).getTime();
    if (Number.isNaN(publishedAt)) return false;
    return Date.now() - publishedAt <= 12 * 60 * 60 * 1000;
  }).length;
  const metrics = [
    { label: "Live", value: liveCount, icon: "radio-outline", color: C.live },
    { label: "Close / OT", value: closeOrOtCount, icon: "timer-outline", color: C.accentGold },
    { label: "Breaking", value: breakingCount, icon: "flash-outline", color: C.error },
    { label: "Starting Soon", value: startingSoonCount, icon: "calendar-outline", color: C.accentBlue },
  ];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Open live sports overview"
      onPress={() => router.push("/(tabs)/live" as any)}
      style={({ pressed }) => [pulseCardStyles.card, pressed && pulseCardStyles.cardPressed]}
    >
      <View style={pulseCardStyles.header}>
        <View style={pulseCardStyles.titleRow}>
          <Ionicons name="pulse-outline" size={16} color={C.text} />
          <Text style={pulseCardStyles.title}>SPORTS PULSE</Text>
        </View>
        <Text style={pulseCardStyles.timestamp}>Today</Text>
      </View>
      <View style={pulseCardStyles.metricRow}>
        {metrics.map((metric, index) => (
          <View key={metric.label} style={pulseCardStyles.metricCell}>
            {index > 0 ? <View style={pulseCardStyles.metricDivider} /> : null}
            <Ionicons name={metric.icon as any} size={18} color={metric.color} />
            <Text style={pulseCardStyles.metricValue}>{metric.value}</Text>
            <Text style={pulseCardStyles.metricLabel} numberOfLines={1}>{metric.label}</Text>
          </View>
        ))}
      </View>
    </Pressable>
  );
}

const pulseCardStyles = StyleSheet.create({
  card: {
    gap: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 20,
    backgroundColor: C.cardElevated,
    borderWidth: 1,
    borderColor: C.cardBorderActive,
  },
  cardPressed: { opacity: 0.88 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { color: C.text, fontSize: 13, fontWeight: "900", fontFamily: FONTS.bodyHeavy, letterSpacing: 0.5 },
  timestamp: { color: C.textSecondary, fontSize: 12, fontFamily: FONTS.bodyMedium },
  metricRow: { flexDirection: "row", alignItems: "stretch" },
  metricCell: { flex: 1, alignItems: "center", gap: 4, minHeight: 72, justifyContent: "center" },
  metricDivider: { position: "absolute", left: 0, top: 10, bottom: 10, width: StyleSheet.hairlineWidth, backgroundColor: C.separator },
  metricValue: { color: C.text, fontSize: 26, lineHeight: 30, fontWeight: "900", fontFamily: FONTS.bodyHeavy },
  metricLabel: { color: C.textSecondary, fontSize: 11, fontWeight: "800", fontFamily: FONTS.bodyBold },
});

function formatPeriodLabel(game: Game) {
  if (game.status === "live") return [game.quarter, game.timeRemaining].filter(Boolean).join(" ") || "LIVE";
  if (game.status === "finished") return "FINAL";
  return new Date(game.startTime).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function pickLiveRailGames(allGames: Game[], myTeams: string[]) {
  const live = allGames.filter((game) => game.status === "live");
  const source = live.length > 0 ? live : allGames.filter((game) => game.status === "upcoming");
  return [...source]
    .sort((a, b) => rankGameMoment(b, myTeams) - rankGameMoment(a, myTeams))
    .slice(0, 8);
}

function LiveGameMiniCard({ game, onPress }: { game: Game; onPress: (game: Game) => void }) {
  const periodColor = game.status === "live" ? C.live : C.textSecondary;
  const homeAbbr = getTeamAbbr(game.homeTeam);
  const awayAbbr = getTeamAbbr(game.awayTeam);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${game.awayTeam} at ${game.homeTeam}`}
      onPress={() => onPress(game)}
      style={({ pressed }) => [liveRailStyles.card, pressed && liveRailStyles.cardPressed]}
    >
      <View style={liveRailStyles.cardTop}>
        <Text style={liveRailStyles.league}>{game.league}</Text>
        <Text style={[liveRailStyles.period, { color: periodColor }]} numberOfLines={1}>{formatPeriodLabel(game)}</Text>
      </View>

      <View style={liveRailStyles.logoRow}>
        <TeamLogo uri={game.awayTeamLogo ?? getTeamEspnLogoUrl(game.awayTeam, game.league)} name={game.awayTeam} size={40} />
        <TeamLogo uri={game.homeTeamLogo ?? getTeamEspnLogoUrl(game.homeTeam, game.league)} name={game.homeTeam} size={40} />
      </View>

      <View style={liveRailStyles.scoreRow}>
        <View style={liveRailStyles.teamScore}>
          <Text style={liveRailStyles.score}>{game.awayScore ?? "-"}</Text>
          <Text style={liveRailStyles.abbr}>{awayAbbr}</Text>
        </View>
        <View style={liveRailStyles.teamScore}>
          <Text style={liveRailStyles.score}>{game.homeScore ?? "-"}</Text>
          <Text style={liveRailStyles.abbr}>{homeAbbr}</Text>
        </View>
      </View>

      <Text style={[liveRailStyles.liveLabel, game.status !== "live" && liveRailStyles.nextLabel]}>
        {game.status === "live" ? "LIVE" : game.status === "finished" ? "FINAL" : "NEXT"}
      </Text>
    </Pressable>
  );
}

function LiveGamesRail({
  allGames,
  myTeams,
  isLoading,
  isError,
  onRetry,
  onGamePress,
}: {
  allGames: Game[];
  myTeams: string[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onGamePress: (game: Game) => void;
}) {
  const games = pickLiveRailGames(allGames, myTeams);
  const hasLive = allGames.some((game) => game.status === "live");

  return (
    <View style={liveRailStyles.wrap}>
      <View style={liveRailStyles.header}>
        <View style={liveRailStyles.titleRow}>
          <View style={[liveRailStyles.dot, { backgroundColor: hasLive ? C.live : C.accentGold }]} />
          <Text style={liveRailStyles.title}>{hasLive ? "LIVE GAMES" : "NEXT UP"}</Text>
        </View>
        <Pressable accessibilityRole="button" onPress={() => router.push("/(tabs)/live" as any)} hitSlop={10}>
          <Text style={liveRailStyles.viewAll}>View all</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={liveRailStyles.track}>
          {[1, 2, 3].map((item) => <View key={item} style={liveRailStyles.skeletonCard} />)}
        </ScrollView>
      ) : isError ? (
        <Pressable style={liveRailStyles.emptyCard} onPress={onRetry}>
          <Ionicons name="wifi-outline" size={22} color={C.textTertiary} />
          <Text style={liveRailStyles.emptyText}>Could not load games. Tap to retry.</Text>
        </Pressable>
      ) : games.length === 0 ? (
        <View style={liveRailStyles.emptyCard}>
          <Ionicons name="calendar-outline" size={22} color={C.textTertiary} />
          <Text style={liveRailStyles.emptyText}>No live games right now. The next slate will appear here.</Text>
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={liveRailStyles.track}>
          {games.map((game) => <LiveGameMiniCard key={game.id} game={game} onPress={onGamePress} />)}
        </ScrollView>
      )}
    </View>
  );
}

const liveRailStyles = StyleSheet.create({
  wrap: { gap: 12 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  dot: { width: 9, height: 9, borderRadius: 5 },
  title: { color: C.text, fontSize: 14, fontWeight: "900", fontFamily: FONTS.bodyHeavy, letterSpacing: 0.5 },
  viewAll: { color: C.accentBlue, fontSize: 13, fontWeight: "800", fontFamily: FONTS.bodyBold },
  track: { gap: 12, paddingRight: 16 },
  card: {
    width: 188,
    minHeight: 168,
    padding: 14,
    borderRadius: 18,
    backgroundColor: C.cardElevated,
    borderWidth: 1,
    borderColor: C.cardBorderActive,
    gap: 10,
  },
  cardPressed: { opacity: 0.86 },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  league: { color: C.textSecondary, fontSize: 12, fontWeight: "900", fontFamily: FONTS.bodyBold },
  period: { flex: 1, textAlign: "right", fontSize: 12, fontWeight: "900", fontFamily: FONTS.bodyHeavy },
  logoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 4 },
  scoreRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  teamScore: { gap: 1 },
  score: { color: C.text, fontSize: 26, lineHeight: 30, fontWeight: "900", fontFamily: FONTS.bodyHeavy },
  abbr: { color: C.textSecondary, fontSize: 12, fontWeight: "800", fontFamily: FONTS.bodyBold },
  liveLabel: { color: C.error, fontSize: 12, fontWeight: "900", fontFamily: FONTS.bodyHeavy, letterSpacing: 0.5 },
  nextLabel: { color: C.textTertiary },
  skeletonCard: { width: 188, height: 168, borderRadius: 18, backgroundColor: C.glassLight, borderWidth: 1, borderColor: C.cardBorder },
  emptyCard: {
    minHeight: 104,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: 16,
    borderRadius: 18,
    backgroundColor: C.cardElevated,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  emptyText: { color: C.textSecondary, fontSize: 13, fontFamily: FONTS.bodyMedium, textAlign: "center" },
});

function PersonalizeCard() {
  return (
    <Pressable onPress={() => router.push("/(tabs)/profile" as any)} style={personS.card}>
      <LinearGradient
        colors={[`${C.accent}14`, `${C.accentGold}08`]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      />
      <View style={personS.left}>
        <View style={personS.iconWrap}>
          <Ionicons name="star" size={20} color={C.accentGold} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={personS.title}>Make it yours</Text>
          <Text style={personS.sub}>Follow teams to get personalized scores, alerts, and AI recaps</Text>
        </View>
      </View>
      <View style={personS.badge}>
        <Text style={personS.badgeText}>Set Up</Text>
        <Ionicons name="chevron-forward" size={12} color={C.accent} />
      </View>
    </Pressable>
  );
}

const personS = StyleSheet.create({
  card: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: C.card, borderRadius: 18, padding: 16,
    borderWidth: 1.5, borderColor: `${C.accent}30`, overflow: "hidden", gap: 12,
  },
  left: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  iconWrap: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: `${C.accentGold}20`,
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  title: { color: C.text, fontSize: 15, fontWeight: "900", fontFamily: FONTS.bodyHeavy, marginBottom: 2 },
  sub: { color: C.textTertiary, fontSize: 12, fontFamily: FONTS.body, lineHeight: 17 },
  badge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: `${C.accent}20`, paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 10, borderWidth: 1, borderColor: `${C.accent}40`, flexShrink: 0,
  },
  badgeText: { color: C.accent, fontSize: 12, fontWeight: "700", fontFamily: FONTS.bodySemiBold },
});

function getScoreLine(game: Game) {
  if (game.status === "upcoming") {
    const startsAt = new Date(game.startTime).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    return `Starts ${startsAt}${game.venue ? ` at ${game.venue}` : ""}.`;
  }

  if (game.homeScore != null && game.awayScore != null) {
    const clock = game.status === "live" && (game.quarter || game.timeRemaining)
      ? `, ${[game.quarter, game.timeRemaining].filter(Boolean).join(" ")}`
      : "";
    return `${game.awayTeam} ${game.awayScore}, ${game.homeTeam} ${game.homeScore}${clock}.`;
  }

  return game.status === "live" ? "Live now with momentum still moving." : "Final result is ready to review.";
}

function WhatMattersNow({
  game,
  article,
  myTeams,
  fanName,
  onGamePress,
  onArticlePress,
}: {
  game?: Game;
  article?: NewsArticle;
  myTeams: string[];
  fanName?: string | null;
  onGamePress: (game: Game) => void;
  onArticlePress: (article: NewsArticle) => void;
}) {
  const firstName = fanName?.trim().split(/\s+/)[0];

  if (game) {
    const followsGame = myTeams.includes(game.homeTeam) || myTeams.includes(game.awayTeam);
    const followedTeam = myTeams.find((team) => team === game.homeTeam || team === game.awayTeam);
    const context = cleanContextLine(getGameContext(game, myTeams));
    const title = followsGame
      ? `${followedTeam} is the first read`
      : game.status === "live"
        ? `${game.league} has the live window`
        : game.eventTitle || `${game.awayTeam} at ${game.homeTeam}`;
    const body = followsGame
      ? `${firstName ? `${firstName}, ` : ""}${getScoreLine(game)} ${context ?? "This is where your board starts before you open the full game."}`
      : myTeams.length === 0
        ? `${getScoreLine(game)} Use this as the front door for now; once you follow teams, this slot becomes personal.`
        : `${getScoreLine(game)} ${context ?? "Not your team, but it is the clearest signal on the board right now."}`;
    const statusLabel = game.status === "live" ? "Live now" : game.status === "upcoming" ? "Next up" : "Final read";

    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open ${game.awayTeam} at ${game.homeTeam}`}
        onPress={() => onGamePress(game)}
        style={({ pressed }) => [matterStyles.card, pressed && matterStyles.cardPressed]}
      >
        <View style={matterStyles.topRow}>
          <View style={matterStyles.kicker}>
            <Ionicons name={followsGame ? "person-circle-outline" : "compass-outline"} size={13} color={C.accentGold} />
            <Text style={matterStyles.kickerText}>{followsGame ? "FOR YOU" : "START HERE"}</Text>
          </View>
          <Text style={matterStyles.leagueLabel}>{game.league}</Text>
        </View>

        <Text style={matterStyles.title}>{title}</Text>
        <Text style={matterStyles.body}>{body}</Text>

        <View style={matterStyles.pillRow}>
          <View style={[matterStyles.pill, game.status === "live" && matterStyles.livePill]}>
            <Ionicons name={game.status === "live" ? "radio-outline" : "time-outline"} size={12} color={game.status === "live" ? C.live : C.accent} />
            <Text style={[matterStyles.pillText, game.status === "live" && { color: C.live }]}>{statusLabel}</Text>
          </View>
          {followsGame ? (
            <View style={matterStyles.pill}>
              <Ionicons name="star" size={12} color={C.accentGold} />
              <Text style={matterStyles.pillText}>Following</Text>
            </View>
          ) : null}
          <View style={matterStyles.actionPill}>
            <Text style={matterStyles.actionText}>Open Gamecast</Text>
            <Ionicons name="chevron-forward" size={13} color={C.text} />
          </View>
        </View>
      </Pressable>
    );
  }

  if (article) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open story: ${article.title}`}
        onPress={() => onArticlePress(article)}
        style={({ pressed }) => [matterStyles.card, pressed && matterStyles.cardPressed]}
      >
        <View style={matterStyles.topRow}>
          <View style={matterStyles.kicker}>
            <Ionicons name="newspaper-outline" size={13} color={C.accentGold} />
            <Text style={matterStyles.kickerText}>WHAT MATTERS NOW</Text>
          </View>
          <Text style={matterStyles.leagueLabel}>{article.source}</Text>
        </View>
        <Text style={matterStyles.title}>{article.title}</Text>
        <Text style={matterStyles.body}>{article.summary}</Text>
        <View style={matterStyles.pillRow}>
          <View style={matterStyles.actionPill}>
            <Text style={matterStyles.actionText}>Read story</Text>
            <Ionicons name="chevron-forward" size={13} color={C.text} />
          </View>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Open profile to follow teams"
      onPress={() => router.push("/(tabs)/profile" as any)}
      style={({ pressed }) => [matterStyles.card, pressed && matterStyles.cardPressed]}
    >
      <View style={matterStyles.topRow}>
        <View style={matterStyles.kicker}>
          <Ionicons name="compass-outline" size={13} color={C.accentGold} />
          <Text style={matterStyles.kickerText}>START HERE</Text>
        </View>
      </View>
      <Text style={matterStyles.title}>Make the board yours</Text>
      <Text style={matterStyles.body}>Follow teams first. Then this slot becomes a personal read on what to watch, what changed, and where the fan conversation is moving.</Text>
      <View style={matterStyles.pillRow}>
        <View style={matterStyles.actionPill}>
          <Text style={matterStyles.actionText}>Choose teams</Text>
          <Ionicons name="chevron-forward" size={13} color={C.text} />
        </View>
      </View>
    </Pressable>
  );
}

const matterStyles = StyleSheet.create({
  card: {
    gap: 12,
    backgroundColor: C.editorialSurface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: `${C.accentGold}36`,
  },
  cardPressed: { opacity: 0.86 },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  kicker: {
    flexDirection: "row", alignItems: "center", gap: 6,
    minHeight: 28, paddingHorizontal: 9, paddingVertical: 5,
    borderRadius: 999, backgroundColor: `${C.accentGold}14`,
    borderWidth: 1, borderColor: `${C.accentGold}28`,
  },
  kickerText: { color: C.accentGold, fontSize: 10, fontWeight: "900", fontFamily: FONTS.bodyBold, letterSpacing: 0.8 },
  leagueLabel: { color: C.textTertiary, fontSize: 11, fontWeight: "800", fontFamily: FONTS.bodyBold },
  title: { color: C.text, fontSize: 20, lineHeight: 24, fontWeight: "900", fontFamily: FONTS.bodyHeavy },
  body: { color: C.textSecondary, fontSize: 14, lineHeight: 20, fontFamily: FONTS.bodyMedium },
  pillRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8 },
  pill: {
    flexDirection: "row", alignItems: "center", gap: 5,
    minHeight: 32, paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 999, backgroundColor: C.glassLight,
    borderWidth: 1, borderColor: C.cardBorderActive,
  },
  livePill: { backgroundColor: C.liveGlow, borderColor: `${C.live}55` },
  pillText: { color: C.textSecondary, fontSize: 12, fontWeight: "800", fontFamily: FONTS.bodyBold },
  actionPill: {
    flexDirection: "row", alignItems: "center", gap: 4,
    minHeight: 34, paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 999, backgroundColor: `${C.accent}26`,
    borderWidth: 1, borderColor: `${C.accent}55`,
  },
  actionText: { color: C.text, fontSize: 12, fontWeight: "900", fontFamily: FONTS.bodyBold },
});

type FanPulseTicket = {
  id: string;
  sourceTag: string;
  question: string;
  context: string;
  options: [string, string];
  miniContext: string[];
  receiptContext: string;
  projectionNote: string;
  accentColor: string;
  icon: string;
  game?: Game;
  article?: NewsArticle;
};

function getPulseClock(game: Game) {
  return [game.quarter, game.timeRemaining].filter(Boolean).join(" ");
}

function getPulseScore(game: Game) {
  if (game.homeScore == null || game.awayScore == null) {
    return `${getTeamAbbr(game.awayTeam)} at ${getTeamAbbr(game.homeTeam)}`;
  }
  return `${getTeamAbbr(game.awayTeam)} ${game.awayScore} - ${getTeamAbbr(game.homeTeam)} ${game.homeScore}`;
}

function getPulseLeadLine(game: Game) {
  if (game.homeScore == null || game.awayScore == null) return null;
  const diff = Math.abs(game.homeScore - game.awayScore);
  if (diff === 0) return "Tied";
  const leader = game.homeScore > game.awayScore ? game.homeTeam : game.awayTeam;
  return `${getTeamAbbr(leader)} up ${diff}`;
}

function formatPulseStartsAt(startTime: string) {
  return new Date(startTime).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function possessive(label: string) {
  return label.endsWith("s") ? `${label}'` : `${label}'s`;
}

function possessiveSubject(label: string) {
  return label.endsWith("s") ? `the ${possessive(label)}` : possessive(label);
}

function getHeadlineSubject(article: NewsArticle, league: string) {
  const teamSubject = article.teams[0] ? shortAthleteName(article.teams[0]) : null;
  const tagSubject = article.tags.find((tag) => /[A-Za-z]/.test(tag) && !article.leagues.includes(tag));
  const cleanedTitle = article.title
    .replace(/[“”"]/g, "")
    .replace(/['’]s\b/g, "")
    .replace(/^[A-Z]{2,6}:\s+/, "");
  const headlineMatch = cleanedTitle.match(/\b([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){0,2})\b/);
  const genericSubjects = new Set(["Report", "Sources", "Breaking", "The", "This", "What", "Why", "How", "NBA", "NFL", "MLB", "NHL"]);
  if (headlineMatch && !genericSubjects.has(headlineMatch[1])) return headlineMatch[1];
  return tagSubject || teamSubject || league;
}

function getArticlePulseContext(article: NewsArticle) {
  const age = formatArticleAge(article.publishedAt);
  return age ? `${article.title} · ${age}` : article.title;
}

type PulseProjectionMetric = {
  label: string;
  value: string;
  caption: string;
};

type PulseFanGroup = {
  label: string;
  side: string;
  percent: number;
};

type PulseDriver = {
  tone: "up" | "down" | "flat";
  text: string;
};

type PulseProjectionState = {
  pool: PulseProjectionMetric;
  publicSplit: PulseProjectionMetric;
  movement: PulseProjectionMetric;
  selectedPercent: number;
  otherPercent: number;
  delta: number;
  lockedAt: number;
  lineLabel: string;
  bars: number[];
  groups: PulseFanGroup[];
  drivers: PulseDriver[];
  responseLabel: string;
  note: string;
};

function getPulseProjectionState(post: FanPulseTicket, selected: string): PulseProjectionState {
  const otherSide = post.options.find((option) => option !== selected) ?? post.options[1];
  const clampPct = (value: number) => Math.max(39, Math.min(68, value));
  const makeState = ({
    selectedPercent,
    movement,
    lineLabel,
    bars,
    groups,
    drivers,
    note,
  }: {
    selectedPercent: number;
    movement: PulseProjectionMetric;
    lineLabel: string;
    bars: number[];
    groups: PulseFanGroup[];
    drivers: PulseDriver[];
    note: string;
  }): PulseProjectionState => {
    const afterVote = clampPct(selectedPercent + 1);
    return {
      pool: { label: "POOL", value: "1", caption: "local read" },
      publicSplit: { label: "MODE", value: "Sample", caption: "not public" },
      movement,
      selectedPercent: afterVote,
      otherPercent: 100 - afterVote,
      delta: afterVote - selectedPercent,
      lockedAt: selectedPercent,
      lineLabel,
      bars: [...bars.slice(0, 5), afterVote],
      groups,
      drivers,
      responseLabel: drivers[0]?.text ?? note,
      note,
    };
  };

  const fallback: PulseProjectionState = {
    pool: { label: "POOL", value: "1", caption: "local read" },
    publicSplit: { label: "MODE", value: "Sample", caption: "not public" },
    movement: { label: "MOVE", value: selected, caption: "your side" },
    selectedPercent: 52,
    otherPercent: 48,
    delta: 1,
    lockedAt: 51,
    lineLabel: "Local signal line",
    bars: [48, 50, 49, 51, 51, 52],
    groups: [
      { label: "Your read", side: selected, percent: 100 },
      { label: "Crowd", side: "Waiting", percent: 0 },
    ],
    drivers: [
      { tone: "flat", text: "Real fan movement unlocks when the voting backend is connected." },
      { tone: "up", text: `Your ${selected} read nudged the sample pulse.` },
    ],
    responseLabel: "Real fan movement unlocks when the voting backend is connected.",
    note: "Sample pulse only. Public fan projection is not live yet.",
  };

  if (post.game) {
    if (post.game.status === "live" && post.game.homeScore != null && post.game.awayScore != null) {
      const diff = Math.abs(post.game.homeScore - post.game.awayScore);
      const leadLine = getPulseLeadLine(post.game) ?? "Tied";
      const basePct = diff === 0 ? 51 : clampPct(52 + diff * 2);
      const leader = post.game.homeScore > post.game.awayScore ? post.game.homeTeam : post.game.awayTeam;
      const trailer = post.game.homeScore > post.game.awayScore ? post.game.awayTeam : post.game.homeTeam;
      const selectedPercent = selected === "NO" ? 100 - basePct : basePct;
      return makeState({
        selectedPercent,
        movement: { label: "LIVE MOVE", value: diff === 0 ? "TIE" : `+${diff}`, caption: leadLine },
        lineLabel: "Sample fan projection",
        bars: diff === 0 ? [50, 51, 49, 51, selectedPercent] : [51, 53, Math.max(47, basePct - 4), Math.max(49, basePct - 2), selectedPercent],
        groups: [
          { label: `${shortAthleteName(leader)} fans`, side: selected === "NO" ? otherSide : selected, percent: clampPct(basePct + 8) },
          { label: `${shortAthleteName(trailer)} fans`, side: selected === "NO" ? selected : otherSide, percent: clampPct(100 - basePct + 7) },
          { label: `${post.game.league} neutrals`, side: selected, percent: selectedPercent },
        ],
        drivers: [
          { tone: diff === 0 ? "flat" : "up", text: diff === 0 ? "Game is tied, so the sample pulse stays balanced." : `${leadLine} is pushing the sample pulse toward the leader.` },
          { tone: "up", text: `Your ${selected} read moves the sample board by +1.` },
          { tone: "flat", text: "Live play-by-play drivers will replace this once event feed hooks are connected." },
        ],
        note: "Sample Pulse Board. Public fan groups and movement will become real once vote data is connected.",
      });
    }

    if (post.game.leaderboard?.length) {
      const leader = post.game.leaderboard[0];
      const basePct = 54;
      return makeState({
        selectedPercent: selected === "NO" ? 46 : basePct,
        movement: { label: "LEADER", value: leader.score || "--", caption: shortAthleteName(leader.name) },
        lineLabel: "Sample leaderboard pulse",
        bars: [49, 51, 50, 53, selected === "NO" ? 46 : basePct],
        groups: [
          { label: "Golf fans", side: selected, percent: selected === "NO" ? 46 : 54 },
          { label: "Leader watchers", side: selected === "NO" ? otherSide : selected, percent: 58 },
          { label: "Late movers", side: selected, percent: 52 },
        ],
        drivers: [
          { tone: "up", text: `${shortAthleteName(leader.name)} leads the board at ${leader.score || "the current mark"}.` },
          { tone: "up", text: `Your ${selected} read moves the sample board by +1.` },
        ],
        note: "Sample Pulse Board. Live fan projection unlocks with real reads.",
      });
    }

    if (post.game.status === "upcoming") {
      return makeState({
        selectedPercent: selected === "REAL" || selected === "YES" ? 53 : 47,
        movement: { label: "STARTS", value: formatPulseStartsAt(post.game.startTime), caption: "pregame clock" },
        lineLabel: "Sample pregame pulse",
        bars: [50, 50, 51, 52, selected === "REAL" || selected === "YES" ? 53 : 47],
        groups: [
          { label: `${shortAthleteName(post.game.homeTeam)} fans`, side: selected, percent: 57 },
          { label: `${shortAthleteName(post.game.awayTeam)} fans`, side: otherSide, percent: 55 },
          { label: "Neutrals", side: selected, percent: 52 },
        ],
        drivers: [
          { tone: "flat", text: `${getTeamAbbr(post.game.awayTeam)} at ${getTeamAbbr(post.game.homeTeam)} has not started yet.` },
          { tone: "up", text: `Your ${selected} read nudges the sample pregame pulse.` },
        ],
        note: "Sample Pulse Board. Pregame fan split appears after real reads are live.",
      });
    }

    return makeState({
      selectedPercent: selected === "REAL" ? 56 : 44,
      movement: { label: "STATUS", value: "Final", caption: getPulseScore(post.game) },
      lineLabel: "Sample postgame pulse",
      bars: [50, 52, 54, 55, selected === "REAL" ? 56 : 44],
      groups: [
        { label: "Winning side", side: selected === "REAL" ? selected : otherSide, percent: 62 },
        { label: "Losing side", side: selected, percent: selected === "REAL" ? 41 : 59 },
        { label: "Neutrals", side: selected, percent: selected === "REAL" ? 55 : 45 },
      ],
      drivers: [
        { tone: "up", text: `${getPulseScore(post.game)} anchors the postgame sample read.` },
        { tone: "up", text: `Your ${selected} read moved the sample board by +1.` },
      ],
      note: "Sample Pulse Board. Postgame crowd read unlocks with real vote data.",
    });
  }

  if (post.article) {
    const age = formatArticleAge(post.article.publishedAt) || "Now";
    const strongSide = selected === "SELLING" || selected === "REACH" || selected === "COLD" ? 47 : 55;
    return makeState({
      selectedPercent: strongSide,
      movement: { label: "STORY AGE", value: age, caption: post.article.source },
      lineLabel: "Sample story pulse",
      bars: [49, 51, 50, 53, strongSide],
      groups: [
        { label: post.article.teams[0] ? `${shortAthleteName(post.article.teams[0])} fans` : "Team fans", side: selected, percent: strongSide + 6 },
        { label: post.article.leagues[0] ? `${post.article.leagues[0]} neutrals` : "Neutrals", side: selected, percent: strongSide },
        { label: "Creators", side: selected, percent: strongSide - 2 },
      ],
      drivers: [
        { tone: "up", text: post.article.summary || post.article.title },
        { tone: "up", text: `Your ${selected} read moves the sample story pulse by +1.` },
        { tone: "flat", text: "Real reader movement will replace sample drivers later." },
      ],
      note: "Sample Pulse Board. Real story projection appears after backend reads are live.",
    });
  }

  return fallback;
}

function getFanPulseTicketForGame(game: Game, index: number): FanPulseTicket {
  const homeScore = game.homeScore ?? 0;
  const awayScore = game.awayScore ?? 0;
  const diff = Math.abs(homeScore - awayScore);
  const homeShort = shortAthleteName(game.homeTeam);
  const awayShort = shortAthleteName(game.awayTeam);
  const leaderTeam = homeScore > awayScore ? game.homeTeam : awayScore > homeScore ? game.awayTeam : game.homeTeam;
  const leaderShort = shortAthleteName(leaderTeam);
  const clock = getPulseClock(game);
  const score = getPulseScore(game);
  const leadLine = getPulseLeadLine(game);
  const accentColor = game.status === "live" ? C.live : FAN_PULSE_COLORS[index % FAN_PULSE_COLORS.length];

  if (game.leaderboard?.length) {
    const leader = game.leaderboard[0];
    const leaderName = shortAthleteName(leader.name);
    const eventName = game.eventTitle || game.circuitName || game.league;
    const context = [eventName, leader.score, game.round].filter(Boolean).join(" · ");
    return {
      id: `game-${game.id}`,
      sourceTag: `${game.league} · Leaderboard`,
      question: game.status === "finished" ? `Was ${leaderName} the right read?` : `Does ${leaderName} keep the lead?`,
      context,
      options: game.status === "finished" ? ["REAL", "REACH"] : ["YES", "NO"],
      miniContext: [
        eventName,
        `Leader: ${leader.name}${leader.score ? ` at ${leader.score}` : ""}.`,
        "Community projection waits for real fan reads.",
      ],
      receiptContext: game.status === "finished" ? "Post-event read saved from the final board." : "Golf read saved from the live leaderboard.",
      projectionNote: "Real fan projection will appear once voting is connected.",
      accentColor,
      icon: "golf-outline",
      game,
    };
  }

  if (game.status === "live") {
    const tied = diff === 0;
    return {
      id: `game-${game.id}`,
      sourceTag: `LIVE · ${game.league}`,
      question: tied ? "Who wins from here?" : `Will ${leaderShort} hold this lead?`,
      context: [clock, score, leadLine].filter(Boolean).join(" · "),
      options: tied ? [getTeamAbbr(game.awayTeam), getTeamAbbr(game.homeTeam)] : ["YES", "NO"],
      miniContext: [
        `${awayShort} vs ${homeShort}`,
        tied ? `${score}. Next momentum swing matters.` : `${leaderShort} leads by ${diff} ${getScoreUnit(game.league, diff)}.`,
        "Community projection waits for real fan reads.",
      ],
      receiptContext: tied
        ? `You picked a side with ${clock || "the game live"}.`
        : `You called ${leaderShort} with ${leadLine?.toLowerCase() || "the live lead"}.`,
      projectionNote: "No public percentage yet. This will unlock when real fans are voting.",
      accentColor,
      icon: "radio-outline",
      game,
    };
  }

  if (game.status === "upcoming") {
    const starts = formatPulseStartsAt(game.startTime);
    return {
      id: `game-${game.id}`,
      sourceTag: `${game.league} · Next`,
      question: `Does ${homeShort} win this matchup?`,
      context: `${getTeamAbbr(game.awayTeam)} at ${getTeamAbbr(game.homeTeam)} · ${starts}`,
      options: ["REAL", "REACH"],
      miniContext: [
        `${awayShort} at ${homeShort}`,
        game.venue || `Starts at ${starts}`,
        "Pregame projection waits for real fan reads.",
      ],
      receiptContext: `Pregame read saved for ${awayShort} at ${homeShort}.`,
      projectionNote: "Community projection will show after real pregame reads exist.",
      accentColor,
      icon: "time-outline",
      game,
    };
  }

  return {
    id: `game-${game.id}`,
    sourceTag: `${game.league} · Final`,
    question: `Was ${possessive(leaderShort)} win a real signal?`,
    context: score,
    options: ["REAL", "REACH"],
    miniContext: [
      `${awayShort} vs ${homeShort}`,
      score,
      "Postgame projection waits for real fan reads.",
    ],
    receiptContext: `Postgame read saved from ${score}.`,
    projectionNote: "Real fan projection will appear once voting is connected.",
    accentColor,
    icon: "checkmark-circle-outline",
    game,
  };
}

function getFanPulseTicketForArticle(article: NewsArticle, index: number): FanPulseTicket {
  const topic = getArticleTopic(article);
  const league = article.leagues[0] ?? topic?.label ?? "Sports";
  const text = `${article.title} ${article.summary ?? ""}`.toLowerCase();
  const isPlayerWatch = /judge|heater|homer|hr|points|goals|touchdown|streak|mvp/i.test(text);
  const isMove = /trade|deal|signing|contract|move|extension/i.test(text);
  const isInjury = /injury|injured|out|return|questionable/i.test(text);
  const isPlayoff = /playoff|postseason|seed|race|standings|finals|wild card/i.test(text);
  const isTrend = /stun|beat|beats|win|wins|surge|run|streak|hot|heater|statement|breakout/i.test(text);
  const headlineSubject = getHeadlineSubject(article, league);
  const teamSubject = article.teams[0] ? shortAthleteName(article.teams[0]) : null;
  const subject = isPlayerWatch ? headlineSubject : teamSubject || headlineSubject;
  const sourceTag = isPlayerWatch
    ? `${league} · Player Watch`
    : isMove
      ? `${league} · Storyline`
      : isInjury
        ? `${league} · Availability`
        : isPlayoff
          ? `${league} · Race`
          : `${league} · Story`;
  const options: [string, string] = isPlayerWatch
    ? ["HOT", "COLD"]
    : isMove || isInjury || isPlayoff
      ? ["REAL", "REACH"]
      : ["BUYING", "SELLING"];
  const question = isPlayerWatch
    ? `Is ${subject} still hot?`
    : isMove
      ? `Does ${possessiveSubject(subject)} move change the race?`
      : isInjury
        ? `Does ${possessiveSubject(subject)} status swing the matchup?`
        : isPlayoff
          ? `Is ${possessiveSubject(subject)} playoff signal real?`
          : subject === league
            ? `Is this ${league} story worth buying?`
            : isTrend
              ? `Is ${possessiveSubject(subject)} run worth buying?`
              : `Is ${possessiveSubject(subject)} story worth buying?`;
  const context = getArticlePulseContext(article);

  return {
    id: `article-${article.id}`,
    sourceTag,
    question,
    context,
    options,
    miniContext: [
      article.title,
      article.summary || "Full story is available.",
      "Community projection waits for real fan reads.",
    ],
    receiptContext: `Story read saved from ${article.source}${formatArticleAge(article.publishedAt) ? ` · ${formatArticleAge(article.publishedAt)}` : ""}.`,
    projectionNote: "No fake crowd split. Real projection appears after backend reads are live.",
    accentColor: topic?.color ?? FAN_PULSE_COLORS[index % FAN_PULSE_COLORS.length],
    icon: "newspaper-outline",
    article,
  };
}

function buildFanPulsePosts(allGames: Game[], articles: NewsArticle[], myTeams: string[]) {
  const gameTickets = [...allGames]
    .filter((game) => game.status === "live" || myTeams.includes(game.homeTeam) || myTeams.includes(game.awayTeam))
    .sort((a, b) => rankGameMoment(b, myTeams) - rankGameMoment(a, myTeams))
    .slice(0, 3)
    .map((game, index) => getFanPulseTicketForGame(game, index));

  const teamStoryTickets = articles
    .filter((article) => myTeams.length === 0 || article.teams.some((team) => myTeams.includes(team)))
    .slice(0, Math.max(0, 3 - gameTickets.length))
    .map((article, index) => getFanPulseTicketForArticle(article, gameTickets.length + index));

  const fallbackStoryTickets = articles
    .filter((article) => !teamStoryTickets.some((ticket) => ticket.article?.id === article.id))
    .slice(0, Math.max(0, 3 - gameTickets.length - teamStoryTickets.length))
    .map((article, index) => getFanPulseTicketForArticle(article, gameTickets.length + teamStoryTickets.length + index));

  return [...gameTickets, ...teamStoryTickets, ...fallbackStoryTickets].slice(0, 3);
}

function FanPulseSection({
  allGames,
  articles,
  myTeams,
  screenWidth,
  onGamePress,
  onArticlePress,
}: {
  allGames: Game[];
  articles: NewsArticle[];
  myTeams: string[];
  screenWidth: number;
  onGamePress: (game: Game) => void;
  onArticlePress: (article: NewsArticle) => void;
}) {
  const posts = useMemo(() => buildFanPulsePosts(allGames, articles, myTeams), [allGames, articles, myTeams]);
  const [selectedByPrompt, setSelectedByPrompt] = useState<Record<string, string>>({});
  const [expandedTicketId, setExpandedTicketId] = useState<string | null>(null);
  const fanCardWidth = Math.max(236, Math.min(286, screenWidth - 56));

  if (posts.length === 0) {
    return (
      <View style={cultureStyles.wrap}>
        <CultureSectionHeader icon="pulse-outline" title="FAN PULSE" actionLabel="Make the call." color={C.accentTeal} />
        <View style={cultureStyles.emptyCard}>
          <Ionicons name="chatbubbles-outline" size={22} color={C.textTertiary} />
          <Text style={cultureStyles.emptyText}>Fan reads will appear when there is a live game, followed team, or real story to call.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={cultureStyles.wrap}>
      <CultureSectionHeader icon="pulse-outline" title="FAN PULSE" actionLabel="Make the call." color={C.accentTeal} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={cultureStyles.track}>
        {posts.map((post) => {
          const selected = selectedByPrompt[post.id];
          const accent = post.accentColor;
          const isExpanded = expandedTicketId === post.id;
          const projection = selected ? getPulseProjectionState(post, selected) : null;
          const otherOption = selected ? post.options.find((option) => option !== selected) ?? "Other side" : null;
          const openTarget = () => {
            if (post.game) onGamePress(post.game);
            if (post.article) onArticlePress(post.article);
          };
          return (
            <View key={post.id} style={[cultureStyles.fanCard, { width: fanCardWidth }]}>
              <View style={cultureStyles.cardTop}>
                <View style={[cultureStyles.kickerPill, { backgroundColor: `${accent}18`, borderColor: `${accent}42` }]}>
                  <Ionicons name={post.icon as any} size={13} color={accent} />
                  <Text style={[cultureStyles.kickerText, { color: accent }]}>{post.sourceTag.toUpperCase()}</Text>
                </View>
                <Pressable accessibilityRole="button" accessibilityLabel="Show context" onPress={() => setExpandedTicketId(isExpanded ? null : post.id)} onLongPress={() => setExpandedTicketId(post.id)} hitSlop={8}>
                  <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={16} color={C.textTertiary} />
                </Pressable>
              </View>

              <Text style={cultureStyles.promptText} numberOfLines={2}>{post.question}</Text>
              <Text style={cultureStyles.contextLine} numberOfLines={selected || isExpanded ? 1 : 2}>{post.context}</Text>

              {isExpanded && !selected ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={post.game ? `Open ${post.game.awayTeam} at ${post.game.homeTeam}` : post.article ? `Open story: ${post.article.title}` : "Open source"}
                  onPress={openTarget}
                  style={({ pressed }) => [cultureStyles.fanContextPeek, pressed && cultureStyles.pressed]}
                >
                  {post.miniContext.slice(0, 2).map((line, index) => (
                    <Text key={`${post.id}-context-${index}`} style={cultureStyles.contextPeekText} numberOfLines={1}>{line}</Text>
                  ))}
                  <View style={cultureStyles.contextSourceRow}>
                    <Text style={cultureStyles.contextSourceText}>Open source</Text>
                    <Ionicons name="chevron-forward" size={13} color={C.textTertiary} />
                  </View>
                </Pressable>
              ) : null}

              <View style={cultureStyles.optionGrid}>
                {post.options.map((option) => {
                  const isSelected = selected === option;
                  return (
                    <Pressable
                      key={option}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSelected }}
                      accessibilityLabel={`${option}. ${isSelected ? "Read locked" : "Lock read"}`}
                      onPress={() => {
                        setExpandedTicketId(null);
                        setSelectedByPrompt((current) => ({ ...current, [post.id]: option }));
                      }}
                      style={({ pressed }) => [
                        cultureStyles.optionChip,
                        isSelected && { backgroundColor: `${accent}24`, borderColor: accent },
                        pressed && cultureStyles.pressed,
                      ]}
                    >
                      <Text style={[cultureStyles.optionText, isSelected && { color: C.text }]} numberOfLines={1}>{option}</Text>
                    </Pressable>
                  );
                })}
              </View>

              {selected && projection ? (
                <View style={[cultureStyles.readReceipt, { borderColor: `${accent}46`, backgroundColor: `${accent}12` }]}>
                  <View style={cultureStyles.receiptTop}>
                    <View style={cultureStyles.receiptTitle}>
                      <Ionicons name="checkmark-circle" size={15} color={accent} />
                      <Text style={cultureStyles.receiptTitleText} numberOfLines={1}>{selected} locked</Text>
                    </View>
                    <Text style={[cultureStyles.receiptBadge, { color: accent }]}>LOCAL SAMPLE</Text>
                  </View>
                  <View style={cultureStyles.compactPulseRow}>
                    <View style={cultureStyles.compactPulseSide}>
                      <Text style={[cultureStyles.compactPulsePercent, { color: accent }]}>{projection.selectedPercent}%</Text>
                      <Text style={cultureStyles.compactPulseLabel} numberOfLines={1}>{selected}</Text>
                    </View>
                    <View style={cultureStyles.compactPulseMiddle}>
                      <View style={cultureStyles.splitTrack}>
                        <View style={[cultureStyles.splitFill, { flex: projection.selectedPercent, backgroundColor: accent }]} />
                        <View style={[cultureStyles.splitFill, { flex: projection.otherPercent, backgroundColor: `${accent}36` }]} />
                      </View>
                      <Text style={cultureStyles.compactPulseMetaText} numberOfLines={1}>{projection.responseLabel}</Text>
                    </View>
                    <View style={cultureStyles.compactPulseSide}>
                      <Text style={cultureStyles.compactOtherPercent}>{projection.otherPercent}%</Text>
                      <Text style={cultureStyles.compactPulseLabel} numberOfLines={1}>{otherOption}</Text>
                    </View>
                  </View>
                </View>
              ) : null}

              {!selected ? (
                <View style={cultureStyles.cardFooter}>
                  <View style={cultureStyles.footerLeft}>
                    <Ionicons name="finger-print-outline" size={14} color={C.textTertiary} />
                    <Text style={cultureStyles.footerText}>Tap to lock a read</Text>
                  </View>
                  <Ionicons name="arrow-forward" size={15} color={C.textTertiary} />
                </View>
              ) : null}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

function CreatorSpotlightSection({ screenWidth }: { screenWidth: number }) {
  const creators = getCreatorPreviews("home", { limit: 4 });
  const creatorCardWidth = Math.max(250, Math.min(282, screenWidth - 56));

  if (creators.length === 0) {
    return (
      <View style={cultureStyles.wrap}>
        <CultureSectionHeader icon="radio-outline" title="CREATOR SPOTLIGHT" actionLabel="Preview" color={C.accentGold} />
        <View style={cultureStyles.emptyCard}>
          <Ionicons name="mic-outline" size={22} color={C.textTertiary} />
          <Text style={cultureStyles.emptyText}>Creator programming will show here when there is a verified segment to feature.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={cultureStyles.wrap}>
      <CultureSectionHeader icon="radio-outline" title="CREATOR SPOTLIGHT" actionLabel="Pilot slate" color={C.accentGold} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={cultureStyles.track}>
        {creators.map((creator, index) => {
          const accent = CREATOR_COLORS[index % CREATOR_COLORS.length];
          const initials = creator.name
            .split(" ")
            .map((part) => part[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();

          return (
            <View key={creator.id} style={[cultureStyles.creatorCard, { width: creatorCardWidth }]}>
              <View style={cultureStyles.creatorTop}>
                <View style={[cultureStyles.creatorAvatar, { backgroundColor: `${accent}24`, borderColor: `${accent}66` }]}>
                  <Text style={[cultureStyles.creatorInitials, { color: accent }]}>{initials}</Text>
                </View>
                <View style={cultureStyles.creatorMeta}>
                  <Text style={cultureStyles.creatorName} numberOfLines={1}>{creator.name}</Text>
                  <Text style={cultureStyles.creatorRole} numberOfLines={1}>{creator.handle} · {creator.role}</Text>
                </View>
                <View style={cultureStyles.previewBadge}>
                  <Text style={cultureStyles.previewBadgeText}>Pilot</Text>
                </View>
              </View>

              <View style={cultureStyles.creatorFormatRow}>
                <Text style={[cultureStyles.creatorTopic, { color: accent }]} numberOfLines={1}>{creator.topic}</Text>
                <View style={cultureStyles.creatorSlotPill}>
                  <Ionicons name="calendar-outline" size={12} color={C.textTertiary} />
                  <Text style={cultureStyles.creatorSlotText}>Weekly</Text>
                </View>
              </View>
              <Text style={cultureStyles.creatorTake} numberOfLines={3}>{creator.take}</Text>

              <View style={cultureStyles.cardFooter}>
                <View style={cultureStyles.footerLeft}>
                  <Ionicons name="document-text-outline" size={14} color={C.textTertiary} />
                  <Text style={cultureStyles.footerText}>{creator.disclosure}</Text>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

function CultureSectionHeader({
  icon,
  title,
  actionLabel,
  color,
}: {
  icon: string;
  title: string;
  actionLabel: string;
  color: string;
}) {
  return (
    <View style={cultureStyles.header}>
      <View style={cultureStyles.headerTitle}>
        <Ionicons name={icon as any} size={16} color={color} />
        <Text style={cultureStyles.headerText}>{title}</Text>
      </View>
      <Text style={[cultureStyles.headerAction, { color }]}>{actionLabel}</Text>
    </View>
  );
}

const FAN_PULSE_COLORS = [C.accentTeal, C.accentGold, C.accentBlue, C.error];
const CREATOR_COLORS = [C.accentGold, C.accentTeal, C.accentBlue, C.accentOrange];

const cultureStyles = StyleSheet.create({
  wrap: { gap: 12 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  headerTitle: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerText: { color: C.text, fontSize: 14, fontWeight: "900", fontFamily: FONTS.bodyHeavy, letterSpacing: 0.5 },
  headerAction: { fontSize: 12, fontWeight: "800", fontFamily: FONTS.bodyBold },
  track: { gap: 12, paddingRight: 16 },
  fanCard: {
    height: 222,
    padding: 12,
    borderRadius: 16,
    backgroundColor: C.cardElevated,
    borderWidth: 1,
    borderColor: C.cardBorderActive,
    gap: 7,
  },
  creatorCard: {
    minHeight: 176,
    padding: 14,
    borderRadius: 18,
    backgroundColor: C.cardWarm,
    borderWidth: 1,
    borderColor: C.cardBorderActive,
    gap: 12,
  },
  pressed: { opacity: 0.82 },
  cardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  kickerPill: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 28,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  kickerText: { flex: 1, minWidth: 0, fontSize: 10, fontWeight: "900", fontFamily: FONTS.bodyBold, letterSpacing: 0.5 },
  promptText: { color: C.text, fontSize: 15, lineHeight: 19, fontWeight: "900", fontFamily: FONTS.bodyHeavy },
  contextLine: { color: C.textSecondary, fontSize: 11, lineHeight: 15, fontWeight: "800", fontFamily: FONTS.bodyBold },
  fanContextPeek: {
    maxHeight: 54,
    gap: 4,
    padding: 8,
    borderRadius: 12,
    backgroundColor: C.glassLight,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  contextPeekText: { color: C.textSecondary, fontSize: 10, lineHeight: 13, fontWeight: "700", fontFamily: FONTS.bodyMedium },
  contextSourceRow: { flexDirection: "row", alignItems: "center", gap: 4, paddingTop: 2 },
  contextSourceText: { color: C.text, fontSize: 11, fontWeight: "900", fontFamily: FONTS.bodyBold },
  readReceipt: {
    gap: 5,
    padding: 7,
    borderRadius: 12,
    borderWidth: 1,
  },
  receiptTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  receiptTitle: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: 6 },
  receiptTitleText: { flex: 1, color: C.text, fontSize: 12, fontWeight: "900", fontFamily: FONTS.bodyBold },
  receiptBadge: { fontSize: 9, fontWeight: "900", fontFamily: FONTS.bodyBold, letterSpacing: 0.5 },
  receiptContext: { color: C.textSecondary, fontSize: 11, lineHeight: 15, fontWeight: "700", fontFamily: FONTS.bodyMedium },
  marketPanel: {
    gap: 7,
    padding: 8,
    borderRadius: 12,
    backgroundColor: C.glassLight,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  marketTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  projectionTitle: { flexDirection: "row", alignItems: "center", gap: 5 },
  projectionLabel: { color: C.textSecondary, fontSize: 10, fontWeight: "900", fontFamily: FONTS.bodyBold },
  marketStatus: { fontSize: 9, fontWeight: "900", fontFamily: FONTS.bodyBold, letterSpacing: 0.5 },
  compactPulseRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  compactPulseSide: { width: 40, gap: 1 },
  compactPulsePercent: { fontSize: 16, lineHeight: 18, fontWeight: "900", fontFamily: FONTS.display },
  compactOtherPercent: { color: C.textSecondary, fontSize: 16, lineHeight: 18, fontWeight: "900", fontFamily: FONTS.display },
  compactPulseLabel: { color: C.textTertiary, fontSize: 9, fontWeight: "900", fontFamily: FONTS.bodyBold },
  compactPulseMiddle: { flex: 1, minWidth: 0, gap: 4 },
  compactPulseMeta: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  compactPulseMetaText: { flex: 1, color: C.textSecondary, fontSize: 10, fontWeight: "800", fontFamily: FONTS.bodyBold },
  compactPulseMove: { fontSize: 10, fontWeight: "900", fontFamily: FONTS.bodyBold },
  projectionHero: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    paddingVertical: 2,
  },
  projectionHeroMain: { flex: 1, minWidth: 0, gap: 1 },
  projectionPercent: { fontSize: 31, lineHeight: 34, fontWeight: "900", fontFamily: FONTS.display },
  projectionHeroLabel: { color: C.textSecondary, fontSize: 11, fontWeight: "900", fontFamily: FONTS.bodyBold },
  projectionDelta: {
    minWidth: 66,
    alignItems: "center",
    justifyContent: "center",
    gap: 1,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: C.glassLight,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  projectionDeltaText: { fontSize: 14, fontWeight: "900", fontFamily: FONTS.bodyHeavy },
  projectionDeltaSub: { color: C.textTertiary, fontSize: 8, fontWeight: "900", fontFamily: FONTS.bodyBold },
  splitTrack: {
    height: 7,
    flexDirection: "row",
    overflow: "hidden",
    borderRadius: 999,
    backgroundColor: C.glassLight,
  },
  splitFill: { height: "100%" },
  splitLabels: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  splitLabel: { color: C.textTertiary, fontSize: 9, fontWeight: "900", fontFamily: FONTS.bodyBold },
  marketMetrics: { flexDirection: "row", gap: 6 },
  marketMetric: {
    flex: 1,
    minHeight: 54,
    justifyContent: "center",
    gap: 1,
    paddingHorizontal: 7,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: C.glassLight,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  marketMetricLabel: { color: C.textTertiary, fontSize: 8, fontWeight: "900", fontFamily: FONTS.bodyBold, letterSpacing: 0.4 },
  marketMetricValue: { color: C.text, fontSize: 15, fontWeight: "900", fontFamily: FONTS.display },
  marketMetricCaption: { color: C.textTertiary, fontSize: 9, fontWeight: "800", fontFamily: FONTS.bodyBold },
  marketLineWrap: { gap: 6 },
  marketLineHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  marketLineLabel: { color: C.textSecondary, fontSize: 10, fontWeight: "900", fontFamily: FONTS.bodyBold },
  marketLineSide: { color: C.textTertiary, fontSize: 10, fontWeight: "900", fontFamily: FONTS.bodyBold },
  marketBars: {
    height: 40,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 5,
    paddingHorizontal: 6,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: C.glassLight,
  },
  marketBar: {
    flex: 1,
    minHeight: 10,
    borderRadius: 999,
  },
  pulseBoardBlock: {
    gap: 6,
    padding: 8,
    borderRadius: 12,
    backgroundColor: C.glassLight,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  pulseBoardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  pulseBoardTitle: { color: C.text, fontSize: 11, fontWeight: "900", fontFamily: FONTS.bodyHeavy },
  pulseBoardHint: { color: C.textTertiary, fontSize: 9, fontWeight: "900", fontFamily: FONTS.bodyBold },
  fanGroupRow: { minHeight: 22, flexDirection: "row", alignItems: "center", gap: 7 },
  fanGroupName: { width: 82, color: C.textSecondary, fontSize: 10, fontWeight: "800", fontFamily: FONTS.bodyBold },
  fanGroupMeter: {
    flex: 1,
    height: 6,
    overflow: "hidden",
    borderRadius: 999,
    backgroundColor: C.glassLight,
  },
  fanGroupFill: { height: "100%", borderRadius: 999 },
  fanGroupValue: { width: 70, color: C.text, fontSize: 10, fontWeight: "900", fontFamily: FONTS.bodyBold, textAlign: "right" },
  driverRow: { flexDirection: "row", alignItems: "flex-start", gap: 6 },
  driverText: { flex: 1, color: C.textSecondary, fontSize: 10, lineHeight: 14, fontWeight: "700", fontFamily: FONTS.bodyMedium },
  lockedLine: { color: C.text, fontSize: 10, fontWeight: "900", fontFamily: FONTS.bodyBold },
  projectionChoiceRow: { flexDirection: "row", gap: 6 },
  projectionChoice: {
    flex: 1,
    minHeight: 26,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.cardBorder,
    backgroundColor: C.glassLight,
  },
  projectionChoiceText: { color: C.textTertiary, fontSize: 10, fontWeight: "900", fontFamily: FONTS.bodyBold },
  projectionNote: { color: C.textTertiary, fontSize: 10, lineHeight: 14, fontWeight: "700", fontFamily: FONTS.bodyMedium },
  optionGrid: { flexDirection: "row", gap: 8 },
  optionChip: {
    flex: 1,
    minHeight: 30,
    maxWidth: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: C.glassLight,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  optionText: { color: C.textSecondary, fontSize: 11, fontWeight: "800", fontFamily: FONTS.bodyBold },
  cardFooter: {
    marginTop: "auto",
    minHeight: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  footerLeft: { flexDirection: "row", alignItems: "center", gap: 5, flex: 1 },
  footerText: { color: C.textSecondary, fontSize: 12, fontWeight: "700", fontFamily: FONTS.bodyMedium },
  creatorTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  creatorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  creatorInitials: { fontSize: 15, fontWeight: "900", fontFamily: FONTS.bodyHeavy },
  creatorMeta: { flex: 1, gap: 2 },
  creatorName: { color: C.text, fontSize: 15, fontWeight: "900", fontFamily: FONTS.bodyHeavy },
  creatorRole: { color: C.textSecondary, fontSize: 12, fontWeight: "700", fontFamily: FONTS.bodyMedium },
  previewBadge: {
    minHeight: 28,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: C.glassLight,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  previewBadgeText: { color: C.textSecondary, fontSize: 10, fontWeight: "900", fontFamily: FONTS.bodyBold },
  creatorFormatRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  creatorTopic: { flex: 1, fontSize: 12, fontWeight: "900", fontFamily: FONTS.bodyBold, letterSpacing: 0.3 },
  creatorSlotPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    minHeight: 26,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: C.glassLight,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  creatorSlotText: { color: C.textSecondary, fontSize: 10, fontWeight: "900", fontFamily: FONTS.bodyBold },
  creatorTake: { color: C.text, fontSize: 14, lineHeight: 19, fontWeight: "800", fontFamily: FONTS.bodyHeavy },
  emptyCard: {
    minHeight: 104,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 16,
    borderRadius: 18,
    backgroundColor: C.cardElevated,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  emptyText: { color: C.textSecondary, fontSize: 13, fontFamily: FONTS.bodyMedium, textAlign: "center" },
});

function MyTeamsStrip({ myTeams, allGames }: { myTeams: string[]; allGames: Game[] }) {
  const hasTeams = myTeams.length > 0;
  return (
    <View style={tileStyles.wrap}>
      <View style={tileStyles.header}>
        <View style={tileStyles.headerTitle}>
          <Ionicons name="heart" size={15} color={C.accent} />
          <Text style={tileStyles.headerText}>MY TEAMS</Text>
        </View>
        <Pressable accessibilityRole="button" onPress={() => router.push("/(tabs)/profile" as any)} hitSlop={10}>
          <Text style={tileStyles.editText}>{hasTeams ? "Edit" : "Add"}</Text>
        </Pressable>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={tileStyles.track}>
        {myTeams.map(team => {
          const teamGames = allGames.filter(g => g.homeTeam === team || g.awayTeam === team);
          const live = teamGames.find(g => g.status === "live");
          const next = teamGames.find(g => g.status === "upcoming");
          const last = teamGames.find(g => g.status === "finished");
          const featured = live ?? next ?? last;
          const league = featured?.league ?? ALL_TEAMS.find(t => t.name === team)?.league ?? "NBA";
          const color = getLeagueColor(league);
          const abbr = team.split(" ").slice(-1)[0].substring(0, 3).toUpperCase();
          let statusLine = "";
          let statusColor = C.textTertiary;
          if (live) {
            statusLine = "● LIVE";
            statusColor = C.live;
          } else if (next) {
            const d = new Date(next.startTime);
            statusLine = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
          } else if (last) {
            const isHome = last.homeTeam === team;
            const my = isHome ? last.homeScore : last.awayScore;
            const opp = isHome ? last.awayScore : last.homeScore;
            const won = (my ?? 0) > (opp ?? 0);
            statusLine = `${won ? "W" : "L"} ${my}–${opp}`;
            statusColor = won ? C.accentGreen : C.live;
          }
          const logoUri =
            featured
              ? (featured.homeTeam === team ? featured.homeTeamLogo : featured.awayTeamLogo)
              : allGames.find(g => g.homeTeam === team)?.homeTeamLogo
                ?? allGames.find(g => g.awayTeam === team)?.awayTeamLogo
                ?? getTeamEspnLogoUrl(team, league);
          return (
            <Pressable
              key={team}
              accessibilityRole="button"
              accessibilityLabel={`Open ${team}`}
              onPress={() => goToTeam(team, league)}
              style={({ pressed }) => [tileStyles.tile, pressed && tileStyles.tilePressed]}
            >
              <TeamLogo uri={logoUri} name={team} size={60} borderColor={`${color}55`} />
              <Text style={tileStyles.teamShort} numberOfLines={1}>{abbr}</Text>
              {statusLine ? (
                <Text style={[tileStyles.status, { color: statusColor }]} numberOfLines={1}>{statusLine}</Text>
              ) : null}
            </Pressable>
          );
        })}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add a team"
          onPress={() => router.push("/(tabs)/profile" as any)}
          style={({ pressed }) => [tileStyles.addTile, pressed && tileStyles.tilePressed]}
        >
          <View style={tileStyles.addCircle}>
            <Ionicons name="add" size={28} color={C.textSecondary} />
          </View>
          <Text style={tileStyles.addText}>Add Team</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const tileStyles = StyleSheet.create({
  wrap: { gap: 12 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  headerTitle: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerText: { color: C.text, fontSize: 14, fontWeight: "900", fontFamily: FONTS.bodyHeavy, letterSpacing: 0.5 },
  editText: { color: C.accentBlue, fontSize: 12, fontWeight: "800", fontFamily: FONTS.bodyBold },
  track: { gap: 16, paddingRight: 16 },
  tile: { alignItems: "center", gap: 6, width: 78, minHeight: 110 },
  tilePressed: { opacity: 0.76 },
  teamShort: { color: C.text, fontSize: 12, fontWeight: "900", fontFamily: FONTS.bodyHeavy },
  status: { fontSize: 10, fontWeight: "900", textAlign: "center", fontFamily: FONTS.bodyBold },
  addTile: { alignItems: "center", gap: 6, width: 84, minHeight: 110 },
  addCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: C.textTertiary,
    backgroundColor: C.glassLight,
  },
  addText: { color: C.textSecondary, fontSize: 11, fontWeight: "800", fontFamily: FONTS.bodyBold },
});

function SportTab({ sport, active, liveCount, totalCount, onPress }: {
  sport: SportKey; active: boolean; liveCount: number; totalCount: number; onPress: () => void;
}) {
  const color = SPORT_COLOR[sport];
  return (
    <Pressable onPress={onPress} style={[tabStyles.tab, active && { backgroundColor: color, borderColor: color }]}>
      <Text style={[tabStyles.label, active && { color: "#fff" }]}>{sport}</Text>
      {liveCount > 0 && (
        <View style={[tabStyles.liveBubble, active && { backgroundColor: "rgba(255,255,255,0.3)" }]}>
          <Text style={[tabStyles.liveBubbleText, active && { color: "#fff" }]}>{liveCount} LIVE</Text>
        </View>
      )}
      {liveCount === 0 && totalCount > 0 && (
        <Text style={[tabStyles.count, active && { color: "rgba(255,255,255,0.7)" }]}>{totalCount}</Text>
      )}
    </Pressable>
  );
}

const tabStyles = StyleSheet.create({
  tab: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 15, paddingVertical: 8,
    borderRadius: 22, borderWidth: 1.5, borderColor: C.cardBorder, backgroundColor: C.card,
  },
  label: { fontSize: 13, fontWeight: "800", color: C.textSecondary, letterSpacing: 0.3 },
  liveBubble: { backgroundColor: "rgba(239,120,40,0.15)", borderRadius: 8, paddingHorizontal: 5, paddingVertical: 1 },
  liveBubbleText: { fontSize: 9, fontWeight: "900", color: C.live, letterSpacing: 0.5 },
  count: { fontSize: 11, fontWeight: "600", color: C.textTertiary },
});

function isCuratedGame(game: Game): boolean {
  if (game.status === "live") {
    const diff = Math.abs((game.homeScore ?? 0) - (game.awayScore ?? 0));
    if (diff <= 5) return true;
    const period = (game.quarter ?? "").toLowerCase();
    if (/\b(?:ot|overtime)\b/i.test(period)) return true;
  }
  if (game.status === "upcoming") {
    const title = `${game.homeTeam} ${game.awayTeam}`.toLowerCase();
    const rivalryWords = ["rivalry", "derby", "classic"];
    if (rivalryWords.some(w => title.includes(w))) return true;
  }
  return false;
}

function CuratedBadge() {
  return (
    <View style={curatedStyles.badge}>
      <Ionicons name="star" size={9} color={C.accentGold} />
      <Text style={curatedStyles.badgeText}>PICK</Text>
    </View>
  );
}

const curatedStyles = StyleSheet.create({
  badge: {
    position: "absolute", top: 8, right: 8, zIndex: 2,
    flexDirection: "row", alignItems: "center", gap: 3,
    backgroundColor: `${C.accentGold}22`, paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 6, borderWidth: 1, borderColor: `${C.accentGold}40`,
  },
  badgeText: { color: C.accentGold, fontSize: 8, fontWeight: "900", letterSpacing: 0.5 },
});

function TodaysGamesWidget({ allGames, myTeams, onGamePress, isLoading, isError, onRetry }: {
  allGames: Game[]; myTeams: string[]; onGamePress: (g: Game) => void;
  isLoading: boolean; isError: boolean; onRetry: () => void;
}) {
  const getDefaultSport = useCallback((): SportKey => {
    for (const s of SPORTS) {
      if (allGames.some(g => g.league === s && g.status === "live")) return s;
    }
    for (const s of SPORTS) {
      if (allGames.some(g => g.league === s)) return s;
    }
    return "NBA";
  }, [allGames]);
  const [activeSport, setActiveSport] = useState<SportKey>("NBA");
  const userSelected = useRef(false);
  useEffect(() => {
    if (!userSelected.current && allGames.length > 0) {
      setActiveSport(getDefaultSport());
    }
  }, [allGames, getDefaultSport]);
  const handleSportPress = (s: SportKey) => {
    userSelected.current = true;
    setActiveSport(s);
  };
  const sportGames = allGames.filter(g => g.league === activeSport);
  const favGames = sortByStatus(sportGames.filter(g => myTeams.includes(g.homeTeam) || myTeams.includes(g.awayTeam)));
  const favSet = new Set(favGames.map(g => g.id));
  const otherGames = sortByStatus(sportGames.filter(g => !favSet.has(g.id)));
  const sportColor = SPORT_COLOR[activeSport];

  return (
    <View style={{ gap: 0 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 14, paddingRight: 4 }}>
        {SPORTS.map(s => (
          <SportTab key={s} sport={s} active={s === activeSport}
            liveCount={allGames.filter(g => g.league === s && g.status === "live").length}
            totalCount={allGames.filter(g => g.league === s).length}
            onPress={() => handleSportPress(s)} />
        ))}
      </ScrollView>
      {isLoading ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 20 }}>
          {[1, 2, 3].map(i => <View key={i} style={{ width: 170 }}><GameCardSkeleton /></View>)}
        </ScrollView>
      ) : isError ? (
        <Pressable style={widgetStyles.emptyCard} onPress={onRetry}>
          <Ionicons name="wifi-outline" size={32} color={C.textTertiary} />
          <Text style={widgetStyles.emptyText}>Couldn't load games · Tap to retry</Text>
        </Pressable>
      ) : sportGames.length === 0 ? (
        <View style={widgetStyles.emptyCard}>
          <Ionicons name="calendar-outline" size={28} color={C.textTertiary} />
          <Text style={widgetStyles.emptyText}>No {activeSport} games today</Text>
        </View>
      ) : (
        <View style={{ gap: 14 }}>
          {favGames.length > 0 && (
            <View style={{ gap: 8 }}>
              <View style={widgetStyles.groupedList}>
                {favGames.map((g, idx) => (
                  <View key={g.id}>
                    {idx > 0 && <View style={widgetStyles.rowDivider} />}
                    <View>
                      {(() => {
                        const ctx = getGameContext(g, myTeams);
                        return ctx ? (
                          <View style={widgetStyles.contextBanner}>
                            <Text style={widgetStyles.contextText}>{ctx}</Text>
                          </View>
                        ) : null;
                      })()}
                      <GameCard game={g} isFavorite grouped onPress={() => onGamePress(g)} />
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}
          {otherGames.length > 0 && (
            <FlatList horizontal data={otherGames.slice(0, 6)} keyExtractor={g => g.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 12, paddingRight: 20 }}
              renderItem={({ item }) => (
                <View style={{ width: 172 }}>
                  {isCuratedGame(item) && <CuratedBadge />}
                  <GameCard game={item} variant="compact"
                    isFavorite={myTeams.includes(item.homeTeam) || myTeams.includes(item.awayTeam)}
                    onPress={() => onGamePress(item)} />
                </View>
              )} />
          )}
        </View>
      )}
    </View>
  );
}

const widgetStyles = StyleSheet.create({
  emptyCard: {
    alignItems: "center", paddingVertical: 36, gap: 8,
    backgroundColor: C.card, borderRadius: 18, borderWidth: 1, borderColor: C.cardBorder,
  },
  emptyText: { color: C.textTertiary, fontSize: 14, fontFamily: FONTS.body },
  groupedList: {
    backgroundColor: C.card, borderRadius: 16, overflow: "hidden",
    borderWidth: 1, borderColor: C.cardBorder,
  },
  rowDivider: { height: StyleSheet.hairlineWidth, backgroundColor: C.separator, marginLeft: 70 },
  contextBanner: { paddingHorizontal: 14, paddingTop: 8, paddingBottom: 2 },
  contextText: {
    fontSize: 11, color: C.accent, fontWeight: "700", fontFamily: FONTS.bodySemiBold,
    letterSpacing: 0.1,
  },
});

const TOPIC_KEYWORDS: Array<{ label: string; keywords: string[]; color: string }> = [
  { label: "NBA", keywords: ["nba", "basketball", "celtics", "lakers", "warriors", "heat", "bucks", "nets", "sixers", "knicks", "rockets", "suns"], color: C.nba },
  { label: "NFL", keywords: ["nfl", "football", "chiefs", "eagles", "cowboys", "patriots", "texans", "49ers", "packers", "bears"], color: C.nfl },
  { label: "MLB", keywords: ["mlb", "baseball", "yankees", "dodgers", "astros", "red sox", "cubs", "mets", "giants"], color: C.mlb },
  { label: "MLS", keywords: ["mls", "soccer", "dynamo", "galaxy", "fire", "united"], color: C.mls },
  { label: "Trade & Injuries", keywords: ["trade", "injury", "injured", "surgery", "signing", "waived", "contract", "deal"], color: C.accentGold },
  { label: "Playoffs", keywords: ["playoff", "postseason", "series", "championship", "finals", "seed", "elimination", "bracket", "march madness"], color: C.accentGreen },
];

function getArticleTopic(article: NewsArticle): { label: string; color: string } | null {
  const text = `${article.title} ${article.summary ?? ""}`.toLowerCase();
  for (const topic of TOPIC_KEYWORDS) {
    if (topic.keywords.some(kw => text.includes(kw))) {
      return { label: topic.label, color: topic.color };
    }
  }
  return null;
}

const HOME_STANDINGS_LEAGUES = new Set(["NBA", "NFL", "MLB", "NHL", "WNBA", "MLS", "EPL", "LIGA", "NCAAB"]);
const HOME_STANDINGS_PRIORITY = ["NBA", "MLB", "NFL", "WNBA", "NHL", "MLS", "EPL", "LIGA", "NCAAB"];

type HomeStandingsSnapshot = {
  league: string;
  standings: StandingEntry[];
};

function pickHomeStandingsLeagues(favoriteLeagues: string[], favoriteTeams: string[], allGames: Game[]) {
  const leagues: string[] = [];
  const add = (league?: string | null) => {
    if (!league || !HOME_STANDINGS_LEAGUES.has(league) || leagues.includes(league)) return;
    leagues.push(league);
  };

  favoriteLeagues.forEach(add);
  favoriteTeams.forEach((teamName) => add(ALL_TEAMS.find((team) => team.name === teamName)?.league));
  allGames
    .filter((game) => game.status === "live" || game.status === "upcoming")
    .forEach((game) => add(game.league));
  allGames
    .filter((game) => favoriteTeams.includes(game.homeTeam) || favoriteTeams.includes(game.awayTeam))
    .forEach((game) => add(game.league));
  HOME_STANDINGS_PRIORITY.forEach(add);

  return leagues.slice(0, 3);
}

function formatArticleAge(publishedAt: string) {
  const published = new Date(publishedAt).getTime();
  if (Number.isNaN(published)) return "";
  const minutes = Math.max(0, Math.floor((Date.now() - published) / 60000));
  if (minutes < 1) return "Now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

function getStandingsTitle(league: string, standings: StandingEntry[]) {
  const conference = standings.find((entry) => entry.conference)?.conference;
  if (conference && ["NBA", "WNBA", "NHL", "MLS"].includes(league)) return `${league} ${conference}`;
  return `${league} Standings`;
}

function getStandingTeamShort(teamName: string) {
  return ALL_TEAMS.find((team) => team.name === teamName)?.abbr
    ?? teamName.split(" ").slice(-1)[0].slice(0, 4).toUpperCase();
}

function getStandingsInsightCards(league: string, rows: StandingEntry[]) {
  if (rows.length === 0) return [];
  const leader = rows[0];
  const mover = rows
    .filter((entry) => typeof entry.rankChange === "number" && entry.rankChange > 0)
    .sort((a, b) => (b.rankChange ?? 0) - (a.rankChange ?? 0))[0];
  const formTeam = rows
    .filter((entry) => entry.streak)
    .sort((a, b) => {
      const parse = (value: string | null) => {
        const match = value?.match(/^([WL])(\d+)/i);
        if (!match) return 0;
        const score = Number(match[2]) || 0;
        return match[1].toUpperCase() === "W" ? score : -score;
      };
      return parse(b.streak) - parse(a.streak);
    })[0];

  const cards = [
    {
      id: "leader",
      label: "Leader",
      value: getStandingTeamShort(leader.teamName),
      sub: leader.gamesBack === 0 || leader.gamesBack == null ? `${leader.wins}-${leader.losses}` : `${leader.gamesBack} GB`,
      icon: "trophy-outline",
      color: getLeagueColor(league),
      team: leader,
    },
  ];

  if (mover) {
    cards.push({
      id: "mover",
      label: "Mover",
      value: getStandingTeamShort(mover.teamName),
      sub: `Up ${mover.rankChange}`,
      icon: "trending-up-outline",
      color: C.accentGreen,
      team: mover,
    });
  } else if (formTeam && formTeam !== leader) {
    cards.push({
      id: "form",
      label: "Form",
      value: getStandingTeamShort(formTeam.teamName),
      sub: formTeam.streak ?? `${formTeam.wins}-${formTeam.losses}`,
      icon: "pulse-outline",
      color: C.accentGold,
      team: formTeam,
    });
  } else if (rows[1]) {
    cards.push({
      id: "chaser",
      label: "Chaser",
      value: getStandingTeamShort(rows[1].teamName),
      sub: rows[1].gamesBack == null || rows[1].gamesBack === 0 ? `${rows[1].wins}-${rows[1].losses}` : `${rows[1].gamesBack} GB`,
      icon: "trail-sign-outline",
      color: C.accentBlue,
      team: rows[1],
    });
  }

  return cards.slice(0, 2);
}

function getFavoriteStanding(standings: StandingEntry[], myTeams: string[]) {
  return standings.find((entry) => myTeams.includes(entry.teamName)) ?? null;
}

function formatRank(rank: number) {
  const suffix = rank % 10 === 1 && rank % 100 !== 11 ? "st"
    : rank % 10 === 2 && rank % 100 !== 12 ? "nd"
    : rank % 10 === 3 && rank % 100 !== 13 ? "rd"
    : "th";
  return `${rank}${suffix}`;
}

function getTargetStanding(standings: StandingEntry[], team: StandingEntry) {
  if (team.rank > 1) return standings.find((entry) => entry.rank === team.rank - 1) ?? standings[0] ?? null;
  return standings.find((entry) => entry.rank === team.rank + 1) ?? standings[1] ?? null;
}

function getPersonalStandingsCards(league: string, standings: StandingEntry[], myTeams: string[]) {
  const favorite = getFavoriteStanding(standings, myTeams);
  if (!favorite) return getStandingsInsightCards(league, standings.slice(0, 4));

  const target = getTargetStanding(standings, favorite);
  const cards = [
    {
      id: "my-team",
      label: "My Team",
      value: getStandingTeamShort(favorite.teamName),
      sub: `${formatRank(favorite.rank)} · ${favorite.wins}-${favorite.losses}`,
      icon: "heart-outline",
      color: getLeagueColor(league),
      team: favorite,
    },
  ];

  if (target) {
    const isChaser = favorite.rank === 1 || target.rank > favorite.rank;
    cards.push({
      id: "target",
      label: isChaser ? "Chaser" : "Target",
      value: getStandingTeamShort(target.teamName),
      sub: target.gamesBack == null || target.gamesBack === 0 ? `${formatRank(target.rank)}` : `${target.gamesBack} GB`,
      icon: isChaser ? "trail-sign-outline" : "locate-outline",
      color: isChaser ? C.accentBlue : C.accentGold,
      team: target,
    });
  }

  return cards.slice(0, 2);
}

function getPersonalStandingsRows(standings: StandingEntry[], myTeams: string[]) {
  const favorite = getFavoriteStanding(standings, myTeams);
  if (!favorite) return standings.slice(0, 3);

  const wantedRanks = [favorite.rank - 1, favorite.rank, favorite.rank + 1].filter((rank) => rank > 0);
  const rows = wantedRanks
    .map((rank) => standings.find((entry) => entry.rank === rank))
    .filter(Boolean) as StandingEntry[];

  return rows.length > 0 ? rows : standings.slice(0, 3);
}

function getMultiSportStandingRows(snapshots: HomeStandingsSnapshot[], myTeams: string[]) {
  return snapshots
    .map((snapshot) => {
      const favorite = getFavoriteStanding(snapshot.standings, myTeams);
      const entry = favorite ?? snapshot.standings[0];
      if (!entry) return null;
      return {
        league: snapshot.league,
        entry,
        isFavorite: Boolean(favorite),
      };
    })
    .filter(Boolean) as { league: string; entry: StandingEntry; isFavorite: boolean }[];
}

type RaceTeamLine = {
  id: string;
  label?: string;
  entry: StandingEntry;
  isFavorite?: boolean;
};

type RaceGroup = {
  label: string;
  rows: RaceTeamLine[];
};

type HomeRaceBoard = {
  league: string;
  accent: string;
  title: string;
  groups: RaceGroup[];
  expandedGroups: RaceGroup[];
  favorite: StandingEntry | null;
  context: string;
  teamTarget: StandingEntry | null;
};

function sortStandingRows(rows: StandingEntry[]) {
  return [...rows].sort((a, b) => {
    const aSeed = a.playoffSeed ?? a.rank;
    const bSeed = b.playoffSeed ?? b.rank;
    if (aSeed !== bSeed) return aSeed - bSeed;
    if ((b.winPct ?? 0) !== (a.winPct ?? 0)) return (b.winPct ?? 0) - (a.winPct ?? 0);
    return a.teamName.localeCompare(b.teamName);
  });
}

function findRaceRowsByConference(standings: StandingEntry[], needle: string) {
  const value = needle.toLowerCase();
  return sortStandingRows(standings.filter((entry) => (entry.conference ?? "").toLowerCase().includes(value)));
}

function getDivisionShortName(value: string | null) {
  if (!value) return "";
  return value
    .replace(/american league|national league|eastern conference|western conference|conference|division/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function makeRaceLine(entry: StandingEntry, label?: string, myTeams: string[] = []): RaceTeamLine {
  return {
    id: `${label ?? "row"}-${entry.teamName}`,
    label,
    entry,
    isFavorite: myTeams.includes(entry.teamName),
  };
}

function makeRaceLines(rows: StandingEntry[], limit: number, myTeams: string[]) {
  return rows.slice(0, limit).map((entry) => makeRaceLine(entry, undefined, myTeams));
}

function getDivisionLeaderLines(rows: StandingEntry[], myTeams: string[]) {
  const byDivision = new Map<string, StandingEntry[]>();
  rows.forEach((entry) => {
    const key = entry.division || entry.conference || "Race";
    byDivision.set(key, [...(byDivision.get(key) ?? []), entry]);
  });

  return [...byDivision.entries()]
    .map(([division, entries]) => {
      const leader = sortStandingRows(entries)[0];
      if (!leader) return null;
      return makeRaceLine(leader, getDivisionShortName(division), myTeams);
    })
    .filter(Boolean) as RaceTeamLine[];
}

function formatRaceRecord(entry: StandingEntry, league: string) {
  if (entry.points != null && ["EPL", "LIGA", "MLS", "UCL"].includes(league)) return `${entry.points} pts`;
  if (entry.draws != null && entry.draws > 0) return `${entry.wins}-${entry.draws}-${entry.losses}`;
  return `${entry.wins}-${entry.losses}`;
}

function formatRaceBack(entry: StandingEntry) {
  if (entry.gamesBack == null || entry.gamesBack === 0) return "leader";
  return `${entry.gamesBack.toFixed(1)} GB`;
}

function formatRaceLocation(entry: StandingEntry, league: string) {
  const place = formatRank(entry.playoffSeed ?? entry.rank);
  if (entry.division) return `${place} ${getDivisionShortName(entry.division)}`;
  if (entry.conference) return `${place} ${getDivisionShortName(entry.conference)}`;
  if (["EPL", "LIGA", "MLS", "UCL"].includes(league)) return `${place} table`;
  return `${place} overall`;
}

function getRaceFavoriteLine(favorite: StandingEntry | null, league: string) {
  if (!favorite) return null;
  const parts = [
    getStandingTeamShort(favorite.teamName),
    formatRaceLocation(favorite, league),
    favorite.gamesBack != null && favorite.gamesBack > 0 ? `${favorite.gamesBack.toFixed(1)} GB` : favorite.streak,
  ].filter(Boolean);
  return `My Team: ${parts.join(" · ")}`;
}

function buildHomeRaceBoard(snapshot: HomeStandingsSnapshot, myTeams: string[]): HomeRaceBoard | null {
  const standings = sortStandingRows(snapshot.standings);
  if (standings.length === 0) return null;

  const { league } = snapshot;
  const accent = getLeagueColor(league);
  const favorite = getFavoriteStanding(standings, myTeams);
  const east = findRaceRowsByConference(standings, "east");
  const west = findRaceRowsByConference(standings, "west");
  const afc = findRaceRowsByConference(standings, "afc");
  const nfc = findRaceRowsByConference(standings, "nfc");
  const al = findRaceRowsByConference(standings, "american").length > 0 ? findRaceRowsByConference(standings, "american") : findRaceRowsByConference(standings, "al");
  const nl = findRaceRowsByConference(standings, "national").length > 0 ? findRaceRowsByConference(standings, "national") : findRaceRowsByConference(standings, "nl");

  let groups: RaceGroup[] = [];
  let expandedGroups: RaceGroup[] = [];
  let context = "";

  if (league === "MLB") {
    const alRows = al.length > 0 ? al : standings.filter((entry) => /AL|American/i.test(`${entry.conference ?? ""} ${entry.division ?? ""}`));
    const nlRows = nl.length > 0 ? nl : standings.filter((entry) => /NL|National/i.test(`${entry.conference ?? ""} ${entry.division ?? ""}`));
    const alLeaders = getDivisionLeaderLines(alRows.length > 0 ? alRows : standings.slice(0, 15), myTeams).slice(0, 3);
    const nlLeaders = getDivisionLeaderLines(nlRows.length > 0 ? nlRows : standings.slice(0, 15), myTeams).slice(0, 3);
    groups = [
      { label: "AL Race", rows: alLeaders.length > 0 ? alLeaders : makeRaceLines(standings, 3, myTeams) },
      { label: "NL Race", rows: nlLeaders.length > 0 ? nlLeaders : makeRaceLines(standings.slice(3), 3, myTeams) },
    ];
    expandedGroups = [
      { label: "AL Division Leaders", rows: groups[0].rows },
      { label: "NL Division Leaders", rows: groups[1].rows },
      { label: "Wild Card Heat", rows: makeRaceLines(standings.slice(3), 3, myTeams) },
    ].filter((group) => group.rows.length > 0);
    context = favorite
      ? `${getStandingTeamShort(favorite.teamName)} sits ${formatRaceLocation(favorite, league)}. Baseball needs division and wild card context.`
      : "Baseball is division-first: scan AL, NL, then wild card heat.";
  } else if (league === "NFL") {
    const afcRows = afc.length > 0 ? afc : standings.filter((entry) => /AFC/i.test(`${entry.conference ?? ""} ${entry.division ?? ""}`));
    const nfcRows = nfc.length > 0 ? nfc : standings.filter((entry) => /NFC/i.test(`${entry.conference ?? ""} ${entry.division ?? ""}`));
    groups = [
      { label: "AFC", rows: makeRaceLines(afcRows.length > 0 ? afcRows : standings, 2, myTeams) },
      { label: "NFC", rows: makeRaceLines(nfcRows.length > 0 ? nfcRows : standings.slice(2), 2, myTeams) },
    ];
    expandedGroups = [
      { label: "AFC Leaders", rows: makeRaceLines(afcRows.length > 0 ? afcRows : standings, 4, myTeams) },
      { label: "NFC Leaders", rows: makeRaceLines(nfcRows.length > 0 ? nfcRows : standings.slice(2), 4, myTeams) },
    ];
    context = favorite
      ? `${getStandingTeamShort(favorite.teamName)} is ${formatRaceLocation(favorite, league)}.`
      : "Conference leaders set the top line; divisions decide the real chase.";
  } else if (league === "WNBA") {
    groups = [
      { label: "Top 4", rows: makeRaceLines(standings, 4, myTeams) },
      { label: "Playoff Line", rows: makeRaceLines(standings.slice(6, 9), 3, myTeams) },
    ].filter((group) => group.rows.length > 0);
    expandedGroups = [
      { label: "Playoff Top 8", rows: makeRaceLines(standings, 8, myTeams) },
    ];
    context = favorite
      ? `${getStandingTeamShort(favorite.teamName)} is ${formatRaceLocation(favorite, league)}. Top 8 is the playoff line.`
      : "WNBA is an overall playoff race: top 8 is the line.";
  } else if (["NBA", "NHL"].includes(league)) {
    const eastRows = east.length > 0 ? east : standings.filter((entry) => /east/i.test(`${entry.conference ?? ""} ${entry.division ?? ""}`));
    const westRows = west.length > 0 ? west : standings.filter((entry) => /west/i.test(`${entry.conference ?? ""} ${entry.division ?? ""}`));
    groups = [
      { label: "East", rows: makeRaceLines(eastRows.length > 0 ? eastRows : standings, 2, myTeams) },
      { label: "West", rows: makeRaceLines(westRows.length > 0 ? westRows : standings.slice(2), 2, myTeams) },
    ];
    expandedGroups = [
      { label: "East", rows: makeRaceLines(eastRows.length > 0 ? eastRows : standings, 4, myTeams) },
      { label: "West", rows: makeRaceLines(westRows.length > 0 ? westRows : standings.slice(2), 4, myTeams) },
    ];
    context = favorite
      ? `${getStandingTeamShort(favorite.teamName)} is ${formatRaceLocation(favorite, league)}.`
      : `${league} is a two-conference race, not just one leader.`;
  } else if (["EPL", "LIGA", "MLS", "UCL"].includes(league)) {
    groups = [
      { label: "Top 4", rows: makeRaceLines(standings, 4, myTeams) },
      { label: "Danger Zone", rows: makeRaceLines(standings.slice(-3), 3, myTeams) },
    ];
    expandedGroups = [
      { label: "European / Playoff Spots", rows: makeRaceLines(standings, 6, myTeams) },
      { label: "Relegation / Cut Line", rows: makeRaceLines(standings.slice(-4), 4, myTeams) },
    ];
    context = favorite
      ? `${getStandingTeamShort(favorite.teamName)} is ${formatRaceLocation(favorite, league)}.`
      : "Soccer tables are about top spots, cut lines, and the bottom fight.";
  } else {
    groups = [
      { label: "Leaders", rows: makeRaceLines(standings, 3, myTeams) },
      { label: "Chasers", rows: makeRaceLines(standings.slice(3), 3, myTeams) },
    ].filter((group) => group.rows.length > 0);
    expandedGroups = [
      { label: "Race Board", rows: makeRaceLines(standings, 6, myTeams) },
    ];
    context = favorite
      ? `${getStandingTeamShort(favorite.teamName)} is ${formatRaceLocation(favorite, league)}.`
      : "Leaders and chasers are the quick read.";
  }

  const firstTeam = groups.flatMap((group) => group.rows)[0]?.entry ?? standings[0];
  return {
    league,
    accent,
    title: league === "EPL" ? "Soccer" : league,
    groups: groups.filter((group) => group.rows.length > 0).slice(0, 3),
    expandedGroups: expandedGroups.filter((group) => group.rows.length > 0).slice(0, 3),
    favorite,
    context,
    teamTarget: favorite ?? firstTeam ?? null,
  };
}

function StandingsSnapshot({
  snapshots,
  myTeams,
  isLoading,
  isError,
  onRetry,
}: {
  snapshots: HomeStandingsSnapshot[];
  myTeams: string[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}) {
  const [expandedStandingId, setExpandedStandingId] = useState<string | null>(null);
  const boards = snapshots
    .map((snapshot) => buildHomeRaceBoard(snapshot, myTeams))
    .filter(Boolean) as HomeRaceBoard[];
  const accent = boards[0]?.accent ?? C.accentGold;

  return (
    <View style={snapshotStyles.panel}>
      <PanelHeader
        icon="podium-outline"
        title="STANDINGS SNAPSHOT"
        action="View all"
        color={accent}
        onPress={() => router.push("/(tabs)/standings" as any)}
      />

      <Text style={snapshotStyles.contextLabel}>Leaders, chasers, and your teams.</Text>

      {isLoading ? (
        <View style={snapshotStyles.loadingList}>
          {[1, 2, 3].map((item) => <View key={item} style={snapshotStyles.loadingRow} />)}
        </View>
      ) : isError ? (
        <Pressable accessibilityRole="button" style={snapshotStyles.emptyState} onPress={onRetry}>
          <Ionicons name="wifi-outline" size={22} color={C.textTertiary} />
          <Text style={snapshotStyles.emptyText}>Could not load standings. Tap to retry.</Text>
        </Pressable>
      ) : boards.length === 0 ? (
        <View style={snapshotStyles.emptyState}>
          <Ionicons name="podium-outline" size={22} color={C.textTertiary} />
          <Text style={snapshotStyles.emptyText}>Standings are quiet right now.</Text>
        </View>
      ) : (
        <View style={snapshotStyles.raceList}>
          {boards.map((board) => {
            const isExpanded = expandedStandingId === board.league;
            const favoriteLine = getRaceFavoriteLine(board.favorite, board.league);
            return (
              <View
                key={board.league}
                style={[
                  snapshotStyles.racePill,
                  isExpanded && { borderColor: `${board.accent}44`, backgroundColor: C.glassMedium },
                ]}
              >
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${isExpanded ? "Collapse" : "Expand"} ${board.title} race board`}
                  accessibilityState={{ expanded: isExpanded }}
                  onPress={() => setExpandedStandingId(isExpanded ? null : board.league)}
                  style={({ pressed }) => [snapshotStyles.raceTop, pressed && snapshotStyles.rowPressed]}
                >
                  <View style={[snapshotStyles.leagueBadge, { borderColor: `${board.accent}44`, backgroundColor: `${board.accent}14` }]}>
                    <Text style={[snapshotStyles.leagueBadgeText, { color: board.accent }]}>{board.title}</Text>
                  </View>
                  <View style={snapshotStyles.raceBody}>
                    {board.groups.map((group) => (
                      <View key={`${board.league}-${group.label}`} style={snapshotStyles.raceGroup}>
                        <Text style={snapshotStyles.raceGroupLabel}>{group.label}</Text>
                        <Text style={snapshotStyles.raceGroupText} numberOfLines={1}>
                          {group.rows.map((row) => `${row.label ? `${row.label}: ` : ""}${getStandingTeamShort(row.entry.teamName)}`).join(" · ")}
                        </Text>
                      </View>
                    ))}
                    {favoriteLine ? <Text style={[snapshotStyles.myRaceLine, { color: board.accent }]} numberOfLines={1}>{favoriteLine}</Text> : null}
                  </View>
                  <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={17} color={C.textTertiary} />
                </Pressable>

                {isExpanded ? (
                  <View style={snapshotStyles.raceWindow}>
                    {board.expandedGroups.map((group) => (
                      <View key={`${board.league}-expanded-${group.label}`} style={snapshotStyles.expandedRaceGroup}>
                        <Text style={[snapshotStyles.expandedRaceTitle, { color: board.accent }]}>{group.label}</Text>
                        {group.rows.slice(0, board.league === "WNBA" ? 5 : 4).map((row, index) => (
                          <Pressable
                            key={`${row.id}-${index}`}
                            accessibilityRole="button"
                            accessibilityLabel={`Open ${row.entry.teamName}`}
                            onPress={() => goToTeam(row.entry.teamName, board.league)}
                            style={({ pressed }) => [
                              snapshotStyles.raceTeamRow,
                              row.isFavorite && { backgroundColor: `${board.accent}12`, borderColor: `${board.accent}32` },
                              pressed && snapshotStyles.rowPressed,
                            ]}
                          >
                            <Text style={snapshotStyles.raceRank}>{row.entry.playoffSeed ?? row.entry.rank}</Text>
                            <TeamLogo uri={row.entry.logoUrl} name={row.entry.teamName} size={22} borderColor={row.isFavorite ? `${board.accent}55` : C.cardBorderActive} />
                            <Text style={snapshotStyles.raceTeamName} numberOfLines={1}>
                              {row.label ? `${row.label}: ` : ""}{row.entry.teamName}
                            </Text>
                            <Text style={snapshotStyles.raceRecord} numberOfLines={1}>{formatRaceRecord(row.entry, board.league)}</Text>
                          </Pressable>
                        ))}
                      </View>
                    ))}

                    <Text style={snapshotStyles.raceContext}>{board.context}</Text>

                    <View style={snapshotStyles.raceActions}>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Open full ${board.title} standings`}
                        onPress={() => router.push({ pathname: "/(tabs)/standings", params: { league: board.league } } as any)}
                        style={({ pressed }) => [snapshotStyles.raceActionBtn, { borderColor: `${board.accent}55` }, pressed && snapshotStyles.rowPressed]}
                      >
                        <Text style={[snapshotStyles.raceActionText, { color: board.accent }]}>Full Standings</Text>
                        <Ionicons name="podium-outline" size={13} color={board.accent} />
                      </Pressable>
                      {board.teamTarget ? (
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`Open ${board.teamTarget.teamName} team page`}
                          onPress={() => goToTeam(board.teamTarget!.teamName, board.league)}
                          style={({ pressed }) => [snapshotStyles.raceActionBtn, pressed && snapshotStyles.rowPressed]}
                        >
                          <Text style={snapshotStyles.raceActionText}>Team Page</Text>
                          <Ionicons name="chevron-forward" size={13} color={C.textSecondary} />
                        </Pressable>
                      ) : null}
                    </View>
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

function LatestNewsPanel({
  articles,
  isLoading,
  onArticlePress,
}: {
  articles: NewsArticle[];
  isLoading: boolean;
  onArticlePress: (a: NewsArticle) => void;
}) {
  const [previewArticle, setPreviewArticle] = useState<NewsArticle | null>(null);
  const rows = articles.slice(0, 5);
  const lead = rows[0];
  const rest = rows.slice(1);
  const previewTopic = previewArticle ? getArticleTopic(previewArticle) : null;
  const previewLeague = previewArticle ? (previewArticle.leagues[0] ?? previewTopic?.label ?? "Sports") : "Sports";

  return (
    <View style={snapshotStyles.panel}>
      <PanelHeader
        icon="newspaper-outline"
        title="LATEST NEWS"
        action="View all"
        color={C.accentBlue}
        onPress={() => router.push("/(tabs)/news" as any)}
      />

      {previewArticle ? (
        <View style={[snapshotStyles.articlePeek, { borderColor: `${previewTopic?.color ?? C.accentBlue}44` }]}>
          <View style={snapshotStyles.articlePeekTop}>
            <Text style={[snapshotStyles.articlePeekMeta, { color: previewTopic?.color ?? C.accentBlue }]} numberOfLines={1}>
              {previewLeague} · {formatArticleAge(previewArticle.publishedAt)} · {previewArticle.source}
            </Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Close story preview" onPress={() => setPreviewArticle(null)} hitSlop={8}>
              <Ionicons name="close" size={16} color={C.textSecondary} />
            </Pressable>
          </View>
          <Text style={snapshotStyles.articlePeekTitle} numberOfLines={2}>{previewArticle.title}</Text>
          {previewArticle.summary ? (
            <Text style={snapshotStyles.articlePeekSummary} numberOfLines={2}>{previewArticle.summary}</Text>
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Open article: ${previewArticle.title}`}
            onPress={() => onArticlePress(previewArticle)}
            style={({ pressed }) => [snapshotStyles.articlePeekAction, pressed && snapshotStyles.rowPressed]}
          >
            <Text style={snapshotStyles.articlePeekActionText}>Open story</Text>
            <Ionicons name="chevron-forward" size={13} color={C.text} />
          </Pressable>
        </View>
      ) : null}

      {isLoading ? (
        <View style={snapshotStyles.loadingList}>
          {[1, 2, 3].map((item) => <View key={item} style={snapshotStyles.loadingRow} />)}
        </View>
      ) : rows.length === 0 ? (
        <View style={snapshotStyles.emptyState}>
          <Ionicons name="newspaper-outline" size={22} color={C.textTertiary} />
          <Text style={snapshotStyles.emptyText}>No fresh news loaded yet.</Text>
        </View>
      ) : (
        <View style={snapshotStyles.newsList}>
          {lead ? (() => {
            const topic = getArticleTopic(lead);
            const league = lead.leagues[0] ?? topic?.label ?? "Sports";
            return (
              <Pressable
                key={lead.id}
                accessibilityRole="button"
                accessibilityLabel={`Open article: ${lead.title}`}
                onPress={() => onArticlePress(lead)}
                onLongPress={() => setPreviewArticle(lead)}
                style={({ pressed }) => [snapshotStyles.leadNewsCard, pressed && snapshotStyles.rowPressed]}
              >
                <View style={snapshotStyles.leadNewsText}>
                  <View style={[snapshotStyles.leadBadge, { borderColor: `${topic?.color ?? C.accentBlue}40`, backgroundColor: `${topic?.color ?? C.accentBlue}14` }]}>
                    <Text style={[snapshotStyles.leadBadgeText, { color: topic?.color ?? C.accentBlue }]}>TOP STORY</Text>
                  </View>
                  <Text style={snapshotStyles.newsMeta} numberOfLines={1}>
                    {league} · {formatArticleAge(lead.publishedAt)} · {lead.source}
                  </Text>
                  <Text style={snapshotStyles.leadNewsTitle} numberOfLines={3}>{lead.title}</Text>
                </View>
                <MomentGraphic
                  variant="thumbnail"
                  moment={{
                    statusLabel: "NEWS",
                    leagueLabel: league,
                    accentColor: topic?.color ?? C.accentBlue,
                    article: lead,
                  }}
                />
              </Pressable>
            );
          })() : null}

          {rest.map((article, index) => {
            const topic = getArticleTopic(article);
            const league = article.leagues[0] ?? topic?.label ?? "Sports";
            return (
              <Pressable
                key={article.id}
                accessibilityRole="button"
                accessibilityLabel={`Open article: ${article.title}`}
                onPress={() => onArticlePress(article)}
                onLongPress={() => setPreviewArticle(article)}
                style={({ pressed }) => [
                  snapshotStyles.newsRow,
                  index < rest.length - 1 && snapshotStyles.newsRowBorder,
                  pressed && snapshotStyles.rowPressed,
                ]}
              >
                <View style={snapshotStyles.newsBody}>
                  <Text style={snapshotStyles.newsMeta} numberOfLines={1}>
                    {league} · {formatArticleAge(article.publishedAt)} · {article.source}
                  </Text>
                  <Text style={snapshotStyles.newsTitle} numberOfLines={2}>{article.title}</Text>
                </View>
                <MomentGraphic
                  variant="thumbnail"
                  moment={{
                    statusLabel: "NEWS",
                    leagueLabel: league,
                    accentColor: topic?.color ?? C.accentBlue,
                    article,
                  }}
                />
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

function PanelHeader({
  icon,
  title,
  action,
  color,
  onPress,
}: {
  icon: string;
  title: string;
  action: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <View style={snapshotStyles.header}>
      <View style={snapshotStyles.headerTitle}>
        <Ionicons name={icon as any} size={16} color={color} />
        <Text style={snapshotStyles.headerText}>{title}</Text>
      </View>
      <Pressable accessibilityRole="button" onPress={onPress} hitSlop={10}>
        <Text style={[snapshotStyles.headerAction, { color }]}>{action}</Text>
      </Pressable>
    </View>
  );
}

const snapshotStyles = StyleSheet.create({
  panel: {
    minHeight: 356,
    gap: 9,
    padding: 12,
    borderRadius: 18,
    backgroundColor: C.cardElevated,
    borderWidth: 1,
    borderColor: C.cardBorderActive,
  },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  headerTitle: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  headerText: { color: C.text, fontSize: 14, fontWeight: "900", fontFamily: FONTS.bodyHeavy, letterSpacing: 0.5 },
  headerAction: { fontSize: 12, fontWeight: "800", fontFamily: FONTS.bodyBold },
  contextLabel: { color: C.textSecondary, fontSize: 12, fontWeight: "700", fontFamily: FONTS.bodyMedium, marginTop: -2 },
  table: { gap: 2 },
  row: { minHeight: 40, flexDirection: "row", alignItems: "center", gap: 9, borderRadius: 10, paddingHorizontal: 4 },
  rowPressed: { opacity: 0.78 },
  insightGrid: { flexDirection: "row", gap: 10 },
  insightCard: {
    flex: 1,
    minHeight: 82,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    padding: 10,
    borderRadius: 14,
    backgroundColor: C.glassLight,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  insightIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  insightCopy: { flex: 1, minWidth: 0, gap: 1 },
  insightLabel: { color: C.textTertiary, fontSize: 10, fontWeight: "900", fontFamily: FONTS.bodyBold },
  insightValue: { color: C.text, fontSize: 15, fontWeight: "900", fontFamily: FONTS.bodyHeavy },
  insightSub: { color: C.textSecondary, fontSize: 11, fontWeight: "800", fontFamily: FONTS.bodyBold },
  rank: { width: 18, color: C.textSecondary, fontSize: 12, fontWeight: "900", fontFamily: FONTS.bodyBold, textAlign: "center" },
  teamName: { flex: 1, color: C.text, fontSize: 13, fontWeight: "800", fontFamily: FONTS.bodyHeavy },
  recordStack: { alignItems: "flex-end", gap: 1 },
  record: { color: C.textSecondary, fontSize: 12, fontWeight: "800", fontFamily: FONTS.bodyBold },
  streak: { color: C.textTertiary, fontSize: 10, fontWeight: "800", fontFamily: FONTS.bodyBold },
  newsList: { overflow: "hidden", borderRadius: 12 },
  leadNewsCard: {
    minHeight: 116,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 10,
    marginBottom: 4,
    borderRadius: 16,
    backgroundColor: C.glassLight,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  leadNewsText: { flex: 1, minWidth: 0, gap: 5 },
  leadBadge: {
    alignSelf: "flex-start",
    minHeight: 24,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  leadBadgeText: { fontSize: 9, fontWeight: "900", fontFamily: FONTS.bodyBold, letterSpacing: 0.5 },
  leadNewsTitle: { color: C.text, fontSize: 15, lineHeight: 20, fontWeight: "900", fontFamily: FONTS.bodyHeavy },
  newsRow: { minHeight: 74, flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 9 },
  newsRowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.separator },
  newsBody: { flex: 1, minWidth: 0, gap: 4 },
  newsMeta: { color: C.accentBlue, fontSize: 11, fontWeight: "800", fontFamily: FONTS.bodyBold },
  newsTitle: { color: C.text, fontSize: 13, lineHeight: 18, fontWeight: "800", fontFamily: FONTS.bodyHeavy },
  articlePeek: {
    gap: 8,
    padding: 12,
    borderRadius: 16,
    backgroundColor: C.glassMedium,
    borderWidth: 1,
  },
  articlePeekTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  articlePeekMeta: { flex: 1, minWidth: 0, fontSize: 11, fontWeight: "900", fontFamily: FONTS.bodyBold },
  articlePeekTitle: { color: C.text, fontSize: 14, lineHeight: 19, fontWeight: "900", fontFamily: FONTS.bodyHeavy },
  articlePeekSummary: { color: C.textSecondary, fontSize: 12, lineHeight: 17, fontWeight: "700", fontFamily: FONTS.bodyMedium },
  articlePeekAction: {
    alignSelf: "flex-start",
    minHeight: 30,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: C.glassLight,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  articlePeekActionText: { color: C.text, fontSize: 12, fontWeight: "900", fontFamily: FONTS.bodyBold },
  loadingList: { gap: 8 },
  loadingRow: { height: 38, borderRadius: 10, backgroundColor: C.glassLight },
  emptyState: { minHeight: 94, alignItems: "center", justifyContent: "center", gap: 8 },
  emptyText: { color: C.textSecondary, fontSize: 13, fontFamily: FONTS.bodyMedium, textAlign: "center" },
  raceList: { gap: 8 },
  racePill: {
    gap: 8,
    padding: 9,
    borderRadius: 15,
    backgroundColor: C.glassLight,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  raceTop: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  raceBody: { flex: 1, minWidth: 0, gap: 5 },
  raceGroup: { flexDirection: "row", alignItems: "center", gap: 7 },
  raceGroupLabel: {
    width: 70,
    color: C.textTertiary,
    fontSize: 10,
    fontWeight: "900",
    fontFamily: FONTS.bodyBold,
    textTransform: "uppercase",
  },
  raceGroupText: { flex: 1, color: C.text, fontSize: 12, fontWeight: "900", fontFamily: FONTS.bodyHeavy },
  myRaceLine: { fontSize: 11, fontWeight: "900", fontFamily: FONTS.bodyBold },
  raceWindow: {
    gap: 9,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.separator,
  },
  expandedRaceGroup: { gap: 4 },
  expandedRaceTitle: { fontSize: 10, fontWeight: "900", fontFamily: FONTS.bodyHeavy, textTransform: "uppercase" },
  raceTeamRow: {
    minHeight: 32,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "transparent",
  },
  raceRank: { width: 18, color: C.textTertiary, fontSize: 11, fontWeight: "900", fontFamily: FONTS.monoBold, textAlign: "center" },
  raceTeamName: { flex: 1, color: C.text, fontSize: 12, fontWeight: "900", fontFamily: FONTS.bodyHeavy },
  raceRecord: { color: C.textSecondary, fontSize: 11, fontWeight: "900", fontFamily: FONTS.bodyBold },
  raceContext: { color: C.textSecondary, fontSize: 11, lineHeight: 16, fontWeight: "700", fontFamily: FONTS.bodyMedium },
  raceActions: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  raceActionBtn: {
    minHeight: 32,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: C.glassLight,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  raceActionText: { color: C.text, fontSize: 12, fontWeight: "900", fontFamily: FONTS.bodyBold },
  multiSportList: { gap: 6 },
  multiSportRow: {
    minHeight: 56,
    gap: 8,
    padding: 9,
    borderRadius: 14,
    backgroundColor: C.glassLight,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  multiSportRowExpanded: { backgroundColor: C.glassMedium, borderColor: C.cardBorderActive },
  multiSportMain: { flexDirection: "row", alignItems: "center", gap: 10 },
  leagueBadge: {
    width: 42,
    minHeight: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    borderWidth: 1,
  },
  leagueBadgeText: { fontSize: 10, fontWeight: "900", fontFamily: FONTS.bodyHeavy },
  multiSportCopy: { flex: 1, minWidth: 0, gap: 2 },
  multiSportSub: { color: C.textSecondary, fontSize: 11, fontWeight: "800", fontFamily: FONTS.bodyBold },
  standingPeek: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.separator,
  },
  peekStat: { minWidth: 48, gap: 2 },
  peekLabel: { color: C.textTertiary, fontSize: 9, fontWeight: "900", fontFamily: FONTS.bodyBold },
  peekValue: { color: C.text, fontSize: 12, fontWeight: "900", fontFamily: FONTS.bodyHeavy },
  peekHint: { marginLeft: "auto", color: C.textSecondary, fontSize: 11, fontWeight: "800", fontFamily: FONTS.bodyBold },
});

export default function HubScreen() {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const { preferences } = usePreferences();
  const { openSearch } = useSearch();
  const [refreshing, setRefreshing] = useState(false);
  const isWideScreen = screenWidth >= 760;

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 + 84 : insets.bottom + 72;

  const todayDate = (() => {
    const d = new Date();
    return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  })();

  const { data: gamesData, isLoading: gamesLoading, isError: gamesError, refetch: refetchGames } = useQuery({
    queryKey: ["games", todayDate],
    queryFn: () => api.getGames(undefined, todayDate),
    staleTime: 30000,
    refetchInterval: 30000,
    retry: 2,
  });
  const allGames = gamesData?.games ?? [];

  const { data: newsData, isLoading: newsLoading, refetch: refetchNews } = useQuery({
    queryKey: ["news-hub", preferences.favoriteTeams, preferences.favoriteLeagues],
    queryFn: () => api.getNews(preferences.favoriteTeams, preferences.favoriteLeagues),
    staleTime: 60000,
  });

  const myTeams = preferences.favoriteTeams;

  const standingsLeagues = useMemo(
    () => pickHomeStandingsLeagues(preferences.favoriteLeagues, myTeams, allGames),
    [preferences.favoriteLeagues, myTeams, allGames]
  );

  const {
    data: standingsSnapshots,
    isLoading: standingsLoading,
    isError: standingsError,
    refetch: refetchStandings,
  } = useQuery({
    queryKey: ["home-standings", standingsLeagues],
    queryFn: async () => Promise.all(
      standingsLeagues.map(async (league) => {
        const result = await api.getStandings(league);
        return { league, standings: result.standings };
      })
    ),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchGames(), refetchNews(), refetchStandings()]);
    setRefreshing(false);
  }, [refetchGames, refetchNews, refetchStandings]);

  const myTeamGames = myTeams.length > 0
    ? allGames.filter(g => myTeams.includes(g.homeTeam) || myTeams.includes(g.awayTeam))
    : [];
  const finishedGames = myTeamGames.filter(g => g.status === "finished");
  const allLiveGames = allGames.filter(g => g.status === "live");

  const myLive = myTeamGames.filter(g => g.status === "live");
  const heroGames = myLive.length > 0
    ? myLive.slice(0, 3)
    : allLiveGames.length > 0
      ? allLiveGames.slice(0, 3)
      : sortByStatus(myTeamGames).slice(0, 3);

  const articles = newsData?.articles ?? [];
  const isHouston = myTeams.some(t => HOUSTON_TEAMS.includes(t));

  const handleGamePress = (game: Game) => {
    const tab = game.status === "live" ? "gamecast" : game.status === "upcoming" ? "lineups" : "gamecast";
    router.push({ pathname: "/game/[id]", params: { id: game.id, tab } } as any);
  };

  const handleArticlePress = (a: NewsArticle) => {
    router.push({ pathname: "/article/[id]", params: { id: a.id, article: JSON.stringify(a) } } as any);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: topPad, paddingBottom: botPad }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} />}
      >
        {/* ── HEADER ── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={1}>{preferences.name ?? "Champ"}</Text>
              {isHouston && (
                <View style={styles.teamBadge}><Text style={styles.teamBadgeText}>HOU</Text></View>
              )}
            </View>
          </View>
          <View style={styles.headerRight}>
            {preferences.appMode === "nerd" && (
              <View style={styles.nerdBadge}>
                <Ionicons name="analytics-outline" size={13} color={C.accent} />
                <Text style={styles.nerdBadgeText}>NERD</Text>
              </View>
            )}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Search sports, teams, players, and news"
              style={({ pressed }) => [styles.searchButton, pressed && styles.headerButtonPressed]}
              onPress={() => openSearch()}
            >
              <Ionicons name="search" size={22} color={C.text} />
            </Pressable>
            <ProfileButton />
          </View>
        </View>

        {/* ── MY TEAMS COMMAND BAR ── */}
        <View style={styles.section}>
          <MyTeamsStrip myTeams={myTeams} allGames={allGames} />
        </View>

        {/* ── IN ONE BREATH ── */}
        <View style={styles.section}>
          <InOneBreath
            allGames={allGames}
            articles={articles}
            myTeams={myTeams}
            screenWidth={screenWidth}
            isLoading={gamesLoading && newsLoading}
            onGamePress={handleGamePress}
            onArticlePress={handleArticlePress}
          />
        </View>

        {/* ── LIVE GAMES ── */}
        <View style={styles.section}>
          <LiveGamesRail
            allGames={allGames}
            myTeams={myTeams}
            isLoading={gamesLoading}
            isError={gamesError}
            onRetry={refetchGames}
            onGamePress={handleGamePress}
          />
        </View>

        {/* ── FAN PULSE ── */}
        <View style={styles.section}>
          <FanPulseSection
            allGames={allGames}
            articles={articles}
            myTeams={myTeams}
            screenWidth={screenWidth}
            onGamePress={handleGamePress}
            onArticlePress={handleArticlePress}
          />
        </View>

        {/* ── CREATOR SPOTLIGHT ── */}
        <View style={styles.section}>
          <CreatorSpotlightSection screenWidth={screenWidth} />
        </View>

        {/* ── LOWER SNAPSHOT GRID ── */}
        <View style={styles.section}>
          <View style={[styles.lowerGrid, { flexDirection: isWideScreen ? "row" : "column" }]}>
            <View style={styles.lowerGridItem}>
              <StandingsSnapshot
                snapshots={standingsSnapshots ?? []}
                myTeams={myTeams}
                isLoading={standingsLoading}
                isError={standingsError}
                onRetry={refetchStandings}
              />
            </View>
            <View style={styles.lowerGridItem}>
              <LatestNewsPanel articles={articles} isLoading={newsLoading} onArticlePress={handleArticlePress} />
            </View>
          </View>
        </View>

        {/* ── AI RECAPS ── */}
        {finishedGames.length > 0 && (
          <View style={styles.section}>
            <SectionHeading label="AI Recaps" badge={
              <View style={styles.recapBadge}>
                <Ionicons name="sparkles" size={11} color={C.accentGold} />
              </View>
            } />
            <View style={styles.cardList}>
              {finishedGames.slice(0, 2).map(g => <RecapCard key={g.id} game={g} />)}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  scroll: { paddingHorizontal: 16, gap: 0 },

  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingTop: 16, paddingBottom: 16 },
  headerLeft: { flex: 1, minWidth: 0, paddingRight: 10 },
  greeting: { fontSize: 14, color: C.textTertiary, fontFamily: FONTS.body },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 4 },
  name: { flexShrink: 1, color: C.text, fontSize: 30, fontWeight: "900", fontFamily: FONTS.bodyHeavy },
  teamBadge: { backgroundColor: C.accent, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  nerdBadge: {
    minHeight: 34,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: `${C.accent}22`,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${C.accent}55`,
  },
  nerdBadgeText: { color: C.accent, fontSize: 10, fontFamily: FONTS.bodyBold, letterSpacing: 0.5 },
  teamBadgeText: { color: "#fff", fontSize: 11, fontWeight: "900", letterSpacing: 1 },
  headerRight: { flexDirection: "row", alignItems: "center", paddingTop: 18, gap: 10 },
  searchButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.cardElevated,
    borderWidth: 1,
    borderColor: C.cardBorderActive,
    borderRadius: 16,
  },
  headerButtonPressed: { opacity: 0.78 },

  heroSection: { marginHorizontal: -16 },
  heroScroll: { paddingHorizontal: 16 },
  heroDots: { flexDirection: "row", justifyContent: "center", gap: 5, paddingTop: 8 },
  heroDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: C.textTertiary },
  heroDotActive: { width: 16, backgroundColor: C.accent },
  heroContext: {
    flexDirection: "row", alignItems: "center", gap: 5,
    marginHorizontal: 16, marginTop: 6, marginBottom: 2,
  },
  heroContextText: { color: C.accent, fontSize: 12, fontWeight: "600", fontFamily: FONTS.bodySemiBold },

  section: { paddingVertical: 12, gap: 12 },
  lowerGrid: {
    gap: 10,
    alignItems: "stretch",
  },
  lowerGridItem: { flex: 1, minWidth: 0 },
  cardList: { gap: 10 },
  recapBadge: {
    backgroundColor: `${C.accentGold}22`, padding: 4, borderRadius: 8,
    borderWidth: 1, borderColor: `${C.accentGold}40`,
  },
});
