import React, { useMemo } from "react";
import { View, Text, ScrollView, Pressable, Image, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import Colors from "@/constants/colors";
import { FONTS } from "@/constants/typography";
import { TeamLogo } from "@/components/GameCard";
import { SearchButton } from "@/components/SearchButton";
import { GameCardSkeleton } from "@/components/LoadingSkeleton";
import { resolveBallparkImage } from "@/constants/ballparks";
import type { Game, StandingEntry, SportNewsArticle } from "@/utils/api";

const C = Colors.dark;

type Athlete = { name: string; team?: string; stat?: string; position?: string; resolvedHeadshot?: string | null };

interface Props {
  sportName: string;
  accentColor: string;
  topInset: number;
  games: Game[];
  athletes: Athlete[];
  standings: StandingEntry[];
  news: SportNewsArticle[];
  leagues: { key: string; label: string }[];
  activeLeague: string;
  onSelectLeague: (key: string) => void;
  gamesLoading: boolean;
}

// MLB nicknames are one word except these; keep them intact.
function nickname(team: string): string {
  const t = (team ?? "").trim();
  if (/red sox$/i.test(t)) return "Red Sox";
  if (/white sox$/i.test(t)) return "White Sox";
  if (/blue jays$/i.test(t)) return "Blue Jays";
  return t.split(" ").slice(-1)[0] || t;
}

function firstPitch(startTime: string): string {
  if (!startTime) return "";
  const d = new Date(startTime);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function shortDivision(name: string | null): string {
  if (!name) return "";
  return name
    .replace(/American League/i, "AL")
    .replace(/National League/i, "NL")
    .trim()
    .toUpperCase();
}

function goToGame(id: string) {
  router.push({ pathname: "/game/[id]", params: { id } } as any);
}

// A scope chip is one of the sport's leagues (MLB / College).
function ScopeChip({ label, active, accentColor, onPress }: { label: string; active: boolean; accentColor: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active ? { backgroundColor: accentColor, borderColor: accentColor } : null]}>
      <Text style={[styles.chipText, active ? { color: "#fff" } : null]}>{label}</Text>
    </Pressable>
  );
}

function MarqueeCard({ game, accentColor }: { game: Game; accentColor: string }) {
  const park = resolveBallparkImage(game.venue);
  const live = game.status === "live";
  const finished = game.status === "finished";
  const eyebrow = live ? "LIVE" : finished ? "FINAL" : "MARQUEE";
  const rightText = live || finished
    ? `${game.awayScore ?? 0} — ${game.homeScore ?? 0}`
    : firstPitch(game.startTime);
  const stateLine = live ? (game.quarter || game.statusDetail || "In progress") : null;

  return (
    <Pressable onPress={() => goToGame(game.id)} style={styles.marquee}>
      {park ? (
        <Image source={park} style={StyleSheet.absoluteFill as any} resizeMode="cover" />
      ) : (
        <LinearGradient colors={["#1D3350", "#0F1F33"]} style={StyleSheet.absoluteFill as any} />
      )}
      <LinearGradient
        colors={["rgba(6,10,9,0.32)", "rgba(6,10,9,0.15)", "rgba(6,10,9,0.94)"]}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFill as any}
      />
      <View style={styles.marqueeTop}>
        <View style={styles.eyebrowPill}>
          {live && <View style={styles.liveDot} />}
          <Text style={styles.eyebrowText}>{eyebrow}</Text>
        </View>
        <Text style={[styles.marqueeRight, live && { color: C.accentGreen }]}>{rightText}</Text>
      </View>
      <View style={styles.marqueeBtm}>
        <View style={styles.marqueeTeams}>
          <TeamLogo uri={game.awayTeamLogo} name={game.awayTeam} size={30} />
          <Text style={styles.marqueeNm} numberOfLines={1}>{nickname(game.awayTeam)}</Text>
          <Text style={styles.marqueeAt}>at</Text>
          <TeamLogo uri={game.homeTeamLogo} name={game.homeTeam} size={30} />
          <Text style={styles.marqueeNm} numberOfLines={1}>{nickname(game.homeTeam)}</Text>
        </View>
        <View style={styles.marqueeVenue}>
          <Ionicons name="location-outline" size={12} color="#d7d2c7" />
          <Text style={styles.marqueeVenueText} numberOfLines={1}>{stateLine ?? game.venue ?? "Ballpark TBD"}</Text>
        </View>
      </View>
    </Pressable>
  );
}

