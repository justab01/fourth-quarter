// mobile/components/team/StatsTab.tsx

import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { formatStatRank } from "@/constants/teamStatsConfig";
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
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container}>
      <Text style={styles.title}>TEAM STATS</Text>

      <View style={styles.statsList}>
        {team.stats.map((stat, i) => {
          const numValue = parseFloat(stat.value) || 0;
          const rankMatch = stat.rank.match(/(\d+)/);
          const rank = rankMatch ? parseInt(rankMatch[1]) : 15;
          const max = Math.max(numValue * 1.5, 1); // Scale for visualization

          return (
            <View key={i} style={styles.statRow}>
              <Text style={styles.statLabel}>{stat.label}</Text>
              <ProgressBar value={numValue} max={max} rank={rank} teamColor={team.color} />
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16 },
  title: { color: C.textTertiary, fontSize: 11, fontWeight: "900", letterSpacing: 1.2, marginBottom: 8 },
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