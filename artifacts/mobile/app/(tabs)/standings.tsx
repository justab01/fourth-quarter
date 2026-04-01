import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  Platform, ActivityIndicator, Animated
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { api, StandingEntry } from "@/utils/api";
import { usePreferences } from "@/context/PreferencesContext";
import { goToTeam } from "@/utils/navHelpers";
import { TeamLogo } from "@/components/GameCard";
import { SearchButton } from "@/components/SearchButton";

const C = Colors.dark;

const LEAGUE_META: Record<string, { color: string; label: string }> = {
  NBA:   { color: C.nba,       label: "NBA" },
  NFL:   { color: C.nfl,       label: "NFL" },
  MLB:   { color: C.mlb,       label: "MLB" },
  MLS:   { color: C.mls,       label: "MLS" },
  NHL:   { color: C.nhl,       label: "NHL" },
  WNBA:  { color: C.wnba,      label: "WNBA" },
  NCAAB: { color: C.ncaab,     label: "NCAAB" },
  EPL:   { color: C.eplBright, label: "EPL" },
  UCL:   { color: C.ucl,       label: "UCL" },
  LIGA:  { color: C.liga,      label: "La Liga" },
};

// ─── Playoff zone definitions ─────────────────────────────────────────────────
interface Zone {
  label: string;
  shortLabel: string;
  color: string;
  upTo: number;
}

const ZONE_CONFIGS: Record<string, Zone[]> = {
  NBA: [
    { label: "Playoffs", shortLabel: "PLAYOFFS", color: C.accentGreen, upTo: 6 },
    { label: "Play-In Tournament", shortLabel: "PLAY-IN", color: C.accentGold, upTo: 10 },
    { label: "Out", shortLabel: "OUT", color: C.textTertiary, upTo: 999 },
  ],
  NHL: [
    { label: "Playoffs", shortLabel: "PLAYOFFS", color: C.accentGreen, upTo: 8 },
    { label: "Out", shortLabel: "OUT", color: C.textTertiary, upTo: 999 },
  ],
  MLB: [
    { label: "Postseason", shortLabel: "POSTSEASON", color: C.accentGreen, upTo: 6 },
    { label: "Wildcard Race", shortLabel: "WILDCARD", color: C.accentGold, upTo: 9 },
    { label: "Out", shortLabel: "OUT", color: C.textTertiary, upTo: 999 },
  ],
  MLS: [
    { label: "Playoffs", shortLabel: "PLAYOFFS", color: C.accentGreen, upTo: 9 },
    { label: "Out", shortLabel: "OUT", color: C.textTertiary, upTo: 999 },
  ],
  WNBA: [
    { label: "Playoffs", shortLabel: "PLAYOFFS", color: C.accentGreen, upTo: 8 },
    { label: "Out", shortLabel: "OUT", color: C.textTertiary, upTo: 999 },
  ],
  EPL: [
    { label: "Champions League", shortLabel: "UCL", color: C.ucl, upTo: 4 },
    { label: "Europa League", shortLabel: "UEL", color: C.accentGold, upTo: 6 },
    { label: "Conference League", shortLabel: "UECL", color: "#2CC4BF", upTo: 7 },
    { label: "Safe", shortLabel: "", color: "transparent", upTo: 17 },
    { label: "Relegation", shortLabel: "REL", color: C.live, upTo: 999 },
  ],
  LIGA: [
    { label: "Champions League", shortLabel: "UCL", color: C.ucl, upTo: 4 },
    { label: "Europa League", shortLabel: "UEL", color: C.accentGold, upTo: 6 },
    { label: "Safe", shortLabel: "", color: "transparent", upTo: 17 },
    { label: "Relegation", shortLabel: "REL", color: C.live, upTo: 999 },
  ],
};

function getZoneForRank(league: string, rank: number): Zone | null {
  const zones = ZONE_CONFIGS[league];
  if (!zones) return null;
  return zones.find(z => rank <= z.upTo) ?? null;
}

function isZoneBoundary(league: string, rank: number): { zone: Zone; prevZone: Zone | null } | null {
  const zones = ZONE_CONFIGS[league];
  if (!zones) return null;
  for (let i = 0; i < zones.length; i++) {
    if (rank === zones[i].upTo + 1 && i + 1 < zones.length) {
      return { zone: zones[i + 1], prevZone: zones[i] };
    }
  }
  return null;
}

