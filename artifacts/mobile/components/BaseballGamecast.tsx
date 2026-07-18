import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Image,
  ImageBackground,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import { FONTS } from "@/constants/typography";
import type {
  BaseballAthlete,
  BaseballPlayState,
  BaseballSituation,
  Game,
  GameDetail,
  PlayerStatLine,
} from "@/utils/api";
import {
  BaseballGameHub,
  type BaseballHubSection,
} from "@/components/gamecast/BaseballGameHub";

const C = Colors.dark;
const FIELD_REFERENCE_WIDTH = 390;
const FIELD_REFERENCE_HEIGHT = 560;
const SCORE_RIBBON_HEIGHT = 72;
const SHEET_PEEK_HEIGHT = 56;

interface BaseballGamecastProps {
  data: GameDetail;
  width: number;
  height: number;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
}

interface Point { x: number; y: number }
interface MotionPath { from: Point; to: Point; label: string }
interface FieldPlayerSelection { athlete: BaseballAthlete; role: string }

const FIELD_POINTS = {
  home: { x: 195, y: 430 },
  mound: { x: 195, y: 305 },
  first: { x: 342, y: 286 },
  second: { x: 195, y: 236 },
  third: { x: 48, y: 286 },
};

const EMPTY_SITUATION: BaseballSituation = {
  balls: null,
  strikes: null,
  outs: null,
  inning: null,
  inningHalf: null,
  onFirst: null,
  onSecond: null,
  onThird: null,
  batter: null,
  pitcher: null,
};

function teamAbbreviation(name: string): string {
  const last = name.trim().split(/\s+/).filter(Boolean).slice(-1)[0] ?? name;
  return last.slice(0, 3).toUpperCase();
}

function athleteLabel(athlete: BaseballAthlete | null): string {
  const parts = athlete?.name.trim().split(/\s+/).filter(Boolean) ?? [];
  const last = parts.at(-1) ?? "";
  if (/^(Jr\.?|Sr\.?|II|III|IV)$/i.test(last) && parts.length > 1) {
    return `${parts.at(-2)} ${last}`;
  }
  return last;
}

function inningLabel(state: BaseballSituation, fallback?: string | null): string {
  if (state.inning != null && state.inningHalf) {
    return `${state.inningHalf === "top" ? "TOP" : "BOT"} ${state.inning}`;
  }
  return fallback?.toUpperCase() ?? "GAME";
}

function pointFor(width: number, height: number, point: Point): Point {
  return {
    x: point.x * (width / FIELD_REFERENCE_WIDTH),
    y: point.y * (height / FIELD_REFERENCE_HEIGHT),
  };
}

function motionForPlay(play: BaseballPlayState | null, width: number, height: number): MotionPath | null {
  if (!play) return null;
  const type = play.type.toLowerCase();
  const text = play.text.toLowerCase();
  const point = (key: keyof typeof FIELD_POINTS) => pointFor(width, height, FIELD_POINTS[key]);

  if (type.includes("pitch") || type.includes("foul") || type === "ball" || type.includes("strike")) {
    return { from: point("mound"), to: point("home"), label: "Pitch to home plate" };
  }
  if (text.includes("to third") || text.includes("stole third")) {
    return { from: point("second"), to: point("third"), label: "Runner advances to third" };
  }
  if (text.includes("to second") || text.includes("stole second")) {
    return { from: point("first"), to: point("second"), label: "Runner advances to second" };
  }
  if (text.includes("scored") || text.includes("scores")) {
    return { from: point("third"), to: point("home"), label: "Runner scores" };
  }
  if (type.includes("play-result") && play.onFirst) {
    return { from: point("home"), to: point("first"), label: "Batter reaches first" };
  }
  return null;
}

function BaseState({ state }: { state: BaseballSituation }) {
  return (
    <View
      style={styles.baseState}
      accessible
      accessibilityLabel={[
        state.onFirst ? `${state.onFirst.name} on first` : "first base empty",
        state.onSecond ? `${state.onSecond.name} on second` : "second base empty",
        state.onThird ? `${state.onThird.name} on third` : "third base empty",
      ].join(", ")}
    >
      <Ionicons name={state.onThird ? "diamond" : "diamond-outline"} size={9} color={state.onThird ? C.accent : C.textTertiary} />
      <Ionicons name={state.onSecond ? "diamond" : "diamond-outline"} size={9} color={state.onSecond ? C.accent : C.textTertiary} />
      <Ionicons name={state.onFirst ? "diamond" : "diamond-outline"} size={9} color={state.onFirst ? C.accent : C.textTertiary} />
    </View>
  );
}

