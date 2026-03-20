import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView, Pressable, Platform, Dimensions,
  ActivityIndicator, Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { getPlayerById, type Player, type TeamData } from "@/constants/teamData";
import { ALL_PLAYERS } from "@/constants/allPlayers";
import { getEspnGamelogUrl, getEspnHeadshotUrl, getEspnStatsUrl } from "@/constants/espnAthleteIds";

const C = Colors.dark;
const { width } = Dimensions.get("window");

const PLAYER_TABS = ["Overview", "News", "Stats", "Bio", "Splits", "Game Log"] as const;
type PlayerTab = (typeof PLAYER_TABS)[number];

// ─── ESPN stats fetch + parse ─────────────────────────────────────────────────
type LiveStats = Record<string, string>;

function parseEspnStats(data: any): LiveStats {
  const result: LiveStats = {};
  for (const cat of data.categories ?? []) {
    const names: string[] = cat.names ?? [];
    const statsArr: Array<{ season?: { year?: number }; stats?: string[] }> = cat.statistics ?? [];
    const latest = [...statsArr].sort(
      (a, b) => (b.season?.year ?? 0) - (a.season?.year ?? 0)
    )[0];
    if (!latest) continue;
    const vals = latest.stats ?? [];
    names.forEach((n, i) => {
      if (vals[i] !== undefined) result[n] = vals[i];
    });
  }
  return result;
}

// ─── Stat card for key metrics ────────────────────────────────────────────────
function StatBigCard({ value, label, color }: { value: string | number; label: string; color: string }) {
  return (
    <View style={[card.box, { borderColor: `${color}30` }]}>
      <Text style={[card.val, { color }]}>{value}</Text>
      <Text style={card.lbl}>{label}</Text>
    </View>
  );
}

const card = StyleSheet.create({
  box: {
    flex: 1, backgroundColor: C.card, borderRadius: 14, padding: 14,
    alignItems: "center", gap: 4, borderWidth: 1.5,
    minWidth: (width - 52) / 4,
  },
  val: { fontSize: 22, fontWeight: "900", fontFamily: "Inter_700Bold" },
  lbl: { color: C.textTertiary, fontSize: 10, fontWeight: "700", letterSpacing: 0.8, textTransform: "uppercase" },
});

