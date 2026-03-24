import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View, Text, StyleSheet, Modal, TextInput, Pressable,
  ScrollView, Platform, Animated, Keyboard, ActivityIndicator
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import Colors from "@/constants/colors";
import { useSearch } from "@/context/SearchContext";
import { usePreferences } from "@/context/PreferencesContext";
import { api } from "@/utils/api";
import { TEAM_NAME_TO_ID } from "@/constants/teamData";
import { ALL_TEAMS, ALL_PLAYERS, type SearchTeam, type SearchPlayer } from "@/constants/allPlayers";

const C = Colors.dark;

const LEAGUE_COLORS: Record<string, string> = {
  NBA: C.nba, NFL: C.nfl, MLB: C.mlb, MLS: C.mls, NHL: C.nhl,
  WNBA: C.wnba, NCAAB: C.ncaab, NCAAF: C.ncaaf,
  EPL: C.eplBright, UCL: C.ucl, LIGA: C.liga, NCAA: C.accentGold,
  UFC: C.ufc, BOXING: C.boxing, ATP: C.atp, WTA: C.wta,
  OLYMPICS: C.olympics, XGAMES: C.xgames,
};

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function teamSlug(team: SearchTeam): string {
  return `${team.league.toLowerCase()}-${slugify(team.name)}`;
}

function ResultRow({
  icon, label, sublabel, badge, color, onPress,
}: {
  icon: string; label: string; sublabel?: string; badge?: string; color?: string; onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress}>
      <View style={row.container}>
        <View style={[row.iconBox, { backgroundColor: color ? `${color}20` : "rgba(239,120,40,0.1)" }]}>
          <Ionicons name={icon as any} size={16} color={color ?? C.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={row.label} numberOfLines={1}>{label}</Text>
          {sublabel && <Text style={row.sub} numberOfLines={1}>{sublabel}</Text>}
        </View>
        {badge && (
          <View style={[row.badge, { backgroundColor: color ? `${color}22` : "rgba(239,120,40,0.15)" }]}>
            <Text style={[row.badgeText, { color: color ?? C.accent }]}>{badge}</Text>
          </View>
        )}
        <Ionicons name="chevron-forward" size={14} color={C.textTertiary} />
      </View>
    </Pressable>
  );
}

const row = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.separator,
  },
  iconBox: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  label: { color: C.text, fontSize: 15, fontFamily: "Inter_500Medium" },
  sub: { color: C.textTertiary, fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginRight: 4 },
  badgeText: { fontSize: 11, fontWeight: "700", letterSpacing: 0.4 },
});

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={secHead.wrap}>
      <Text style={secHead.text}>{title}</Text>
    </View>
  );
}
const secHead = StyleSheet.create({
  wrap: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: C.backgroundSecondary },
  text: { color: C.textTertiary, fontSize: 11, fontWeight: "800", letterSpacing: 1.2, textTransform: "uppercase" },
});

