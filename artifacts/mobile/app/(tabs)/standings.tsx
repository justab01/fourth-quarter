import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  Platform, Animated, Image
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import Colors from "@/constants/colors";
import { FONTS } from "@/constants/typography";
import { api, StandingEntry, TournamentRound, TournamentMatchup } from "@/utils/api";
import { usePreferences } from "@/context/PreferencesContext";
import { goToTeam } from "@/utils/navHelpers";
import { TeamLogo } from "@/components/GameCard";
import { SearchButton } from "@/components/SearchButton";
import { ProfileButton } from "@/components/ProfileButton";

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

const STANDING_SPORT_TABS = [
  { league: "NBA", label: "NBA", views: ["East", "West", "Playoff Picture"] },
  { league: "MLB", label: "MLB", views: ["AL", "NL", "Divisions", "Wild Card"] },
  { league: "NFL", label: "NFL", views: ["AFC", "NFC", "Divisions", "Wild Card"] },
  { league: "WNBA", label: "WNBA", views: ["Overall", "Playoff Picture"] },
  { league: "NHL", label: "NHL", views: ["East", "West", "Divisions", "Wild Card"] },
  { league: "EPL", label: "Soccer", views: ["Table", "Top 4", "Relegation", "My Club"] },
];

function getStandingSportTab(league: string) {
  return STANDING_SPORT_TABS.find((tab) => tab.league === league) ?? STANDING_SPORT_TABS[0];
}

function getStructureTabs(league: string) {
  return getStandingSportTab(league).views;
}

function conferenceMatches(conference: string | null, view: string) {
  const text = (conference ?? "").toLowerCase();
  const target = view.toLowerCase();
  if (target === "east") return text.includes("east");
  if (target === "west") return text.includes("west");
  if (target === "afc") return text.includes("afc") || text.includes("american");
  if (target === "nfc") return text.includes("nfc") || text.includes("national");
  if (target === "al") return text.includes("american") || text === "al";
  if (target === "nl") return text.includes("national") || text === "nl";
  return false;
}

function getDisplayConferences(league: string, view: string, conferences: (string | null)[]) {
  if (["East", "West", "AFC", "NFC", "AL", "NL"].includes(view)) {
    const match = conferences.find((conf) => conferenceMatches(conf, view));
    return match ? [match] : conferences;
  }
  if (league === "WNBA" || ["Table", "Top 4", "Relegation", "My Club", "Wild Card"].includes(view)) return [null];
  return conferences;
}

function applyStructureFilter(rows: StandingEntry[], view: string, favoriteTeams: string[]) {
  const ranked = [...rows].sort((a, b) => (a.playoffSeed ?? a.rank) - (b.playoffSeed ?? b.rank));
  if (view === "Top 4") return ranked.slice(0, 4);
  if (view === "Relegation") return ranked.slice(-5);
  if (view === "Wild Card") return ranked.slice(3, 10);
  if (view === "Playoff Picture") return ranked.slice(0, 10);
  if (view === "My Club") {
    const favorites = ranked.filter((entry) => favoriteTeams.includes(entry.teamName));
    if (favorites.length === 0) return ranked.slice(0, 4);
    const wanted = new Set<string>();
    favorites.forEach((favorite) => {
      [favorite.rank - 1, favorite.rank, favorite.rank + 1].forEach((rank) => {
        const row = ranked.find((entry) => entry.rank === rank);
        if (row) wanted.add(row.teamName);
      });
    });
    return ranked.filter((entry) => wanted.has(entry.teamName));
  }
  return rows;
}

function formatStandingPosition(entry: StandingEntry) {
  const rank = entry.playoffSeed ?? entry.rank;
  const suffix = rank % 10 === 1 && rank % 100 !== 11 ? "st"
    : rank % 10 === 2 && rank % 100 !== 12 ? "nd"
      : rank % 10 === 3 && rank % 100 !== 13 ? "rd"
        : "th";
  const area = entry.division || entry.conference;
  return `${rank}${suffix}${area ? ` ${area.replace(/conference|division/gi, "").trim()}` : ""}`;
}

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
  labelText: { fontSize: 9, fontWeight: "900", letterSpacing: 0.8, fontFamily: FONTS.bodyHeavy },
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
  text: { fontSize: 11, fontWeight: "800", letterSpacing: 0.3, fontFamily: FONTS.bodyBold },
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

// ─── Tournament Bracket ──────────────────────────────────────────────────────
function TournamentBracket({ rounds, color, show, onToggle }: {
  rounds: TournamentRound[];
  color: string;
  show: boolean;
  onToggle: () => void;
}) {
  if (rounds.length === 0) return null;
  const totalGames = rounds.reduce((n, r) => n + r.matchups.length, 0);
  const liveGames = rounds.reduce((n, r) => n + r.matchups.filter(m => m.status === "live").length, 0);

  return (
    <View style={trnS.container}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={show ? "Collapse tournament bracket" : "Expand tournament bracket"}
        accessibilityState={{ expanded: show }}
        onPress={onToggle}
        style={trnS.header}
      >
        <Ionicons name="trophy" size={16} color={color} />
        <Text style={[trnS.headerTitle, { color }]}>Tournament</Text>
        {liveGames > 0 && (
          <View style={trnS.liveBadge}>
            <View style={trnS.liveDot} />
            <Text style={trnS.liveText}>{liveGames} LIVE</Text>
          </View>
        )}
        <Text style={trnS.gameCount}>{totalGames} games</Text>
        <View style={{ flex: 1 }} />
        <Ionicons name={show ? "chevron-up" : "chevron-down"} size={14} color={color} />
      </Pressable>

      {show && rounds.map((round, ri) => (
        <View key={ri}>
          <View style={trnS.roundHeader}>
            <View style={[trnS.roundDot, { backgroundColor: color }]} />
            <Text style={trnS.roundName}>{round.name}</Text>
            <View style={[trnS.roundLine, { backgroundColor: `${color}30` }]} />
          </View>
          {round.matchups.map((m, mi) => (
            <TournamentMatchupRow key={mi} matchup={m} color={color} />
          ))}
        </View>
      ))}
    </View>
  );
}

