// mobile/components/team/StandingsTab.tsx

import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import type { TeamData } from "@/constants/teamData";

const C = Colors.dark;

interface StandingsTabProps {
  team: TeamData;
}

export function StandingsTab({ team }: StandingsTabProps) {
  // Parse standing for playoff context
  const standingMatch = team.standing.match(/(\d+)(?:st|nd|rd|th)?\s*(?:in\s+)?(.+)?/i);
  const seed = standingMatch?.[1] ?? "?";
  const conference = standingMatch?.[2] ?? team.division;

  // Mock playoff data (would come from API in real implementation)
  const isInPlayoffs = parseInt(seed) <= 6;

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container}>
      {/* Playoff Status Hero */}
      <View style={[styles.playoffHero, { backgroundColor: `${team.color}15`, borderColor: `${team.color}30` }]}>
        <View style={styles.playoffHeader}>
          <View style={styles.playoffTeam}>
            <Text style={styles.teamEmoji}>🚀</Text>
            <View>
              <Text style={styles.teamName}>{team.shortName}</Text>
              <Text style={styles.teamRecord}>{team.record}</Text>
            </View>
          </View>
          <View style={styles.playoffSeed}>
            <Text style={[styles.seedNum, { color: team.color }]}>#{seed}</Text>
            <Text style={styles.seedLabel}>in {conference}</Text>
          </View>
        </View>

        <View style={styles.playoffStats}>
          <View style={styles.playoffStat}>
            <Text style={styles.statLabel}>GB</Text>
            <Text style={styles.statValue}>10.0</Text>
          </View>
          <View style={styles.playoffStat}>
            <Text style={styles.statLabel}>Magic #</Text>
            <Text style={[styles.statValue, styles.magicNum]}>6</Text>
          </View>
          <View style={styles.playoffStat}>
            <Text style={styles.statLabel}>Div</Text>
            <Text style={[styles.statValue, { color: team.color }]}>1st</Text>
          </View>
        </View>

        {isInPlayoffs && (
          <View style={styles.playoffStatus}>
            <Ionicons name="checkmark-circle" size={16} color="#48ADA9" />
            <Text style={styles.playoffStatusText}>Playoff position secured</Text>
          </View>
        )}
      </View>

      {/* Matchup Preview */}
      <View style={styles.matchupCard}>
        <Text style={styles.matchupTitle}>Current First Round Matchup</Text>
        <View style={styles.matchupTeams}>
          <View style={styles.matchupTeam}>
            <Text style={styles.matchupEmoji}>🌙</Text>
            <Text style={styles.matchupName}>Mavericks</Text>
            <Text style={styles.matchupSeed}>#6 Seed</Text>
          </View>
          <Text style={styles.matchupVs}>vs</Text>
          <View style={styles.matchupTeam}>
            <Text style={styles.matchupEmoji}>🚀</Text>
            <Text style={[styles.matchupName, { color: team.color }]}>{team.shortName}</Text>
            <Text style={[styles.matchupSeed, { color: team.color }]}>#{seed} Seed</Text>
          </View>
        </View>
      </View>

      {/* Full Standings Link */}
      <Pressable style={styles.fullStandingsBtn} onPress={() => router.push("/(tabs)/standings" as any)}>
        <Text style={styles.fullStandingsText}>View Full Standings</Text>
        <Ionicons name="arrow-forward" size={16} color={C.accent} />
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16 },
  playoffHero: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  playoffHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  playoffTeam: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  teamEmoji: { fontSize: 36 },
  teamName: { color: C.text, fontSize: 18, fontWeight: "800" },
  teamRecord: { color: C.textSecondary, fontSize: 12, marginTop: 2 },
  playoffSeed: { alignItems: "flex-end" },
  seedNum: { fontSize: 28, fontWeight: "900" },
  seedLabel: { color: C.textTertiary, fontSize: 11 },
  playoffStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: 12,
    paddingVertical: 12,
  },
  playoffStat: { alignItems: "center", gap: 4 },
  statLabel: { color: C.textTertiary, fontSize: 10, fontWeight: "700" },
  statValue: { color: C.text, fontSize: 18, fontWeight: "800" },
  magicNum: { color: "#48ADA9" },
  playoffStatus: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "rgba(72,173,169,0.1)",
    borderRadius: 8,
    paddingVertical: 8,
  },
  playoffStatusText: { color: "#48ADA9", fontSize: 12, fontWeight: "700" },
  matchupCard: {
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.cardBorder,
    padding: 16,
    gap: 12,
  },
  matchupTitle: { color: C.textTertiary, fontSize: 11, fontWeight: "800", letterSpacing: 1, textAlign: "center" },
  matchupTeams: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  matchupTeam: { alignItems: "center", gap: 4 },
  matchupEmoji: { fontSize: 32 },
  matchupName: { color: C.text, fontSize: 14, fontWeight: "700" },
  matchupSeed: { color: C.textSecondary, fontSize: 11 },
  matchupVs: { color: C.textTertiary, fontSize: 16, fontWeight: "700" },
  fullStandingsBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: `${C.accent}15`,
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: `${C.accent}30`,
  },
  fullStandingsText: { color: C.accent, fontSize: 14, fontWeight: "700" },
});