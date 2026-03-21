import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  Platform, ActivityIndicator
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { api, StandingEntry } from "@/utils/api";
import { usePreferences } from "@/context/PreferencesContext";
import { goToTeam } from "@/utils/navHelpers";

const C = Colors.dark;

const LEAGUE_META: Record<string, { color: string; label: string }> = {
  NBA: { color: C.nba, label: "NBA" },
  NFL: { color: C.nfl, label: "NFL" },
  MLB: { color: C.mlb, label: "MLB" },
  MLS: { color: C.mls, label: "MLS" },
};

function StreakBadge({ streak }: { streak: string | null }) {
  if (!streak) return null;
  const isWin = streak.startsWith("W");
  const num = parseInt(streak.slice(1));
  return (
    <View style={[streak_s.pill, { backgroundColor: isWin ? `${C.accentGreen}18` : `${C.live}14` }]}>
      <Text style={[streak_s.text, { color: isWin ? C.accentGreen : C.live }]}>
        {isWin ? "W" : "L"}{num}
      </Text>
    </View>
  );
}

const streak_s = StyleSheet.create({
  pill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5 },
  text: { fontSize: 11, fontWeight: "800", letterSpacing: 0.3 },
});

function RankChange({ delta }: { delta: number | null }) {
  if (!delta || delta === 0) return <View style={{ width: 10 }} />;
  return (
    <Ionicons
      name={delta > 0 ? "caret-up" : "caret-down"}
      size={9}
      color={delta > 0 ? C.accentGreen : C.live}
    />
  );
}