// ─── Zone separator ───────────────────────────────────────────────────────────
function ZoneSeparator({ zone, prevZone }: { zone: Zone; prevZone: Zone | null }) {
  if (!zone.shortLabel) return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: C.separator }} />;
  return (
    <View style={zoneSep.container}>
      {prevZone && prevZone.color !== "transparent" && (
        <View style={[zoneSep.dot, { backgroundColor: prevZone.color }]} />
      )}
      <View style={[zoneSep.line, { backgroundColor: zone.color !== "transparent" ? `${zone.color}40` : C.separator }]} />
      {zone.shortLabel ? (
        <View style={[zoneSep.labelBg, { backgroundColor: `${zone.color}20`, borderColor: `${zone.color}40` }]}>
          <Text style={[zoneSep.labelText, { color: zone.color }]}>{zone.shortLabel}</Text>
        </View>
      ) : null}
      <View style={[zoneSep.line, { backgroundColor: zone.color !== "transparent" ? `${zone.color}40` : C.separator }]} />
    </View>
  );
}

const zoneSep = StyleSheet.create({
  container: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 5 },
  line: { flex: 1, height: 1 },
  dot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  labelBg: {
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 5,
    marginHorizontal: 8, borderWidth: 1,
  },
  labelText: { fontSize: 9, fontWeight: "900", letterSpacing: 0.8 },
});

// ─── Zone indicator bar ───────────────────────────────────────────────────────
function ZoneBar({ league, rank }: { league: string; rank: number }) {
  const zone = getZoneForRank(league, rank);
  if (!zone || zone.color === "transparent") return null;
  return <View style={[zBar.bar, { backgroundColor: zone.color }]} />;
}

const zBar = StyleSheet.create({
  bar: { position: "absolute", left: 0, top: 6, bottom: 6, width: 3, borderRadius: 2 },
});

// ─── Streak badge ─────────────────────────────────────────────────────────────
function StreakBadge({ streak }: { streak: string | null }) {
  if (!streak) return null;
  const isWin = streak.startsWith("W");
  const num = parseInt(streak.slice(1));
  const hot = isWin && num >= 5;
  const cold = !isWin && num >= 5;
  return (
    <View style={[streakS.pill,
      hot ? streakS.hot : cold ? streakS.cold :
      { backgroundColor: isWin ? `${C.accentGreen}18` : `${C.live}14` }
    ]}>
      {hot && <Ionicons name="flame" size={8} color={C.accentGold} />}
      <Text style={[streakS.text, { color: isWin ? C.accentGreen : C.live }]}>
        {isWin ? "W" : "L"}{num}
      </Text>
    </View>
  );
}

const streakS = StyleSheet.create({
  pill: { flexDirection: "row", alignItems: "center", gap: 2, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5 },
  text: { fontSize: 11, fontWeight: "800", letterSpacing: 0.3 },
  hot: { backgroundColor: `${C.accentGold}25`, borderWidth: 1, borderColor: `${C.accentGold}40` },
  cold: { backgroundColor: `${C.live}18`, borderWidth: 1, borderColor: `${C.live}30` },
});

// ─── Rank change ──────────────────────────────────────────────────────────────
function RankChange({ delta }: { delta: number | null }) {
  if (!delta || delta === 0) return <View style={{ width: 10 }} />;
  return (
    <Ionicons
      name={delta > 0 ? "caret-up" : "caret-down"}
      size={9}
      color={delta > 0 ? C.accentGreen : C.live}
    />
  );
}

// ─── Top movers bar ───────────────────────────────────────────────────────────
function TopMovers({ standings }: { standings: StandingEntry[] }) {
  const hotStreak = standings.filter(e => e.streak?.startsWith("W") && parseInt(e.streak.slice(1)) >= 3)
    .sort((a, b) => parseInt(b.streak!.slice(1)) - parseInt(a.streak!.slice(1)))[0];
  const coldStreak = standings.filter(e => e.streak?.startsWith("L") && parseInt(e.streak.slice(1)) >= 3)
    .sort((a, b) => parseInt(b.streak!.slice(1)) - parseInt(a.streak!.slice(1)))[0];
  if (!hotStreak && !coldStreak) return null;
  return (
    <View style={moverS.row}>
      {hotStreak && (
        <View style={moverS.chip}>
          <Ionicons name="flame" size={11} color={C.accentGold} />
          <Text style={moverS.chipText} numberOfLines={1}>
            {hotStreak.teamName.split(" ").slice(-1)[0]} {hotStreak.streak}
          </Text>
        </View>
      )}
      {coldStreak && (
        <View style={[moverS.chip, { borderColor: `${C.live}40`, backgroundColor: `${C.live}12` }]}>
          <Ionicons name="trending-down" size={11} color={C.live} />
          <Text style={[moverS.chipText, { color: C.live }]} numberOfLines={1}>
            {coldStreak.teamName.split(" ").slice(-1)[0]} {coldStreak.streak}
          </Text>
        </View>
      )}
    </View>
  );
}

