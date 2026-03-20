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

function StreakIcon({ streak }: { streak: string | null }) {
  if (!streak) return null;
  const isWin = streak.startsWith("W");
  const num = parseInt(streak.slice(1));
  return (
    <View style={[streakStyles.pill, { backgroundColor: isWin ? "rgba(52,199,89,0.15)" : "rgba(255,59,48,0.12)" }]}>
      <Text style={[streakStyles.text, { color: isWin ? C.accentGreen : C.accent }]}>
        {isWin ? "W" : "L"}{num}
      </Text>
    </View>
  );
}

const streakStyles = StyleSheet.create({
  pill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  text: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
});

function RankChange({ delta }: { delta: number | null }) {
  if (!delta || delta === 0) return <View style={{ width: 16 }} />;
  return (
    <Ionicons
      name={delta > 0 ? "caret-up" : "caret-down"}
      size={10}
      color={delta > 0 ? C.accentGreen : C.accent}
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
  const displayLeagues = supportedLeagues;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: topPad, paddingBottom: botPad }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Standings</Text>
        </View>

        {/* League Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.leagueRow}
          style={styles.leagueScroll}
        >
          {displayLeagues.map(l => {
            const active = activeLeague === l;
            const meta = LEAGUE_META[l] ?? { color: C.accent };
            return (
              <Pressable key={l} onPress={() => setActiveLeague(l)}>
                <View style={[styles.leagueChip, active && { borderColor: meta.color, backgroundColor: `${meta.color}18` }]}>
                  <Text style={[styles.leagueChipText, active && { color: meta.color }]}>{l}</Text>
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
            {/* Table Header */}
            <View style={[styles.tableHead, { borderBottomColor: `${leagueMeta.color}33` }]}>
              <Text style={styles.thRank}>#</Text>
              <Text style={styles.thTeam}>TEAM</Text>
              <Text style={styles.thStat}>W</Text>
              <Text style={styles.thStat}>L</Text>
              <Text style={styles.thStat}>PCT</Text>
              <Text style={styles.thStat}>GB</Text>
              <Text style={styles.thStat}>STK</Text>
            </View>

            {standings.map((entry, idx) => {
              const isMyTeam = preferences.favoriteTeams.includes(entry.teamName);
              const isEven = idx % 2 === 1;

              return (
                <Pressable
                  key={entry.teamName}
                  onPress={() => goToTeam(entry.teamName, activeLeague)}
                  style={[
                    styles.tableRow,
                    isEven && styles.tableRowStripe,
                    isMyTeam && styles.tableRowHighlight,
                  ]}
                >
                  {isMyTeam && (
                    <LinearGradient
                      colors={[`${leagueMeta.color}18`, "transparent"]}
                      style={StyleSheet.absoluteFill}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    />
                  )}
                  {isMyTeam && (
                    <View style={[styles.myTeamBar, { backgroundColor: leagueMeta.color }]} />
                  )}
                  <View style={styles.tdRank}>
                    <Text style={[styles.rankNum, isMyTeam && { color: leagueMeta.color, fontFamily: "Inter_700Bold" }]}>
                      {entry.rank}
                    </Text>
                    <RankChange delta={entry.rankChange} />
                  </View>

                  <View style={styles.tdTeam}>
                    <View style={[styles.teamDot, { backgroundColor: isMyTeam ? leagueMeta.color : "rgba(255,255,255,0.12)" }]}>
                      <Text style={styles.teamDotText}>{entry.teamName.charAt(0)}</Text>
                    </View>
                    <Text
                      style={[styles.teamText, isMyTeam && { color: C.text, fontFamily: "Inter_700Bold" }]}
                      numberOfLines={1}
                    >
                      {entry.teamName}
                    </Text>
                  </View>

                  <Text style={[styles.tdStat, isMyTeam && { color: C.text }]}>{entry.wins}</Text>
                  <Text style={[styles.tdStat, isMyTeam && { color: C.text }]}>{entry.losses}</Text>
                  <Text style={[styles.tdStat, isMyTeam && { color: leagueMeta.color, fontFamily: "Inter_700Bold" }]}>
                    {entry.winPct.toFixed(3)}
                  </Text>
                  <Text style={[styles.tdStat, isMyTeam && { color: C.text }]}>
                    {entry.gamesBack == null ? "—" : entry.gamesBack === 0 ? "-" : entry.gamesBack}
                  </Text>
                  <View style={styles.tdStreak}>
                    <StreakIcon streak={entry.streak} />
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        {/* My Teams legend note */}
        {preferences.favoriteTeams.length > 0 && (
          <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: leagueMeta.color }]} />
            <Text style={styles.legendText}>Your teams are highlighted · Tap any row to see team page</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  scroll: { paddingHorizontal: 20, gap: 4 },
  header: { paddingTop: 16, paddingBottom: 12 },
  title: {
    fontSize: 34,
    fontWeight: "900",
    color: C.text,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  leagueScroll: { marginBottom: 16 },
  leagueRow: { gap: 8, paddingRight: 20 },
  leagueChip: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 22,
    backgroundColor: C.card,
    borderWidth: 1.5,
    borderColor: C.cardBorder,
  },
  leagueChipText: {
    color: C.textSecondary,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  loading: { paddingVertical: 80, alignItems: "center" },
  table: {
    backgroundColor: C.card,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  tableHead: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1.5,
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  thRank: {
    width: 44,
    color: C.textTertiary,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  thTeam: {
    flex: 1,
    color: C.textTertiary,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  thStat: {
    width: 38,
    textAlign: "center",
    color: C.textTertiary,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: C.separator,
    position: "relative",
    overflow: "hidden",
  },
  tableRowStripe: {
    backgroundColor: "rgba(255,255,255,0.015)",
  },
  tableRowHighlight: {
    borderBottomColor: "rgba(255,255,255,0.04)",
  },
  myTeamBar: {
    position: "absolute",
    left: 0,
    top: 8,
    bottom: 8,
    width: 3,
    borderRadius: 2,
  },
  tdRank: {
    width: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingLeft: 6,
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
    gap: 10,
  },
  teamDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  teamDotText: {
    color: C.text,
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  teamText: {
    color: C.textSecondary,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    flex: 1,
  },
  tdStat: {
    width: 38,
    textAlign: "center",
    color: C.textTertiary,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  tdStreak: {
    width: 38,
    alignItems: "center",
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
  },
  legendDot: {
    width: 8, height: 8, borderRadius: 4,
  },
  legendText: {
    color: C.textTertiary,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
});
