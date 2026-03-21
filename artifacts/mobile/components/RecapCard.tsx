import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from "react-native";
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
  const loser  = (game.homeScore ?? 0) >= (game.awayScore ?? 0) ? game.awayTeam : game.homeTeam;
  const winScore  = Math.max(game.homeScore ?? 0, game.awayScore ?? 0);
  const loseScore = Math.min(game.homeScore ?? 0, game.awayScore ?? 0);

  useEffect(() => {
    let mounted = true;
    async function loadRecap() {
      if (loading || recap) return;
      setLoading(true);
      try {
        const result = await api.generateRecap({
          homeTeam:  game.homeTeam,
          awayTeam:  game.awayTeam,
          homeScore: game.homeScore ?? 0,
          awayScore: game.awayScore ?? 0,
          keyPlays:  [],
          stats:     {},
          league:    game.league,
        });
        if (mounted) setRecap(result);
      } catch {
        if (mounted) {
          setRecap({
            summary:     `${winner} defeated ${loser} ${winScore}–${loseScore} in tonight's ${game.league} matchup.`,
            keyPlayer:   "Team effort",
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
      <View style={styles.headerRow}>
        <View style={styles.aiBadge}>
          <Ionicons name="sparkles" size={10} color={C.accentGold} />
          <Text style={styles.aiBadgeText}>AI RECAP</Text>
        </View>
        <View style={styles.leaguePill}>
          <Text style={styles.leaguePillText}>{game.league}</Text>
        </View>
      </View>

      <View style={styles.scoreRow}>
        <Pressable onPress={() => goToTeam(winner, game.league)} style={styles.teamBtn}>
          <Text style={styles.winnerName} numberOfLines={1}>{winner}</Text>
        </Pressable>
        <View style={styles.scorePart}>
          <Text style={styles.scoreWin}>{winScore}</Text>
          <Text style={styles.scoreDash}>–</Text>
          <Text style={styles.scoreLoss}>{loseScore}</Text>
        </View>
        <Pressable onPress={() => goToTeam(loser, game.league)} style={[styles.teamBtn, { alignItems: "flex-end" }]}>
          <Text style={styles.loserName} numberOfLines={1}>{loser}</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={C.accentGold} />
          <Text style={styles.loadingText}>Generating recap…</Text>
        </View>
      ) : recap ? (
        <View style={styles.recapBody}>
          <Text style={styles.summary}>{recap.summary}</Text>
          <Pressable
            style={styles.keyPlayerCard}
            onPress={() => {
              if (recap.keyPlayer && recap.keyPlayer !== "Team effort") {
                goToPlayer(recap.keyPlayer);
              }
            }}
          >
            <View style={styles.keyLeft}>
              <Ionicons name="star" size={12} color={C.accentGold} />
              <Text style={styles.keyLabel}>Key Player</Text>
            </View>
            <Text style={[
              styles.keyName,
              recap.keyPlayer !== "Team effort" && styles.keyNameTappable,
            ]}>
              {recap.keyPlayer}
            </Text>
          </Pressable>
          <View style={styles.meansRow}>
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
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: `${C.accentGold}2A`,
    gap: 12,
    overflow: "hidden",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  aiBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: `${C.accentGold}14`,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 7,
  },
  aiBadgeText: {
    color: C.accentGold,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },
  leaguePill: {
    backgroundColor: C.glassLight,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 7,
  },
  leaguePillText: {
    color: C.textTertiary,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  teamBtn: { flex: 1 },
  winnerName: {
    color: C.text,
    fontSize: 14,
    fontWeight: "800",
    fontFamily: "Inter_700Bold",
  },
  loserName: {
    color: C.textTertiary,
    fontSize: 14,
    fontWeight: "500",
    textAlign: "right",
  },
  scorePart: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    backgroundColor: C.cardElevated,
    borderRadius: 8,
  },
  scoreWin: {
    color: C.text,
    fontSize: 18,
    fontWeight: "900",
    fontFamily: "Inter_700Bold",
  },
  scoreDash: { color: C.textTertiary, fontSize: 14, fontWeight: "300" },
  scoreLoss: {
    color: C.textTertiary,
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 4,
  },
  loadingText: { color: C.textTertiary, fontSize: 13, fontFamily: "Inter_400Regular" },
  recapBody: { gap: 10 },
  summary: {
    color: C.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: "Inter_400Regular",
  },
  keyPlayerCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: `${C.accentGold}0E`,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  keyLeft: { flexDirection: "row", alignItems: "center", gap: 6 },
  keyLabel: { color: C.textTertiary, fontSize: 12, fontWeight: "600" },
  keyName: { color: C.accentGold, fontSize: 13, fontWeight: "800", fontFamily: "Inter_700Bold" },
  keyNameTappable: { textDecorationLine: "underline", textDecorationColor: `${C.accentGold}55` },
  meansRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: `${C.accentGreen}0E`,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
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
