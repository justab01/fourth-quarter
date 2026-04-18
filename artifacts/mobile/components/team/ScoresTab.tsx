// mobile/components/team/ScoresTab.tsx

import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { GameCard } from "./GameCard";
import type { TeamData } from "@/constants/teamData";
import Colors from "@/constants/colors";
import { FONTS, FONT_SIZES } from "@/constants/typography";

const C = Colors.dark;

interface ScoresTabProps {
  team: TeamData;
}

export function ScoresTab({ team }: ScoresTabProps) {
  const wins = team.recentGames.filter(g => g.result === "W").length;
  const losses = team.recentGames.filter(g => g.result === "L").length;

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>RECENT GAMES</Text>
        <Text style={styles.record}>{wins}-{losses} last {team.recentGames.length}</Text>
      </View>

      {team.recentGames.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No recent games</Text>
        </View>
      ) : (
        team.recentGames.map((game, i) => (
          <GameCard
            key={i}
            game={game}
            teamColor={team.color}
            isWin={game.result === "W"}
          />
        ))
      )}

      <Text style={styles.hint}>Tap a game for quarter scores, player stats, and team comparison</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 10 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  title: { color: C.textTertiary, fontSize: 11, fontWeight: "900", letterSpacing: 1.2 },
  record: { color: C.textSecondary, fontSize: 12 },
  empty: { padding: 32, alignItems: "center" },
  emptyText: { color: C.textTertiary, fontSize: 14 },
  hint: { color: C.textTertiary, fontSize: 11, textAlign: "center", marginTop: 8 },
});