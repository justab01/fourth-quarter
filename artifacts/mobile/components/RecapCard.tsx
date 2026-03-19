import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import type { Game, RecapResponse } from "@/utils/api";
import { api } from "@/utils/api";
import { goToTeam, goToPlayer } from "@/utils/navHelpers";

const C = Colors.dark;

interface RecapCardProps {
  game: Game;
}

export function RecapCard({ game }: RecapCardProps) {
  const [recap, setRecap] = useState<RecapResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const winner = (game.homeScore ?? 0) >= (game.awayScore ?? 0) ? game.homeTeam : game.awayTeam;
  const loser = (game.homeScore ?? 0) >= (game.awayScore ?? 0) ? game.awayTeam : game.homeTeam;
  const winScore = Math.max(game.homeScore ?? 0, game.awayScore ?? 0);
  const loseScore = Math.min(game.homeScore ?? 0, game.awayScore ?? 0);

  useEffect(() => {
    let mounted = true;
    async function loadRecap() {
      if (loading || recap) return;
      setLoading(true);
      try {
        const result = await api.generateRecap({
          homeTeam: game.homeTeam,
          awayTeam: game.awayTeam,
          homeScore: game.homeScore ?? 0,
          awayScore: game.awayScore ?? 0,
          keyPlays: [],
          stats: {},
          league: game.league,
        });
        if (mounted) setRecap(result);
      } catch (e) {
        if (mounted) {
          setRecap({
            summary: `${winner} defeated ${loser} ${winScore}-${loseScore} in tonight's ${game.league} matchup.`,
            keyPlayer: "Team effort",
            whatItMeans: "Important win for playoff positioning.",
          });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadRecap();
    return () => { mounted = false; };
  }, []);

  return (
    <View style={styles.card}>
      <LinearGradient
        colors={["rgba(255,214,10,0.08)", "transparent"]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <View style={styles.topRow}>
        <View style={styles.aiBadge}>
          <Ionicons name="sparkles" size={11} color={C.accentGold} />
          <Text style={styles.aiBadgeText}>AI RECAP</Text>
        </View>
        <View style={[styles.leaguePill, { backgroundColor: "rgba(255,255,255,0.06)" }]}>
          <Text style={styles.leaguePillText}>{game.league}</Text>
        </View>
      </View>

      <View style={styles.scoreRow}>
        <Pressable onPress={() => goToTeam(winner, game.league)}>
          <Text style={styles.winTeam}>{winner}</Text>
        </Pressable>
        <Text style={styles.scoreNum}> {winScore}</Text>
        <Text style={styles.scoreSep}> – </Text>
        <Text style={styles.scoreNum}>{loseScore}</Text>
        <Text style={styles.scoreSep}> </Text>
        <Pressable onPress={() => goToTeam(loser, game.league)}>
          <Text style={styles.loseTeam}>{loser}</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={C.accentGold} />
          <Text style={styles.loadingText}>Generating recap...</Text>
        </View>
      ) : recap ? (
        <View style={styles.recapBody}>
          <Text style={styles.summary}>{recap.summary}</Text>
          <Pressable
            style={styles.keyPlayerCard}
            onPress={() => recap.keyPlayer && recap.keyPlayer !== "Team effort" ? goToPlayer(recap.keyPlayer) : undefined}
          >
            <View style={styles.keyPlayerLeft}>
              <Ionicons name="star" size={14} color={C.accentGold} />
              <Text style={styles.keyPlayerLabel}>Key Player</Text>
            </View>
            <Text style={[
              styles.keyPlayerName,
              recap.keyPlayer && recap.keyPlayer !== "Team effort" && styles.keyPlayerTappable,
            ]}>
              {recap.keyPlayer}
            </Text>
          </Pressable>
          <View style={styles.meansCard}>
            <Ionicons name="trending-up" size={13} color={C.accentGreen} />
            <Text style={styles.meansText}>{recap.whatItMeans}</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.card,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1.5,
    borderColor: "rgba(255,214,10,0.18)",
    overflow: "hidden",
    gap: 14,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  aiBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,214,10,0.12)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  aiBadgeText: {
    color: C.accentGold,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },
  leaguePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  leaguePillText: {
    color: C.textTertiary,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  winTeam: {
    color: C.text,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    lineHeight: 22,
    textDecorationLine: "underline",
    textDecorationColor: C.text + "44",
  },
  scoreNum: {
    color: C.accentGold,
    fontWeight: "900",
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    lineHeight: 22,
  },
  scoreSep: {
    color: C.textTertiary,
    fontWeight: "300",
    fontSize: 15,
    lineHeight: 22,
  },
  loseTeam: {
    color: C.textTertiary,
    fontWeight: "500",
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    lineHeight: 22,
    textDecorationLine: "underline",
    textDecorationColor: C.textTertiary + "44",
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  loadingText: {
    color: C.textTertiary,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  recapBody: { gap: 10 },
  summary: {
    color: C.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    fontFamily: "Inter_400Regular",
  },
  keyPlayerCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,214,10,0.07)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  keyPlayerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  keyPlayerLabel: {
    color: C.textTertiary,
    fontSize: 12,
    fontWeight: "600",
  },
  keyPlayerName: {
    color: C.accentGold,
    fontSize: 13,
    fontWeight: "800",
    fontFamily: "Inter_700Bold",
  },
  keyPlayerTappable: {
    textDecorationLine: "underline",
    textDecorationColor: C.accentGold + "66",
  },
  meansCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "rgba(52,199,89,0.07)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  meansText: {
    flex: 1,
    color: C.accentGreen,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
    fontFamily: "Inter_500Medium",
  },
});
