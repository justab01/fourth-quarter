import React, { useRef } from "react";
import { View, Text, StyleSheet, Pressable, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "@/constants/colors";
import { LEAGUE_COLORS } from "@/constants/sports";
import type { Game as GameType } from "@/utils/api";

const C = Colors.dark;

interface GameCardProps {
  game: GameType;
  onPress: () => void;
  compact?: boolean;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function getLeagueColor(league: string): string {
  return LEAGUE_COLORS[league] ?? "#333";
}

export function GameCard({ game, onPress, compact = false }: GameCardProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start();
  const onPressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();

  const isLive = game.status === "live";
  const isFinished = game.status === "finished";
  const leagueColor = getLeagueColor(game.league);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}>
        <View style={[styles.card, compact && styles.cardCompact]}>
          <LinearGradient
            colors={["rgba(255,255,255,0.05)", "rgba(255,255,255,0)"]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />

          <View style={styles.header}>
            <View style={[styles.leagueTag, { backgroundColor: leagueColor + "33" }]}>
              <Text style={[styles.leagueText, { color: leagueColor === "#013087" ? "#4A90D9" : leagueColor === "#002D72" ? "#4A90D9" : leagueColor === "#1A1A2E" ? "#4CAF50" : leagueColor }]}>
                {game.league}
              </Text>
            </View>
            {isLive && (
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
                {game.quarter && (
                  <Text style={styles.quarterText}> · {game.quarter} {game.timeRemaining}</Text>
                )}
              </View>
            )}
            {isFinished && <Text style={styles.finalText}>FINAL</Text>}
            {!isLive && !isFinished && (
              <Text style={styles.timeText}>{formatTime(game.startTime)}</Text>
            )}
          </View>

          <View style={styles.matchup}>
            <View style={styles.teamRow}>
              <View style={styles.teamLogoPlaceholder}>
                <Text style={styles.teamLogoText}>{game.awayTeam.charAt(0)}</Text>
              </View>
              <Text style={[styles.teamName, isFinished && game.awayScore! < game.homeScore! && styles.teamNameDim]} numberOfLines={1}>
                {game.awayTeam}
              </Text>
              {(isLive || isFinished) && (
                <Text style={[styles.score, isFinished && game.awayScore! < game.homeScore! && styles.scoreDim]}>
                  {game.awayScore}
                </Text>
              )}
            </View>
            <View style={styles.vsRow}>
              <View style={styles.vsDivider} />
              <Text style={styles.vsText}>VS</Text>
              <View style={styles.vsDivider} />
            </View>
            <View style={styles.teamRow}>
              <View style={styles.teamLogoPlaceholder}>
                <Text style={styles.teamLogoText}>{game.homeTeam.charAt(0)}</Text>
              </View>
              <Text style={[styles.teamName, isFinished && game.homeScore! < game.awayScore! && styles.teamNameDim]} numberOfLines={1}>
                {game.homeTeam}
              </Text>
              {(isLive || isFinished) && (
                <Text style={[styles.score, isFinished && game.homeScore! < game.awayScore! && styles.scoreDim]}>
                  {game.homeScore}
                </Text>
              )}
            </View>
          </View>

          {!compact && (
            <View style={styles.footer}>
              <Text style={styles.viewGameText}>View Game</Text>
              <Ionicons name="chevron-forward" size={14} color={C.textTertiary} />
            </View>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: C.cardBorder,
    overflow: "hidden",
  },
  cardCompact: {
    padding: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  leagueTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  leagueText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: C.live,
  },
  liveText: {
    fontSize: 11,
    fontWeight: "700",
    color: C.live,
    letterSpacing: 0.8,
  },
  quarterText: {
    fontSize: 11,
    color: C.textSecondary,
    fontWeight: "500",
  },
  finalText: {
    fontSize: 11,
    fontWeight: "600",
    color: C.textTertiary,
    letterSpacing: 0.5,
  },
  timeText: {
    fontSize: 12,
    color: C.textSecondary,
    fontWeight: "500",
  },
  matchup: {
    gap: 6,
  },
  teamRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  teamLogoPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  teamLogoText: {
    color: C.text,
    fontSize: 13,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  teamName: {
    flex: 1,
    color: C.text,
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  teamNameDim: {
    color: C.textTertiary,
  },
  score: {
    color: C.text,
    fontSize: 20,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    minWidth: 36,
    textAlign: "right",
  },
  scoreDim: {
    color: C.textTertiary,
  },
  vsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingLeft: 42,
  },
  vsDivider: {
    flex: 1,
    height: 1,
    backgroundColor: C.separator,
  },
  vsText: {
    color: C.textTertiary,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 14,
    gap: 4,
  },
  viewGameText: {
    color: C.textTertiary,
    fontSize: 12,
    fontWeight: "500",
  },
});