function ScoreRibbon({
  game,
  state,
  awayScore,
  homeScore,
}: {
  game: Game;
  state: BaseballSituation;
  awayScore: number | null;
  homeScore: number | null;
}) {
  return (
    <View style={styles.scoreRibbon}>
      <View style={styles.scoreTeam}>
        {game.awayTeamLogo ? <Image source={{ uri: game.awayTeamLogo }} style={styles.scoreLogo} /> : null}
        <Text style={styles.scoreAbbr}>{game.awayAbbreviation ?? teamAbbreviation(game.awayTeam)}</Text>
        <Text style={styles.scoreNumber}>{awayScore ?? "–"}</Text>
      </View>

      <View style={styles.scoreSituation}>
        <Text style={styles.inning}>{inningLabel(state, game.quarter)}</Text>
        <View style={styles.situationLine}>
          <BaseState state={state} />
          <Text style={styles.outs}>{state.outs ?? "–"} OUT{state.outs === 1 ? "" : "S"}</Text>
        </View>
      </View>

      <View style={[styles.scoreTeam, styles.scoreTeamHome]}>
        <Text style={styles.scoreNumber}>{homeScore ?? "–"}</Text>
        <Text style={styles.scoreAbbr}>{game.homeAbbreviation ?? teamAbbreviation(game.homeTeam)}</Text>
        {game.homeTeamLogo ? <Image source={{ uri: game.homeTeamLogo }} style={styles.scoreLogo} /> : null}
      </View>

      <View style={styles.countBlock}>
        <Text style={styles.count}>{state.balls ?? "–"}–{state.strikes ?? "–"}</Text>
        <View style={styles.liveRow}>
          <Ionicons name="radio-button-on" size={10} color={game.status === "live" ? C.live : C.textTertiary} />
          <Text style={[styles.liveText, game.status !== "live" && styles.liveTextQuiet]}>
            {game.status === "live" ? "LIVE" : game.status === "finished" ? "FINAL" : "NEXT"}
          </Text>
        </View>
      </View>
    </View>
  );
}

function RunnerMarker({
  athlete,
  base,
  point,
  selected,
  onPress,
}: {
  athlete: BaseballAthlete | null;
  base: string;
  point: Point;
  selected: boolean;
  onPress: (athlete: BaseballAthlete, role: string) => void;
}) {
  if (!athlete) return null;
  const baseCode = base.startsWith("first") ? "1B" : base.startsWith("second") ? "2B" : "3B";
  return (
    <Pressable
      onPress={() => onPress(athlete, `ON ${baseCode}`)}
      style={[styles.runnerMarker, selected && styles.playerMarkerSelected, { left: point.x - 25, top: point.y - 25 }]}
      accessibilityRole="button"
      accessibilityLabel={`${athlete.name} on ${base}. Show live player card`}
    >
      <Text style={styles.runnerBase}>{baseCode}</Text>
      {athlete.headshot ? (
        <Image source={{ uri: athlete.headshot }} style={styles.runnerHeadshot} />
      ) : (
        <View style={styles.runnerFallback}><Ionicons name="person" size={18} color={C.text} /></View>
      )}
      <Text style={styles.runnerName} numberOfLines={1}>{athleteLabel(athlete)}</Text>
    </Pressable>
  );
}

function FieldParticipantMarker({
  athlete,
  role,
  point,
  held,
  offsetY = 0,
  selected,
  onPress,
}: {
  athlete: BaseballAthlete | null;
  role: string;
  point: Point;
  held: boolean;
  offsetY?: number;
  selected: boolean;
  onPress: (athlete: BaseballAthlete, role: string) => void;
}) {
  if (!athlete) return null;
  return (
    <Pressable
      onPress={() => onPress(athlete, held ? `LAST ${role}` : role)}
      style={[styles.fieldParticipant, held && styles.fieldParticipantHeld, selected && styles.playerMarkerSelected, { left: point.x - 34, top: point.y - 29 + offsetY }]}
      accessibilityRole="button"
      accessibilityLabel={`${role}: ${athlete.name}${held ? ", last verified matchup" : ""}. Show live player card`}
    >
      {athlete.headshot ? (
        <Image source={{ uri: athlete.headshot }} style={styles.fieldParticipantHeadshot} />
      ) : (
        <View style={styles.fieldParticipantFallback}><Ionicons name="person" size={16} color={C.textSecondary} /></View>
      )}
      <Text style={styles.fieldParticipantRole}>{held ? `LAST ${role}` : role}</Text>
      <Text style={styles.fieldParticipantName} numberOfLines={1}>{athleteLabel(athlete)}</Text>
    </Pressable>
  );
}

function LivePlayerCard({
  selection,
  playerLine,
  inning,
  outs,
  onClose,
}: {
  selection: FieldPlayerSelection;
  playerLine: PlayerStatLine | null;
  inning: string;
  outs: number | null;
  onClose: () => void;
}) {
  const isPitcher = selection.role.includes("PITCHER");
  const preferred = isPitcher ? ["IP", "H", "R", "ER", "BB", "K"] : ["H-AB", "R", "H", "RBI", "HR", "BB"];
  const stats = preferred
    .filter((key) => playerLine?.stats[key] != null)
    .slice(0, 3)
    .map((key) => ({ key, value: playerLine?.stats[key] ?? "–" }));

  return (
    <View style={styles.livePlayerCard} accessible accessibilityLabel={`${selection.athlete.name}. ${selection.role}. ${inning}. ${outs ?? "Unknown"} outs`}>
      {selection.athlete.headshot ? (
        <Image source={{ uri: selection.athlete.headshot }} style={styles.livePlayerHeadshot} />
      ) : (
        <View style={styles.livePlayerFallback}><Ionicons name="person" size={22} color={C.textSecondary} /></View>
      )}
      <View style={styles.livePlayerCopy}>
        <View style={styles.livePlayerEyebrowRow}>
          <Text style={styles.livePlayerRole}>{selection.role}</Text>
          <Text style={styles.livePlayerMoment}>{inning} · {outs ?? "–"} OUT{outs === 1 ? "" : "S"}</Text>
        </View>
        <Text style={styles.livePlayerName} numberOfLines={1}>{selection.athlete.name}</Text>
        <View style={styles.livePlayerStats}>
          {stats.length > 0 ? stats.map((stat) => (
            <View key={stat.key} style={styles.livePlayerStat}>
              <Text style={styles.livePlayerStatValue}>{stat.value}</Text>
              <Text style={styles.livePlayerStatLabel}>{stat.key}</Text>
            </View>
          )) : <Text style={styles.livePlayerUpdating}>LIVE LINE UPDATING</Text>}
        </View>
      </View>
      <Pressable onPress={onClose} style={styles.livePlayerClose} accessibilityRole="button" accessibilityLabel="Close player card">
        <Ionicons name="close" size={17} color={C.textSecondary} />
      </Pressable>
    </View>
  );
}

