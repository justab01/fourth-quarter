import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "@/constants/colors";
import { FONTS } from "@/constants/typography";
import { resolveBallparkImage } from "@/constants/ballparks";
import type {
  BaseballAthlete,
  BaseballPlayState,
  BaseballSituation,
  GameDetail,
  PlayerStatLine,
} from "@/utils/api";

const C = Colors.dark;
// Editorial serif for headlines, matching the approved v9 mockup (ui-serif/Georgia).
const SERIF = Platform.OS === "web" ? "Georgia, 'Times New Roman', serif" : "Georgia";
const WEB_PRESS_PROPS = Platform.OS === "web"
  ? { onMouseDown: (event: { preventDefault: () => void }) => event.preventDefault() }
  : {};

// Approved spec dock (2026-07-18 baseball-fullscreen-game-room): exactly five
// equal destinations. Route keys stay `overview`/`lineups` for deep-link
// compatibility (Story→section=overview, Lineup→section=lineups); labels match
// the spec. STATS is folded into DETAILS (team stats/comparison); DETAILS is new.
export type BaseballHubSection = "overview" | "plays" | "box" | "lineups" | "details";

const SECTIONS: Array<{ key: BaseballHubSection; label: string }> = [
  { key: "overview", label: "STORY" },
  { key: "plays", label: "PLAYS" },
  { key: "box", label: "BOX" },
  { key: "lineups", label: "LINEUP" },
  { key: "details", label: "DETAILS" },
];

interface BaseballGameHubProps {
  data: GameDetail;
  expanded: boolean;
  section: BaseballHubSection;
  onSectionChange: (section: BaseballHubSection) => void;
  selectedPlayId: string | null;
  onSelectPlay: (playId: string) => void;
  onReturnLive: () => void;
  visibleState: BaseballSituation;
}

function lastName(name: string): string {
  return name.split(/\s+/).slice(-1)[0] ?? name;
}

function TeamMark({ uri, name, size = 28 }: { uri?: string | null; name: string; size?: number }) {
  if (uri) return <Image source={{ uri }} style={{ width: size, height: size, resizeMode: "contain" }} />;
  return (
    <View style={[styles.teamFallback, { width: size, height: size }]}>
      <Text style={styles.teamFallbackText}>{name.charAt(0)}</Text>
    </View>
  );
}

function EmptyState({ icon, title, detail }: { icon: keyof typeof Ionicons.glyphMap; title: string; detail: string }) {
  return (
    <View style={styles.emptyState}>
      <Ionicons name={icon} size={24} color={C.textTertiary} />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyDetail}>{detail}</Text>
    </View>
  );
}

