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

  return (
    <View style={[styles.card, isWin && styles.winCard]}>
      <Pressable onPress={toggleExpand} style={styles.mainRow}>
        <View style={[styles.resultBadge, { backgroundColor: isWin ? "rgba(72,173,169,0.2)" : "rgba(224,96,96,0.15)" }]}>
          <Text style={[styles.resultText, { color: isWin ? "#48ADA9" : "#E06060" }]}>{game.result}</Text>
        </View>
        <View style={styles.teamInfo}>
          <TeamLogo name={oppName.substring(0, 3).toUpperCase()} size={32} />
          <View style={{ flex: 1 }}>
            <Text style={styles.opponentPrefix}>{isHome ? "vs " : "@ "}</Text>
            <Text style={styles.opponentName}>{oppName}</Text>
          </View>
        </View>
        <Text style={[styles.score, { color: isWin ? "#48ADA9" : C.text }]}>{game.score}</Text>
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
    padding: 14,
    gap: 12,
  },
  resultBadge: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  resultText: { fontSize: 13, fontWeight: "800" },
  teamInfo: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  opponentPrefix: { color: C.textTertiary, fontSize: 12 },
  opponentName: { color: C.text, fontSize: 14, fontWeight: "600" },
  score: { fontSize: 16, fontWeight: "800", fontFamily: FONTS.bodyBold },
  expanded: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: C.separator,
    paddingTop: 12,
  },
  expandedHint: { color: C.textTertiary, fontSize: 12, textAlign: "center" },
});