// ─── NBA Overview ─────────────────────────────────────────────────────────────
function NBAOverview({ player, team, liveStats }: { player: Player; team: TeamData; liveStats: LiveStats | null }) {
  const s = player.stats ?? {};
  const ppg = liveStats?.avgPoints ?? s.PPG ?? "—";
  const rpg = liveStats?.avgRebounds ?? s.RPG ?? "—";
  const apg = liveStats?.avgAssists ?? s.APG ?? "—";
  const fg = liveStats?.fieldGoalPct ?? s.FG ?? "—";

  const tableRows = liveStats
    ? [
        ["Points", liveStats.avgPoints],
        ["Rebounds", liveStats.avgRebounds],
        ["Assists", liveStats.avgAssists],
        ["Blocks", liveStats.avgBlocks],
        ["Steals", liveStats.avgSteals],
        ["FG%", liveStats.fieldGoalPct ? `${liveStats.fieldGoalPct}%` : undefined],
        ["3P%", liveStats.threePointFieldGoalPct ? `${liveStats.threePointFieldGoalPct}%` : undefined],
        ["FT%", liveStats.freeThrowPct ? `${liveStats.freeThrowPct}%` : undefined],
        ["Minutes", liveStats.avgMinutes],
        ["Turnovers", liveStats.avgTurnovers],
      ].filter(([, v]) => v !== undefined)
    : [
        ["Points", s.PTS],
        ["Rebounds", s.REB],
        ["Assists", s.AST],
        ["Blocks", s.BLK],
        ["Steals", s.STL],
        ["FG%", s.FG],
        ["Minutes", s.MIN],
      ].filter(([, v]) => v !== undefined);

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <StatBigCard value={ppg} label="PPG" color={team.color} />
        <StatBigCard value={rpg} label="RPG" color={C.accentTeal} />
        <StatBigCard value={apg} label="APG" color={C.accentBlue} />
        <StatBigCard value={fg} label="FG%" color={C.accentGold} />
      </View>
      {player.bio && <View style={bio.card}><Text style={bio.text}>{player.bio}</Text></View>}
      <View style={table.card}>
        <Text style={table.title}>{liveStats ? "2025-26 Live Season Averages" : "2025-26 Regular Season"}</Text>
        <View style={table.header}>
          {["STAT", "VALUE"].map(h => (
            <Text key={h} style={[table.headerCell, h === "STAT" ? { flex: 1 } : { width: 80, textAlign: "right" }]}>{h}</Text>
          ))}
        </View>
        {tableRows.map(([label, val], i) => (
          <View key={label as string} style={[table.row, { backgroundColor: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.025)" }]}>
            <Text style={[table.cell, { flex: 1 }]}>{label as string}</Text>
            <Text style={[table.cell, { width: 80, textAlign: "right", color: C.text, fontWeight: "700" }]}>{val as string}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

// ─── NFL Overview ─────────────────────────────────────────────────────────────
function NFLOverview({ player, team, liveStats }: { player: Player; team: TeamData; liveStats: LiveStats | null }) {
  const s = player.stats ?? {};
  const isQB = player.position === "QB";
  const isRB = player.position === "RB";
  const isSkill = ["WR", "TE"].includes(player.position);

  const statCards = isQB
    ? [
        { v: liveStats?.passingYards ?? s.YDS ?? s.YARDS, l: "PASS YDS" },
        { v: liveStats?.passingTouchdowns ?? s.TD, l: "TD" },
        { v: liveStats?.interceptions ?? s.INT, l: "INT" },
        { v: liveStats?.adjQBR ?? liveStats?.QBRating ?? s.QBR, l: "QBR" },
      ]
    : isRB
    ? [
        { v: liveStats?.rushingYards ?? s.RUSH_YDS, l: "RUSH YDS" },
        { v: liveStats?.rushingTouchdowns ?? s.RUSH_TD, l: "RUSH TD" },
        { v: liveStats?.rushingAttempts ?? s.CAR, l: "CARRIES" },
        { v: liveStats?.yardsPerRushAttempt ?? s.YPC, l: "YPC" },
      ]
    : isSkill
    ? [
        { v: liveStats?.receptions ?? s.REC, l: "REC" },
        { v: liveStats?.receivingYards ?? s.YDS, l: "REC YDS" },
        { v: liveStats?.receivingTouchdowns ?? s.TD, l: "TD" },
        { v: liveStats?.yardsPerReception ?? s.YPR, l: "YPR" },
      ]
    : [
        { v: s.SACKS, l: "SACKS" },
        { v: s.TFL ?? s.TKL, l: s.TFL ? "TFL" : "TKL" },
        { v: s.PD, l: "PD" },
        { v: s.FF, l: "FF" },
      ];

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
      <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
        {statCards.map(({ v, l }) => v !== undefined
          ? <StatBigCard key={l} value={v as string} label={l} color={team.color} />
          : null
        )}
      </View>
      {player.bio && <View style={bio.card}><Text style={bio.text}>{player.bio}</Text></View>}
      <View style={table.card}>
        <Text style={table.title}>{liveStats && Object.keys(liveStats).length > 0 ? "2025 Live Season Stats" : "2025 Season Stats"}</Text>
        {Object.entries(s).map(([k, v], i) => (
          <View key={k} style={[table.row, { backgroundColor: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.025)" }]}>
            <Text style={[table.cell, { flex: 1 }]}>{k}</Text>
            <Text style={[table.cell, { width: 80, textAlign: "right", color: C.text, fontWeight: "700" }]}>{v as string}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

// ─── MLB Overview ─────────────────────────────────────────────────────────────
function MLBOverview({ player, team, liveStats }: { player: Player; team: TeamData; liveStats: LiveStats | null }) {
  const s = player.stats ?? {};
  const isPitcher = ["SP", "RP", "CL"].includes(player.position);
  const statCards = isPitcher
    ? [
        { v: liveStats?.ERA ?? s.ERA, l: "ERA" },
        { v: liveStats?.wins ?? s.W, l: "W" },
        { v: liveStats?.strikeouts ?? s.SO, l: "K" },
        { v: liveStats?.WHIP ?? s.WHIP, l: "WHIP" },
      ]
    : [
        { v: liveStats?.avg ?? liveStats?.battingAvg ?? s.AVG, l: "AVG" },
        { v: liveStats?.homeRuns ?? s.HR, l: "HR" },
        { v: liveStats?.RBIs ?? s.RBI, l: "RBI" },
        { v: liveStats?.OPS ?? s.OPS, l: "OPS" },
      ];

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
      <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
        {statCards.map(({ v, l }) => v !== undefined
          ? <StatBigCard key={l} value={v as string} label={l} color={team.color} />
          : null
        )}
      </View>
      {player.bio && <View style={bio.card}><Text style={bio.text}>{player.bio}</Text></View>}
      <View style={table.card}>
        <Text style={table.title}>2025 Season Stats</Text>
        {Object.entries(s).map(([k, v], i) => (
          <View key={k} style={[table.row, { backgroundColor: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.025)" }]}>
            <Text style={[table.cell, { flex: 1 }]}>{k}</Text>
            <Text style={[table.cell, { width: 80, textAlign: "right", color: C.text, fontWeight: "700" }]}>{v as string}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

// ─── Generic overview fallback ────────────────────────────────────────────────
function GenericOverview({ player, team, liveStats }: { player: Player; team: TeamData; liveStats: LiveStats | null }) {
  const s = player.stats ?? {};

  const mlsCards = liveStats
    ? [
        { v: liveStats.goals, l: "GOALS" },
        { v: liveStats.assists, l: "ASSISTS" },
        { v: liveStats.minutesPlayed, l: "MINUTES" },
        { v: liveStats.shotsOnGoal ?? liveStats.shots, l: "SHOTS" },
      ].filter(({ v }) => v !== undefined)
    : [];

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
      {mlsCards.length > 0 && (
        <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
          {mlsCards.map(({ v, l }) => (
            <StatBigCard key={l} value={v as string} label={l} color={team.color} />
          ))}
        </View>
      )}
      {player.bio && <View style={bio.card}><Text style={bio.text}>{player.bio}</Text></View>}
      {Object.keys(s).length > 0 && (
        <View style={table.card}>
          <Text style={table.title}>Stats</Text>
          {Object.entries(s).map(([k, v], i) => (
            <View key={k} style={[table.row, { backgroundColor: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.025)" }]}>
              <Text style={[table.cell, { flex: 1 }]}>{k}</Text>
              <Text style={[table.cell, { width: 80, textAlign: "right", color: C.text, fontWeight: "700" }]}>{v as string}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function PlaceholderTab({ label }: { label: string }) {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 12 }}>
      <Ionicons name="stats-chart-outline" size={44} color={C.textTertiary} />
      <Text style={{ color: C.textSecondary, fontSize: 16, fontFamily: "Inter_600SemiBold" }}>{label}</Text>
      <Text style={{ color: C.textTertiary, fontSize: 13, textAlign: "center" }}>Detailed {label.toLowerCase()} coming soon</Text>
    </View>
  );
}

// ─── Preferred stat column order per league ────────────────────────────────────
const PREFERRED_COLS: Record<string, string[]> = {
  NBA: ["PTS", "REB", "AST", "MIN", "FG", "3PT", "FT", "BLK", "STL", "TO"],
  NFL: ["ATT", "CMP", "YDS", "TD", "INT", "CAR", "RUSH", "REC", "RECY", "SACKS"],
  MLB: ["AB", "H", "HR", "RBI", "R", "BB", "K", "AVG", "IP", "ER"],
  MLS: ["MIN", "G", "A", "SH", "SOG", "FC", "PS%"],
};

type GameLogRow = {
  eventId: string;
  date: string;
  opponent: string;
  atVs: string;
  result: string;
  score: string;
  stats: Record<string, string>;
};

function GameLogTab({
  playerName,
  league,
  teamColor,
}: {
  playerName: string;
  league: string;
  teamColor: string;
}) {
  const defaultSeason = (league === "NBA" || league === "MLS") ? "2026" : "2025";
  const seasonButtons = (league === "NBA" || league === "MLS")
    ? ["2026", "2025", "2024"]
    : ["2025", "2024", "2023"];

  const [rows, setRows] = useState<GameLogRow[]>([]);
  const [labels, setLabels] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [season, setSeason] = useState(defaultSeason);

  const load = useCallback(async (s: string) => {
    setLoading(true);
    setError(null);
    try {
      const url = getEspnGamelogUrl(playerName, league, s);
      if (!url) {
        setError("Player not found in ESPN database");
        setLoading(false);
        return;
      }
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`ESPN API ${resp.status}`);
      const data = await resp.json();

      const allLabels: string[] = data.labels ?? [];

      const merged: Record<string, { stats: string[] }> = {};
      (data.seasonTypes ?? []).forEach((st: any) => {
        (st.categories ?? []).forEach((cat: any) => {
          Object.values(cat.events ?? {}).forEach((ev: any) => {
            const eid = ev.eventId;
            if (eid && !merged[eid]) merged[eid] = { stats: ev.stats ?? [] };
          });
        });
      });

      const eventMeta: Record<string, any> = data.events ?? {};
      const built: GameLogRow[] = Object.keys(merged)
        .filter(eid => eventMeta[eid])
        .sort((a, b) => {
          const da = new Date(eventMeta[a]?.gameDate ?? 0).getTime();
          const db = new Date(eventMeta[b]?.gameDate ?? 0).getTime();
          return db - da;
        })
        .map(eid => {
          const meta = eventMeta[eid];
          const rawDate = meta?.gameDate ?? "";
          const dateObj = rawDate ? new Date(rawDate) : null;
          const dateStr = dateObj
            ? dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" })
            : "—";
          const statVals: Record<string, string> = {};
          (merged[eid].stats ?? []).forEach((v: string, i: number) => {
            if (allLabels[i]) statVals[allLabels[i]] = v;
          });
          return {
            eventId: eid,
            date: dateStr,
            opponent: meta?.opponent?.abbreviation ?? meta?.opponent?.displayName ?? "—",
            atVs: meta?.atVs ?? "vs",
            result: meta?.gameResult ?? "—",
            score: meta?.score ?? "—",
            stats: statVals,
          };
        });

      const preferred = PREFERRED_COLS[league] ?? [];
      const shown = preferred.length
        ? preferred.filter(l => allLabels.includes(l))
        : allLabels.slice(0, 10);

      setLabels(shown);
      setRows(built);
    } catch (e: any) {
      setError(e.message ?? "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [playerName, league]);

  useEffect(() => { load(season); }, [load, season]);

  const COL_W = 52;
  const LEFT_W = 196;
  const ROW_H = 36;

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 12 }}>
        <ActivityIndicator size="large" color={teamColor} />
        <Text style={{ color: C.textTertiary, fontSize: 13 }}>Loading game log…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 12 }}>
        <Ionicons name="cloud-offline-outline" size={40} color={C.textTertiary} />
        <Text style={{ color: C.textSecondary, fontSize: 15, fontFamily: "Inter_600SemiBold" }}>
          No game log available
        </Text>
        <Text style={{ color: C.textTertiary, fontSize: 13, textAlign: "center" }}>{error}</Text>
      </View>
    );
  }

  if (rows.length === 0) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 12 }}>
        <Ionicons name="calendar-outline" size={40} color={C.textTertiary} />
        <Text style={{ color: C.textSecondary, fontSize: 15, fontFamily: "Inter_600SemiBold" }}>No games yet</Text>
        <Text style={{ color: C.textTertiary, fontSize: 13, textAlign: "center" }}>
          No game log data for this season
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={gl.seasonRow}>
        {seasonButtons.map(s => (
          <Pressable
            key={s}
            onPress={() => { setSeason(s); load(s); }}
            style={[gl.seasonBtn, season === s && { backgroundColor: teamColor }]}
          >
            <Text style={[gl.seasonBtnTxt, season === s && { color: "#fff" }]}>
              {(league === "NFL" || league === "MLB") ? s : `${parseInt(s) - 1}-${s.slice(2)}`}
            </Text>
          </Pressable>
        ))}
        <View style={{ flex: 1 }} />
        <Text style={gl.gamesCount}>{rows.length} games</Text>
      </View>

      <View style={{ flex: 1, flexDirection: "row" }}>
        <View style={[gl.leftCol, { width: LEFT_W }]}>
          <View style={[gl.headerRow, { height: ROW_H }]}>
            <Text style={[gl.headerCell, { width: 50 }]}>DATE</Text>
            <Text style={[gl.headerCell, { width: 40 }]}>OPP</Text>
            <Text style={[gl.headerCell, { flex: 1 }]}>RESULT</Text>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} nestedScrollEnabled>
            {rows.map((row, i) => {
              const resultColor = row.result === "W" ? "#3ECF8E" : row.result === "L" ? "#FF6B6B" : C.textTertiary;
              const scoreDisplay = row.score && row.score !== "—" ? `${row.result} ${row.score}` : row.result;
              return (
                <View
                  key={row.eventId}
                  style={[
                    gl.dataRow,
                    { height: ROW_H, backgroundColor: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.03)" },
                  ]}
                >
                  <Text style={[gl.leftDateTxt, { width: 50 }]}>{row.date}</Text>
                  <Text style={[gl.leftOppTxt, { width: 40 }]}>
                    {row.atVs === "@" ? "@" : "vs"} {row.opponent}
                  </Text>
                  <Text style={[gl.resultTxt, { flex: 1, color: resultColor }]} numberOfLines={1}>
                    {scoreDisplay}
                  </Text>
                </View>
              );
            })}
          </ScrollView>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
          <View>
            <View style={[gl.headerRow, { height: ROW_H }]}>
              {labels.map(lbl => (
                <Text key={lbl} style={[gl.headerCell, { width: COL_W, textAlign: "right" }]}>{lbl}</Text>
              ))}
            </View>
            <ScrollView showsVerticalScrollIndicator={false} nestedScrollEnabled>
              {rows.map((row, i) => (
                <View
                  key={row.eventId}
                  style={[
                    gl.dataRow,
                    { height: ROW_H, backgroundColor: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.03)" },
                  ]}
                >
                  {labels.map(lbl => {
                    const val = row.stats[lbl] ?? "—";
                    const isKey = lbl === "PTS" || lbl === "YDS" || lbl === "HR" || lbl === "G";
                    return (
                      <Text
                        key={lbl}
                        style={[
                          gl.statCell,
                          { width: COL_W },
                          isKey && { color: teamColor, fontWeight: "700" },
                        ]}
                      >
                        {val}
                      </Text>
                    );
                  })}
                </View>
              ))}
            </ScrollView>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const gl = StyleSheet.create({
  seasonRow: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 14, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.07)",
  },
  seasonBtn: {
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  seasonBtnTxt: { color: C.textSecondary, fontSize: 12, fontWeight: "600" },
  gamesCount: { color: C.textTertiary, fontSize: 11 },
  leftCol: {
    borderRightWidth: 1, borderRightColor: "rgba(255,255,255,0.08)",
  },
  headerRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingHorizontal: 8,
    borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.08)",
  },
  headerCell: {
    color: C.textTertiary, fontSize: 10, fontWeight: "700",
    letterSpacing: 0.8, textTransform: "uppercase",
  },
  dataRow: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 8,
  },
  leftDateTxt: { color: C.textTertiary, fontSize: 11 },
  leftOppTxt: { color: C.textSecondary, fontSize: 11 },
  resultTxt: { fontSize: 11, fontWeight: "700", textAlign: "left" },
  statCell: {
    color: C.textSecondary, fontSize: 12, textAlign: "right",
    fontFamily: "Inter_400Regular",
  },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function PlayerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<PlayerTab>("Overview");
  const [followed, setFollowed] = useState(false);
  const [headshotError, setHeadshotError] = useState(false);
  const [liveStats, setLiveStats] = useState<LiveStats | null>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const result = getPlayerById(id ?? "");

  const fallbackSearchPlayer = result
    ? null
    : ALL_PLAYERS.find(p => {
        const slug = p.name
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9\s]/g, "")
          .trim()
          .replace(/\s+/g, "-");
        return slug === (id ?? "");
      });

  const LEAGUE_COLOR: Record<string, string> = {
    NBA: C.nba, NFL: C.nfl, MLB: C.mlb, MLS: C.mls,
  };

  const player: Player = result?.player ?? (fallbackSearchPlayer ? {
    id: id ?? "",
    name: fallbackSearchPlayer.name,
    number: fallbackSearchPlayer.number ?? "—",
    position: fallbackSearchPlayer.position,
    age: 0,
    height: "—",
    weight: "—",
    group: "Guards" as const,
    stats: {},
    bio: `${fallbackSearchPlayer.name} plays ${fallbackSearchPlayer.position} for the ${fallbackSearchPlayer.team}. 2025-26 season: ${fallbackSearchPlayer.stat}`,
  } : null as any);

  const team: TeamData = result?.team ?? (fallbackSearchPlayer ? {
    id: `${fallbackSearchPlayer.league.toLowerCase()}-fallback`,
    name: fallbackSearchPlayer.team,
    shortName: fallbackSearchPlayer.team.split(" ").pop() ?? fallbackSearchPlayer.team,
    abbr: fallbackSearchPlayer.league,
    league: fallbackSearchPlayer.league as any,
    division: fallbackSearchPlayer.league,
    color: LEAGUE_COLOR[fallbackSearchPlayer.league] ?? C.accent,
    colorSecondary: C.accentBlue,
    record: "—",
    standing: "—",
    coach: "—",
    stadium: "—",
    city: "—",
    founded: 0,
    roster: [],
    recentGames: [],
    stats: [],
  } : null as any);

  // Fetch live ESPN stats when player page opens
  useEffect(() => {
    if (!player || !team) return;
    setLiveStats(null);
    const url = getEspnStatsUrl(player.name, team.league);
    if (!url) return;
    fetch(url)
      .then(r => r.json())
      .then(data => {
        const parsed = parseEspnStats(data);
        if (Object.keys(parsed).length > 0) setLiveStats(parsed);
      })
      .catch(() => {}); // silent fallback to static stats
  }, [player?.name, team?.league]);

  if (!player || !team) {
    return (
      <View style={[styles.container, { paddingTop: topPad }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={C.text} />
        </Pressable>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: C.textSecondary, fontSize: 16 }}>Player not found</Text>
        </View>
      </View>
    );
  }

  const headshotUrl = getEspnHeadshotUrl(player.name, team.league);

  const renderOverview = () => {
    if (team.league === "NBA") return <NBAOverview player={player} team={team} liveStats={liveStats} />;
    if (team.league === "NFL") return <NFLOverview player={player} team={team} liveStats={liveStats} />;
    if (team.league === "MLB") return <MLBOverview player={player} team={team} liveStats={liveStats} />;
    return <GenericOverview player={player} team={team} liveStats={liveStats} />;
  };

  const renderTab = () => {
    switch (activeTab) {
      case "Overview": return renderOverview();
      case "News": return <PlaceholderTab label="News" />;
      case "Stats": return <PlaceholderTab label="Stats" />;
      case "Bio": return (
        <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }}>
          <Text style={bioTab.name}>{player.name}</Text>
          {[
            ["Team", team.name],
            ["Position", player.position],
            ["Jersey", `#${player.number}`],
            ["Height", player.height],
            ["Weight", player.weight],
            player.birthdate && ["Birthday", player.birthdate],
            player.college && ["College", player.college],
          ].filter(Boolean).map((row) => { const [label, value] = row as [string, string]; return (
            <View key={label as string} style={bioTab.row}>
              <Text style={bioTab.label}>{label as string}</Text>
              <Text style={bioTab.value}>{value as string}</Text>
            </View>
          ); })}
          {player.bio && <Text style={bioTab.bioText}>{player.bio}</Text>}
        </ScrollView>
      );
      case "Splits": return <PlaceholderTab label="Splits" />;
      case "Game Log": return (
        <GameLogTab
          playerName={player.name}
          league={team.league}
          teamColor={team.color}
        />
      );
    }
  };

  return (
    <View style={[styles.container, { paddingBottom: botPad }]}>
      {/* ── Hero Header ── */}
      <LinearGradient
        colors={[team.color, `${team.color}AA`, C.background]}
        style={[styles.hero, { paddingTop: topPad + 4 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Top bar */}
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </Pressable>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setFollowed(f => !f);
            }}
            style={[styles.followBtn, followed && { backgroundColor: team.color }]}
          >
            <Ionicons name={followed ? "checkmark" : "add"} size={16} color="#fff" />
            <Text style={styles.followText}>{followed ? "Following" : "Follow"}</Text>
          </Pressable>
        </View>

        {/* Player identity */}
        <View style={styles.playerIdentity}>
          {/* Headshot or letter avatar */}
          {headshotUrl && !headshotError ? (
            <Image
              source={{ uri: headshotUrl }}
              style={[styles.headshotImg, { borderColor: `${team.color}60` }]}
              onError={() => setHeadshotError(true)}
            />
          ) : (
            <View style={[styles.playerAvatar, { backgroundColor: `${team.color}35`, borderColor: `${team.color}60` }]}>
              <Text style={styles.avatarInitial}>{player.name.charAt(0).toUpperCase()}</Text>
            </View>
          )}

          <View style={{ flex: 1 }}>
            <Text style={styles.playerName}>{player.name}</Text>
            <Pressable
              onPress={() => {
                router.push({ pathname: "/team/[id]", params: { id: team.id } } as any);
              }}
            >
              <Text style={styles.teamLink}>{team.name} · {team.league}</Text>
            </Pressable>
            <View style={{ flexDirection: "row", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
              <View style={styles.infoPill}><Text style={styles.infoPillText}>{player.height}</Text></View>
              <View style={styles.infoPill}><Text style={styles.infoPillText}>{player.weight}</Text></View>
              {player.college && (
                <View style={styles.infoPill}><Text style={styles.infoPillText}>{player.college}</Text></View>
              )}
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* ── Tab Bar ── */}
      <View style={styles.tabBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
          {PLAYER_TABS.map(tab => {
            const active = tab === activeTab;
            return (
              <Pressable
                key={tab}
                onPress={() => {
                  Haptics.selectionAsync();
                  setActiveTab(tab);
                }}
                style={styles.tabItem}
              >
                <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab.toUpperCase()}</Text>
                {active && <View style={[styles.tabUnderline, { backgroundColor: team.color }]} />}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Tab Content ── */}
      <View style={{ flex: 1 }}>
        {renderTab()}
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  hero: { paddingHorizontal: 16, paddingBottom: 20 },
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  backBtn: { width: 38, height: 38, alignItems: "center", justifyContent: "center", borderRadius: 10, backgroundColor: "rgba(0,0,0,0.25)" },
  followBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, backgroundColor: "rgba(0,0,0,0.35)", borderWidth: 1.5, borderColor: "rgba(255,255,255,0.3)" },
  followText: { color: "#fff", fontSize: 13, fontWeight: "700", fontFamily: "Inter_600SemiBold" },
  playerIdentity: { flexDirection: "row", alignItems: "flex-start", gap: 14 },
  headshotImg: {
    width: 80, height: 80, borderRadius: 40,
    borderWidth: 2, flexShrink: 0,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  playerAvatar: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, flexShrink: 0,
  },
  avatarInitial: { color: "#fff", fontSize: 32, fontWeight: "900", fontFamily: "Inter_700Bold" },
  playerName: { color: "#fff", fontSize: 24, fontWeight: "900", fontFamily: "Inter_700Bold", lineHeight: 28 },
  teamLink: { color: "rgba(255,255,255,0.75)", fontSize: 13, fontFamily: "Inter_500Medium", marginTop: 2 },
  infoPill: { backgroundColor: "rgba(0,0,0,0.3)", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  infoPillText: { color: "rgba(255,255,255,0.8)", fontSize: 11, fontFamily: "Inter_500Medium" },
  tabBar: { borderBottomWidth: 1, borderBottomColor: C.separator, backgroundColor: C.backgroundSecondary },
  tabScroll: { paddingHorizontal: 8 },
  tabItem: { alignItems: "center", paddingHorizontal: 14, paddingVertical: 12 },
  tabText: { color: C.textTertiary, fontSize: 12, fontWeight: "700", letterSpacing: 0.8, fontFamily: "Inter_600SemiBold" },
  tabTextActive: { color: C.text },
  tabUnderline: { position: "absolute", bottom: 0, left: 8, right: 8, height: 2.5, borderRadius: 2 },
});

const bio = StyleSheet.create({
  card: { backgroundColor: C.card, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: C.cardBorder },
  text: { color: C.textSecondary, fontSize: 14, lineHeight: 21, fontFamily: "Inter_400Regular" },
});

const table = StyleSheet.create({
  card: { backgroundColor: C.card, borderRadius: 14, overflow: "hidden", borderWidth: 1, borderColor: C.cardBorder },
  title: { color: C.textTertiary, fontSize: 11, fontWeight: "800", letterSpacing: 1, padding: 12, paddingBottom: 8, backgroundColor: C.backgroundSecondary },
  header: { flexDirection: "row", paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.separator },
  headerCell: { color: C.textTertiary, fontSize: 10, fontWeight: "800", letterSpacing: 0.8 },
  row: { flexDirection: "row", paddingHorizontal: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: "rgba(80,77,71,0.12)" },
  cell: { color: C.textSecondary, fontSize: 13, fontFamily: "Inter_400Regular" },
});

const bioTab = StyleSheet.create({
  name: { color: C.text, fontSize: 22, fontWeight: "900", fontFamily: "Inter_700Bold", marginBottom: 4 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.separator },
  label: { color: C.textTertiary, fontSize: 13, fontFamily: "Inter_500Medium" },
  value: { color: C.text, fontSize: 14, fontFamily: "Inter_600SemiBold" },
  bioText: { color: C.textSecondary, fontSize: 14, lineHeight: 22, fontFamily: "Inter_400Regular", marginTop: 12 },
});