const moverS = StyleSheet.create({
  row: { flexDirection: "row", gap: 8, marginBottom: 10 },
  chip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: `${C.accentGold}12`, borderWidth: 1, borderColor: `${C.accentGold}40`,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10,
  },
  chipText: { color: C.accentGold, fontSize: 12, fontWeight: "700" },
});

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function StandingsScreen() {
  const insets = useSafeAreaInsets();
  const { preferences } = usePreferences();

  const supportedLeagues = ["NBA", "NHL", "NFL", "MLB", "NCAAB", "MLS", "WNBA", "EPL", "UCL", "LIGA"];
  const myLeagues = preferences.favoriteLeagues.filter(l => supportedLeagues.includes(l));
  const defaultLeague = myLeagues[0] ?? "NBA";
  const [activeLeague, setActiveLeague] = useState(defaultLeague);
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 + 84 : insets.bottom + 72;

  const { data, isLoading } = useQuery({
    queryKey: ["standings", activeLeague],
    queryFn: () => api.getStandings(activeLeague),
    staleTime: 120000,
  });

  const standings = data?.standings ?? [];
  const leagueMeta = LEAGUE_META[activeLeague] ?? { color: C.accent, label: activeLeague };
  const hasGamesBack = standings.some(e => e.gamesBack !== null);
  const hasZones = !!ZONE_CONFIGS[activeLeague];
  const isSoccer = ["EPL", "UCL", "LIGA", "MLS"].includes(activeLeague);
  const hasDraws = standings.some(e => e.draws != null && e.draws > 0);
  const hasDiff = standings.some(e => e.differential != null);
  const hasPoints = standings.some(e => e.points != null);
  const hasHomeAway = standings.some(e => e.homeRecord != null);

  function getWhyItMatters(entry: typeof standings[number], idx: number): string | null {
    const zone = getZoneForRank(activeLeague, entry.rank);
    const nextZone = getZoneForRank(activeLeague, entry.rank + 1);
    const prevEntry = standings[idx - 1];
    const nextEntry = standings[idx + 1];

    if (zone && zone.shortLabel === "PLAYOFFS" && nextZone && nextZone.shortLabel !== "PLAYOFFS") {
      return "On the playoff bubble — every game matters";
    }
    if (zone && zone.shortLabel === "PLAY-IN" && entry.rank >= 9 && entry.rank <= 10) {
      return "Play-In spot on the line";
    }
    if (zone && zone.shortLabel === "UCL" && entry.rank === 4) {
      return "Last Champions League spot";
    }
    if (zone && zone.shortLabel === "REL" && entry.rank >= 18) {
      return "In the relegation zone — must win";
    }
    if (entry.streak?.startsWith("W") && parseInt(entry.streak.slice(1)) >= 5) {
      return `On a ${entry.streak} hot streak`;
    }
    if (entry.streak?.startsWith("L") && parseInt(entry.streak.slice(1)) >= 5) {
      return `Struggling — ${entry.streak} cold streak`;
    }
    if (prevEntry && entry.gamesBack !== null && prevEntry.gamesBack !== null) {
      const gap = (entry.gamesBack ?? 0) - (prevEntry.gamesBack ?? 0);
      if (gap <= 0.5 && gap > 0) return `Just ${gap} ${isSoccer ? "pts" : "GB"} from moving up`;
    }
    return null;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: topPad, paddingBottom: botPad }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Standings</Text>
            <Text style={styles.subtitle}>{leagueMeta.label} · {new Date().getFullYear()}</Text>
          </View>
          <SearchButton />
        </View>

        {/* League tabs */}
        <ScrollView
          horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.leagueRow} style={styles.leagueScroll}
        >
          {supportedLeagues.map(l => {
            const active = activeLeague === l;
            const meta   = LEAGUE_META[l] ?? { color: C.accent };
            return (
              <Pressable key={l} onPress={() => setActiveLeague(l)}>
                <View style={[styles.chip, active && { borderColor: meta.color, backgroundColor: `${meta.color}18` }]}>
                  <Text style={[styles.chipText, active && { color: meta.color }]}>{l}</Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        {isLoading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={leagueMeta.color} size="large" />
          </View>
        ) : (
          <>
            {/* Top movers */}
            <TopMovers standings={standings} />

            {/* Zone legend */}
            {hasZones && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={legendS.row} style={{ marginBottom: 10 }}>
                {(ZONE_CONFIGS[activeLeague] ?? []).filter(z => z.shortLabel).map(z => (
                  <View key={z.shortLabel} style={[legendS.item, { backgroundColor: `${z.color}15`, borderColor: `${z.color}40` }]}>
                    <View style={[legendS.dot, { backgroundColor: z.color }]} />
                    <Text style={[legendS.label, { color: z.color }]}>{z.shortLabel}</Text>
                  </View>
                ))}
              </ScrollView>
            )}

            {/* Table */}
            <View style={styles.table}>
              {/* Table header */}
              <View style={[styles.tableHead, { borderBottomColor: `${leagueMeta.color}33` }]}>
                <Text style={styles.thRank}>#</Text>
                <Text style={styles.thTeam}>TEAM</Text>
                <Text style={styles.thStat}>W</Text>
                {hasDraws && <Text style={styles.thStat}>D</Text>}
                <Text style={styles.thStat}>L</Text>
                {hasPoints && <Text style={styles.thStat}>PTS</Text>}
                {hasGamesBack && !hasPoints && <Text style={styles.thStat}>GB</Text>}
                {hasDiff && <Text style={styles.thStat}>+/-</Text>}
                <Text style={styles.thStreak}>STK</Text>
              </View>

              {standings.map((entry, idx) => {
                const isMyTeam = preferences.favoriteTeams.includes(entry.teamName);
                const zone = getZoneForRank(activeLeague, entry.rank);
                const boundary = isZoneBoundary(activeLeague, entry.rank);
                const isExpanded = expandedTeam === entry.teamName;
                const winRate = entry.winPct;
                const barWidth = Math.max(2, winRate * 60);

                return (
                  <View key={entry.teamName}>
                    {/* Zone separator */}
                    {boundary && (
                      <ZoneSeparator zone={boundary.zone} prevZone={boundary.prevZone} />
                    )}

                    <Pressable
                      onPress={() => {
                        if (isExpanded) { setExpandedTeam(null); }
                        else { setExpandedTeam(entry.teamName); }
                      }}
                      onLongPress={() => goToTeam(entry.teamName, activeLeague)}
                      style={[
                        styles.tableRow,
                        idx < standings.length - 1 && !boundary && styles.tableRowBorder,
                        isMyTeam && styles.tableRowHighlight,
                      ]}
                    >
                      {isMyTeam && (
                        <LinearGradient
                          colors={[`${leagueMeta.color}16`, "transparent"]}
                          style={StyleSheet.absoluteFill}
                          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                        />
                      )}

                      {/* Zone color bar */}
                      {zone && zone.color !== "transparent" && (
                        <View style={[zBar.bar, { backgroundColor: isMyTeam ? leagueMeta.color : `${zone.color}80` }]} />
                      )}
                      {isMyTeam && <View style={[styles.myTeamBar, { backgroundColor: leagueMeta.color }]} />}

                      {/* Rank */}
                      <View style={styles.tdRank}>
                        <Text style={[styles.rankNum, isMyTeam && { color: leagueMeta.color, fontWeight: "800" }]}>
                          {entry.rank}
                        </Text>
                        <RankChange delta={entry.rankChange} />
                      </View>

                      {/* Team */}
                      <View style={styles.tdTeam}>
                        <TeamLogo
                          uri={entry.logoUrl}
                          name={entry.teamName}
                          size={30}
                          borderColor={isMyTeam ? `${leagueMeta.color}55` : "rgba(255,255,255,0.08)"}
                        />
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.teamText, isMyTeam && { color: C.text, fontWeight: "700" }]} numberOfLines={1}>
                            {entry.teamName}
                          </Text>
                          {entry.conference && (
                            <Text style={styles.conferenceText}>{entry.conference}</Text>
                          )}
                        </View>
                        {isMyTeam && <Ionicons name="star" size={10} color={leagueMeta.color} />}
                      </View>

                      {/* Stats */}
                      <Text style={[styles.tdStat, isMyTeam && { color: C.text }]}>{entry.wins}</Text>
                      {hasDraws && <Text style={[styles.tdStat, isMyTeam && { color: C.text }]}>{entry.draws ?? 0}</Text>}
                      <Text style={[styles.tdStat, isMyTeam && { color: C.text }]}>{entry.losses}</Text>
                      {hasPoints && (
                        <Text style={[styles.tdStat, { color: leagueMeta.color, fontWeight: "700" }]}>
                          {entry.points ?? 0}
                        </Text>
                      )}
                      {hasGamesBack && !hasPoints && (
                        <Text style={[styles.tdStat, { color: entry.gamesBack === 0 ? leagueMeta.color : C.textTertiary }]}>
                          {entry.gamesBack === 0 ? "—" : entry.gamesBack?.toFixed(1) ?? "—"}
                        </Text>
                      )}
                      {hasDiff && (
                        <Text style={[styles.tdStat, {
                          color: (entry.differential ?? 0) > 0 ? C.accentGreen : (entry.differential ?? 0) < 0 ? C.live : C.textTertiary
                        }]}>
                          {(entry.differential ?? 0) > 0 ? "+" : ""}{entry.differential ?? 0}
                        </Text>
                      )}
                      <View style={styles.tdStreak}>
                        <StreakBadge streak={entry.streak} />
                      </View>
                    </Pressable>

                    {/* Why It Matters context line */}
                    {(() => {
                      const wim = getWhyItMatters(entry, idx);
                      return wim ? (
                        <View style={styles.whyItMatters}>
                          <Ionicons name="information-circle" size={11} color={C.accent} />
                          <Text style={styles.wimText}>{wim}</Text>
                        </View>
                      ) : null;
                    })()}

                    {/* Expanded detail row */}
                    {isExpanded && (
                      <View style={styles.expandedRow}>
                        <View style={styles.expandedInner}>
                          <View style={styles.expandedStat}>
                            <Text style={styles.expandedStatLabel}>W-L%</Text>
                            <Text style={[styles.expandedStatVal, { color: leagueMeta.color }]}>
                              {entry.winPct.toFixed(3)}
                            </Text>
                          </View>
                          {entry.homeRecord && (
                            <View style={styles.expandedStat}>
                              <Text style={styles.expandedStatLabel}>HOME</Text>
                              <Text style={styles.expandedStatVal}>{entry.homeRecord}</Text>
                            </View>
                          )}
                          {entry.awayRecord && (
                            <View style={styles.expandedStat}>
                              <Text style={styles.expandedStatLabel}>AWAY</Text>
                              <Text style={styles.expandedStatVal}>{entry.awayRecord}</Text>
                            </View>
                          )}
                          {entry.pointsFor != null && (
                            <View style={styles.expandedStat}>
                              <Text style={styles.expandedStatLabel}>{isSoccer ? "GF" : "PF"}</Text>
                              <Text style={styles.expandedStatVal}>{entry.pointsFor}</Text>
                            </View>
                          )}
                          {entry.pointsAgainst != null && (
                            <View style={styles.expandedStat}>
                              <Text style={styles.expandedStatLabel}>{isSoccer ? "GA" : "PA"}</Text>
                              <Text style={styles.expandedStatVal}>{entry.pointsAgainst}</Text>
                            </View>
                          )}
                          <View style={styles.expandedStat}>
                            <Text style={styles.expandedStatLabel}>STREAK</Text>
                            <StreakBadge streak={entry.streak} />
                          </View>
                          {zone && zone.shortLabel && (
                            <View style={styles.expandedStat}>
                              <Text style={styles.expandedStatLabel}>STATUS</Text>
                              <View style={[legendS.item, { backgroundColor: `${zone.color}15`, borderColor: `${zone.color}40` }]}>
                                <View style={[legendS.dot, { backgroundColor: zone.color }]} />
                                <Text style={[legendS.label, { color: zone.color }]}>{zone.shortLabel}</Text>
                              </View>
                            </View>
                          )}
                          <Pressable style={[styles.expandedBtn, { borderColor: leagueMeta.color }]}
                            onPress={() => goToTeam(entry.teamName, activeLeague)}>
                            <Text style={[styles.expandedBtnText, { color: leagueMeta.color }]}>Team Page</Text>
                            <Ionicons name="chevron-forward" size={12} color={leagueMeta.color} />
                          </Pressable>
                        </View>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>

            {/* Legend */}
            <View style={styles.legend}>
              <Ionicons name="information-circle-outline" size={13} color={C.textTertiary} />
              <Text style={styles.legendText}>
                Tap a row to expand · Long-press to open team page
                {preferences.favoriteTeams.length > 0 ? " · ★ your teams highlighted" : ""}
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const legendS = StyleSheet.create({
  row: { gap: 6, paddingRight: 16 },
  item: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  label: { fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  scroll: { paddingHorizontal: 20, gap: 4 },

  header: {
    paddingTop: 16, paddingBottom: 8,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  title: { fontSize: 32, fontWeight: "900", color: C.text, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  subtitle: { fontSize: 12, color: C.textTertiary, fontFamily: "Inter_400Regular", marginTop: 2 },
  leagueDot: { width: 10, height: 10, borderRadius: 5 },

  leagueScroll: { marginBottom: 12 },
  leagueRow: { gap: 8, paddingRight: 20 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 22,
    backgroundColor: C.card, borderWidth: 1.5, borderColor: C.cardBorder,
  },
  chipText: { color: C.textSecondary, fontSize: 13, fontWeight: "800", letterSpacing: 0.4 },

  loading: { paddingVertical: 80, alignItems: "center" },

  table: {
    backgroundColor: C.card, borderRadius: 18, overflow: "hidden",
    borderWidth: 1, borderColor: C.cardBorder,
  },
  tableHead: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 14, paddingVertical: 10,
    borderBottomWidth: 1.5,
    backgroundColor: "rgba(255,255,255,0.025)",
  },
  thRank: { width: 42, color: C.textTertiary, fontSize: 9, fontWeight: "900", letterSpacing: 1.2, paddingLeft: 6 },
  thTeam: { flex: 1, color: C.textTertiary, fontSize: 9, fontWeight: "900", letterSpacing: 1.2 },
  thStat: { width: 36, textAlign: "center", color: C.textTertiary, fontSize: 9, fontWeight: "900", letterSpacing: 1.2 },
  thStreak: { width: 44, textAlign: "center", color: C.textTertiary, fontSize: 9, fontWeight: "900", letterSpacing: 1.2 },

  tableRow: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 14, paddingVertical: 12,
    position: "relative", overflow: "hidden", minHeight: 50,
  },
  tableRowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.separator },
  tableRowHighlight: {},
  myTeamBar: { position: "absolute", left: 0, top: 8, bottom: 8, width: 3, borderRadius: 2 },

  tdRank: { width: 42, flexDirection: "row", alignItems: "center", gap: 2, paddingLeft: 4 },
  rankNum: { color: C.textSecondary, fontSize: 14, fontWeight: "600", fontFamily: "Inter_600SemiBold", minWidth: 20 },

  tdTeam: { flex: 1, flexDirection: "row", alignItems: "center", gap: 9 },
  teamText: { color: C.textSecondary, fontSize: 13, fontFamily: "Inter_500Medium", flex: 1 },
  conferenceText: { color: C.textTertiary, fontSize: 10 },

  tdStat: { width: 36, textAlign: "center", color: C.textTertiary, fontSize: 13, fontFamily: "Inter_400Regular" },
  tdStreak: { width: 44, alignItems: "center" },

  whyItMatters: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 14, paddingVertical: 6,
    backgroundColor: `${Colors.dark.accent}08`,
  },
  wimText: { color: Colors.dark.accent, fontSize: 11, fontFamily: "Inter_400Regular", fontStyle: "italic" },

  expandedRow: {
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.separator,
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  expandedInner: {
    flexDirection: "row", alignItems: "center", flexWrap: "wrap",
    paddingHorizontal: 14, paddingVertical: 10, gap: 12,
  },
  expandedStat: { alignItems: "center", gap: 4 },
  expandedStatLabel: { color: C.textTertiary, fontSize: 9, fontWeight: "900", letterSpacing: 1 },
  expandedStatVal: { fontSize: 15, fontWeight: "800", fontFamily: "Inter_700Bold" },
  expandedBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8,
    borderWidth: 1, marginLeft: "auto",
  },
  expandedBtnText: { fontSize: 12, fontWeight: "700" },

  legend: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 12 },
  legendText: { color: C.textTertiary, fontSize: 11, fontFamily: "Inter_400Regular", flex: 1 },
});
