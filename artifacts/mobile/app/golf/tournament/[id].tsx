import React, { useMemo, useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { SportFloatingNav, SPORT_NAV_CLEARANCE } from "@/components/SportFloatingNav";
import { FONTS } from "@/constants/typography";
import { api, type GolfLeaderboardEntry, type GolfRoundScorecard } from "@/utils/api";
import { AppHeader } from "@/components/AppHeader";

const P = { ink: "#2C3E50", inkDeep: "#1E2D38", paper: "#F4F1EC", pearl: "#E8DED6", sage: "#C8CDC7", green: "#315847", sand: "#C9B48B", live: "#A3424F", white: "#FFFFFF", muted: "#6C777B", line: "rgba(44,62,80,.14)" };
type Tab = "Board" | "Scorecards" | "Course";

const initials = (name: string) => name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();

function PlayerImage({ entry, size = 42 }: { entry: GolfLeaderboardEntry; size?: number }) {
  return entry.headshotUrl ? (
    <Image source={{ uri: entry.headshotUrl }} style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: P.sage }} />
  ) : (
    <View style={[styles.avatarFallback, { width: size, height: size, borderRadius: size / 2 }]}><Text style={styles.avatarInitials}>{initials(entry.name)}</Text></View>
  );
}

function RoundCard({ round }: { round: GolfRoundScorecard }) {
  return (
    <View style={styles.roundCard}>
      <View style={styles.roundHeader}>
        <View>
          <Text style={styles.roundEyebrow}>ROUND {round.round}</Text>
          <Text style={styles.roundTitle}>{round.complete ? "Complete" : round.holesCompleted > 0 ? `${round.holesCompleted} holes played` : "Not started"}</Text>
        </View>
        <View style={styles.roundTotal}><Text style={styles.roundScore}>{round.score ?? "—"}</Text><Text style={styles.roundStrokes}>{round.totalStrokes ?? "—"} strokes</Text></View>
      </View>
      {round.holes.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scorecardRail}>
          {round.holes.map((hole) => {
            const under = hole.scoreToPar != null && hole.scoreToPar < 0;
            const over = hole.scoreToPar != null && hole.scoreToPar > 0;
            return (
              <View key={`${round.round}-${hole.playingOrder}-${hole.hole}`} style={styles.holeColumn}>
                <Text style={styles.holeLabel}>{hole.hole}</Text>
                <View style={[styles.holeScore, under && styles.holeScoreUnder, over && styles.holeScoreOver]}>
                  <Text style={[styles.holeScoreText, (under || over) && { color: P.white }]}>{hole.displayStrokes ?? "—"}</Text>
                </View>
                <Text style={styles.holeRelative}>{hole.scoreLabel ?? ""}</Text>
              </View>
            );
          })}
        </ScrollView>
      ) : <Text style={styles.noRoundData}>No verified hole scores have been published for this round.</Text>}
    </View>
  );
}

