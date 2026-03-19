import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Platform, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { api, StandingEntry } from "@/utils/api";
import { usePreferences } from "@/context/PreferencesContext";
import { LEAGUE_COLORS } from "@/constants/sports";

const C = Colors.dark;

export default function StandingsScreen() {
  const insets = useSafeAreaInsets();
  const { preferences } = usePreferences();
  const myLeagues = preferences.favoriteLeagues.filter(l => ["NFL", "NBA", "MLB", "MLS"].includes(l));
  const defaultLeague = myLeagues[0] ?? "NBA";
  const [activeLeague, setActiveLeague] = useState(defaultLeague);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 + 84 : insets.bottom + 70;

  const { data, isLoading } = useQuery({
    queryKey: ["standings", activeLeague],
    queryFn: () => api.getStandings(activeLeague),
    staleTime: 60000,
  });

  const standings = data?.standings ?? [];
  const leagueColor = LEAGUE_COLORS[activeLeague] ?? C.accent;
  const displayColor = leagueColor === "#013087" || leagueColor === "#002D72" ? "#4A90D9" : leagueColor === "#1A1A2E" ? "#4CAF50" : leagueColor;

  const leagues = myLeagues.length > 0 ? myLeagues : ["NFL", "NBA", "MLB"];

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: topPad, paddingBottom: botPad }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Standings</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterRow}>
          {leagues.map(league => {
            const active = activeLeague === league;
            const lc = LEAGUE_COLORS[league] ?? C.accent;
            const dc = lc === "#013087" || lc === "#002D72" ? "#4A90D9" : lc === "#1A1A2E" ? "#4CAF50" : lc;
            return (
              <Pressable key={league} onPress={() => setActiveLeague(league)}>
                <View style={[styles.filterChip, active && { backgroundColor: dc + "22", borderColor: dc }]}>
                  <Text style={[styles.filterText, active && { color: dc }]}>{league}</Text>
                </View>
              </Pressable>
            );
          })}
          {!leagues.includes("NFL") && <Pressable onPress={() => setActiveLeague("NFL")}><View style={styles.filterChip}><Text style={styles.filterText}>NFL</Text></View></Pressable>}
          {!leagues.includes("NBA") && <Pressable onPress={() => setActiveLeague("NBA")}><View style={styles.filterChip}><Text style={styles.filterText}>NBA</Text></View></Pressable>}
          {!leagues.includes("MLB") && <Pressable onPress={() => setActiveLeague("MLB")}><View style={styles.filterChip}><Text style={styles.filterText}>MLB</Text></View></Pressable>}
        </ScrollView>

        {isLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={displayColor} size="large" />
          </View>
        ) : (
          <View style={styles.table}>
            <View style={[styles.tableHeader, { borderBottomColor: displayColor + "44" }]}>
              <Text style={[styles.thRank]}>#</Text>
              <Text style={styles.thTeam}>TEAM</Text>
              <Text style={styles.thStat}>W</Text>
              <Text style={styles.thStat}>L</Text>
              <Text style={styles.thStat}>PCT</Text>
              <Text style={styles.thStat}>STK</Text>
            </View>
            {standings.map((entry, idx) => {
              const isMyTeam = preferences.favoriteTeams.includes(entry.teamName);
              return (
                <StandingRow key={entry.teamName} entry={entry} isMyTeam={isMyTeam} leagueColor={displayColor} />
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function StandingRow({ entry, isMyTeam, leagueColor }: { entry: StandingEntry; isMyTeam: boolean; leagueColor: string }) {
  const rankChange = entry.rankChange ?? 0;
  return (
    <View style={[styles.tableRow, isMyTeam && styles.tableRowHighlight]}>
      {isMyTeam && <View style={[styles.myTeamIndicator, { backgroundColor: leagueColor }]} />}
      <View style={styles.tdRank}>
        <Text style={[styles.rankNum, isMyTeam && { color: leagueColor }]}>{entry.rank}</Text>
        {rankChange !== 0 && (
          <Ionicons
            name={rankChange > 0 ? "caret-up" : "caret-down"}
            size={10}
            color={rankChange > 0 ? C.accentGreen : C.accent}
          />
        )}
      </View>
      <View style={styles.tdTeam}>
        <View style={[styles.teamDot, { backgroundColor: isMyTeam ? leagueColor : "rgba(255,255,255,0.2)" }]} />
        <Text style={[styles.teamText, isMyTeam && { color: C.text, fontFamily: "Inter_700Bold" }]} numberOfLines={1}>
          {entry.teamName}
        </Text>
      </View>
      <Text style={styles.statText}>{entry.wins}</Text>
      <Text style={styles.statText}>{entry.losses}</Text>
      <Text style={[styles.statText, isMyTeam && { color: leagueColor }]}>{entry.winPct.toFixed(3)}</Text>
      <Text style={[styles.statText, { color: entry.streak?.startsWith("W") ? C.accentGreen : C.accent }]}>
        {entry.streak ?? "—"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  scroll: { paddingHorizontal: 20, gap: 4 },
  header: { paddingVertical: 20 },
  title: { fontSize: 32, fontWeight: "800", color: C.text, fontFamily: "Inter_700Bold" },
  filterScroll: { marginBottom: 12 },
  filterRow: { gap: 8, paddingRight: 20 },
  filterChip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: C.card, borderWidth: 1, borderColor: C.cardBorder,
  },
  filterText: { color: C.textSecondary, fontSize: 13, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  loading: { flex: 1, alignItems: "center", paddingVertical: 80 },
  table: {
    backgroundColor: C.card,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  tableHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  thRank: { width: 36, color: C.textTertiary, fontSize: 11, fontWeight: "700", letterSpacing: 0.5 },
  thTeam: { flex: 1, color: C.textTertiary, fontSize: 11, fontWeight: "700", letterSpacing: 0.5 },
  thStat: { width: 40, textAlign: "center", color: C.textTertiary, fontSize: 11, fontWeight: "700", letterSpacing: 0.5 },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.separator,
    position: "relative",
  },
  tableRowHighlight: {
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  myTeamIndicator: {
    position: "absolute",
    left: 0,
    top: 8,
    bottom: 8,
    width: 3,
    borderRadius: 1.5,
  },
  tdRank: { width: 36, flexDirection: "row", alignItems: "center", gap: 2 },
  rankNum: { color: C.textSecondary, fontSize: 14, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  tdTeam: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  teamDot: { width: 10, height: 10, borderRadius: 5 },
  teamText: { color: C.textSecondary, fontSize: 14, fontFamily: "Inter_500Medium", flex: 1 },
  statText: { width: 40, textAlign: "center", color: C.textSecondary, fontSize: 13, fontFamily: "Inter_400Regular" },
});
