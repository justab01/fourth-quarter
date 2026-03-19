import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View, Text, StyleSheet, Modal, TextInput, Pressable,
  ScrollView, Platform, Animated, Keyboard
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import Colors from "@/constants/colors";
import { useSearch } from "@/context/SearchContext";
import { usePreferences } from "@/context/PreferencesContext";
import { api } from "@/utils/api";

const C = Colors.dark;

// ─── Static search index ─────────────────────────────────────────────────────
const TEAM_INDEX = [
  // NBA
  { name: "Oklahoma City Thunder", league: "NBA", abbr: "OKC", rank: "1st West" },
  { name: "Detroit Pistons", league: "NBA", abbr: "DET", rank: "1st East" },
  { name: "San Antonio Spurs", league: "NBA", abbr: "SAS", rank: "2nd West" },
  { name: "Boston Celtics", league: "NBA", abbr: "BOS", rank: "2nd East" },
  { name: "Los Angeles Lakers", league: "NBA", abbr: "LAL", rank: "3rd West" },
  { name: "New York Knicks", league: "NBA", abbr: "NYK", rank: "3rd East" },
  { name: "Houston Rockets", league: "NBA", abbr: "HOU", rank: "5th West" },
  { name: "Denver Nuggets", league: "NBA", abbr: "DEN", rank: "6th West" },
  { name: "Cleveland Cavaliers", league: "NBA", abbr: "CLE", rank: "4th East" },
  { name: "Minnesota Timberwolves", league: "NBA", abbr: "MIN", rank: "4th West" },
  { name: "Miami Heat", league: "NBA", abbr: "MIA", rank: "7th East" },
  { name: "Atlanta Hawks", league: "NBA", abbr: "ATL", rank: "8th East" },
  { name: "Milwaukee Bucks", league: "NBA", abbr: "MIL", rank: "5th East" },
  { name: "Golden State Warriors", league: "NBA", abbr: "GSW", rank: "10th West" },
  { name: "Dallas Mavericks", league: "NBA", abbr: "DAL", rank: "11th West" },
  { name: "Phoenix Suns", league: "NBA", abbr: "PHX", rank: "7th West" },
  { name: "Los Angeles Clippers", league: "NBA", abbr: "LAC", rank: "8th West" },
  { name: "Philadelphia 76ers", league: "NBA", abbr: "PHI", rank: "9th East" },
  { name: "Charlotte Hornets", league: "NBA", abbr: "CHA", rank: "10th East" },
  { name: "Chicago Bulls", league: "NBA", abbr: "CHI", rank: "11th East" },
  { name: "Sacramento Kings", league: "NBA", abbr: "SAC", rank: "14th West" },
  { name: "New Orleans Pelicans", league: "NBA", abbr: "NOP", rank: "13th West" },
  { name: "Orlando Magic", league: "NBA", abbr: "ORL", rank: "6th East" },
  { name: "Portland Trail Blazers", league: "NBA", abbr: "POR", rank: "9th West" },
  { name: "Memphis Grizzlies", league: "NBA", abbr: "MEM", rank: "12th West" },
  // NFL
  { name: "Kansas City Chiefs", league: "NFL", abbr: "KC", rank: "SB Champs" },
  { name: "Philadelphia Eagles", league: "NFL", abbr: "PHI", rank: "NFC East" },
  { name: "Buffalo Bills", league: "NFL", abbr: "BUF", rank: "AFC East" },
  { name: "Baltimore Ravens", league: "NFL", abbr: "BAL", rank: "AFC North" },
  { name: "Detroit Lions", league: "NFL", abbr: "DET", rank: "NFC North" },
  { name: "Dallas Cowboys", league: "NFL", abbr: "DAL", rank: "NFC East" },
  { name: "San Francisco 49ers", league: "NFL", abbr: "SF", rank: "NFC West" },
  { name: "Miami Dolphins", league: "NFL", abbr: "MIA", rank: "AFC East" },
  { name: "Houston Texans", league: "NFL", abbr: "HOU", rank: "AFC South" },
  { name: "Minnesota Vikings", league: "NFL", abbr: "MIN", rank: "NFC North" },
  { name: "Denver Broncos", league: "NFL", abbr: "DEN", rank: "AFC West" },
  { name: "Washington Commanders", league: "NFL", abbr: "WAS", rank: "NFC East" },
  // MLB
  { name: "Houston Astros", league: "MLB", abbr: "HOU", rank: "AL West" },
  { name: "New York Yankees", league: "MLB", abbr: "NYY", rank: "AL East" },
  { name: "Los Angeles Dodgers", league: "MLB", abbr: "LAD", rank: "NL West" },
  { name: "Atlanta Braves", league: "MLB", abbr: "ATL", rank: "NL East" },
  { name: "Boston Red Sox", league: "MLB", abbr: "BOS", rank: "AL East" },
  { name: "San Diego Padres", league: "MLB", abbr: "SD", rank: "NL West" },
  { name: "Seattle Mariners", league: "MLB", abbr: "SEA", rank: "AL West" },
  // MLS
  { name: "Vancouver Whitecaps", league: "MLS", abbr: "VAN", rank: "1st West" },
  { name: "Los Angeles FC", league: "MLS", abbr: "LAFC", rank: "2nd West" },
  { name: "Houston Dynamo", league: "MLS", abbr: "HOU", rank: "3rd West" },
  { name: "Inter Miami CF", league: "MLS", abbr: "MIA", rank: "4th East" },
  { name: "New England Revolution", league: "MLS", abbr: "NE", rank: "1st East" },
];

