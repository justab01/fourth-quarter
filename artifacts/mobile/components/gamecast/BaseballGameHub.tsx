import React, { useEffect, useRef } from "react";
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
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
  GameDetail,
  PlayerStatLine,
} from "@/utils/api";

const C = Colors.dark;
const WEB_PRESS_PROPS = Platform.OS === "web"
  ? { onMouseDown: (event: { preventDefault: () => void }) => event.preventDefault() }
  : {};

export type BaseballHubSection = "overview" | "plays" | "box" | "stats" | "lineups";

const SECTIONS: Array<{ key: BaseballHubSection; label: string }> = [
  { key: "overview", label: "OVERVIEW" },
  { key: "plays", label: "PLAYS" },
  { key: "box", label: "BOX" },
  { key: "stats", label: "STATS" },
  { key: "lineups", label: "LINEUPS" },
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

function Matchup({ data, state }: { data: GameDetail; state: BaseballSituation }) {
  const batterLine = findPlayer(data, state.batter);
  const pitcherLine = findPlayer(data, state.pitcher);
  const batterStat = batterLine?.stats["H-AB"] ?? batterLine?.stats["AVG"] ?? null;
  const pitcherStat = pitcherLine?.stats["IP"] ?? pitcherLine?.stats["K"] ?? null;

  if (!state.batter && !state.pitcher) {
    return (
      <View style={styles.sectionBlock}>
        <Text style={styles.eyebrow}>RIGHT NOW</Text>
        <View style={styles.betweenInnings}>
          <View style={styles.betweenIcon}>
            <Ionicons name="hourglass-outline" size={20} color={C.accent} />
          </View>
          <View style={styles.betweenCopy}>
            <Text style={styles.betweenTitle}>Between innings</Text>
            <Text style={styles.betweenDetail}>
              The next batter and pitcher will appear when the official feed confirms the matchup.
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.sectionBlock}>
      <Text style={styles.eyebrow}>RIGHT NOW</Text>
      <View style={styles.matchup}>
        <View style={styles.matchupSide}>
          <AthletePortrait athlete={state.batter} />
          <Text style={styles.matchupRole}>BATTING</Text>
          <Text style={styles.matchupName} numberOfLines={1}>{state.batter?.name ?? "Awaiting batter"}</Text>
          {batterStat ? <Text style={styles.matchupStat}>{batterStat}</Text> : null}
        </View>
        <View style={styles.matchupCenter}>
          <Text style={styles.matchupCount}>{state.balls ?? "–"}–{state.strikes ?? "–"}</Text>
          <Text style={styles.matchupCountLabel}>COUNT</Text>
          <View style={styles.matchupDivider} />
          <Text style={styles.matchupOuts}>{state.outs ?? "–"} OUT{state.outs === 1 ? "" : "S"}</Text>
        </View>
        <View style={[styles.matchupSide, styles.matchupSideRight]}>
          <AthletePortrait athlete={state.pitcher} />
          <Text style={styles.matchupRole}>PITCHING</Text>
          <Text style={[styles.matchupName, styles.textRight]} numberOfLines={1}>{state.pitcher?.name ?? "Awaiting pitcher"}</Text>
          {pitcherStat ? <Text style={[styles.matchupStat, styles.textRight]}>{pitcherStat}</Text> : null}
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
      {visible.map((play, index) => {
        const selected = play.id === selectedPlayId;
        const inning = play.inning != null
          ? `${play.inningHalf === "bottom" ? "BOT" : "TOP"} ${play.inning}`
          : "GAME";
        return (
          <Pressable
            key={play.id}
            onPress={() => onSelectPlay(play.id)}
            style={[styles.playRow, selected && styles.playRowSelected, index === visible.length - 1 && styles.lastRow]}
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
              {index < visible.length - 1 ? <View style={styles.playRailLine} /> : null}
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
      })}
    </View>
  );
}

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

function Overview(props: BaseballGameHubProps) {
  const plays = props.data.baseballGamecast?.recentPlays ?? [];
  return (
    <>
      <LineScore data={props.data} />
      <Matchup data={props.data} state={props.visibleState} />
      <View style={styles.sectionBlock}>
        <Text style={styles.eyebrow}>LATEST PLAYS</Text>
        <PlayRows plays={plays} selectedPlayId={props.selectedPlayId} onSelectPlay={props.onSelectPlay} limit={3} />
      </View>
      <TeamComparison data={props.data} />
    </>
  );
}

function Plays(props: BaseballGameHubProps) {
  const plays = props.data.baseballGamecast?.recentPlays ?? [];
  return (
    <View style={styles.sectionBlock}>
      <View style={styles.sectionTitleRow}>
        <View>
          <Text style={styles.eyebrow}>VERIFIED PLAY FEED</Text>
          <Text style={styles.sectionSubhead}>Tap any play to replay its field state.</Text>
        </View>
        <Pressable onPress={props.onReturnLive} style={styles.returnLive} accessibilityRole="button" accessibilityLabel="Return to live play" {...WEB_PRESS_PROPS}>
          <Ionicons name="radio-button-on" size={13} color={C.live} />
          <Text style={styles.returnLiveText}>LIVE</Text>
        </Pressable>
      </View>
      <PlayRows plays={plays} selectedPlayId={props.selectedPlayId} onSelectPlay={props.onSelectPlay} />
    </View>
  );
}

const BATTER_COLS = ["H-AB", "R", "H", "RBI", "HR", "BB", "K"];
const PITCHER_COLS = ["IP", "H", "R", "ER", "BB", "K"];

function PlayerTable({ team, logo, players }: { team: string; logo?: string | null; players: PlayerStatLine[] }) {
  const batters = players.filter((player) => player.stats.role !== "P");
  const pitchers = players.filter((player) => player.stats.role === "P");

  const table = (label: string, rows: PlayerStatLine[], wanted: string[]) => {
    const columns = wanted.filter((column) => rows.some((player) => player.stats[column] != null));
    if (rows.length === 0 || columns.length === 0) return null;
    return (
      <View style={styles.playerGroup}>
        <Text style={styles.tableLabel}>{label}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View>
            <View style={styles.playerHeaderRow}>
              <Text style={[styles.playerHeader, styles.playerNameCell]}>PLAYER</Text>
              {columns.map((column) => <Text key={column} style={styles.playerHeader}>{column}</Text>)}
            </View>
            {rows.map((player) => (
              <View key={`${label}-${player.name}`} style={styles.playerRow}>
                <Text style={styles.playerNameCell} numberOfLines={1}>{player.name}</Text>
                {columns.map((column) => <Text key={column} style={styles.playerStat}>{player.stats[column] ?? "–"}</Text>)}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={styles.sectionBlock}>
      <View style={styles.teamSectionTitle}>
        <TeamMark uri={logo} name={team} size={30} />
        <Text style={styles.teamSectionName}>{team}</Text>
      </View>
      {table("BATTING", batters, BATTER_COLS)}
      {table("PITCHING", pitchers, PITCHER_COLS)}
      {batters.length === 0 && pitchers.length === 0 ? (
        <EmptyState icon="grid-outline" title="Box score is updating" detail="Official player lines have not been published for this game yet." />
      ) : null}
    </View>
  );
}

function BoxScore({ data }: { data: GameDetail }) {
  return (
    <>
      <PlayerTable team={data.game.awayTeam} logo={data.game.awayTeamLogo} players={data.awayPlayerStats ?? []} />
      <PlayerTable team={data.game.homeTeam} logo={data.game.homeTeamLogo} players={data.homePlayerStats ?? []} />
    </>
  );
}

function Stats({ data }: { data: GameDetail }) {
  const keys = Array.from(new Set([...Object.keys(data.awayStats ?? {}), ...Object.keys(data.homeStats ?? {})]));
  if (keys.length === 0) return <EmptyState icon="stats-chart-outline" title="Team stats are updating" detail="Real game totals will appear when the official feed publishes them." />;
  return (
    <View style={styles.sectionBlock}>
      <View style={styles.statsHeader}>
        <Text style={styles.statsTeam}>{data.game.awayAbbreviation ?? lastName(data.game.awayTeam)}</Text>
        <Text style={styles.eyebrow}>TEAM STATS</Text>
        <Text style={[styles.statsTeam, styles.textRight]}>{data.game.homeAbbreviation ?? lastName(data.game.homeTeam)}</Text>
      </View>
      {keys.map((key) => (
        <View key={key} style={styles.statRow}>
          <Text style={styles.statValue}>{data.awayStats?.[key] ?? "–"}</Text>
          <Text style={styles.statLabel}>{key}</Text>
          <Text style={[styles.statValue, styles.textRight]}>{data.homeStats?.[key] ?? "–"}</Text>
        </View>
      ))}
    </View>
  );
}

function LineupTeam({ team, logo, players, fallback }: { team: string; logo?: string | null; players: PlayerStatLine[]; fallback: string[] }) {
  const rows: PlayerStatLine[] = players.length > 0
    ? players
    : fallback.map((name) => ({ name, starter: true, stats: {} }));
  return (
    <View style={styles.sectionBlock}>
      <View style={styles.teamSectionTitle}>
        <TeamMark uri={logo} name={team} size={30} />
        <Text style={styles.teamSectionName}>{team}</Text>
      </View>
      {rows.length > 0 ? rows.map((player, index) => (
        <View key={`${team}-${player.name}`} style={styles.lineupRow}>
          <Text style={styles.lineupOrder}>{index + 1}</Text>
          <Text style={styles.lineupName}>{player.name}</Text>
          {player.stats.role ? <Text style={styles.lineupRole}>{player.stats.role}</Text> : null}
        </View>
      )) : (
        <EmptyState icon="people-outline" title="Lineup unavailable" detail="The official batting order has not been published yet." />
      )}
    </View>
  );
}

function Lineups({ data }: { data: GameDetail }) {
  return (
    <>
      <LineupTeam team={data.game.awayTeam} logo={data.game.awayTeamLogo} players={data.awayPlayerStats ?? []} fallback={data.awayLineup ?? []} />
      <LineupTeam team={data.game.homeTeam} logo={data.game.homeTeamLogo} players={data.homePlayerStats ?? []} fallback={data.homeLineup ?? []} />
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
  else if (props.section === "plays") content = <Plays {...props} />;
  else if (props.section === "box") content = <BoxScore data={props.data} />;
  else if (props.section === "stats") content = <Stats data={props.data} />;
  else content = <Lineups data={props.data} />;

  return (
    <View
      style={[styles.root, !props.expanded && styles.rootCollapsed]}
      accessibilityElementsHidden={!props.expanded}
      importantForAccessibility={props.expanded ? "auto" : "no-hide-descendants"}
    >
      <HubTabs section={props.section} onSectionChange={props.onSectionChange} />
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#15212C" },
  rootCollapsed: { display: "none" },
  content: { flex: 1 },
  contentContainer: { paddingHorizontal: 16, paddingBottom: 48 },
  tabs: {
    height: 54,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "stretch",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(244,238,229,0.16)",
  },
  tab: { flex: 1, alignItems: "center", justifyContent: "center", borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabActive: { borderBottomColor: C.accent },
  tabText: { color: C.textTertiary, fontFamily: FONTS.displayMedium, fontSize: 11, letterSpacing: 0.5 },
  tabTextActive: { color: C.accent },
  sectionBlock: { paddingVertical: 18, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(244,238,229,0.15)" },
  eyebrow: { color: C.textSecondary, fontFamily: FONTS.displayMedium, fontSize: 12, letterSpacing: 1.1 },
  sectionSubhead: { color: C.textTertiary, fontFamily: FONTS.body, fontSize: 11, marginTop: 3 },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  teamFallback: { alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: C.separator },
  teamFallbackText: { color: C.textSecondary, fontFamily: FONTS.display, fontSize: 12 },
  emptyState: { minHeight: 130, alignItems: "center", justifyContent: "center", paddingHorizontal: 28, gap: 6 },
  emptyTitle: { color: C.text, fontFamily: FONTS.bodyBold, fontSize: 14, textAlign: "center" },
  emptyDetail: { color: C.textTertiary, fontFamily: FONTS.body, fontSize: 12, lineHeight: 18, textAlign: "center" },
  lineTable: { paddingTop: 10 },
  lineHeader: { flexDirection: "row", alignItems: "center", minWidth: 360, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.separator },
  lineHeaderCell: { width: 34, paddingVertical: 7, color: C.textTertiary, fontFamily: FONTS.displayMedium, fontSize: 10, textAlign: "center" },
  lineTeamHeader: { width: 90, textAlign: "left" },
  lineRow: { minWidth: 360, flexDirection: "row", alignItems: "center", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.separator },
  lineRowCompact: { minWidth: 352 },
  lineTeam: { width: 90, flexDirection: "row", alignItems: "center", gap: 7, paddingVertical: 8 },
  lineTeamCompact: { width: 82 },
  lineTeamText: { color: C.text, fontFamily: FONTS.displayMedium, fontSize: 13 },
  inningCell: { width: 34, color: C.text, fontFamily: FONTS.displayMedium, fontSize: 14, textAlign: "center" },
  totalCell: { width: 34, color: C.textSecondary, fontFamily: FONTS.display, fontSize: 15, textAlign: "center" },
  lineCellCompact: { width: 30 },
  totalCellAccent: { color: C.accent },
  matchup: { marginTop: 12, flexDirection: "row", alignItems: "center" },
  betweenInnings: { minHeight: 82, marginTop: 12, paddingVertical: 13, flexDirection: "row", alignItems: "center", gap: 12, borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: C.separator },
  betweenIcon: { width: 42, height: 42, borderRadius: 21, borderCurve: "continuous", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(242,166,90,0.12)" },
  betweenCopy: { flex: 1, gap: 3 },
  betweenTitle: { color: C.text, fontFamily: FONTS.displayMedium, fontSize: 16 },
  betweenDetail: { color: C.textTertiary, fontFamily: FONTS.bodyMedium, fontSize: 11, lineHeight: 16 },
  matchupSide: { flex: 1, alignItems: "flex-start" },
  matchupSideRight: { alignItems: "flex-end" },
  athletePortrait: { width: 78, height: 82, resizeMode: "cover", backgroundColor: C.card },
  athleteFallback: { width: 78, height: 82, alignItems: "center", justifyContent: "center", backgroundColor: C.card },
  athleteFallbackText: { color: C.textSecondary, fontFamily: FONTS.display, fontSize: 28 },
  matchupRole: { color: C.accent, fontFamily: FONTS.displayMedium, fontSize: 11, letterSpacing: 0.7, marginTop: 8 },
  matchupName: { maxWidth: 135, color: C.text, fontFamily: FONTS.display, fontSize: 18, lineHeight: 22 },
  matchupStat: { color: C.textTertiary, fontFamily: FONTS.displayMedium, fontSize: 12, marginTop: 2 },
  matchupCenter: { width: 78, alignItems: "center", paddingTop: 12 },
  matchupCount: { color: C.text, fontFamily: FONTS.display, fontSize: 28 },
  matchupCountLabel: { color: C.textTertiary, fontFamily: FONTS.displayMedium, fontSize: 9, letterSpacing: 0.7 },
  matchupDivider: { width: 36, height: 1, backgroundColor: C.separator, marginVertical: 9 },
  matchupOuts: { color: C.textSecondary, fontFamily: FONTS.displayMedium, fontSize: 13 },
  textRight: { textAlign: "right" },
  playRow: { minHeight: 68, flexDirection: "row", alignItems: "flex-start", paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.separator },
  playRowSelected: { backgroundColor: "rgba(242,166,90,0.055)" },
  lastRow: { borderBottomWidth: 0 },
  playRail: { width: 24, alignItems: "center", paddingTop: 2, alignSelf: "stretch" },
  playRailLine: { width: 1, flex: 1, marginTop: 2, backgroundColor: C.separator },
  playInning: { width: 48, color: C.textTertiary, fontFamily: FONTS.displayMedium, fontSize: 11, paddingTop: 2 },
  playInningActive: { color: C.accent },
  playCopy: { flex: 1, paddingRight: 8 },
  playText: { color: C.textSecondary, fontFamily: FONTS.bodyMedium, fontSize: 12, lineHeight: 17 },
  playTextActive: { color: C.text },
  playMeta: { color: C.textTertiary, fontFamily: FONTS.mono, fontSize: 9, marginTop: 4 },
  playScore: { width: 34, color: C.textSecondary, fontFamily: FONTS.displayMedium, fontSize: 12, textAlign: "right", paddingTop: 2 },
  comparisonHeader: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 12 },
  comparisonTeam: { flexDirection: "row", alignItems: "center", gap: 8 },
  comparisonTeamRight: { justifyContent: "flex-end" },
  comparisonTeamName: { color: C.text, fontFamily: FONTS.displayMedium, fontSize: 13 },
  comparisonRow: { minHeight: 38, flexDirection: "row", alignItems: "center", borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.separator },
  comparisonValue: { width: 56, color: C.text, fontFamily: FONTS.display, fontSize: 20 },
  comparisonLabel: { flex: 1, color: C.textTertiary, fontFamily: FONTS.displayMedium, fontSize: 10, letterSpacing: 0.8, textAlign: "center" },
  returnLive: { minWidth: 62, minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, borderWidth: 1, borderColor: "rgba(57,229,140,0.35)" },
  returnLiveText: { color: C.live, fontFamily: FONTS.bodyBold, fontSize: 10, letterSpacing: 0.6 },
  teamSectionTitle: { flexDirection: "row", alignItems: "center", gap: 9, marginBottom: 12 },
  teamSectionName: { color: C.text, fontFamily: FONTS.display, fontSize: 19 },
  playerGroup: { marginTop: 12 },
  tableLabel: { color: C.accent, fontFamily: FONTS.displayMedium, fontSize: 10, letterSpacing: 0.9, marginBottom: 5 },
  playerHeaderRow: { flexDirection: "row", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.separator },
  playerHeader: { width: 42, paddingVertical: 7, color: C.textTertiary, fontFamily: FONTS.displayMedium, fontSize: 9, textAlign: "center" },
  playerRow: { flexDirection: "row", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.separator },
  playerNameCell: { width: 142, paddingVertical: 9, paddingRight: 8, color: C.text, fontFamily: FONTS.bodyMedium, fontSize: 11 },
  playerStat: { width: 42, paddingVertical: 9, color: C.textSecondary, fontFamily: FONTS.mono, fontSize: 10, textAlign: "center" },
  statsHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingBottom: 10 },
  statsTeam: { width: 80, color: C.text, fontFamily: FONTS.display, fontSize: 17 },
  statRow: { minHeight: 45, flexDirection: "row", alignItems: "center", borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.separator },
  statValue: { width: 78, color: C.text, fontFamily: FONTS.display, fontSize: 18 },
  statLabel: { flex: 1, color: C.textTertiary, fontFamily: FONTS.bodyBold, fontSize: 10, textAlign: "center", letterSpacing: 0.5 },
  lineupRow: { minHeight: 45, flexDirection: "row", alignItems: "center", borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.separator },
  lineupOrder: { width: 32, color: C.accent, fontFamily: FONTS.displayMedium, fontSize: 13 },
  lineupName: { flex: 1, color: C.text, fontFamily: FONTS.bodyMedium, fontSize: 13 },
  lineupRole: { color: C.textTertiary, fontFamily: FONTS.displayMedium, fontSize: 10, letterSpacing: 0.5 },
});
