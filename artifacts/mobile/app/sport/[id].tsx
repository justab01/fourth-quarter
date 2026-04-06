import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  Dimensions,
  StatusBar,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import Colors from "@/constants/colors";
import { getSportById, getSportByLeague, type SportCategory } from "@/constants/sportCategories";
import { api } from "@/utils/api";
import type { Game, SportNewsArticle, UpcomingEvent, RankingEntry, RankingsGroup, TennisDrawData, TennisTournament, TennisDrawMatch, GolfLeaderboardEntry, StandingEntry } from "@/utils/api";
import { GameCard } from "@/components/GameCard";
import { SearchButton } from "@/components/SearchButton";
import { GameCardSkeleton, NewsCardSkeleton } from "@/components/LoadingSkeleton";
import { ALL_PLAYERS } from "@/constants/allPlayers";
import { goToTeam } from "@/utils/navHelpers";
import { useSearch } from "@/context/SearchContext";
import { getSportArchetype, type SportArchetype } from "@/utils/sportArchetype";

const SPORT_DATA_NOTE: Record<string, string> = {
  golf:        "Live leaderboards appear during PGA Tour & LIV events. Tap Search to find golfers.",
  motorsports: "Race results appear during F1 and NASCAR race weekends. Tap Search to find drivers.",
  esports:     "Esports coverage coming soon. Tap Search to explore players.",
  track:       "Results appear during Diamond League and Olympic events. Tap Search to find athletes.",
  xgames:      "X Games coverage appears during live events. Tap Search to explore athletes.",
  college:     "College scores appear during the regular season. Tap Search to find players.",
};

const RANKINGS_LEAGUES = new Set(["ATP", "WTA", "UFC", "PGA", "F1", "NASCAR", "IRL", "BELLATOR", "PFL", "LPGA"]);

const STANDINGS_LEAGUES = new Set(["NBA", "NFL", "MLB", "NHL", "WNBA", "MLS", "EPL", "LIGA", "BUN", "SERA", "LIG1", "NWSL"]);

const C = Colors.dark;
const { width: SCREEN_W } = Dimensions.get("window");

const STATUS_ORDER: Record<Game["status"], number> = { live: 0, upcoming: 1, finished: 2 };

function AthleteChip({
  name,
  position,
  team,
  league,
  accentColor,
  headshot,
}: {
  name: string;
  position?: string;
  team: string;
  league: string;
  accentColor: string;
  headshot?: string | null;
}) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Pressable
      style={({ pressed }) => [
        styles.athleteChip,
        { opacity: pressed ? 0.75 : 1 },
      ]}
      onPress={() =>
        router.push({ pathname: "/player/[id]", params: { id: name.toLowerCase().replace(/\s+/g, "-") } } as any)
      }
    >
      <View style={[styles.athleteAvatar, { backgroundColor: accentColor + "33" }]}>
        {headshot ? (
          <Image source={{ uri: headshot }} style={{ width: 44, height: 44, borderRadius: 22 }} />
        ) : (
          <Text style={[styles.athleteInitials, { color: accentColor }]}>{initials}</Text>
        )}
      </View>
      <Text style={styles.athleteName} numberOfLines={1}>{name}</Text>
      {position && (
        <Text style={styles.athletePos} numberOfLines={1}>{position}</Text>
      )}
    </Pressable>
  );
}

