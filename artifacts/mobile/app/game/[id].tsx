import React, { useState, useRef } from "react";
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  Platform, ActivityIndicator, Image, Animated, Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useQuery } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { api, type PlayerStatLine } from "@/utils/api";
import { LEAGUE_COLORS } from "@/constants/sports";
import { goToTeam, goToPlayer } from "@/utils/navHelpers";
import { getEspnHeadshotUrl } from "@/constants/espnAthleteIds";
import { TeamLogo } from "@/components/GameCard";

const C = Colors.dark;
const { width: SCREEN_W } = Dimensions.get("window");

type GameTab = "gamecast" | "boxscore" | "playbyplay" | "stats" | "lineups";

const TABS: { key: GameTab; label: string; icon: string }[] = [
  { key: "gamecast",   label: "Gamecast",   icon: "tv-outline" },
  { key: "boxscore",   label: "Box Score",  icon: "grid-outline" },
  { key: "playbyplay", label: "Plays",      icon: "list-outline" },
  { key: "stats",      label: "Stats",      icon: "bar-chart-outline" },
  { key: "lineups",    label: "Lineups",    icon: "people-outline" },
];

const PLAYER_STAT_COLS: Record<string, string[]> = {
  NBA:   ["MIN", "PTS", "REB", "AST", "FG"],
  WNBA:  ["MIN", "PTS", "REB", "AST", "FG"],
  NCAAB: ["MIN", "PTS", "REB", "AST", "FG"],
  NFL:   ["YDS", "TD", "INT", "C/ATT"],
  NCAAF: ["YDS", "TD", "INT", "C/ATT"],
  MLB:   ["H-AB", "R", "RBI", "HR", "BB", "K"],
  MLS:   ["MIN", "G", "A", "SHT"],
  EPL:   ["MIN", "G", "A", "SHT"],
  UCL:   ["MIN", "G", "A", "SHT"],
  LIGA:  ["MIN", "G", "A", "SHT"],
  NHL:   ["G", "A", "PTS", "SOG", "TOI"],
};

function getSportVenueGradient(league: string): [string, string, string, string] {
  const map: Record<string, [string, string, string, string]> = {
    NBA:   ["#4A1A00", "#241000", "#100700", "#0F0F0F"],
    WNBA:  ["#5C1F00", "#2A0E00", "#140700", "#0F0F0F"],
    NCAAB: ["#001845", "#000E25", "#000710", "#0F0F0F"],
    NFL:   ["#071525", "#040D17", "#02080D", "#0F0F0F"],
    NCAAF: ["#1A1000", "#0D0800", "#060400", "#0F0F0F"],
    MLB:   ["#280808", "#140404", "#090202", "#0F0F0F"],
    MLS:   ["#051F0D", "#020F06", "#010703", "#0F0F0F"],
    EPL:   ["#1A0028", "#0D0014", "#06000A", "#0F0F0F"],
    UCL:   ["#001040", "#000820", "#000410", "#0F0F0F"],
    LIGA:  ["#280505", "#140202", "#090101", "#0F0F0F"],
    NHL:   ["#040E1C", "#020711", "#010408", "#0F0F0F"],
  };
  return map[league] ?? ["#100914", "#08040A", "#040205", "#0F0F0F"];
}

// ── Play type classification ───────────────────────────────────────────────────
type PlayType = "three" | "basket" | "freethrow" | "timeout" | "sub" | "foul" | "goal" | "default";

function classifyPlay(description: string): PlayType {
  const d = description.toLowerCase();
  if (d.includes("timeout")) return "timeout";
  if (d.includes("enters the game") || d.includes("substitution")) return "sub";
  if (d.includes("foul")) return "foul";
  if (d.includes("three point") || d.includes("3-point") || d.includes("26-foot") || d.includes("25-foot")) return "three";
  if (d.includes("free throw")) return "freethrow";
  if (d.includes("goal") || d.includes("scores")) return "goal";
  if (d.includes("shot") || d.includes("makes") || d.includes("dunk") || d.includes("layup")) return "basket";
  return "default";
}

