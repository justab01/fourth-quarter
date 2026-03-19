import React, { useRef, useEffect } from "react";
import {
  View, Text, StyleSheet, Pressable, Animated
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import Colors from "@/constants/colors";
import { LEAGUE_COLORS } from "@/constants/sports";
import type { Game } from "@/utils/api";

const C = Colors.dark;

interface GameCardProps {
  game: Game;
  onPress: () => void;
  variant?: "default" | "hero" | "compact";
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function getDisplayColor(league: string): string {
  const map: Record<string, string> = {
    NBA: "#E8334A",
    NFL: "#4A90D9",
    MLB: "#4A90D9",
    MLS: "#3CB371",
    NHL: "#4A90D9",
  };
  return map[league] ?? C.accent;
}

function PulsingDot() {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.6, duration: 700, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1, duration: 700, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0.15, duration: 700, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.6, duration: 700, useNativeDriver: true }),
        ]),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.dotContainer}>
      <Animated.View style={[styles.dotPulse, { transform: [{ scale }], opacity }]} />
      <View style={styles.dotCore} />
    </View>
  );
}

export function GameCard({ game, onPress, variant = "default" }: GameCardProps) {
  const isLive = game.status === "live";
  const isFinished = game.status === "finished";
  const displayColor = getDisplayColor(game.league);
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () =>
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, tension: 300, friction: 20 }).start();
  const onPressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 300, friction: 20 }).start();

  if (variant === "hero") {
    return (
      <Animated.View style={{ transform: [{ scale }] }}>
        <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}>
          <View style={styles.heroCard}>
            <LinearGradient
              colors={[`${displayColor}22`, `${displayColor}08`, "transparent"]}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            {isLive && (
              <View style={[styles.liveBorderTop, { backgroundColor: displayColor }]} />
            )}
            <View style={styles.heroHeader}>
              <View style={[styles.leaguePill, { backgroundColor: `${displayColor}22` }]}>
                <Text style={[styles.leaguePillText, { color: displayColor }]}>{game.league}</Text>
              </View>
              {isLive ? (
                <View style={styles.livePill}>
                  <PulsingDot />
                  <Text style={styles.livePillText}>LIVE</Text>
                  {game.quarter && (
                    <Text style={styles.liveQuarter}>{game.quarter} · {game.timeRemaining}</Text>
                  )}
                </View>
              ) : isFinished ? (
                <Text style={styles.finalBadge}>FINAL</Text>
              ) : (
                <Text style={styles.timeBadge}>{formatTime(game.startTime)}</Text>
              )}
            </View>

            <View style={styles.heroTeams}>
              <View style={styles.heroTeam}>
                <View style={[styles.heroLogo, { borderColor: `${displayColor}44` }]}>
                  <Text style={styles.heroLogoText}>{game.awayTeam.charAt(0)}</Text>
                </View>
                <Text style={styles.heroTeamName} numberOfLines={2}>{game.awayTeam}</Text>
                {(isLive || isFinished) && (
                  <Text style={[styles.heroScore, isFinished && (game.awayScore ?? 0) < (game.homeScore ?? 0) ? styles.heroScoreDim : {}]}>
                    {game.awayScore}
                  </Text>
                )}
              </View>

              <View style={styles.heroVs}>
                {isLive ? (
                  <Text style={[styles.heroVsText, { color: displayColor }]}>VS</Text>
                ) : isFinished ? (
                  <Text style={styles.heroDash}>—</Text>
                ) : (
                  <Text style={styles.heroVsText}>VS</Text>
                )}
                {isLive && game.venue && (
                  <Text style={styles.heroVenue} numberOfLines={1}>{game.venue}</Text>
                )}
              </View>

              <View style={[styles.heroTeam, { alignItems: "flex-end" }]}>
                <View style={[styles.heroLogo, { borderColor: `${displayColor}44` }]}>
                  <Text style={styles.heroLogoText}>{game.homeTeam.charAt(0)}</Text>
                </View>
                <Text style={[styles.heroTeamName, { textAlign: "right" }]} numberOfLines={2}>
                  {game.homeTeam}
                </Text>
                {(isLive || isFinished) && (
                  <Text style={[styles.heroScore, isFinished && (game.homeScore ?? 0) < (game.awayScore ?? 0) ? styles.heroScoreDim : {}]}>
                    {game.homeScore}
                  </Text>
                )}
              </View>
            </View>

            <View style={[styles.heroCta, { borderTopColor: `${displayColor}22` }]}>
              <Text style={[styles.heroCtaText, { color: displayColor }]}>
                {isLive ? "Watch Live" : isFinished ? "Full Recap" : "Match Preview"}
              </Text>
              <View style={[styles.heroCaret, { backgroundColor: `${displayColor}22` }]}>
                <Text style={[styles.heroCaretText, { color: displayColor }]}>›</Text>
              </View>
            </View>
          </View>
        </Pressable>
      </Animated.View>
    );
  }

  if (variant === "compact") {
    return (
      <Animated.View style={{ transform: [{ scale }] }}>
        <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}>
          <View style={[styles.compactCard, isLive && { borderColor: `${displayColor}44` }]}>
            {isLive && (
              <LinearGradient
                colors={[`${displayColor}12`, "transparent"]}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
              />
            )}
            <View style={[styles.compactLeagueBar, { backgroundColor: displayColor }]} />
            <View style={styles.compactContent}>
              {isLive && (
                <View style={styles.compactLivePill}>
                  <View style={[styles.compactDot, { backgroundColor: C.live }]} />
                  <Text style={styles.compactLiveText}>LIVE</Text>
                </View>
              )}
              <View style={styles.compactTeamRow}>
                <View style={styles.compactLogoSmall}>
                  <Text style={styles.compactLogoText}>{game.awayTeam.charAt(0)}</Text>
                </View>
                <Text style={styles.compactTeamName} numberOfLines={1}>{game.awayTeam}</Text>
                {(isLive || isFinished) && (
                  <Text style={[styles.compactScore, isFinished && (game.awayScore ?? 0) < (game.homeScore ?? 0) && styles.compactScoreDim]}>
                    {game.awayScore}
                  </Text>
                )}
              </View>
              <View style={styles.compactTeamRow}>
                <View style={styles.compactLogoSmall}>
                  <Text style={styles.compactLogoText}>{game.homeTeam.charAt(0)}</Text>
                </View>
                <Text style={styles.compactTeamName} numberOfLines={1}>{game.homeTeam}</Text>
                {(isLive || isFinished) && (
                  <Text style={[styles.compactScore, isFinished && (game.homeScore ?? 0) < (game.awayScore ?? 0) && styles.compactScoreDim]}>
                    {game.homeScore}
                  </Text>
                )}
              </View>
              {!isLive && !isFinished && (
                <Text style={styles.compactTime}>{formatTime(game.startTime)}</Text>
              )}
            </View>
          </View>
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}>
        <View style={[styles.card, isLive && styles.cardLive, isLive && { borderColor: `${displayColor}40` }]}>
          {isLive && (
            <LinearGradient
              colors={[`${displayColor}10`, "transparent"]}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
            />
          )}
          <View style={styles.header}>
            <View style={[styles.leaguePill, { backgroundColor: `${displayColor}22` }]}>
              <Text style={[styles.leaguePillText, { color: displayColor }]}>{game.league}</Text>
            </View>
            {isLive ? (
              <View style={styles.livePill}>
                <PulsingDot />
                <Text style={styles.livePillText}>LIVE</Text>
                {game.quarter && (
                  <Text style={styles.liveQuarter}>{game.quarter} · {game.timeRemaining}</Text>
                )}
              </View>
            ) : isFinished ? (
              <Text style={styles.finalBadge}>FINAL</Text>
            ) : (
              <Text style={styles.timeBadge}>{formatTime(game.startTime)}</Text>
            )}
          </View>

          <View style={styles.matchup}>
            <View style={styles.teamRow}>
              <View style={[styles.logo, { borderColor: isLive ? `${displayColor}55` : "transparent" }]}>
                <Text style={styles.logoText}>{game.awayTeam.charAt(0)}</Text>
              </View>
              <Text
                style={[styles.teamName, isFinished && (game.awayScore ?? 0) < (game.homeScore ?? 0) && styles.teamNameDim]}
                numberOfLines={1}
              >
                {game.awayTeam}
              </Text>
              {(isLive || isFinished) && (
                <Text
                  style={[styles.score, isFinished && (game.awayScore ?? 0) < (game.homeScore ?? 0) && styles.scoreDim]}
                >
                  {game.awayScore}
                </Text>
              )}
            </View>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              {!isLive && !isFinished && <Text style={styles.vsText}>{formatTime(game.startTime)}</Text>}
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.teamRow}>
              <View style={[styles.logo, { borderColor: isLive ? `${displayColor}55` : "transparent" }]}>
                <Text style={styles.logoText}>{game.homeTeam.charAt(0)}</Text>
              </View>
              <Text
                style={[styles.teamName, isFinished && (game.homeScore ?? 0) < (game.awayScore ?? 0) && styles.teamNameDim]}
                numberOfLines={1}
              >
                {game.homeTeam}
              </Text>
              {(isLive || isFinished) && (
                <Text
                  style={[styles.score, isFinished && (game.homeScore ?? 0) < (game.awayScore ?? 0) && styles.scoreDim]}
                >
                  {game.homeScore}
                </Text>
              )}
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  dotContainer: { width: 12, height: 12, alignItems: "center", justifyContent: "center" },
  dotPulse: {
    position: "absolute",
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: C.live,
  },
  dotCore: {
    width: 7, height: 7, borderRadius: 3.5,
    backgroundColor: C.live,
  },

  card: {
    backgroundColor: C.card,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: C.cardBorder,
    overflow: "hidden",
    gap: 14,
  },
  cardLive: {
    borderWidth: 1.5,
  },

  heroCard: {
    backgroundColor: C.cardElevated,
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: C.cardBorder,
    minHeight: 200,
  },
  liveBorderTop: {
    height: 3,
    width: "100%",
  },
  heroHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  heroTeams: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  heroTeam: {
    flex: 1,
    alignItems: "flex-start",
    gap: 8,
  },
  heroLogo: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  heroLogoText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
    fontFamily: "Inter_700Bold",
  },
  heroTeamName: {
    color: C.text,
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    lineHeight: 18,
    flex: 1,
  },
  heroScore: {
    color: C.text,
    fontSize: 40,
    fontWeight: "900",
    fontFamily: "Inter_700Bold",
    lineHeight: 44,
  },
  heroScoreDim: {
    color: C.textTertiary,
  },
  heroVs: {
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 4,
  },
  heroVsText: {
    color: C.textTertiary,
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 1,
  },
  heroDash: {
    color: C.textTertiary,
    fontSize: 22,
    fontWeight: "300",
  },
  heroVenue: {
    color: C.textTertiary,
    fontSize: 10,
    textAlign: "center",
    maxWidth: 60,
  },
  heroCta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  heroCtaText: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.3,
    fontFamily: "Inter_700Bold",
  },
  heroCaret: {
    width: 26, height: 26, borderRadius: 13,
    alignItems: "center", justifyContent: "center",
  },
  heroCaretText: { fontSize: 18, fontWeight: "700", lineHeight: 20 },

  compactCard: {
    backgroundColor: C.card,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: C.cardBorder,
    flexDirection: "row",
    minWidth: 160,
  },
  compactLeagueBar: {
    width: 4,
    borderRadius: 2,
    margin: 10,
    marginRight: 0,
    alignSelf: "stretch",
    flexShrink: 0,
  },
  compactContent: {
    flex: 1,
    padding: 12,
    gap: 6,
  },
  compactLivePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 2,
  },
  compactDot: {
    width: 6, height: 6, borderRadius: 3,
  },
  compactLiveText: {
    color: C.live,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  compactTeamRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  compactLogoSmall: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  compactLogoText: {
    color: C.text, fontSize: 10, fontWeight: "700",
  },
  compactTeamName: {
    flex: 1,
    color: C.textSecondary,
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  compactScore: {
    color: C.text,
    fontSize: 17,
    fontWeight: "800",
    fontFamily: "Inter_700Bold",
    minWidth: 28,
    textAlign: "right",
  },
  compactScoreDim: { color: C.textTertiary },
  compactTime: {
    color: C.textTertiary,
    fontSize: 11,
    fontWeight: "500",
    marginTop: 2,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  leaguePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  leaguePillText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  livePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  livePillText: {
    color: C.live,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  liveQuarter: {
    color: C.textSecondary,
    fontSize: 11,
    fontWeight: "500",
  },
  finalBadge: {
    color: C.textTertiary,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  timeBadge: {
    color: C.textSecondary,
    fontSize: 12,
    fontWeight: "500",
  },
  matchup: { gap: 8 },
  teamRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logo: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  logoText: {
    color: C.text,
    fontSize: 14,
    fontWeight: "800",
    fontFamily: "Inter_700Bold",
  },
  teamName: {
    flex: 1,
    color: C.text,
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  teamNameDim: { color: C.textTertiary },
  score: {
    color: C.text,
    fontSize: 24,
    fontWeight: "900",
    fontFamily: "Inter_700Bold",
    minWidth: 40,
    textAlign: "right",
  },
  scoreDim: { color: C.textTertiary },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingLeft: 48,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: C.separator,
  },
  vsText: {
    color: C.textTertiary,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
});