function HubTabs({
  section,
  onSectionChange,
}: {
  section: BaseballHubSection;
  onSectionChange: (section: BaseballHubSection) => void;
}) {
  return (
    <View style={styles.tabs} accessibilityRole="tablist">
      {SECTIONS.map((item) => {
        const active = item.key === section;
        return (
          <Pressable
            key={item.key}
            onPress={() => onSectionChange(item.key)}
            style={[styles.tab, active && styles.tabActive]}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`Show ${item.label.toLowerCase()}`}
            {...WEB_PRESS_PROPS}
          >
            <Text style={[styles.tabText, active && styles.tabTextActive]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function LineScore({ data }: { data: GameDetail }) {
  const lineScore = data.baseballGamecast?.lineScore;
  const inningCount = Math.max(
    lineScore?.away.innings.length ?? 0,
    lineScore?.home.innings.length ?? 0,
    data.baseballGamecast?.situation.inning ?? 0,
  );
  const innings = Array.from({ length: inningCount }, (_, index) => index + 1);
  const compactColumns = inningCount <= 6;

  if (!lineScore || inningCount === 0) {
    return <EmptyState icon="grid-outline" title="Line score is updating" detail="Inning totals will appear as soon as the official feed publishes them." />;
  }

  const row = (
    side: "away" | "home",
    teamName: string,
    abbreviation: string | undefined,
    logo: string | null,
  ) => {
    const values = lineScore[side];
    return (
      <View style={[styles.lineRow, compactColumns && styles.lineRowCompact]} key={side}>
        <View style={[styles.lineTeam, compactColumns && styles.lineTeamCompact]}>
          <TeamMark uri={logo} name={teamName} size={24} />
          <Text style={styles.lineTeamText}>{abbreviation ?? lastName(teamName).slice(0, 3).toUpperCase()}</Text>
        </View>
        {innings.map((inning, index) => (
          <Text key={inning} style={[styles.inningCell, compactColumns && styles.lineCellCompact]}>{values.innings[index] ?? "–"}</Text>
        ))}
        <Text style={[styles.totalCell, compactColumns && styles.lineCellCompact, styles.totalCellAccent]}>{values.runs ?? "–"}</Text>
        <Text style={[styles.totalCell, compactColumns && styles.lineCellCompact]}>{values.hits ?? "–"}</Text>
        <Text style={[styles.totalCell, compactColumns && styles.lineCellCompact]}>{values.errors ?? "–"}</Text>
      </View>
    );
  };

  return (
    <View style={styles.sectionBlock}>
      <Text style={styles.eyebrow}>LINE SCORE</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.lineTable}>
        <View>
          <View style={[styles.lineHeader, compactColumns && styles.lineRowCompact]}>
            <Text style={[styles.lineHeaderCell, styles.lineTeamHeader, compactColumns && styles.lineTeamCompact]}>TEAM</Text>
            {innings.map((inning) => <Text key={inning} style={[styles.lineHeaderCell, compactColumns && styles.lineCellCompact]}>{inning}</Text>)}
            <Text style={[styles.lineHeaderCell, compactColumns && styles.lineCellCompact]}>R</Text>
            <Text style={[styles.lineHeaderCell, compactColumns && styles.lineCellCompact]}>H</Text>
            <Text style={[styles.lineHeaderCell, compactColumns && styles.lineCellCompact]}>E</Text>
          </View>
          {row("away", data.game.awayTeam, data.game.awayAbbreviation, data.game.awayTeamLogo)}
          {row("home", data.game.homeTeam, data.game.homeAbbreviation, data.game.homeTeamLogo)}
        </View>
      </ScrollView>
    </View>
  );
}

function AthletePortrait({ athlete }: { athlete: BaseballAthlete | null }) {
  if (!athlete) {
    return (
      <View style={styles.athleteFallback}>
        <Ionicons name="person" size={26} color={C.textTertiary} />
      </View>
    );
  }
  if (athlete.headshot) return <Image source={{ uri: athlete.headshot }} style={styles.athletePortrait} />;
  return (
    <View style={styles.athleteFallback}>
      <Text style={styles.athleteFallbackText}>{athlete.name.charAt(0)}</Text>
    </View>
  );
}

function findPlayer(data: GameDetail, athlete: BaseballAthlete | null): PlayerStatLine | null {
  if (!athlete) return null;
  return [...(data.awayPlayerStats ?? []), ...(data.homePlayerStats ?? [])]
    .find((player) => player.name === athlete.name) ?? null;
}

function AthleteFace({ athlete }: { athlete: BaseballAthlete | null }) {
  if (athlete?.headshot) return <Image source={{ uri: athlete.headshot }} style={styles.personFace} />;
  return (
    <View style={styles.personFaceFallback}>
      {athlete
        ? <Text style={styles.personFaceInitial}>{athlete.name.charAt(0)}</Text>
        : <Ionicons name="person" size={20} color={C.textTertiary} />}
    </View>
  );
}

// v9 mockup .match card: batter face + label + count + pitcher face.
function Matchup({ data, state }: { data: GameDetail; state: BaseballSituation }) {
  const batterLine = findPlayer(data, state.batter);
  const pitcherLine = findPlayer(data, state.pitcher);
  const isFinal = data.game.status === "finished";
  const batterStat = batterLine?.stats["H-AB"] ?? batterLine?.stats["AVG"] ?? null;
  const pitcherStat = pitcherLine?.stats["IP"] ? `${pitcherLine.stats["IP"]} IP`
    : pitcherLine?.stats["K"] ? `${pitcherLine.stats["K"]} K` : null;

  if (!state.batter && !state.pitcher) {
    return (
      <View style={styles.betweenInnings}>
        <View style={styles.betweenIcon}>
          <Ionicons name="hourglass-outline" size={18} color={C.accent} />
        </View>
        <View style={styles.betweenCopy}>
          <Text style={styles.betweenTitle}>Between innings</Text>
          <Text style={styles.betweenDetail}>The next batter and pitcher appear when the official feed confirms the matchup.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.match}>
      <View style={styles.person}>
        <AthleteFace athlete={state.batter} />
        <View style={styles.personCopy}>
          <Text style={styles.personLabel}>{isFinal ? "FINAL BATTER" : "AT BAT"}</Text>
          <Text style={styles.personName} numberOfLines={1}>{state.batter?.name ?? "Awaiting batter"}</Text>
          {batterStat ? <Text style={styles.personSub} numberOfLines={1}>{batterStat}</Text> : null}
        </View>
      </View>
      <View style={styles.countBox}>
        <Text style={styles.countValue}>{state.balls ?? "–"}–{state.strikes ?? "–"}</Text>
        <Text style={styles.countLabel}>{isFinal ? "FINAL COUNT" : "COUNT"}</Text>
      </View>
      <View style={[styles.person, styles.personRight]}>
        <AthleteFace athlete={state.pitcher} />
        <View style={[styles.personCopy, styles.personCopyRight]}>
          <Text style={styles.personLabel}>PITCHING</Text>
          <Text style={[styles.personName, styles.textRight]} numberOfLines={1}>{state.pitcher?.name ?? "Awaiting pitcher"}</Text>
          {pitcherStat ? <Text style={[styles.personSub, styles.textRight]} numberOfLines={1}>{pitcherStat}</Text> : null}
        </View>
      </View>
    </View>
  );
}

function PlayRows({
  plays,
  selectedPlayId,
  onSelectPlay,
  limit,
}: {
  plays: BaseballPlayState[];
  selectedPlayId: string | null;
  onSelectPlay: (playId: string) => void;
  limit?: number;
}) {
  const visible = [...plays].reverse().slice(0, limit ?? plays.length);
  if (visible.length === 0) return <EmptyState icon="list-outline" title="No plays yet" detail="Verified play-by-play will appear here when the official feed begins." />;

  return (
    <View>
      {visible.map((play, index) => (
        <PlayRow
          key={play.id}
          play={play}
          selected={play.id === selectedPlayId}
          last={index === visible.length - 1}
          onSelectPlay={onSelectPlay}
        />
      ))}
    </View>
  );
}

function playInningLabel(play: BaseballPlayState): string {
  if (play.inning == null) return "GAME";
  return `${play.inningHalf === "bottom" ? "BOT" : "TOP"} ${play.inning}`;
}

const PlayRow = React.memo(function PlayRow({
  play,
  selected,
  last,
  onSelectPlay,
}: {
  play: BaseballPlayState;
  selected: boolean;
  last: boolean;
  onSelectPlay: (playId: string) => void;
}) {
  const inning = playInningLabel(play);
  const handlePress = useCallback(() => onSelectPlay(play.id), [onSelectPlay, play.id]);

  return (
    <Pressable
      onPress={handlePress}
      style={[styles.playRow, selected && styles.playRowSelected, last && styles.lastRow]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${inning}. ${play.text}`}
      {...WEB_PRESS_PROPS}
    >
      <View style={styles.playRail}>
        <Ionicons
          name={selected ? "radio-button-on" : "ellipse"}
          size={selected ? 18 : 9}
          color={selected ? C.accent : C.textTertiary}
        />
        {!last ? <View style={styles.playRailLine} /> : null}
      </View>
      <Text style={[styles.playInning, selected && styles.playInningActive]}>{inning}</Text>
      <View style={styles.playCopy}>
        <Text style={[styles.playText, selected && styles.playTextActive]}>{play.text}</Text>
        <Text style={styles.playMeta}>
          {play.balls ?? "–"}–{play.strikes ?? "–"} · {play.outs ?? "–"} out{play.outs === 1 ? "" : "s"}
        </Text>
      </View>
      <Text style={styles.playScore}>{play.awayScore ?? "–"}–{play.homeScore ?? "–"}</Text>
    </Pressable>
  );
});

function TeamComparison({ data }: { data: GameDetail }) {
  const lineScore = data.baseballGamecast?.lineScore;
  const rows = [
    { label: "HITS", away: lineScore?.away.hits, home: lineScore?.home.hits },
    { label: "ERRORS", away: lineScore?.away.errors, home: lineScore?.home.errors },
    { label: "RUNNERS LEFT ON", away: lineScore?.away.leftOnBase, home: lineScore?.home.leftOnBase },
  ].filter((row) => row.away != null || row.home != null);

  if (rows.length === 0) return null;
  return (
    <View style={styles.sectionBlock}>
      <Text style={styles.eyebrow}>TEAM COMPARISON</Text>
      <View style={styles.comparisonHeader}>
        <View style={styles.comparisonTeam}>
          <TeamMark uri={data.game.awayTeamLogo} name={data.game.awayTeam} size={26} />
          <Text style={styles.comparisonTeamName}>{data.game.awayAbbreviation ?? lastName(data.game.awayTeam)}</Text>
        </View>
        <View style={[styles.comparisonTeam, styles.comparisonTeamRight]}>
          <Text style={[styles.comparisonTeamName, styles.textRight]}>{data.game.homeAbbreviation ?? lastName(data.game.homeTeam)}</Text>
          <TeamMark uri={data.game.homeTeamLogo} name={data.game.homeTeam} size={26} />
        </View>
      </View>
      {rows.map((row) => (
        <View key={row.label} style={styles.comparisonRow}>
          <Text style={styles.comparisonValue}>{row.away ?? "–"}</Text>
          <Text style={styles.comparisonLabel}>{row.label}</Text>
          <Text style={[styles.comparisonValue, styles.textRight]}>{row.home ?? "–"}</Text>
        </View>
      ))}
    </View>
  );
}

function inningOrdinal(n: number): string {
  const j = n % 10;
  const k = n % 100;
  if (j === 1 && k !== 11) return `${n}st`;
  if (j === 2 && k !== 12) return `${n}nd`;
  if (j === 3 && k !== 13) return `${n}rd`;
  return `${n}th`;
}

// Deterministic STORY headline derived only from verified score, inning, outs,
// and status. No render-time generative model, no invented facts.
function storyHeadline(data: GameDetail): string {
  const g = data.game;
  const away = lastName(g.awayTeam);
  const home = lastName(g.homeTeam);
  const as = g.awayScore;
  const hs = g.homeScore;

  if (g.status === "finished") {
    if (as == null || hs == null) return `${away} and ${home} have wrapped up at ${g.venue ?? "the ballpark"}.`;
    if (as === hs) return `${away} and ${home} finished tied ${as}–${hs}.`;
    const winner = as > hs ? away : home;
    const loser = as > hs ? home : away;
    const high = Math.max(as, hs);
    const low = Math.min(as, hs);
    const margin = high - low;
    const flavor = margin === 1 ? " in a one-run game" : margin >= 6 ? " in a runaway" : "";
    return `${winner} beat ${loser} ${high}–${low}${flavor}.`;
  }

  if (g.status === "live") {
    const sit = data.baseballGamecast?.situation;
    const inning = sit?.inning ?? null;
    const half = sit?.inningHalf === "bottom" ? "bottom" : "top";
    const outs = sit?.outs;
    const frame = inning ? `${half} of the ${inningOrdinal(inning)}` : "underway";
    const outsText = outs != null ? `, ${outs} out${outs === 1 ? "" : "s"}` : "";
    if (as == null || hs == null) return `${away} and ${home} are ${frame}${outsText}.`;
    if (as === hs) return `Tied ${as}–${hs} in the ${frame}${outsText} — the next swing matters.`;
    const leader = as > hs ? away : home;
    const high = Math.max(as, hs);
    const low = Math.min(as, hs);
    return `${leader} lead ${high}–${low} in the ${frame}${outsText}.`;
  }

  const firstPitch = formatFirstPitch(g.startTime);
  return `${away} visit ${home}${firstPitch ? ` — first pitch ${firstPitch}` : ""}.`;
}

// Deterministic scoring-swing summary from verified line-score inning totals.
function howWeGotHere(data: GameDetail): string | null {
  const ls = data.baseballGamecast?.lineScore;
  if (!ls) return null;
  const away = lastName(data.game.awayTeam);
  const home = lastName(data.game.homeTeam);
  const bigInning = (innings: Array<number | null>) => {
    let runs = 0;
    let idx = -1;
    innings.forEach((value, i) => {
      if (value != null && value > runs) { runs = value; idx = i; }
    });
    return { runs, inning: idx + 1 };
  };
  const a = bigInning(ls.away.innings);
  const h = bigInning(ls.home.innings);
  const parts: string[] = [];
  if (h.runs >= 2) parts.push(`${home} pushed ${h.runs} across in the ${inningOrdinal(h.inning)}`);
  if (a.runs >= 2) parts.push(`${away} answered with ${a.runs} in the ${inningOrdinal(a.inning)}`);
  if (parts.length === 0) return null;
  return `${parts.join(", ")}.`;
}

function StoryHeadline({ data }: { data: GameDetail }) {
  const eyebrow = data.game.status === "finished" ? "FINAL"
    : data.game.status === "live" ? "THE GAME RIGHT NOW"
    : "COMING UP";
  return (
    <View style={styles.storyTop}>
      <Text style={styles.over}>{eyebrow}</Text>
      <Text style={styles.hero}>{storyHeadline(data)}</Text>
      <Text style={styles.support}>The field above stays the live source. This room explains the game without replacing it.</Text>
    </View>
  );
}

// v9 mockup .breath narrative card — deterministic scoring-swing summary.
function Breath({ data }: { data: GameDetail }) {
  const text = howWeGotHere(data);
  if (!text) return null;
  return (
    <View style={styles.breath}>
      <Text style={styles.breathText}>{text}</Text>
      <Text style={styles.breathNote}>Built from the verified line score and scoring by inning.</Text>
    </View>
  );
}

// STORY (v9): headline → matchup card → line score → "how we got here" card.
function Overview(props: BaseballGameHubProps) {
  return (
    <>
      <StoryHeadline data={props.data} />
      <Matchup data={props.data} state={props.visibleState} />
      <LineScore data={props.data} />
      <Breath data={props.data} />
    </>
  );
}

function CompletePlayFeed(props: BaseballGameHubProps) {
  const plays = props.data.baseballGamecast?.plays
    ?? props.data.baseballGamecast?.recentPlays
    ?? [];
  const sections = useMemo(() => {
    const grouped: Array<{ title: string; data: BaseballPlayState[] }> = [];
    for (const play of [...plays].reverse()) {
      const title = playInningLabel(play);
      const current = grouped[grouped.length - 1];
      if (current?.title === title) current.data.push(play);
      else grouped.push({ title, data: [play] });
    }
    return grouped;
  }, [plays]);
  const renderItem = useCallback(({
    item,
    index,
    section,
  }: {
    item: BaseballPlayState;
    index: number;
    section: { data: BaseballPlayState[] };
  }) => (
    <PlayRow
      play={item}
      selected={item.id === props.selectedPlayId}
      last={index === section.data.length - 1}
      onSelectPlay={props.onSelectPlay}
    />
  ), [props.onSelectPlay, props.selectedPlayId]);

  return (
    <SectionList
      style={styles.content}
      contentContainerStyle={styles.completeFeedContent}
      sections={sections}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      renderSectionHeader={({ section }) => (
        <View style={styles.playSectionHeader}>
          <Text style={styles.playSectionTitle}>{section.title}</Text>
        </View>
      )}
      ListHeaderComponent={(
        <View style={styles.completeFeedHeader}>
          <View>
            <Text style={styles.eyebrow}>VERIFIED PLAY FEED</Text>
            <Text style={styles.sectionSubhead}>{plays.length} official events · tap any play to replay its field state.</Text>
          </View>
          <Pressable onPress={props.onReturnLive} style={styles.returnLive} accessibilityRole="button" accessibilityLabel="Return to live play" {...WEB_PRESS_PROPS}>
            <Ionicons name="radio-button-on" size={13} color={C.live} />
            <Text style={styles.returnLiveText}>LIVE</Text>
          </Pressable>
        </View>
      )}
      ListEmptyComponent={<EmptyState icon="list-outline" title="No plays yet" detail="Verified play-by-play will appear here when the official feed begins." />}
      showsVerticalScrollIndicator={false}
      stickySectionHeadersEnabled
      nestedScrollEnabled
      initialNumToRender={14}
      maxToRenderPerBatch={12}
      windowSize={7}
      scrollEnabled={props.expanded}
      pointerEvents={props.expanded ? "auto" : "none"}
    />
  );
}

type TeamSide = "away" | "home";

function SmallFace({ name, size = 33 }: { name: string; size?: number }) {
  return (
    <View style={[styles.smallFace, { width: size, height: size }]}>
      <Text style={styles.smallFaceInitial}>{name.charAt(0)}</Text>
    </View>
  );
}

// v9 mockup team switch used by BOX + LINEUP.
function TeamSwitch({ data, side, onSide }: { data: GameDetail; side: TeamSide; onSide: (s: TeamSide) => void }) {
  const opt = (s: TeamSide, name: string, logo: string | null) => (
    <Pressable
      onPress={() => onSide(s)}
      style={[styles.teamOption, side === s && styles.teamOptionOn]}
      accessibilityRole="button"
      accessibilityState={{ selected: side === s }}
      {...WEB_PRESS_PROPS}
    >
      <TeamMark uri={logo} name={name} size={20} />
      <Text style={[styles.teamOptionText, side === s && styles.teamOptionTextOn]} numberOfLines={1}>{name}</Text>
    </Pressable>
  );
  return (
    <View style={styles.teamSwitch}>
      {opt("away", lastName(data.game.awayTeam), data.game.awayTeamLogo)}
      {opt("home", lastName(data.game.homeTeam), data.game.homeTeamLogo)}
    </View>
  );
}

const BOX_BAT_COLS = ["H-AB", "R", "RBI", "HR", "BB", "K"];
const BOX_PITCH_COLS = ["IP", "H", "R", "ER", "BB", "K"];

function impactBatter(players: PlayerStatLine[]): PlayerStatLine | null {
  const score = (p: PlayerStatLine) =>
    (Number(p.stats["HR"]) || 0) * 3 + (Number(p.stats["RBI"]) || 0) * 2 + (Number(p.stats["R"]) || 0);
  const ranked = players.filter((p) => p.stats.role !== "P" && score(p) > 0).sort((a, b) => score(b) - score(a));
  return ranked[0] ?? null;
}

function impactLine(p: PlayerStatLine): string {
  const hr = Number(p.stats["HR"]) || 0;
  const rbi = Number(p.stats["RBI"]) || 0;
  const parts: string[] = [];
  if (hr > 0) parts.push(`${hr} home run${hr === 1 ? "" : "s"}`);
  if (rbi > 0) parts.push(`${rbi} driven in`);
  return parts.length ? `${parts.join(". ")}.` : "A key bat in today's lineup.";
}

// BOX (v9): team switch → impact bat card → batting/pitching pills → table.
function BoxScore({ data }: { data: GameDetail }) {
  const [side, setSide] = useState<TeamSide>("home");
  const [mode, setMode] = useState<"batting" | "pitching">("batting");
  const isFinal = data.game.status === "finished";
  const players = (side === "away" ? data.awayPlayerStats : data.homePlayerStats) ?? [];
  const abbr = (side === "away" ? data.game.awayAbbreviation : data.game.homeAbbreviation)
    ?? lastName(side === "away" ? data.game.awayTeam : data.game.homeTeam);
  const impact = impactBatter(players);
  const rows = players.filter((p) => (mode === "batting" ? p.stats.role !== "P" : p.stats.role === "P"));
  const cols = (mode === "batting" ? BOX_BAT_COLS : BOX_PITCH_COLS).filter((c) => rows.some((p) => p.stats[c] != null));

  return (
    <>
      <SectionHead title="Box score" meta={isFinal ? "FINAL LINES" : "LIVE LINES"} />
      <TeamSwitch data={data} side={side} onSide={setSide} />
      {impact ? (
        <View style={styles.impact}>
          <Text style={styles.impactEyebrow}>IMPACT BAT · {abbr.toUpperCase()}</Text>
          <Text style={styles.impactName}>{impact.name}</Text>
          <Text style={styles.impactDesc}>{impactLine(impact)}</Text>
          <View style={styles.impactStats}>
            <View><Text style={styles.impactStatValue}>{impact.stats["H-AB"] ?? "–"}</Text><Text style={styles.impactStatLabel}>H–AB</Text></View>
            <View><Text style={styles.impactStatValue}>{impact.stats["HR"] ?? "0"}</Text><Text style={styles.impactStatLabel}>HR</Text></View>
            <View><Text style={styles.impactStatValue}>{impact.stats["RBI"] ?? "0"}</Text><Text style={styles.impactStatLabel}>RBI</Text></View>
          </View>
        </View>
      ) : null}
      <View style={styles.mode}>
        {(["batting", "pitching"] as const).map((m) => (
          <Pressable key={m} onPress={() => setMode(m)} style={[styles.modePill, mode === m && styles.modePillOn]} accessibilityRole="button" accessibilityState={{ selected: mode === m }} {...WEB_PRESS_PROPS}>
            <Text style={[styles.modePillText, mode === m && styles.modePillTextOn]}>{m.toUpperCase()}</Text>
          </Pressable>
        ))}
      </View>
      {rows.length > 0 && cols.length > 0 ? (
        <View>
          <View style={styles.tableHead}>
            <Text style={[styles.tableHeadCell, styles.tableHeadPlayer]}>PLAYER</Text>
            {cols.map((c) => <Text key={c} style={styles.tableHeadCell}>{c}</Text>)}
          </View>
          {rows.map((p) => (
            <View key={p.name} style={styles.boxRow}>
              <View style={styles.boxPlayer}>
                <SmallFace name={p.name} />
                <View style={styles.flexMin}>
                  <Text style={styles.boxPlayerName} numberOfLines={1}>{p.name}</Text>
                  <Text style={styles.boxPlayerRole}>{p.starter ? "STARTER" : "SUB"}</Text>
                </View>
              </View>
              {cols.map((c) => {
                const hot = (c === "HR" || c === "RBI") && (Number(p.stats[c]) || 0) > 0;
                return <Text key={c} style={[styles.boxCell, hot && styles.hot]}>{p.stats[c] ?? "–"}</Text>;
              })}
            </View>
          ))}
        </View>
      ) : (
        <EmptyState icon="grid-outline" title="Box score is updating" detail="Official player lines have not been published for this game yet." />
      )}
    </>
  );
}

function formatFirstPitch(startTime?: string | null): string | null {
  if (!startTime) return null;
  const date = new Date(startTime);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

// DETAILS: factual game info that does not belong in Story, Plays, Box, or
// Lineup. Every optional field (venue, team stats, first pitch) is omitted when
// unavailable — no placeholder attendance/weather/broadcast is ever invented.
function SectionHead({ title, meta }: { title: string; meta: string }) {
  return (
    <View style={styles.sectionHead}>
      <Text style={styles.sectionHeadTitle}>{title}</Text>
      <Text style={styles.sectionHeadMeta}>{meta}</Text>
    </View>
  );
}

// Parse a team-total stat ("12", 12, "—") to a number, or null when absent.
function toStatNum(v: string | number | undefined | null): number | null {
  if (v == null || v === "—" || v === "–") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function CompareRow({ label, away, home }: { label: string; away?: number | null; home?: number | null }) {
  if (away == null && home == null) return null;
  return (
    <View style={styles.compareRow}>
      <Text style={styles.compareValue}>{away ?? "–"}</Text>
      <Text style={styles.compareLabel}>{label}</Text>
      <Text style={styles.compareValue}>{home ?? "–"}</Text>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

// DETAILS (v9): section head, venue card, team comparison, game information.
// Optional fields omitted when unsourced — no placeholder metrics.
function GameDetails({ data }: { data: GameDetail }) {
  const g = data.game;
  const ls = data.baseballGamecast?.lineScore;
  // Team batting totals (folded in from the retired flat "Stats" tab).
  const hs = data.homeStats ?? {};
  const as = data.awayStats ?? {};
  const firstPitch = formatFirstPitch(g.startTime);
  const statusText = g.status === "finished" ? "FINAL" : g.status === "live" ? "LIVE" : "SCHEDULED";
  const resultText = g.awayScore != null && g.homeScore != null
    ? `${lastName(g.homeTeam)} ${g.homeScore}, ${lastName(g.awayTeam)} ${g.awayScore}`
    : g.status === "finished" ? "Final" : "In progress";
  const eventCount = data.baseballGamecast?.plays?.length ?? 0;

  return (
    <>
      <SectionHead title="Game details" meta={`${(g.league ?? "MLB").toUpperCase()} · ${statusText}`} />
      {g.venue ? (() => {
        const parkImage = resolveBallparkImage(g.venue);
        // Real bundled ballpark photo when we have one; otherwise the drawn
        // diamond motif (never a broken image).
        return parkImage ? (
          <View style={styles.venuePhotoWrap}>
            <Image source={parkImage} style={styles.venuePhoto} resizeMode="cover" />
            <LinearGradient
              colors={["transparent", "rgba(6,10,9,0.4)", "rgba(6,10,9,0.9)"]}
              locations={[0, 0.55, 1]}
              style={styles.venuePhotoScrim}
            />
            <View style={styles.venuePhotoText}>
              <Text style={styles.venueEyebrow}>THE BALLPARK</Text>
              <Text style={styles.venuePhotoName}>{g.venue}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.venue}>
            <View style={styles.venueDiamond} />
            <View style={styles.venueCopy}>
              <Text style={styles.venueEyebrow}>THE BALLPARK</Text>
              <Text style={styles.venueName}>{g.venue}</Text>
            </View>
          </View>
        );
      })() : null}
      <Text style={styles.over}>TEAM COMPARISON</Text>
      <View style={styles.compareHead}>
        <Text style={styles.compareTeam}>{g.awayAbbreviation ?? lastName(g.awayTeam)}</Text>
        <View style={styles.compareLabel} />
        <Text style={[styles.compareTeam, styles.textRight]}>{g.homeAbbreviation ?? lastName(g.homeTeam)}</Text>
      </View>
      <CompareRow label="HITS" away={ls?.away.hits} home={ls?.home.hits} />
      <CompareRow label="RUNS" away={toStatNum(as["R"])} home={toStatNum(hs["R"])} />
      <CompareRow label="HOME RUNS" away={toStatNum(as["HR"])} home={toStatNum(hs["HR"])} />
      <CompareRow label="RBI" away={toStatNum(as["RBI"])} home={toStatNum(hs["RBI"])} />
      <CompareRow label="WALKS" away={toStatNum(as["BB"])} home={toStatNum(hs["BB"])} />
      <CompareRow label="STRIKEOUTS" away={toStatNum(as["K"])} home={toStatNum(hs["K"])} />
      <CompareRow label="ERRORS" away={ls?.away.errors} home={ls?.home.errors} />
      <CompareRow label="RUNNERS LEFT ON" away={ls?.away.leftOnBase} home={ls?.home.leftOnBase} />
      <View style={styles.infoBlock}>
        <Text style={styles.over}>GAME INFORMATION</Text>
        {firstPitch ? <InfoRow label="First pitch" value={firstPitch} /> : null}
        <InfoRow label="League" value="Major League Baseball" />
        <InfoRow label="Result" value={resultText} />
        <InfoRow label="Verified feed" value={eventCount > 0 ? `${eventCount} events` : "Updating"} />
      </View>
    </>
  );
}

// LINEUP (v9): team switch → team brand → batting order rows with today's line.
function Lineups({ data }: { data: GameDetail }) {
  const [side, setSide] = useState<TeamSide>("away");
  const isFinal = data.game.status === "finished";
  const players = (side === "away" ? data.awayPlayerStats : data.homePlayerStats) ?? [];
  const fallback = (side === "away" ? data.awayLineup : data.homeLineup) ?? [];
  const teamName = side === "away" ? data.game.awayTeam : data.game.homeTeam;
  const teamLogo = side === "away" ? data.game.awayTeamLogo : data.game.homeTeamLogo;
  const batters = players.filter((p) => p.stats.role !== "P");
  const rows: PlayerStatLine[] = batters.length > 0
    ? batters
    : fallback.map((name) => ({ name, starter: true, stats: {} }));

  return (
    <>
      <SectionHead title="Batting order" meta={isFinal ? "FINAL LINEUP" : "LIVE LINEUP"} />
      <TeamSwitch data={data} side={side} onSide={setSide} />
      <View style={styles.lineupBrand}>
        <TeamMark uri={teamLogo} name={teamName} size={34} />
        <View style={styles.flexMin}>
          <Text style={styles.lineupBrandName} numberOfLines={1}>{teamName}</Text>
          <Text style={styles.lineupBrandSub}>{side === "away" ? "Away order" : "Home order"}</Text>
        </View>
      </View>
      {rows.length > 0 ? rows.map((player, index) => (
        <View key={`${side}-${player.name}-${index}`} style={styles.lineupRow}>
          <Text style={styles.lineupOrder}>{index + 1}</Text>
          <SmallFace name={player.name} size={34} />
          <View style={styles.flexMin}>
            <Text style={styles.lineupName} numberOfLines={1}>{player.name}</Text>
            <Text style={styles.lineupRole}>{player.stats.role ? player.stats.role : player.starter ? "STARTER" : "SUB"}</Text>
          </View>
          <Text style={styles.lineupToday}>{player.stats["H-AB"] ?? "—"}</Text>
        </View>
      )) : (
        <EmptyState icon="people-outline" title="Lineup unavailable" detail="The official batting order has not been published yet." />
      )}
    </>
  );
}

export function BaseballGameHub(props: BaseballGameHubProps) {
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (props.expanded) {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }
  }, [props.expanded, props.section]);

  let content: React.ReactNode;
  if (props.section === "overview") content = <Overview {...props} />;
  else if (props.section === "plays") content = null;
  else if (props.section === "box") content = <BoxScore data={props.data} />;
  else if (props.section === "lineups") content = <Lineups data={props.data} />;
  else content = <GameDetails data={props.data} />;

  return (
    <View
      style={[styles.root, !props.expanded && styles.rootCollapsed]}
      accessibilityElementsHidden={!props.expanded}
      importantForAccessibility={props.expanded ? "auto" : "no-hide-descendants"}
    >
      <HubTabs section={props.section} onSectionChange={props.onSectionChange} />
      {props.section === "plays" ? <CompletePlayFeed {...props} /> : (
      <ScrollView
        ref={scrollRef}
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
        scrollEnabled={props.expanded}
        pointerEvents={props.expanded ? "auto" : "none"}
      >
        {content}
      </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#15212C" },
  rootCollapsed: { display: "none" },
  content: { flex: 1 },
  contentContainer: { paddingHorizontal: 16, paddingBottom: 48 },
  completeFeedContent: { paddingHorizontal: 16, paddingBottom: 48 },
  completeFeedHeader: { minHeight: 76, paddingVertical: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  playSectionHeader: { marginHorizontal: -16, paddingHorizontal: 16, paddingVertical: 7, backgroundColor: "#111C26", borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: C.separator },
  playSectionTitle: { color: C.accent, fontFamily: FONTS.bodyHeavy, fontSize: 10, letterSpacing: 0.5 },
  // v9 mockup dock: pill segmented control, active tab is a filled amber pill.
  tabs: {
    flexDirection: "row",
    gap: 4,
    marginHorizontal: 12,
    marginTop: 8,
    marginBottom: 6,
    padding: 5,
    borderRadius: 17,
    borderCurve: "continuous",
    backgroundColor: "rgba(5,10,14,0.48)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  tab: { flex: 1, height: 34, alignItems: "center", justifyContent: "center", borderRadius: 12, borderCurve: "continuous" },
  tabActive: { backgroundColor: C.accent },
  tabText: { color: "#8998A3", fontFamily: FONTS.bodyHeavy, fontSize: 10, letterSpacing: 0.2 },
  tabTextActive: { color: "#111820" },
  sectionBlock: { paddingVertical: 18, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(244,238,229,0.15)" },
  eyebrow: { color: C.textSecondary, fontFamily: FONTS.bodyHeavy, fontSize: 12, letterSpacing: 0.7 },
  sectionSubhead: { color: C.textTertiary, fontFamily: FONTS.bodyMedium, fontSize: 11, marginTop: 3 },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  teamFallback: { alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: C.separator },
  teamFallbackText: { color: C.textSecondary, fontFamily: FONTS.bodyHeavy, fontSize: 12 },
  emptyState: { minHeight: 130, alignItems: "center", justifyContent: "center", paddingHorizontal: 28, gap: 6 },
  emptyTitle: { color: C.text, fontFamily: FONTS.bodyBold, fontSize: 14, textAlign: "center" },
  emptyDetail: { color: C.textTertiary, fontFamily: FONTS.body, fontSize: 12, lineHeight: 18, textAlign: "center" },
  lineTable: { paddingTop: 10 },
  lineHeader: { flexDirection: "row", alignItems: "center", minWidth: 360, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.separator },
  lineHeaderCell: { width: 34, paddingVertical: 7, color: C.textTertiary, fontFamily: FONTS.bodyBold, fontSize: 9, textAlign: "center" },
  lineTeamHeader: { width: 90, textAlign: "left" },
  lineRow: { minWidth: 360, flexDirection: "row", alignItems: "center", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.separator },
  lineRowCompact: { minWidth: 352 },
  lineTeam: { width: 90, flexDirection: "row", alignItems: "center", gap: 7, paddingVertical: 8 },
  lineTeamCompact: { width: 82 },
  lineTeamText: { color: C.text, fontFamily: FONTS.bodyHeavy, fontSize: 12 },
  inningCell: { width: 34, color: C.text, fontFamily: FONTS.displayMedium, fontSize: 14, textAlign: "center" },
  totalCell: { width: 34, color: C.textSecondary, fontFamily: FONTS.display, fontSize: 15, textAlign: "center" },
  lineCellCompact: { width: 30 },
  totalCellAccent: { color: C.accent },
  matchup: { marginTop: 12, flexDirection: "row", alignItems: "center" },
  betweenInnings: { minHeight: 82, marginTop: 12, paddingVertical: 13, flexDirection: "row", alignItems: "center", gap: 12, borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: C.separator },
  betweenIcon: { width: 42, height: 42, borderRadius: 21, borderCurve: "continuous", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(242,166,90,0.12)" },
  betweenCopy: { flex: 1, gap: 3 },
  betweenTitle: { color: C.text, fontFamily: FONTS.bodyHeavy, fontSize: 15 },
  betweenDetail: { color: C.textTertiary, fontFamily: FONTS.bodyMedium, fontSize: 11, lineHeight: 16 },
  matchupSide: { flex: 1, alignItems: "flex-start" },
  matchupSideRight: { alignItems: "flex-end" },
  athletePortrait: { width: 78, height: 82, resizeMode: "cover", backgroundColor: C.card },
  athleteFallback: { width: 78, height: 82, alignItems: "center", justifyContent: "center", backgroundColor: C.card },
  athleteFallbackText: { color: C.textSecondary, fontFamily: FONTS.bodyHeavy, fontSize: 24 },
  matchupRole: { color: C.accent, fontFamily: FONTS.bodyBold, fontSize: 10, letterSpacing: 0.5, marginTop: 8 },
  matchupName: { maxWidth: 135, color: C.text, fontFamily: FONTS.bodyHeavy, fontSize: 17, lineHeight: 22 },
  matchupStat: { color: C.textTertiary, fontFamily: FONTS.bodyMedium, fontSize: 11, marginTop: 2 },
  matchupCenter: { width: 78, alignItems: "center", paddingTop: 12 },
  matchupCount: { color: C.text, fontFamily: FONTS.display, fontSize: 28 },
  matchupCountLabel: { color: C.textTertiary, fontFamily: FONTS.bodyBold, fontSize: 9, letterSpacing: 0.5 },
  matchupDivider: { width: 36, height: 1, backgroundColor: C.separator, marginVertical: 9 },
  matchupOuts: { color: C.textSecondary, fontFamily: FONTS.bodyBold, fontSize: 11 },
  textRight: { textAlign: "right" },
  playRow: { minHeight: 68, flexDirection: "row", alignItems: "flex-start", paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.separator },
  playRowSelected: { backgroundColor: "rgba(242,166,90,0.055)" },
  lastRow: { borderBottomWidth: 0 },
  playRail: { width: 24, alignItems: "center", paddingTop: 2, alignSelf: "stretch" },
  playRailLine: { width: 1, flex: 1, marginTop: 2, backgroundColor: C.separator },
  playInning: { width: 48, color: C.textTertiary, fontFamily: FONTS.bodyBold, fontSize: 10, paddingTop: 2 },
  playInningActive: { color: C.accent },
  playCopy: { flex: 1, paddingRight: 8 },
  playText: { color: C.textSecondary, fontFamily: SERIF, fontWeight: "700", fontSize: 14, lineHeight: 19 },
  playTextActive: { color: C.text },
  playMeta: { color: C.textTertiary, fontFamily: FONTS.mono, fontSize: 9, marginTop: 4 },
  playScore: { width: 34, color: C.textSecondary, fontFamily: FONTS.displayMedium, fontSize: 12, textAlign: "right", paddingTop: 2 },
  comparisonHeader: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 12 },
  comparisonTeam: { flexDirection: "row", alignItems: "center", gap: 8 },
  comparisonTeamRight: { justifyContent: "flex-end" },
  comparisonTeamName: { color: C.text, fontFamily: FONTS.bodyHeavy, fontSize: 12 },
  comparisonRow: { minHeight: 38, flexDirection: "row", alignItems: "center", borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.separator },
  comparisonValue: { width: 56, color: C.text, fontFamily: FONTS.display, fontSize: 20 },
  comparisonLabel: { flex: 1, color: C.textTertiary, fontFamily: FONTS.bodyBold, fontSize: 9, letterSpacing: 0.5, textAlign: "center" },
  returnLive: { minWidth: 62, minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, borderWidth: 1, borderColor: "rgba(57,229,140,0.35)" },
  returnLiveText: { color: C.live, fontFamily: FONTS.bodyBold, fontSize: 10, letterSpacing: 0.6 },
  teamSectionTitle: { flexDirection: "row", alignItems: "center", gap: 9, marginBottom: 12 },
  teamSectionName: { color: C.text, fontFamily: FONTS.bodyHeavy, fontSize: 18 },
  playerGroup: { marginTop: 12 },
  tableLabel: { color: C.accent, fontFamily: FONTS.bodyBold, fontSize: 9, letterSpacing: 0.6, marginBottom: 5 },
  playerHeaderRow: { flexDirection: "row", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.separator },
  playerHeader: { width: 42, paddingVertical: 7, color: C.textTertiary, fontFamily: FONTS.bodyBold, fontSize: 8, textAlign: "center" },
  playerRow: { flexDirection: "row", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.separator },
  playerNameCell: { width: 142, paddingVertical: 9, paddingRight: 8, color: C.text, fontFamily: FONTS.bodyMedium, fontSize: 11 },
  playerStat: { width: 42, paddingVertical: 9, color: C.textSecondary, fontFamily: FONTS.mono, fontSize: 10, textAlign: "center" },
  statsHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingBottom: 10 },
  statsTeam: { width: 80, color: C.text, fontFamily: FONTS.bodyHeavy, fontSize: 16 },
  statRow: { minHeight: 45, flexDirection: "row", alignItems: "center", borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.separator },
  statValue: { width: 78, color: C.text, fontFamily: FONTS.display, fontSize: 18 },
  statLabel: { flex: 1, color: C.textTertiary, fontFamily: FONTS.bodyBold, fontSize: 10, textAlign: "center", letterSpacing: 0.5 },
  lineupRow: { minHeight: 48, flexDirection: "row", alignItems: "center", gap: 9, paddingVertical: 4, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.separator },
  lineupOrder: { width: 22, color: "#768793", fontFamily: FONTS.display, fontSize: 12, textAlign: "center" },
  lineupName: { color: C.text, fontFamily: FONTS.bodyBold, fontSize: 12 },
  lineupRole: { color: "#7F8F9A", fontFamily: FONTS.bodyMedium, fontSize: 7, letterSpacing: 0.3, marginTop: 1 },
  storyHeadline: { color: C.text, fontFamily: FONTS.bodyHeavy, fontSize: 22, lineHeight: 28, marginTop: 6 },
  storyBody: { color: C.textSecondary, fontFamily: FONTS.bodyMedium, fontSize: 13, lineHeight: 19, marginTop: 6 },
  detailVenue: { color: C.text, fontFamily: FONTS.bodyBold, fontSize: 15, marginTop: 6 },
  detailRow: { minHeight: 42, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.separator },
  detailLabel: { color: C.textTertiary, fontFamily: FONTS.bodyBold, fontSize: 10, letterSpacing: 0.5 },
  detailValue: { maxWidth: "62%", color: C.text, fontFamily: FONTS.bodyMedium, fontSize: 13, textAlign: "right" },
  detailFreshness: { color: C.textTertiary, fontFamily: FONTS.bodyMedium, fontSize: 12, lineHeight: 18, marginTop: 6 },
  // ── STORY (v9 mockup) ──────────────────────────────────────────────
  storyTop: { paddingTop: 6, paddingBottom: 2 },
  over: { color: "#E99D63", fontFamily: FONTS.bodyHeavy, fontSize: 10, letterSpacing: 1.2, marginBottom: 8 },
  hero: { color: C.text, fontFamily: SERIF, fontWeight: "700", fontSize: 25, lineHeight: 30, letterSpacing: -0.4 },
  support: { color: "#94A2AC", fontFamily: FONTS.bodyMedium, fontSize: 11, lineHeight: 16, marginTop: 9 },
  match: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 18, paddingVertical: 15, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(244,238,229,0.12)" },
  person: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8, minWidth: 0 },
  personRight: { flexDirection: "row-reverse" },
  personCopy: { flex: 1, minWidth: 0 },
  personCopyRight: { alignItems: "flex-end" },
  personFace: { width: 46, height: 46, borderRadius: 15, borderCurve: "continuous", resizeMode: "cover", backgroundColor: C.card },
  personFaceFallback: { width: 46, height: 46, borderRadius: 15, borderCurve: "continuous", alignItems: "center", justifyContent: "center", backgroundColor: C.card },
  personFaceInitial: { color: C.textSecondary, fontFamily: FONTS.bodyHeavy, fontSize: 18 },
  personLabel: { color: "#E99D63", fontFamily: FONTS.bodyHeavy, fontSize: 8, letterSpacing: 0.5 },
  personName: { color: C.text, fontFamily: FONTS.bodyHeavy, fontSize: 13, marginTop: 2 },
  personSub: { color: "#82919B", fontFamily: FONTS.bodyMedium, fontSize: 9, marginTop: 2 },
  countBox: { width: 66, alignItems: "center" },
  countValue: { color: C.text, fontFamily: FONTS.display, fontSize: 24 },
  countLabel: { color: "#778792", fontFamily: FONTS.bodyBold, fontSize: 7, letterSpacing: 1, marginTop: 2 },
  breath: { marginTop: 17, padding: 15, borderRadius: 20, borderCurve: "continuous", backgroundColor: "rgba(242,166,90,0.10)", borderWidth: 1, borderColor: "rgba(242,166,90,0.18)" },
  breathText: { color: C.text, fontFamily: SERIF, fontWeight: "700", fontSize: 15, lineHeight: 21 },
  breathNote: { color: "#8E9CA6", fontFamily: FONTS.bodyMedium, fontSize: 9, marginTop: 7 },
  // ── shared section head + DETAILS (v9 mockup) ──────────────────────
  sectionHead: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginTop: 4, marginBottom: 15 },
  sectionHeadTitle: { color: C.text, fontFamily: FONTS.bodyHeavy, fontSize: 22, letterSpacing: -0.5 },
  sectionHeadMeta: { color: "#82919B", fontFamily: FONTS.bodyBold, fontSize: 8, letterSpacing: 0.5, marginBottom: 3 },
  venue: { height: 122, borderRadius: 22, borderCurve: "continuous", overflow: "hidden", backgroundColor: "#1E3431", borderWidth: 1, borderColor: "rgba(255,255,255,0.09)", marginBottom: 16, justifyContent: "flex-end" },
  venueDiamond: { position: "absolute", width: 70, height: 70, left: "50%", top: 22, marginLeft: -35, borderWidth: 1, borderColor: "rgba(249,226,194,0.4)", transform: [{ rotate: "45deg" }] },
  venueCopy: { padding: 14 },
  venueEyebrow: { color: "#EAA065", fontFamily: FONTS.bodyHeavy, fontSize: 8, letterSpacing: 0.5 },
  venueName: { color: C.text, fontFamily: FONTS.bodyHeavy, fontSize: 16, marginTop: 3 },
  venuePhotoWrap: { height: 150, borderRadius: 22, borderCurve: "continuous", overflow: "hidden", backgroundColor: "#1E3431", borderWidth: 1, borderColor: "rgba(255,255,255,0.09)", marginBottom: 16 },
  venuePhoto: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%" },
  venuePhotoScrim: { ...StyleSheet.absoluteFillObject },
  venuePhotoText: { position: "absolute", left: 0, right: 0, bottom: 0, padding: 14 },
  venuePhotoName: { color: "#fff", fontFamily: FONTS.bodyHeavy, fontSize: 18, marginTop: 3, textShadowColor: "rgba(0,0,0,0.5)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  compareHead: { flexDirection: "row", alignItems: "center", marginTop: 10, marginBottom: 2 },
  compareTeam: { flex: 1, color: C.text, fontFamily: FONTS.bodyHeavy, fontSize: 12 },
  compareRow: { flexDirection: "row", alignItems: "center", paddingVertical: 11, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "rgba(244,238,229,0.09)" },
  compareValue: { flex: 1, color: C.text, fontFamily: FONTS.display, fontSize: 18, textAlign: "center" },
  compareLabel: { flex: 1.25, color: "#7F909B", fontFamily: FONTS.bodyBold, fontSize: 8, letterSpacing: 0.5, textAlign: "center" },
  infoBlock: { marginTop: 18 },
  infoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 11, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(244,238,229,0.09)" },
  infoLabel: { color: "#80919C", fontFamily: FONTS.bodyMedium, fontSize: 12 },
  infoValue: { maxWidth: "60%", color: C.text, fontFamily: FONTS.bodyBold, fontSize: 12, textAlign: "right" },
  // ── BOX + LINEUP (v9 mockup) ───────────────────────────────────────
  flexMin: { flex: 1, minWidth: 0 },
  teamSwitch: { flexDirection: "row", gap: 5, padding: 5, borderRadius: 15, borderCurve: "continuous", backgroundColor: "rgba(4,9,13,0.42)", marginBottom: 15 },
  teamOption: { flex: 1, height: 38, borderRadius: 12, borderCurve: "continuous", flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 7 },
  teamOptionOn: { backgroundColor: "rgba(255,255,255,0.10)" },
  teamOptionText: { color: "#84939E", fontFamily: FONTS.bodyHeavy, fontSize: 10 },
  teamOptionTextOn: { color: C.text },
  smallFace: { borderRadius: 12, borderCurve: "continuous", alignItems: "center", justifyContent: "center", backgroundColor: "#293946" },
  smallFaceInitial: { color: C.textSecondary, fontFamily: FONTS.bodyHeavy, fontSize: 13 },
  impact: { minHeight: 128, borderRadius: 24, borderCurve: "continuous", padding: 16, overflow: "hidden", backgroundColor: "#20303C", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", marginBottom: 14 },
  impactEyebrow: { color: C.accent, fontFamily: FONTS.bodyHeavy, fontSize: 8, letterSpacing: 0.5 },
  impactName: { color: C.text, fontFamily: FONTS.bodyHeavy, fontSize: 20, marginTop: 7 },
  impactDesc: { color: "#9EABB4", fontFamily: FONTS.bodyMedium, fontSize: 10, marginTop: 3, maxWidth: 220 },
  impactStats: { flexDirection: "row", gap: 18, marginTop: 13 },
  impactStatValue: { color: C.text, fontFamily: FONTS.display, fontSize: 16 },
  impactStatLabel: { color: "#788994", fontFamily: FONTS.bodyBold, fontSize: 7, letterSpacing: 0.4, marginTop: 1 },
  mode: { flexDirection: "row", gap: 7, marginBottom: 10 },
  modePill: { paddingHorizontal: 11, paddingVertical: 7, borderRadius: 99, backgroundColor: "rgba(255,255,255,0.06)" },
  modePillOn: { backgroundColor: "rgba(242,166,90,0.16)" },
  modePillText: { color: "#7F8F99", fontFamily: FONTS.bodyHeavy, fontSize: 9, letterSpacing: 0.3 },
  modePillTextOn: { color: C.accent },
  tableHead: { flexDirection: "row", alignItems: "center", paddingBottom: 7 },
  tableHeadCell: { width: 34, color: "#6F818C", fontFamily: FONTS.bodyBold, fontSize: 8, textAlign: "center" },
  tableHeadPlayer: { flex: 1, textAlign: "left" },
  boxRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "rgba(244,238,229,0.08)" },
  boxPlayer: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8, minWidth: 0 },
  boxPlayerName: { color: C.text, fontFamily: FONTS.bodyBold, fontSize: 11 },
  boxPlayerRole: { color: "#7C8D98", fontFamily: FONTS.bodyMedium, fontSize: 7, marginTop: 1, letterSpacing: 0.3 },
  boxCell: { width: 34, color: C.textSecondary, fontFamily: FONTS.mono, fontSize: 11, textAlign: "center" },
  hot: { color: C.accent, fontFamily: FONTS.monoBold },
  lineupBrand: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 13 },
  lineupBrandName: { color: C.text, fontFamily: FONTS.bodyHeavy, fontSize: 15 },
  lineupBrandSub: { color: "#85949E", fontFamily: FONTS.bodyMedium, fontSize: 8, marginTop: 1 },
  lineupToday: { width: 44, color: C.text, fontFamily: FONTS.bodyBold, fontSize: 11, textAlign: "right" },
});