function TournamentMatchupRow({ matchup: m, color }: { matchup: TournamentMatchup; color: string }) {
  const isLive = m.status === "live";
  const isDone = m.status === "finished";
  return (
    <View style={[trnS.matchup, isLive && { borderColor: `${C.live}40`, backgroundColor: `${C.live}08` }]}>
      <View style={trnS.matchupTeam}>
        {m.logo1 ? (
          <Image source={{ uri: m.logo1 }} style={trnS.matchupLogo} />
        ) : (
          <View style={[trnS.matchupLogo, { backgroundColor: C.card }]} />
        )}
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            {m.seed1 != null && <Text style={trnS.seed}>({m.seed1})</Text>}
            <Text style={[trnS.teamName, isDone && m.winner === m.team1 && { color: C.text, fontWeight: "700" }]} numberOfLines={1}>
              {m.team1}
            </Text>
          </View>
        </View>
        {m.score1 != null && (
          <Text style={[trnS.score, isDone && m.winner === m.team1 && { color: C.text, fontWeight: "800" }]}>
            {m.score1}
          </Text>
        )}
      </View>
      <View style={trnS.matchupDivider} />
      <View style={trnS.matchupTeam}>
        {m.logo2 ? (
          <Image source={{ uri: m.logo2 }} style={trnS.matchupLogo} />
        ) : (
          <View style={[trnS.matchupLogo, { backgroundColor: C.card }]} />
        )}
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            {m.seed2 != null && <Text style={trnS.seed}>({m.seed2})</Text>}
            <Text style={[trnS.teamName, isDone && m.winner === m.team2 && { color: C.text, fontWeight: "700" }]} numberOfLines={1}>
              {m.team2}
            </Text>
          </View>
        </View>
        {m.score2 != null && (
          <Text style={[trnS.score, isDone && m.winner === m.team2 && { color: C.text, fontWeight: "800" }]}>
            {m.score2}
          </Text>
        )}
      </View>
      {isLive && (
        <View style={trnS.liveIndicator}>
          <View style={trnS.liveDot} />
          <Text style={trnS.liveLabel}>LIVE</Text>
        </View>
      )}
      {isDone && (
        <View style={trnS.finalIndicator}>
          <Text style={trnS.finalLabel}>FINAL</Text>
        </View>
      )}
      {m.seriesStatus && (
        <View style={trnS.seriesStatusRow}>
          <Text style={trnS.seriesStatusText}>{m.seriesStatus}</Text>
        </View>
      )}
    </View>
  );
}

const trnS = StyleSheet.create({
  container: {
    backgroundColor: C.card, borderRadius: 16, overflow: "hidden",
    borderWidth: 1, borderColor: C.cardBorder, marginBottom: 12,
  },
  header: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 14, paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.separator,
  },
  headerTitle: { fontSize: 15, fontWeight: "900", letterSpacing: 0.3, fontFamily: FONTS.bodyHeavy },
  gameCount: { fontSize: 10, color: C.textTertiary, fontWeight: "700", fontFamily: FONTS.bodyMedium },
  liveBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: `${C.live}18`, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6,
  },
  liveDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: C.live },
  liveText: { fontSize: 9, fontWeight: "900", color: C.live, letterSpacing: 0.5, fontFamily: FONTS.bodyHeavy },
  roundHeader: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, backgroundColor: "rgba(255,255,255,0.02)",
  },
  roundDot: { width: 5, height: 5, borderRadius: 3 },
  roundName: { fontSize: 11, fontWeight: "800", color: C.textSecondary, letterSpacing: 0.3, fontFamily: FONTS.bodyBold },
  roundLine: { flex: 1, height: 1 },
  matchup: {
    marginHorizontal: 10, marginVertical: 4, borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.02)", borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.separator, overflow: "hidden",
  },
  matchupTeam: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 10, paddingVertical: 7,
  },
  matchupLogo: { width: 20, height: 20, borderRadius: 10 },
  seed: { fontSize: 10, color: C.textTertiary, fontWeight: "700", fontFamily: FONTS.bodyBold },
  teamName: { fontSize: 12, color: C.textSecondary, fontFamily: FONTS.bodyMedium, flex: 1 },
  score: { fontSize: 14, color: C.textTertiary, fontWeight: "700", fontFamily: FONTS.monoBold, minWidth: 24, textAlign: "right" },
  matchupDivider: { height: StyleSheet.hairlineWidth, backgroundColor: C.separator, marginHorizontal: 10 },
  liveIndicator: {
    position: "absolute", top: 4, right: 6, flexDirection: "row", alignItems: "center", gap: 3,
  },
  liveLabel: { fontSize: 8, fontWeight: "900", color: C.live, letterSpacing: 0.5, fontFamily: FONTS.bodyHeavy },
  finalIndicator: { position: "absolute", top: 6, right: 8 },
  finalLabel: { fontSize: 8, fontWeight: "800", color: C.textTertiary, letterSpacing: 0.5, fontFamily: FONTS.bodyBold },
  seriesStatusRow: { paddingHorizontal: 10, paddingBottom: 7, paddingTop: 0, alignItems: "center" },
  seriesStatusText: { fontSize: 9, color: C.textTertiary, fontWeight: "700", letterSpacing: 0.3, fontFamily: FONTS.bodyMedium },
});

