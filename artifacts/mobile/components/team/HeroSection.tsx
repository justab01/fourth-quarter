// mobile/components/team/HeroSection.tsx

import React, { useEffect, useRef } from "react";
import {
  View, Text, StyleSheet, Pressable, Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import { FONTS, FONT_SIZES } from "@/constants/typography";
import { TeamLogo } from "@/components/GameCard";
import { getSportStatsConfig, generatePersonalityBadge, type PersonalityBadge } from "@/constants/teamStatsConfig";
import type { TeamData } from "@/constants/teamData";

const C = Colors.dark;

interface HeroSectionProps {
  team: TeamData;
  isFav: boolean;
  onBack: () => void;
  onToggleFav: () => void;
}

function PersonalityBadgeComponent({ badge, teamColor }: { badge: PersonalityBadge; teamColor: string }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={[persBadge.container, { backgroundColor: `${teamColor}25`, borderColor: `${teamColor}50` }]}>
      <Animated.Text style={[persBadge.emoji, { transform: [{ scale: pulseAnim }] }]}>{badge.emoji}</Animated.Text>
      <Text style={[persBadge.label, { color: teamColor }]}>{badge.label}</Text>
    </View>
  );
}

function getStreakInfo(games: TeamData["recentGames"]): { emoji: string; count: number } | null {
  if (!games || games.length === 0) return null;
  const recent = games.slice(-5);
  let streak = 0;
  const streakType = recent[recent.length - 1]?.result ?? "W";
  for (let i = recent.length - 1; i >= 0; i--) {
    if (recent[i].result === streakType) streak++;
    else break;
  }
  if (streak < 2) return null;
  if (streakType === "W") return { emoji: "🔥", count: streak };
  return { emoji: "❄️", count: streak };
}

function getRankStyle(rank: string, teamColor: string): { bg: string; gradient?: [string, string]; color: string; isBad?: boolean } {
  const num = parseInt(rank) || 20;
  if (num <= 3) return { bg: "#FFD700", gradient: ["#FFD700", "#FFA500"] as [string, string], color: "#000" };
  if (num <= 10) return { bg: teamColor, color: "#fff" };
  if (num >= 20) return { bg: "rgba(224,96,96,0.3)", color: "#E06060", isBad: true };
  return { bg: "rgba(255,255,255,0.1)", color: C.textSecondary };
}

export function HeroSection({ team, isFav, onBack, onToggleFav }: HeroSectionProps) {
  // Generate personality badge from stats
  const statsMap: Record<string, { value: number; rank: number; total: number }> = {};
  team.stats.forEach(s => {
    const numValue = parseFloat(s.value) || 0;
    const rankMatch = s.rank.match(/(\d+)/);
    const rank = rankMatch ? parseInt(rankMatch[1]) : 15;
    statsMap[s.label.toLowerCase().replace(/[^a-z]/g, "")] = { value: numValue, rank, total: 30 };
  });

  const personalityBadge = generatePersonalityBadge(team.league, statsMap);
  const streakInfo = getStreakInfo(team.recentGames);

  return (
    <LinearGradient
      colors={[team.color, team.color + "99", team.color + "40", C.background]}
      locations={[0, 0.3, 0.6, 1]}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {/* Top bar */}
      <View style={styles.topBar}>
        <Pressable onPress={onBack} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={22} color={C.text} />
        </Pressable>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <Pressable onPress={onToggleFav} style={styles.iconBtn}>
            <Ionicons name={isFav ? "star" : "star-outline"} size={20} color={isFav ? "#FFD700" : C.text} />
          </Pressable>
          <Pressable style={styles.iconBtn}>
            <Ionicons name="notifications-outline" size={20} color={C.text} />
          </Pressable>
        </View>
      </View>

      {/* Team identity */}
      <View style={styles.teamIdentity}>
        <TeamLogo
          uri={team.logoUrl ?? null}
          name={team.abbr}
          size={64}
          borderColor={`${team.colorSecondary}70`}
          fontSize={18}
        />
        <View style={{ flex: 1 }}>
          <View style={styles.nameRow}>
            <Text style={styles.teamName}>{team.shortName}</Text>
            {streakInfo && (
              <View style={[styles.streakBadge, { backgroundColor: `${team.color}40`, borderColor: `${team.color}60` }]}>
                <Text style={[styles.streakText, { color: team.color }]}>{streakInfo.emoji} W{streakInfo.count}</Text>
              </View>
            )}
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>{team.league}</Text>
            <Text style={styles.metaDot}>·</Text>
            <Text style={[styles.metaHighlight, { color: team.color }]}>{team.standing}</Text>
            <Text style={styles.metaDot}>·</Text>
            <Text style={styles.metaText}>{team.record}</Text>
          </View>
        </View>
      </View>

      {/* Personality Badge */}
      {personalityBadge && (
        <PersonalityBadgeComponent badge={personalityBadge} teamColor={team.color} />
      )}

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {team.stats.slice(0, 4).map((stat, i) => {
          const rankStyle = getRankStyle(stat.rank, team.color);
          return (
            <View key={i} style={styles.statCardWrap}>
              <View style={styles.statContentRow}>
                <View>
                  <Text style={[styles.statValue, rankStyle.isBad && { color: "#E06060" }]}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
                {rankStyle.gradient ? (
                  <LinearGradient
                    colors={rankStyle.gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.rankBadge}
                  >
                    <Text style={[styles.rankText, { color: rankStyle.color }]}>{stat.rank}</Text>
                  </LinearGradient>
                ) : (
                  <View style={[styles.rankBadge, { backgroundColor: rankStyle.bg }]}>
                    <Text style={[styles.rankText, { color: rankStyle.color }]}>{stat.rank}</Text>
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingBottom: 20 },
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  iconBtn: { width: 38, height: 38, alignItems: "center", justifyContent: "center", borderRadius: 10, backgroundColor: "rgba(0,0,0,0.25)" },
  teamIdentity: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 12 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  teamName: { color: C.text, fontSize: 24, fontWeight: "900", fontFamily: FONTS.bodyBold },
  streakBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  streakText: { fontSize: 11, fontWeight: "800" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  metaText: { color: "rgba(255,255,255,0.6)", fontSize: 12 },
  metaDot: { color: "rgba(255,255,255,0.4)", fontSize: 12 },
  metaHighlight: { fontSize: 12, fontWeight: "700" },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  statCardWrap: { flex: 1, minWidth: "45%", backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", padding: 12 },
  statContentRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  statValue: { fontSize: 24, fontWeight: "900", fontFamily: FONTS.bodyBold, color: C.text },
  statLabel: { fontSize: 11, color: C.textSecondary, marginTop: 2 },
  rankBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  rankText: { fontSize: 11, fontWeight: "800" },
});

const persBadge = StyleSheet.create({
  container: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, marginBottom: 8 },
  emoji: { fontSize: 14 },
  label: { fontSize: 11, fontWeight: "800", letterSpacing: 0.5 },
});