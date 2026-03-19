import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  Platform, ActivityIndicator
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { api } from "@/utils/api";
import { LEAGUE_COLORS } from "@/constants/sports";

const C = Colors.dark;

type GameTab = "summary" | "stats" | "lineups";

export default function GameDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<GameTab>("summary");

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const { data, isLoading } = useQuery({
    queryKey: ["game", id],
    queryFn: () => api.getGameDetail(id ?? ""),
    enabled: !!id,
  });

  const game = data?.game;
  const leagueColor = game ? (LEAGUE_COLORS[game.league] ?? C.accent) : C.accent;
  const displayColor = leagueColor === "#013087" || leagueColor === "#002D72" ? "#4A90D9" : leagueColor === "#1A1A2E" ? "#4CAF50" : leagueColor;

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      {/* Back button */}
      <View style={styles.navBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={C.text} />
        </Pressable>
        <Text style={styles.navTitle}>Game Detail</Text>
        <View style={{ width: 44 }} />
      </View>

      {isLoading || !game ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={displayColor} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Score Header */}
          <LinearGradient colors={["rgba(255,255,255,0.05)", "transparent"]} style={styles.scoreHeader} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}>
            <View style={[styles.leagueTag, { backgroundColor: displayColor + "22" }]}>
              <Text style={[styles.leagueText, { color: displayColor }]}>{game.league}</Text>
              {game.status === "live" && (
                <>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>LIVE · {game.quarter} {game.timeRemaining}</Text>
                </>
              )}
              {game.status === "finished" && <Text style={styles.finalText}> · FINAL</Text>}
            </View>

            <View style={styles.scoreRow}>
              <View style={styles.teamBlock}>
                <View style={styles.teamBig}>
                  <Text style={styles.teamBigLetter}>{game.awayTeam.charAt(0)}</Text>
                </View>
                <Text style={styles.teamBigName} numberOfLines={1}>{game.awayTeam}</Text>
                <Text style={styles.teamBigLabel}>AWAY</Text>
              </View>
              <View style={styles.scoreBig}>
                {game.status !== "upcoming" ? (
                  <>
                    <Text style={styles.scoreBigNum}>{game.awayScore}</Text>
                    <Text style={styles.scoreDash}>:</Text>
                    <Text style={styles.scoreBigNum}>{game.homeScore}</Text>
                  </>
                ) : (
                  <Text style={styles.vsText}>VS</Text>
                )}
              </View>
              <View style={styles.teamBlock}>
                <View style={styles.teamBig}>
                  <Text style={styles.teamBigLetter}>{game.homeTeam.charAt(0)}</Text>
                </View>
                <Text style={styles.teamBigName} numberOfLines={1}>{game.homeTeam}</Text>
                <Text style={styles.teamBigLabel}>HOME</Text>
              </View>
            </View>
          </LinearGradient>

          {/* Tabs */}
          <View style={styles.tabs}>
            {(["summary", "stats", "lineups"] as GameTab[]).map(tab => (
              <Pressable key={tab} onPress={() => setActiveTab(tab)} style={[styles.tab, activeTab === tab && styles.tabActive]}>
                {activeTab === tab && <LinearGradient colors={[displayColor + "33", displayColor + "11"]} style={StyleSheet.absoluteFill} />}
                <Text style={[styles.tabText, activeTab === tab && { color: displayColor }]}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Tab Content */}
          {activeTab === "summary" && (
            <View style={styles.tabContent}>
              {data.aiSummary && (
                <View style={styles.aiCard}>
                  <View style={styles.aiHeader}>
                    <Ionicons name="sparkles" size={16} color={displayColor} />
                    <Text style={[styles.aiTitle, { color: displayColor }]}>AI Summary</Text>
                  </View>
                  <Text style={styles.aiText}>{data.aiSummary}</Text>
                </View>
              )}
              <Text style={styles.subTitle}>Key Plays</Text>
              {data.keyPlays.map((play, i) => (
                <View key={i} style={styles.playRow}>
                  <View style={[styles.playDot, { backgroundColor: displayColor }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.playTime}>{play.time}</Text>
                    <Text style={styles.playDesc}>{play.description}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {activeTab === "stats" && (
            <View style={styles.tabContent}>
              <StatsSection
                homeTeam={game.homeTeam}
                awayTeam={game.awayTeam}
                homeStats={data.homeStats}
                awayStats={data.awayStats}
                displayColor={displayColor}
              />
            </View>
          )}

          {activeTab === "lineups" && (
            <View style={styles.tabContent}>
              <Text style={styles.subTitle}>{game.awayTeam}</Text>
              <View style={styles.lineupList}>
                {data.awayLineup.map((player, i) => (
                  <View key={player} style={styles.lineupItem}>
                    <Text style={styles.lineupNum}>{i + 1}</Text>
                    <Text style={styles.lineupName}>{player}</Text>
                  </View>
                ))}
              </View>
              <Text style={styles.subTitle}>{game.homeTeam}</Text>
              <View style={styles.lineupList}>
                {data.homeLineup.map((player, i) => (
                  <View key={player} style={styles.lineupItem}>
                    <Text style={styles.lineupNum}>{i + 1}</Text>
                    <Text style={styles.lineupName}>{player}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

function StatsSection({ homeTeam, awayTeam, homeStats, awayStats, displayColor }: {
  homeTeam: string; awayTeam: string;
  homeStats: Record<string, string | number>;
  awayStats: Record<string, string | number>;
  displayColor: string;
}) {
  const statKeys = Object.keys(homeStats);
  return (
    <View style={styles.statsTable}>
      <View style={styles.statsHeader}>
        <Text style={styles.statsTeam} numberOfLines={1}>{awayTeam}</Text>
        <Text style={styles.statsCat}>STAT</Text>
        <Text style={styles.statsTeam} numberOfLines={1}>{homeTeam}</Text>
      </View>
      {statKeys.map(key => (
        <View key={key} style={styles.statRow}>
          <Text style={styles.statVal}>{awayStats[key]}</Text>
          <Text style={styles.statKey}>{key}</Text>
          <Text style={styles.statVal}>{homeStats[key]}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  navBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 8 },
  backBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  navTitle: { flex: 1, textAlign: "center", color: C.text, fontSize: 16, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  scroll: { paddingBottom: 40 },
  scoreHeader: { padding: 24, alignItems: "center", gap: 20 },
  leagueTag: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  leagueText: { fontSize: 12, fontWeight: "700", letterSpacing: 0.8 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.live },
  liveText: { color: C.live, fontSize: 12, fontWeight: "600" },
  finalText: { color: C.textTertiary, fontSize: 12, fontWeight: "600" },
  scoreRow: { flexDirection: "row", alignItems: "center", width: "100%", justifyContent: "space-between" },
  teamBlock: { flex: 1, alignItems: "center", gap: 8 },
  teamBig: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center", justifyContent: "center",
  },
  teamBigLetter: { color: C.text, fontSize: 20, fontWeight: "800", fontFamily: "Inter_700Bold" },
  teamBigName: { color: C.text, fontSize: 13, fontWeight: "700", fontFamily: "Inter_700Bold", textAlign: "center" },
  teamBigLabel: { color: C.textTertiary, fontSize: 10, fontWeight: "600", letterSpacing: 0.8 },
  scoreBig: { flexDirection: "row", alignItems: "center", gap: 4 },
  scoreBigNum: { fontSize: 42, fontWeight: "800", color: C.text, fontFamily: "Inter_700Bold" },
  scoreDash: { fontSize: 28, color: C.textTertiary, fontFamily: "Inter_400Regular" },
  vsText: { fontSize: 28, color: C.textTertiary, fontFamily: "Inter_700Bold" },
  tabs: { flexDirection: "row", marginHorizontal: 20, gap: 8, marginBottom: 8 },
  tab: {
    flex: 1, paddingVertical: 10, borderRadius: 12,
    alignItems: "center", backgroundColor: C.card,
    borderWidth: 1, borderColor: C.cardBorder, overflow: "hidden",
  },
  tabActive: { borderColor: "rgba(255,255,255,0.2)" },
  tabText: { color: C.textSecondary, fontSize: 13, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  tabContent: { paddingHorizontal: 20, paddingTop: 8, gap: 12 },
  aiCard: {
    backgroundColor: C.card, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: C.cardBorder, gap: 10,
  },
  aiHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  aiTitle: { fontSize: 13, fontWeight: "700", letterSpacing: 0.5 },
  aiText: { color: C.textSecondary, fontSize: 14, lineHeight: 21, fontFamily: "Inter_400Regular" },
  subTitle: { fontSize: 16, fontWeight: "700", color: C.text, fontFamily: "Inter_700Bold" },
  playRow: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  playDot: { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
  playTime: { color: C.textTertiary, fontSize: 12, fontFamily: "Inter_400Regular" },
  playDesc: { color: C.textSecondary, fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20, marginTop: 2 },
  statsTable: { backgroundColor: C.card, borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: C.cardBorder },
  statsHeader: { flexDirection: "row", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.separator },
  statsTeam: { flex: 1, color: C.textSecondary, fontSize: 12, fontWeight: "700", textAlign: "center" },
  statsCat: { width: 100, textAlign: "center", color: C.textTertiary, fontSize: 11, fontWeight: "700", letterSpacing: 0.5 },
  statRow: {
    flexDirection: "row", paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: C.separator,
  },
  statVal: { flex: 1, color: C.text, fontSize: 14, fontWeight: "600", textAlign: "center", fontFamily: "Inter_600SemiBold" },
  statKey: { width: 100, textAlign: "center", color: C.textTertiary, fontSize: 12, fontFamily: "Inter_400Regular" },
  lineupList: { gap: 8, marginBottom: 16 },
  lineupItem: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: C.card, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    borderWidth: 1, borderColor: C.cardBorder,
  },
  lineupNum: { width: 24, color: C.textTertiary, fontSize: 13, fontWeight: "600", textAlign: "center", fontFamily: "Inter_600SemiBold" },
  lineupName: { color: C.text, fontSize: 15, fontFamily: "Inter_500Medium" },
});
