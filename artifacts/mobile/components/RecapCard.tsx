import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "@/constants/colors";
import type { Game, RecapResponse } from "@/utils/api";
import { api } from "@/utils/api";

const C = Colors.dark;

interface RecapCardProps {
  game: Game;
}

export function RecapCard({ game }: RecapCardProps) {
  const [recap, setRecap] = useState<RecapResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const winner = (game.homeScore ?? 0) > (game.awayScore ?? 0) ? game.homeTeam : game.awayTeam;
  const loser = (game.homeScore ?? 0) > (game.awayScore ?? 0) ? game.awayTeam : game.homeTeam;
  const winScore = Math.max(game.homeScore ?? 0, game.awayScore ?? 0);
  const loseScore = Math.min(game.homeScore ?? 0, game.awayScore ?? 0);

  const loadRecap = async () => {
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
      setRecap(result);
    } catch (e) {
      setRecap({
        summary: `${winner} defeated ${loser} ${winScore}-${loseScore}.`,
        keyPlayer: "Team effort",
        whatItMeans: "Important win for playoff positioning.",
      });
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadRecap();
  }, []);

  return (
    <View style={styles.card}>
      <LinearGradient
        colors={["rgba(255,214,10,0.08)", "rgba(255,214,10,0.02)"]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <View style={styles.header}>
        <View style={styles.recapBadge}>
          <Ionicons name="trophy" size={12} color={C.accentGold} />
          <Text style={styles.recapBadgeText}>POSTGAME RECAP</Text>
        </View>
        <Text style={styles.leagueTag}>{game.league}</Text>
      </View>

      <Text style={styles.scoreTitle}>
        {winner} <Text style={styles.scoreNumbers}>{winScore}</Text>–<Text style={styles.scoreNumbers}>{loseScore}</Text> {loser}
      </Text>

      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={C.accentGold} />
          <Text style={styles.loadingText}>Generating AI recap...</Text>
        </View>
      ) : recap ? (
        <View style={styles.recapContent}>
          <Text style={styles.recapSummary}>{recap.summary}</Text>
          <View style={styles.keyPlayerRow}>
            <Ionicons name="star" size={14} color={C.accentGold} />
            <Text style={styles.keyPlayerLabel}>Key Player: </Text>
            <Text style={styles.keyPlayerName}>{recap.keyPlayer}</Text>
          </View>
          <View style={styles.meansRow}>
            <Ionicons name="trending-up" size={14} color={C.accentGreen} />
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
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,214,10,0.2)",
    overflow: "hidden",
    gap: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  recapBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,214,10,0.15)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  recapBadgeText: {
    color: C.accentGold,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  leagueTag: {
    color: C.textTertiary,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  scoreTitle: {
    color: C.text,
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    lineHeight: 22,
  },
  scoreNumbers: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: C.accentGold,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  loadingText: {
    color: C.textTertiary,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  recapContent: {
    gap: 10,
  },
  recapSummary: {
    color: C.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    fontFamily: "Inter_400Regular",
  },
  keyPlayerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,214,10,0.08)",
    padding: 10,
    borderRadius: 10,
  },
  keyPlayerLabel: {
    color: C.textSecondary,
    fontSize: 13,
    fontWeight: "500",
  },
  keyPlayerName: {
    color: C.accentGold,
    fontSize: 13,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  meansRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    backgroundColor: "rgba(48,209,88,0.08)",
    padding: 10,
    borderRadius: 10,
  },
  meansText: {
    flex: 1,
    color: C.accentGreen,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
  },
});
