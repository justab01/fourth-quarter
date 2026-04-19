// mobile/components/team/ScoresTab.tsx

import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Animated, NativeSyntheticEvent, NativeScrollEvent } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { GameCard } from "./GameCard";
import type { TeamData } from "@/constants/teamData";
import Colors from "@/constants/colors";
import { FONTS, FONT_SIZES } from "@/constants/typography";
import { TeamLogo } from "@/components/GameCard";

const C = Colors.dark;

interface ScoresTabProps {
  team: TeamData;
  onScroll?: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
  contentInsetTop?: number;
}

export function ScoresTab({ team, onScroll, contentInsetTop = 0 }: ScoresTabProps) {
  const wins = team.recentGames.filter(g => g.result === "W").length;
  const losses = team.recentGames.filter(g => g.result === "L").length;

  // Get top 2-3 players for roster preview
  const topPlayers = team.roster.slice(0, 3);

  // Parse standing for playoff race
  const standingMatch = team.standing.match(/(\d+)(?:st|nd|rd|th)?\s*(\w+)?/i);
  const rankNum = standingMatch ? parseInt(standingMatch[1]) : 0;
  const conference = standingMatch?.[2] || "Conf";

  return (
    <Animated.ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[styles.container, { paddingTop: contentInsetTop + 16 }]}
      scrollEventThrottle={16}
      onScroll={onScroll}
      scrollIndicatorInsets={{ top: contentInsetTop }}
    >
      {/* Recent Games */}
      <View style={styles.section}>
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
              teamName={team.shortName}
              league={team.league}
            />
          ))
        )}
        <Text style={styles.hint}>Tap a game for quarter scores, player stats, and team comparison</Text>
      </View>

      {/* Playoff Race Preview */}
      <View style={styles.section}>
        <View style={styles.header}>
          <Text style={styles.title}>PLAYOFF RACE</Text>
          <Text style={[styles.link, { color: team.color }]}>View Full →</Text>
        </View>

        <View style={[styles.playoffCard, { backgroundColor: team.color + "15", borderColor: team.color + "30", shadowColor: team.color, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.25, shadowRadius: 20, elevation: 8 }]}>
          <View style={styles.playoffHeader}>
            <TeamLogo
              uri={team.logoUrl ?? null}
              name={team.name}
              size={40}
              borderColor={team.color + "40"}
            />
            <View style={styles.playoffTeamInfo}>
              <Text style={[styles.playoffTeamName, { color: team.color }]}>{team.shortName}</Text>
              <Text style={styles.playoffRecord}>{team.record || "—"} • {team.standing}</Text>
            </View>
            {rankNum > 0 && (
              <View style={styles.playoffRank}>
                <Text style={[styles.playoffRankNum, { color: team.color }]}>#{rankNum}</Text>
                <Text style={styles.playoffRankLabel}>in {conference}</Text>
              </View>
            )}
          </View>

          <View style={styles.playoffStats}>
            <View style={styles.playoffStatBox}>
              <Text style={styles.playoffStatLabel}>DIVISION</Text>
              <Text style={[styles.playoffStatValue, { color: team.color }]} numberOfLines={1}>
                {team.division || "—"}
              </Text>
            </View>
            <View style={styles.playoffStatBox}>
              <Text style={styles.playoffStatLabel}>SEED</Text>
              <Text style={styles.playoffStatValue}>{rankNum > 0 ? `#${rankNum}` : "—"}</Text>
            </View>
            <View style={styles.playoffStatBox}>
              <Text style={styles.playoffStatLabel}>RECORD</Text>
              <Text style={styles.playoffStatValue}>{team.record || "—"}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Roster Preview */}
      {topPlayers.length > 0 && (
        <View style={styles.section}>
          <View style={styles.header}>
            <Text style={styles.title}>ROSTER</Text>
            <Text style={[styles.link, { color: team.color }]}>View All →</Text>
          </View>

          <View style={styles.rosterGrid}>
            {topPlayers.slice(0, 2).map((player, i) => (
              <View key={i} style={[styles.playerCard, { backgroundColor: team.color + "15", borderColor: team.color + "40" }]}>
                <View style={styles.playerHeader}>
                  <View style={[styles.playerAvatar, { backgroundColor: team.color + "25", borderColor: team.color + "40" }]}>
                    <Text style={styles.playerAvatarText}>👤</Text>
                    {i === 0 && (
                      <View style={[styles.starBadge, { backgroundColor: team.color }]}>
                        <Text style={styles.starText}>⭐</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.playerInfo}>
                    <Text style={styles.playerName} numberOfLines={1}>{player.name}</Text>
                    <Text style={styles.playerMeta}>#{player.number} • {player.position}</Text>
                  </View>
                </View>
                <View style={styles.playerStats}>
                  <View style={styles.playerStatBox}>
                    <Text style={styles.playerStatText}>
                      <Text style={[styles.playerStatValue, { color: team.color }]}>
                        {player.stats?.PPG != null ? (typeof player.stats.PPG === 'number' ? player.stats.PPG.toFixed(1) : player.stats.PPG) : player.stats?.PTS ?? "—"}
                      </Text>
                      <Text style={styles.playerStatLabel}> PPG</Text>
                    </Text>
                  </View>
                  <View style={styles.playerStatBox}>
                    <Text style={styles.playerStatText}>
                      <Text style={styles.playerStatValue}>
                        {player.stats?.REB != null ? (typeof player.stats.REB === 'number' ? player.stats.REB.toFixed(1) : player.stats.REB) : player.stats?.RPG ?? "—"}
                      </Text>
                      <Text style={styles.playerStatLabel}> REB</Text>
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>

          {team.roster.length > 2 && (
            <Text style={styles.rosterMore}>+ {team.roster.length - 2} more players</Text>
          )}
        </View>
      )}

      {/* News Preview */}
      <View style={styles.section}>
        <View style={styles.header}>
          <Text style={styles.title}>LATEST NEWS</Text>
          <Text style={[styles.link, { color: team.color }]}>View All →</Text>
        </View>

        <View style={styles.newsCard}>
          <Text style={styles.newsTitle}>{team.shortName} News</Text>
          <Text style={styles.newsSummary}>Latest updates and game recaps for {team.name}</Text>
          <View style={styles.newsMeta}>
            <Text style={styles.newsSource}>ESPN</Text>
            <Text style={styles.newsDot}>•</Text>
            <Text style={styles.newsTime}>Recent</Text>
          </View>
        </View>
      </View>
    </Animated.ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16 },
  section: { gap: 8 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  title: { color: C.textTertiary, fontSize: 11, fontWeight: "900", letterSpacing: 1.2 },
  record: { color: C.textSecondary, fontSize: 12 },
  link: { fontSize: 12, fontWeight: "600" },
  empty: { padding: 32, alignItems: "center" },
  emptyText: { color: C.textTertiary, fontSize: 14 },
  hint: { color: C.textTertiary, fontSize: 11, textAlign: "center", marginTop: 8 },

  // Playoff Card
  playoffCard: { borderRadius: 14, padding: 14, borderWidth: 1.5 },
  playoffHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  teamLogoSmall: { width: 44, height: 44, borderRadius: 10, alignItems: "center", justifyContent: "center", borderWidth: 1, marginRight: 12 },
  teamEmoji: { fontSize: 20 },
  playoffTeamInfo: { flex: 1 },
  playoffTeamName: { fontSize: 16, fontWeight: "800", fontFamily: FONTS.bodyBold },
  playoffRecord: { fontSize: 12, color: C.textSecondary, marginTop: 2 },
  playoffRank: { alignItems: "flex-end" },
  playoffRankNum: { fontSize: 24, fontWeight: "900", fontFamily: FONTS.bodyHeavy },
  playoffRankLabel: { fontSize: 10, color: C.textTertiary },
  playoffStats: { flexDirection: "row", gap: 8 },
  playoffStatBox: { flex: 1, backgroundColor: "rgba(0,0,0,0.25)", borderRadius: 8, paddingVertical: 8, alignItems: "center" },
  playoffStatLabel: { fontSize: 10, color: C.textTertiary },
  playoffStatValue: { fontSize: 14, fontWeight: "700", fontFamily: FONTS.bodyBold },

  // Roster Preview
  rosterGrid: { flexDirection: "row", gap: 8 },
  playerCard: { flex: 1, borderRadius: 12, padding: 10, borderWidth: 1.5 },
  playerHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  playerAvatar: { width: 40, height: 40, borderRadius: 8, alignItems: "center", justifyContent: "center", borderWidth: 1, position: "relative" },
  playerAvatarText: { fontSize: 18 },
  starBadge: { position: "absolute", top: -4, right: -4, width: 16, height: 16, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  starText: { fontSize: 8 },
  playerInfo: { flex: 1 },
  playerName: { fontSize: 13, fontWeight: "700", fontFamily: FONTS.bodyBold, color: C.text },
  playerMeta: { fontSize: 10, color: C.textSecondary, marginTop: 1 },
  playerStats: { flexDirection: "row", gap: 4 },
  playerStatBox: { flex: 1, backgroundColor: "rgba(0,0,0,0.2)", borderRadius: 6, paddingVertical: 4, alignItems: "center" },
  playerStatText: { fontSize: 12 },
  playerStatValue: { fontSize: 12, fontWeight: "700", fontFamily: FONTS.bodyBold, color: C.text },
  playerStatLabel: { fontSize: 12, color: C.textTertiary },
  rosterMore: { textAlign: "center", color: C.textTertiary, fontSize: 11, marginTop: 6 },

  // News Preview
  newsCard: { backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", padding: 12 },
  newsTitle: { fontSize: 14, fontWeight: "700", fontFamily: FONTS.bodyBold, color: C.text, marginBottom: 4 },
  newsSummary: { fontSize: 12, color: C.textSecondary, lineHeight: 18 },
  newsMeta: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 },
  newsSource: { fontSize: 11, color: C.textTertiary },
  newsDot: { color: C.textTertiary, fontSize: 11 },
  newsTime: { fontSize: 11, color: C.textTertiary },
});