function LeagueChip({
  label,
  active,
  accentColor,
  onPress,
}: {
  label: string;
  active: boolean;
  accentColor: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.leagueChip,
        active && { backgroundColor: accentColor, borderColor: accentColor },
      ]}
    >
      <Text
        style={[
          styles.leagueChipText,
          active && { color: "#fff" },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function RankingsTable({
  group,
  accentColor,
  limit = 10,
}: {
  group: RankingsGroup;
  accentColor: string;
  limit?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const entries = expanded ? group.entries : group.entries.slice(0, limit);

  return (
    <View style={styles.rankingsCard}>
      <Text style={styles.rankingsGroupTitle} numberOfLines={1}>{group.title}</Text>
      {entries.map((entry, i) => (
        <View key={`${entry.rank}-${entry.name}`} style={[styles.rankRow, i === 0 && { borderTopWidth: 0 }]}>
          <Text style={[styles.rankNum, i < 3 && { color: accentColor }]}>{entry.rank}</Text>
          {entry.headshot ? (
            <Image source={{ uri: entry.headshot }} style={styles.rankHeadshot} />
          ) : (
            <View style={[styles.rankHeadshot, { backgroundColor: accentColor + "22", alignItems: "center", justifyContent: "center" }]}>
              <Text style={{ color: accentColor, fontSize: 10, fontFamily: "Inter_700Bold" }}>
                {entry.name.charAt(0)}
              </Text>
            </View>
          )}
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={styles.rankName} numberOfLines={1}>{entry.name}</Text>
            {entry.record && (
              <Text style={styles.rankSub} numberOfLines={1}>{entry.record}</Text>
            )}
          </View>
          {entry.points && (
            <Text style={styles.rankPoints}>{entry.points}</Text>
          )}
          {entry.trend && entry.trend !== "-" && (
            <View style={{ marginLeft: 6 }}>
              <Ionicons
                name={entry.trend.startsWith("+") || entry.trend === "up" ? "arrow-up" : entry.trend.startsWith("-") || entry.trend === "down" ? "arrow-down" : "remove"}
                size={10}
                color={entry.trend.startsWith("+") || entry.trend === "up" ? "#22C55E" : entry.trend.startsWith("-") || entry.trend === "down" ? "#EF4444" : C.textTertiary}
              />
            </View>
          )}
        </View>
      ))}
      {group.entries.length > limit && (
        <Pressable onPress={() => setExpanded(!expanded)} style={styles.rankExpandBtn}>
          <Text style={[styles.rankExpandText, { color: accentColor }]}>
            {expanded ? "Show less" : `Show all ${group.entries.length}`}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

function GolfLeaderboard({
  game,
  accentColor,
}: {
  game: Game;
  accentColor: string;
}) {
  const lb = game.leaderboard ?? [];
  if (lb.length === 0) return null;

  return (
    <View style={styles.rankingsCard}>
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8, gap: 8 }}>
        <View style={[styles.eventTypeBadge, {
          backgroundColor: game.status === "live" ? "#E53935" : game.status === "finished" ? C.textTertiary + "33" : accentColor + "33",
        }]}>
          <Text style={[styles.eventTypeText, {
            color: game.status === "live" ? "#fff" : game.status === "finished" ? C.textSecondary : accentColor,
          }]}>{game.status === "live" ? "LIVE" : game.status === "finished" ? "FINAL" : "UPCOMING"}</Text>
        </View>
        <Text style={styles.rankingsGroupTitle} numberOfLines={1}>{game.eventTitle ?? "Tournament"}</Text>
      </View>
      {lb.map((entry, i) => (
        <View key={`${entry.position}-${entry.name}`} style={[styles.rankRow, i === 0 && { borderTopWidth: 0 }]}>
          <Text style={[styles.rankNum, i < 3 && { color: accentColor }]}>{entry.position}</Text>
          {entry.headshot ? (
            <Image source={{ uri: entry.headshot }} style={styles.rankHeadshot} />
          ) : (
            <View style={[styles.rankHeadshot, { backgroundColor: accentColor + "22", alignItems: "center", justifyContent: "center" }]}>
              <Text style={{ color: accentColor, fontSize: 10, fontFamily: "Inter_700Bold" }}>
                {entry.name.charAt(0)}
              </Text>
            </View>
          )}
          <Text style={[styles.rankName, { flex: 1, marginLeft: 8 }]} numberOfLines={1}>{entry.name}</Text>
          <Text style={[styles.rankPoints, i === 0 && { color: accentColor }]}>{entry.score}</Text>
        </View>
      ))}
      {game.venue && (
        <Text style={{ color: C.textTertiary, fontSize: 10, marginTop: 6 }}>{game.venue}</Text>
      )}
    </View>
  );
}

function TournamentDraw({
  tournament,
  accentColor,
}: {
  tournament: TennisTournament;
  accentColor: string;
}) {
  const [expandedRound, setExpandedRound] = useState<string | null>(null);

  if (tournament.rounds.length === 0) {
    return (
      <View style={styles.rankingsCard}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <View style={[styles.eventTypeBadge, {
            backgroundColor: tournament.status === "live" ? "#E53935"
              : tournament.status === "completed" ? C.textTertiary + "33"
              : accentColor + "33",
          }]}>
            <Text style={[styles.eventTypeText, {
              color: tournament.status === "live" ? "#fff"
                : tournament.status === "completed" ? C.textSecondary
                : accentColor,
            }]}>
              {tournament.status === "live" ? "LIVE" : tournament.status === "completed" ? "COMPLETED" : "UPCOMING"}
            </Text>
          </View>
          <Text style={styles.rankingsGroupTitle} numberOfLines={1}>{tournament.name}</Text>
        </View>
        <Text style={{ color: C.textTertiary, fontSize: 12, textAlign: "center", paddingVertical: 16 }}>
          {tournament.status === "completed" ? "Tournament completed" : "Draw will appear when matches begin"}
        </Text>
        {tournament.venue && (
          <Text style={{ color: C.textTertiary, fontSize: 10, marginTop: 4 }}>{tournament.venue}</Text>
        )}
      </View>
    );
  }

  return (
    <View style={styles.rankingsCard}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <View style={[styles.eventTypeBadge, {
          backgroundColor: tournament.status === "live" ? "#E53935" : accentColor + "33",
        }]}>
          <Text style={[styles.eventTypeText, {
            color: tournament.status === "live" ? "#fff" : accentColor,
          }]}>
            {tournament.status === "live" ? "LIVE" : "DRAW"}
          </Text>
        </View>
        <Text style={styles.rankingsGroupTitle} numberOfLines={1}>{tournament.name}</Text>
      </View>

      {tournament.rounds.map((round) => {
        const isExpanded = expandedRound === round.name;
        const showByDefault = round.matches.some(m => m.status === "live") || round.order <= 3;
        const show = isExpanded || showByDefault;

        return (
          <View key={round.name} style={{ marginBottom: 6 }}>
            <Pressable
              onPress={() => setExpandedRound(isExpanded ? null : round.name)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 8,
                borderTopWidth: StyleSheet.hairlineWidth,
                borderTopColor: C.separator,
              }}
            >
              <View style={{
                backgroundColor: round.matches.some(m => m.status === "live") ? "#E53935" : accentColor + "22",
                borderRadius: 6,
                paddingHorizontal: 8,
                paddingVertical: 3,
              }}>
                <Text style={{
                  color: round.matches.some(m => m.status === "live") ? "#fff" : accentColor,
                  fontSize: 10,
                  fontFamily: "Inter_700Bold",
                  letterSpacing: 0.5,
                }}>
                  {round.name.toUpperCase()}
                </Text>
              </View>
              <Text style={{ color: C.textSecondary, fontSize: 11, marginLeft: 8 }}>
                {round.matches.length} {round.matches.length === 1 ? "match" : "matches"}
              </Text>
              <View style={{ flex: 1 }} />
              <Ionicons
                name={show ? "chevron-up" : "chevron-down"}
                size={14}
                color={C.textSecondary}
              />
            </Pressable>

            {show && round.matches.map((match) => (
              <DrawMatchCard key={match.id} match={match} accentColor={accentColor} />
            ))}
          </View>
        );
      })}
    </View>
  );
}

function DrawMatchCard({
  match,
  accentColor,
}: {
  match: TennisDrawMatch;
  accentColor: string;
}) {
  const isLive = match.status === "live";
  const isFinished = match.status === "finished";
  const p1Won = match.winner === 1;
  const p2Won = match.winner === 2;

  return (
    <View style={{
      backgroundColor: C.background,
      borderRadius: 10,
      padding: 10,
      marginBottom: 4,
      borderWidth: isLive ? 1 : 0,
      borderColor: isLive ? "#E53935" + "44" : "transparent",
    }}>
      <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 3 }}>
        {match.seed1 != null && (
          <Text style={{ color: accentColor, fontSize: 10, fontFamily: "Inter_700Bold", width: 20, textAlign: "right" }}>
            [{match.seed1}]
          </Text>
        )}
        {match.seed1 == null && <View style={{ width: 20 }} />}
        {match.headshot1 ? (
          <Image source={{ uri: match.headshot1 }} style={{ width: 20, height: 20, borderRadius: 10, marginLeft: 6 }} />
        ) : (
          <View style={{ width: 20, height: 20, borderRadius: 10, marginLeft: 6, backgroundColor: accentColor + "22", alignItems: "center", justifyContent: "center" }}>
            <Text style={{ color: accentColor, fontSize: 8, fontFamily: "Inter_700Bold" }}>{match.player1.charAt(0)}</Text>
          </View>
        )}
        <Text
          style={{
            flex: 1,
            marginLeft: 6,
            fontSize: 12,
            fontFamily: p1Won ? "Inter_700Bold" : "Inter_400Regular",
            color: isFinished && !p1Won ? C.textTertiary : C.text,
          }}
          numberOfLines={1}
        >
          {match.player1}
        </Text>
        {(isLive || isFinished) && match.score1 != null && (
          <Text style={{
            fontSize: 13,
            fontFamily: "Inter_700Bold",
            color: p1Won ? C.text : C.textTertiary,
            minWidth: 20,
            textAlign: "right",
          }}>
            {match.score1}
          </Text>
        )}
        {p1Won && <Ionicons name="checkmark-circle" size={12} color="#22C55E" style={{ marginLeft: 4 }} />}
      </View>

      <View style={{ height: 1, backgroundColor: C.separator, marginVertical: 3, marginLeft: 46 }} />

      <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 3 }}>
        {match.seed2 != null && (
          <Text style={{ color: accentColor, fontSize: 10, fontFamily: "Inter_700Bold", width: 20, textAlign: "right" }}>
            [{match.seed2}]
          </Text>
        )}
        {match.seed2 == null && <View style={{ width: 20 }} />}
        {match.headshot2 ? (
          <Image source={{ uri: match.headshot2 }} style={{ width: 20, height: 20, borderRadius: 10, marginLeft: 6 }} />
        ) : (
          <View style={{ width: 20, height: 20, borderRadius: 10, marginLeft: 6, backgroundColor: accentColor + "22", alignItems: "center", justifyContent: "center" }}>
            <Text style={{ color: accentColor, fontSize: 8, fontFamily: "Inter_700Bold" }}>{match.player2.charAt(0)}</Text>
          </View>
        )}
        <Text
          style={{
            flex: 1,
            marginLeft: 6,
            fontSize: 12,
            fontFamily: p2Won ? "Inter_700Bold" : "Inter_400Regular",
            color: isFinished && !p2Won ? C.textTertiary : C.text,
          }}
          numberOfLines={1}
        >
          {match.player2}
        </Text>
        {(isLive || isFinished) && match.score2 != null && (
          <Text style={{
            fontSize: 13,
            fontFamily: "Inter_700Bold",
            color: p2Won ? C.text : C.textTertiary,
            minWidth: 20,
            textAlign: "right",
          }}>
            {match.score2}
          </Text>
        )}
        {p2Won && <Ionicons name="checkmark-circle" size={12} color="#22C55E" style={{ marginLeft: 4 }} />}
      </View>

      {isLive && match.setScores && (
        <Text style={{ color: accentColor, fontSize: 10, fontFamily: "Inter_600SemiBold", textAlign: "center", marginTop: 4 }}>
          {match.setScores}
        </Text>
      )}
    </View>
  );
}