// ─── NBA Playoff Bracket ──────────────────────────────────────────────────────
function FaceOffCard({
  matchup: m, color, size = "regular",
}: {
  matchup: TournamentMatchup; color: string; size?: "compact" | "regular" | "featured";
}) {
  const isLive = m.status === "live";
  const isDone = m.status === "finished";
  const t1wins = isDone && m.winner === m.team1;
  const t2wins = isDone && m.winner === m.team2;
  const hasScore = m.score1 != null;
  const lz = size === "compact" ? 28 : size === "featured" ? 52 : 40;
  const t1Nick = m.team1.split(" ").slice(-1)[0];
  const t2Nick = m.team2.split(" ").slice(-1)[0];

  return (
    <View style={[
      plS.faceCard,
      size === "compact" && plS.faceCardCompact,
      size === "featured" && plS.faceCardFeatured,
      isLive && { borderColor: `${C.live}55`, backgroundColor: `${C.live}07` },
    ]}>
      {/* Live pill */}
      {isLive && (
        <View style={plS.faceCornerPill}>
          <View style={plS.faceLiveDot} />
          <Text style={plS.faceLiveText}>LIVE</Text>
        </View>
      )}

      {/* Team 1 */}
      <View style={[plS.faceSide, !t1wins && isDone && plS.faceFaded]}>
        <View style={[plS.faceLogoRing, t1wins && { borderColor: `${color}70`, borderWidth: 2 }]}>
          {m.logo1
            ? <Image source={{ uri: m.logo1 }} style={{ width: lz, height: lz, borderRadius: lz / 2 }} />
            : <View style={{ width: lz, height: lz, borderRadius: lz / 2, backgroundColor: C.cardBorder }} />}
        </View>
        <Text style={[plS.faceNick, size === "compact" && { fontSize: 10 }, size === "featured" && { fontSize: 14 }, t1wins && { color: C.text, fontWeight: "800" }]} numberOfLines={1}>{t1Nick}</Text>
        {t1wins && (
          <View style={[plS.faceWonBadge, { borderColor: `${color}50` }]}>
            <Ionicons name="trophy" size={8} color={color} />
            <Text style={[plS.faceWonText, { color }]}>WON</Text>
          </View>
        )}
      </View>

      {/* Center score */}
      <View style={plS.faceCenter}>
        {hasScore ? (
          <>
            <View style={plS.faceScoreRow}>
              <Text style={[
                plS.faceScoreNum,
                size === "compact" && { fontSize: 22 },
                size === "featured" && { fontSize: 38 },
                t1wins && { color: C.text },
              ]}>{m.score1}</Text>
              <Text style={[plS.faceDash, size === "featured" && { fontSize: 22 }]}>–</Text>
              <Text style={[
                plS.faceScoreNum,
                size === "compact" && { fontSize: 22 },
                size === "featured" && { fontSize: 38 },
                t2wins && { color: C.text },
              ]}>{m.score2}</Text>
            </View>
            {m.seriesStatus && size !== "compact" && (
              <Text style={[plS.faceStatus, isDone && { color, opacity: 0.9 }]} numberOfLines={1}>
                {m.seriesStatus}
              </Text>
            )}
            {m.seriesStatus && size === "compact" && isDone && (
              <Ionicons name="checkmark-circle" size={13} color={color} style={{ marginTop: 2 }} />
            )}
          </>
        ) : (
          <Text style={plS.faceVs}>VS</Text>
        )}
      </View>

      {/* Team 2 */}
      <View style={[plS.faceSide, !t2wins && isDone && plS.faceFaded]}>
        <View style={[plS.faceLogoRing, t2wins && { borderColor: `${color}70`, borderWidth: 2 }]}>
          {m.logo2
            ? <Image source={{ uri: m.logo2 }} style={{ width: lz, height: lz, borderRadius: lz / 2 }} />
            : <View style={{ width: lz, height: lz, borderRadius: lz / 2, backgroundColor: C.cardBorder }} />}
        </View>
        <Text style={[plS.faceNick, size === "compact" && { fontSize: 10 }, size === "featured" && { fontSize: 14 }, t2wins && { color: C.text, fontWeight: "800" }]} numberOfLines={1}>{t2Nick}</Text>
        {t2wins && (
          <View style={[plS.faceWonBadge, { borderColor: `${color}50` }]}>
            <Ionicons name="trophy" size={8} color={color} />
            <Text style={[plS.faceWonText, { color }]}>WON</Text>
          </View>
        )}
      </View>
    </View>
  );
}