export default function GolfTournamentRoom() {
  const { id, tour } = useLocalSearchParams<{ id: string; tour?: string }>();
  const [tab, setTab] = useState<Tab>("Board");
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["golf-tournament", id, tour],
    queryFn: () => api.getGolfTournament(id!, tour === "LPGA" || tour === "LIV" ? tour : "PGA"),
    enabled: Boolean(id),
    staleTime: 25_000,
    refetchInterval: 25_000,
  });
  const event = data?.tournament;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = useMemo(() => event?.leaderboard.find((entry) => entry.athleteId === selectedId) ?? event?.leaderboard[0] ?? null, [event?.leaderboard, selectedId]);

  if (isLoading) return <View style={styles.root}><AppHeader mode="destination" theme="light" eyebrow={tour ?? "Golf"} title="Tournament Room" onBack={() => router.back()} /><View style={styles.center}><ActivityIndicator color={P.green} /><Text style={styles.centerText}>Opening the Tournament Room…</Text></View></View>;
  if (!event || error) return (
    <View style={styles.root}>
      <AppHeader mode="destination" theme="light" eyebrow={tour ?? "Golf"} title="Tournament Room" onBack={() => router.back()} actions={[{ icon: "refresh", label: "Retry", onPress: () => refetch() }]} />
      <View style={styles.center}>
        <Ionicons name="cloud-offline-outline" size={34} color={P.green} />
        <Text style={styles.errorTitle}>Tournament data is unavailable</Text>
        <Pressable onPress={() => refetch()} style={styles.retry}><Text style={styles.retryText}>Try again</Text></Pressable>
      </View>
    </View>
  );

  const live = ["live", "playoff", "delayed", "suspended"].includes(event.status.state);
  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <AppHeader
        mode="destination"
        theme="light"
        eyebrow={`${event.tour} · ${event.status.label}`}
        title="Tournament Room"
        subtitle={event.name}
        onBack={() => router.back()}
        actions={[{ icon: "refresh", label: "Refresh tournament", onPress: () => refetch() }]}
      />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: SPORT_NAV_CLEARANCE + 38 }}>
        <LinearGradient colors={[P.green, P.inkDeep]} style={styles.hero}>
          <View style={styles.heroStatusRow}>
            <View style={[styles.statusPill, live && styles.statusPillLive]}>{live ? <View style={styles.liveDot} /> : null}<Text style={styles.statusText}>{event.status.label.toUpperCase()}</Text></View>
            <Text style={styles.heroTour}>{event.tour} · ROUND {event.status.round ?? "—"}</Text>
          </View>
          <Text style={styles.heroTitle}>{event.name}</Text>
          <Text style={styles.heroVenue}>{[event.venue, event.location].filter(Boolean).join(" · ")}</Text>
          <View style={styles.heroFacts}>
            <View style={styles.heroFact}><Text style={styles.heroFactValue}>{event.leaderboard[0]?.score ?? "—"}</Text><Text style={styles.heroFactLabel}>LEADING</Text></View>
            <View style={styles.heroFact}><Text style={styles.heroFactValue}>{event.leaderboard.length}</Text><Text style={styles.heroFactLabel}>PLAYERS</Text></View>
            <View style={styles.heroFact}><Text style={styles.heroFactValue}>{event.coverage.scorecards ? "YES" : "NO"}</Text><Text style={styles.heroFactLabel}>SCORECARDS</Text></View>
          </View>
        </LinearGradient>

        <View style={styles.tabs}>
          {(["Board", "Scorecards", "Course"] as Tab[]).map((item) => <Pressable key={item} onPress={() => setTab(item)} style={[styles.tab, tab === item && styles.tabActive]}><Text style={[styles.tabText, tab === item && styles.tabTextActive]}>{item}</Text></Pressable>)}
        </View>

        {tab === "Board" ? (
          <View style={styles.content}>
            <View style={styles.sectionHeading}><Text style={styles.eyebrow}>COMPLETE LIVE BOARD</Text><Text style={styles.sectionTitle}>Every verified position</Text></View>
            <View style={styles.board}>
              {event.leaderboard.map((entry, index) => (
                <Pressable key={`${entry.athleteId ?? entry.name}-${index}`} style={[styles.boardRow, selected?.athleteId === entry.athleteId && styles.boardRowSelected]} onPress={() => { setSelectedId(entry.athleteId); setTab("Scorecards"); }}>
                  <Text style={styles.boardPosition}>{entry.positionLabel}</Text>
                  <PlayerImage entry={entry} />
                  <View style={{ flex: 1, minWidth: 0 }}><Text style={styles.boardName} numberOfLines={1}>{entry.name}</Text><Text style={styles.boardMeta}>{entry.country || event.tour} · {entry.state === "active" ? entry.thru === "F" ? "Round complete" : entry.thru === "-" ? "Not started" : `Thru ${entry.thru}` : entry.state.replaceAll("_", " ")}</Text></View>
                  <Text style={styles.boardToday}>{entry.today}</Text>
                  <Text style={styles.boardScore}>{entry.score}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        {tab === "Scorecards" ? (
          <View style={styles.content}>
            {selected ? (
              <>
                <View style={styles.selectedPlayer}><PlayerImage entry={selected} size={58} /><View style={{ flex: 1 }}><Text style={styles.selectedEyebrow}>SELECTED SCORECARD</Text><Text style={styles.selectedName}>{selected.name}</Text><Text style={styles.selectedMeta}>{selected.positionLabel} · {selected.score} total · {selected.today} today</Text></View><Pressable onPress={() => selected.athleteId ? router.push({ pathname: "/player/[id]", params: { id: `${event.tour}-${selected.athleteId}` } } as any) : undefined} style={styles.profileButton}><Ionicons name="person-outline" size={18} color={P.green} /></Pressable></View>
                {selected.rounds.map((round) => <RoundCard key={round.round} round={round} />)}
              </>
            ) : <Text style={styles.noRoundData}>No player scorecards are available.</Text>}
          </View>
        ) : null}

        {tab === "Course" ? (
          <View style={styles.content}>
            <View style={styles.courseCard}>
              <Ionicons name="map-outline" size={30} color={P.sand} />
              <Text style={styles.courseTitle}>{event.venue || "Course Atlas"}</Text>
              <Text style={styles.courseText}>Open the full course route for verified venue information. Hole geometry and shot trails appear only when a licensed feed supplies them.</Text>
              <Pressable onPress={() => router.push({ pathname: "/golf/course/[id]", params: { id: event.id, name: event.venue, tournament: event.name, tour: event.tour } } as any)} style={styles.courseButton}><Text style={styles.courseButtonText}>Explore Course Atlas</Text><Ionicons name="arrow-forward" size={17} color={P.ink} /></Pressable>
            </View>
          </View>
        ) : null}

        <View style={styles.sourceNote}><Ionicons name="shield-checkmark-outline" size={17} color={P.green} /><Text style={styles.sourceText}>{event.provenance.provider} · {event.provenance.stale ? "Delayed snapshot" : "Current snapshot"} · {new Date(event.provenance.sourceTimestamp).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</Text></View>
      </ScrollView>
      <SportFloatingNav active="sports" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: P.paper }, center: { flex: 1, backgroundColor: P.paper, alignItems: "center", justifyContent: "center", padding: 28, gap: 12 }, centerText: { fontFamily: FONTS.bodyMedium, fontSize: 12, color: P.muted }, errorTitle: { fontFamily: FONTS.display, fontSize: 23, color: P.ink }, retry: { minHeight: 44, borderRadius: 22, paddingHorizontal: 18, backgroundColor: P.green, justifyContent: "center" }, retryText: { fontFamily: FONTS.bodyBold, color: P.paper },
  hero: { paddingHorizontal: 20, paddingBottom: 25, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 }, heroNav: { height: 62, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, iconButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center" }, roomLabel: { fontFamily: FONTS.monoBold, fontSize: 9, letterSpacing: 1.7, color: P.sage }, heroStatusRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 10 }, statusPill: { paddingHorizontal: 9, paddingVertical: 6, borderRadius: 13, backgroundColor: "rgba(255,255,255,.13)", flexDirection: "row", alignItems: "center", gap: 6 }, statusPillLive: { backgroundColor: "rgba(163,66,79,.7)" }, liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: P.white }, statusText: { fontFamily: FONTS.monoBold, fontSize: 8, letterSpacing: 1, color: P.white }, heroTour: { fontFamily: FONTS.monoBold, fontSize: 8, letterSpacing: 1.1, color: P.sage }, heroTitle: { fontFamily: FONTS.display, fontSize: 34, lineHeight: 39, color: P.white, marginTop: 16 }, heroVenue: { fontFamily: FONTS.body, fontSize: 11, color: P.sage, marginTop: 7 }, heroFacts: { flexDirection: "row", marginTop: 23, gap: 8 }, heroFact: { flex: 1, minHeight: 70, borderRadius: 18, backgroundColor: "rgba(255,255,255,.1)", alignItems: "center", justifyContent: "center" }, heroFactValue: { fontFamily: FONTS.display, fontSize: 22, color: P.white }, heroFactLabel: { fontFamily: FONTS.mono, fontSize: 6.5, letterSpacing: 1, color: P.sage, marginTop: 2 },
  tabs: { marginHorizontal: 20, marginTop: 18, backgroundColor: P.pearl, borderRadius: 22, padding: 4, flexDirection: "row" }, tab: { flex: 1, minHeight: 40, borderRadius: 18, alignItems: "center", justifyContent: "center" }, tabActive: { backgroundColor: P.white }, tabText: { fontFamily: FONTS.bodyBold, fontSize: 10, color: P.muted }, tabTextActive: { color: P.green }, content: { paddingHorizontal: 20, paddingTop: 27 }, sectionHeading: { marginBottom: 13 }, eyebrow: { fontFamily: FONTS.monoBold, fontSize: 8, letterSpacing: 1.4, color: P.green }, sectionTitle: { fontFamily: FONTS.display, fontSize: 25, color: P.ink, marginTop: 4 }, board: { borderRadius: 22, overflow: "hidden", borderWidth: 1, borderColor: P.line }, boardRow: { minHeight: 66, paddingHorizontal: 10, flexDirection: "row", alignItems: "center", gap: 9, backgroundColor: P.white, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: P.line }, boardRowSelected: { backgroundColor: P.pearl }, boardPosition: { width: 29, textAlign: "center", fontFamily: FONTS.monoBold, fontSize: 11, color: P.green }, avatarFallback: { backgroundColor: P.pearl, borderWidth: 1, borderColor: P.line, alignItems: "center", justifyContent: "center" }, avatarInitials: { fontFamily: FONTS.monoBold, fontSize: 9, color: P.green }, boardName: { fontFamily: FONTS.bodyBold, fontSize: 12, color: P.ink }, boardMeta: { fontFamily: FONTS.body, fontSize: 8.5, color: P.muted, marginTop: 3, textTransform: "capitalize" }, boardToday: { width: 35, fontFamily: FONTS.monoBold, fontSize: 9, color: P.green, textAlign: "right" }, boardScore: { width: 43, fontFamily: FONTS.display, fontSize: 19, color: P.ink, textAlign: "right" },
  selectedPlayer: { minHeight: 92, borderRadius: 22, backgroundColor: P.pearl, padding: 14, flexDirection: "row", alignItems: "center", gap: 12 }, selectedEyebrow: { fontFamily: FONTS.monoBold, fontSize: 7, letterSpacing: 1.2, color: P.green }, selectedName: { fontFamily: FONTS.display, fontSize: 23, color: P.ink, marginTop: 3 }, selectedMeta: { fontFamily: FONTS.body, fontSize: 9.5, color: P.muted, marginTop: 3 }, profileButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: P.white, alignItems: "center", justifyContent: "center" }, roundCard: { marginTop: 14, borderRadius: 22, backgroundColor: P.white, borderWidth: 1, borderColor: P.line, padding: 15 }, roundHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, roundEyebrow: { fontFamily: FONTS.monoBold, fontSize: 8, letterSpacing: 1.2, color: P.green }, roundTitle: { fontFamily: FONTS.display, fontSize: 20, color: P.ink, marginTop: 3 }, roundTotal: { alignItems: "flex-end" }, roundScore: { fontFamily: FONTS.display, fontSize: 23, color: P.green }, roundStrokes: { fontFamily: FONTS.mono, fontSize: 7, color: P.muted }, scorecardRail: { gap: 9, paddingTop: 18, paddingBottom: 5 }, holeColumn: { width: 35, alignItems: "center", gap: 5 }, holeLabel: { fontFamily: FONTS.monoBold, fontSize: 8, color: P.muted }, holeScore: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: P.line, backgroundColor: P.paper, alignItems: "center", justifyContent: "center" }, holeScoreUnder: { backgroundColor: P.green, borderColor: P.green }, holeScoreOver: { backgroundColor: P.live, borderColor: P.live }, holeScoreText: { fontFamily: FONTS.monoBold, fontSize: 10, color: P.ink }, holeRelative: { fontFamily: FONTS.mono, fontSize: 7, color: P.muted }, noRoundData: { fontFamily: FONTS.body, fontSize: 11, lineHeight: 16, color: P.muted, marginTop: 15 },
  courseCard: { minHeight: 290, borderRadius: 26, backgroundColor: P.ink, padding: 22, justifyContent: "flex-end" }, courseTitle: { fontFamily: FONTS.display, fontSize: 30, lineHeight: 35, color: P.white, marginTop: 18 }, courseText: { fontFamily: FONTS.body, fontSize: 11, lineHeight: 17, color: P.sage, marginTop: 9 }, courseButton: { minHeight: 48, borderRadius: 24, backgroundColor: P.sand, paddingHorizontal: 17, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 21 }, courseButtonText: { fontFamily: FONTS.bodyBold, fontSize: 11, color: P.ink }, sourceNote: { marginHorizontal: 20, marginTop: 28, padding: 14, borderRadius: 18, backgroundColor: P.pearl, flexDirection: "row", alignItems: "center", gap: 9 }, sourceText: { flex: 1, fontFamily: FONTS.mono, fontSize: 8, color: P.muted },
});