export default function StandingsScreen() {
  const insets = useSafeAreaInsets();
  const { preferences } = usePreferences();

  const supportedLeagues = ["NBA", "NFL", "MLB", "MLS"];
  const myLeagues = preferences.favoriteLeagues.filter(l => supportedLeagues.includes(l));
  const defaultLeague = myLeagues[0] ?? "NBA";
  const [activeLeague, setActiveLeague] = useState(defaultLeague);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 + 84 : insets.bottom + 72;

  const { data, isLoading } = useQuery({
    queryKey: ["standings", activeLeague],
    queryFn: () => api.getStandings(activeLeague),
    staleTime: 60000,
  });

  const standings = data?.standings ?? [];
  const leagueMeta = LEAGUE_META[activeLeague] ?? { color: C.accent, label: activeLeague };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: topPad, paddingBottom: botPad }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Standings</Text>
          <View style={[styles.leagueDot, { backgroundColor: leagueMeta.color }]} />
        </View>

        {/* League tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.leagueRow}
          style={styles.leagueScroll}
        >
          {supportedLeagues.map(l => {
            const active = activeLeague === l;
            const meta   = LEAGUE_META[l] ?? { color: C.accent };
            return (
              <Pressable key={l} onPress={() => setActiveLeague(l)}>
                <View style={[styles.chip, active && { borderColor: meta.color, backgroundColor: `${meta.color}18` }]}>
                  <Text style={[styles.chipText, active && { color: meta.color }]}>{l}</Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        {isLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={leagueMeta.color} size="large" />
          </View>
        ) : (
          <View style={styles.table}>
            {/* Table header */}
            <View style={[styles.tableHead, { borderBottomColor: `${leagueMeta.color}33` }]}>
              <Text style={styles.thRank}>#</Text>
              <Text style={styles.thTeam}>TEAM</Text>
              <Text style={styles.thStat}>W</Text>
              <Text style={styles.thStat}>L</Text>
              <Text style={styles.thStat}>W-L%</Text>
              <Text style={styles.thStreak}>STK</Text>
            </View>

            {standings.map((entry, idx) => {
              const isMyTeam = preferences.favoriteTeams.includes(entry.teamName);
              const isEven   = idx % 2 === 1;

              return (
                <Pressable
                  key={entry.teamName}
                  onPress={() => goToTeam(entry.teamName, activeLeague)}
                  style={[
                    styles.tableRow,
                    isEven && styles.tableRowAlt,
                    idx < standings.length - 1 && styles.tableRowBorder,
                    isMyTeam && styles.tableRowHighlight,
                  ]}
                >
                  {isMyTeam && (
                    <LinearGradient
                      colors={[`${leagueMeta.color}16`, "transparent"]}
                      style={StyleSheet.absoluteFill}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    />
                  )}
                  {isMyTeam && (
                    <View style={[styles.myTeamBar, { backgroundColor: leagueMeta.color }]} />
                  )}

                  {/* Rank */}
                  <View style={styles.tdRank}>
                    <Text style={[styles.rankNum, isMyTeam && { color: leagueMeta.color, fontWeight: "800" }]}>
                      {entry.rank}
                    </Text>
                    <RankChange delta={entry.rankChange} />
                  </View>

                  {/* Team */}
                  <View style={styles.tdTeam}>
                    <View style={[styles.teamCircle, { backgroundColor: isMyTeam ? `${leagueMeta.color}22` : "rgba(255,255,255,0.06)" }]}>
                      <Text style={[styles.teamCircleLetter, isMyTeam && { color: leagueMeta.color }]}>
                        {entry.teamName.charAt(0)}
                      </Text>
                    </View>
                    <Text
                      style={[styles.teamText, isMyTeam && { color: C.text, fontWeight: "700" }]}
                      numberOfLines={1}
                    >
                      {entry.teamName}
                    </Text>
                    {isMyTeam && (
                      <Ionicons name="star" size={10} color={leagueMeta.color} style={{ marginLeft: 2 }} />
                    )}
                  </View>

                  {/* Stats: W | L | W-L% | STK */}
                  <Text style={[styles.tdStat, isMyTeam && { color: C.text }]}>{entry.wins}</Text>
                  <Text style={[styles.tdStat, isMyTeam && { color: C.text }]}>{entry.losses}</Text>
                  <Text style={[styles.tdStat, isMyTeam && { color: leagueMeta.color, fontWeight: "700" }]}>
                    {entry.winPct.toFixed(3)}
                  </Text>
                  <View style={styles.tdStreak}>
                    <StreakBadge streak={entry.streak} />
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        {/* Legend */}
        {preferences.favoriteTeams.length > 0 && (
          <View style={styles.legend}>
            <View style={[styles.legendDot, { backgroundColor: leagueMeta.color }]} />
            <Text style={styles.legendText}>Your teams highlighted · Tap any row to view team</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  scroll: { paddingHorizontal: 20, gap: 4 },

  header: {
    paddingTop: 16,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    color: C.text,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  leagueDot: { width: 10, height: 10, borderRadius: 5 },

  leagueScroll: { marginBottom: 14 },
  leagueRow: { gap: 8, paddingRight: 20 },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 22,
    backgroundColor: C.card,
    borderWidth: 1.5,
    borderColor: C.cardBorder,
  },
  chipText: {
    color: C.textSecondary,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.4,
  },

  loading: { paddingVertical: 80, alignItems: "center" },

  table: {
    backgroundColor: C.card,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  tableHead: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1.5,
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  thRank: {
    width: 40,
    color: C.textTertiary,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.2,
    paddingLeft: 6,
  },
  thTeam: {
    flex: 1,
    color: C.textTertiary,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  thStat: {
    width: 36,
    textAlign: "center",
    color: C.textTertiary,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  thStreak: {
    width: 38,
    textAlign: "center",
    color: C.textTertiary,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.2,
  },

  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 11,
    position: "relative",
    overflow: "hidden",
  },
  tableRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.separator,
  },
  tableRowAlt: { backgroundColor: "rgba(255,255,255,0.012)" },
  tableRowHighlight: {},
  myTeamBar: {
    position: "absolute",
    left: 0,
    top: 8,
    bottom: 8,
    width: 3,
    borderRadius: 2,
  },

  tdRank: {
    width: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingLeft: 4,
  },
  rankNum: {
    color: C.textSecondary,
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    minWidth: 18,
  },

  tdTeam: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  teamCircle: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  teamCircleLetter: {
    color: C.text, fontSize: 11, fontWeight: "800", fontFamily: "Inter_700Bold",
  },
  teamText: {
    color: C.textSecondary,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    flex: 1,
  },

  tdStat: {
    width: 36,
    textAlign: "center",
    color: C.textTertiary,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  tdStreak: { width: 38, alignItems: "center" },

  legend: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
  },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { color: C.textTertiary, fontSize: 12, fontFamily: "Inter_400Regular" },
});
