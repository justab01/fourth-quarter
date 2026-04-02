import React, { useState, useCallback, useRef } from "react";
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  Pressable, Platform, Dimensions, FlatList, Animated, ActivityIndicator
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { api } from "@/utils/api";
import type { Game, NewsArticle } from "@/utils/api";
import { usePreferences } from "@/context/PreferencesContext";
import { useSearch } from "@/context/SearchContext";
import { GameCard, TeamLogo } from "@/components/GameCard";
import { NewsCard } from "@/components/NewsCard";
import { RecapCard } from "@/components/RecapCard";
import { GameCardSkeleton, NewsCardSkeleton } from "@/components/LoadingSkeleton";
import { ProfileButton } from "@/components/ProfileButton";
import { goToTeam } from "@/utils/navHelpers";
import { ALL_TEAMS } from "@/constants/allPlayers";
import { isTennisLeague, isCombatLeague, shortAthleteName } from "@/utils/sportArchetype";
import type { AppMode } from "@/context/PreferencesContext";

const C = Colors.dark;
const { width: SCREEN_W } = Dimensions.get("window");

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

// ─── Context line generator ──────────────────────────────────────────────────
function getGameContext(game: Game, myTeams: string[]): string | null {
  const homeScore = game.homeScore ?? 0;
  const awayScore = game.awayScore ?? 0;
  const diff = Math.abs(homeScore - awayScore);
  const isMyTeam = myTeams.includes(game.homeTeam) || myTeams.includes(game.awayTeam);
  const period = game.quarter ?? "";
  const time = game.timeRemaining ?? "";

  const awayShort = shortAthleteName(game.awayTeam);
  const homeShort = shortAthleteName(game.homeTeam);

  // ── Tennis context ─────────────────────────────────────────────────────────
  if (isTennisLeague(game.league)) {
    if (game.status === "live") {
      const setsLeader = homeScore > awayScore ? homeShort : awayScore > homeScore ? awayShort : null;
      if (time) return `🎾 ${awayShort} vs ${homeShort} — ${time} (${period})`;
      if (setsLeader) return `🎾 ${setsLeader} leads ${homeScore}–${awayScore} sets`;
      return `🎾 On serve — ${period}`;
    }
    if (game.status === "upcoming") {
      const d = new Date(game.startTime);
      const t = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
      const now = new Date();
      const minsUntil = Math.floor((d.getTime() - now.getTime()) / 60000);
      if (minsUntil > 0 && minsUntil <= 60) return `🎾 Starting in ${minsUntil}m`;
      return `🎾 ${t}`;
    }
    if (game.status === "finished") {
      const winner = homeScore > awayScore ? homeShort : awayShort;
      return `🎾 ${winner} wins ${homeScore > awayScore ? homeScore : awayScore}–${homeScore > awayScore ? awayScore : homeScore} sets`;
    }
    return null;
  }

  // ── Combat context ─────────────────────────────────────────────────────────
  if (isCombatLeague(game.league)) {
    const emoji = game.league === "BOXING" ? "🥊" : "🥋";
    if (game.status === "live") {
      if (period) return `${emoji} ${period}${time ? ` — ${time}` : ""} · ${awayShort} vs ${homeShort}`;
      return `${emoji} Fight in progress`;
    }
    if (game.status === "upcoming") {
      const d = new Date(game.startTime);
      const t = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
      const now = new Date();
      const minsUntil = Math.floor((d.getTime() - now.getTime()) / 60000);
      if (minsUntil > 0 && minsUntil <= 60) return `${emoji} Card starts in ${minsUntil}m`;
      return `${emoji} Main event at ${t}`;
    }
    if (game.status === "finished") {
      const winner = homeScore > awayScore ? homeShort : homeScore < awayScore ? awayShort : null;
      const method = period && period !== "Final" ? ` by ${period}` : "";
      if (winner) return `${emoji} ${winner} wins${method}`;
      return `${emoji} Decision`;
    }
    return null;
  }

  // ── Team sports context ────────────────────────────────────────────────────
  if (game.status === "live") {
    const leader = homeScore > awayScore ? game.homeTeam : game.awayTeam;
    const leaderShort = leader.split(" ").slice(-1)[0];
    const isOT = period.toLowerCase().includes("ot") || period.toLowerCase().includes("overtime");
    if (isOT) return "⚡ Overtime thriller";
    if (diff <= 3 && (period.includes("4") || period.includes("Q4") || period.includes("9") || period.includes("3rd")))
      return `🔥 Down to the wire — ${diff === 0 ? "tied" : `${leaderShort} up ${diff}`}`;
    if (diff <= 5) return `Tight game — ${leaderShort} leads by ${diff}`;
    if (diff >= 20) return `${leaderShort} in control`;
    if (isMyTeam) return `${time ? time + " left" : period} · ${leaderShort} +${diff}`;
    return null;
  }
  if (game.status === "upcoming") {
    const d = new Date(game.startTime);
    const t = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    const now = new Date();
    const minsUntil = Math.floor((d.getTime() - now.getTime()) / 60000);
    if (minsUntil > 0 && minsUntil <= 60) return `⏰ Tipoff in ${minsUntil}m`;
    return `Starts at ${t}`;
  }
  if (game.status === "finished") {
    if (!isMyTeam) return null;
    const myScore = myTeams.includes(game.homeTeam) ? homeScore : awayScore;
    const oppScore = myTeams.includes(game.homeTeam) ? awayScore : homeScore;
    const won = myScore > oppScore;
    return won ? `✅ Won ${myScore}–${oppScore}` : `Final: Lost ${myScore}–${oppScore}`;
  }
  return null;
}

