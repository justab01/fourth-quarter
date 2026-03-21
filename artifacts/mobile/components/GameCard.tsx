import React, { useRef, useEffect } from "react";
import {
  View, Text, StyleSheet, Pressable, Animated
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import type { Game } from "@/utils/api";
import { goToTeam } from "@/utils/navHelpers";

const C = Colors.dark;

interface GameCardProps {
  game: Game;
  onPress: () => void;
  variant?: "default" | "hero" | "compact";
  isFavorite?: boolean;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function getLeagueColor(league: string): string {
  const map: Record<string, string> = {
    NBA: C.nba,
    NFL: C.nfl,
    MLB: C.mlb,
    MLS: C.mls,
    NHL: C.accentBlue,
    NCAA: C.accentGold,
  };
  return map[league] ?? C.accent;
}

function PulsingDot() {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const scaleVal = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.8] });
  const opacityVal = anim.interpolate({ inputRange: [0, 1], outputRange: [0.7, 0.1] });

  return (
    <View style={dot.container}>
      <Animated.View style={[dot.ring, { transform: [{ scale: scaleVal }], opacity: opacityVal }]} />
      <View style={dot.core} />
    </View>
  );
}

const dot = StyleSheet.create({
  container: { width: 10, height: 10, alignItems: "center", justifyContent: "center" },
  ring: { position: "absolute", width: 10, height: 10, borderRadius: 5, backgroundColor: C.live },
  core: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.live },
});