function GameRow({ game, accentColor, last }: { game: Game; accentColor: string; last: boolean }) {
  const live = game.status === "live";
  const finished = game.status === "finished";
  return (
    <Pressable onPress={() => goToGame(game.id)} style={[styles.row, !last && styles.rowBorder]}>
      <View style={styles.rowLogos}>
        <TeamLogo uri={game.awayTeamLogo} name={game.awayTeam} size={28} />
        <View style={{ width: 28, marginLeft: -6 }}>
          <TeamLogo uri={game.homeTeamLogo} name={game.homeTeam} size={28} />
        </View>
      </View>
      <View style={styles.rowMid}>
        <Text style={styles.rowTeams} numberOfLines={1}>{nickname(game.awayTeam)} at {nickname(game.homeTeam)}</Text>
        <Text style={styles.rowMeta} numberOfLines={1}>{game.venue ?? ""}</Text>
      </View>
      <View style={styles.rowRight}>
        {live || finished ? (
          <>
            <Text style={[styles.rowScore, live && { color: C.accentGreen }]}>{game.awayScore ?? 0}–{game.homeScore ?? 0}</Text>
            <Text style={[styles.rowState, live && { color: C.accentGreen }]}>{live ? (game.quarter || "LIVE") : "FINAL"}</Text>
          </>
        ) : (
          <>
            <Text style={styles.rowScore}>{firstPitch(game.startTime)}</Text>
            <Text style={styles.rowState}>UPCOMING</Text>
          </>
        )}
      </View>
    </Pressable>
  );
}