function ConferenceSection({ rounds, confLabel, accentColor, color }: {
  rounds: TournamentRound[]; confLabel: string; accentColor: string; color: string;
}) {
  if (rounds.length === 0) return null;
  const ROUND_LABEL: Record<string, string> = {
    "First Round": "FIRST ROUND",
    "Conference Semifinals": "SEMIFINALS",
    "Conference Finals": "CONF. FINALS",
  };
  const roundOrder = ["First Round", "Conference Semifinals", "Conference Finals"];
  const sorted = [...rounds].sort((a, b) => {
    const ai = roundOrder.findIndex(k => a.name.includes(k));
    const bi = roundOrder.findIndex(k => b.name.includes(k));
    return ai - bi;
  });
  return (
    <View style={plS.confSection}>
      <View style={[plS.confBanner, { borderLeftColor: accentColor }]}>
        <Text style={[plS.confLabel, { color: accentColor }]}>{confLabel}</Text>
        <View style={[plS.confBannerLine, { backgroundColor: `${accentColor}22` }]} />
      </View>
      {sorted.map((round, ri) => {
        const key = roundOrder.find(k => round.name.includes(k)) ?? "";
        const label = ROUND_LABEL[key] ?? round.name.toUpperCase();
        const allDone = round.matchups.every(m => !!m.winner);
        const hasLive = round.matchups.some(m => m.status === "live");
        const isR1 = key === "First Round";
        return (
          <View key={ri} style={[plS.roundGroup, ri < sorted.length - 1 && plS.roundGroupBorder]}>
            <View style={plS.roundLabelRow}>
              <Text style={[plS.roundLabelTxt, allDone && { color: C.textTertiary }]}>{label}</Text>
              {allDone && (
                <View style={plS.roundDoneTag}>
                  <Ionicons name="checkmark" size={8} color={C.textTertiary} />
                  <Text style={plS.roundDoneText}>DONE</Text>
                </View>
              )}
              {hasLive && (
                <View style={plS.roundLiveTag}>
                  <View style={plS.faceLiveDot} />
                  <Text style={plS.faceLiveText}>LIVE</Text>
                </View>
              )}
            </View>
            {isR1 ? (
              <View style={plS.r1Grid}>
                {round.matchups.map((m, mi) => (
                  <View key={mi} style={plS.r1Cell}>
                    <FaceOffCard matchup={m} color={color} size="compact" />
                  </View>
                ))}
              </View>
            ) : (
              <View style={{ gap: 8 }}>
                {round.matchups.map((m, mi) => (
                  <FaceOffCard key={mi} matchup={m} color={color} size="regular" />
                ))}
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

function NBAPlayoffView({ rounds, color }: { rounds: TournamentRound[]; color: string }) {
  const eastRounds = rounds.filter(r => r.name.startsWith("East"));
  const westRounds = rounds.filter(r => r.name.startsWith("West"));
  const finals = rounds.find(r => r.name === "NBA Finals");
  const liveCount = rounds.reduce((n, r) => n + r.matchups.filter(m => m.status === "live").length, 0);
  const totalActive = rounds.reduce((n, r) => n + r.matchups.filter(m => !m.winner).length, 0);
  return (
    <View>
      <View style={plS.bracketHeader}>
        <View style={plS.bracketTitleBlock}>
          <Ionicons name="trophy" size={20} color={color} />
          <View>
            <Text style={[plS.bracketTitle, { color }]}>NBA PLAYOFFS</Text>
            <Text style={plS.bracketSeason}>2025–26 Season</Text>
          </View>
        </View>
        <View style={{ gap: 5, alignItems: "flex-end" }}>
          {liveCount > 0 && (
            <View style={plS.bracketLiveChip}>
              <View style={plS.faceLiveDot} />
              <Text style={plS.faceLiveText}>{liveCount} LIVE</Text>
            </View>
          )}
          {totalActive > 0 && (
            <Text style={plS.bracketActiveText}>{totalActive} series active</Text>
          )}
        </View>
      </View>

      <ConferenceSection rounds={eastRounds} confLabel="EASTERN CONFERENCE" accentColor="#1D70B8" color={color} />
      <ConferenceSection rounds={westRounds} confLabel="WESTERN CONFERENCE" accentColor="#C8102E" color={color} />

      {finals && finals.matchups.length > 0 && (
        <View style={plS.finalsSection}>
          <View style={[plS.confBanner, { borderLeftColor: C.accentGold }]}>
            <Ionicons name="trophy" size={12} color={C.accentGold} />
            <Text style={[plS.confLabel, { color: C.accentGold }]}>NBA FINALS</Text>
            <View style={[plS.confBannerLine, { backgroundColor: `${C.accentGold}22` }]} />
          </View>
          {finals.matchups.map((m, i) => (
            <FaceOffCard key={i} matchup={m} color={C.accentGold} size="featured" />
          ))}
        </View>
      )}
    </View>
  );
}

const plS = StyleSheet.create({
  // Toggle
  toggle: {
    flexDirection: "row", backgroundColor: C.card,
    borderRadius: 11, padding: 3, marginBottom: 14,
    borderWidth: 1, borderColor: C.cardBorder,
  },
  toggleBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 5, paddingVertical: 9, borderRadius: 8,
  },
  toggleText: { fontSize: 11, fontWeight: "800", color: C.textSecondary, letterSpacing: 0.4, fontFamily: FONTS.bodyBold },

  // Bracket header
  bracketHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    marginBottom: 18, paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.separator,
  },
  bracketTitleBlock: { flexDirection: "row", alignItems: "center", gap: 10 },
  bracketTitle: { fontSize: 18, fontWeight: "900", letterSpacing: 0.4, fontFamily: FONTS.bodyHeavy },
  bracketSeason: { fontSize: 11, color: C.textTertiary, fontWeight: "700", fontFamily: FONTS.bodyMedium, marginTop: 1 },
  bracketLiveChip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: `${C.live}18`, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6,
  },
  bracketActiveText: { fontSize: 10, color: C.textTertiary, fontWeight: "700", fontFamily: FONTS.bodyMedium },

  // Conference section
  confSection: { marginBottom: 16 },
  confBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderLeftWidth: 3, paddingLeft: 10,
    marginBottom: 12,
  },
  confLabel: { fontSize: 11, fontWeight: "900", letterSpacing: 0.6, fontFamily: FONTS.bodyHeavy },
  confBannerLine: { flex: 1, height: 1 },

  // Round group
  roundGroup: { marginBottom: 12 },
  roundGroupBorder: { paddingBottom: 12 },
  roundLabelRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  roundLabelTxt: { fontSize: 10, fontWeight: "800", color: C.textSecondary, letterSpacing: 0.5, fontFamily: FONTS.bodyBold },
  roundDoneTag: {
    flexDirection: "row", alignItems: "center", gap: 3,
    backgroundColor: "rgba(255,255,255,0.06)", paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4,
  },
  roundDoneText: { fontSize: 8, fontWeight: "700", color: C.textTertiary, fontFamily: FONTS.bodyBold },
  roundLiveTag: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: `${C.live}18`, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4,
  },

  // R1 2-column grid
  r1Grid: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  r1Cell: { width: "48.5%" },

  // Face-off card
  faceCard: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: C.card, borderRadius: 14,
    borderWidth: 1, borderColor: C.cardBorder,
    paddingHorizontal: 10, paddingVertical: 14,
  },
  faceCardCompact: { paddingHorizontal: 6, paddingVertical: 10, borderRadius: 11 },
  faceCardFeatured: {
    paddingHorizontal: 14, paddingVertical: 20, borderRadius: 16,
    borderWidth: 1.5,
  },
  faceFaded: { opacity: 0.38 },
  faceCornerPill: {
    position: "absolute", top: 7, right: 8, zIndex: 2,
    flexDirection: "row", alignItems: "center", gap: 3,
    backgroundColor: `${C.live}20`, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4,
  },
  faceLiveDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: C.live },
  faceLiveText: { fontSize: 8, fontWeight: "900", color: C.live, letterSpacing: 0.5, fontFamily: FONTS.bodyHeavy },

  // Team side
  faceSide: { flex: 1, alignItems: "center", gap: 6 },
  faceLogoRing: { borderRadius: 99, borderWidth: 0, borderColor: "transparent", padding: 2 },
  faceNick: { fontSize: 12, fontWeight: "700", color: C.textSecondary, textAlign: "center", fontFamily: FONTS.bodyBold },
  faceWonBadge: {
    flexDirection: "row", alignItems: "center", gap: 3,
    borderWidth: 1, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  faceWonText: { fontSize: 8, fontWeight: "900", letterSpacing: 0.4, fontFamily: FONTS.bodyHeavy },

  // Center score
  faceCenter: { alignItems: "center", paddingHorizontal: 6, minWidth: 70 },
  faceScoreRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  faceScoreNum: {
    fontSize: 30, fontWeight: "900", color: C.textTertiary,
    fontFamily: FONTS.monoBold, minWidth: 24, textAlign: "center",
  },
  faceDash: { fontSize: 16, color: C.textTertiary, fontWeight: "300" },
  faceStatus: { fontSize: 10, color: C.textTertiary, fontWeight: "700", letterSpacing: 0.2, marginTop: 4, textAlign: "center", fontFamily: FONTS.bodyMedium },
  faceVs: { fontSize: 14, fontWeight: "900", color: C.textTertiary, letterSpacing: 1, fontFamily: FONTS.bodyHeavy },

  // Finals section
  finalsSection: { marginBottom: 8 },
});

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
          <TeamLogo uri={hotStreak.logoUrl} name={hotStreak.teamName} size={20} fontSize={8} />
          <Ionicons name="flame" size={11} color={C.accentGold} />
          <Text style={moverS.chipText} numberOfLines={1}>
            {hotStreak.teamName.split(" ").slice(-1)[0]} {hotStreak.streak}
          </Text>
        </View>
      )}
      {coldStreak && (
        <View style={[moverS.chip, { borderColor: `${C.live}40`, backgroundColor: `${C.live}12` }]}>
          <TeamLogo uri={coldStreak.logoUrl} name={coldStreak.teamName} size={20} fontSize={8} />
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
  chipText: { color: C.accentGold, fontSize: 12, fontWeight: "700", fontFamily: FONTS.bodyBold },
});

