// mobile/components/team/StandingsTab.tsx

import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import { FONTS } from "@/constants/typography";
import type { TeamData } from "@/constants/teamData";
import { TeamLogo } from "@/components/GameCard";

const C = Colors.dark;

interface StandingsTabProps {
  team: TeamData;
}

export function StandingsTab({ team }: StandingsTabProps) {
  // Parse standing for playoff context (e.g. "2nd in East", "12th East")
  const standingMatch = team.standing.match(/(\d+)(?:st|nd|rd|th)?\s*(?:in\s+)?(.+)?/i);
  const seed = standingMatch?.[1] ?? null;
  const conference = standingMatch?.[2]?.trim() || team.division;
  const seedNum = seed ? parseInt(seed, 10) : null;

  // Conservative playoff thresholds per league.
  const playoffCutoff: Record<string, number> = {
    NBA: 6, WNBA: 6, NHL: 8, MLB: 6, NFL: 7, MLS: 8, EPL: 4, UCL: 16,
  };
  const cutoff = playoffCutoff[team.league] ?? 6;
  const isInPlayoffs = seedNum != null && seedNum <= cutoff;
  const isInPlayIn = seedNum != null && seedNum > cutoff && seedNum <= cutoff + 4;

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container}>
      {/* Playoff Status Hero */}
      <View style={[styles.playoffHero, { backgroundColor: `${team.color}15`, borderColor: `${team.color}30` }]}>
        <View style={styles.playoffHeader}>
          <View style={styles.playoffTeam}>
            <TeamLogo
              uri={team.logoUrl ?? null}
              name={team.name}
              size={44}
              borderColor={`${team.color}50`}
            />
            <View>
              <Text style={styles.teamName}>{team.shortName}</Text>
              <Text style={styles.teamRecord}>{team.record}</Text>
            </View>
          </View>
          {seed && (
            <View style={styles.playoffSeed}>
              <Text style={[styles.seedNum, { color: team.color }]}>#{seed}</Text>
              <Text style={styles.seedLabel}>in {conference}</Text>
            </View>
          )}
        </View>

        <View style={styles.playoffStats}>
          <View style={styles.playoffStat}>
            <Text style={styles.statLabel}>DIVISION</Text>
            <Text style={[styles.statValue, { color: team.color }]} numberOfLines={1}>
              {team.division || "—"}
            </Text>
          </View>
          <View style={styles.playoffStat}>
            <Text style={styles.statLabel}>SEED</Text>
            <Text style={styles.statValue}>{seed ? `#${seed}` : "—"}</Text>
          </View>
          <View style={styles.playoffStat}>
            <Text style={styles.statLabel}>RECORD</Text>
            <Text style={styles.statValue}>{team.record || "—"}</Text>
          </View>
        </View>

        {isInPlayoffs && (
          <View style={[styles.playoffStatus, { backgroundColor: `${C.accentTeal}15` }]}>
            <Ionicons name="checkmark-circle" size={16} color={C.accentTeal} />
            <Text style={[styles.playoffStatusText, { color: C.accentTeal }]}>
              In playoff position
            </Text>
          </View>
        )}
        {!isInPlayoffs && isInPlayIn && (
          <View style={[styles.playoffStatus, { backgroundColor: "rgba(255,193,7,0.12)" }]}>
            <Ionicons name="alert-circle" size={16} color="#FFC107" />
            <Text style={[styles.playoffStatusText, { color: "#FFC107" }]}>
              On playoff bubble
            </Text>
          </View>
        )}
        {seedNum != null && !isInPlayoffs && !isInPlayIn && (
          <View style={[styles.playoffStatus, { backgroundColor: "rgba(224,96,96,0.12)" }]}>
            <Ionicons name="close-circle" size={16} color="#E06060" />
            <Text style={[styles.playoffStatusText, { color: "#E06060" }]}>
              Out of playoff race
            </Text>
          </View>
        )}
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
    flex: 1,
  },
  teamName: { color: C.text, fontSize: 18, fontWeight: "800", fontFamily: FONTS.bodyBold },
  teamRecord: { color: C.textSecondary, fontSize: 12, marginTop: 2, fontFamily: FONTS.body },
  playoffSeed: { alignItems: "flex-end" },
  seedNum: { fontSize: 28, fontWeight: "900", fontFamily: FONTS.bodyHeavy },
  seedLabel: { color: C.textTertiary, fontSize: 11, fontFamily: FONTS.body },
  playoffStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: 12,
    paddingVertical: 12,
  },
  playoffStat: { alignItems: "center", gap: 4, flex: 1 },
  statLabel: {
    color: C.textTertiary,
    fontSize: 10,
    fontWeight: "700",
    fontFamily: FONTS.bodyBold,
    letterSpacing: 0.5,
  },
  statValue: {
    color: C.text,
    fontSize: 16,
    fontWeight: "800",
    fontFamily: FONTS.bodyBold,
    paddingHorizontal: 6,
    textAlign: "center",
  },
  playoffStatus: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 8,
    paddingVertical: 8,
  },
  playoffStatusText: { fontSize: 12, fontWeight: "700", fontFamily: FONTS.bodyBold },
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
  fullStandingsText: { color: C.accent, fontSize: 14, fontWeight: "700", fontFamily: FONTS.bodyBold },
});