function SectionHead({ title, action, accentColor, onAction }: { title: string; action?: string; accentColor: string; onAction?: () => void }) {
  return (
    <View style={styles.secHead}>
      <Text style={styles.secTitle}>{title}</Text>
      {action ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={[styles.secAction, { color: accentColor }]}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function BaseballSportHome({
  sportName, accentColor, topInset, games, athletes, standings, news, leagues, activeLeague, onSelectLeague, gamesLoading,
}: Props) {
  const liveGames = useMemo(() => games.filter((g) => g.status === "live"), [games]);
  const upcoming = useMemo(() => games.filter((g) => g.status === "upcoming"), [games]);
  // Marquee: whatever's live, else the next handful of games.
  const marquee = useMemo(
    () => (liveGames.length ? liveGames : upcoming.length ? upcoming : games).slice(0, 6),
    [liveGames, upcoming, games],
  );
  const marqueeLabel = liveGames.length ? "Live now" : "Today's marquee";

  const leaders = useMemo(
    () => standings.filter((e) => e.rank === 1 && e.division).slice(0, 6),
    [standings],
  );

  const dateLabel = useMemo(
    () => new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }),
    [],
  );

  return (
    <View style={[styles.root, { paddingTop: topInset + 4 }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 28 }}>
        {/* Header */}
        <View style={styles.headerBar}>
          <Pressable onPress={() => router.back()} style={styles.circleBtn} hitSlop={8}>
            <Ionicons name="chevron-back" size={22} color={C.text} />
          </Pressable>
          <SearchButton />
        </View>
        <View style={styles.titleBlock}>
          <View style={styles.titleRow}>
            <Ionicons name="baseball" size={25} color="#E9E3D6" />
            <Text style={styles.title}>{sportName}</Text>
          </View>
          <Text style={styles.subline}>
            {dateLabel} · <Text style={{ color: accentColor, fontFamily: FONTS.bodyBold }}>{games.length} {games.length === 1 ? "game" : "games"} today</Text>
          </Text>
        </View>

        {/* Scope */}
        <View style={styles.scopeRow}>
          {leagues.map((l) => (
            <ScopeChip
              key={l.key}
              label={l.key === "NCAABB" ? "College" : l.label}
              active={activeLeague === l.key || (activeLeague === "all" && l.key === leagues[0]?.key)}
              accentColor={accentColor}
              onPress={() => onSelectLeague(l.key)}
            />
          ))}
        </View>

        {/* Marquee carousel */}
        {gamesLoading ? (
          <View style={{ paddingHorizontal: 20, paddingTop: 12 }}><GameCardSkeleton /></View>
        ) : marquee.length > 0 ? (
          <>
            <SectionHead title={marqueeLabel} action="Live scores" accentColor={accentColor} onAction={() => router.push("/(tabs)/live" as any)} />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.rail}
              snapToInterval={312}
              decelerationRate="fast"
            >
              {marquee.map((g) => <MarqueeCard key={g.id} game={g} accentColor={accentColor} />)}
            </ScrollView>
          </>
        ) : null}

        {/* All games */}
        {games.length > 0 && (
          <>
            <SectionHead title="All games today" accentColor={accentColor} />
            <View style={styles.list}>
              {games.map((g, i) => <GameRow key={g.id} game={g} accentColor={accentColor} last={i === games.length - 1} />)}
            </View>
          </>
        )}

        {/* Division leaders */}
        {leaders.length > 0 && (
          <>
            <SectionHead title="Division leaders" action="Standings" accentColor={accentColor} onAction={() => router.push("/(tabs)/standings" as any)} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>
              {leaders.map((e) => (
                <View key={e.teamName} style={styles.leadCard}>
                  <Text style={[styles.leadDiv, { color: accentColor }]}>{shortDivision(e.division)}</Text>
                  <View style={styles.leadTeam}>
                    <TeamLogo uri={e.logoUrl} name={e.teamName} size={26} />
                    <Text style={styles.leadName} numberOfLines={1}>{nickname(e.teamName)}</Text>
                  </View>
                  <Text style={styles.leadRec}>{e.wins}–{e.losses} · {e.winPct.toFixed(3).replace(/^0/, "")}</Text>
                </View>
              ))}
            </ScrollView>
          </>
        )}

        {/* Athletes */}
        {athletes.length > 0 && (
          <>
            <SectionHead title="Athletes to watch" accentColor={accentColor} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>
              {athletes.slice(0, 6).map((a, i) => (
                <View key={a.name + i} style={styles.athCard}>
                  <View style={[styles.athRank, { backgroundColor: accentColor }]}>
                    <Text style={styles.athRankText}>#{i + 1}</Text>
                  </View>
                  {a.resolvedHeadshot ? (
                    <Image source={{ uri: a.resolvedHeadshot }} style={styles.athFace} />
                  ) : (
                    <View style={[styles.athFace, styles.athFaceFallback, { backgroundColor: accentColor + "22" }]}>
                      <Text style={[styles.athInitials, { color: accentColor }]}>{a.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}</Text>
                    </View>
                  )}
                  <Text style={styles.athName} numberOfLines={1}>{a.name}</Text>
                  {a.team ? <Text style={styles.athTeam} numberOfLines={1}>{a.team}</Text> : null}
                  {a.stat ? (
                    <View style={[styles.athStat, { backgroundColor: accentColor + "1F" }]}>
                      <Text style={[styles.athStatText, { color: accentColor }]} numberOfLines={2}>{a.stat}</Text>
                    </View>
                  ) : null}
                </View>
              ))}
            </ScrollView>
          </>
        )}

        {/* News */}
        {news.length > 0 && (
          <>
            <SectionHead title="Latest" accentColor={accentColor} />
            <View style={styles.list}>
              {news.slice(0, 8).map((n, i) => (
                <View key={n.id} style={[styles.newsRow, i < Math.min(news.length, 8) - 1 && styles.rowBorder]}>
                  <View style={[styles.newsDot, { backgroundColor: i === 0 ? C.accentGreen : C.textTertiary }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.newsText} numberOfLines={2}>{n.title}</Text>
                    <Text style={styles.newsMeta} numberOfLines={1}>
                      {n.publishedAt ? new Date(n.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}
                      {n.leagues?.length ? ` · ${n.leagues.join(", ")}` : ""}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background },

  headerBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 6 },
  circleBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.card, borderWidth: 1, borderColor: C.cardBorder, alignItems: "center", justifyContent: "center" },
  titleBlock: { paddingHorizontal: 20, paddingTop: 10 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 9 },
  title: { fontSize: 29, fontFamily: FONTS.bodyHeavy, color: C.text, letterSpacing: -0.3 },
  subline: { fontSize: 13, color: C.textSecondary, marginTop: 7, fontFamily: FONTS.bodyMedium },

  scopeRow: { flexDirection: "row", gap: 8, paddingHorizontal: 20, paddingTop: 14 },
  chip: { paddingHorizontal: 17, paddingVertical: 9, borderRadius: 22, backgroundColor: C.card, borderWidth: 1, borderColor: C.cardBorder },
  chipText: { fontSize: 13.5, fontFamily: FONTS.bodyBold, color: C.textSecondary },

  secHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", paddingHorizontal: 20, paddingTop: 20, paddingBottom: 11 },
  secTitle: { fontSize: 19, fontFamily: FONTS.bodyHeavy, color: C.text, letterSpacing: -0.2 },
  secAction: { fontSize: 13, fontFamily: FONTS.bodyBold },

  rail: { paddingHorizontal: 20, gap: 12 },

  marquee: { width: 300, height: 196, borderRadius: 20, overflow: "hidden", borderWidth: 1, borderColor: C.cardBorder, backgroundColor: "#15212C" },
  marqueeTop: { position: "absolute", top: 13, left: 15, right: 15, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  eyebrowPill: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(0,0,0,0.34)", paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20 },
  eyebrowText: { fontSize: 10, fontFamily: FONTS.bodyHeavy, letterSpacing: 1.3, color: "#fff" },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.accentGreen },
  marqueeRight: { fontFamily: FONTS.display, fontSize: 18, color: "#fff", letterSpacing: 0.5 },
  marqueeBtm: { position: "absolute", left: 15, right: 15, bottom: 14 },
  marqueeTeams: { flexDirection: "row", alignItems: "center", gap: 8 },
  marqueeNm: { fontSize: 15, fontFamily: FONTS.bodyHeavy, color: "#fff", maxWidth: 88 },
  marqueeAt: { fontSize: 11, color: "#cfcabf", fontFamily: FONTS.bodyBold },
  marqueeVenue: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 8 },
  marqueeVenueText: { fontSize: 12, color: "#d7d2c7", fontFamily: FONTS.bodyMedium, flex: 1 },

  list: { paddingHorizontal: 20 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
  rowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.separator },
  rowLogos: { flexDirection: "row", alignItems: "center" },
  rowMid: { flex: 1, minWidth: 0 },
  rowTeams: { fontSize: 14, fontFamily: FONTS.bodyBold, color: C.text },
  rowMeta: { fontSize: 11.5, color: C.textTertiary, marginTop: 2, fontFamily: FONTS.body },
  rowRight: { alignItems: "flex-end" },
  rowScore: { fontFamily: FONTS.display, fontSize: 15, color: C.text, letterSpacing: 0.5 },
  rowState: { fontSize: 9, fontFamily: FONTS.bodyHeavy, letterSpacing: 0.8, color: C.textTertiary, marginTop: 2 },

  leadCard: { width: 150, backgroundColor: C.card, borderWidth: 1, borderColor: C.cardBorder, borderRadius: 16, padding: 12 },
  leadDiv: { fontSize: 10, fontFamily: FONTS.bodyHeavy, letterSpacing: 1 },
  leadTeam: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 9 },
  leadName: { fontSize: 13.5, fontFamily: FONTS.bodyHeavy, color: C.text, flex: 1 },
  leadRec: { fontFamily: FONTS.display, fontSize: 13, color: C.textSecondary, marginTop: 6, letterSpacing: 0.5 },

  athCard: { width: 160, backgroundColor: C.card, borderWidth: 1, borderColor: C.cardBorder, borderRadius: 18, padding: 14, position: "relative" },
  athRank: { position: "absolute", top: 10, left: 10, paddingHorizontal: 8, paddingVertical: 1, borderRadius: 10, zIndex: 2 },
  athRankText: { fontFamily: FONTS.display, fontSize: 12, color: "#fff", letterSpacing: 0.5 },
  athFace: { width: 56, height: 56, borderRadius: 28, alignSelf: "center", marginTop: 6, marginBottom: 10, backgroundColor: C.separator },
  athFaceFallback: { alignItems: "center", justifyContent: "center" },
  athInitials: { fontSize: 18, fontFamily: FONTS.bodyHeavy },
  athName: { fontSize: 14, fontFamily: FONTS.bodyHeavy, color: C.text, textAlign: "center" },
  athTeam: { fontSize: 11.5, color: C.textTertiary, textAlign: "center", marginTop: 2 },
  athStat: { marginTop: 10, borderRadius: 10, paddingHorizontal: 9, paddingVertical: 7 },
  athStatText: { fontFamily: FONTS.display, fontSize: 12.5, letterSpacing: 0.3, textAlign: "center" },

  newsRow: { flexDirection: "row", gap: 11, paddingVertical: 12, alignItems: "flex-start" },
  newsDot: { width: 7, height: 7, borderRadius: 3.5, marginTop: 6 },
  newsText: { fontSize: 14, fontFamily: FONTS.bodyBold, color: C.text, lineHeight: 19 },
  newsMeta: { fontSize: 11.5, color: C.textTertiary, marginTop: 4, fontFamily: FONTS.body },
});
