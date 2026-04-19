// mobile/components/team/GameCard.tsx

import React, { useState, useRef } from "react";
import {
  View, Text, StyleSheet, Pressable, Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import { FONTS, FONT_SIZES } from "@/constants/typography";
import { TeamLogo } from "@/components/GameCard";
import type { TeamData } from "@/constants/teamData";

const C = Colors.dark;

interface GameCardProps {
  game: TeamData["recentGames"][0];
  teamColor: string;
  isWin: boolean;
}

export function GameCard({ game, teamColor, isWin }: GameCardProps) {
  const [expanded, setExpanded] = useState(false);
  const rotation = useRef(new Animated.Value(0)).current;

  const toggleExpand = () => {
    Animated.timing(rotation, {
      toValue: expanded ? 0 : 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
    setExpanded(!expanded);
  };

  const rotate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  const isHome = game.opponent.trim().toLowerCase().startsWith("vs");
  const oppName = game.opponent.replace(/^(vs\.?|@)\s+/i, "").trim();

  // Parse scores from game.score (format: "112-105" or similar)
  const scores = game.score.split("-").map(s => parseInt(s.trim()) || 0);
  const teamScore = isWin ? Math.max(...scores) : Math.min(...scores);
  const oppScore = isWin ? Math.min(...scores) : Math.max(...scores);

  return (
    <View style={[styles.card, isWin && styles.winCard]}>
      <Pressable onPress={toggleExpand} style={styles.mainRow}>
        {/* W/L Badge */}
        <View style={[styles.resultBadge, { backgroundColor: isWin ? "rgba(72,173,169,0.2)" : "rgba(224,96,96,0.15)" }]}>
          <Text style={[styles.resultText, { color: isWin ? "#48ADA9" : "#E06060" }]}>{game.result}</Text>
        </View>

        {/* Opponent */}
        <View style={styles.teamInfo}>
          <View style={[styles.opponentLogo, { backgroundColor: isWin ? "rgba(72,173,169,0.15)" : "rgba(255,255,255,0.06)" }]}>
            <TeamLogo name={oppName.substring(0, 3).toUpperCase()} size={32} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.opponentPrefix}>{isHome ? "vs " : "@ "}</Text>
            <Text style={[styles.opponentName, !isWin && styles.opponentNameLoss]}>{oppName}</Text>
          </View>
        </View>

        {/* Scores */}
        <View style={styles.scoreBox}>
          <View style={styles.scoreRow}>
            <Text style={[styles.scoreMain, { color: isWin ? "#48ADA9" : "rgba(255,255,255,0.6)" }]}>{teamScore}</Text>
            <Text style={styles.scoreDash}>-</Text>
            <Text style={[styles.scoreOther, { color: isWin ? "rgba(255,255,255,0.6)" : C.text }]}>{oppScore}</Text>
          </View>
          <Text style={styles.gameDate}>{game.date || "—"}</Text>
        </View>

        <Animated.View style={{ transform: [{ rotate }] }}>
          <Ionicons name="chevron-down" size={18} color={C.textTertiary} />
        </Animated.View>
      </Pressable>

      {expanded && (
        <View style={styles.expanded}>
          <Text style={styles.expandedHint}>Tap to see quarter scores, player spotlight, and team comparison</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.cardBorder,
    overflow: "hidden",
  },
  winCard: {
    backgroundColor: "rgba(72,173,169,0.08)",
    borderColor: "rgba(72,173,169,0.2)",
  },
  mainRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 12,
  },
  resultBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  resultText: {
    fontSize: 12,
    fontWeight: "800",
    fontFamily: FONTS.bodyBold,
  },
  teamInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  opponentLogo: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  opponentPrefix: {
    color: C.textTertiary,
    fontSize: 11,
    fontFamily: FONTS.body,
  },
  opponentName: {
    color: C.text,
    fontSize: 14,
    fontWeight: "600",
    fontFamily: FONTS.bodySemiBold,
  },
  opponentNameLoss: {
    color: "rgba(255,255,255,0.7)",
  },
  scoreBox: {
    alignItems: "flex-end",
    minWidth: 60,
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  scoreMain: {
    fontSize: 20,
    fontWeight: "900",
    fontFamily: FONTS.bodyHeavy,
  },
  scoreDash: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 16,
  },
  scoreOther: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: FONTS.bodySemiBold,
  },
  gameDate: {
    color: C.textTertiary,
    fontSize: 10,
    marginTop: 2,
    fontFamily: FONTS.body,
  },
  expanded: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: C.separator,
    paddingTop: 12,
  },
  expandedHint: {
    color: C.textTertiary,
    fontSize: 11,
    textAlign: "center",
    fontFamily: FONTS.body,
  },
});