function getArchetypeForSport(sport: SportCategory | undefined, activeLeague: string): SportArchetype {
  if (activeLeague !== "all") return getSportArchetype(activeLeague);
  if (!sport) return "team";
  const firstLeague = sport.leagues[0]?.key;
  if (firstLeague) return getSportArchetype(firstLeague);
  return "team";
}

function getRankingsLeague(sport: SportCategory | undefined, activeLeague: string): string | null {
  if (activeLeague !== "all") return RANKINGS_LEAGUES.has(activeLeague) ? activeLeague : null;
  if (!sport) return null;
  const rl = sport.leagues.find(l => RANKINGS_LEAGUES.has(l.key));
  return rl?.key ?? null;
}

function getStandingsLeague(sport: SportCategory | undefined, activeLeague: string): string | null {
  if (activeLeague !== "all") return STANDINGS_LEAGUES.has(activeLeague) ? activeLeague : null;
  if (!sport) return null;
  const sl = sport.leagues.find(l => STANDINGS_LEAGUES.has(l.key));
  return sl?.key ?? null;
}

export default function SportBoardScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { openSearch } = useSearch();

  const sport = getSportById(id ?? "") ?? getSportByLeague((id ?? "").toUpperCase());
  const [activeLeague, setActiveLeague] = useState<string>("all");

  const sportId = sport?.id ?? id ?? "";
  const archetype = getArchetypeForSport(sport, activeLeague);
  const rankingsLeague = getRankingsLeague(sport, activeLeague);
  const standingsLeague = getStandingsLeague(sport, activeLeague);

  const todayDate = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  }, []);

  const { data: gamesData, isLoading: gamesLoading, refetch: refetchGames } = useQuery({
    queryKey: ["games", todayDate],
    queryFn: () => api.getGames(undefined, todayDate),
    staleTime: 60_000,
  });

  const { data: sportNewsData, isLoading: newsLoading, refetch: refetchNews } = useQuery({
    queryKey: ["sport-news", sportId],
    queryFn: () => api.getSportNews(sportId, 12),
    staleTime: 120_000,
    enabled: !!sportId,
  });

  const { data: upcomingData, refetch: refetchUpcoming } = useQuery({
    queryKey: ["upcoming", sportId],
    queryFn: () => api.getUpcomingEvents(sportId),
    staleTime: 120_000,
    enabled: !!sportId,
  });

  const { data: rankingsData, isLoading: rankingsLoading, refetch: refetchRankings } = useQuery({
    queryKey: ["rankings", rankingsLeague],
    queryFn: () => api.getRankings(rankingsLeague!),
    staleTime: 600_000,
    enabled: !!rankingsLeague,
  });

  const drawLeague = archetype === "tennis" ? (activeLeague !== "all" ? activeLeague : "ATP") : null;
  const { data: drawData, refetch: refetchDraw } = useQuery({
    queryKey: ["tennis-draw", drawLeague],
    queryFn: () => api.getTennisDraw(drawLeague!),
    staleTime: 300_000,
    enabled: !!drawLeague,
  });

  const { data: leaderboardData, refetch: refetchLeaderboard } = useQuery({
    queryKey: ["golf-leaderboard"],
    queryFn: () => api.getGolfLeaderboard(),
    staleTime: 120_000,
    enabled: archetype === "golf",
  });

  const { data: standingsData, refetch: refetchStandings } = useQuery({
    queryKey: ["sport-standings", standingsLeague],
    queryFn: () => api.getStandings(standingsLeague!),
    staleTime: 300_000,
    enabled: !!standingsLeague && archetype === "team",
  });

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchGames(), refetchNews(), refetchUpcoming(), refetchRankings(), refetchDraw(), refetchLeaderboard(), refetchStandings()]);
    setRefreshing(false);
  }, [refetchGames, refetchNews, refetchUpcoming, refetchRankings, refetchDraw, refetchLeaderboard, refetchStandings]);

  const sportLeagueKeys = useMemo(
    () => new Set(sport?.leagues.map((l) => l.key) ?? []),
    [sport]
  );

  const filteredGames = useMemo(() => {
    const games: Game[] = (gamesData as any)?.games ?? [];
    return games
      .filter((g) => {
        if (!sportLeagueKeys.has(g.league)) return false;
        if (activeLeague !== "all" && g.league !== activeLeague) return false;
        return true;
      })
      .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);
  }, [gamesData, sportLeagueKeys, activeLeague]);

  const golfGames = useMemo(() => filteredGames.filter(g => g.sportArchetype === "golf"), [filteredGames]);
  const nonGolfGames = useMemo(() => filteredGames.filter(g => g.sportArchetype !== "golf"), [filteredGames]);

  const sportNews: SportNewsArticle[] = sportNewsData?.articles ?? [];

  const upcomingEvents: UpcomingEvent[] = upcomingData?.events ?? [];

  const topAthletes = useMemo(() => {
    const leagueFilter =
      activeLeague === "all"
        ? [...sportLeagueKeys]
        : [activeLeague];
    return ALL_PLAYERS.filter((p) => leagueFilter.includes(p.league)).slice(0, 20);
  }, [sportLeagueKeys, activeLeague]);

  const rankingsGroups: RankingsGroup[] = rankingsData?.groups ?? [];
  const tennisTournaments: TennisTournament[] = drawData?.tournaments ?? [];
  const standingsEntries: StandingEntry[] = standingsData?.standings ?? [];

  const liveCount = filteredGames.filter((g) => g.status === "live").length;
  const accentColor = sport?.color ?? C.accent;

  const scheduleSectionTitle = useMemo(() => {
    switch (archetype) {
      case "tennis": return "Tournaments & Matches";
      case "golf": return "Tournament Schedule";
      case "racing": return "Race Schedule & Results";
      case "combat": return "Fight Cards & Results";
      default: return filteredGames.length === 0 ? "Schedule & Results" : "Upcoming & Recent";
    }
  }, [archetype, filteredGames.length]);

  if (!sport) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={C.text} />
        </Pressable>
        <View style={styles.emptyCenter}>
          <Text style={styles.emptyText}>Sport not found</Text>
        </View>
      </View>
    );
  }

  const GamesSection = (gamesLoading || nonGolfGames.length > 0) ? (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {archetype === "racing" ? "Races" : archetype === "combat" ? "Fights" : archetype === "tennis" ? "Matches" : "Games"}
        </Text>
        <Pressable onPress={() => router.push("/(tabs)/live" as any)} style={styles.seeAllBtn}>
          <Text style={[styles.seeAllText, { color: accentColor }]}>See all</Text>
        </Pressable>
      </View>
      {gamesLoading ? (
        <>
          <GameCardSkeleton />
          <GameCardSkeleton />
        </>
      ) : (
        nonGolfGames.slice(0, 5).map((game) => (
          <GameCard
            key={game.id}
            game={game}
            onPress={() =>
              router.push({ pathname: "/game/[id]", params: { id: game.id } } as any)
            }
          />
        ))
      )}
    </View>
  ) : null;

  const lbEntries = leaderboardData?.leaderboard ?? [];
  const ApiLeaderboardSection = archetype === "golf" && lbEntries.length > 0 ? (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Leaderboard</Text>
        {leaderboardData?.status === "live" && (
          <View style={[styles.liveDot, { backgroundColor: accentColor }]} />
        )}
      </View>
      {leaderboardData?.tournament ? (
        <Text style={styles.leaderboardTourName}>{leaderboardData.tournament}</Text>
      ) : null}
      <View style={[styles.leaderboardCard, { borderColor: accentColor + "33" }]}>
        <View style={styles.leaderboardHeader}>
          <Text style={[styles.lbHeaderCell, { flex: 0.4 }]}>Pos</Text>
          <Text style={[styles.lbHeaderCell, { flex: 2, textAlign: "left" }]}>Player</Text>
          <Text style={[styles.lbHeaderCell, { flex: 0.7 }]}>Score</Text>
          <Text style={[styles.lbHeaderCell, { flex: 0.6 }]}>Thru</Text>
        </View>
        {lbEntries.map((entry: GolfLeaderboardEntry, idx: number) => (
          <View key={entry.name + idx} style={[styles.leaderboardRow, idx % 2 === 0 && styles.leaderboardRowAlt]}>
            <Text style={[styles.lbCell, { flex: 0.4, fontWeight: "700", color: idx < 3 ? accentColor : C.textSecondary }]}>
              {entry.position != null ? `T${entry.position}` : "-"}
            </Text>
            <View style={{ flex: 2, flexDirection: "row", alignItems: "center", gap: 6 }}>
              {entry.headshotUrl ? (
                <Image source={{ uri: entry.headshotUrl }} style={styles.lbAvatar} />
              ) : (
                <View style={[styles.lbAvatarPlaceholder, { backgroundColor: accentColor + "22" }]}>
                  <Text style={{ fontSize: 9, color: accentColor, fontWeight: "700" }}>
                    {entry.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2)}
                  </Text>
                </View>
              )}
              <Text style={styles.lbPlayerName} numberOfLines={1}>{entry.name}</Text>
            </View>
            <Text style={[styles.lbCell, { flex: 0.7, fontWeight: "600", color: C.text }]}>{entry.score}</Text>
            <Text style={[styles.lbCell, { flex: 0.6 }]}>{entry.thru}</Text>
          </View>
        ))}
      </View>
    </View>
  ) : null;

  const GolfLeaderboardSection = golfGames.length > 0 && lbEntries.length === 0 ? (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Leaderboard</Text>
      </View>
      {golfGames.map((game) => (
        <GolfLeaderboard key={game.id} game={game} accentColor={accentColor} />
      ))}
    </View>
  ) : null;

  const RankingsSection = rankingsGroups.length > 0 ? (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {archetype === "racing" ? "Standings" : archetype === "golf" ? "World Rankings" : "World Rankings"}
        </Text>
      </View>
      {rankingsGroups.slice(0, archetype === "combat" ? 3 : 2).map((group, i) => (
        <RankingsTable key={group.title} group={group} accentColor={accentColor} limit={archetype === "combat" ? 5 : 10} />
      ))}
    </View>
  ) : null;

  const AthletesSection = topAthletes.length > 0 ? (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Top Athletes</Text>
        <Pressable onPress={() => openSearch()} style={styles.seeAllBtn}>
          <Text style={[styles.seeAllText, { color: accentColor }]}>Search</Text>
        </Pressable>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.athleteRow}
      >
        {topAthletes.map((player) => (
          <AthleteChip
            key={player.name + player.team}
            name={player.name}
            position={player.position}
            team={player.team}
            league={player.league}
            accentColor={accentColor}
          />
        ))}
      </ScrollView>
    </View>
  ) : null;

  const RankingsAthletesSection = rankingsGroups.length > 0 && topAthletes.length === 0 ? (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Top Athletes</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.athleteRow}
      >
        {rankingsGroups[0].entries.slice(0, 15).map((entry) => (
          <AthleteChip
            key={entry.name}
            name={entry.name}
            team={entry.record ?? ""}
            league={rankingsLeague ?? ""}
            accentColor={accentColor}
            headshot={entry.headshot}
          />
        ))}
      </ScrollView>
    </View>
  ) : null;

  const TournamentDrawSection = tennisTournaments.length > 0 ? (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Tournament Draw</Text>
      </View>
      {tennisTournaments.map((tournament) => (
        <TournamentDraw key={tournament.id} tournament={tournament} accentColor={accentColor} />
      ))}
    </View>
  ) : null;

  const LeagueLinksSection = sport.leagues.length > 1 ? (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Leagues</Text>
      <View style={styles.leagueLinks}>
        {sport.leagues.map((l) => (
          <Pressable
            key={l.key}
            style={({ pressed }) => [
              styles.leagueLinkRow,
              { opacity: pressed ? 0.7 : 1 },
            ]}
            onPress={() => setActiveLeague(l.key)}
          >
            <View style={[styles.leagueDot, { backgroundColor: accentColor }]} />
            <Text style={styles.leagueLinkLabel}>{l.label}</Text>
            <Ionicons name="chevron-forward" size={16} color={C.textSecondary} />
          </Pressable>
        ))}
      </View>
    </View>
  ) : null;

  const ScheduleSection = (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {archetype === "racing" ? "Race Calendar" : archetype === "combat" ? "Fight Schedule" : "Schedule & Results"}
        </Text>
      </View>
      {upcomingEvents.length > 0 ? (
        upcomingEvents.slice(0, 10).map((ev) => (
          <View key={ev.id} style={styles.eventRow}>
            <View style={[styles.eventTypeBadge, {
              backgroundColor: ev.type === "live" ? "#E53935" : ev.type === "result" ? C.textTertiary + "33" : accentColor + "33",
            }]}>
              <Text style={[styles.eventTypeText, {
                color: ev.type === "live" ? "#fff" : ev.type === "result" ? C.textSecondary : accentColor,
              }]}>{ev.type === "live" ? "LIVE" : ev.type === "result" ? "FINAL" : "UPCOMING"}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.eventName} numberOfLines={2}>{ev.name}</Text>
              <View style={{ flexDirection: "row", gap: 8, marginTop: 2 }}>
                <Text style={styles.eventMeta}>
                  {ev.date ? new Date(ev.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}
                </Text>
                {ev.venue && <Text style={styles.eventMeta} numberOfLines={1}>{ev.venue}</Text>}
                <Text style={[styles.eventMeta, { color: accentColor }]}>{ev.league}</Text>
              </View>
            </View>
            {ev.homeScore != null && ev.awayScore != null && (
              <Text style={styles.eventScore}>{ev.homeScore}-{ev.awayScore}</Text>
            )}
          </View>
        ))
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyCardEmoji}>{sport.emoji}</Text>
          <Text style={styles.emptyCardTitle}>No events scheduled right now</Text>
          <Text style={styles.emptyCardSub}>
            {SPORT_DATA_NOTE[sport.id] ??
              `${sport.leagues.map((l) => l.label).join(" · ")} events will appear here when scheduled.`}
          </Text>
        </View>
      )}
    </View>
  );

  const NewsSection = (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Latest News</Text>
      </View>
      {newsLoading ? (
        <>
          <NewsCardSkeleton />
          <NewsCardSkeleton />
        </>
      ) : sportNews.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyCardSub}>No news right now — check back soon</Text>
        </View>
      ) : (
        sportNews.map((article) => (
          <Pressable
            key={article.id}
            style={({ pressed }) => [styles.newsRow, { opacity: pressed ? 0.75 : 1 }]}
          >
            <View style={styles.newsRowDot} />
            <View style={{ flex: 1 }}>
              <Text style={styles.newsRowText} numberOfLines={2}>{article.title}</Text>
              <Text style={styles.newsRowMeta} numberOfLines={1}>
                {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""} · {article.leagues?.join(", ")}
              </Text>
            </View>
          </Pressable>
        ))
      )}
    </View>
  );

  const showPtsColumn = (sportId === "soccer" || sportId === "hockey") && standingsEntries[0]?.points != null;

  const InlineStandingsSection = standingsEntries.length > 0 ? (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Standings</Text>
        <Pressable onPress={() => router.push("/(tabs)/standings" as any)} style={styles.seeAllBtn}>
          <Text style={[styles.seeAllText, { color: accentColor }]}>Full standings</Text>
        </Pressable>
      </View>
      <View style={[styles.leaderboardCard, { borderColor: accentColor + "22" }]}>
        <View style={styles.leaderboardHeader}>
          <Text style={[styles.lbHeaderCell, { flex: 0.3 }]}>#</Text>
          <Text style={[styles.lbHeaderCell, { flex: 2.5, textAlign: "left" }]}>Team</Text>
          <Text style={[styles.lbHeaderCell, { flex: 0.5 }]}>W</Text>
          <Text style={[styles.lbHeaderCell, { flex: 0.5 }]}>L</Text>
          {showPtsColumn && (
            <Text style={[styles.lbHeaderCell, { flex: 0.5 }]}>PTS</Text>
          )}
          {sportId !== "hockey" && (
            <Text style={[styles.lbHeaderCell, { flex: 0.6 }]}>
              {sportId === "soccer" ? "GD" : "PCT"}
            </Text>
          )}
        </View>
        {standingsEntries.slice(0, 8).map((entry: StandingEntry, idx: number) => (
          <View key={entry.teamName + idx} style={[styles.leaderboardRow, idx % 2 === 0 && styles.leaderboardRowAlt]}>
            <Text style={[styles.lbCell, { flex: 0.3, fontWeight: "700", color: idx < 3 ? accentColor : C.textSecondary }]}>
              {entry.rank}
            </Text>
            <View style={{ flex: 2.5, flexDirection: "row", alignItems: "center", gap: 6 }}>
              {entry.logoUrl ? (
                <Image source={{ uri: entry.logoUrl }} style={styles.lbAvatar} />
              ) : (
                <View style={[styles.lbAvatarPlaceholder, { backgroundColor: accentColor + "22" }]}>
                  <Text style={{ fontSize: 9, color: accentColor, fontWeight: "700" }}>
                    {entry.teamName.charAt(0)}
                  </Text>
                </View>
              )}
              <Text style={styles.lbPlayerName} numberOfLines={1}>{entry.teamName}</Text>
            </View>
            <Text style={[styles.lbCell, { flex: 0.5 }]}>{entry.wins}</Text>
            <Text style={[styles.lbCell, { flex: 0.5 }]}>{entry.losses}</Text>
            {showPtsColumn && (
              <Text style={[styles.lbCell, { flex: 0.5, color: accentColor }]}>{entry.points ?? 0}</Text>
            )}
            {sportId !== "hockey" && (
              <Text style={[styles.lbCell, { flex: 0.6 }]}>
                {sportId === "soccer"
                  ? (entry.differential != null ? (entry.differential > 0 ? `+${entry.differential}` : `${entry.differential}`) : "0")
                  : entry.winPct.toFixed(3).replace(/^0/, "")}
              </Text>
            )}
          </View>
        ))}
      </View>
    </View>
  ) : null;

  const StandingsShortcut = (
    <Pressable
      style={({ pressed }) => [
        styles.standingsCard,
        { opacity: pressed ? 0.8 : 1, borderColor: accentColor + "44" },
      ]}
      onPress={() => router.push("/(tabs)/standings" as any)}
    >
      <Ionicons name="bar-chart-outline" size={22} color={accentColor} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.standingsCardTitle}>Standings</Text>
        <Text style={styles.standingsCardSub}>
          View {sport.name} standings & rankings
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={C.textSecondary} />
    </Pressable>
  );

  const renderSections = () => {
    switch (archetype) {
      case "golf":
        return (
          <>
            {ApiLeaderboardSection}
            {GolfLeaderboardSection}
            {RankingsSection}
            {RankingsAthletesSection ?? AthletesSection}
            {ScheduleSection}
            {NewsSection}
          </>
        );
      case "racing":
        return (
          <>
            {RankingsSection}
            {GamesSection}
            {RankingsAthletesSection ?? AthletesSection}
            {ScheduleSection}
            {NewsSection}
          </>
        );
      case "tennis":
        return (
          <>
            {RankingsSection}
            {TournamentDrawSection}
            {GamesSection}
            {RankingsAthletesSection ?? AthletesSection}
            {ScheduleSection}
            {NewsSection}
          </>
        );
      case "combat":
        return (
          <>
            {RankingsSection}
            {GamesSection}
            {RankingsAthletesSection ?? AthletesSection}
            {ScheduleSection}
            {NewsSection}
          </>
        );
      default:
        return (
          <>
            {GamesSection}
            {InlineStandingsSection}
            {AthletesSection}
            {LeagueLinksSection}
            {ScheduleSection}
            {NewsSection}
            {!InlineStandingsSection && StandingsShortcut}
          </>
        );
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={[accentColor + "22", "transparent"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.heroGradient}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
            <Ionicons name="chevron-back" size={22} color={C.text} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.heroEmoji}>{sport.emoji}</Text>
            <Text style={styles.heroTitle}>{sport.name}</Text>
            {liveCount > 0 && (
              <View style={styles.liveTag}>
                <View style={styles.liveDot} />
                <Text style={styles.liveTagText}>{liveCount} Live</Text>
              </View>
            )}
          </View>
          <SearchButton />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipScroll}
          contentContainerStyle={styles.chipContent}
        >
          <LeagueChip
            label="All"
            active={activeLeague === "all"}
            accentColor={accentColor}
            onPress={() => setActiveLeague("all")}
          />
          {sport.leagues.map((l) => (
            <LeagueChip
              key={l.key}
              label={l.label}
              active={activeLeague === l.key}
              accentColor={accentColor}
              onPress={() => setActiveLeague(l.key)}
            />
          ))}
        </ScrollView>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={accentColor}
          />
        }
        contentContainerStyle={styles.content}
      >
        {renderSections()}
        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.background,
  },

  heroGradient: {
    paddingBottom: 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.card,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 10,
    gap: 8,
  },
  heroEmoji: {
    fontSize: 22,
  },
  heroTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: C.text,
  },
  liveTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(232,22,43,0.15)",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 4,
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: C.live,
  },
  liveTagText: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    color: C.live,
  },
  chipScroll: {
    marginBottom: 0,
  },
  chipContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  leagueChip: {
    backgroundColor: C.card,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1.5,
    borderColor: C.separator,
  },
  leagueChipText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: C.textSecondary,
  },

  content: {
    paddingTop: 8,
  },

  section: {
    marginBottom: 8,
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: C.text,
  },
  seeAllBtn: {},
  seeAllText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },

  athleteRow: {
    gap: 10,
    paddingRight: 16,
  },
  athleteChip: {
    backgroundColor: C.card,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    width: 88,
    gap: 6,
  },
  athleteAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  athleteInitials: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  athleteName: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: C.text,
    textAlign: "center",
  },
  athletePos: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    color: C.textSecondary,
    textAlign: "center",
  },

  leagueLinks: {
    backgroundColor: C.card,
    borderRadius: 14,
    overflow: "hidden",
  },
  leagueLinkRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.separator,
    gap: 12,
  },
  leagueDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  leagueLinkLabel: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: C.text,
  },

  newsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.separator,
    gap: 10,
  },
  newsRowDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.accent,
    flexShrink: 0,
  },
  newsRowText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: C.text,
    lineHeight: 20,
  },
  newsRowMeta: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: C.textSecondary,
    marginTop: 2,
  },

  standingsCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 8,
    borderWidth: 1,
  },
  standingsCardTitle: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: C.text,
  },
  standingsCardSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: C.textSecondary,
    marginTop: 2,
  },

  emptyCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 24,
    alignItems: "center",
    gap: 8,
  },
  emptyCardEmoji: {
    fontSize: 32,
  },
  emptyCardTitle: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: C.text,
  },
  emptyCardSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#AEAEB2",
    textAlign: "center",
    lineHeight: 19,
  },
  emptyCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    color: C.textSecondary,
  },

  eventRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.separator,
  },
  eventTypeBadge: {
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    minWidth: 52,
    alignItems: "center",
  },
  eventTypeText: {
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
  },
  eventName: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: C.text,
    lineHeight: 19,
  },
  eventMeta: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: C.textSecondary,
  },
  eventScore: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: C.text,
    marginLeft: 8,
  },

  rankingsCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  rankingsGroupTitle: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: C.text,
    flex: 1,
  },
  rankRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.separator,
  },
  rankNum: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    color: C.textSecondary,
    width: 24,
    textAlign: "right",
  },
  rankHeadshot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginLeft: 10,
    backgroundColor: C.separator,
    overflow: "hidden",
  },
  rankName: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: C.text,
  },
  rankSub: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    color: C.textSecondary,
    marginTop: 1,
  },
  rankPoints: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    color: C.textSecondary,
    minWidth: 40,
    textAlign: "right",
  },
  rankExpandBtn: {
    paddingTop: 10,
    alignItems: "center",
  },
  rankExpandText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },

  lbLiveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  leaderboardTourName: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: C.text,
    marginBottom: 2,
  },
  leaderboardVenue: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: C.textSecondary,
    marginBottom: 10,
  },
  leaderboardTourName: {
    color: C.text,
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 8,
  },
  leaderboardCard: {
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  leaderboardHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.separator,
  },
  lbHeaderCell: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    color: C.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    textAlign: "center",
  },
  leaderboardRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  leaderboardRowAlt: {
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  lbCell: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: C.textSecondary,
    textAlign: "center",
  },
  lbAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  lbAvatarPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  lbPlayerName: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: C.text,
    flex: 1,
  },
});
