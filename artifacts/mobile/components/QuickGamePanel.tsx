import React, { useEffect, useMemo, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import Colors from "@/constants/colors";
import { FONTS } from "@/constants/typography";
import { api, type Game, type GameDetail } from "@/utils/api";

const C = Colors.dark;

export type QuickGameTab = "gamecast" | "boxscore" | "playbyplay" | "stats" | "lineups";

interface QuickGamePanelProps {
  game: Game;
  accentColor: string;
  onOpenTab: (tab: QuickGameTab) => void;
}

interface StatComparison {
  label: string;
  away: string;
  home: string;
}

function formatTime(startTime: string): string {
  const date = new Date(startTime);
  if (Number.isNaN(date.getTime())) return "TBD";
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function humanizeStatLabel(label: string): string {
  return label
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, character => character.toUpperCase());
}

function validStatValue(value: string | number | undefined): value is string | number {
  if (value == null) return false;
  const rendered = String(value).trim();
  return rendered.length > 0 && rendered !== "—";
}

function getStatComparisons(detail: GameDetail | undefined): StatComparison[] {
  if (!detail) return [];
  const homeStats = detail.homeStats ?? {};
  const awayStats = detail.awayStats ?? {};
  const orderedKeys = Array.from(new Set([
    ...Object.keys(homeStats),
    ...Object.keys(awayStats),
  ]));

  return orderedKeys
    .filter(key => validStatValue(homeStats[key]) && validStatValue(awayStats[key]))
    .slice(0, 3)
    .map(key => ({
      label: humanizeStatLabel(key),
      away: String(awayStats[key]),
      home: String(homeStats[key]),
    }));
}

function getStatusLabel(game: Game): string {
  if (game.statusDetail) return game.statusDetail.toUpperCase();
  if (game.status === "live") {
    return [game.quarter, game.timeRemaining].filter(Boolean).join(" · ").toUpperCase() || "LIVE";
  }
  if (game.status === "finished") return "FINAL";
  return `STARTS ${formatTime(game.startTime).toUpperCase()}`;
}

function getResultLine(game: Game): string | null {
  if (game.homeScore == null || game.awayScore == null) return null;
  if (game.homeScore === game.awayScore) return "The final score is level.";
  const winner = game.homeScore > game.awayScore ? game.homeTeam : game.awayTeam;
  return `${winner} won by ${Math.abs(game.homeScore - game.awayScore)}.`;
}

function getBaseContext(game: Game, detail: GameDetail | undefined): string {
  if (game.statusDetail) {
    return "The schedule changed. Scores and projections stay hidden until the event has a confirmed state.";
  }

  const latestPlay = detail?.keyPlays?.[detail.keyPlays.length - 1];
  if (latestPlay?.description) return latestPlay.description;

  const isEvent = game.sportArchetype === "golf" ||
    game.sportArchetype === "racing" ||
    ["PGA", "LPGA", "LIV", "F1", "NASCAR", "IRL"].includes(game.league);

  if (isEvent) {
    return [game.timeRemaining, game.circuitName, game.venue, game.awayTeam]
      .find(value => Boolean(value)) ?? "More event context is not available yet.";
  }

  if (game.status === "live") return "The score is live. Detailed play context has not arrived yet.";
  if (game.status === "finished") return getResultLine(game) ?? "A final result is posted without a complete score.";
  if (game.venue) return `Scheduled at ${game.venue}.`;
  return "Start time is confirmed. Venue and lineup context are not available yet.";
}

function getSecondaryAction(detail: GameDetail | undefined): {
  label: string;
  tab: QuickGameTab;
  icon: keyof typeof Ionicons.glyphMap;
} | null {
  if (!detail) return null;
  const hasBoxScore = (detail.homePlayerStats?.length ?? 0) + (detail.awayPlayerStats?.length ?? 0) > 0;
  if (hasBoxScore) return { label: "Box Score", tab: "boxscore", icon: "grid-outline" };
  if (Object.keys(detail.homeStats ?? {}).length + Object.keys(detail.awayStats ?? {}).length > 0) {
    return { label: "Stats", tab: "stats", icon: "bar-chart-outline" };
  }
  if ((detail.keyPlays?.length ?? 0) > 0) {
    return { label: "Plays", tab: "playbyplay", icon: "list-outline" };
  }
  if ((detail.homeLineup?.length ?? 0) + (detail.awayLineup?.length ?? 0) > 0) {
    return { label: "Lineups", tab: "lineups", icon: "people-outline" };
  }
  return null;
}

export function QuickGamePanel({ game, accentColor, onOpenTab }: QuickGamePanelProps) {
  const entrance = useRef(new Animated.Value(0)).current;
  const detailQuery = useQuery({
    queryKey: ["game", game.id],
    queryFn: () => api.getGameDetail(game.id),
    enabled: !game.statusDetail,
    staleTime: game.status === "live" ? 5_000 : 60_000,
    refetchInterval: game.status === "live" ? 15_000 : false,
    retry: 1,
  });

  useEffect(() => {
    Animated.timing(entrance, {
      toValue: 1,
      duration: 190,
      useNativeDriver: true,
    }).start();
  }, [entrance]);

  const comparisons = useMemo(
    () => getStatComparisons(detailQuery.data),
    [detailQuery.data],
  );
  const secondaryAction = getSecondaryAction(detailQuery.data);
  const isEvent = game.sportArchetype === "golf" || game.sportArchetype === "racing";
  const primaryActionLabel = game.sportArchetype === "golf"
    ? "Open Tournament"
    : game.sportArchetype === "racing"
      ? "Open Race"
      : "Open Gamecast";

  return (
    <Animated.View
      style={[
        styles.shell,
        {
          borderTopColor: `${accentColor}45`,
          opacity: entrance,
          transform: [{
            translateY: entrance.interpolate({
              inputRange: [0, 1],
              outputRange: [-6, 0],
            }),
          }],
        },
      ]}
    >
      <View style={[styles.accentRail, { backgroundColor: accentColor }]} />

      <View style={styles.header}>
        <View style={[styles.statusIcon, { backgroundColor: `${accentColor}18` }]}>
          <Ionicons
            name={game.status === "live" ? "radio" : game.statusDetail ? "alert-circle-outline" : game.status === "finished" ? "checkmark" : "time-outline"}
            size={13}
            color={game.status === "live" ? C.live : accentColor}
          />
        </View>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>QUICK VIEW</Text>
          <Text style={[styles.status, { color: game.status === "live" ? C.live : accentColor }]}>
            {getStatusLabel(game)}
          </Text>
        </View>
        {detailQuery.isFetching && !game.statusDetail ? (
          <View style={styles.loadingInline}>
            <ActivityIndicator size="small" color={accentColor} />
            <Text style={styles.loadingText}>Updating</Text>
          </View>
        ) : null}
      </View>

      <Text style={styles.context} numberOfLines={3}>
        {getBaseContext(game, detailQuery.data)}
      </Text>

      {comparisons.length > 0 && !isEvent ? (
        <View style={styles.stats}>
          {comparisons.map(stat => (
            <View key={stat.label} style={styles.statCell}>
              <Text style={styles.statValue}>{stat.away}</Text>
              <Text style={styles.statLabel} numberOfLines={1}>{stat.label}</Text>
              <Text style={styles.statValue}>{stat.home}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {detailQuery.isError ? (
        <View style={styles.notice}>
          <Ionicons name="cloud-offline-outline" size={13} color={C.textTertiary} />
          <Text style={styles.noticeText}>More context unavailable. The game page can still be opened.</Text>
        </View>
      ) : null}

      <View style={styles.actions}>
        <Pressable
          onPress={() => onOpenTab("gamecast")}
          style={({ pressed }) => [
            styles.primaryAction,
            { backgroundColor: accentColor },
            pressed && styles.actionPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={`${primaryActionLabel} for ${game.awayTeam} at ${game.homeTeam}`}
        >
          <Ionicons name="tv-outline" size={15} color="#fff" />
          <Text style={styles.primaryActionText}>{primaryActionLabel}</Text>
          <Ionicons name="arrow-forward" size={13} color="#fff" />
        </Pressable>

        {secondaryAction ? (
          <Pressable
            onPress={() => onOpenTab(secondaryAction.tab)}
            style={({ pressed }) => [styles.secondaryAction, pressed && styles.actionPressed]}
            accessibilityRole="button"
            accessibilityLabel={`Open ${secondaryAction.label} for ${game.awayTeam} at ${game.homeTeam}`}
          >
            <Ionicons name={secondaryAction.icon} size={14} color={C.textSecondary} />
            <Text style={styles.secondaryActionText}>{secondaryAction.label}</Text>
          </Pressable>
        ) : null}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  shell: {
    position: "relative",
    overflow: "hidden",
    borderTopWidth: 1,
    backgroundColor: C.backgroundSecondary,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 13,
    gap: 10,
  },
  accentRail: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusIcon: {
    width: 27,
    height: 27,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
  },
  eyebrow: {
    color: C.textTertiary,
    fontSize: 8,
    letterSpacing: 0.9,
    fontFamily: FONTS.bodyHeavy,
  },
  status: {
    marginTop: 1,
    fontSize: 12,
    fontFamily: FONTS.bodyHeavy,
  },
  loadingInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  loadingText: {
    color: C.textTertiary,
    fontSize: 9,
    fontFamily: FONTS.bodyMedium,
  },
  context: {
    color: C.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    fontFamily: FONTS.bodyMedium,
  },
  stats: {
    flexDirection: "row",
    gap: 6,
  },
  statCell: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 5,
    borderRadius: 9,
    backgroundColor: C.glassMedium,
    paddingHorizontal: 8,
    paddingVertical: 7,
  },
  statValue: {
    color: C.text,
    fontSize: 11,
    fontFamily: FONTS.bodyHeavy,
  },
  statLabel: {
    flex: 1,
    color: C.textTertiary,
    fontSize: 8,
    textAlign: "center",
    fontFamily: FONTS.bodyBold,
  },
  notice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  noticeText: {
    flex: 1,
    color: C.textTertiary,
    fontSize: 10,
    lineHeight: 14,
    fontFamily: FONTS.bodyMedium,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  primaryAction: {
    flex: 1,
    minHeight: 38,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingHorizontal: 12,
  },
  primaryActionText: {
    color: "#fff",
    fontSize: 11,
    fontFamily: FONTS.bodyBold,
  },
  secondaryAction: {
    minHeight: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.cardBorder,
    backgroundColor: C.glassLight,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 12,
  },
  secondaryActionText: {
    color: C.textSecondary,
    fontSize: 10,
    fontFamily: FONTS.bodyBold,
  },
  actionPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.985 }],
  },
});
