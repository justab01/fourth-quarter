import React, { useRef, useEffect, useState } from "react";
import {
  View, Text, StyleSheet, Pressable, Animated, Image
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
  grouped?: boolean;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function getLeagueColor(league: string): string {
  const map: Record<string, string> = {
    NBA:   C.nba,
    NFL:   C.nfl,
    MLB:   C.mlb,
    MLS:   C.mls,
    NHL:   C.nhl,
    WNBA:  C.wnba,
    NCAAB: C.ncaab,
    NCAAF: C.ncaaf,
    EPL:   C.eplBright,
    UCL:   C.ucl,
    LIGA:  C.liga,
    NCAA:  C.accentGold,
  };
  return map[league] ?? C.accent;
}

function getSportVenueGradient(league: string): [string, string, string, string] {
  const map: Record<string, [string, string, string, string]> = {
    NBA:   ["#5C2800", "#301400", "#160900", "#0F0F0F"],
    WNBA:  ["#5C1F00", "#2A0E00", "#140700", "#0F0F0F"],
    NCAAB: ["#001845", "#000E25", "#000710", "#0F0F0F"],
    NFL:   ["#0A1E34", "#06121F", "#03090F", "#0F0F0F"],
    NCAAF: ["#1A1000", "#0D0800", "#060400", "#0F0F0F"],
    MLB:   ["#320A0A", "#1A0505", "#0D0303", "#0F0F0F"],
    MLS:   ["#062A12", "#031508", "#010A04", "#0F0F0F"],
    EPL:   ["#1A0028", "#0D0014", "#06000A", "#0F0F0F"],
    UCL:   ["#001040", "#000820", "#000410", "#0F0F0F"],
    LIGA:  ["#280505", "#140202", "#090101", "#0F0F0F"],
    NHL:   ["#061828", "#030D16", "#01060B", "#0F0F0F"],
  };
  return map[league] ?? ["#16091E", "#0D0512", "#060209", "#0F0F0F"];
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

// ── Team logo: real image with letter fallback ────────────────────────────────
export function TeamLogo({
  uri, name, size, borderColor, fontSize,
}: { uri?: string | null; name: string; size: number; borderColor?: string; fontSize?: number }) {
  const [failed, setFailed] = useState(false);
  const letter = name.charAt(0).toUpperCase();
  const r = size / 2;
  return (
    <View style={{
      width: size, height: size, borderRadius: r,
      backgroundColor: "rgba(255,255,255,0.08)",
      borderWidth: 2,
      borderColor: borderColor ?? "rgba(255,255,255,0.12)",
      overflow: "hidden",
      alignItems: "center", justifyContent: "center",
    }}>
      {uri && !failed ? (
        <Image
          source={{ uri }}
          style={{ width: size * 0.72, height: size * 0.72 }}
          resizeMode="contain"
          onError={() => setFailed(true)}
        />
      ) : (
        <Text style={{ color: "#fff", fontSize: fontSize ?? size * 0.38, fontWeight: "900", fontFamily: "Inter_700Bold" }}>
          {letter}
        </Text>
      )}
    </View>
  );
}

export function GameCard({ game, onPress, variant = "default", isFavorite = false, grouped = false }: GameCardProps) {
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
    const venueGradient = getSportVenueGradient(game.league);
    return (
      <Animated.View style={{ transform: [{ scale }] }}>
        <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut}>
          <View style={hero.card}>
            {/* Deep sport-themed venue gradient */}
            <LinearGradient
              colors={venueGradient}
              style={StyleSheet.absoluteFill}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
            />
            {/* Subtle league color tint overlay */}
            <LinearGradient
              colors={[`${leagueColor}18`, "transparent", `${leagueColor}0A`]}
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

            {/* Teams + centered score block */}
            <View style={hero.teams}>
              {/* Away team column */}
              <Pressable
                style={hero.teamCol}
                onPress={(e) => { e.stopPropagation(); goToTeam(game.awayTeam, game.league); }}
                hitSlop={8}
              >
                <TeamLogo uri={game.awayTeamLogo} name={game.awayTeam} size={80} borderColor={`${leagueColor}55`} />
                <Text style={hero.teamName} numberOfLines={2}>{game.awayTeam}</Text>
                <Text style={hero.teamLabel}>Away</Text>
              </Pressable>

              {/* Center: score or VS */}
              <View style={hero.centerCol}>
                {(isLive || isFinished) ? (
                  <View style={hero.scoreBlock}>
                    <Text style={[hero.score, !awayWin && isFinished && hero.scoreDim]}>
                      {game.awayScore ?? 0}
                    </Text>
                    <Text style={hero.scoreSep}>–</Text>
                    <Text style={[hero.score, !homeWin && isFinished && hero.scoreDim]}>
                      {game.homeScore ?? 0}
                    </Text>
                  </View>
                ) : (
                  <Text style={hero.vsText}>VS</Text>
                )}
                {isLive && game.timeRemaining && (
                  <Text style={hero.timeRemaining}>{game.timeRemaining}</Text>
                )}
                {!isLive && !isFinished && (
                  <Text style={hero.kickoffTime}>{formatTime(game.startTime)}</Text>
                )}
                {game.venue && (
                  <Text style={hero.venue} numberOfLines={1}>{game.venue}</Text>
                )}
              </View>

              {/* Home team column */}
              <Pressable
                style={[hero.teamCol, { alignItems: "flex-end" }]}
                onPress={(e) => { e.stopPropagation(); goToTeam(game.homeTeam, game.league); }}
                hitSlop={8}
              >
                <TeamLogo uri={game.homeTeamLogo} name={game.homeTeam} size={80} borderColor={`${leagueColor}55`} />
                <Text style={[hero.teamName, { textAlign: "right" }]} numberOfLines={2}>{game.homeTeam}</Text>
                <Text style={[hero.teamLabel, { textAlign: "right" }]}>Home</Text>
              </Pressable>
            </View>

            <View style={hero.ctaRow}>
              <View style={[hero.ctaPill, { borderColor: `${leagueColor}60`, backgroundColor: `${leagueColor}18` }]}>
                <Ionicons
                  name={isLive ? "radio" : isFinished ? "document-text-outline" : "play-circle-outline"}
                  size={13}
                  color={leagueColor}
                />
                <Text style={[hero.ctaPillText, { color: leagueColor }]}>
                  {isLive ? "Watch Live" : isFinished ? "Full Recap" : "Match Preview"}
                </Text>
                <Text style={[hero.ctaChevron, { color: leagueColor }]}>›</Text>
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
                <TeamLogo uri={game.awayTeamLogo} name={game.awayTeam} size={22} />
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
                <TeamLogo uri={game.homeTeamLogo} name={game.homeTeam} size={22} />
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
        <View style={[
          dflt.card,
          grouped && dflt.cardGrouped,
          isLive && !grouped && { borderColor: `${C.live}30` },
        ]}>
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
              <TeamLogo uri={game.awayTeamLogo} name={game.awayTeam} size={28} />
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
              <TeamLogo uri={game.homeTeamLogo} name={game.homeTeam} size={28} />
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
  teamCol: { flex: 1, alignItems: "flex-start", gap: 6 },
  logo: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 2,
    alignItems: "center", justifyContent: "center",
  },
  logoLetter: { color: "#fff", fontSize: 30, fontWeight: "900", fontFamily: "Inter_700Bold" },
  teamName: {
    color: C.text, fontSize: 14, fontWeight: "700",
    fontFamily: "Inter_700Bold", lineHeight: 18, flex: 1,
  },
  scoreBlock: { flexDirection: "row", alignItems: "baseline", gap: 4 },
  score: { color: C.text, fontSize: 40, fontWeight: "900", fontFamily: "Inter_700Bold", lineHeight: 46 },
  scoreSep: { color: C.textTertiary, fontSize: 24, fontWeight: "300", lineHeight: 46 },
  scoreDim: { color: C.textTertiary },
  teamLabel: { color: C.textTertiary, fontSize: 11, fontWeight: "500" },
  centerCol: { flex: 1, alignItems: "center", gap: 6 },
  vsText: { color: C.textTertiary, fontSize: 22, fontWeight: "800", letterSpacing: 2 },
  timeRemaining: { color: C.live, fontSize: 11, fontWeight: "700", letterSpacing: 0.3 },
  kickoffTime: { color: C.textSecondary, fontSize: 13, fontWeight: "600" },
  venue: { color: C.textTertiary, fontSize: 10, textAlign: "center" },
  ctaRow: {
    paddingHorizontal: 20,
    paddingBottom: 18,
    paddingTop: 4,
    alignItems: "center",
  },
  ctaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1.5,
    borderRadius: 28,
    paddingHorizontal: 22,
    paddingVertical: 11,
  },
  ctaPillText: { fontSize: 13, fontWeight: "800", letterSpacing: 0.4, fontFamily: "Inter_700Bold" },
  ctaChevron: { fontSize: 20, fontWeight: "700", lineHeight: 20 },
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
  cardGrouped: {
    backgroundColor: "transparent",
    borderRadius: 0,
    borderWidth: 0,
    borderColor: "transparent",
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