function PendingBatterMarker({ point }: { point: Point }) {
  return (
    <View
      style={[styles.pendingBatter, { left: point.x - 34, top: point.y - 87 }]}
      accessible
      accessibilityLabel="Next batter is updating from the official feed"
    >
      <View style={styles.pendingBatterIcon}>
        <Ionicons name="person-add-outline" size={17} color={C.textSecondary} />
      </View>
      <Text style={styles.pendingBatterRole}>NEXT BATTER</Text>
      <Text style={styles.pendingBatterName}>UPDATING</Text>
    </View>
  );
}

function FieldHistory({ plays, selectedId }: { plays: BaseballPlayState[]; selectedId: string | null }) {
  return (
    <View style={styles.fieldHistory} pointerEvents="none">
      {plays.slice(-4).map((play) => (
        <View key={play.id} style={styles.fieldHistoryRow}>
          <Ionicons name={play.id === selectedId ? "radio-button-on" : "ellipse-outline"} size={10} color={play.id === selectedId ? C.accent : "rgba(244,238,229,0.54)"} />
          <Text style={[styles.fieldHistoryText, play.id === selectedId && styles.fieldHistoryTextActive]} numberOfLines={1}>
            {play.typeText || play.type || "Play"}
          </Text>
        </View>
      ))}
    </View>
  );
}