export function GameCard({ game, onPress, variant = "default", isFavorite = false }: GameCardProps) {
  const isLive     = game.status === "live";
  const isFinished = game.status === "finished";
  const leagueColor = getLeagueColor(game.league);
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn  = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, tension: 300, friction: 20 }).start();
  const onPressOut = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true, tension: 300, friction: 20 }).start();

  const awayWin = isFinished && (game.awayScore ?? 0) > (game.homeScore ?? 0);
  const homeWin = isFinished && (game.homeScore ?? 0) > (game.awayScore ?? 0);

  // ── HERO ─────────────────────────────────────────────────────────────────
  if (variant === "hero") {
    return (
      <Animated.View style={{ transform: [{ scale }] }}>
        <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}>
          <View style={hero.card}>
            <LinearGradient
              colors={[`${leagueColor}20`, `${leagueColor}08`, "transparent"]}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            {isLive && <View style={[hero.topStripe, { backgroundColor: C.live }]} />}

            <View style={hero.header}>
              <View style={[hero.leaguePill, { backgroundColor: `${leagueColor}22` }]}>
                <Text style={[hero.leagueText, { color: leagueColor }]}>{game.league}</Text>
              </View>
              {isLive ? (
                <View style={hero.livePill}>
                  <PulsingDot />
                  <Text style={hero.liveText}>LIVE</Text>
                  {game.quarter && <Text style={hero.quarterText}>{game.quarter}</Text>}
                </View>
              ) : isFinished ? (
                <Text style={hero.finalText}>FINAL</Text>
              ) : (
                <Text style={hero.timeText}>{formatTime(game.startTime)}</Text>
              )}
            </View>

            <View style={hero.teams}>
              <Pressable
                style={hero.teamCol}
                onPress={(e) => { e.stopPropagation(); goToTeam(game.awayTeam, game.league); }}
                hitSlop={8}
              >
                <View style={[hero.logo, { borderColor: `${leagueColor}44` }]}>
                  <Text style={hero.logoLetter}>{game.awayTeam.charAt(0)}</Text>
                </View>
                <Text style={hero.teamName} numberOfLines={2}>{game.awayTeam}</Text>
                {(isLive || isFinished) && (
                  <Text style={[hero.score, !awayWin && isFinished && hero.scoreDim]}>
                    {game.awayScore}
                  </Text>
                )}
                {isFinished && <Text style={hero.label}>Away</Text>}
              </Pressable>

              <View style={hero.centerCol}>
                {!isLive && !isFinished && (
                  <Text style={hero.vsText}>VS</Text>
                )}
                {isLive && game.timeRemaining && (
                  <Text style={hero.timeRemaining}>{game.timeRemaining}</Text>
                )}
                {isFinished && (
                  <Text style={hero.vsText}>—</Text>
                )}
                {game.venue && (
                  <Text style={hero.venue} numberOfLines={2}>{game.venue}</Text>
                )}
              </View>

              <Pressable
                style={[hero.teamCol, { alignItems: "flex-end" }]}
                onPress={(e) => { e.stopPropagation(); goToTeam(game.homeTeam, game.league); }}
                hitSlop={8}
              >
                <View style={[hero.logo, { borderColor: `${leagueColor}44` }]}>
                  <Text style={hero.logoLetter}>{game.homeTeam.charAt(0)}</Text>
                </View>
                <Text style={[hero.teamName, { textAlign: "right" }]} numberOfLines={2}>{game.homeTeam}</Text>
                {(isLive || isFinished) && (
                  <Text style={[hero.score, !homeWin && isFinished && hero.scoreDim]}>
                    {game.homeScore}
                  </Text>
                )}
                {isFinished && <Text style={[hero.label, { textAlign: "right" }]}>Home</Text>}
              </Pressable>
            </View>

            <View style={[hero.cta, { borderTopColor: `${leagueColor}20` }]}>
              <Text style={[hero.ctaText, { color: leagueColor }]}>
                {isLive ? "Watch Live" : isFinished ? "Full Recap" : "Match Preview"}
              </Text>
              <View style={[hero.ctaArrow, { backgroundColor: `${leagueColor}22` }]}>
                <Text style={[hero.ctaArrowText, { color: leagueColor }]}>›</Text>
              </View>
            </View>
          </View>
        </Pressable>
      </Animated.View>
    );
  }

  // ── COMPACT (horizontal card for home screen widget) ─────────────────────
  if (variant === "compact") {
    return (
      <Animated.View style={{ transform: [{ scale }] }}>
        <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}>
          <View style={[cpt.card, isLive && { borderColor: `${leagueColor}44` }, isFavorite && { borderColor: `${C.accent}44` }]}>
            {isLive && (
              <LinearGradient
                colors={[`${leagueColor}14`, "transparent"]}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
              />
            )}
            <View style={[cpt.stripe, { backgroundColor: leagueColor }]} />

            <View style={cpt.body}>
              {isFavorite && (
                <View style={cpt.starRow}>
                  <Ionicons name="star" size={9} color={C.accent} />
                  <Text style={cpt.starText}>MY TEAM</Text>
                </View>
              )}
              {isLive && (
                <View style={cpt.livePill}>
                  <View style={cpt.liveDot} />
                  <Text style={cpt.liveText}>LIVE</Text>
                  {game.quarter && <Text style={cpt.quarter}> · {game.quarter}</Text>}
                </View>
              )}
              {!isLive && !isFinished && (
                <Text style={cpt.time}>{formatTime(game.startTime)}</Text>
              )}
              {isFinished && (
                <Text style={cpt.ftLabel}>FT</Text>
              )}

              <Pressable
                style={cpt.row}
                onPress={(e) => { e.stopPropagation(); goToTeam(game.awayTeam, game.league); }}
                hitSlop={4}
              >
                <View style={cpt.logo}>
                  <Text style={cpt.logoLetter}>{game.awayTeam.charAt(0)}</Text>
                </View>
                <Text style={[cpt.teamName, isFinished && !awayWin && cpt.teamDim]} numberOfLines={1}>
                  {game.awayTeam}
                </Text>
                {(isLive || isFinished) && (
                  <Text style={[cpt.score, isFinished && !awayWin && cpt.scoreDim]}>
                    {game.awayScore}
                  </Text>
                )}
              </Pressable>

              <View style={cpt.divider} />

              <Pressable
                style={cpt.row}
                onPress={(e) => { e.stopPropagation(); goToTeam(game.homeTeam, game.league); }}
                hitSlop={4}
              >
                <View style={cpt.logo}>
                  <Text style={cpt.logoLetter}>{game.homeTeam.charAt(0)}</Text>
                </View>
                <Text style={[cpt.teamName, isFinished && !homeWin && cpt.teamDim]} numberOfLines={1}>
                  {game.homeTeam}
                </Text>
                {(isLive || isFinished) && (
                  <Text style={[cpt.score, isFinished && !homeWin && cpt.scoreDim]}>
                    {game.homeScore}
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Animated.View>
    );
  }

  // ── DEFAULT — Livescore-style row (status | teams | scores) ──────────────
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}>
        <View style={[dflt.card, isLive && { borderColor: `${C.live}30` }]}>
          {isLive && (
            <LinearGradient
              colors={["rgba(232,22,43,0.06)", "transparent"]}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          )}

          {/* Left status column */}
          <View style={dflt.statusCol}>
            {isLive ? (
              <>
                <View style={dflt.liveBadge}>
                  <Text style={dflt.liveBadgeText}>LIVE</Text>
                </View>
                {game.quarter && (
                  <Text style={dflt.quarterText} numberOfLines={1}>{game.quarter}</Text>
                )}
              </>
            ) : isFinished ? (
              <Text style={dflt.ftText}>FT</Text>
            ) : (
              <Text style={dflt.timeText}>{formatTime(game.startTime)}</Text>
            )}
          </View>

          {/* Thin vertical separator */}
          <View style={dflt.vSep} />

          {/* Teams + scores */}
          <View style={dflt.teamsCol}>
            <Pressable
              style={dflt.teamRow}
              onPress={(e) => { e.stopPropagation(); goToTeam(game.awayTeam, game.league); }}
              hitSlop={4}
            >
              <View style={dflt.logo}>
                <Text style={dflt.logoLetter}>{game.awayTeam.charAt(0)}</Text>
              </View>
              <Text style={[dflt.teamName, isFinished && !awayWin && dflt.teamDim]} numberOfLines={1}>
                {game.awayTeam}
              </Text>
              {(isLive || isFinished) ? (
                <Text style={[dflt.score, isFinished && !awayWin && dflt.scoreDim]}>
                  {game.awayScore}
                </Text>
              ) : (
                <View style={dflt.scorePlaceholder} />
              )}
            </Pressable>

            <View style={dflt.hSep} />

            <Pressable
              style={dflt.teamRow}
              onPress={(e) => { e.stopPropagation(); goToTeam(game.homeTeam, game.league); }}
              hitSlop={4}
            >
              <View style={dflt.logo}>
                <Text style={dflt.logoLetter}>{game.homeTeam.charAt(0)}</Text>
              </View>
              <Text style={[dflt.teamName, isFinished && !homeWin && dflt.teamDim]} numberOfLines={1}>
                {game.homeTeam}
              </Text>
              {(isLive || isFinished) ? (
                <Text style={[dflt.score, isFinished && !homeWin && dflt.scoreDim]}>
                  {game.homeScore}
                </Text>
              ) : (
                <View style={dflt.scorePlaceholder} />
              )}
            </Pressable>
          </View>

          {/* Favorite star + league accent bar on right edge */}
          <View style={dflt.rightCol}>
            {isFavorite && (
              <View style={dflt.starBadge}>
                <Ionicons name="star" size={10} color={C.accent} />
              </View>
            )}
            <View style={[dflt.leagueAccent, { backgroundColor: leagueColor }]} />
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ── Hero styles ──────────────────────────────────────────────────────────────
const hero = StyleSheet.create({
  card: {
    backgroundColor: C.cardElevated,
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: C.cardBorder,
    minHeight: 200,
  },
  topStripe: { height: 3 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  leaguePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  leagueText: { fontSize: 11, fontWeight: "800", letterSpacing: 0.5 },
  livePill: { flexDirection: "row", alignItems: "center", gap: 6 },
  liveText: { color: C.live, fontSize: 12, fontWeight: "800", letterSpacing: 0.8 },
  quarterText: { color: C.textSecondary, fontSize: 12, fontWeight: "500" },
  finalText: { color: C.textTertiary, fontSize: 11, fontWeight: "700", letterSpacing: 0.8 },
  timeText: { color: C.textSecondary, fontSize: 12, fontWeight: "500" },
  teams: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  teamCol: { flex: 1, alignItems: "flex-start", gap: 8 },
  logo: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 2,
    alignItems: "center", justifyContent: "center",
  },
  logoLetter: { color: "#fff", fontSize: 20, fontWeight: "800", fontFamily: "Inter_700Bold" },
  teamName: {
    color: C.text, fontSize: 14, fontWeight: "700",
    fontFamily: "Inter_700Bold", lineHeight: 18, flex: 1,
  },
  score: { color: C.text, fontSize: 38, fontWeight: "900", fontFamily: "Inter_700Bold" },
  scoreDim: { color: C.textTertiary },
  label: { color: C.textTertiary, fontSize: 11, fontWeight: "500" },
  centerCol: { alignItems: "center", gap: 4, paddingHorizontal: 4 },
  vsText: { color: C.textTertiary, fontSize: 14, fontWeight: "700", letterSpacing: 1 },
  timeRemaining: { color: C.textSecondary, fontSize: 11, fontWeight: "600" },
  venue: { color: C.textTertiary, fontSize: 10, textAlign: "center", maxWidth: 64 },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  ctaText: { fontSize: 13, fontWeight: "700", letterSpacing: 0.3, fontFamily: "Inter_700Bold" },
  ctaArrow: {
    width: 26, height: 26, borderRadius: 13,
    alignItems: "center", justifyContent: "center",
  },
  ctaArrowText: { fontSize: 18, fontWeight: "700", lineHeight: 22 },
});