// ─── Playoff implications ────────────────────────────────────────────────────
const PLAYOFF_MONTHS: Record<string, number[]> = {
  NBA: [2, 3, 4],       // March, April, May (0-indexed)
  NHL: [2, 3, 4],
  MLB: [7, 8, 9],       // August, September, October
  NFL: [9, 10, 11, 12, 0], // Oct-Jan
  MLS: [8, 9, 10],
};

function getPlayoffImplication(game: Game): string | null {
  const now = new Date();
  const month = now.getMonth();
  const lg = game.league as string;
  const months = PLAYOFF_MONTHS[lg];
  if (!months || !months.includes(month)) return null;

  const homeScore = game.homeScore ?? 0;
  const awayScore = game.awayScore ?? 0;

  const implLines: Record<string, string> = {
    NBA: "🏆 Playoff seeding implications",
    NHL: "🏒 Playoff race — every point counts",
    MLB: "⚾ Wild card race implications",
    NFL: "🏈 Playoff push — division stakes",
    MLS: "⚽ Playoff positioning on the line",
  };

  const line = implLines[lg];
  if (!line) return null;

  if (game.status === "live") {
    const diff = Math.abs(homeScore - awayScore);
    if (diff <= 5) return `${line} · One-possession game`;
  }
  return line;
}

// ─── Section heading ──────────────────────────────────────────────────────────
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
  label: { fontSize: 18, fontWeight: "800", color: C.text, fontFamily: "Inter_700Bold", letterSpacing: -0.3 },
  arrowBtn: { flexDirection: "row", alignItems: "center", gap: 1 },
  arrowLabel: { color: C.accent, fontSize: 13, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
});

