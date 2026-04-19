// mobile/components/team/StatsTab.tsx

import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { SpiderChart } from "./SpiderChart";
import { getSportStatsConfig, formatStatRank } from "@/constants/teamStatsConfig";
import type { TeamData } from "@/constants/teamData";
import Colors from "@/constants/colors";
import { FONTS, FONT_SIZES } from "@/constants/typography";

const C = Colors.dark;

function ProgressBar({ value, max, rank, teamColor }: { value: number; max: number; rank: number; teamColor: string }) {
  const pct = Math.min((value / max) * 100, 100);
  const isGood = rank <= 10;

  return (
    <View style={progress.container}>
      <View style={progress.header}>
        <Text style={progress.value}>{value.toFixed(1)}</Text>
        <Text style={[progress.rank, { color: isGood ? teamColor : C.textSecondary }]}>
          {rank}{formatStatRank(rank, 30)}
        </Text>
      </View>
      <View style={progress.track}>
        <View style={[progress.fill, { width: `${pct}%`, backgroundColor: isGood ? teamColor : C.textTertiary }]} />
      </View>
    </View>
  );
}

interface StatsTabProps {
  team: TeamData;
}

export function StatsTab({ team }: StatsTabProps) {
  const config = getSportStatsConfig(team.league);

  // Map team stats to spider chart metrics
  // For demo, use normalized values since we don't have all advanced metrics
  const spiderMetrics = config.spiderChartMetrics.map((key, i) => {
    // Default ranges for different metric types
    const ranges: Record<string, { max: number; label: string }> = {
      offRtg: { max: 125, label: "OFF RTG" },
      defRtg: { max: 120, label: "DEF RTG" },
      pace: { max: 105, label: "PACE" },
      rebRate: { max: 55, label: "REB%" },
      astRate: { max: 70, label: "AST%" },
      tovRate: { max: 20, label: "TOV%" },
      ppg: { max: 130, label: "PPG" },
      "3pt%": { max: 45, label: "3PT%" },
      passEff: { max: 120, label: "PASS" },
      rushEff: { max: 120, label: "RUSH" },
      defEff: { max: 120, label: "DEF" },
      tovDiff: { max: 15, label: "TOV" },
      sackRate: { max: 10, label: "SACK" },
      redZone: { max: 70, label: "REDZ" },
      battingAvg: { max: 0.350, label: "AVG" },
      slugging: { max: 0.550, label: "SLG" },
      onBase: { max: 0.400, label: "OBP" },
      era: { max: 4.5, label: "ERA" },
      whip: { max: 1.4, label: "WHIP" },
      fielding: { max: 0.995, label: "FLD%" },
      goalsFor: { max: 3.5, label: "GF/G" },
      goalsAgainst: { max: 3.5, label: "GA/G" },
      powerPlay: { max: 30, label: "PP%" },
      penaltyKill: { max: 90, label: "PK%" },
      shotsFor: { max: 35, label: "S/G" },
      corsi: { max: 55, label: "CF%" },
      goals: { max: 90, label: "GOALS" },
      assists: { max: 60, label: "AST" },
      xG: { max: 65, label: "xG" },
      xGA: { max: 50, label: "xGA" },
      possession: { max: 70, label: "POSS%" },
      passAccuracy: { max: 90, label: "PASS%" },
      shots: { max: 18, label: "S/G" },
    };

    const range = ranges[key] || { max: 100, label: key.toUpperCase().slice(0, 4) };

    // Use team stats if available, otherwise estimate from record
    const stat = team.stats.find(s => s.label.toLowerCase().includes(key.toLowerCase()));
    let value = stat ? parseFloat(stat.value) || 0 : 50;

    // Normalize defensive stats (lower is better for def rtg, era, etc.)
    const invertedMetrics = ["defRtg", "tovRate", "era", "whip", "tovDiff", "goalsAgainst", "xGA"];
    if (invertedMetrics.includes(key)) {
      // Invert for display (lower is better means higher on chart is good)
      value = range.max - Math.min(value, range.max);
    }

    return {
      label: range.label,
      value: Math.min(value, range.max),
      max: range.max,
    };
  });

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container}>
      {/* Spider Chart */}
      <View style={styles.chartSection}>
        <Text style={styles.sectionTitle}>TEAM PROFILE</Text>
        <SpiderChart metrics={spiderMetrics} color={team.color} size={300} />
      </View>

      {/* Stat Progress Bars */}
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>KEY METRICS</Text>
        <View style={styles.statsList}>
          {team.stats.map((stat, i) => {
            const numValue = parseFloat(stat.value) || 0;
            const rankMatch = stat.rank.match(/(\d+)/);
            const rank = rankMatch ? parseInt(rankMatch[1]) : 15;
            const max = Math.max(numValue * 1.5, 1);

            return (
              <View key={i} style={styles.statRow}>
                <Text style={styles.statLabel}>{stat.label}</Text>
                <ProgressBar value={numValue} max={max} rank={rank} teamColor={team.color} />
              </View>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 20 },
  chartSection: { alignItems: "center", marginBottom: 8 },
  sectionTitle: { color: C.textTertiary, fontSize: 11, fontWeight: "900", letterSpacing: 1.2, marginBottom: 12 },
  statsSection: { gap: 8 },
  statsList: { gap: 14 },
  statRow: { gap: 6 },
  statLabel: { color: C.textSecondary, fontSize: 13, fontWeight: "600" },
});

const progress = StyleSheet.create({
  container: { gap: 4 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
  value: { color: C.text, fontSize: 16, fontWeight: "700", fontFamily: FONTS.bodyBold },
  rank: { fontSize: 12, fontWeight: "700" },
  track: { height: 6, borderRadius: 3, backgroundColor: C.glassMedium, overflow: "hidden" },
  fill: { height: 6, borderRadius: 3 },
});