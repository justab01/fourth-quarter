// mobile/components/team/GameCard.tsx

import React, { useState, useRef } from "react";
import {
  View, Text, StyleSheet, Pressable, Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import Colors from "@/constants/colors";
import { FONTS, FONT_SIZES } from "@/constants/typography";
import { TeamLogo } from "@/components/GameCard";
import type { TeamData } from "@/constants/teamData";
import { resolveOpponentLogoUrl } from "@/utils/teamLogos";
import { api, type PlayerStatLine } from "@/utils/api";

// Per-league stat key for picking the "top performer" (case-insensitive match).
const TOP_STAT_KEYS: Record<string, string[]> = {
  NBA: ["PTS", "POINTS"],
  WNBA: ["PTS", "POINTS"],
  NCAAB: ["PTS", "POINTS"],
  NHL: ["G", "GOALS", "PTS", "POINTS"],
  MLB: ["H", "HITS", "HR", "RBI"],
  NFL: ["TD", "PASSYDS", "PASSING YDS", "REC YDS", "RUSH YDS", "YDS"],
  NCAAF: ["TD", "PASSYDS", "YDS"],
  EPL: ["G", "GOALS"],
  UCL: ["G", "GOALS"],
  LIGA: ["G", "GOALS"],
  MLS: ["G", "GOALS"],
};

function pickTopPerformer(
  players: PlayerStatLine[] | undefined,
  league: string,
): { name: string; points: number; rebounds?: number; assists?: number } | null {
  if (!players || players.length === 0) return null;
  const keys = TOP_STAT_KEYS[league?.toUpperCase()] ?? ["PTS", "POINTS", "G"];
  const numFor = (p: PlayerStatLine): number => {
    for (const want of keys) {
      for (const k of Object.keys(p.stats)) {
        if (k.toUpperCase().replace(/\s+/g, "") === want.replace(/\s+/g, "")) {
          const n = parseFloat(p.stats[k]);
          if (!isNaN(n)) return n;
        }
      }
    }
    return -1;
  };
  const sorted = [...players].sort((a, b) => numFor(b) - numFor(a));
  const top = sorted[0];
  if (!top || numFor(top) < 0) return null;
  // Pull out a few common secondary stats if present.
  const get = (...wants: string[]): number | undefined => {
    for (const w of wants) {
      for (const k of Object.keys(top.stats)) {
        if (k.toUpperCase().replace(/\s+/g, "") === w.replace(/\s+/g, "")) {
          const n = parseFloat(top.stats[k]);
          if (!isNaN(n)) return n;
        }
      }
    }
    return undefined;
  };
  return {
    name: top.name,
    points: numFor(top),
    rebounds: get("REB", "REBOUNDS", "TRB"),
    assists: get("AST", "ASSISTS", "A"),
  };
}

const C = Colors.dark;

interface GameCardProps {
  game: TeamData["recentGames"][0];
  teamColor: string;
  isWin: boolean;
  teamName?: string;
  league?: string;
}

export function GameCard({ game, teamColor, isWin, teamName, league = "NBA" }: GameCardProps) {
  const myTeam = teamName ?? "Team";
  const [expanded, setExpanded] = useState(false);
  const rotation = useRef(new Animated.Value(0)).current;

  const toggleExpand = () => {
    Animated.timing(rotation, {
      toValue: expanded ? 0 : 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
    setExpanded(!expanded);
  };

  const rotate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  const isHome = game.opponent.trim().toLowerCase().startsWith("vs");
  const oppName = game.opponent.replace(/^(vs\.?|@)\s+/i, "").trim();

  // Parse scores from game.score (format: "112-105" or similar)
  const scores = game.score.split("-").map(s => parseInt(s.trim()) || 0);
  const teamScore = isWin ? Math.max(...scores) : Math.min(...scores);
  const oppScore = isWin ? Math.min(...scores) : Math.max(...scores);

  // Fetch full game detail (top performers, full linescore) only after expand.
  const detailLeague = (game.league ?? league).toUpperCase();
  const detailId = game.id ? `${detailLeague.toLowerCase()}-${game.id}` : null;
  const { data: detail } = useQuery({
    queryKey: ["game-detail", detailId],
    queryFn: () => api.getGameDetail(detailId!),
    enabled: expanded && !!detailId,
    staleTime: 600_000,
    retry: 1,
  });

  // Quarter scores: prefer the schedule's, fall back to derived from detail's keyPlays linescore if any.
  const qScores = game.quarterScores ?? null;
  const hasQuarterScores =
    !!qScores && qScores.home.length > 0 && qScores.away.length > 0;

  // Top performers: from static teamData if present, else derived from fetched detail.
  const homePerformerStatic = game.topPerformers?.home?.[0] ?? null;
  const awayPerformerStatic = game.topPerformers?.away?.[0] ?? null;
  const homePerformerLive = pickTopPerformer(detail?.homePlayerStats, detailLeague);
  const awayPerformerLive = pickTopPerformer(detail?.awayPlayerStats, detailLeague);
  const homePerformer = homePerformerStatic ?? homePerformerLive;
  const awayPerformer = awayPerformerStatic ?? awayPerformerLive;
  const homePerf = isHome ? homePerformer : awayPerformer;
  const awayPerf = isHome ? awayPerformer : homePerformer;
  const hasPerformers = !!(homePerf || awayPerf);

  // Always allow expand if we have a game id to fetch — the panel may load data after open.
  const expandable = hasQuarterScores || hasPerformers || !!detailId;

  return (
    <View style={[styles.card, isWin && styles.winCard]}>
      <Pressable
        onPress={expandable ? toggleExpand : undefined}
        style={styles.mainRow}
      >
        {/* W/L Badge */}
        <View style={[styles.resultBadge, { backgroundColor: isWin ? "rgba(72,173,169,0.2)" : "rgba(224,96,96,0.15)" }]}>
          <Text style={[styles.resultText, { color: isWin ? "#48ADA9" : "#E06060" }]}>{game.result}</Text>
        </View>

        {/* Opponent */}
        <View style={styles.teamInfo}>
          <View style={[styles.opponentLogo, { backgroundColor: isWin ? "rgba(72,173,169,0.15)" : "rgba(255,255,255,0.06)" }]}>
            <TeamLogo
              uri={game.opponentLogo ?? resolveOpponentLogoUrl(oppName, league)}
              name={oppName}
              size={32}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.opponentPrefix}>{isHome ? "vs " : "@ "}</Text>
            <Text style={[styles.opponentName, !isWin && styles.opponentNameLoss]}>{oppName}</Text>
          </View>
        </View>

        {/* Scores */}
        <View style={styles.scoreBox}>
          <View style={styles.scoreRow}>
            <Text style={[styles.scoreMain, { color: isWin ? "#48ADA9" : "rgba(255,255,255,0.6)" }]}>{teamScore}</Text>
            <Text style={styles.scoreDash}>-</Text>
            <Text style={[styles.scoreOther, { color: isWin ? "rgba(255,255,255,0.6)" : C.text }]}>{oppScore}</Text>
          </View>
          <Text style={styles.gameDate}>{game.date || "—"}</Text>
        </View>

        {expandable ? (
          <Animated.View style={{ transform: [{ rotate }] }}>
            <Ionicons name="chevron-down" size={18} color={C.textTertiary} />
          </Animated.View>
        ) : (
          <View style={{ width: 18 }} />
        )}
      </Pressable>

      {expanded && expandable && (
        <View style={styles.expanded}>
          {!hasQuarterScores && !hasPerformers && (
            <Text style={styles.emptyHint}>
              {detailId ? "Loading game details…" : "No box score available."}
            </Text>
          )}
          {hasQuarterScores && qScores && (
            <>
              <View style={styles.qtrHeader}>
                {(isHome ? qScores.home : qScores.away)
                  .slice(0, 4)
                  .map((_, i) => (
                    <Text key={i} style={styles.qtrLabel}>{`Q${i + 1}`}</Text>
                  ))}
                <Text style={styles.qtrFinal}>FINAL</Text>
              </View>
              <View style={styles.qtrRow}>
                <View style={styles.qtrTeam}>
                  <Text style={[styles.qtrTeamName, isWin && styles.qtrWin]}>{myTeam}</Text>
                  <View style={styles.qtrScores}>
                    {(isHome ? qScores.home : qScores.away).slice(0, 4).map((s, i) => (
                      <Text key={i} style={[styles.qtrNum, isWin && styles.qtrWin]}>{s}</Text>
                    ))}
                    <Text style={[styles.qtrTotal, isWin && styles.qtrWin]}>{teamScore}</Text>
                  </View>
                </View>
              </View>
              <View style={styles.qtrRow}>
                <View style={styles.qtrTeam}>
                  <Text style={styles.qtrTeamName}>{oppName}</Text>
                  <View style={styles.qtrScores}>
                    {(isHome ? qScores.away : qScores.home).slice(0, 4).map((s, i) => (
                      <Text key={i} style={styles.qtrNum}>{s}</Text>
                    ))}
                    <Text style={styles.qtrTotal}>{oppScore}</Text>
                  </View>
                </View>
              </View>
            </>
          )}

          {hasPerformers && (
            <View style={styles.performers}>
              {homePerf && (
                <View style={styles.perfCard}>
                  <Text style={[styles.perfTeam, { color: teamColor }]}>{myTeam}</Text>
                  <View style={styles.perfPlayer}>
                    {isWin && <Text style={styles.perfStar}>⭐</Text>}
                    <Text style={styles.perfName}>{homePerf.name}</Text>
                  </View>
                  <Text style={styles.perfStats}>
                    {homePerf.points} PTS
                    {homePerf.rebounds != null ? ` | ${homePerf.rebounds} REB` : ""}
                    {homePerf.assists != null ? ` | ${homePerf.assists} AST` : ""}
                  </Text>
                </View>
              )}
              {awayPerf && (
                <View style={styles.perfCard}>
                  <Text style={styles.perfTeam}>{oppName}</Text>
                  <View style={styles.perfPlayer}>
                    {!isWin && <Text style={styles.perfStar}>⭐</Text>}
                    <Text style={styles.perfName}>{awayPerf.name}</Text>
                  </View>
                  <Text style={styles.perfStats}>
                    {awayPerf.points} PTS
                    {awayPerf.rebounds != null ? ` | ${awayPerf.rebounds} REB` : ""}
                    {awayPerf.assists != null ? ` | ${awayPerf.assists} AST` : ""}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.cardBorder,
    overflow: "hidden",
  },
  winCard: {
    backgroundColor: "rgba(72,173,169,0.08)",
    borderColor: "rgba(72,173,169,0.2)",
  },
  mainRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 12,
  },
  resultBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  resultText: {
    fontSize: 12,
    fontWeight: "800",
    fontFamily: FONTS.bodyBold,
  },
  teamInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  opponentLogo: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  opponentPrefix: {
    color: C.textTertiary,
    fontSize: 11,
    fontFamily: FONTS.body,
  },
  opponentName: {
    color: C.text,
    fontSize: 14,
    fontWeight: "600",
    fontFamily: FONTS.bodySemiBold,
  },
  opponentNameLoss: {
    color: "rgba(255,255,255,0.7)",
  },
  scoreBox: {
    alignItems: "flex-end",
    minWidth: 60,
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  scoreMain: {
    fontSize: 20,
    fontWeight: "900",
    fontFamily: FONTS.bodyHeavy,
  },
  scoreDash: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 16,
  },
  scoreOther: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: FONTS.bodySemiBold,
  },
  gameDate: {
    color: C.textTertiary,
    fontSize: 10,
    marginTop: 2,
    fontFamily: FONTS.body,
  },
  expanded: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: C.separator,
    paddingTop: 12,
    gap: 12,
  },
  qtrHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 4,
    gap: 8,
  },
  qtrLabel: {
    color: C.textTertiary,
    fontSize: 10,
    width: 24,
    textAlign: "center",
    fontFamily: FONTS.body,
  },
  qtrFinal: {
    color: C.textTertiary,
    fontSize: 10,
    width: 40,
    textAlign: "center",
    fontWeight: "700",
    fontFamily: FONTS.bodyBold,
  },
  qtrRow: {
    marginBottom: 6,
  },
  qtrTeam: {
    flexDirection: "row",
    alignItems: "center",
  },
  qtrTeamName: {
    color: C.text,
    fontSize: 12,
    fontWeight: "600",
    fontFamily: FONTS.bodySemiBold,
    width: 80,
  },
  qtrWin: {
    color: "#48ADA9",
  },
  qtrScores: {
    flexDirection: "row",
    gap: 8,
  },
  qtrNum: {
    color: C.textSecondary,
    fontSize: 12,
    width: 24,
    textAlign: "center",
    fontFamily: FONTS.body,
  },
  qtrTotal: {
    color: C.text,
    fontSize: 12,
    width: 40,
    textAlign: "center",
    fontWeight: "700",
    fontFamily: FONTS.bodyBold,
  },
  performers: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  perfCard: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  perfTeam: {
    color: C.textSecondary,
    fontSize: 10,
    fontWeight: "700",
    fontFamily: FONTS.bodyBold,
    marginBottom: 6,
  },
  perfPlayer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  perfStar: {
    fontSize: 10,
  },
  perfName: {
    color: C.text,
    fontSize: 13,
    fontWeight: "700",
    fontFamily: FONTS.bodyBold,
  },
  perfStats: {
    color: C.textTertiary,
    fontSize: 10,
    fontFamily: FONTS.body,
  },
  emptyHint: {
    color: C.textTertiary,
    fontSize: 11,
    fontFamily: FONTS.body,
    textAlign: "center",
    paddingVertical: 6,
  },
});