// ── Compact styles ───────────────────────────────────────────────────────────
const cpt = StyleSheet.create({
  card: {
    backgroundColor: C.card,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: C.cardBorder,
    flexDirection: "row",
    minWidth: 160,
  },
  stripe: {
    width: 3,
    borderRadius: 2,
    margin: 10,
    marginRight: 0,
    alignSelf: "stretch",
    flexShrink: 0,
  },
  body: { flex: 1, padding: 12, gap: 6 },
  livePill: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 2 },
  liveDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: C.live },
  liveText: { color: C.live, fontSize: 10, fontWeight: "900", letterSpacing: 0.8 },
  quarter: { color: C.textTertiary, fontSize: 10, fontWeight: "500" },
  time: { color: C.textTertiary, fontSize: 11, fontWeight: "600", marginBottom: 2 },
  ftLabel: { color: C.textTertiary, fontSize: 10, fontWeight: "700", letterSpacing: 0.8, marginBottom: 2 },
  divider: { height: 1, backgroundColor: C.separator, marginLeft: 32 },
  row: { flexDirection: "row", alignItems: "center", gap: 7 },
  logo: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.09)",
    alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  logoLetter: { color: C.text, fontSize: 9, fontWeight: "800" },
  teamName: { flex: 1, color: C.textSecondary, fontSize: 12, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  teamDim: { color: C.textTertiary },
  score: { color: C.text, fontSize: 16, fontWeight: "800", fontFamily: "Inter_700Bold", minWidth: 24, textAlign: "right" },
  scoreDim: { color: C.textTertiary },
  starRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 2 },
  starText: { color: C.accent, fontSize: 9, fontWeight: "800", letterSpacing: 0.5 },
});