// ─── My Teams tiles ───────────────────────────────────────────────────────────
function MyTeamsTiles({ myTeams, allGames }: {
  myTeams: string[]; allGames: Game[];
}) {
  if (myTeams.length === 0) return null;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 4 }}>
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
        if (live) statusLine = "● LIVE";
        else if (next) {
          const d = new Date(next.startTime);
          statusLine = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
        } else if (last) {
          const isHome = last.homeTeam === team;
          const my = isHome ? last.homeScore : last.awayScore;
          const opp = isHome ? last.awayScore : last.homeScore;
          const won = (my ?? 0) > (opp ?? 0);
          statusLine = `${won ? "W" : "L"} ${my}–${opp}`;
        }
        const logoUri =
          featured
            ? (featured.homeTeam === team ? featured.homeTeamLogo : featured.awayTeamLogo)
            : allGames.find(g => g.homeTeam === team)?.homeTeamLogo
              ?? allGames.find(g => g.awayTeam === team)?.awayTeamLogo
              ?? null;
        return (
          <Pressable key={team} onPress={() => goToTeam(team, league)} style={tileStyles.tile}>
            <TeamLogo uri={logoUri} name={team} size={60} borderColor={`${color}55`} />
            <Text style={tileStyles.teamShort} numberOfLines={1}>{abbr}</Text>
            {statusLine ? (
              <Text style={[tileStyles.status, live && { color: C.live }]} numberOfLines={1}>{statusLine}</Text>
            ) : null}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const tileStyles = StyleSheet.create({
  tile: { alignItems: "center", gap: 5, width: 68 },
  teamShort: { color: C.text, fontSize: 11, fontWeight: "700", fontFamily: "Inter_700Bold" },
  status: { color: C.textTertiary, fontSize: 10, fontWeight: "600", textAlign: "center" },
});

// ─── For You Section ──────────────────────────────────────────────────────────
interface InsightCard {
  id: string;
  icon: string;
  iconColor: string;
  label: string;
  sublabel: string;
  onPress?: () => void;
  urgent?: boolean;
}

function ForYouSection({ allGames, myTeams }: { allGames: Game[]; myTeams: string[] }) {
  const cards: InsightCard[] = [];

  const myGames = allGames.filter(g => myTeams.includes(g.homeTeam) || myTeams.includes(g.awayTeam));
  const liveAll = allGames.filter(g => g.status === "live");
  const myLive = myGames.filter(g => g.status === "live");
  const myNext = myGames.filter(g => g.status === "upcoming").sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  const myFinished = myGames.filter(g => g.status === "finished");

  myLive.forEach(g => {
    const teamShort = myTeams.find(t => t === g.homeTeam || t === g.awayTeam)?.split(" ").slice(-1)[0] ?? "";
    const score = `${g.awayScore}–${g.homeScore}`;
    const period = g.quarter ?? "Live";
    cards.push({
      id: `live-${g.id}`,
      icon: "radio",
      iconColor: C.live,
      label: `${teamShort} LIVE`,
      sublabel: `${score} · ${period}`,
      onPress: () => router.push({ pathname: "/game/[id]", params: { id: g.id } } as any),
      urgent: true,
    });
  });

  if (myLive.length === 0 && myNext.length > 0) {
    const g = myNext[0];
    const teamShort = myTeams.find(t => t === g.homeTeam || t === g.awayTeam)?.split(" ").slice(-1)[0] ?? "";
    const opp = myTeams.includes(g.homeTeam) ? g.awayTeam.split(" ").slice(-1)[0] : g.homeTeam.split(" ").slice(-1)[0];
    const now = new Date();
    const start = new Date(g.startTime);
    const minsUntil = Math.floor((start.getTime() - now.getTime()) / 60000);
    const timeStr = minsUntil > 0 && minsUntil <= 90 ? `in ${minsUntil}m` : start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    cards.push({
      id: `next-${g.id}`,
      icon: "time-outline",
      iconColor: C.accent,
      label: `${teamShort} vs ${opp}`,
      sublabel: `Starts ${timeStr}`,
      onPress: () => router.push({ pathname: "/game/[id]", params: { id: g.id } } as any),
    });
  }

  myFinished.slice(0, 2).forEach(g => {
    const myTeam = myTeams.find(t => t === g.homeTeam || t === g.awayTeam)!;
    const isHome = g.homeTeam === myTeam;
    const myScore = isHome ? g.homeScore : g.awayScore;
    const oppScore = isHome ? g.awayScore : g.homeScore;
    const won = (myScore ?? 0) > (oppScore ?? 0);
    const teamShort = myTeam.split(" ").slice(-1)[0];
    cards.push({
      id: `result-${g.id}`,
      icon: won ? "checkmark-circle" : "close-circle",
      iconColor: won ? C.accentGreen : C.live,
      label: `${teamShort} ${won ? "won" : "lost"}`,
      sublabel: `${myScore}–${oppScore} final`,
      onPress: () => router.push({ pathname: "/game/[id]", params: { id: g.id } } as any),
    });
  });

  if (liveAll.length > 0) {
    const byLeague: Record<string, number> = {};
    liveAll.forEach(g => { byLeague[g.league] = (byLeague[g.league] ?? 0) + 1; });
    const topLeague = Object.entries(byLeague).sort((a, b) => b[1] - a[1])[0];
    if (topLeague) {
      cards.push({
        id: "league-pulse",
        icon: "pulse",
        iconColor: getLeagueColor(topLeague[0]),
        label: `${topLeague[1]} ${topLeague[0]} games live`,
        sublabel: "Tap to see all scores",
        onPress: () => router.push("/(tabs)/live" as any),
      });
    }
  }

  const now = new Date();
  const month = now.getMonth();
  if (month >= 2 && month <= 4) {
    cards.push({
      id: "season-ctx",
      icon: "trophy-outline",
      iconColor: C.accentGold,
      label: "Playoff race heating up",
      sublabel: "Check standings for latest",
      onPress: () => router.push("/(tabs)/standings" as any),
    });
  }

  if (cards.length === 0) return null;

  return (
    <View style={{ gap: 12 }}>
      <SectionHeading label="For You" accentColor={C.accent} badge={
        <View style={fyStyles.newBadge}><Text style={fyStyles.newText}>NOW</Text></View>
      } />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingRight: 4 }}>
        {cards.map(card => (
          <Pressable key={card.id} style={[fyStyles.card, card.urgent && fyStyles.urgentCard]} onPress={card.onPress}>
            {card.urgent && <View style={fyStyles.urgentGlow} />}
            <View style={[fyStyles.iconBg, { backgroundColor: `${card.iconColor}20` }]}>
              <Ionicons name={card.icon as any} size={18} color={card.iconColor} />
            </View>
            <Text style={fyStyles.label} numberOfLines={1}>{card.label}</Text>
            <Text style={fyStyles.sublabel} numberOfLines={1}>{card.sublabel}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const fyStyles = StyleSheet.create({
  card: {
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.cardBorder,
    padding: 14,
    gap: 6,
    width: 148,
    overflow: "hidden",
  },
  urgentCard: { borderColor: `${C.live}40` },
  urgentGlow: {
    position: "absolute", top: 0, left: 0, right: 0, height: 2,
    backgroundColor: C.live, borderRadius: 1,
  },
  iconBg: {
    width: 34, height: 34, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
  },
  label: { color: C.text, fontSize: 13, fontWeight: "700", fontFamily: "Inter_700Bold" },
  sublabel: { color: C.textTertiary, fontSize: 11, fontFamily: "Inter_400Regular" },
  newBadge: {
    backgroundColor: `${C.accent}22`, paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 6, borderWidth: 1, borderColor: `${C.accent}40`,
  },
  newText: { color: C.accent, fontSize: 9, fontWeight: "900", letterSpacing: 0.8 },
});

// ─── In One Breath ───────────────────────────────────────────────────────────
function InOneBreath() {
  const { data, isLoading } = useQuery({
    queryKey: ["in-one-breath"],
    queryFn: () => api.getInOneBreath(),
    staleTime: 120_000,
    refetchInterval: 120_000,
  });
  const [expanded, setExpanded] = useState(true);

  if (isLoading) {
    return (
      <View style={iobStyles.card}>
        <LinearGradient colors={[`${C.accent}12`, `${C.accentGold}08`, "transparent"]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
        <View style={iobStyles.header}>
          <Ionicons name="sparkles" size={14} color={C.accentGold} />
          <Text style={iobStyles.headerLabel}>IN ONE BREATH</Text>
          <View style={iobStyles.aiBadge}><Text style={iobStyles.aiText}>AI</Text></View>
        </View>
        <ActivityIndicator color={C.accent} size="small" />
      </View>
    );
  }

  if (!data?.summary) return null;

  return (
    <Pressable onPress={() => setExpanded(v => !v)}>
      <View style={iobStyles.card}>
        <LinearGradient colors={[`${C.accent}12`, `${C.accentGold}08`, "transparent"]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
        <View style={iobStyles.header}>
          <Ionicons name="sparkles" size={14} color={C.accentGold} />
          <Text style={iobStyles.headerLabel}>IN ONE BREATH</Text>
          <View style={iobStyles.aiBadge}><Text style={iobStyles.aiText}>AI</Text></View>
          <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={16} color={C.textSecondary} style={{ marginLeft: 4 }} />
        </View>
        {expanded && <Text style={iobStyles.summary}>{data.summary}</Text>}
      </View>
    </Pressable>
  );
}

const iobStyles = StyleSheet.create({
  card: {
    backgroundColor: C.card, borderRadius: 18, padding: 16, gap: 10,
    borderWidth: 1, borderColor: `${C.accentGold}30`, overflow: "hidden",
  },
  header: { flexDirection: "row", alignItems: "center", gap: 7 },
  headerLabel: { color: C.accentGold, fontSize: 10, fontWeight: "900", letterSpacing: 1.5, flex: 1 },
  aiBadge: {
    backgroundColor: `${C.accent}22`, paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 5, borderWidth: 1, borderColor: `${C.accent}40`,
  },
  aiText: { color: C.accent, fontSize: 8, fontWeight: "900", letterSpacing: 0.8 },
  summary: { color: "#AEAEB2", fontSize: 14, lineHeight: 21, fontFamily: "Inter_400Regular" },
});

// ─── Biggest Movers ──────────────────────────────────────────────────────────
function BiggestMovers({ allGames }: { allGames: Game[] }) {
  const liveGames = allGames.filter(g => g.status === "live");
  const closeGames = liveGames.filter(g => Math.abs((g.homeScore ?? 0) - (g.awayScore ?? 0)) <= 5);
  const blowouts = liveGames.filter(g => Math.abs((g.homeScore ?? 0) - (g.awayScore ?? 0)) >= 20);
  const upcomingCount = allGames.filter(g => g.status === "upcoming").length;

  const movers: { icon: string; label: string; detail: string; color: string; onPress?: () => void }[] = [];

  if (closeGames.length > 0) {
    movers.push({
      icon: "flame", label: `${closeGames.length} nail-biter${closeGames.length > 1 ? "s" : ""}`,
      detail: "Games within 5 pts", color: C.live,
      onPress: () => router.push("/(tabs)/live" as any),
    });
  }
  if (blowouts.length > 0) {
    movers.push({ icon: "trending-up", label: `${blowouts.length} blowout${blowouts.length > 1 ? "s" : ""}`, detail: "20+ point leads", color: C.accentGreen });
  }
  if (upcomingCount > 0) {
    movers.push({ icon: "time-outline", label: `${upcomingCount} coming up`, detail: "Still to tip off", color: C.accent });
  }

  if (movers.length === 0) return null;

  return (
    <View style={{ gap: 12 }}>
      <SectionHeading label="Biggest Movers" accentColor={C.accentGold} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
        {movers.map((m, i) => (
          <Pressable key={i} onPress={m.onPress} style={moverStyles.card}>
            <View style={[moverStyles.iconBg, { backgroundColor: `${m.color}18` }]}>
              <Ionicons name={m.icon as any} size={16} color={m.color} />
            </View>
            <Text style={moverStyles.label}>{m.label}</Text>
            <Text style={moverStyles.detail}>{m.detail}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const moverStyles = StyleSheet.create({
  card: { backgroundColor: C.card, borderRadius: 14, padding: 14, gap: 6, borderWidth: 1, borderColor: C.cardBorder, width: 140 },
  iconBg: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  label: { color: C.text, fontSize: 13, fontWeight: "700", fontFamily: "Inter_700Bold" },
  detail: { color: C.textTertiary, fontSize: 11, fontFamily: "Inter_400Regular" },
});

// ─── Tonight's Watchlist ─────────────────────────────────────────────────────
function TonightsWatchlist({ allGames, myTeams }: { allGames: Game[]; myTeams: string[] }) {
  const upcoming = allGames.filter(g => g.status === "upcoming");
  if (upcoming.length === 0) return null;

  const RIVAL_PAIRS = [
    ["Los Angeles Lakers", "Boston Celtics"], ["New York Yankees", "Boston Red Sox"],
    ["Real Madrid", "FC Barcelona"], ["Manchester United", "Manchester City"],
    ["Dallas Cowboys", "Philadelphia Eagles"], ["Chicago Cubs", "St. Louis Cardinals"],
  ];

  const scored = upcoming.map(g => {
    let score = 0;
    if (myTeams.includes(g.homeTeam) || myTeams.includes(g.awayTeam)) score += 10;
    if (RIVAL_PAIRS.some(([a, b]) => (g.homeTeam === a && g.awayTeam === b) || (g.homeTeam === b && g.awayTeam === a))) score += 8;
    if (["NBA", "NFL", "EPL", "UCL"].includes(g.league)) score += 3;
    return { game: g, score };
  }).sort((a, b) => b.score - a.score).slice(0, 4);

  return (
    <View style={{ gap: 12 }}>
      <SectionHeading label="Tonight's Watchlist" accentColor={C.accent} badge={
        <View style={watchlistStyles.badge}>
          <Ionicons name="eye" size={10} color={C.accent} />
          <Text style={watchlistStyles.badgeText}>CURATED</Text>
        </View>
      } />
      <View style={watchlistStyles.list}>
        {scored.map(({ game }, idx) => {
          const startTime = new Date(game.startTime).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
          const isMy = myTeams.includes(game.homeTeam) || myTeams.includes(game.awayTeam);
          return (
            <Pressable key={game.id} onPress={() => router.push({ pathname: "/game/[id]", params: { id: game.id } } as any)}>
              <View style={watchlistStyles.row}>
                {idx > 0 && <View style={watchlistStyles.divider} />}
                <View style={watchlistStyles.rowInner}>
                  <View style={watchlistStyles.timeCol}>
                    <Text style={watchlistStyles.time}>{startTime}</Text>
                    <Text style={watchlistStyles.league}>{game.league}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={watchlistStyles.matchup} numberOfLines={1}>
                      {game.awayTeam.split(" ").slice(-1)[0]} @ {game.homeTeam.split(" ").slice(-1)[0]}
                    </Text>
                    {isMy && <Text style={watchlistStyles.myTag}>Your team</Text>}
                  </View>
                  <Ionicons name="chevron-forward" size={14} color={C.textTertiary} />
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const watchlistStyles = StyleSheet.create({
  badge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: `${C.accent}15`, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  badgeText: { color: C.accent, fontSize: 8, fontWeight: "900", letterSpacing: 0.6 },
  list: { backgroundColor: C.card, borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: C.cardBorder },
  row: {},
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: C.separator, marginHorizontal: 14 },
  rowInner: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 12, gap: 12 },
  timeCol: { alignItems: "center", width: 50 },
  time: { color: C.text, fontSize: 13, fontWeight: "700", fontFamily: "Inter_700Bold" },
  league: { color: C.textTertiary, fontSize: 10, fontWeight: "600" },
  matchup: { color: C.textSecondary, fontSize: 14, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  myTag: { color: C.accent, fontSize: 10, fontWeight: "700", marginTop: 2 },
});

// ─── League Pulse ─────────────────────────────────────────────────────────────
const LEAGUE_EMOJIS: Record<string, string> = {
  NBA: "🏀", NFL: "🏈", MLB: "⚾", MLS: "⚽", NHL: "🏒",
  WNBA: "🏀", NCAAB: "🎓", EPL: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", UCL: "⭐", LIGA: "🇪🇸",
};

function LeaguePulse({ allGames }: { allGames: Game[] }) {
  const leagueMap: Record<string, Game[]> = {};
  allGames.forEach(g => {
    if (!leagueMap[g.league]) leagueMap[g.league] = [];
    leagueMap[g.league].push(g);
  });

  const leagueOrder = ["NBA", "NHL", "NFL", "MLB", "NCAAB", "MLS", "EPL", "UCL", "LIGA", "WNBA"];
  const pulseItems = leagueOrder
    .filter(l => leagueMap[l]?.length > 0)
    .map(l => ({
      league: l,
      games: leagueMap[l],
      liveCount: leagueMap[l].filter(g => g.status === "live").length,
      topGame: leagueMap[l].find(g => g.status === "live") ?? leagueMap[l].find(g => g.status === "upcoming") ?? leagueMap[l][0],
    }))
    .slice(0, 6);

  if (pulseItems.length === 0) return null;

  return (
    <View style={{ gap: 12 }}>
      <SectionHeading label="League Pulse" accentColor={C.textTertiary} onSeeAll={() => router.push("/(tabs)/live" as any)} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingRight: 4 }}>
        {pulseItems.map(({ league, liveCount, topGame, games }) => {
          const color = getLeagueColor(league);
          const emoji = LEAGUE_EMOJIS[league] ?? "🏆";
          const homeAbbr = topGame.homeTeam.split(" ").slice(-1)[0].substring(0, 3).toUpperCase();
          const awayAbbr = topGame.awayTeam.split(" ").slice(-1)[0].substring(0, 3).toUpperCase();
          const isLive = topGame.status === "live";
          const statusText = isLive
            ? `${topGame.awayScore}–${topGame.homeScore}`
            : topGame.status === "upcoming"
              ? new Date(topGame.startTime).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
              : `Final`;
          return (
            <Pressable
              key={league}
              style={pulseStyles.card}
              onPress={() => router.push("/(tabs)/live" as any)}
            >
              <View style={[pulseStyles.topBar, { backgroundColor: color }]} />
              <View style={pulseStyles.header}>
                <Text style={pulseStyles.emoji}>{emoji}</Text>
                <Text style={[pulseStyles.leagueName, { color }]}>{league}</Text>
                {liveCount > 0 && (
                  <View style={pulseStyles.livePill}>
                    <View style={pulseStyles.liveDot} />
                    <Text style={pulseStyles.liveText}>{liveCount}</Text>
                  </View>
                )}
              </View>
              <Text style={pulseStyles.matchup} numberOfLines={1}>{awayAbbr} vs {homeAbbr}</Text>
              <Text style={[pulseStyles.score, isLive && { color: C.text }]}>{statusText}</Text>
              {games.length > 1 && (
                <Text style={pulseStyles.more}>+{games.length - 1} more</Text>
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const pulseStyles = StyleSheet.create({
  card: {
    backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.cardBorder,
    padding: 12, width: 120, gap: 4, overflow: "hidden",
  },
  topBar: { position: "absolute", top: 0, left: 0, right: 0, height: 2 },
  header: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 },
  emoji: { fontSize: 13 },
  leagueName: { fontSize: 11, fontWeight: "900", letterSpacing: 0.5, flex: 1 },
  livePill: {
    flexDirection: "row", alignItems: "center", gap: 3,
    backgroundColor: `${C.live}22`, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 5,
  },
  liveDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: C.live },
  liveText: { color: C.live, fontSize: 9, fontWeight: "900" },
  matchup: { color: C.textSecondary, fontSize: 12, fontWeight: "600", marginTop: 4 },
  score: { color: C.textTertiary, fontSize: 14, fontWeight: "800", fontFamily: "Inter_700Bold" },
  more: { color: C.textTertiary, fontSize: 10 },
});

// ─── Sport tab pill ───────────────────────────────────────────────────────────
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

// ─── Today's Games widget ─────────────────────────────────────────────────────
function TodaysGamesWidget({ allGames, myTeams, onGamePress, isLoading, isError, onRetry }: {
  allGames: Game[]; myTeams: string[]; onGamePress: (g: Game) => void;
  isLoading: boolean; isError: boolean; onRetry: () => void;
}) {
  const getDefaultSport = (): SportKey => {
    for (const s of SPORTS) {
      if (allGames.some(g => g.league === s && g.status === "live")) return s;
    }
    for (const s of SPORTS) {
      if (allGames.some(g => g.league === s)) return s;
    }
    return "NBA";
  };
  const [activeSport, setActiveSport] = useState<SportKey>(getDefaultSport);
  const sportGames = allGames.filter(g => g.league === activeSport);
  const favGames = sortByStatus(sportGames.filter(g => myTeams.includes(g.homeTeam) || myTeams.includes(g.awayTeam)));
  const favSet = new Set(favGames.map(g => g.id));
  const topGames = sportGames.filter(g => !favSet.has(g.id))
    .sort((a, b) => STATUS_RANK[a.status] - STATUS_RANK[b.status]).slice(0, 5);
  const sportColor = SPORT_COLOR[activeSport];

  return (
    <View style={{ gap: 0 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 14, paddingRight: 4 }}>
        {SPORTS.map(s => (
          <SportTab key={s} sport={s} active={s === activeSport}
            liveCount={allGames.filter(g => g.league === s && g.status === "live").length}
            totalCount={allGames.filter(g => g.league === s).length}
            onPress={() => setActiveSport(s)} />
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
        <View style={{ gap: 16 }}>
          {favGames.length > 0 && (
            <View style={{ gap: 10 }}>
              <SectionHeading label="My Teams" accentColor={sportColor} />
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
          {topGames.length > 0 && (
            <View style={{ gap: 10 }}>
              <SectionHeading label="Around the League" />
              <FlatList horizontal data={topGames} keyExtractor={g => g.id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 12, paddingRight: 20 }}
                renderItem={({ item }) => (
                  <View style={{ width: 172 }}>
                    <GameCard game={item} variant="compact"
                      isFavorite={myTeams.includes(item.homeTeam) || myTeams.includes(item.awayTeam)}
                      onPress={() => onGamePress(item)} />
                  </View>
                )} />
            </View>
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
  emptyText: { color: C.textTertiary, fontSize: 14, fontFamily: "Inter_400Regular" },
  groupedList: {
    backgroundColor: C.card, borderRadius: 16, overflow: "hidden",
    borderWidth: 1, borderColor: C.cardBorder,
  },
  rowDivider: { height: StyleSheet.hairlineWidth, backgroundColor: C.separator, marginLeft: 70 },
  contextBanner: {
    paddingHorizontal: 14, paddingTop: 8, paddingBottom: 2,
  },
  contextText: {
    fontSize: 11, color: C.accent, fontWeight: "700", fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.1,
  },
});

// ─── Story Cluster ────────────────────────────────────────────────────────────
const TOPIC_KEYWORDS: Array<{ label: string; keywords: string[]; color: string; icon: string }> = [
  { label: "NBA", keywords: ["nba", "basketball", "celtics", "lakers", "warriors", "heat", "bucks", "nets", "sixers", "knicks", "rockets", "suns"], color: C.nba, icon: "🏀" },
  { label: "NFL", keywords: ["nfl", "football", "chiefs", "eagles", "cowboys", "patriots", "texans", "49ers", "packers", "bears"], color: C.nfl, icon: "🏈" },
  { label: "MLB", keywords: ["mlb", "baseball", "yankees", "dodgers", "astros", "red sox", "cubs", "mets", "giants"], color: C.mlb, icon: "⚾" },
  { label: "MLS", keywords: ["mls", "soccer", "dynamo", "galaxy", "fire", "united"], color: C.mls, icon: "⚽" },
  { label: "Trade & Injuries", keywords: ["trade", "injury", "injured", "surgery", "signing", "waived", "contract", "deal"], color: C.accentGold, icon: "💼" },
  { label: "Playoffs", keywords: ["playoff", "postseason", "series", "championship", "finals", "seed", "elimination", "bracket", "march madness"], color: C.accentGreen, icon: "🏆" },
];

function getArticleTopic(article: NewsArticle): { label: string; color: string; icon: string } | null {
  const text = `${article.title} ${article.summary ?? ""}`.toLowerCase();
  for (const topic of TOPIC_KEYWORDS) {
    if (topic.keywords.some(kw => text.includes(kw))) {
      return { label: topic.label, color: topic.color, icon: topic.icon };
    }
  }
  return null;
}

function StoryClusters({ articles, onArticlePress }: { articles: NewsArticle[]; onArticlePress: (a: NewsArticle) => void }) {
  const clustered: Record<string, { articles: NewsArticle[]; color: string; icon: string }> = {};
  const unclustered: NewsArticle[] = [];

  articles.forEach(a => {
    const topic = getArticleTopic(a);
    if (topic) {
      if (!clustered[topic.label]) clustered[topic.label] = { articles: [], color: topic.color, icon: topic.icon };
      clustered[topic.label].articles.push(a);
    } else {
      unclustered.push(a);
    }
  });

  const clusterList = Object.entries(clustered)
    .filter(([, v]) => v.articles.length >= 1)
    .sort(([, a], [, b]) => b.articles.length - a.articles.length)
    .slice(0, 4);

  if (clusterList.length === 0) return null;

  return (
    <View style={{ gap: 12 }}>
      <SectionHeading label="Stories" onSeeAll={() => router.push("/(tabs)/news" as any)} />
      {clusterList.map(([topic, { articles: arts, color, icon }]) => (
        <View key={topic} style={clusterStyles.cluster}>
          <View style={[clusterStyles.clusterHeader, { borderLeftColor: color }]}>
            <Text style={clusterStyles.clusterIcon}>{icon}</Text>
            <Text style={[clusterStyles.clusterLabel, { color }]}>{topic}</Text>
            <Text style={clusterStyles.clusterCount}>{arts.length} stories</Text>
          </View>
          {arts.slice(0, 2).map(a => (
            <Pressable key={a.id} style={clusterStyles.storyRow} onPress={() => onArticlePress(a)}>
              <View style={clusterStyles.storyDot} />
              <Text style={clusterStyles.storyTitle} numberOfLines={2}>{a.title}</Text>
              <Ionicons name="chevron-forward" size={12} color={C.textTertiary} />
            </Pressable>
          ))}
        </View>
      ))}
    </View>
  );
}

const clusterStyles = StyleSheet.create({
  cluster: {
    backgroundColor: C.card, borderRadius: 16, overflow: "hidden",
    borderWidth: 1, borderColor: C.cardBorder,
  },
  clusterHeader: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 14, paddingVertical: 10,
    borderLeftWidth: 3,
    backgroundColor: "rgba(255,255,255,0.02)",
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.separator,
  },
  clusterIcon: { fontSize: 14 },
  clusterLabel: { fontSize: 13, fontWeight: "800", fontFamily: "Inter_700Bold", flex: 1 },
  clusterCount: { color: C.textTertiary, fontSize: 11 },
  storyRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.separator,
  },
  storyDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: C.textTertiary, flexShrink: 0 },
  storyTitle: { flex: 1, color: C.textSecondary, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
});

// ─── Main Hub screen ──────────────────────────────────────────────────────────
export default function HubScreen() {
  const insets = useSafeAreaInsets();
  const { preferences } = usePreferences();
  const { openSearch } = useSearch();
  const [refreshing, setRefreshing] = useState(false);
  const [heroDot, setHeroDot] = useState(0);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 + 84 : insets.bottom + 72;

  const { data: gamesData, isLoading: gamesLoading, isError: gamesError, refetch: refetchGames } = useQuery({
    queryKey: ["games"],
    queryFn: () => api.getGames(),
    staleTime: 30000,
    refetchInterval: 30000,
    retry: 2,
  });

  const { data: newsData, isLoading: newsLoading, refetch: refetchNews } = useQuery({
    queryKey: ["news-hub", preferences.favoriteTeams, preferences.favoriteLeagues],
    queryFn: () => api.getNews(preferences.favoriteTeams, preferences.favoriteLeagues),
    staleTime: 60000,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchGames(), refetchNews()]);
    setRefreshing(false);
  }, [refetchGames, refetchNews]);

  const allGames = gamesData?.games ?? [];
  const myTeams = preferences.favoriteTeams;
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
  const heroArticle = articles[0];
  const restArticles = articles.slice(1, 10);
  const isHouston = myTeams.some(t => HOUSTON_TEAMS.includes(t));

  const handleGamePress = (game: Game) => {
    router.push({ pathname: "/game/[id]", params: { id: game.id } } as any);
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
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{preferences.name ?? "Champ"}</Text>
              {isHouston && (
                <View style={styles.teamBadge}><Text style={styles.teamBadgeText}>HOU</Text></View>
              )}
            </View>
          </View>
          <View style={styles.headerRight}>
            <Pressable style={styles.searchPill} onPress={() => openSearch()}>
              <Ionicons name="search" size={14} color={C.accent} />
              <Text style={styles.searchPillText}>Search</Text>
            </Pressable>
            <ProfileButton />
          </View>
        </View>

        {/* IN ONE BREATH */}
        <View style={styles.section}>
          <InOneBreath />
        </View>

        {/* HERO BANNER */}
        {heroGames.length > 0 && !gamesLoading && (
          <View style={styles.heroSection}>
            <ScrollView
              horizontal pagingEnabled showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={e => {
                const idx = Math.round(e.nativeEvent.contentOffset.x / (SCREEN_W - 40));
                setHeroDot(idx);
              }}
              style={styles.heroScroll}
              snapToInterval={SCREEN_W - 40}
              decelerationRate="fast"
            >
              {heroGames.map(game => {
                const ctx = getGameContext(game, myTeams);
                const playoff = getPlayoffImplication(game);
                return (
                  <View key={game.id} style={{ width: SCREEN_W - 40, gap: 6 }}>
                    <GameCard game={game} variant="hero" onPress={() => handleGamePress(game)} />
                    {ctx && (
                      <View style={styles.heroContext}>
                        <Ionicons name="information-circle" size={12} color={C.accent} />
                        <Text style={styles.heroContextText}>{ctx}</Text>
                      </View>
                    )}
                    {playoff && (
                      <View style={[styles.heroContext, { borderColor: `${C.accentGold}40`, backgroundColor: `${C.accentGold}10` }]}>
                        <Ionicons name="trophy" size={12} color={C.accentGold} />
                        <Text style={[styles.heroContextText, { color: C.accentGold }]}>{playoff}</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </ScrollView>
            {heroGames.length > 1 && (
              <View style={styles.heroDots}>
                {heroGames.map((_, i) => (
                  <View key={i} style={[styles.heroDot, i === heroDot && styles.heroDotActive]} />
                ))}
              </View>
            )}
          </View>
        )}

        {/* FOR YOU */}
        {!gamesLoading && allGames.length > 0 && (
          <View style={styles.section}>
            <ForYouSection allGames={allGames} myTeams={myTeams} />
          </View>
        )}

        {/* MY TEAMS */}
        {myTeams.length > 0 && (
          <View style={styles.section}>
            <SectionHeading label="My Teams" accentColor={C.accent} />
            <MyTeamsTiles myTeams={myTeams} allGames={allGames} />
          </View>
        )}

        {/* BIGGEST MOVERS */}
        {!gamesLoading && allGames.length > 0 && (
          <View style={styles.section}>
            <BiggestMovers allGames={allGames} />
          </View>
        )}

        {/* TONIGHT'S WATCHLIST */}
        {!gamesLoading && allGames.length > 0 && (
          <View style={styles.section}>
            <TonightsWatchlist allGames={allGames} myTeams={myTeams} />
          </View>
        )}

        {/* TODAY'S GAMES */}
        <View style={styles.section}>
          <SectionHeading label="Today's Games" accentColor={C.accent}
            onSeeAll={() => router.push("/(tabs)/live" as any)} />
          <TodaysGamesWidget
            allGames={allGames} myTeams={myTeams}
            onGamePress={handleGamePress}
            isLoading={gamesLoading} isError={gamesError} onRetry={refetchGames}
          />
        </View>

        {/* LEAGUE PULSE */}
        {!gamesLoading && allGames.length > 0 && (
          <View style={styles.section}>
            <LeaguePulse allGames={allGames} />
          </View>
        )}

        {/* TOP STORY */}
        {!newsLoading && heroArticle && (
          <View style={styles.section}>
            <SectionHeading label="Top Story" accentColor={C.nba} />
            <NewsCard article={heroArticle} hero onPress={() => handleArticlePress(heroArticle)} />
          </View>
        )}

        {/* STORY CLUSTERS */}
        {restArticles.length > 0 && !newsLoading && (
          <View style={styles.section}>
            <StoryClusters articles={restArticles} onArticlePress={handleArticlePress} />
          </View>
        )}

        {/* AI RECAPS */}
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
  scroll: { paddingHorizontal: 20, gap: 4 },

  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingTop: 16, paddingBottom: 20 },
  greeting: { fontSize: 14, color: C.textTertiary, fontFamily: "Inter_400Regular" },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 4 },
  name: { fontSize: 30, fontWeight: "900", color: C.text, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  teamBadge: { backgroundColor: C.accent, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  teamBadgeText: { color: "#fff", fontSize: 11, fontWeight: "900", letterSpacing: 1 },
  headerRight: { flexDirection: "row", alignItems: "center", paddingTop: 18, gap: 10 },
  searchPill: {
    flexDirection: "row", alignItems: "center", gap: 7,
    backgroundColor: C.card, borderWidth: 1.5, borderColor: `${C.accent}55`,
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 22,
  },
  searchPillText: { color: C.accent, fontSize: 13, fontWeight: "700", fontFamily: "Inter_600SemiBold" },
  livePill: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: C.live, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10,
  },
  headerDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#fff" },
  livePillText: { color: "#fff", fontSize: 11, fontWeight: "900", letterSpacing: 0.3 },

  heroSection: { marginHorizontal: -20 },
  heroScroll: { paddingHorizontal: 20 },
  heroDots: { flexDirection: "row", justifyContent: "center", gap: 5, paddingTop: 8 },
  heroDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: C.textTertiary },
  heroDotActive: { width: 16, backgroundColor: C.accent },
  heroContext: {
    flexDirection: "row", alignItems: "center", gap: 5,
    marginHorizontal: 20, marginTop: 6, marginBottom: 2,
  },
  heroContextText: { color: C.accent, fontSize: 12, fontWeight: "600", fontFamily: "Inter_600SemiBold" },

  section: { paddingVertical: 14, gap: 12 },
  cardList: { gap: 10 },
  recapBadge: {
    backgroundColor: `${C.accentGold}22`, padding: 4, borderRadius: 8,
    borderWidth: 1, borderColor: `${C.accentGold}40`,
  },
});