function MyTeamsStandingsStrip({
  standings,
  favoriteTeams,
  league,
  color,
}: {
  standings: StandingEntry[];
  favoriteTeams: string[];
  league: string;
  color: string;
}) {
  if (favoriteTeams.length === 0) return null;
  const rows = standings.filter((entry) => favoriteTeams.includes(entry.teamName)).slice(0, 3);
  return (
    <View style={myTeamS.card}>
      <View style={myTeamS.header}>
        <Ionicons name="heart" size={14} color={color} />
        <Text style={myTeamS.title}>MY TEAMS</Text>
      </View>
      {rows.length > 0 ? (
        <View style={myTeamS.row}>
          {rows.map((entry) => (
            <Pressable
              key={entry.teamName}
              accessibilityRole="button"
              accessibilityLabel={`Open ${entry.teamName}`}
              onPress={() => goToTeam(entry.teamName, league)}
              style={({ pressed }) => [myTeamS.pill, pressed && { opacity: 0.78 }]}
            >
              <TeamLogo uri={entry.logoUrl} name={entry.teamName} size={24} borderColor={`${color}55`} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={myTeamS.team} numberOfLines={1}>{entry.teamName}</Text>
                <Text style={[myTeamS.meta, { color }]} numberOfLines={1}>{formatStandingPosition(entry)}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      ) : (
        <Text style={myTeamS.empty}>None of your saved teams are in this standings board.</Text>
      )}
    </View>
  );
}

const myTeamS = StyleSheet.create({
  card: {
    gap: 8,
    padding: 11,
    marginBottom: 10,
    borderRadius: 16,
    backgroundColor: C.cardElevated,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  header: { flexDirection: "row", alignItems: "center", gap: 7 },
  title: { color: C.text, fontSize: 12, fontWeight: "900", fontFamily: FONTS.bodyHeavy },
  row: { gap: 7 },
  pill: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: C.glassLight,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  team: { color: C.text, fontSize: 12, fontWeight: "900", fontFamily: FONTS.bodyHeavy },
  meta: { fontSize: 11, fontWeight: "900", fontFamily: FONTS.bodyBold },
  empty: { color: C.textSecondary, fontSize: 12, fontFamily: FONTS.bodyMedium },
});

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function StandingsScreen() {
  const insets = useSafeAreaInsets();
  const { preferences } = usePreferences();
  const params = useLocalSearchParams<{ league?: string }>();

  const supportedLeagues = STANDING_SPORT_TABS.map((tab) => tab.league);
  const myLeagues = preferences.favoriteLeagues.filter(l => supportedLeagues.includes(l));
  const requestedLeague = typeof params.league === "string" && supportedLeagues.includes(params.league.toUpperCase())
    ? params.league.toUpperCase()
    : null;
  const defaultLeague = requestedLeague ?? myLeagues[0] ?? "NBA";
  const [activeLeague, setActiveLeague] = useState(defaultLeague);
  const [activeStructure, setActiveStructure] = useState<string | null>(null);
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);
  const [collapsedConfs, setCollapsedConfs] = useState<Set<string>>(new Set());
  const [showTournament, setShowTournament] = useState(true);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 + 84 : insets.bottom + 72;

  const { data, isLoading } = useQuery({
    queryKey: ["standings", activeLeague],
    queryFn: () => api.getStandings(activeLeague),
    staleTime: 120000,
  });

  const standings = data?.standings ?? [];
  const tournament = data?.tournament ?? [];
  const leagueMeta = LEAGUE_META[activeLeague] ?? { color: C.accent, label: activeLeague };
  const sportTab = getStandingSportTab(activeLeague);
  const structureTabs = getStructureTabs(activeLeague);
  const selectedStructure = activeStructure && structureTabs.includes(activeStructure)
    ? activeStructure
    : structureTabs[0];
  const hasGamesBack = standings.some(e => e.gamesBack !== null);
  const hasZones = !!ZONE_CONFIGS[activeLeague];
  const isSoccer = ["EPL", "UCL", "LIGA", "MLS"].includes(activeLeague);
  const hasDraws = standings.some(e => e.draws != null && e.draws > 0);
  const hasDiff = standings.some(e => e.differential != null);
  const hasPoints = standings.some(e => e.points != null);
  const hasHomeAway = standings.some(e => e.homeRecord != null);
  const hasConferences = standings.some(e => e.conference != null);
  const hasClinch = standings.some(e => e.clinched != null);
  const hasDivisions = standings.some(e => e.division != null && e.conference != null && e.division !== e.conference);
  const isNFL = activeLeague === "NFL";
  const conferences = hasConferences
    ? [...new Set(standings.map(e => e.conference).filter(Boolean))] as string[]
    : [null];
  const displayConferences = getDisplayConferences(activeLeague, selectedStructure, conferences);

  function getWhyItMatters(entry: typeof standings[number], idx: number, confEntries?: typeof standings): string | null {
    const relevantStandings = confEntries ?? standings;
    const zone = getZoneForRank(activeLeague, entry.rank);
    const nextZone = getZoneForRank(activeLeague, entry.rank + 1);
    const prevEntry = relevantStandings[idx - 1];
    const nextEntry = relevantStandings[idx + 1];

    if (entry.clinched === "y") return "Clinched division title";
    if (entry.clinched === "x") return "Clinched playoff berth";
    if (entry.clinched === "e") return "Eliminated from playoff contention";

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
            <Text style={styles.subtitle}>{sportTab.label} · {selectedStructure} · {new Date().getFullYear()}</Text>
          </View>
          <SearchButton />
          <ProfileButton />
        </View>

        {/* League tabs */}
        <ScrollView
          horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.leagueRow} style={styles.leagueScroll}
        >
          {STANDING_SPORT_TABS.map(tab => {
            const active = activeLeague === tab.league;
            const meta = LEAGUE_META[tab.league] ?? { color: C.accent };
            return (
              <Pressable
                key={tab.league}
                accessibilityRole="button"
                accessibilityLabel={`Show ${tab.label} standings`}
                accessibilityState={{ selected: active }}
                onPress={() => {
                  setActiveLeague(tab.league);
                  setActiveStructure(null);
                  setExpandedTeam(null);
                }}
              >
                <View style={[styles.chip, active && { borderColor: meta.color, backgroundColor: `${meta.color}18` }]}>
                  <Text style={[styles.chipText, active && { color: meta.color }]}>{tab.label}</Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.structureRow}
          style={styles.structureScroll}
        >
          {structureTabs.map((view) => {
            const active = selectedStructure === view;
            return (
              <Pressable
                key={`${activeLeague}-${view}`}
                accessibilityRole="button"
                accessibilityLabel={`Show ${view}`}
                accessibilityState={{ selected: active }}
                onPress={() => {
                  setActiveStructure(view);
                  setExpandedTeam(null);
                }}
                style={[
                  styles.structureChip,
                  active && { backgroundColor: `${leagueMeta.color}18`, borderColor: `${leagueMeta.color}44` },
                ]}
              >
                <Text style={[styles.structureText, active && { color: leagueMeta.color }]}>{view}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {isLoading ? (
          <View style={styles.loading}>
            {[0, 1, 2, 3, 4, 5].map(i => (
              <View key={i} style={styles.skeletonRow}>
                <View style={[styles.skeletonBox, { width: 24, height: 14 }]} />
                <View style={[styles.skeletonBox, { width: 24, height: 24, borderRadius: 12 }]} />
                <View style={[styles.skeletonBox, { flex: 1, height: 14 }]} />
                <View style={[styles.skeletonBox, { width: 30, height: 14 }]} />
                <View style={[styles.skeletonBox, { width: 30, height: 14 }]} />
              </View>
            ))}
          </View>
        ) : (
          <>
            <MyTeamsStandingsStrip
              standings={standings}
              favoriteTeams={preferences.favoriteTeams}
              league={activeLeague}
              color={leagueMeta.color}
            />

            {/* NBA: full playoff bracket */}
            {activeLeague === "NBA" && tournament.length > 0 && selectedStructure === "Playoff Picture" && (
              <NBAPlayoffView rounds={tournament} color={leagueMeta.color} />
            )}

            {/* Non-NBA: collapsible tournament bracket (NCAA) */}
            {activeLeague !== "NBA" && tournament.length > 0 && (
              <TournamentBracket
                rounds={tournament}
                color={leagueMeta.color}
                show={showTournament}
                onToggle={() => setShowTournament(prev => !prev)}
              />
            )}

            {(activeLeague !== "NBA" || tournament.length === 0 || selectedStructure !== "Playoff Picture") && <>
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

            {displayConferences.map(conf => {
              const filtered = conf ? standings.filter(e => e.conference === conf) : standings;
              const sortedStandings = [...filtered].sort((a, b) => {
                if (hasDivisions && a.division && b.division) {
                  if (a.division !== b.division) return a.division.localeCompare(b.division);
                }
                return (a.playoffSeed ?? a.rank) - (b.playoffSeed ?? b.rank);
              });
              const confStandings = applyStructureFilter(sortedStandings, selectedStructure, preferences.favoriteTeams);
              if (confStandings.length === 0) return null;
              const isCollapsed = conf ? collapsedConfs.has(conf) : false;
              const toggleConf = () => {
                if (!conf) return;
                setCollapsedConfs(prev => {
                  const next = new Set(prev);
                  if (next.has(conf)) next.delete(conf); else next.add(conf);
                  return next;
                });
              };
              const confTeamCount = confStandings.length;
              const confRecord = confStandings[0] ? `${confStandings[0].teamName.split(" ").slice(-1)[0]} leads` : "";
              return (
                <View key={conf ?? "all"}>
                  {conf && (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`${isCollapsed ? "Expand" : "Collapse"} ${conf} standings`}
                      accessibilityState={{ expanded: !isCollapsed }}
                      onPress={toggleConf}
                      style={styles.confHeader}
                    >
                      <View style={[styles.confDot, { backgroundColor: leagueMeta.color }]} />
                      <Text style={[styles.confTitle, { color: leagueMeta.color }]}>{conf}</Text>
                      <Text style={styles.confCount}>{confTeamCount} teams</Text>
                      <View style={styles.confLine} />
                      <Ionicons
                        name={isCollapsed ? "chevron-down" : "chevron-up"}
                        size={14} color={leagueMeta.color}
                      />
                    </Pressable>
                  )}

            {!isCollapsed && (
            <View style={styles.table}>
              {/* Table header */}
              <View style={[styles.tableHead, { borderBottomColor: `${leagueMeta.color}33` }]}>
                <Text style={styles.thRank}>#</Text>
                <Text style={styles.thTeam}>TEAM</Text>
                <Text style={styles.thStat}>W</Text>
                {hasDraws && <Text style={styles.thStat}>{isNFL ? "T" : "D"}</Text>}
                <Text style={styles.thStat}>L</Text>
                {hasPoints && <Text style={styles.thStat}>PTS</Text>}
                {hasGamesBack && !hasPoints && <Text style={styles.thStat}>GB</Text>}
                {hasDiff && <Text style={styles.thStat}>+/-</Text>}
                <Text style={styles.thStreak}>STK</Text>
              </View>

              {confStandings.map((entry, idx) => {
                const isMyTeam = preferences.favoriteTeams.includes(entry.teamName);
                const zone = getZoneForRank(activeLeague, entry.rank);
                const boundary = isZoneBoundary(activeLeague, entry.rank);
                const isExpanded = expandedTeam === entry.teamName;
                const winRate = entry.winPct;
                const barWidth = Math.max(2, winRate * 60);
                const prevEntry = confStandings[idx - 1];
                const showDivHeader = hasDivisions && entry.division &&
                  entry.division !== prevEntry?.division;

                return (
                  <View key={entry.teamName}>
                    {/* Division header for NFL-style standings */}
                    {showDivHeader && (
                      <View style={styles.divisionHeader}>
                        <View style={[styles.divisionDot, { backgroundColor: leagueMeta.color }]} />
                        <Text style={[styles.divisionTitle, { color: leagueMeta.color }]}>{entry.division}</Text>
                        <View style={styles.divisionLine} />
                      </View>
                    )}
                    {/* Zone separator */}
                    {boundary && (
                      <ZoneSeparator zone={boundary.zone} prevZone={boundary.prevZone} />
                    )}

                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`${isExpanded ? "Collapse" : "Expand"} ${entry.teamName} standings details`}
                      accessibilityHint="Long press to open the team page"
                      accessibilityState={{ expanded: isExpanded }}
                      onPress={() => {
                        if (isExpanded) { setExpandedTeam(null); }
                        else { setExpandedTeam(entry.teamName); }
                      }}
                      onLongPress={() => goToTeam(entry.teamName, activeLeague)}
                      style={[
                        styles.tableRow,
                        idx < confStandings.length - 1 && !boundary && styles.tableRowBorder,
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
                          {entry.playoffSeed ?? entry.rank}
                        </Text>
                        <RankChange delta={entry.rankChange} />
                      </View>

                      {/* Team */}
                      <View style={styles.tdTeam}>
                        <TeamLogo
                          uri={entry.logoUrl}
                          name={entry.teamName}
                          size={24}
                          borderColor={isMyTeam ? `${leagueMeta.color}55` : C.glassMedium}
                        />
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                            <Text style={[styles.teamText, isMyTeam && { color: C.text, fontWeight: "700" }]} numberOfLines={1}>
                              {entry.teamName}
                            </Text>
                            {entry.clinched && (
                              <View style={[styles.clinchBadge, { borderColor: `${leagueMeta.color}60` }]}>
                                <Text style={[styles.clinchText, { color: leagueMeta.color }]}>
                                  {entry.clinched === "y" ? "y" : entry.clinched === "x" ? "x" : entry.clinched === "e" ? "e" : entry.clinched}
                                </Text>
                              </View>
                            )}
                          </View>
                          {!hasConferences && entry.conference && (
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
                          {(entry.differential ?? 0) > 0 ? "+" : ""}{Number.isInteger(entry.differential ?? 0) ? (entry.differential ?? 0) : (entry.differential ?? 0).toFixed(1)}
                        </Text>
                      )}
                      <View style={styles.tdStreak}>
                        <StreakBadge streak={entry.streak} />
                      </View>
                    </Pressable>

                    {/* Why It Matters context line */}
                    {(() => {
                      const wim = getWhyItMatters(entry, idx, confStandings);
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
                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={`Open ${entry.teamName} team page`}
                            style={[styles.expandedBtn, { borderColor: leagueMeta.color }]}
                            onPress={() => goToTeam(entry.teamName, activeLeague)}
                          >
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
            )}
                </View>
              );
            })}

            {hasClinch && (
              <View style={styles.clinchLegend}>
                <Text style={styles.clinchLegendTitle}>CLINCH KEY</Text>
                <Text style={styles.clinchLegendItem}>x — Clinched playoff berth</Text>
                <Text style={styles.clinchLegendItem}>y — Clinched division title</Text>
                <Text style={styles.clinchLegendItem}>e — Eliminated</Text>
              </View>
            )}

            {/* Legend */}
            <View style={styles.legend}>
              <Ionicons name="information-circle-outline" size={13} color={C.textTertiary} />
              <Text style={styles.legendText}>
                Tap a row to expand · Long-press to open team page
                {preferences.favoriteTeams.length > 0 ? " · ★ your teams highlighted" : ""}
              </Text>
            </View>
            </>}
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
  label: { fontSize: 10, fontWeight: "800", letterSpacing: 0.5, fontFamily: FONTS.bodyBold },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  scroll: { paddingHorizontal: 16, gap: 4 },

  header: {
    paddingTop: 16, paddingBottom: 8,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  title: { fontSize: 30, fontWeight: "900", color: C.text, fontFamily: FONTS.bodyHeavy, letterSpacing: 0 },
  subtitle: { fontSize: 12, color: C.textTertiary, fontFamily: FONTS.bodyMedium, marginTop: 2 },
  leagueDot: { width: 10, height: 10, borderRadius: 5 },

  leagueScroll: { marginBottom: 12 },
  leagueRow: { gap: 8, paddingRight: 20 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 22,
    backgroundColor: C.card, borderWidth: 1.5, borderColor: C.cardBorder,
  },
  chipText: { color: C.textSecondary, fontSize: 13, fontWeight: "800", letterSpacing: 0.4, fontFamily: FONTS.bodyBold },
  structureScroll: { marginBottom: 10 },
  structureRow: { gap: 7, paddingRight: 20 },
  structureChip: {
    minHeight: 32,
    justifyContent: "center",
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: C.glassLight,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  structureText: { color: C.textSecondary, fontSize: 12, fontWeight: "900", fontFamily: FONTS.bodyBold },

  loading: { paddingVertical: 24, gap: 2 },
  skeletonRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.separator,
  },
  skeletonBox: {
    backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 6,
    height: 14,
  },

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
  thRank: { width: 30, color: C.textTertiary, fontSize: 9, fontWeight: "900", letterSpacing: 1.2, paddingLeft: 4, fontFamily: FONTS.bodyHeavy },
  thTeam: { flex: 1, color: C.textTertiary, fontSize: 9, fontWeight: "900", letterSpacing: 1.2, fontFamily: FONTS.bodyHeavy },
  thStat: { width: 32, textAlign: "center", color: C.textTertiary, fontSize: 9, fontWeight: "900", letterSpacing: 1.2, fontFamily: FONTS.bodyHeavy },
  thStreak: { width: 40, textAlign: "center", color: C.textTertiary, fontSize: 9, fontWeight: "900", letterSpacing: 1.2, fontFamily: FONTS.bodyHeavy },

  tableRow: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 14, paddingVertical: 12,
    position: "relative", overflow: "hidden", minHeight: 50,
  },
  tableRowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.separator },
  tableRowHighlight: {},
  myTeamBar: { position: "absolute", left: 0, top: 8, bottom: 8, width: 3, borderRadius: 2 },

  tdRank: { width: 30, flexDirection: "row", alignItems: "center", gap: 2, paddingLeft: 2 },
  rankNum: { color: C.textSecondary, fontSize: 13, fontWeight: "800", fontFamily: FONTS.monoBold, minWidth: 16 },

  tdTeam: { flex: 1, flexDirection: "row", alignItems: "center", gap: 7 },
  teamText: { color: C.textSecondary, fontSize: 13, fontFamily: FONTS.bodySemiBold, flex: 1 },
  conferenceText: { color: C.textTertiary, fontSize: 10, fontFamily: FONTS.bodyMedium },

  tdStat: { width: 32, textAlign: "center", color: C.textTertiary, fontSize: 12, fontFamily: FONTS.mono },
  tdStreak: { width: 40, alignItems: "center" },

  whyItMatters: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 14, paddingVertical: 6,
    backgroundColor: `${Colors.dark.accent}08`,
  },
  wimText: { color: Colors.dark.accent, fontSize: 11, fontFamily: FONTS.bodyMedium, fontStyle: "italic" },

  confHeader: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 16, paddingVertical: 12, marginTop: 12,
  },
  confDot: { width: 8, height: 8, borderRadius: 4 },
  confTitle: { fontSize: 14, fontWeight: "900", fontFamily: FONTS.bodyHeavy, letterSpacing: 0.5 },
  confLine: { flex: 1, height: 1, backgroundColor: C.separator },
  confCount: { fontSize: 10, color: C.textTertiary, fontWeight: "700", fontFamily: FONTS.bodyMedium, marginLeft: 4 },

  divisionHeader: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 16, paddingVertical: 8, marginTop: 6,
  },
  divisionDot: { width: 6, height: 6, borderRadius: 3 },
  divisionTitle: { fontSize: 11, fontWeight: "800", fontFamily: FONTS.bodyHeavy, letterSpacing: 0.8, textTransform: "uppercase" },
  divisionLine: { flex: 1, height: 1, backgroundColor: C.separator },

  clinchBadge: {
    borderWidth: 1, borderRadius: 4,
    paddingHorizontal: 3, paddingVertical: 0.5,
  },
  clinchText: { fontSize: 8, fontWeight: "900", fontFamily: FONTS.bodyHeavy },

  clinchLegend: {
    marginHorizontal: 16, marginTop: 12, padding: 12,
    backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth, borderColor: C.separator,
  },
  clinchLegendTitle: { fontSize: 10, fontWeight: "900", color: C.textSecondary, letterSpacing: 1, marginBottom: 6, fontFamily: FONTS.bodyHeavy },
  clinchLegendItem: { fontSize: 11, color: C.textTertiary, marginBottom: 2, fontFamily: FONTS.bodyMedium },

  expandedRow: {
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.separator,
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  expandedInner: {
    flexDirection: "row", alignItems: "center", flexWrap: "wrap",
    paddingHorizontal: 14, paddingVertical: 10, gap: 12,
  },
  expandedStat: { alignItems: "center", gap: 4 },
  expandedStatLabel: { color: C.textTertiary, fontSize: 9, fontWeight: "900", letterSpacing: 1, fontFamily: FONTS.bodyHeavy },
  expandedStatVal: { fontSize: 15, fontWeight: "800", fontFamily: FONTS.monoBold },
  expandedBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8,
    borderWidth: 1, marginLeft: "auto",
  },
  expandedBtnText: { fontSize: 12, fontWeight: "800", fontFamily: FONTS.bodyBold },

  legend: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 12 },
  legendText: { color: C.textTertiary, fontSize: 11, fontFamily: FONTS.bodyMedium, flex: 1 },
});