export function SearchModal() {
  const { isOpen, closeSearch, prefill } = useSearch();
  const { preferences } = usePreferences();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const inputRef = useRef<TextInput>(null);
  const slideAnim = useRef(new Animated.Value(-50)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const { data: gamesData } = useQuery({ queryKey: ["games"], queryFn: () => api.getGames(), enabled: isOpen });
  const { data: newsData } = useQuery({ queryKey: ["news-all"], queryFn: () => api.getNews(), enabled: isOpen });

  // ── Live ESPN athlete search ───────────────────────────────────────────────
  const { data: liveAthletes, isFetching: liveSearching } = useQuery({
    queryKey: ["athlete-search", debouncedQ],
    queryFn: () => api.searchAthletes(debouncedQ, undefined, 10),
    enabled: isOpen && debouncedQ.length >= 2,
    staleTime: 60_000,
  });

  // Debounce search query to avoid hammering the API on every keystroke
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(query.trim()), 400);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (isOpen) {
      setQuery(prefill);
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, tension: 100, friction: 15, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start(() => {
        setTimeout(() => inputRef.current?.focus(), 100);
      });
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: -30, duration: 180, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
      ]).start();
      setQuery("");
    }
  }, [isOpen, prefill]);

  const q = query.toLowerCase().trim();
  const myTeams = preferences.favoriteTeams;

  const matchedTeams: SearchTeam[] = q.length >= 1
    ? ALL_TEAMS.filter(t =>
        t.name.toLowerCase().includes(q) ||
        t.abbr.toLowerCase().includes(q) ||
        t.league.toLowerCase().includes(q) ||
        (t.city ?? "").toLowerCase().includes(q)
      ).slice(0, 8)
    : ALL_TEAMS.filter(t => myTeams.includes(t.name)).slice(0, 5);

  const matchedPlayers: SearchPlayer[] = q.length >= 2
    ? ALL_PLAYERS.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.team.toLowerCase().includes(q) ||
        p.position.toLowerCase().includes(q) ||
        p.league.toLowerCase().includes(q)
      ).slice(0, 8)
    : ALL_PLAYERS.filter(p => myTeams.some(t => p.team === t)).slice(0, 5);

  const matchedGames = q.length >= 2
    ? (gamesData?.games ?? []).filter(g =>
        g.homeTeam.toLowerCase().includes(q) ||
        g.awayTeam.toLowerCase().includes(q) ||
        g.league.toLowerCase().includes(q)
      ).slice(0, 3)
    : [];

  const matchedNews = q.length >= 2
    ? (newsData?.articles ?? []).filter((a: any) =>
        a.title.toLowerCase().includes(q) ||
        a.tags.some((t: string) => t.toLowerCase().includes(q))
      ).slice(0, 3)
    : [];

  const sortedTeams = [...matchedTeams].sort((a, b) => {
    const aFav = myTeams.includes(a.name) ? -1 : 0;
    const bFav = myTeams.includes(b.name) ? -1 : 0;
    return aFav - bFav;
  });

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const handleClose = useCallback(() => {
    Keyboard.dismiss();
    closeSearch();
  }, [closeSearch]);

  const goTeam = (team: SearchTeam) => {
    handleClose();
    // Individual-sport athletes route to player page, not team page
    const isIndividualAthlete = ["ATP", "WTA", "UFC", "BOXING", "XGAMES", "OLYMPICS"].includes(team.league);
    if (isIndividualAthlete) {
      const id = slugify(team.name);
      router.push({ pathname: "/player/[id]", params: { id } } as any);
    } else {
      const id = TEAM_NAME_TO_ID[team.name] ?? teamSlug(team);
      router.push({ pathname: "/team/[id]", params: { id } } as any);
    }
  };

  const goPlayer = (player: SearchPlayer) => {
    handleClose();
    const id = slugify(player.name);
    router.push({ pathname: "/player/[id]", params: { id } } as any);
  };

  const goLiveAthlete = (athlete: import("@/utils/api").AthleteSearchResult) => {
    handleClose();
    const id = `${athlete.league.toUpperCase()}-${athlete.espnId}`;
    router.push({ pathname: "/player/[id]", params: { id } } as any);
  };

  const goGame = (gameId: string) => {
    handleClose();
    router.push({ pathname: "/game/[id]", params: { id: gameId } } as any);
  };

  const goArticle = (article: any) => {
    handleClose();
    router.push({ pathname: "/article/[id]", params: { id: article.id, article: JSON.stringify(article) } } as any);
  };

  const QUICK_SEARCHES = ["Rockets", "Lakers", "NBA Standings", "NFL Free Agency", "MLB Spring Training", "Jordan Clarkson", "Victor Wembanyama", "Patrick Mahomes"];

  return (
    <Modal visible={isOpen} transparent animationType="none" onRequestClose={handleClose} statusBarTranslucent>
      <Animated.View style={[styles.backdrop, { opacity: opacityAnim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
      </Animated.View>

      <Animated.View style={[styles.sheet, { paddingTop: topPad, transform: [{ translateY: slideAnim }], opacity: opacityAnim }]}>
        <View style={styles.searchBar}>
          <View style={styles.searchInput}>
            <Ionicons name="search" size={18} color={C.accent} />
            <TextInput
              ref={inputRef}
              style={styles.input}
              value={query}
              onChangeText={setQuery}
              placeholder="Search teams, players, games..."
              placeholderTextColor={C.textTertiary}
              returnKeyType="search"
              autoCorrect={false}
              autoCapitalize="none"
              clearButtonMode="while-editing"
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery("")}>
                <Ionicons name="close-circle" size={18} color={C.textTertiary} />
              </Pressable>
            )}
          </View>
          <Pressable onPress={handleClose} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>

        <ScrollView
          style={styles.results}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {q.length === 0 && (
            <>
              <SectionHeader title="Quick Search" />
              <View style={styles.quickChips}>
                {QUICK_SEARCHES.map(s => (
                  <Pressable key={s} onPress={() => setQuery(s)}>
                    <View style={styles.quickChip}>
                      <Ionicons name="trending-up" size={12} color={C.accent} />
                      <Text style={styles.quickChipText}>{s}</Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            </>
          )}

          {sortedTeams.length > 0 && (
            <>
              <SectionHeader title={q.length === 0 ? "My Teams" : `Teams (${sortedTeams.length})`} />
              {sortedTeams.map(team => (
                <ResultRow
                  key={team.name + team.league}
                  icon="shield"
                  label={team.name}
                  sublabel={`${team.league} · ${team.rank}`}
                  badge={myTeams.includes(team.name) ? "Following" : team.abbr}
                  color={LEAGUE_COLORS[team.league]}
                  onPress={() => goTeam(team)}
                />
              ))}
            </>
          )}

          {/* Live ESPN Athlete Search Results — shown when query is 2+ chars */}
          {q.length >= 2 && (liveSearching || (liveAthletes?.athletes ?? []).length > 0) && (
            <>
              <SectionHeader title={liveSearching ? "Athletes (searching…)" : `Athletes — ESPN (${liveAthletes!.athletes.length})`} />
              {liveSearching && (
                <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
                  <ActivityIndicator size="small" color={C.accent} />
                </View>
              )}
              {(liveAthletes?.athletes ?? []).map(athlete => (
                <ResultRow
                  key={`live-${athlete.espnId}-${athlete.league}`}
                  icon="person-circle"
                  label={athlete.name}
                  sublabel={`${athlete.position || "—"} · ${athlete.team || athlete.league}`}
                  badge={athlete.league.toUpperCase()}
                  color={LEAGUE_COLORS[athlete.league.toUpperCase()] ?? C.accent}
                  onPress={() => goLiveAthlete(athlete)}
                />
              ))}
            </>
          )}

          {/* Static player list — shown for "my team players" when no query, or as supplement */}
          {matchedPlayers.length > 0 && q.length < 2 && (
            <>
              <SectionHeader title="My Team Players" />
              {matchedPlayers.map(player => (
                <ResultRow
                  key={player.name + player.team}
                  icon="person"
                  label={player.name}
                  sublabel={`${player.position} · ${player.team} · ${player.stat}`}
                  badge={player.league}
                  color={LEAGUE_COLORS[player.league]}
                  onPress={() => goPlayer(player)}
                />
              ))}
            </>
          )}

          {matchedGames.length > 0 && (
            <>
              <SectionHeader title="Games" />
              {matchedGames.map((game: any) => (
                <ResultRow
                  key={game.id}
                  icon={game.status === "live" ? "radio-button-on" : game.status === "finished" ? "checkmark-circle" : "time"}
                  label={`${game.awayTeam} @ ${game.homeTeam}`}
                  sublabel={game.status === "finished"
                    ? `Final: ${game.awayScore}–${game.homeScore}`
                    : game.status === "live"
                    ? `LIVE · ${game.awayScore}–${game.homeScore}`
                    : `Upcoming · ${game.league}`}
                  badge={game.league}
                  color={game.status === "live" ? C.live : LEAGUE_COLORS[game.league]}
                  onPress={() => goGame(game.id)}
                />
              ))}
            </>
          )}

          {matchedNews.length > 0 && (
            <>
              <SectionHeader title="News" />
              {matchedNews.map((article: any) => (
                <ResultRow
                  key={article.id}
                  icon="newspaper"
                  label={article.title}
                  sublabel={article.source}
                  badge={article.leagues?.[0]}
                  color={LEAGUE_COLORS[article.leagues?.[0]] ?? C.accentBlue}
                  onPress={() => goArticle(article)}
                />
              ))}
            </>
          )}

          {q.length >= 2 && sortedTeams.length === 0 && matchedPlayers.length === 0 && matchedGames.length === 0 && matchedNews.length === 0 && (liveAthletes?.athletes ?? []).length === 0 && !liveSearching && (
            <View style={styles.noResults}>
              <Ionicons name="search-outline" size={44} color={C.textTertiary} />
              <Text style={styles.noResultsTitle}>No results for "{query}"</Text>
              <Text style={styles.noResultsSub}>Try searching a team, player, or league</Text>
            </View>
          )}
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.72)",
  },
  sheet: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    maxHeight: "90%",
    backgroundColor: C.background,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    borderBottomWidth: 1,
    borderColor: C.cardBorder,
    overflow: "hidden",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.separator,
  },
  searchInput: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: C.card,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderWidth: 1.5,
    borderColor: C.cardBorderActive,
  },
  input: {
    flex: 1,
    color: C.text,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
  cancelBtn: {
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  cancelText: {
    color: C.accent,
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  results: {
    maxHeight: 580,
  },
  quickChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    padding: 16,
  },
  quickChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.cardBorder,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  quickChipText: {
    color: C.textSecondary,
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  noResults: {
    alignItems: "center",
    paddingVertical: 60,
    gap: 10,
  },
  noResultsTitle: {
    color: C.textSecondary,
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
  noResultsSub: {
    color: C.textTertiary,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
});