function playIcon(type: PlayType): { name: string; color: string } {
  switch (type) {
    case "three":     return { name: "nuclear-outline",          color: "#EF7828" };
    case "basket":    return { name: "basketball-outline",       color: "#EF7828" };
    case "freethrow": return { name: "radio-button-on-outline",  color: "#AAAAAA" };
    case "timeout":   return { name: "time-outline",             color: "#FFD700" };
    case "sub":       return { name: "swap-horizontal-outline",  color: "#4A90D9" };
    case "foul":      return { name: "alert-circle-outline",     color: "#E8162B" };
    case "goal":      return { name: "football-outline",         color: "#30D158" };
    default:          return { name: "ellipse-outline",          color: C.textTertiary };
  }
}

function playBadge(type: PlayType, desc: string): string | null {
  if (type === "three") return "+3";
  if (type === "basket" && !desc.toLowerCase().includes("free")) return "+2";
  if (type === "goal") return "GOAL";
  return null;
}

export default function GameDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<GameTab>("gamecast");
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const { data, isLoading } = useQuery({
    queryKey: ["game", id],
    queryFn: () => api.getGameDetail(id ?? ""),
    enabled: !!id,
  });

  const game = data?.game;
  const rawColor = game ? (LEAGUE_COLORS[game.league] ?? C.accent) : C.accent;
  const dc =
    rawColor === "#013087" || rawColor === "#002D72" ? "#4A90D9"
    : rawColor === "#1A1A2E" ? "#4CAF50"
    : rawColor;

  const venueGrad = game ? getSportVenueGradient(game.league) : ["#0F0F0F", "#0F0F0F", "#0F0F0F", "#0F0F0F"] as [string,string,string,string];

  const isLive     = game?.status === "live";
  const isFinished = game?.status === "finished";
  const awayWin = isFinished && (game?.awayScore ?? 0) > (game?.homeScore ?? 0);
  const homeWin = isFinished && (game?.homeScore ?? 0) > (game?.awayScore ?? 0);

  return (
    <View style={[s.root, { paddingTop: topPad }]}>
      {/* ── Fixed top nav ──────────────────────────────────────────────────── */}
      <View style={s.nav}>
        <Pressable onPress={() => router.back()} style={s.navBack} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={C.text} />
        </Pressable>
        <Text style={s.navTitle} numberOfLines={1}>
          {game ? `${game.awayTeam} @ ${game.homeTeam}` : "Game Detail"}
        </Text>
        <View style={s.navRight}>
          <Ionicons name="share-outline" size={20} color={C.textSecondary} />
        </View>
      </View>

      {isLoading || !game ? (
        <View style={s.loading}>
          <ActivityIndicator size="large" color={dc} />
          <Text style={s.loadingText}>Loading game…</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} stickyHeaderIndices={[1]}>

          {/* ── Hero score section ─────────────────────────────────────────── */}
          <View>
            <LinearGradient colors={venueGrad} style={s.hero} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}>
              {/* League-color tint */}
              <LinearGradient
                colors={[`${dc}14`, "transparent", `${dc}08`]}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              />

              {/* Status pill */}
              <View style={[s.statusPill, { backgroundColor: `${dc}22`, borderColor: `${dc}44` }]}>
                <Text style={[s.statusLeague, { color: dc }]}>{game.league}</Text>
                {isLive && (
                  <>
                    <View style={s.liveDotPill} />
                    <Text style={s.liveLabel}>LIVE</Text>
                    <Text style={s.statusSep}>·</Text>
                    <Text style={s.statusExtra}>{game.quarter}{game.timeRemaining ? ` · ${game.timeRemaining}` : ""}</Text>
                  </>
                )}
                {isFinished && <Text style={s.statusExtra}> · FINAL</Text>}
                {!isLive && !isFinished && game.startTime && (
                  <Text style={s.statusExtra}> · {new Date(game.startTime).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</Text>
                )}
              </View>

              {/* Teams + score */}
              <View style={s.heroTeams}>
                {/* Away */}
                <Pressable style={s.heroTeamCol} onPress={() => goToTeam(game.awayTeam, game.league)} hitSlop={8}>
                  <TeamLogo uri={game.awayTeamLogo} name={game.awayTeam} size={96} borderColor={`${dc}55`} />
                  <Text style={[s.heroTeamName, awayWin && { color: dc }]} numberOfLines={2}>{game.awayTeam}</Text>
                  <Text style={s.heroTeamLabel}>AWAY</Text>
                </Pressable>

                {/* Score */}
                <View style={s.heroScoreBlock}>
                  {isLive || isFinished ? (
                    <>
                      <View style={s.heroScoreRow}>
                        <Text style={[s.heroScore, !awayWin && isFinished && s.heroScoreDim]}>{game.awayScore ?? 0}</Text>
                        <Text style={s.heroScoreSep}>:</Text>
                        <Text style={[s.heroScore, !homeWin && isFinished && s.heroScoreDim]}>{game.homeScore ?? 0}</Text>
                      </View>
                      {isLive && game.timeRemaining && (
                        <View style={[s.clockPill, { borderColor: `${dc}40` }]}>
                          <Text style={[s.clockText, { color: dc }]}>{game.timeRemaining}</Text>
                        </View>
                      )}
                    </>
                  ) : (
                    <Text style={s.vsText}>VS</Text>
                  )}
                  {game.venue && (
                    <Text style={s.venueText} numberOfLines={1}>{game.venue}</Text>
                  )}
                </View>

                {/* Home */}
                <Pressable style={[s.heroTeamCol, { alignItems: "flex-end" }]} onPress={() => goToTeam(game.homeTeam, game.league)} hitSlop={8}>
                  <TeamLogo uri={game.homeTeamLogo} name={game.homeTeam} size={96} borderColor={`${dc}55`} />
                  <Text style={[s.heroTeamName, { textAlign: "right" }, homeWin && { color: dc }]} numberOfLines={2}>{game.homeTeam}</Text>
                  <Text style={[s.heroTeamLabel, { textAlign: "right" }]}>HOME</Text>
                </Pressable>
              </View>

              {/* Watch live pill button */}
              {isLive && (
                <View style={[s.watchPill, { borderColor: `${dc}55`, backgroundColor: `${dc}18` }]}>
                  <Ionicons name="radio" size={13} color={dc} />
                  <Text style={[s.watchText, { color: dc }]}>Watch Live</Text>
                </View>
              )}
            </LinearGradient>
          </View>

          {/* ── Floating tab bar ───────────────────────────────────────────── */}
          <View style={s.tabBarWrap}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabBar}>
              {TABS.map(tab => {
                const active = activeTab === tab.key;
                return (
                  <Pressable key={tab.key} onPress={() => setActiveTab(tab.key)} style={[s.tab, active && { borderBottomColor: dc }]}>
                    <Ionicons name={tab.icon as any} size={14} color={active ? dc : C.textTertiary} />
                    <Text style={[s.tabLabel, active && { color: dc, fontWeight: "800" }]}>{tab.label}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* ── Tab content ────────────────────────────────────────────────── */}
          <View style={s.content}>

            {/* GAMECAST */}
            {activeTab === "gamecast" && (
              <GamecastTab data={data} game={game} dc={dc} />
            )}

            {/* BOX SCORE */}
            {activeTab === "boxscore" && (
              <View style={s.tabSection}>
                {(data.homePlayerStats?.length || data.awayPlayerStats?.length) ? (
                  <>
                    <PlayerBoxscore teamName={game.awayTeam} teamLogo={game.awayTeamLogo} players={data.awayPlayerStats ?? []} league={game.league} dc={dc} />
                    <PlayerBoxscore teamName={game.homeTeam} teamLogo={game.homeTeamLogo} players={data.homePlayerStats ?? []} league={game.league} dc={dc} />
                  </>
                ) : (
                  <Text style={s.empty}>Box score not yet available</Text>
                )}
              </View>
            )}

            {/* PLAY-BY-PLAY */}
            {activeTab === "playbyplay" && (
              <View style={s.tabSection}>
                {data.keyPlays.length === 0 ? (
                  <Text style={s.empty}>No play data yet</Text>
                ) : (
                  <View style={s.playsCard}>
                    {data.keyPlays.map((play, i) => (
                      <PlayRow key={i} play={play} dc={dc} showDivider={i < data.keyPlays.length - 1} />
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* STATS */}
            {activeTab === "stats" && (
              <View style={s.tabSection}>
                <TeamStatsSection
                  homeTeam={game.homeTeam} awayTeam={game.awayTeam}
                  homeStats={data.homeStats} awayStats={data.awayStats}
                  dc={dc} league={game.league}
                />
              </View>
            )}

            {/* LINEUPS */}
            {activeTab === "lineups" && (
              <View style={s.tabSection}>
                <LineupSection teamName={game.awayTeam} teamLogo={game.awayTeamLogo} league={game.league}
                  players={data.awayPlayerStats ?? data.awayLineup.map(name => ({ name, starter: true, stats: {} }))} dc={dc} />
                <LineupSection teamName={game.homeTeam} teamLogo={game.homeTeamLogo} league={game.league}
                  players={data.homePlayerStats ?? data.homeLineup.map(name => ({ name, starter: true, stats: {} }))} dc={dc} />
              </View>
            )}

          </View>
        </ScrollView>
      )}
    </View>
  );
}

// ─── Gamecast tab ──────────────────────────────────────────────────────────────
function GamecastTab({ data, game, dc }: { data: any; game: any; dc: string }) {
  const isLive = game.status === "live";
  const total = (game.homeScore ?? 0) + (game.awayScore ?? 0);
  const homePct = total > 0 ? ((game.homeScore ?? 0) / total) : 0.5;
  const keyPlays = data.keyPlays ?? [];

  return (
    <View style={s.tabSection}>
      {/* Win probability bar */}
      {(isLive || game.status === "finished") && total > 0 && (
        <View style={s.winProbCard}>
          <Text style={s.winProbLabel}>Score Share</Text>
          <View style={s.winProbRow}>
            <Text style={[s.winProbTeam, { color: dc }]} numberOfLines={1}>{game.awayTeam.split(" ").slice(-1)[0]}</Text>
            <View style={s.winProbBar}>
              <View style={[s.winProbFillAway, { flex: 1 - homePct, backgroundColor: `${dc}66` }]} />
              <View style={[s.winProbFillHome, { flex: homePct, backgroundColor: dc }]} />
            </View>
            <Text style={[s.winProbTeam, { color: dc, textAlign: "right" }]} numberOfLines={1}>{game.homeTeam.split(" ").slice(-1)[0]}</Text>
          </View>
          <View style={s.winProbPcts}>
            <Text style={s.winProbPct}>{Math.round((1 - homePct) * 100)}%</Text>
            <Text style={s.winProbPct}>{Math.round(homePct * 100)}%</Text>
          </View>
        </View>
      )}

      {/* AI summary */}
      {data.aiSummary && (
        <View style={s.aiCard}>
          <View style={s.aiHeader}>
            <Ionicons name="sparkles" size={15} color={dc} />
            <Text style={[s.aiTitle, { color: dc }]}>AI Summary</Text>
          </View>
          <Text style={s.aiText}>{data.aiSummary}</Text>
        </View>
      )}

      {/* Key plays */}
      <View style={s.sectionHeader}>
        <View style={[s.sectionAccent, { backgroundColor: dc }]} />
        <Text style={s.sectionTitle}>Key Plays</Text>
      </View>
      {keyPlays.length === 0 ? (
        <Text style={s.empty}>No key plays yet{isLive ? " — check back soon" : ""}</Text>
      ) : (
        <View style={s.playsCard}>
          {keyPlays.map((play: any, i: number) => (
            <PlayRow key={i} play={play} dc={dc} showDivider={i < keyPlays.length - 1} />
          ))}
        </View>
      )}

      {/* Quick team stats summary */}
      {Object.keys(data.homeStats ?? {}).length > 0 && (
        <>
          <View style={s.sectionHeader}>
            <View style={[s.sectionAccent, { backgroundColor: dc }]} />
            <Text style={s.sectionTitle}>Team Stats</Text>
          </View>
          <QuickStatsBar homeTeam={game.homeTeam} awayTeam={game.awayTeam} homeStats={data.homeStats} awayStats={data.awayStats} dc={dc} />
        </>
      )}
    </View>
  );
}

// ─── Individual play row ───────────────────────────────────────────────────────
function PlayRow({ play, dc, showDivider }: { play: { time: string; description: string; team: string }; dc: string; showDivider: boolean }) {
  const type = classifyPlay(play.description);
  const icon = playIcon(type);
  const badge = playBadge(type, play.description);
  const isTimeout = type === "timeout";
  const isSub = type === "sub";

  return (
    <View>
      <View style={[s.playRow, isTimeout && s.playRowTimeout, isSub && s.playRowSub]}>
        <View style={[s.playIconCircle, { backgroundColor: `${icon.color}18` }]}>
          <Ionicons name={icon.name as any} size={16} color={icon.color} />
        </View>
        <View style={s.playBody}>
          <View style={s.playMeta}>
            <Text style={s.playTime}>{play.time}</Text>
            {play.team ? <Text style={[s.playTeam, { color: dc }]}>{play.team.split(" ").slice(-1)[0]}</Text> : null}
          </View>
          <Text style={[s.playDesc, isTimeout && { color: "#FFD700", fontWeight: "700" }, isSub && { color: C.textSecondary }]}>
            {play.description}
          </Text>
        </View>
        {badge && (
          <View style={[s.playBadge, { backgroundColor: badge === "GOAL" ? "#30D158" : `${dc}22`, borderColor: badge === "GOAL" ? "#30D158" : dc }]}>
            <Text style={[s.playBadgeText, { color: badge === "GOAL" ? "#fff" : dc }]}>{badge}</Text>
          </View>
        )}
      </View>
      {showDivider && <View style={s.playDivider} />}
    </View>
  );
}

// ─── Quick stats bar (3-column) ───────────────────────────────────────────────
function QuickStatsBar({ homeTeam, awayTeam, homeStats, awayStats, dc }: {
  homeTeam: string; awayTeam: string;
  homeStats: Record<string, string | number>;
  awayStats: Record<string, string | number>;
  dc: string;
}) {
  const keys = Object.keys(homeStats).slice(0, 5);
  if (keys.length === 0) return null;
  return (
    <View style={s.quickStats}>
      {keys.map((key, i) => {
        const hv = Number(homeStats[key]) || 0;
        const av = Number(awayStats[key]) || 0;
        const total = hv + av;
        const homePct = total > 0 ? hv / total : 0.5;
        return (
          <View key={key} style={[s.quickStatRow, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.separator }]}>
            <Text style={s.quickStatVal}>{awayStats[key]}</Text>
            <View style={s.quickStatMid}>
              <Text style={s.quickStatKey}>{key}</Text>
              <View style={s.quickStatBar}>
                <View style={{ flex: 1 - homePct, height: 3, backgroundColor: `${dc}44`, borderRadius: 2 }} />
                <View style={{ flex: homePct, height: 3, backgroundColor: dc, borderRadius: 2 }} />
              </View>
            </View>
            <Text style={[s.quickStatVal, { textAlign: "right" }]}>{homeStats[key]}</Text>
          </View>
        );
      })}
    </View>
  );
}

// ─── Team aggregate stats table ───────────────────────────────────────────────
function TeamStatsSection({ homeTeam, awayTeam, homeStats, awayStats, dc, league }: {
  homeTeam: string; awayTeam: string;
  homeStats: Record<string, string | number>;
  awayStats: Record<string, string | number>;
  dc: string; league: string;
}) {
  const keys = Object.keys(homeStats);
  if (keys.length === 0) return <Text style={s.empty}>No stats available</Text>;
  return (
    <View style={s.statsCard}>
      <View style={s.statsHead}>
        <Pressable style={{ flex: 1 }} onPress={() => goToTeam(awayTeam, league)}>
          <Text style={[s.statsTeam, { color: dc }]} numberOfLines={1}>{awayTeam}</Text>
        </Pressable>
        <Text style={s.statsLabel}>TEAM STATS</Text>
        <Pressable style={{ flex: 1 }} onPress={() => goToTeam(homeTeam, league)}>
          <Text style={[s.statsTeam, { color: dc, textAlign: "right" }]} numberOfLines={1}>{homeTeam}</Text>
        </Pressable>
      </View>
      {keys.map((key, i) => {
        const hv = Number(homeStats[key]) || 0;
        const av = Number(awayStats[key]) || 0;
        const total = hv + av;
        const homePct = total > 0 ? hv / total : 0.5;
        return (
          <View key={key} style={[s.statRow, i === keys.length - 1 && { borderBottomWidth: 0 }]}>
            <Text style={[s.statVal, av >= hv && { color: dc }]}>{awayStats[key]}</Text>
            <View style={s.statMid}>
              <Text style={s.statKey}>{key}</Text>
              <View style={s.statBar}>
                <View style={{ flex: 1 - homePct, height: 3, backgroundColor: `${dc}33`, borderRadius: 2 }} />
                <View style={{ flex: homePct, height: 3, backgroundColor: dc, borderRadius: 2 }} />
              </View>
            </View>
            <Text style={[s.statVal, { textAlign: "right" }, hv > av && { color: dc }]}>{homeStats[key]}</Text>
          </View>
        );
      })}
    </View>
  );
}

// ─── Player boxscore ──────────────────────────────────────────────────────────
function PlayerBoxscore({ teamName, teamLogo, players, league, dc }: {
  teamName: string; teamLogo?: string | null;
  players: PlayerStatLine[]; league: string; dc: string;
}) {
  if (players.length === 0) return null;
  const cols = PLAYER_STAT_COLS[league] ?? ["PTS", "REB", "AST"];
  const availCols = cols.filter(c => players.some(p => p.stats[c] != null));
  if (availCols.length === 0) return null;

  return (
    <View style={s.boxCard}>
      <Pressable style={s.boxTeamHeader} onPress={() => goToTeam(teamName, league)}>
        <TeamLogo uri={teamLogo} name={teamName} size={28} borderColor={`${dc}44`} />
        <Text style={[s.boxTeamName, { color: dc }]}>{teamName}</Text>
      </Pressable>
      <View style={[s.boxRow, s.boxHeaderRow]}>
        <Text style={[s.boxPlayer, s.boxHeaderText]}>PLAYER</Text>
        {availCols.map(c => <Text key={c} style={[s.boxStat, s.boxHeaderText]}>{c}</Text>)}
      </View>
      {players.map(player => (
        <Pressable key={player.name} style={s.boxRow} onPress={() => goToPlayer(player.name)}>
          <View style={s.boxPlayerCell}>
            {player.starter && <View style={[s.starterDot, { backgroundColor: dc }]} />}
            <Text style={s.boxPlayer} numberOfLines={1}>{player.name}</Text>
          </View>
          {availCols.map(c => <Text key={c} style={s.boxStat}>{player.stats[c] ?? "—"}</Text>)}
        </Pressable>
      ))}
      <Text style={s.boxNote}>● Starter</Text>
    </View>
  );
}

// ─── Lineup section ────────────────────────────────────────────────────────────
function LineupSection({ teamName, teamLogo, league, players, dc }: {
  teamName: string; teamLogo?: string | null;
  league: string; players: PlayerStatLine[]; dc: string;
}) {
  const starters = players.filter(p => p.starter);
  const bench = players.filter(p => !p.starter);
  return (
    <View style={s.lineupSection}>
      <Pressable style={s.lineupTeamHeader} onPress={() => goToTeam(teamName, league)}>
        <TeamLogo uri={teamLogo} name={teamName} size={32} borderColor={`${dc}44`} />
        <Text style={[s.lineupTeamName, { color: dc }]}>{teamName}</Text>
      </Pressable>
      {starters.length > 0 && (
        <>
          <Text style={s.rosterLabel}>STARTERS</Text>
          {starters.map((player, i) => (
            <PlayerRow key={player.name} player={player} idx={i} dc={dc} league={league} isStarter />
          ))}
        </>
      )}
      {bench.length > 0 && (
        <>
          <Text style={s.rosterLabel}>BENCH</Text>
          {bench.map((player, i) => (
            <PlayerRow key={player.name} player={player} idx={i} dc={dc} league={league} isStarter={false} />
          ))}
        </>
      )}
      {players.length === 0 && <Text style={s.empty}>No lineup data</Text>}
    </View>
  );
}

function PlayerRow({ player, idx, dc, league, isStarter }: {
  player: PlayerStatLine; idx: number; dc: string; league: string; isStarter: boolean;
}) {
  const [err, setErr] = useState(false);
  const url = getEspnHeadshotUrl(player.name, league);
  return (
    <Pressable style={s.playerRow} onPress={() => goToPlayer(player.name)}>
      <View style={[s.playerNumBadge, isStarter ? { backgroundColor: `${dc}22` } : { backgroundColor: "rgba(255,255,255,0.06)" }]}>
        <Text style={[s.playerNum, isStarter && { color: dc }]}>{idx + 1}</Text>
      </View>
      {url && !err ? (
        <Image source={{ uri: url }} style={s.playerHeadshot} onError={() => setErr(true)} />
      ) : (
        <View style={s.playerHeadshotPlaceholder}>
          <Text style={s.playerHeadshotInitial}>{player.name.charAt(0)}</Text>
        </View>
      )}
      <Text style={s.playerName} numberOfLines={1}>{player.name}</Text>
      <Ionicons name="chevron-forward" size={14} color={C.textTertiary} />
    </Pressable>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background },

  // nav
  nav: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 10 },
  navBack: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  navTitle: { flex: 1, textAlign: "center", color: C.text, fontSize: 15, fontWeight: "700", fontFamily: "Inter_700Bold" },
  navRight: { width: 40, alignItems: "flex-end", justifyContent: "center" },

  loading: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { color: C.textTertiary, fontSize: 14 },

  // hero
  hero: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 24, gap: 16, alignItems: "center" },
  statusPill: {
    flexDirection: "row", alignItems: "center", gap: 7,
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1,
  },
  statusLeague: { fontSize: 12, fontWeight: "900", letterSpacing: 1 },
  liveDotPill: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.live },
  liveLabel: { color: C.live, fontSize: 12, fontWeight: "800", letterSpacing: 0.5 },
  statusSep: { color: C.textTertiary, fontSize: 12 },
  statusExtra: { color: C.textSecondary, fontSize: 12, fontWeight: "500" },

  heroTeams: { flexDirection: "row", alignItems: "center", width: "100%", gap: 8 },
  heroTeamCol: { flex: 1, alignItems: "flex-start", gap: 8 },
  heroTeamName: { color: C.text, fontSize: 13, fontWeight: "700", fontFamily: "Inter_700Bold", lineHeight: 17 },
  heroTeamLabel: { color: C.textTertiary, fontSize: 10, fontWeight: "600", letterSpacing: 0.8 },
  heroScoreBlock: { alignItems: "center", gap: 6, minWidth: 130 },
  heroScoreRow: { flexDirection: "row", alignItems: "baseline", gap: 4 },
  heroScore: { fontSize: 56, fontWeight: "900", color: C.text, fontFamily: "Inter_700Bold", lineHeight: 62 },
  heroScoreSep: { fontSize: 32, color: C.textTertiary, fontWeight: "300" },
  heroScoreDim: { color: C.textTertiary },
  vsText: { fontSize: 28, fontWeight: "900", color: C.textTertiary, fontFamily: "Inter_700Bold" },
  clockPill: {
    borderWidth: 1, borderRadius: 14,
    paddingHorizontal: 12, paddingVertical: 3,
  },
  clockText: { fontSize: 12, fontWeight: "700", letterSpacing: 0.3 },
  venueText: { color: C.textTertiary, fontSize: 10, textAlign: "center" },
  watchPill: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderWidth: 1.5, borderRadius: 24,
    paddingHorizontal: 20, paddingVertical: 10,
    marginTop: 4,
  },
  watchText: { fontSize: 13, fontWeight: "800", letterSpacing: 0.4, fontFamily: "Inter_700Bold" },

  // tab bar
  tabBarWrap: { backgroundColor: C.background, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.cardBorder },
  tabBar: { flexDirection: "row", paddingHorizontal: 12, gap: 0 },
  tab: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 13,
    borderBottomWidth: 2.5, borderBottomColor: "transparent",
  },
  tabLabel: { color: C.textTertiary, fontSize: 13, fontWeight: "600", fontFamily: "Inter_600SemiBold" },

  // content
  content: { paddingBottom: 60 },
  tabSection: { padding: 16, gap: 14 },

  // win probability
  winProbCard: {
    backgroundColor: C.card, borderRadius: 16,
    padding: 16, gap: 8,
    borderWidth: 1, borderColor: C.cardBorder,
  },
  winProbLabel: { color: C.textTertiary, fontSize: 11, fontWeight: "700", letterSpacing: 0.8, textAlign: "center" },
  winProbRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  winProbTeam: { fontSize: 11, fontWeight: "700", width: 50 },
  winProbBar: { flex: 1, flexDirection: "row", height: 8, borderRadius: 4, overflow: "hidden" },
  winProbFillAway: { borderRadius: 2 },
  winProbFillHome: { borderRadius: 2 },
  winProbPcts: { flexDirection: "row", justifyContent: "space-between" },
  winProbPct: { color: C.textTertiary, fontSize: 11, fontWeight: "600" },

  // section headers
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 4 },
  sectionAccent: { width: 4, height: 18, borderRadius: 2 },
  sectionTitle: { fontSize: 17, fontWeight: "800", color: C.text, fontFamily: "Inter_700Bold", letterSpacing: -0.2 },

  // plays
  playsCard: { backgroundColor: C.card, borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: C.cardBorder },
  playRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  playRowTimeout: { backgroundColor: "rgba(255,215,0,0.05)" },
  playRowSub: { backgroundColor: "rgba(74,144,217,0.05)" },
  playIconCircle: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 },
  playBody: { flex: 1, gap: 3 },
  playMeta: { flexDirection: "row", alignItems: "center", gap: 8 },
  playTime: { color: C.textTertiary, fontSize: 11, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  playTeam: { fontSize: 11, fontWeight: "700" },
  playDesc: { color: C.text, fontSize: 14, lineHeight: 20, fontFamily: "Inter_400Regular" },
  playBadge: {
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 8, borderWidth: 1,
    alignSelf: "center", flexShrink: 0,
  },
  playBadgeText: { fontSize: 11, fontWeight: "900", letterSpacing: 0.3 },
  playDivider: { height: StyleSheet.hairlineWidth, backgroundColor: C.separator, marginLeft: 60 },

  // quick stats
  quickStats: { backgroundColor: C.card, borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: C.cardBorder },
  quickStatRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingVertical: 12 },
  quickStatVal: { fontSize: 14, fontWeight: "700", color: C.text, fontFamily: "Inter_700Bold", minWidth: 48 },
  quickStatMid: { flex: 1, gap: 4 },
  quickStatKey: { color: C.textTertiary, fontSize: 11, fontWeight: "600", textAlign: "center", letterSpacing: 0.5 },
  quickStatBar: { flexDirection: "row", height: 3, borderRadius: 2, overflow: "hidden" },

  // ai
  aiCard: { backgroundColor: C.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.cardBorder, gap: 10 },
  aiHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  aiTitle: { fontSize: 13, fontWeight: "700", letterSpacing: 0.5 },
  aiText: { color: C.textSecondary, fontSize: 14, lineHeight: 22, fontFamily: "Inter_400Regular" },

  // stats table
  statsCard: { backgroundColor: C.card, borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: C.cardBorder },
  statsHead: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.separator },
  statsTeam: { flex: 1, fontSize: 13, fontWeight: "700" },
  statsLabel: { color: C.textTertiary, fontSize: 10, fontWeight: "700", letterSpacing: 0.8, flex: 1, textAlign: "center" },
  statRow: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.separator,
    gap: 8,
  },
  statVal: { fontSize: 14, fontWeight: "700", color: C.text, fontFamily: "Inter_700Bold", minWidth: 50 },
  statMid: { flex: 1, gap: 4 },
  statKey: { color: C.textTertiary, fontSize: 11, textAlign: "center", letterSpacing: 0.5 },
  statBar: { flexDirection: "row", height: 3, borderRadius: 2, overflow: "hidden" },

  // box score
  boxCard: { backgroundColor: C.card, borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: C.cardBorder },
  boxTeamHeader: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.separator },
  boxTeamName: { fontSize: 14, fontWeight: "800", fontFamily: "Inter_700Bold" },
  boxRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.separator },
  boxHeaderRow: { backgroundColor: "rgba(255,255,255,0.03)" },
  boxHeaderText: { color: C.textTertiary, fontSize: 10, fontWeight: "700", letterSpacing: 0.5 },
  boxPlayerCell: { flex: 1, flexDirection: "row", alignItems: "center", gap: 6 },
  boxPlayer: { flex: 1, color: C.text, fontSize: 13, fontFamily: "Inter_500Medium" },
  boxStat: { width: 44, color: C.textSecondary, fontSize: 12, textAlign: "center", fontFamily: "Inter_500Medium" },
  starterDot: { width: 5, height: 5, borderRadius: 3, flexShrink: 0 },
  boxNote: { color: C.textTertiary, fontSize: 10, padding: 10, fontFamily: "Inter_400Regular" },

  // lineups
  lineupSection: { gap: 6 },
  lineupTeamHeader: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8 },
  lineupTeamName: { fontSize: 15, fontWeight: "800", fontFamily: "Inter_700Bold" },
  rosterLabel: { color: C.textTertiary, fontSize: 10, fontWeight: "700", letterSpacing: 1, fontFamily: "Inter_700Bold", marginTop: 4 },
  playerRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: C.card, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    borderWidth: 1, borderColor: C.cardBorder,
  },
  playerNumBadge: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  playerNum: { color: C.textTertiary, fontSize: 12, fontWeight: "700" },
  playerHeadshot: { width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.08)" },
  playerHeadshotPlaceholder: { width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.08)", alignItems: "center", justifyContent: "center" },
  playerHeadshotInitial: { color: C.textTertiary, fontSize: 12, fontWeight: "700" },
  playerName: { flex: 1, color: C.text, fontSize: 15, fontFamily: "Inter_500Medium" },

  empty: { color: C.textTertiary, fontSize: 14, textAlign: "center", paddingVertical: 20, fontFamily: "Inter_400Regular" },
});