const PLAYER_INDEX = [
  // NBA Stars
  { name: "Shai Gilgeous-Alexander", team: "Oklahoma City Thunder", league: "NBA", position: "G", stat: "32.1 PPG" },
  { name: "Victor Wembanyama", team: "San Antonio Spurs", league: "NBA", position: "C", stat: "28.4 PPG, 4.1 BPG" },
  { name: "Luka Dončić", team: "Los Angeles Lakers", league: "NBA", position: "G", stat: "29.8 PPG, 9.2 APG" },
  { name: "LeBron James", team: "Los Angeles Lakers", league: "NBA", position: "F", stat: "24.3 PPG" },
  { name: "Cade Cunningham", team: "Detroit Pistons", league: "NBA", position: "G", stat: "28.9 PPG, 9.4 APG (injured)" },
  { name: "Nikola Jokić", team: "Denver Nuggets", league: "NBA", position: "C", stat: "26.8 PPG, 12.4 REB" },
  { name: "Jayson Tatum", team: "Boston Celtics", league: "NBA", position: "F", stat: "27.1 PPG" },
  { name: "Kevin Durant", team: "Houston Rockets", league: "NBA", position: "F", stat: "23.6 PPG" },
  { name: "Amen Thompson", team: "Houston Rockets", league: "NBA", position: "G", stat: "17.9 PPG, 7.8 REB" },
  { name: "Jalen Green", team: "Houston Rockets", league: "NBA", position: "G", stat: "22.1 PPG" },
  { name: "Alperen Şengün", team: "Houston Rockets", league: "NBA", position: "C", stat: "19.3 PPG, 8.7 REB" },
  { name: "LaMelo Ball", team: "Charlotte Hornets", league: "NBA", position: "G", stat: "27.4 PPG, 8.2 APG" },
  { name: "Giannis Antetokounmpo", team: "Milwaukee Bucks", league: "NBA", position: "F", stat: "30.2 PPG, 11.8 REB" },
  { name: "Anthony Davis", team: "Los Angeles Lakers", league: "NBA", position: "C", stat: "24.1 PPG, 12.3 REB" },
  { name: "Ja Morant", team: "Memphis Grizzlies", league: "NBA", position: "G", stat: "26.8 PPG" },
  { name: "Anthony Edwards", team: "Minnesota Timberwolves", league: "NBA", position: "G", stat: "27.3 PPG (out, knee)" },
  { name: "Devin Booker", team: "Phoenix Suns", league: "NBA", position: "G", stat: "33.9 PPG (last 4 games)" },
  { name: "Paolo Banchero", team: "Orlando Magic", league: "NBA", position: "F", stat: "24.2 PPG" },
  { name: "Trae Young", team: "Atlanta Hawks", league: "NBA", position: "G", stat: "26.4 PPG, 10.8 APG" },
  { name: "Stephen Curry", team: "Golden State Warriors", league: "NBA", position: "G", stat: "26.8 PPG" },
  { name: "Donovan Mitchell", team: "Cleveland Cavaliers", league: "NBA", position: "G", stat: "26.9 PPG" },
  { name: "Evan Mobley", team: "Cleveland Cavaliers", league: "NBA", position: "C", stat: "20.4 PPG, 10.1 REB" },
  // NFL
  { name: "Patrick Mahomes", team: "Kansas City Chiefs", league: "NFL", position: "QB", stat: "4,847 pass yds, 39 TD" },
  { name: "Josh Allen", team: "Buffalo Bills", league: "NFL", position: "QB", stat: "4,544 pass yds, 36 TD" },
  { name: "Jalen Hurts", team: "Philadelphia Eagles", league: "NFL", position: "QB", stat: "3,988 pass yds, 31 TD" },
  { name: "Justin Jefferson", team: "Minnesota Vikings", league: "NFL", position: "WR", stat: "1,512 rec yds, 10 TD" },
  { name: "Jaylen Waddle", team: "Denver Broncos", league: "NFL", position: "WR", stat: "Traded from MIA" },
  { name: "Lamar Jackson", team: "Baltimore Ravens", league: "NFL", position: "QB", stat: "3,843 pass yds, 37 TD" },
  { name: "Kyler Murray", team: "Minnesota Vikings", league: "NFL", position: "QB", stat: "Signed 1-year deal" },
  { name: "Kenneth Walker III", team: "Kansas City Chiefs", league: "NFL", position: "RB", stat: "Super Bowl MVP" },
  // MLB
  { name: "Aaron Judge", team: "New York Yankees", league: "MLB", position: "OF", stat: ".295 / 48 HR / 124 RBI" },
  { name: "Yordan Alvarez", team: "Houston Astros", league: "MLB", position: "DH", stat: ".291 / 39 HR / 109 RBI" },
  { name: "Gerrit Cole", team: "New York Yankees", league: "MLB", position: "SP", stat: "TJS return — Spring 2026" },
  { name: "Julio Rodríguez", team: "Seattle Mariners", league: "MLB", position: "OF", stat: ".284 / 31 HR" },
  { name: "Elly De La Cruz", team: "Cincinnati Reds", league: "MLB", position: "SS", stat: ".278 / 28 HR, 40 SB" },
  // MLS
  { name: "Petar Musa", team: "Vancouver Whitecaps", league: "MLS", position: "FW", stat: "5 goals (league leader)" },
  { name: "Cucho Hernandez", team: "Columbus Crew", league: "MLS", position: "FW", stat: "3 goals, 2 assists" },
];