export function BaseballGamecast({ data, width, height, expanded, onExpandedChange }: BaseballGamecastProps) {
  const game = data.game;
  const gamecast = data.baseballGamecast;
  const fieldWidth = Math.min(width, 440);
  const fieldHeight = Math.max(480, height - SCORE_RIBBON_HEIGHT);
  const expandedTop = Math.max(176, Math.min(206, Math.round(height * 0.24)));
  const collapsedTop = Math.max(expandedTop + 180, height - SHEET_PEEK_HEIGHT);
  const collapsedOffset = collapsedTop - expandedTop;
  const plays = gamecast?.recentPlays ?? [];
  const liveIndex = Math.max(0, plays.length - 1);
  const [selectedIndex, setSelectedIndex] = useState(liveIndex);
  const [section, setSection] = useState<BaseballHubSection>("overview");
  const [selectedFieldPlayer, setSelectedFieldPlayer] = useState<FieldPlayerSelection | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);
  const motionProgress = useRef(new Animated.Value(1)).current;
  const sheetOffset = useRef(new Animated.Value(expanded ? 0 : collapsedOffset)).current;
  const dragStart = useRef(expanded ? 0 : collapsedOffset);
  const webDragStartY = useRef<number | null>(null);
  const webDragStartOffset = useRef(expanded ? 0 : collapsedOffset);
  const webDidDrag = useRef(false);
  const suppressNextPress = useRef(false);

  const animateSheet = useCallback((nextExpanded: boolean) => {
    const destination = nextExpanded ? 0 : collapsedOffset;
    if (reduceMotion) {
      sheetOffset.setValue(destination);
    } else {
      Animated.spring(sheetOffset, {
        toValue: destination,
        damping: 25,
        stiffness: 240,
        mass: 0.9,
        useNativeDriver: true,
      }).start();
    }
  }, [collapsedOffset, reduceMotion, sheetOffset]);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => {});
    const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    animateSheet(expanded);
  }, [animateSheet, expanded]);

  useEffect(() => {
    setSelectedIndex((current) => current >= liveIndex - 1 ? liveIndex : Math.min(current, liveIndex));
  }, [liveIndex]);

  useEffect(() => {
    setSelectedFieldPlayer(null);
  }, [selectedIndex, expanded]);

  const panResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_event, gesture) => Math.abs(gesture.dy) > 5,
    onMoveShouldSetPanResponderCapture: (_event, gesture) => Math.abs(gesture.dy) > 5,
    onPanResponderGrant: () => {
      sheetOffset.stopAnimation((value) => { dragStart.current = value; });
    },
    onPanResponderMove: (_event, gesture) => {
      const next = Math.max(0, Math.min(collapsedOffset, dragStart.current + gesture.dy));
      sheetOffset.setValue(next);
    },
    onPanResponderRelease: (_event, gesture) => {
      const current = Math.max(0, Math.min(collapsedOffset, dragStart.current + gesture.dy));
      const midpoint = collapsedOffset / 2;
      const shouldExpand = gesture.vy < -0.35 || (gesture.vy < 0.35 && current < midpoint);
      onExpandedChange(shouldExpand);
      animateSheet(shouldExpand);
      AccessibilityInfo.announceForAccessibility(shouldExpand ? "Game details expanded" : "Game details collapsed");
    },
    onPanResponderTerminate: () => animateSheet(expanded),
    onPanResponderTerminationRequest: () => false,
  }), [animateSheet, collapsedOffset, expanded, onExpandedChange, sheetOffset]);

  const webDragHandlers = useMemo(() => Platform.OS === "web" ? ({
    onPointerDown: (event: any) => {
      const nativeEvent = event.nativeEvent ?? event;
      webDragStartY.current = nativeEvent.clientY;
      webDragStartOffset.current = expanded ? 0 : collapsedOffset;
      webDidDrag.current = false;
      event.currentTarget?.setPointerCapture?.(nativeEvent.pointerId);
      event.preventDefault?.();
    },
    onPointerMove: (event: any) => {
      if (webDragStartY.current == null) return;
      const nativeEvent = event.nativeEvent ?? event;
      const distance = nativeEvent.clientY - webDragStartY.current;
      if (Math.abs(distance) > 4) webDidDrag.current = true;
      const next = Math.max(0, Math.min(collapsedOffset, webDragStartOffset.current + distance));
      sheetOffset.setValue(next);
    },
    onPointerUp: (event: any) => {
      if (webDragStartY.current == null) return;
      const nativeEvent = event.nativeEvent ?? event;
      const distance = nativeEvent.clientY - webDragStartY.current;
      const current = Math.max(0, Math.min(collapsedOffset, webDragStartOffset.current + distance));
      const didDrag = webDidDrag.current;
      webDragStartY.current = null;
      webDidDrag.current = false;
      if (!didDrag) return;
      suppressNextPress.current = true;
      setTimeout(() => { suppressNextPress.current = false; }, 0);
      const shouldExpand = current < collapsedOffset / 2;
      onExpandedChange(shouldExpand);
      animateSheet(shouldExpand);
      AccessibilityInfo.announceForAccessibility(shouldExpand ? "Game details expanded" : "Game details collapsed");
      event.currentTarget?.blur?.();
      event.preventDefault?.();
    },
    onPointerCancel: () => {
      webDragStartY.current = null;
      webDidDrag.current = false;
      animateSheet(expanded);
    },
    onWheel: (event: any) => {
      const nativeEvent = event.nativeEvent ?? event;
      const deltaY = nativeEvent.deltaY ?? 0;
      if (deltaY < -8 && !expanded) {
        onExpandedChange(true);
        animateSheet(true);
        event.preventDefault?.();
      } else if (deltaY > 8 && expanded) {
        onExpandedChange(false);
        animateSheet(false);
        event.preventDefault?.();
      }
      event.currentTarget?.blur?.();
    },
  } as any) : panResponder.panHandlers, [
    animateSheet,
    collapsedOffset,
    expanded,
    onExpandedChange,
    panResponder.panHandlers,
    sheetOffset,
  ]);

  const selectedPlay = plays[selectedIndex] ?? null;
  const isAtLive = selectedIndex === liveIndex;
  const visibleState: BaseballSituation = (isAtLive ? gamecast?.situation ?? selectedPlay : selectedPlay) ?? EMPTY_SITUATION;
  const occupiedRunners = [visibleState.onFirst, visibleState.onSecond, visibleState.onThird].filter(Boolean) as BaseballAthlete[];
  const batterIsOnBase = !!visibleState.batter && occupiedRunners.some((runner) =>
    runner.id === visibleState.batter?.id || runner.name === visibleState.batter?.name,
  );
  const displayState: BaseballSituation = batterIsOnBase
    ? { ...visibleState, batter: null, balls: null, strikes: null }
    : visibleState;
  const matchupHistory = plays.slice(0, selectedIndex + 1);
  const lastVerifiedMatchup = [...matchupHistory].reverse().find((play) => play.batter || play.pitcher) ?? null;
  const fieldBatter = batterIsOnBase ? null : displayState.batter ?? lastVerifiedMatchup?.batter ?? null;
  const fieldPitcher = displayState.pitcher ?? lastVerifiedMatchup?.pitcher ?? null;
  const batterHeld = !displayState.batter && !!fieldBatter;
  const pitcherHeld = !displayState.pitcher && !!fieldPitcher;
  const awaitingNextBatter = isAtLive && !fieldBatter && !!displayState.pitcher;
  const selectedPlayerLine = selectedFieldPlayer
    ? [...(data.awayPlayerStats ?? []), ...(data.homePlayerStats ?? [])]
      .find((player) => player.name === selectedFieldPlayer.athlete.name) ?? null
    : null;
  const motion = useMemo(() => motionForPlay(selectedPlay, fieldWidth, fieldHeight), [fieldHeight, fieldWidth, selectedPlay]);

  useEffect(() => {
    if (!motion || reduceMotion) {
      motionProgress.setValue(1);
      return;
    }
    motionProgress.setValue(0);
    Animated.timing(motionProgress, { toValue: 1, duration: 850, useNativeDriver: true }).start();
  }, [motion, motionProgress, reduceMotion, selectedPlay?.id]);

  const displayedAwayScore = !isAtLive && selectedPlay?.awayScore != null ? selectedPlay.awayScore : game.awayScore;
  const displayedHomeScore = !isAtLive && selectedPlay?.homeScore != null ? selectedPlay.homeScore : game.homeScore;
  const playCall = selectedPlay?.text ?? (game.status === "upcoming"
    ? `First pitch ${new Date(game.startTime).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`
    : game.statusDetail ?? "Waiting for the next verified play.");
  const recentRail = plays.slice(-7);
  const railStartIndex = Math.max(0, plays.length - recentRail.length);
  const selectedId = selectedPlay?.id ?? null;

  const firstPoint = pointFor(fieldWidth, fieldHeight, FIELD_POINTS.first);
  const secondPoint = pointFor(fieldWidth, fieldHeight, FIELD_POINTS.second);
  const thirdPoint = pointFor(fieldWidth, fieldHeight, FIELD_POINTS.third);
  const homePoint = pointFor(fieldWidth, fieldHeight, FIELD_POINTS.home);
  const moundPoint = pointFor(fieldWidth, fieldHeight, FIELD_POINTS.mound);
  const trailDots = motion ? Array.from({ length: 5 }, (_, index) => {
    const amount = (index + 1) / 6;
    return { x: motion.from.x + (motion.to.x - motion.from.x) * amount, y: motion.from.y + (motion.to.y - motion.from.y) * amount };
  }) : [];
  const animatedBallStyle = motion ? {
    left: motion.from.x - 10,
    top: motion.from.y - 10,
    transform: [
      { translateX: motionProgress.interpolate({ inputRange: [0, 1], outputRange: [0, motion.to.x - motion.from.x] }) },
      { translateY: motionProgress.interpolate({ inputRange: [0, 1], outputRange: [0, motion.to.y - motion.from.y] }) },
      { scale: motionProgress.interpolate({ inputRange: [0, 0.65, 1], outputRange: [0.82, 1.08, 0.92] }) },
    ],
  } : null;

  const selectPlay = useCallback((playId: string) => {
    const index = plays.findIndex((play) => play.id === playId);
    if (index >= 0) setSelectedIndex(index);
  }, [plays]);

  const returnLive = useCallback(() => setSelectedIndex(liveIndex), [liveIndex]);
  const selectFieldPlayer = useCallback((athlete: BaseballAthlete, role: string) => {
    setSelectedFieldPlayer((current) => current?.athlete.id === athlete.id && current.role === role ? null : { athlete, role });
  }, []);
  const toggleExpanded = useCallback(() => {
    if (suppressNextPress.current) {
      suppressNextPress.current = false;
      return;
    }
    const next = !expanded;
    onExpandedChange(next);
    animateSheet(next);
    AccessibilityInfo.announceForAccessibility(next ? "Game details expanded" : "Game details collapsed");
  }, [animateSheet, expanded, onExpandedChange]);

  const stateSummary = [
    inningLabel(displayState, game.quarter),
    displayState.outs == null ? null : `${displayState.outs} outs`,
    displayState.balls == null || displayState.strikes == null ? null : `${displayState.balls} balls, ${displayState.strikes} strikes`,
    displayState.onFirst ? `${displayState.onFirst.name} on first` : null,
    displayState.onSecond ? `${displayState.onSecond.name} on second` : null,
    displayState.onThird ? `${displayState.onThird.name} on third` : null,
    fieldBatter ? `${fieldBatter.name} ${batterHeld ? "was the last verified batter" : "is batting"}` : null,
    fieldPitcher ? `${fieldPitcher.name} ${pitcherHeld ? "was the last verified pitcher" : "is pitching"}` : null,
  ].filter(Boolean).join(". ");

  return (
    <View style={[styles.root, { width: fieldWidth, height }]}>
      <ScoreRibbon game={game} state={displayState} awayScore={displayedAwayScore} homeScore={displayedHomeScore} />

      <ImageBackground
        source={require("@/assets/images/baseball-gamecast-field.png")}
        style={[styles.field, { width: fieldWidth, height: fieldHeight }]}
        imageStyle={styles.fieldImage}
        resizeMode="stretch"
        accessible
        accessibilityLabel={`Baseball field. ${stateSummary}`}
      >
        <View style={styles.fieldShade} pointerEvents="none" />
        {expanded ? (
          <View style={styles.compactFieldState} pointerEvents="none">
            <View style={styles.compactPlayIcon}>
              <Ionicons name="baseball" size={18} color="#FFF8EC" />
            </View>
            <View style={styles.compactPlayCopy}>
              <Text style={styles.compactPlayEyebrow}>{isAtLive ? "ON THE FIELD" : "REPLAYING"}</Text>
              <Text style={styles.compactPlayText} numberOfLines={2}>{playCall}</Text>
            </View>
            <View style={styles.compactSituation}>
              <BaseState state={displayState} />
              <Text style={styles.compactCount}>{displayState.balls ?? "–"}–{displayState.strikes ?? "–"}</Text>
            </View>
          </View>
        ) : null}
        <FieldHistory plays={recentRail} selectedId={selectedId} />
        {trailDots.map((dot, index) => (
          <Ionicons key={`${selectedId}-trail-${index}`} name="ellipse" size={5} color="rgba(242,166,90,0.78)" style={[styles.trailDot, { left: dot.x - 2.5, top: dot.y - 2.5 }]} />
        ))}
        {motion && animatedBallStyle ? (
          <Animated.View style={[styles.ball, animatedBallStyle]} accessible accessibilityLabel={`${motion.label}. Illustrative movement based on the verified play.`}>
            <Ionicons name="baseball" size={20} color="#FFF8EC" />
          </Animated.View>
        ) : null}
        <FieldParticipantMarker athlete={fieldPitcher} role="PITCHER" point={moundPoint} held={pitcherHeld} selected={selectedFieldPlayer?.athlete.id === fieldPitcher?.id && !!selectedFieldPlayer?.role.includes("PITCHER")} onPress={selectFieldPlayer} />
        <FieldParticipantMarker athlete={fieldBatter} role="AT BAT" point={homePoint} held={batterHeld} offsetY={-58} selected={selectedFieldPlayer?.athlete.id === fieldBatter?.id && !!selectedFieldPlayer?.role.includes("AT BAT")} onPress={selectFieldPlayer} />
        {awaitingNextBatter ? <PendingBatterMarker point={homePoint} /> : null}
        <RunnerMarker athlete={displayState.onFirst} base="first base" point={firstPoint} selected={selectedFieldPlayer?.athlete.id === displayState.onFirst?.id && selectedFieldPlayer?.role === "ON 1B"} onPress={selectFieldPlayer} />
        <RunnerMarker athlete={displayState.onSecond} base="second base" point={secondPoint} selected={selectedFieldPlayer?.athlete.id === displayState.onSecond?.id && selectedFieldPlayer?.role === "ON 2B"} onPress={selectFieldPlayer} />
        <RunnerMarker athlete={displayState.onThird} base="third base" point={thirdPoint} selected={selectedFieldPlayer?.athlete.id === displayState.onThird?.id && selectedFieldPlayer?.role === "ON 3B"} onPress={selectFieldPlayer} />
        {selectedFieldPlayer ? (
          <LivePlayerCard
            selection={selectedFieldPlayer}
            playerLine={selectedPlayerLine}
            inning={inningLabel(displayState, game.quarter)}
            outs={displayState.outs}
            onClose={() => setSelectedFieldPlayer(null)}
          />
        ) : null}

        <View style={styles.replayRail}>
          <View style={styles.railLine} />
          {recentRail.map((play, localIndex) => {
            const absoluteIndex = railStartIndex + localIndex;
            const selected = absoluteIndex === selectedIndex;
            return (
              <Pressable key={play.id} onPress={() => setSelectedIndex(absoluteIndex)} style={styles.railStop} accessibilityRole="button" accessibilityLabel={`Show play ${localIndex + 1}: ${play.text}`} accessibilityState={{ selected }}>
                <Ionicons name={selected ? "radio-button-on" : "ellipse"} size={selected ? 19 : 9} color={selected ? C.accent : "rgba(244,238,229,0.55)"} />
              </Pressable>
            );
          })}
          <Pressable onPress={returnLive} style={styles.railLive} accessibilityRole="button" accessibilityLabel="Return to live play">
            <Ionicons name="radio-button-on" size={11} color={isAtLive ? C.live : C.textTertiary} />
            <Text style={[styles.railLiveText, isAtLive && styles.railLiveTextActive]}>LIVE</Text>
          </Pressable>
        </View>

        <View style={styles.playCall}>
          <View style={styles.playCallRule} />
          <Text style={styles.playCallText} numberOfLines={2}>{playCall}</Text>
          {!isAtLive ? <Text style={styles.replayLabel}>REPLAY</Text> : null}
        </View>
      </ImageBackground>

      <Animated.View
        style={[
          styles.sheet,
          {
            top: expandedTop,
            height: height - expandedTop + 8,
            transform: [{ translateY: sheetOffset }],
          },
        ]}
      >
        <Pressable
          onPress={toggleExpanded}
          style={styles.sheetHandle}
          accessibilityRole="button"
          accessibilityLabel={expanded ? "Collapse game details" : "Expand game details"}
          accessibilityState={{ expanded }}
          {...webDragHandlers}
        >
          <View style={styles.grabber} />
          <View style={styles.handleLabelRow}>
            <Ionicons name={expanded ? "chevron-down" : "chevron-up"} size={14} color={C.textSecondary} />
            <Text style={styles.handleLabel}>GAME DETAILS</Text>
            <Ionicons name={expanded ? "chevron-down" : "chevron-up"} size={14} color={C.textSecondary} />
          </View>
        </Pressable>
        <BaseballGameHub
          data={data}
          expanded={expanded}
          section={section}
          onSectionChange={setSection}
          selectedPlayId={selectedId}
          onSelectPlay={selectPlay}
          onReturnLive={returnLive}
          visibleState={displayState}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { maxWidth: 440, alignSelf: "center", overflow: "hidden", backgroundColor: "#0D151D" },
  scoreRibbon: { width: "100%", height: SCORE_RIBBON_HEIGHT, paddingHorizontal: 10, flexDirection: "row", alignItems: "center", backgroundColor: "#0A1118", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(244,238,229,0.16)", zIndex: 4 },
  scoreTeam: { minWidth: 78, flexDirection: "row", alignItems: "center", gap: 5 },
  scoreTeamHome: { justifyContent: "flex-end" },
  scoreLogo: { width: 25, height: 25, resizeMode: "contain" },
  scoreAbbr: { color: C.text, fontFamily: FONTS.displayMedium, fontSize: 17 },
  scoreNumber: { color: C.text, fontFamily: FONTS.display, fontSize: 28, lineHeight: 32 },
  scoreSituation: { flex: 1, alignItems: "center", justifyContent: "center", gap: 3 },
  inning: { color: C.accent, fontFamily: FONTS.displayMedium, fontSize: 14, letterSpacing: 0.6 },
  situationLine: { flexDirection: "row", alignItems: "center", gap: 7 },
  baseState: { flexDirection: "row", gap: 1, alignItems: "center" },
  outs: { color: C.textSecondary, fontFamily: FONTS.bodyBold, fontSize: 9, letterSpacing: 0.4 },
  countBlock: { width: 48, marginLeft: 7, alignItems: "flex-end" },
  count: { color: C.text, fontFamily: FONTS.displayMedium, fontSize: 17 },
  liveRow: { flexDirection: "row", alignItems: "center", gap: 2 },
  liveText: { color: C.live, fontFamily: FONTS.bodyBold, fontSize: 9, letterSpacing: 0.6 },
  liveTextQuiet: { color: C.textTertiary },
  field: { position: "absolute", top: SCORE_RIBBON_HEIGHT, left: 0, overflow: "hidden", backgroundColor: "#13202A" },
  fieldImage: { opacity: 0.96 },
  fieldShade: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(4,10,15,0.08)" },
  compactFieldState: { position: "absolute", left: 10, right: 10, top: 10, minHeight: 68, flexDirection: "row", alignItems: "center", gap: 9, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: "rgba(6,12,18,0.72)", borderLeftWidth: 2, borderLeftColor: C.accent },
  compactPlayIcon: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(242,166,90,0.16)" },
  compactPlayCopy: { flex: 1 },
  compactPlayEyebrow: { color: C.accent, fontFamily: FONTS.bodyBold, fontSize: 8, letterSpacing: 1 },
  compactPlayText: { marginTop: 2, color: C.text, fontFamily: FONTS.displayMedium, fontSize: 11, lineHeight: 14 },
  compactSituation: { alignItems: "flex-end", gap: 5 },
  compactCount: { color: C.text, fontFamily: FONTS.display, fontSize: 19 },
  fieldHistory: { position: "absolute", left: 8, top: "54%", width: 94, paddingLeft: 5, borderLeftWidth: 1, borderLeftColor: "rgba(244,238,229,0.5)", gap: 6 },
  fieldHistoryRow: { minHeight: 15, flexDirection: "row", alignItems: "center", gap: 4 },
  fieldHistoryText: { flex: 1, color: "rgba(244,238,229,0.64)", fontFamily: FONTS.mono, fontSize: 8, textTransform: "uppercase" },
  fieldHistoryTextActive: { color: C.accent },
  trailDot: { position: "absolute" },
  ball: { position: "absolute", width: 20, height: 20, alignItems: "center", justifyContent: "center", zIndex: 7, shadowColor: C.accent, shadowOpacity: 0.9, shadowRadius: 7, shadowOffset: { width: 0, height: 0 } },
  runnerMarker: { position: "absolute", width: 58, alignItems: "center", zIndex: 4 },
  playerMarkerSelected: { transform: [{ scale: 1.08 }], shadowColor: C.accent, shadowOpacity: 0.9, shadowRadius: 10, shadowOffset: { width: 0, height: 0 } },
  runnerBase: { position: "absolute", top: -8, zIndex: 6, minWidth: 22, paddingHorizontal: 4, paddingVertical: 1, color: "#0A1118", backgroundColor: C.accent, fontFamily: FONTS.monoBold, fontSize: 8, textAlign: "center" },
  runnerHeadshot: { width: 46, height: 46, borderRadius: 23, borderWidth: 2, borderColor: C.accent, backgroundColor: C.card },
  runnerFallback: { width: 46, height: 46, borderRadius: 23, borderWidth: 2, borderColor: C.accent, backgroundColor: "rgba(13,21,29,0.88)", alignItems: "center", justifyContent: "center" },
  runnerName: { marginTop: -1, maxWidth: 70, paddingHorizontal: 5, paddingVertical: 2, overflow: "hidden", color: C.text, backgroundColor: "rgba(8,14,20,0.88)", fontFamily: FONTS.displayMedium, fontSize: 10, letterSpacing: 0.25 },
  fieldParticipant: { position: "absolute", width: 68, alignItems: "center", zIndex: 5 },
  fieldParticipantHeld: { opacity: 0.68 },
  fieldParticipantHeadshot: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: "#F4EEE5", backgroundColor: C.card },
  fieldParticipantFallback: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: "#F4EEE5", alignItems: "center", justifyContent: "center", backgroundColor: C.card },
  fieldParticipantRole: { marginTop: -1, paddingHorizontal: 4, paddingTop: 2, color: C.accent, backgroundColor: "rgba(8,14,20,0.92)", fontFamily: FONTS.bodyBold, fontSize: 7, letterSpacing: 0.45 },
  fieldParticipantName: { maxWidth: 74, paddingHorizontal: 5, paddingBottom: 2, color: C.text, backgroundColor: "rgba(8,14,20,0.92)", fontFamily: FONTS.displayMedium, fontSize: 10 },
  pendingBatter: { position: "absolute", width: 68, alignItems: "center", zIndex: 5, opacity: 0.74 },
  pendingBatterIcon: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", borderWidth: 1, borderStyle: "dashed", borderColor: C.textTertiary, backgroundColor: "rgba(8,14,20,0.82)" },
  pendingBatterRole: { marginTop: -1, paddingHorizontal: 4, paddingTop: 2, color: C.textSecondary, backgroundColor: "rgba(8,14,20,0.92)", fontFamily: FONTS.bodyBold, fontSize: 7, letterSpacing: 0.35 },
  pendingBatterName: { paddingHorizontal: 5, paddingBottom: 2, color: C.textTertiary, backgroundColor: "rgba(8,14,20,0.92)", fontFamily: FONTS.displayMedium, fontSize: 9 },
  livePlayerCard: { position: "absolute", left: 14, right: 14, top: 14, minHeight: 82, zIndex: 9, flexDirection: "row", alignItems: "center", gap: 10, padding: 10, paddingRight: 34, backgroundColor: "rgba(8,14,20,0.94)", borderLeftWidth: 3, borderLeftColor: C.accent, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "rgba(244,238,229,0.18)", shadowColor: "#000", shadowOpacity: 0.35, shadowRadius: 14, shadowOffset: { width: 0, height: 6 } },
  livePlayerHeadshot: { width: 58, height: 58, borderRadius: 29, borderWidth: 1.5, borderColor: C.accent, backgroundColor: C.card },
  livePlayerFallback: { width: 58, height: 58, borderRadius: 29, alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: C.accent, backgroundColor: C.card },
  livePlayerCopy: { flex: 1, minWidth: 0 },
  livePlayerEyebrowRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  livePlayerRole: { color: C.accent, fontFamily: FONTS.bodyBold, fontSize: 8, letterSpacing: 0.8 },
  livePlayerMoment: { color: C.textTertiary, fontFamily: FONTS.mono, fontSize: 8 },
  livePlayerName: { marginTop: 2, color: C.text, fontFamily: FONTS.display, fontSize: 17, lineHeight: 20 },
  livePlayerStats: { minHeight: 22, marginTop: 4, flexDirection: "row", alignItems: "center", gap: 14 },
  livePlayerStat: { flexDirection: "row", alignItems: "baseline", gap: 3 },
  livePlayerStatValue: { color: C.text, fontFamily: FONTS.displayMedium, fontSize: 13 },
  livePlayerStatLabel: { color: C.textTertiary, fontFamily: FONTS.monoBold, fontSize: 7 },
  livePlayerUpdating: { color: C.textTertiary, fontFamily: FONTS.monoBold, fontSize: 8, letterSpacing: 0.7 },
  livePlayerClose: { position: "absolute", right: 7, top: 7, width: 28, height: 28, alignItems: "center", justifyContent: "center" },
  replayRail: { position: "absolute", left: 12, right: 12, bottom: 119, height: 50, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "rgba(6,12,18,0.76)", paddingLeft: 4 },
  railLine: { position: "absolute", left: 22, right: 66, top: 24, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "rgba(244,238,229,0.35)" },
  railStop: { width: 38, height: 44, alignItems: "center", justifyContent: "center" },
  railLive: { minWidth: 56, height: 44, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 3 },
  railLiveText: { color: C.textTertiary, fontFamily: FONTS.bodyBold, fontSize: 9, letterSpacing: 0.5 },
  railLiveTextActive: { color: C.live },
  playCall: { position: "absolute", left: 12, right: 12, bottom: 67, minHeight: 52, paddingHorizontal: 12, paddingVertical: 8, flexDirection: "row", alignItems: "center", gap: 9, backgroundColor: "rgba(8,14,20,0.9)", borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "rgba(242,166,90,0.3)" },
  playCallRule: { width: 3, alignSelf: "stretch", backgroundColor: C.accent },
  playCallText: { flex: 1, color: C.text, fontFamily: FONTS.bodyBold, fontSize: 12, lineHeight: 17 },
  replayLabel: { color: C.accent, fontFamily: FONTS.monoBold, fontSize: 9, letterSpacing: 1 },
  sheet: { position: "absolute", left: 0, right: 0, zIndex: 10, overflow: "hidden", backgroundColor: "#15212C", borderTopLeftRadius: 26, borderTopRightRadius: 26, borderWidth: 1, borderBottomWidth: 0, borderColor: "rgba(244,238,229,0.2)", shadowColor: "#000", shadowOpacity: 0.45, shadowRadius: 18, shadowOffset: { width: 0, height: -8 }, elevation: 18 },
  sheetHandle: { height: SHEET_PEEK_HEIGHT, alignItems: "center", justifyContent: "center", backgroundColor: "#111C26", outlineWidth: 0 },
  grabber: { width: 64, height: 4, borderRadius: 2, backgroundColor: "rgba(244,238,229,0.34)", marginBottom: 8 },
  handleLabelRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  handleLabel: { color: C.textSecondary, fontFamily: FONTS.displayMedium, fontSize: 12, letterSpacing: 1.5 },
});
