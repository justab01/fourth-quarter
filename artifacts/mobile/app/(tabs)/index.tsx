import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  Pressable, Platform, Dimensions, FlatList, ActivityIndicator
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
import { GameCardSkeleton } from "@/components/LoadingSkeleton";
import { ProfileButton } from "@/components/ProfileButton";
import { goToTeam } from "@/utils/navHelpers";
import { ALL_TEAMS } from "@/constants/allPlayers";
import { isTennisLeague, isCombatLeague, shortAthleteName } from "@/utils/sportArchetype";

const C = Colors.dark;
const { width: SCREEN_W } = Dimensions.get("window");

function getTeamEspnLogoUrl(teamName: string, league: string): string | null {
  const team = ALL_TEAMS.find(t => t.name === teamName);
  if (!team?.abbr) return null;
  const abbr = team.abbr.toLowerCase();
  const sportMap: Record<string, string> = {
    NBA: "nba", NFL: "nfl", MLB: "mlb", NHL: "nhl",
    WNBA: "wnba", NCAAB: "mens-college-basketball",
    MLS: "soccer", EPL: "soccer", UCL: "soccer", LIGA: "soccer",
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

function InOneBreath() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["in-one-breath"],
    queryFn: () => api.getInOneBreath(),
    staleTime: 120_000,
    refetchInterval: 120_000,
  });
  const [expanded, setExpanded] = useState(true);

  const header = (
    <View style={iobStyles.header}>
      <Ionicons name="sparkles" size={14} color={C.accentGold} />
      <Text style={iobStyles.headerLabel}>IN ONE BREATH</Text>
      <View style={iobStyles.aiBadge}><Text style={iobStyles.aiText}>AI</Text></View>
      {isLoading
        ? <ActivityIndicator color={C.accent} size="small" style={{ marginLeft: 4 }} />
        : <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={16} color={C.textSecondary} style={{ marginLeft: 4 }} />
      }
    </View>
  );

  if (isLoading) {
    return (
      <View style={iobStyles.card}>
        <LinearGradient colors={[`${C.accent}12`, `${C.accentGold}08`, "transparent"]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
        {header}
        <View style={iobStyles.shimmerWrap}>
          {[100, 90, 95, 75].map((w, i) => (
            <View key={i} style={[iobStyles.shimmerLine, { width: `${w}%` }]} />
          ))}
        </View>
      </View>
    );
  }

  return (
    <Pressable onPress={() => setExpanded(v => !v)} style={iobStyles.card}>
      <LinearGradient colors={[`${C.accent}12`, `${C.accentGold}08`, "transparent"]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
      {header}
      {expanded && (
        data?.summary
          ? <Text style={iobStyles.summary}>{data.summary}</Text>
          : <Pressable onPress={() => refetch()} style={iobStyles.retryRow}>
              <Ionicons name="refresh" size={13} color={C.accent} />
              <Text style={iobStyles.retryText}>Tap to refresh</Text>
            </Pressable>
      )}
    </Pressable>
  );
}

const iobStyles = StyleSheet.create({
  card: {
    backgroundColor: C.card, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, gap: 10,
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
  shimmerWrap: { gap: 7 },
  shimmerLine: { height: 12, backgroundColor: "rgba(255,255,255,0.07)", borderRadius: 6 },
  retryRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  retryText: { color: C.accent, fontSize: 13, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
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
  chipText: { fontSize: 11, fontWeight: "700", fontFamily: "Inter_600SemiBold" },
});

function MyTeamsStrip({ myTeams, allGames }: { myTeams: string[]; allGames: Game[] }) {
  if (myTeams.length === 0) return null;
  return (
    <View style={{ gap: 10 }}>
      <SectionHeading label="My Teams" accentColor={C.accent} />
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
            <Pressable key={team} onPress={() => goToTeam(team, league)} style={tileStyles.tile}>
              <TeamLogo uri={logoUri} name={team} size={52} borderColor={`${color}55`} />
              <Text style={tileStyles.teamShort} numberOfLines={1}>{abbr}</Text>
              {statusLine ? (
                <Text style={[tileStyles.status, { color: statusColor }]} numberOfLines={1}>{statusLine}</Text>
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const tileStyles = StyleSheet.create({
  tile: { alignItems: "center", gap: 4, width: 62 },
  teamShort: { color: C.text, fontSize: 11, fontWeight: "700", fontFamily: "Inter_700Bold" },
  status: { fontSize: 10, fontWeight: "600", textAlign: "center" },
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
    if (period.includes("ot") || period.includes("overtime")) return true;
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
  emptyText: { color: C.textTertiary, fontSize: 14, fontFamily: "Inter_400Regular" },
  groupedList: {
    backgroundColor: C.card, borderRadius: 16, overflow: "hidden",
    borderWidth: 1, borderColor: C.cardBorder,
  },
  rowDivider: { height: StyleSheet.hairlineWidth, backgroundColor: C.separator, marginLeft: 70 },
  contextBanner: { paddingHorizontal: 14, paddingTop: 8, paddingBottom: 2 },
  contextText: {
    fontSize: 11, color: C.accent, fontWeight: "700", fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.1,
  },
});

const DRAFT_SEASONS: Record<string, [number, number]> = {
  NFL: [3, 5], NBA: [5, 7], NHL: [6, 7], MLB: [6, 8],
};

function isDraftRelevant(): boolean {
  const month = new Date().getMonth() + 1;
  return Object.values(DRAFT_SEASONS).some(([start, end]) => month >= start && month <= end);
}

function DraftBar() {
  if (!isDraftRelevant()) return null;
  return (
    <View style={draftStyles.bar}>
      <LinearGradient
        colors={[`${C.accentGold}18`, `${C.accentGold}06`]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
      />
      <Ionicons name="trophy" size={16} color={C.accentGold} />
      <Text style={draftStyles.barLabel}>Draft Center</Text>
      <View style={{ flex: 1 }} />
      <View style={draftStyles.leagueRow}>
        {["NFL", "NBA", "NHL", "MLB"].map(l => (
          <Pressable
            key={l}
            onPress={() => router.push(`/draft/${l}` as any)}
            style={draftStyles.leaguePill}
          >
            <Text style={[draftStyles.leaguePillText, { color: getLeagueColor(l) }]}>{l}</Text>
          </Pressable>
        ))}
      </View>
      <Ionicons name="chevron-forward" size={14} color={C.textTertiary} />
    </View>
  );
}

const draftStyles = StyleSheet.create({
  bar: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: C.card, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12,
    borderWidth: 1, borderColor: `${C.accentGold}25`, overflow: "hidden",
  },
  barLabel: { color: C.text, fontSize: 14, fontWeight: "700", fontFamily: "Inter_700Bold" },
  leagueRow: { flexDirection: "row", gap: 6 },
  leaguePill: {
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  leaguePillText: { fontSize: 10, fontWeight: "900", letterSpacing: 0.5 },
});

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

function Headlines({ articles, onArticlePress }: { articles: NewsArticle[]; onArticlePress: (a: NewsArticle) => void }) {
  if (articles.length === 0) return null;

  const heroArticle = articles[0];
  const rest = articles.slice(1, 8);

  const clustered: Record<string, { articles: NewsArticle[]; color: string; icon: string }> = {};
  const unclustered: NewsArticle[] = [];
  rest.forEach(a => {
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
    .slice(0, 3);

  return (
    <View style={{ gap: 12 }}>
      <SectionHeading label="Headlines" accentColor={C.nba} onSeeAll={() => router.push("/(tabs)/news" as any)} />
      <NewsCard article={heroArticle} hero onPress={() => onArticlePress(heroArticle)} />
      {clusterList.map(([topic, { articles: arts, color, icon }]) => (
        <View key={topic} style={clusterStyles.cluster}>
          <View style={[clusterStyles.clusterHeader, { borderLeftColor: color }]}>
            <Text style={clusterStyles.clusterIcon}>{icon}</Text>
            <Text style={[clusterStyles.clusterLabel, { color }]}>{topic}</Text>
            <Text style={clusterStyles.clusterCount}>{arts.length}</Text>
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
      {unclustered.slice(0, 3).map(a => (
        <Pressable key={a.id} style={clusterStyles.storyRow} onPress={() => onArticlePress(a)}>
          <View style={clusterStyles.storyDot} />
          <Text style={clusterStyles.storyTitle} numberOfLines={2}>{a.title}</Text>
          <Ionicons name="chevron-forward" size={12} color={C.textTertiary} />
        </Pressable>
      ))}
    </View>
  );
}

const clusterStyles = StyleSheet.create({
  cluster: {
    backgroundColor: C.card, borderRadius: 14, overflow: "hidden",
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

export default function HubScreen() {
  const insets = useSafeAreaInsets();
  const { preferences } = usePreferences();
  const { openSearch } = useSearch();
  const [refreshing, setRefreshing] = useState(false);
  const [heroDot, setHeroDot] = useState(0);

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

  const { data: newsData, isLoading: newsLoading, refetch: refetchNews } = useQuery({
    queryKey: ["news-hub", preferences.favoriteTeams, preferences.favoriteLeagues],
    queryFn: () => api.getNews(preferences.favoriteTeams, preferences.favoriteLeagues),
    staleTime: 60000,
  });

  const { refetch: refetchIOB } = useQuery({
    queryKey: ["in-one-breath"],
    queryFn: () => api.getInOneBreath(),
    staleTime: 120_000,
    refetchInterval: 120_000,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchGames(), refetchNews(), refetchIOB()]);
    setRefreshing(false);
  }, [refetchGames, refetchNews, refetchIOB]);

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
            {preferences.appMode === "nerd" && (
              <View style={styles.nerdBadge}>
                <Text style={styles.nerdBadgeText}>⚡ NERD</Text>
              </View>
            )}
            <Pressable style={styles.searchPill} onPress={() => openSearch()}>
              <Ionicons name="search" size={14} color={C.accent} />
              <Text style={styles.searchPillText}>Search</Text>
            </Pressable>
            <ProfileButton />
          </View>
        </View>

        {/* ── IN ONE BREATH (collapsed by default) ── */}
        <View style={styles.section}>
          <InOneBreath />
        </View>

        {/* ── HERO BANNER + MOVERS CHIPS ── */}
        {heroGames.length > 0 && !gamesLoading && (
          <View style={styles.heroSection}>
            <ScrollView
              horizontal pagingEnabled showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={e => {
                const idx = Math.round(e.nativeEvent.contentOffset.x / (SCREEN_W - 32));
                setHeroDot(idx);
              }}
              style={styles.heroScroll}
              snapToInterval={SCREEN_W - 32}
              decelerationRate="fast"
            >
              {heroGames.map(game => {
                const ctx = getGameContext(game, myTeams);
                return (
                  <View key={game.id} style={{ width: SCREEN_W - 32, gap: 6 }}>
                    <GameCard game={game} variant="hero" onPress={() => handleGamePress(game)} />
                    {ctx && (
                      <View style={styles.heroContext}>
                        <Ionicons name="information-circle" size={12} color={C.accent} />
                        <Text style={styles.heroContextText}>{ctx}</Text>
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
            <View style={{ paddingHorizontal: 16, paddingTop: 6 }}>
              <MoversChips allGames={allGames} />
            </View>
          </View>
        )}

        {/* ── MY TEAMS STRIP ── */}
        {myTeams.length > 0 && (
          <View style={styles.section}>
            <MyTeamsStrip myTeams={myTeams} allGames={allGames} />
          </View>
        )}

        {/* ── TODAY'S GAMES (with sport tabs, includes all games — no separate Watchlist/LeaguePulse) ── */}
        <View style={styles.section}>
          <SectionHeading label="Today's Games" accentColor={C.accent}
            onSeeAll={() => router.push("/(tabs)/live" as any)} />
          <TodaysGamesWidget
            allGames={allGames} myTeams={myTeams}
            onGamePress={handleGamePress}
            isLoading={gamesLoading} isError={gamesError} onRetry={refetchGames}
          />
        </View>

        {/* ── DRAFT BAR (compact single row, conditional on draft season) ── */}
        {isDraftRelevant() && (
          <View style={styles.section}>
            <DraftBar />
          </View>
        )}

        {/* ── HEADLINES (merged Top Story + Story Clusters) ── */}
        {!newsLoading && articles.length > 0 && (
          <View style={styles.section}>
            <Headlines articles={articles} onArticlePress={handleArticlePress} />
          </View>
        )}

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
  greeting: { fontSize: 14, color: C.textTertiary, fontFamily: "Inter_400Regular" },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 4 },
  name: { fontSize: 30, fontWeight: "900", color: C.text, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  teamBadge: { backgroundColor: C.accent, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  nerdBadge: { backgroundColor: `${C.accent}22`, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: `${C.accent}55` },
  nerdBadgeText: { color: C.accent, fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 0.5 },
  teamBadgeText: { color: "#fff", fontSize: 11, fontWeight: "900", letterSpacing: 1 },
  headerRight: { flexDirection: "row", alignItems: "center", paddingTop: 18, gap: 10 },
  searchPill: {
    flexDirection: "row", alignItems: "center", gap: 7,
    backgroundColor: C.card, borderWidth: 1.5, borderColor: `${C.accent}55`,
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 22,
  },
  searchPillText: { color: C.accent, fontSize: 13, fontWeight: "700", fontFamily: "Inter_600SemiBold" },

  heroSection: { marginHorizontal: -16 },
  heroScroll: { paddingHorizontal: 16 },
  heroDots: { flexDirection: "row", justifyContent: "center", gap: 5, paddingTop: 8 },
  heroDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: C.textTertiary },
  heroDotActive: { width: 16, backgroundColor: C.accent },
  heroContext: {
    flexDirection: "row", alignItems: "center", gap: 5,
    marginHorizontal: 16, marginTop: 6, marginBottom: 2,
  },
  heroContextText: { color: C.accent, fontSize: 12, fontWeight: "600", fontFamily: "Inter_600SemiBold" },

  section: { paddingVertical: 12, gap: 12 },
  cardList: { gap: 10 },
  recapBadge: {
    backgroundColor: `${C.accentGold}22`, padding: 4, borderRadius: 8,
    borderWidth: 1, borderColor: `${C.accentGold}40`,
  },
});