const LEAGUE_COLORS: Record<string, string> = {
  NBA: C.nba, NFL: C.nfl, MLB: C.mlb, MLS: C.mls, NCAA: C.ncaa,
};

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
  const inputRef = useRef<TextInput>(null);
  const slideAnim = useRef(new Animated.Value(-50)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const { data: gamesData } = useQuery({ queryKey: ["games"], queryFn: () => api.getGames(), enabled: isOpen });
  const { data: newsData } = useQuery({ queryKey: ["news-all"], queryFn: () => api.getNews(), enabled: isOpen });

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

  const matchedTeams = q.length >= 1
    ? TEAM_INDEX.filter(t =>
        t.name.toLowerCase().includes(q) ||
        t.abbr.toLowerCase().includes(q) ||
        t.league.toLowerCase().includes(q)
      )
    : TEAM_INDEX.filter(t => myTeams.includes(t.name)).slice(0, 5);

  const matchedPlayers = q.length >= 2
    ? PLAYER_INDEX.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.team.toLowerCase().includes(q) ||
        p.position.toLowerCase().includes(q)
      ).slice(0, 6)
    : PLAYER_INDEX.filter(p => myTeams.some(t => p.team === t)).slice(0, 4);

  const matchedGames = q.length >= 2
    ? (gamesData?.games ?? []).filter(g =>
        g.homeTeam.toLowerCase().includes(q) ||
        g.awayTeam.toLowerCase().includes(q) ||
        g.league.toLowerCase().includes(q)
      ).slice(0, 3)
    : [];

  const matchedNews = q.length >= 2
    ? (newsData?.articles ?? []).filter(a =>
        a.title.toLowerCase().includes(q) ||
        a.tags.some((t: string) => t.toLowerCase().includes(q))
      ).slice(0, 3)
    : [];

  // Sort: my teams first
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

  const goTeam = (team: (typeof TEAM_INDEX)[0]) => {
    handleClose();
    router.push({ pathname: "/(tabs)/standings" } as any);
  };

  const goPlayer = (player: (typeof PLAYER_INDEX)[0]) => {
    handleClose();
    // Find news about this player's team and navigate there
    router.push({ pathname: "/(tabs)/news" } as any);
  };

  const goGame = (gameId: string) => {
    handleClose();
    router.push({ pathname: "/game/[id]", params: { id: gameId } } as any);
  };

  const goArticle = (article: any) => {
    handleClose();
    router.push({ pathname: "/article/[id]", params: { id: article.id, article: JSON.stringify(article) } } as any);
  };

  const QUICK_SEARCHES = ["Rockets", "Lakers", "NBA Standings", "NFL Free Agency", "MLB Spring Training", "March Madness"];

  return (
    <Modal visible={isOpen} transparent animationType="none" onRequestClose={handleClose} statusBarTranslucent>
      <Animated.View style={[styles.backdrop, { opacity: opacityAnim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
      </Animated.View>

      <Animated.View style={[styles.sheet, { paddingTop: topPad, transform: [{ translateY: slideAnim }], opacity: opacityAnim }]}>
        {/* Search Bar */}
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
          {/* Quick search chips when empty */}
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

          {/* Teams */}
          {sortedTeams.length > 0 && (
            <>
              <SectionHeader title={q.length === 0 ? "My Teams" : "Teams"} />
              {sortedTeams.slice(0, 6).map(team => (
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

          {/* Players */}
          {matchedPlayers.length > 0 && (
            <>
              <SectionHeader title={q.length === 0 ? "My Team Players" : "Players"} />
              {matchedPlayers.map(player => (
                <ResultRow
                  key={player.name}
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

          {/* Live/Today's Games */}
          {matchedGames.length > 0 && (
            <>
              <SectionHeader title="Games" />
              {matchedGames.map(game => (
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

          {/* News */}
          {matchedNews.length > 0 && (
            <>
              <SectionHeader title="News" />
              {matchedNews.map(article => (
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

          {/* No results */}
          {q.length >= 2 && sortedTeams.length === 0 && matchedPlayers.length === 0 && matchedGames.length === 0 && matchedNews.length === 0 && (
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
    maxHeight: 560,
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