// ── Default (Livescore row) styles ───────────────────────────────────────────
const dflt = StyleSheet.create({
  card: {
    backgroundColor: C.card,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: C.cardBorder,
    flexDirection: "row",
    alignItems: "stretch",
  },

  statusCol: {
    width: 56,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 4,
    gap: 4,
    flexShrink: 0,
  },
  liveBadge: {
    backgroundColor: C.live,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 5,
  },
  liveBadgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  quarterText: {
    color: C.textTertiary,
    fontSize: 10,
    fontWeight: "500",
    textAlign: "center",
  },
  ftText: {
    color: C.textTertiary,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  timeText: {
    color: C.textSecondary,
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },

  vSep: {
    width: 1,
    backgroundColor: C.separator,
    marginVertical: 12,
    flexShrink: 0,
  },

  teamsCol: {
    flex: 1,
    paddingVertical: 10,
    paddingLeft: 12,
    paddingRight: 12,
    gap: 0,
  },
  teamRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 7,
  },
  logo: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  logoLetter: {
    color: C.text, fontSize: 11, fontWeight: "800", fontFamily: "Inter_700Bold",
  },
  teamName: {
    flex: 1,
    color: C.text,
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  teamDim: { color: C.textTertiary },
  score: {
    color: C.text,
    fontSize: 18,
    fontWeight: "800",
    fontFamily: "Inter_700Bold",
    minWidth: 28,
    textAlign: "right",
  },
  scoreDim: { color: C.textTertiary },
  scorePlaceholder: { minWidth: 28 },

  hSep: { height: 1, backgroundColor: C.separator, marginLeft: 38 },

  rightCol: {
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingRight: 2,
    alignSelf: "stretch",
  },
  starBadge: {
    paddingTop: 4,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  leagueAccent: {
    width: 3,
    alignSelf: "stretch",
    flexShrink: 0,
    borderRadius: 2,
  },
});
