import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Image, Animated } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import Colors from "@/constants/colors";
import { FONTS } from "@/constants/typography";
import { api, type Game, type StandingEntry, type TournamentRound, type TournamentMatchup, type TopAthlete, type DraftData } from "@/utils/api";
import { TeamLogo } from "@/components/GameCard";

const playerSlug = (name: string) => name.toLowerCase().replace(/\s+/g, "-");
// If we have a live ESPN athlete ID, deep-link via the canonical "LEAGUE-ID" format
// the player route understands; otherwise fall back to the slug for static lookup.
const goPlayer = (athlete: { name: string; athleteId: string | null; league: string }) => {
  const id = athlete.athleteId
    ? `${athlete.league.toUpperCase()}-${athlete.athleteId}`
    : playerSlug(athlete.name);
  router.push({
    pathname: "/player/[id]",
    params: athlete.athleteId
      ? { id, league: athlete.league.toUpperCase(), athleteId: athlete.athleteId }
      : { id },
  } as never);
};

const C = Colors.dark;

const LEAGUE_ACCENT: Record<string, string> = {
  NBA: "#C9082A",
  WNBA: "#FF6B35",
  NCAAB: "#003087",
  NCAAW: "#E31837",
};

const BASKETBALL_LEAGUES = ["NBA", "WNBA", "NCAAB", "NCAAW"] as const;

// Date the WNBA 2026 season opens (used as fallback if next-game query is empty)
const WNBA_OPENER_FALLBACK = new Date("2026-05-16T19:00:00-04:00");

type PanelKey = "all" | "NBA" | "WNBA" | "NCAAB" | "NCAAW";

interface Props {
  activeLeague: string; // "all" | "NBA" | "WNBA" | "NCAAB" | "NCAAW"
  todayDate: string;
}

export function BasketballHub({ activeLeague, todayDate }: Props) {
  const panel: PanelKey = (BASKETBALL_LEAGUES as readonly string[]).includes(activeLeague)
    ? (activeLeague as PanelKey)
    : "all";

  // Today's games across all 4 basketball leagues
  const { data: gamesData, isLoading: gamesLoading } = useQuery({
    queryKey: ["bball-hub-games", todayDate],
    queryFn: () => api.getGames("NBA,WNBA,NCAAB,NCAAW", todayDate),
    staleTime: 60_000,
  });

  const isBasketballLeague = (league: string): league is (typeof BASKETBALL_LEAGUES)[number] =>
    (BASKETBALL_LEAGUES as readonly string[]).includes(league);
  const allBballGames = (gamesData?.games ?? []).filter((g) => isBasketballLeague(g.league));

  // Smooth fade transition between panels
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [shownPanel, setShownPanel] = useState<PanelKey>(panel);
  useEffect(() => {
    if (panel === shownPanel) return;
    Animated.timing(fadeAnim, { toValue: 0, duration: 140, useNativeDriver: true }).start(() => {
      setShownPanel(panel);
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });
  }, [panel, shownPanel, fadeAnim]);

  return (
    <Animated.View style={[styles.root, { opacity: fadeAnim }]}>
      {shownPanel === "all" && <AllPanel games={allBballGames} loading={gamesLoading} />}
      {shownPanel === "NBA" && <NbaPanel games={allBballGames.filter((g) => g.league === "NBA")} loading={gamesLoading} />}
      {shownPanel === "WNBA" && <WnbaPanel />}
      {shownPanel === "NCAAB" && <NcaaMPanel />}
      {shownPanel === "NCAAW" && <NcaaWPanel />}
    </Animated.View>
  );
}

// Build a preview/seed bracket from current standings (used when no live tournament data)
function buildPreviewBracket(standings: StandingEntry[]): TournamentRound[] {
  if (!standings || standings.length === 0) return [];
  const east = standings.filter((s) => (s.conference ?? "").toLowerCase().includes("east"))
    .sort((a, b) => a.rank - b.rank).slice(0, 8);
  const west = standings.filter((s) => (s.conference ?? "").toLowerCase().includes("west"))
    .sort((a, b) => a.rank - b.rank).slice(0, 8);
  const pair = (top: StandingEntry[], confLabel: string): TournamentRound | null => {
    if (top.length < 2) return null;
    const matchups: TournamentMatchup[] = [];
    const mk = (i: number, j: number): TournamentMatchup | null => {
      const a = top[i], b = top[j];
      if (!a || !b) return null;
      return {
        seed1: i + 1, team1: a.teamName, logo1: a.logoUrl, score1: null,
        seed2: j + 1, team2: b.teamName, logo2: b.logoUrl, score2: null,
        status: "upcoming", winner: null,
      };
    };
    [[0, 7], [3, 4], [1, 6], [2, 5]].forEach(([i, j]) => {
      const m = mk(i, j); if (m) matchups.push(m);
    });
    return { name: `${confLabel} 1st Round`, matchups };
  };
  const rounds: TournamentRound[] = [];
  const e = pair(east, "East"); if (e) rounds.push(e);
  const w = pair(west, "West"); if (w) rounds.push(w);
  return rounds;
}

// ─────────────────────────────────────────────────────────────────────────────
// ALL PANEL
// ─────────────────────────────────────────────────────────────────────────────
function AllPanel({ games, loading }: { games: Game[]; loading: boolean }) {
  const live = games.filter((g) => g.status === "live");
  const upcoming = games.filter((g) => g.status === "upcoming");
  const stripGames = [...live, ...upcoming].slice(0, 8);

  // NBA standings + tournament for the Bracket / Standings sections
  const { data: nbaStandings, isLoading: standingsLoading, isError: standingsError } = useQuery({
    queryKey: ["bball-hub-standings", "NBA"],
    queryFn: () => api.getStandings("NBA"),
    staleTime: 5 * 60_000,
  });

  const { data: nbaTopAth, isLoading: topLoading, isError: topError } = useQuery({
    queryKey: ["bball-hub-top", "NBA"],
    queryFn: () => api.getTopAthletes("NBA", 8),
    staleTime: 5 * 60_000,
  });

  const tournamentRounds = nbaStandings?.tournament && nbaStandings.tournament.length > 0
    ? nbaStandings.tournament
    : buildPreviewBracket(nbaStandings?.standings ?? []);
  const bracketLabel = nbaStandings?.tournament && nbaStandings.tournament.length > 0
    ? "🏆 2026 NBA PLAYOFFS"
    : "🏆 2026 NBA PLAYOFF PICTURE";

  return (
    <>
      <SectionHeader
        leftAccent={C.live}
        leftText={live.length > 0 ? "LIVE NOW" : "TODAY"}
        rightText={games.length ? `${games.length} games` : undefined}
      />
      {loading ? (
        <SkeletonStrip />
      ) : stripGames.length === 0 ? (
        <EmptyMsg text="No basketball games today across any league." />
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.stripContent}
        >
          {stripGames.map((g) => (
            <GameStripCard key={g.id} game={g} />
          ))}
        </ScrollView>
      )}

      <SectionHeader leftText="🔥 PLAYERS TO WATCH" />
      {topLoading ? <SkeletonStrip narrow /> :
        topError ? <ErrorMsg text="Couldn't load top players." /> :
        <PlayerSpotlight athletes={nbaTopAth?.athletes ?? []} accent={LEAGUE_ACCENT.NBA} />}

      <SectionHeader leftText={bracketLabel} />
      {standingsLoading ? <SkeletonRows count={3} /> :
        standingsError ? <ErrorMsg text="Couldn't load playoff data." /> :
        <BracketSection rounds={tournamentRounds} accent={LEAGUE_ACCENT.NBA} />}

      <SectionHeader leftText="STANDINGS" />
      {standingsLoading ? <SkeletonRows count={6} /> :
        standingsError ? <ErrorMsg text="Couldn't load standings." /> :
        <ConferenceStandings standings={nbaStandings?.standings ?? []} league="NBA" />}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NBA PANEL
// ─────────────────────────────────────────────────────────────────────────────
function NbaPanel({ games, loading }: { games: Game[]; loading: boolean }) {
  const { data: standings, isLoading: stLoading, isError: stError } = useQuery({
    queryKey: ["bball-hub-standings", "NBA"],
    queryFn: () => api.getStandings("NBA"),
    staleTime: 5 * 60_000,
  });
  const { data: topAth, isLoading: topLoading, isError: topError } = useQuery({
    queryKey: ["bball-hub-top", "NBA"],
    queryFn: () => api.getTopAthletes("NBA", 8),
    staleTime: 5 * 60_000,
  });

  const live = games.filter((g) => g.status === "live");
  const upcoming = games.filter((g) => g.status === "upcoming").slice(0, 4);

  const tournamentRounds = standings?.tournament && standings.tournament.length > 0
    ? standings.tournament
    : buildPreviewBracket(standings?.standings ?? []);
  const isPreview = !standings?.tournament || standings.tournament.length === 0;

  return (
    <>
      <SectionHeader leftAccent={LEAGUE_ACCENT.NBA} leftText="NBA · TODAY" />
      {loading ? <SkeletonStrip /> :
       games.length === 0 ? <EmptyMsg text="No NBA games scheduled today." /> : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stripContent}>
          {[...live, ...upcoming].map((g) => <GameStripCard key={g.id} game={g} />)}
        </ScrollView>
      )}

      <SectionHeader leftText={isPreview ? "🏆 PLAYOFF PICTURE" : "🏆 PLAYOFF BRACKET"} />
      {stLoading ? <SkeletonRows count={3} /> :
        stError ? <ErrorMsg text="Couldn't load playoff data." /> :
        <BracketSection rounds={tournamentRounds} accent={LEAGUE_ACCENT.NBA} />}

      <SectionHeader leftText="🔥 NBA STARS THIS WEEK" />
      {topLoading ? <SkeletonStrip narrow /> :
        topError ? <ErrorMsg text="Couldn't load top players." /> :
        <PlayerSpotlight athletes={topAth?.athletes ?? []} accent={LEAGUE_ACCENT.NBA} />}

      <SectionHeader leftText="STANDINGS" />
      {stLoading ? <SkeletonRows count={6} /> :
        stError ? <ErrorMsg text="Couldn't load standings." /> :
        <ConferenceStandings standings={standings?.standings ?? []} league="NBA" />}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// WNBA PANEL — Off-season countdown
// ─────────────────────────────────────────────────────────────────────────────
function WnbaPanel() {
  const { data: nextGameData, isLoading: ngLoading, isError: ngError } = useQuery({
    queryKey: ["bball-hub-next", "WNBA"],
    queryFn: () => api.getNextGame("WNBA"),
    staleTime: 10 * 60_000,
  });
  const { data: topAth, isLoading: topLoading, isError: topError } = useQuery({
    queryKey: ["bball-hub-top", "WNBA"],
    queryFn: () => api.getTopAthletes("WNBA", 8),
    staleTime: 5 * 60_000,
  });
  const { data: news, isLoading: newsLoading, isError: newsError } = useQuery({
    queryKey: ["bball-hub-news", "basketball"],
    queryFn: () => api.getSportNews("basketball", 20),
    staleTime: 5 * 60_000,
  });

  const targetDate = nextGameData?.game?.startTime
    ? new Date(nextGameData.game.startTime)
    : WNBA_OPENER_FALLBACK;

  const wnbaNews = (news?.articles ?? [])
    .filter((a) => (a.leagues ?? []).some((l) => l.toUpperCase() === "WNBA"))
    .slice(0, 4);

  return (
    <>
      <SectionHeader leftText="WNBA 2026 SEASON" />
      {ngLoading || newsLoading ? <SkeletonRows count={4} /> :
        ngError && newsError ? <ErrorMsg text="Couldn't load WNBA season info." /> :
        <CountdownCard targetDate={targetDate} subtitle="WNBA 2026 · 30th Season" newsItems={wnbaNews} newsError={newsError} />}

      <SectionHeader leftText="🌟 PLAYERS TO WATCH IN 2026" />
      {topLoading ? <SkeletonStrip narrow /> :
        topError ? <ErrorMsg text="Couldn't load WNBA players." /> :
        <PlayerSpotlight athletes={topAth?.athletes ?? []} accent={LEAGUE_ACCENT.WNBA} />}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NCAA MEN'S PANEL — 2026 NBA Draft hero
// ─────────────────────────────────────────────────────────────────────────────
function NcaaMPanel() {
  const { data: draft, isLoading: draftLoading, isError: draftError } = useQuery({
    queryKey: ["bball-hub-draft", "NBA", 2026],
    queryFn: () => api.getDraft("NBA", 2026),
    staleTime: 60 * 60_000,
  });
  const { data: topAth, isLoading: topLoading, isError: topError } = useQuery({
    queryKey: ["bball-hub-top", "NCAAB"],
    queryFn: () => api.getTopAthletes("NCAAB", 8),
    staleTime: 5 * 60_000,
  });

  const prospects = (draft?.prospects ?? []).slice(0, 8);
  const top = prospects[0];

  return (
    <>
      <SectionHeader leftText="NCAA MEN'S · 2026 DRAFT SEASON" />
      {draftLoading ? <SkeletonRows count={4} /> :
        draftError ? <ErrorMsg text="Couldn't load NBA Draft data." /> :
        <DraftHeroCard topProspect={top} prospects={prospects} accent={LEAGUE_ACCENT.NCAAB} />}

      <SectionHeader leftText="🎓 TOP PROSPECTS" />
      {topLoading ? <SkeletonStrip narrow /> :
        topError ? <ErrorMsg text="Couldn't load NCAA top prospects." /> :
        <PlayerSpotlight athletes={topAth?.athletes ?? []} accent={LEAGUE_ACCENT.NCAAB} />}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NCAA WOMEN'S PANEL — Champion + recent results
// ─────────────────────────────────────────────────────────────────────────────
function NcaaWPanel() {
  const { data: standings, isLoading: stLoading, isError: stError } = useQuery({
    queryKey: ["bball-hub-standings", "NCAAW"],
    queryFn: () => api.getStandings("NCAAW"),
    staleTime: 30 * 60_000,
  });
  const { data: topAth, isLoading: topLoading, isError: topError } = useQuery({
    queryKey: ["bball-hub-top", "NCAAW"],
    queryFn: () => api.getTopAthletes("NCAAW", 8),
    staleTime: 5 * 60_000,
  });

  const tournament = standings?.tournament ?? [];
  // Find champion: the winner of the latest finished matchup in the last round
  const finishedMatchups = tournament.flatMap((r) =>
    r.matchups.filter((m) => m.status === "finished").map((m) => ({ ...m, round: r.name }))
  );
  const champion = finishedMatchups[finishedMatchups.length - 1]?.winner ?? null;
  const recentResults = finishedMatchups.slice(-5).reverse();

  return (
    <>
      <SectionHeader leftText="NCAA WOMEN'S BASKETBALL" />

      {stLoading && <SkeletonRows count={4} />}
      {stError && <ErrorMsg text="Couldn't load NCAAW tournament data." />}
      {!stLoading && !stError && (
      <>
      <View style={[styles.ncaawHero, { borderColor: LEAGUE_ACCENT.NCAAW + "33" }]}>
        <Text style={styles.ncaawLabel}>🏆 2026 NATIONAL CHAMPION</Text>
        <Text style={styles.ncaawChamp}>
          {champion ? champion.split(" ").slice(0, -1).join(" ") || champion : "TBD"}{" "}
          <Text style={{ color: LEAGUE_ACCENT.NCAAW }}>
            {champion ? champion.split(" ").slice(-1)[0] : ""}
          </Text>
        </Text>
        <Text style={styles.ncaawSub}>
          {champion ? "2026 NCAA Tournament Champion" : "Tournament in progress — bracket below"}
        </Text>
      </View>

      <SectionHeader leftText="RECENT RESULTS" />
      <View style={{ paddingHorizontal: 16 }}>
        {recentResults.length === 0 ? (
          <EmptyMsg text="No recent tournament results yet." />
        ) : (
          recentResults.map((m, i) => (
            <View key={i} style={styles.resultRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.resTeams} numberOfLines={1}>
                  {m.team1} vs {m.team2}
                </Text>
                <Text style={styles.resMeta}>{m.round} · NCAAW</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={styles.resScore}>
                  {m.score1 ?? "—"}–{m.score2 ?? "—"}
                </Text>
                <View style={styles.resBadge}>
                  <Text style={styles.resBadgeText}>FINAL</Text>
                </View>
              </View>
            </View>
          ))
        )}
      </View>
      </>
      )}

      <SectionHeader leftText="🌟 TOP PLAYERS" />
      {topLoading ? <SkeletonStrip narrow /> :
        topError ? <ErrorMsg text="Couldn't load NCAAW top players." /> :
        <PlayerSpotlight athletes={topAth?.athletes ?? []} accent={LEAGUE_ACCENT.NCAAW} />}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED SUBCOMPONENTS
// ─────────────────────────────────────────────────────────────────────────────
function SectionHeader({
  leftText, leftAccent, rightText,
}: { leftText: string; leftAccent?: string; rightText?: string }) {
  return (
    <View style={styles.sh}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        {leftAccent && <View style={[styles.sectionDot, { backgroundColor: leftAccent }]} />}
        <Text style={styles.shTitle}>{leftText}</Text>
      </View>
      {rightText && <Text style={styles.shSub}>{rightText}</Text>}
    </View>
  );
}

function EmptyMsg({ text }: { text: string }) {
  return (
    <View style={{ paddingHorizontal: 16, paddingVertical: 18 }}>
      <Text style={{ color: C.textSecondary, fontFamily: FONTS.body, fontSize: 13 }}>{text}</Text>
    </View>
  );
}

function ErrorMsg({ text }: { text: string }) {
  return (
    <View style={[styles.errorBox, { borderColor: "#EF444444" }]}>
      <View style={[styles.gcLiveDot, { backgroundColor: "#EF4444" }]} />
      <Text style={styles.errorText}>{text}</Text>
    </View>
  );
}

function SkeletonStrip({ narrow }: { narrow?: boolean } = {}) {
  return (
    <View style={[styles.stripContent, { flexDirection: "row", paddingVertical: 6 }]}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={[styles.skelCard, { width: narrow ? 150 : 240, height: narrow ? 200 : 110 }]} />
      ))}
    </View>
  );
}

function SkeletonRows({ count }: { count: number }) {
  return (
    <View style={{ paddingHorizontal: 16, gap: 6 }}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={[styles.skelCard, { height: 44, width: "100%" }]} />
      ))}
    </View>
  );
}

function GameStripCard({ game }: { game: Game }) {
  const isLive = game.status === "live";
  const isFinished = game.status === "finished";
  const home = (game.homeScore ?? 0);
  const away = (game.awayScore ?? 0);
  const homeLeading = home > away;
  const margin = Math.abs(home - away);
  const accent = LEAGUE_ACCENT[game.league] ?? C.accent;

  // Pulsing animation for the live dot
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!isLive) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [isLive, pulse]);
  const pulseOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] });

  // Late period detection (Q4, OT, 2nd Half, Final-ish)
  const period = (game.quarter ?? "").toLowerCase();
  const isLatePeriod = /4|ot|final|2nd half|half 2/.test(period);

  // Marquee tag derivation
  const isPlayoffContext = !!game.round && /playoff|round|final|championship|conference/i.test(game.round);
  const isMustWatch = isLive && (isLatePeriod && margin <= 6) || (isPlayoffContext && (isLive || game.status === "upcoming"));

  // Upset alert: lower-seeded team leading in a playoff matchup
  let isUpset = false;
  if (isLive && game.seed1 != null && game.seed2 != null && game.seed1 !== game.seed2) {
    const homeIsLower = (game.seed1 ?? 0) > (game.seed2 ?? 0);
    const awayIsLower = (game.seed2 ?? 0) > (game.seed1 ?? 0);
    if ((homeIsLower && homeLeading && margin >= 3) || (awayIsLower && !homeLeading && margin >= 3)) {
      isUpset = true;
    }
  }

  // Contextual tags (rendered as pill chips matching MUST WATCH)
  type Tag = { label: string; color: string };
  const tags: Tag[] = [];
  if (isUpset) tags.push({ label: "UPSET ALERT 🚨", color: accent });
  if (isLive && isLatePeriod && margin <= 4 && !isUpset) tags.push({ label: "INSTANT CLASSIC", color: C.accentGold });
  if (isFinished && margin <= 3) tags.push({ label: `FINAL · ${margin}-PT THRILLER`, color: C.accentGold });
  if (isMustWatch) tags.push({ label: "MUST WATCH", color: accent });
  // Venue stays as a plain status caption (not a tag)
  const venueLine = !isUpset && game.venue ? game.venue : null;

  return (
    <Pressable
      onPress={() => router.push(`/game/${game.id}`)}
      style={[
        styles.gameCard,
        isLive && { borderColor: C.live + "55", backgroundColor: C.live + "08" },
      ]}
    >
      <View style={styles.gcTop}>
        <Text style={[styles.gcLeague, { color: accent }]} numberOfLines={1}>
          {game.league}
          {game.round ? ` · ${game.round.toUpperCase()}` : ""}
        </Text>
        {isLive ? (
          <View style={styles.liveBadge}>
            <Animated.View style={[styles.liveBadgeDot, { backgroundColor: C.live, opacity: pulseOpacity }]} />
            <Text style={styles.liveBadgeText}>
              LIVE{game.quarter ? ` · ${game.quarter}` : ""}{game.timeRemaining ? ` ${game.timeRemaining}` : ""}
            </Text>
          </View>
        ) : (
          <Text style={styles.gcUpcoming}>
            {isFinished ? "FINAL" : new Date(game.startTime).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
          </Text>
        )}
      </View>

      <View style={styles.gcMatchup}>
        <View style={styles.gcTeamRow}>
          {game.seed1 != null && <Text style={styles.gcSeed}>{game.seed1}</Text>}
          <Text style={[styles.gcTeamName, homeLeading && styles.gcLeader, { flex: 1 }]} numberOfLines={1}>
            {game.homeTeam}
          </Text>
          <Text style={[styles.gcScore, homeLeading && styles.gcLeader, !homeLeading && isFinished && styles.gcLoser]}>
            {game.status === "upcoming" ? "—" : home}
          </Text>
        </View>
        <View style={styles.gcDivider} />
        <View style={styles.gcTeamRow}>
          {game.seed2 != null && <Text style={styles.gcSeed}>{game.seed2}</Text>}
          <Text style={[styles.gcTeamName, !homeLeading && game.status !== "upcoming" && styles.gcLeader, { flex: 1 }]} numberOfLines={1}>
            {game.awayTeam}
          </Text>
          <Text style={[styles.gcScore, !homeLeading && game.status !== "upcoming" && styles.gcLeader, homeLeading && isFinished && styles.gcLoser]}>
            {game.status === "upcoming" ? "—" : away}
          </Text>
        </View>
      </View>

      {tags.length > 0 && (
        <View style={styles.gcTagRow}>
          {tags.map((t) => (
            <View key={t.label} style={[styles.gcTag, { backgroundColor: t.color + "22", borderColor: t.color + "55" }]}>
              <Text style={[styles.gcTagText, { color: t.color }]}>{t.label}</Text>
            </View>
          ))}
        </View>
      )}

      {venueLine && (
        <Text style={styles.gcStatus} numberOfLines={1}>
          {venueLine}
        </Text>
      )}
    </Pressable>
  );
}

function PlayerSpotlight({ athletes, accent }: { athletes: TopAthlete[]; accent: string }) {
  if (athletes.length === 0) {
    return <EmptyMsg text="No player data available." />;
  }
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.stripContent}
    >
      {athletes.slice(0, 8).map((a, i) => (
        <PlayerCard key={`${a.name}-${i}`} athlete={a} rank={i + 1} accent={accent} />
      ))}
    </ScrollView>
  );
}

function PlayerCard({ athlete, rank, accent }: { athlete: TopAthlete; rank: number; accent: string }) {
  const rankStyle = rank === 1
    ? { backgroundColor: C.accentGold, color: "#000" }
    : rank === 2
      ? { backgroundColor: "#A8A8A8", color: "#000" }
      : rank === 3
        ? { backgroundColor: "#CD7F32", color: "#000" }
        : { backgroundColor: C.cardElevated, color: C.textSecondary };
  const initials = athlete.name.split(" ").map((s) => s[0]).slice(0, 3).join("").toUpperCase();

  return (
    <Pressable style={styles.playerCard} onPress={() => goPlayer(athlete)}>
      <LinearGradient
        colors={[accent + "AA", accent + "33"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.pcTop}
      >
        <View style={[styles.pcRank, { backgroundColor: rankStyle.backgroundColor }]}>
          <Text style={[styles.pcRankText, { color: rankStyle.color }]}>{rank}</Text>
        </View>
        <View style={styles.pcAvatar}>
          {athlete.headshot ? (
            <Image source={{ uri: athlete.headshot }} style={styles.pcAvatarImg} />
          ) : (
            <Text style={styles.pcAvatarText}>{initials}</Text>
          )}
        </View>
      </LinearGradient>
      <View style={styles.pcBody}>
        <Text style={styles.pcName} numberOfLines={1}>{athlete.name}</Text>
        <Text style={styles.pcTeam} numberOfLines={1}>{athlete.team ?? athlete.league}</Text>
        {athlete.stat && (
          <View style={styles.pcStatRow}>
            <View style={[styles.pcStat, { backgroundColor: accent + "22" }]}>
              <Text style={[styles.pcStatText, { color: accent }]}>{athlete.stat}</Text>
            </View>
          </View>
        )}
      </View>
    </Pressable>
  );
}

function BracketSection({ rounds, accent }: { rounds: TournamentRound[]; accent: string }) {
  const tabs = rounds.length > 0 ? rounds.slice(0, 4).map((r) => r.name) : ["East", "West", "Finals"];
  const [activeTab, setActiveTab] = useState(0);

  if (rounds.length === 0) {
    return (
      <View style={{ paddingHorizontal: 16 }}>
        <View style={[styles.bracketTabs, { borderColor: C.cardBorder }]}>
          {tabs.map((t, i) => (
            <View key={t} style={[styles.bt, i === activeTab && { backgroundColor: accent + "22" }]}>
              <Text style={[styles.btText, i === activeTab && { color: accent }]}>{t.toUpperCase()}</Text>
            </View>
          ))}
        </View>
        <EmptyMsg text="Bracket will appear when the tournament begins." />
      </View>
    );
  }

  const activeRound = rounds[Math.min(activeTab, rounds.length - 1)];

  return (
    <View style={{ paddingHorizontal: 16 }}>
      <View style={[styles.bracketTabs, { borderColor: C.cardBorder }]}>
        {tabs.map((t, i) => (
          <Pressable key={t + i} onPress={() => setActiveTab(i)} style={[styles.bt, i === activeTab && { backgroundColor: accent + "22" }]}>
            <Text style={[styles.btText, i === activeTab && { color: accent }]} numberOfLines={1}>{t.toUpperCase()}</Text>
          </Pressable>
        ))}
      </View>
      {activeRound.matchups.slice(0, 6).map((m, i) => (
        <MatchupCard key={i} matchup={m} roundName={activeRound.name} accent={accent} />
      ))}
    </View>
  );
}

function MatchupCard({ matchup, roundName, accent }: { matchup: TournamentRound["matchups"][number]; roundName: string; accent: string }) {
  const t1Won = matchup.status === "finished" && matchup.winner === matchup.team1;
  const t2Won = matchup.status === "finished" && matchup.winner === matchup.team2;
  return (
    <View style={styles.matchupCard}>
      <Text style={styles.mcSeries} numberOfLines={1}>
        {roundName.toUpperCase()}
        {matchup.status === "live" ? " · LIVE" : matchup.status === "finished" ? " · FINAL" : ""}
      </Text>
      <View style={styles.mcTeamRow}>
        {matchup.seed1 != null && <Text style={[styles.mcSeed, matchup.seed1 <= 4 && { color: C.accentGold }]}>{matchup.seed1}</Text>}
        <TeamLogo uri={matchup.logo1} name={matchup.team1} size={26} fontSize={9} />
        <Text style={[styles.mcName, t1Won && styles.mcNameWinner]} numberOfLines={1}>{matchup.team1}</Text>
        <Text style={[styles.mcWins, t1Won && { color: C.accentGreen }, !t1Won && t2Won && { color: C.textSecondary }]}>
          {matchup.score1 ?? "—"}
        </Text>
      </View>
      <View style={styles.mcDivider} />
      <View style={styles.mcTeamRow}>
        {matchup.seed2 != null && <Text style={[styles.mcSeed, matchup.seed2 <= 4 && { color: C.accentGold }]}>{matchup.seed2}</Text>}
        <TeamLogo uri={matchup.logo2} name={matchup.team2} size={26} fontSize={9} />
        <Text style={[styles.mcName, t2Won && styles.mcNameWinner]} numberOfLines={1}>{matchup.team2}</Text>
        <Text style={[styles.mcWins, t2Won && { color: C.accentGreen }, !t2Won && t1Won && { color: C.textSecondary }]}>
          {matchup.score2 ?? "—"}
        </Text>
      </View>
      {matchup.status === "live" && (
        <View style={styles.mcFooter}>
          <View style={[styles.gcLiveDot, { backgroundColor: C.live }]} />
          <Text style={[styles.mcStatus, { color: C.live }]}>LIVE</Text>
        </View>
      )}
    </View>
  );
}

function ConferenceStandings({ standings, league }: { standings: StandingEntry[]; league: string }) {
  const east = standings.filter((s) => (s.conference ?? "").toLowerCase().includes("east"));
  const west = standings.filter((s) => (s.conference ?? "").toLowerCase().includes("west"));

  return (
    <>
      {east.length > 0 && (
        <>
          <ConfLabel name="Eastern Conference" color="#3A8FFF" />
          <StandingsList standings={east} league={league} />
        </>
      )}
      {west.length > 0 && (
        <>
          <ConfLabel name="Western Conference" color="#FF6B35" />
          <StandingsList standings={west} league={league} />
        </>
      )}
      {east.length === 0 && west.length === 0 && (
        <StandingsList standings={standings} league={league} />
      )}
    </>
  );
}

function ConfLabel({ name, color }: { name: string; color: string }) {
  return (
    <View style={styles.confLabel}>
      <View style={[styles.confDot, { backgroundColor: color }]} />
      <Text style={styles.confLabelText}>{name.toUpperCase()}</Text>
    </View>
  );
}

function StandingsList({ standings, league }: { standings: StandingEntry[]; league: string }) {
  if (standings.length === 0) {
    return <EmptyMsg text="No standings available." />;
  }
  const rows = standings.slice(0, 10);
  return (
    <View style={{ paddingHorizontal: 16 }}>
      <View style={styles.stdHeader}>
        <Text style={styles.stdHeaderText}>#</Text>
        <Text style={[styles.stdHeaderText, { flex: 1 }]}>TEAM</Text>
        <Text style={[styles.stdHeaderText, styles.stdR]}>W</Text>
        <Text style={[styles.stdHeaderText, styles.stdR]}>L</Text>
        <Text style={[styles.stdHeaderText, styles.stdR, { width: 44 }]}>PCT</Text>
        <Text style={[styles.stdHeaderText, styles.stdR]}>GB</Text>
      </View>
      {rows.map((s, i) => {
        const seed = s.playoffSeed ?? s.rank;
        const zone = seed <= 6 ? "playoff-in" : seed <= 10 ? "playin" : "out";
        const stripeColor = zone === "playoff-in" ? C.accentGreen : zone === "playin" ? C.accentGold : "transparent";
        const bg = zone === "playoff-in" ? "rgba(46,204,113,0.04)" : zone === "playin" ? "rgba(241,196,15,0.04)" : C.card;
        const streak = s.streak ?? "";
        const streakColor = streak.startsWith("W") ? C.accentGreen : streak.startsWith("L") ? "#EF4444" : C.textSecondary;
        const rc = s.rankChange ?? 0;
        // Insert play-in separator between rank 6 and rank 7 (playoff vs play-in zone change)
        const prevSeed = i > 0 ? (rows[i - 1].playoffSeed ?? rows[i - 1].rank) : 0;
        const showPlayIn = prevSeed <= 6 && seed > 6;
        return (
          <React.Fragment key={s.teamName + i}>
            {showPlayIn && (
              <View style={styles.playInSep}>
                <View style={[styles.playInLine, { backgroundColor: C.accentGold + "55" }]} />
                <Text style={[styles.playInText, { color: C.accentGold }]}>PLAY-IN TOURNAMENT</Text>
                <View style={[styles.playInLine, { backgroundColor: C.accentGold + "55" }]} />
              </View>
            )}
            <Pressable
              onPress={() => router.push(`/team/${encodeURIComponent(s.teamName)}?league=${league}`)}
              style={[styles.stdRow, { backgroundColor: bg }]}
            >
              <View style={[styles.stdStripe, { backgroundColor: stripeColor }]} />
              <View style={styles.stdRank}>
                <Text style={styles.stdRankText}>{s.rank}</Text>
                {rc !== 0 && (
                  <Text style={[styles.stdRankArrow, { color: rc > 0 ? C.accentGreen : "#EF4444" }]}>
                    {rc > 0 ? `▲${rc}` : `▼${-rc}`}
                  </Text>
                )}
                {s.clinched && (() => {
                  const code = s.clinched.toLowerCase();
                  const palette: Record<string, { bg: string; fg: string }> = {
                    z: { bg: "rgba(241,196,15,0.18)", fg: C.accentGold },
                    y: { bg: "rgba(46,204,113,0.18)", fg: C.accentGreen },
                    x: { bg: "rgba(58,143,255,0.18)", fg: "#6BAEFF" },
                    pb: { bg: "rgba(241,196,15,0.14)", fg: C.accentGold },
                    e: { bg: "rgba(120,120,120,0.18)", fg: C.textSecondary },
                  };
                  const p = palette[code] ?? palette.x;
                  return (
                    <Text style={[styles.stdClinch, { backgroundColor: p.bg, color: p.fg }]}>
                      {s.clinched}
                    </Text>
                  );
                })()}
              </View>
              <View style={[styles.stdTeam, { flex: 1 }]}>
                <TeamLogo uri={s.logoUrl} name={s.teamName} size={26} fontSize={9} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.stdName} numberOfLines={1}>{s.teamName}</Text>
                  {(streak || s.last10) && (
                    <View style={{ flexDirection: "row", gap: 4, marginTop: 2 }}>
                      {streak && (
                        <View style={[styles.streakBadge, { backgroundColor: streakColor + "1A" }]}>
                          <Text style={[styles.streakText, { color: streakColor }]}>{streak}</Text>
                        </View>
                      )}
                      {s.last10 && (
                        <View style={[styles.streakBadge, { backgroundColor: C.cardElevated }]}>
                          <Text style={[styles.streakText, { color: C.textSecondary }]}>L10 {s.last10}</Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              </View>
              <Text style={[styles.stdNum, i === 0 && { color: "#fff" }]}>{s.wins}</Text>
              <Text style={styles.stdNum}>{s.losses}</Text>
              <Text style={[styles.stdNum, { width: 44 }]}>{s.winPct.toFixed(3).replace(/^0/, "")}</Text>
              <Text style={[styles.stdNum, { color: C.textSecondary }]}>
                {s.gamesBack === null || s.gamesBack === 0 ? "—" : s.gamesBack}
              </Text>
            </Pressable>
          </React.Fragment>
        );
      })}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COUNTDOWN CARD (WNBA off-season)
// ─────────────────────────────────────────────────────────────────────────────
function CountdownCard({
  targetDate, subtitle, newsItems, newsError,
}: {
  targetDate: Date;
  subtitle: string;
  newsItems: { id: string; title: string; publishedAt: string; source: string }[];
  newsError?: boolean;
}) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const diff = targetDate.getTime() - now.getTime();
  const live = diff <= 0;
  const days = Math.max(0, Math.floor(diff / 86400_000));
  const hrs = Math.max(0, Math.floor((diff % 86400_000) / 3600_000));
  const mins = Math.max(0, Math.floor((diff % 3600_000) / 60_000));
  const secs = Math.max(0, Math.floor((diff % 60_000) / 1000));
  const pad = (n: number) => String(n).padStart(2, "0");

  const opensLabel = `SEASON OPENS ${targetDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase()}`;

  return (
    <View style={styles.offseasonCard}>
      <LinearGradient
        colors={["#1a0a00", "#2d1500", "#1a0a00"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.ocBanner}
      >
        <View>
          <Text style={styles.ocSeason}>{live ? "SEASON IS LIVE" : opensLabel}</Text>
          <Text style={[styles.ocDate, { color: LEAGUE_ACCENT.WNBA }]}>{subtitle}</Text>
        </View>
        <Text style={styles.ocEmoji}>🏀</Text>
      </LinearGradient>
      <View style={styles.ocBody}>
        <View style={styles.ocCountdown}>
          {[
            { n: live ? "LIVE" : pad(days), l: "DAYS" },
            { n: pad(hrs), l: "HOURS" },
            { n: pad(mins), l: "MINS" },
            { n: pad(secs), l: "SECS" },
          ].map((c, i) => (
            <View key={c.l} style={[styles.ocCountItem, i < 3 && { borderRightWidth: 1, borderRightColor: C.cardBorder }]}>
              <Text style={[styles.ocCountN, { color: LEAGUE_ACCENT.WNBA }]}>{c.n}</Text>
              <Text style={styles.ocCountL}>{c.l}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.ocNewsTitle}>LATEST WNBA NEWS</Text>
        {newsError ? (
          <ErrorMsg text="Couldn't load WNBA news." />
        ) : newsItems.length === 0 ? (
          <EmptyMsg text="No recent WNBA news." />
        ) : (
          newsItems.map((n) => (
            <View key={n.id} style={styles.ocNewsItem}>
              <View style={[styles.ocNewsDot, { backgroundColor: LEAGUE_ACCENT.WNBA }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.ocNewsText} numberOfLines={2}>{n.title}</Text>
                <Text style={styles.ocNewsTime}>
                  {new Date(n.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · {n.source}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DRAFT HERO CARD (NCAA Men's)
// ─────────────────────────────────────────────────────────────────────────────
function DraftHeroCard({
  topProspect, prospects, accent,
}: {
  topProspect: DraftData["prospects"][number] | undefined;
  prospects: DraftData["prospects"];
  accent: string;
}) {
  if (!topProspect) {
    return (
      <View style={[styles.draftHero, { borderColor: accent + "33" }]}>
        <Text style={styles.draftLabel}>2026 NBA DRAFT</Text>
        <Text style={styles.draftTitle}>Draft board loading…</Text>
      </View>
    );
  }
  return (
    <View style={[styles.draftHero, { borderColor: accent + "33" }]}>
      <Text style={styles.draftLabel}>2026 NBA DRAFT · JUN 26</Text>
      <Text style={styles.draftTitle}>
        {topProspect.name}{" "}
        <Text style={{ color: accent }}>— #1 OVERALL</Text>
      </Text>
      <Text style={styles.draftSub}>
        {topProspect.school}
        {topProspect.position ? ` · ${topProspect.position}` : ""}
        {topProspect.height ? ` · ${topProspect.height}` : ""}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginTop: 12 }}>
        {prospects.map((p, i) => (
          <View key={p.id || i} style={styles.draftPick}>
            <Text style={[styles.draftPickN, i === 0 && { color: accent }]}>#{i + 1}</Text>
            <Text style={styles.draftPickName} numberOfLines={1}>
              {p.name.split(" ").map((s, idx) => idx === 0 ? s[0] + "." : s).join(" ")}
            </Text>
            <Text style={styles.draftPickSchool} numberOfLines={1}>{p.school}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { paddingBottom: 32 },

  sh: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 16, paddingTop: 18, paddingBottom: 8,
  },
  shTitle: {
    fontFamily: FONTS.display, fontSize: 16, color: C.text, letterSpacing: 1.2,
  },
  shSub: {
    fontFamily: FONTS.mono, fontSize: 10, color: C.textSecondary, letterSpacing: 1,
  },
  sectionDot: { width: 8, height: 8, borderRadius: 4 },

  // Game strip
  stripContent: { paddingHorizontal: 16, gap: 10 },
  gameCard: {
    width: 240, padding: 12, borderRadius: 12,
    backgroundColor: C.cardElevated, borderWidth: 1, borderColor: C.cardBorder,
  },
  gcTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  gcLeague: { fontFamily: FONTS.monoBold, fontSize: 9, letterSpacing: 1.4 },
  gcLive: { flexDirection: "row", alignItems: "center", gap: 4 },
  gcLiveDot: { width: 6, height: 6, borderRadius: 3 },
  gcLiveText: { fontFamily: FONTS.monoBold, fontSize: 10, color: C.live },
  gcUpcoming: { fontFamily: FONTS.mono, fontSize: 10, color: C.textSecondary },
  gcMatchup: { gap: 4 },
  gcTeamRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 4 },
  gcTeamName: { flex: 1, fontFamily: FONTS.bodyMedium, fontSize: 13, color: C.textSecondary, marginRight: 8 },
  gcScore: { fontFamily: FONTS.display, fontSize: 18, color: C.textSecondary },
  gcLeader: { color: C.text },
  gcDivider: { height: 1, backgroundColor: C.cardBorder },
  gcStatus: { marginTop: 8, fontFamily: FONTS.mono, fontSize: 10, color: C.textSecondary },

  // Player card
  playerCard: {
    width: 150, borderRadius: 12, overflow: "hidden",
    backgroundColor: C.cardElevated, borderWidth: 1, borderColor: C.cardBorder,
  },
  pcTop: { height: 90, alignItems: "center", justifyContent: "flex-end", position: "relative" },
  pcRank: {
    position: "absolute", top: 6, right: 6,
    width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center",
  },
  pcRankText: { fontFamily: FONTS.monoBold, fontSize: 10 },
  pcAvatar: {
    width: 60, height: 60, borderRadius: 30, marginBottom: -12,
    backgroundColor: "rgba(0,0,0,0.45)", borderWidth: 2, borderColor: "rgba(255,255,255,0.18)",
    alignItems: "center", justifyContent: "center",
  },
  pcAvatarText: { fontFamily: FONTS.display, fontSize: 18, color: "#fff", letterSpacing: 1 },
  pcAvatarImg: { width: 56, height: 56, borderRadius: 28 },
  pcBody: { padding: 10, paddingTop: 16 },
  pcName: { fontFamily: FONTS.bodyHeavy, fontSize: 13, color: "#fff" },
  pcTeam: { fontFamily: FONTS.bodyMedium, fontSize: 11, color: C.textSecondary, marginTop: 2 },
  pcStatRow: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 8 },
  pcStat: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 3 },
  pcStatText: { fontFamily: FONTS.monoBold, fontSize: 10 },

  // Bracket
  bracketTabs: {
    flexDirection: "row", borderRadius: 10, overflow: "hidden",
    borderWidth: 1, marginBottom: 12,
  },
  bt: { flex: 1, paddingVertical: 9, alignItems: "center" },
  btText: { fontFamily: FONTS.bodyBold, fontSize: 11, color: C.textSecondary, letterSpacing: 1.2 },
  matchupCard: {
    backgroundColor: C.cardElevated, borderWidth: 1, borderColor: C.cardBorder,
    borderRadius: 10, padding: 12, marginBottom: 8,
  },
  mcSeries: { fontFamily: FONTS.monoBold, fontSize: 9, letterSpacing: 1.5, color: C.textSecondary, marginBottom: 8 },
  mcTeamRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 4 },
  mcSeed: { fontFamily: FONTS.monoBold, fontSize: 11, color: C.textSecondary, width: 16, textAlign: "center" },
  mcName: { flex: 1, fontFamily: FONTS.bodyBold, fontSize: 13, color: C.textSecondary },
  mcNameWinner: { color: "#fff" },
  mcWins: { fontFamily: FONTS.display, fontSize: 16, color: C.textSecondary },
  mcDivider: { height: 1, backgroundColor: C.cardBorder, marginVertical: 2 },
  mcFooter: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 },
  mcStatus: { fontFamily: FONTS.monoBold, fontSize: 10 },

  // Standings
  confLabel: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6 },
  confDot: { width: 8, height: 8, borderRadius: 4 },
  confLabelText: { fontFamily: FONTS.display, fontSize: 14, color: C.text, letterSpacing: 1.2 },
  stdHeader: {
    flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 8,
    backgroundColor: C.background, borderWidth: 1, borderColor: C.cardBorder,
    borderTopLeftRadius: 8, borderTopRightRadius: 8, gap: 0,
  },
  stdHeaderText: { fontFamily: FONTS.monoBold, fontSize: 9, color: C.textSecondary, letterSpacing: 1.2, width: 36 },
  stdR: { textAlign: "right" },
  stdRow: {
    flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 10,
    borderWidth: 1, borderTopWidth: 0, borderColor: C.cardBorder,
    position: "relative",
  },
  stdStripe: { position: "absolute", left: 0, top: 0, bottom: 0, width: 3 },
  stdRank: { width: 36, flexDirection: "row", alignItems: "center", gap: 4 },
  stdRankText: { fontFamily: FONTS.monoBold, fontSize: 12, color: C.text },
  stdClinch: { fontFamily: FONTS.monoBold, fontSize: 8, paddingHorizontal: 4, paddingVertical: 1, borderRadius: 3, overflow: "hidden" },
  stdRankArrow: { fontFamily: FONTS.monoBold, fontSize: 9 },

  // Game-card live indicators / tags
  liveBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 7, paddingVertical: 2, borderRadius: 100,
    backgroundColor: "rgba(46,204,113,0.14)",
    borderWidth: 1, borderColor: "rgba(46,204,113,0.35)",
  },
  liveBadgeDot: { width: 5, height: 5, borderRadius: 3 },
  liveBadgeText: { fontFamily: FONTS.monoBold, fontSize: 9, color: "#3DD68C", letterSpacing: 0.4 },
  gcSeed: { fontFamily: FONTS.monoBold, fontSize: 10, color: C.textSecondary, width: 14, textAlign: "center" },
  gcLoser: { color: C.textSecondary, opacity: 0.6 },
  gcTagRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  gcTag: {
    paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4, borderWidth: 1,
  },
  gcTagText: { fontFamily: FONTS.monoBold, fontSize: 9, letterSpacing: 1.2 },
  playInSep: {
    flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 8,
    borderWidth: 1, borderTopWidth: 0, borderColor: C.cardBorder,
    backgroundColor: "rgba(241,196,15,0.06)", paddingHorizontal: 12,
  },
  playInLine: { flex: 1, height: 1 },
  playInText: { fontFamily: FONTS.monoBold, fontSize: 9, letterSpacing: 1.4 },
  errorBox: {
    marginHorizontal: 16, marginVertical: 8, padding: 12, borderRadius: 8,
    borderWidth: 1, backgroundColor: "rgba(239,68,68,0.06)",
    flexDirection: "row", alignItems: "center", gap: 8,
  },
  errorText: { fontFamily: FONTS.bodyMedium, fontSize: 12, color: "#EF4444" },
  skelCard: {
    backgroundColor: C.cardElevated, borderWidth: 1, borderColor: C.cardBorder,
    borderRadius: 10, opacity: 0.5,
  },
  stdTeam: { flexDirection: "row", alignItems: "center", gap: 8 },
  stdName: { fontFamily: FONTS.bodyBold, fontSize: 13, color: C.text },
  stdNum: { width: 36, textAlign: "right", fontFamily: FONTS.monoBold, fontSize: 12, color: C.text },
  streakBadge: { alignSelf: "flex-start", marginTop: 2, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 3 },
  streakText: { fontFamily: FONTS.monoBold, fontSize: 9 },

  // Off-season card
  offseasonCard: {
    marginHorizontal: 16, borderRadius: 14, overflow: "hidden",
    backgroundColor: C.card, borderWidth: 1, borderColor: C.cardBorder,
  },
  ocBanner: {
    height: 80, paddingHorizontal: 18,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  ocSeason: { fontFamily: FONTS.display, fontSize: 18, color: "#fff", letterSpacing: 1.2 },
  ocDate: { fontFamily: FONTS.monoBold, fontSize: 11, marginTop: 4 },
  ocEmoji: { fontSize: 36 },
  ocBody: { padding: 14 },
  ocCountdown: {
    flexDirection: "row", borderRadius: 8, overflow: "hidden",
    backgroundColor: C.background, borderWidth: 1, borderColor: C.cardBorder, marginBottom: 14,
  },
  ocCountItem: { flex: 1, paddingVertical: 10, alignItems: "center" },
  ocCountN: { fontFamily: FONTS.display, fontSize: 24, lineHeight: 26 },
  ocCountL: { fontFamily: FONTS.monoBold, fontSize: 9, color: C.textSecondary, marginTop: 2, letterSpacing: 1 },
  ocNewsTitle: { fontFamily: FONTS.monoBold, fontSize: 10, color: C.textSecondary, letterSpacing: 1.5, marginBottom: 8 },
  ocNewsItem: { flexDirection: "row", gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.cardBorder, alignItems: "flex-start" },
  ocNewsDot: { width: 6, height: 6, borderRadius: 3, marginTop: 6 },
  ocNewsText: { fontFamily: FONTS.bodyMedium, fontSize: 13, color: C.text, lineHeight: 18 },
  ocNewsTime: { fontFamily: FONTS.mono, fontSize: 10, color: C.textSecondary, marginTop: 2 },

  // NCAAW hero
  ncaawHero: {
    marginHorizontal: 16, marginBottom: 8,
    backgroundColor: C.card, borderWidth: 1, borderRadius: 14, padding: 16,
  },
  ncaawLabel: { fontFamily: FONTS.monoBold, fontSize: 9, color: C.textSecondary, letterSpacing: 1.5, marginBottom: 6 },
  ncaawChamp: { fontFamily: FONTS.display, fontSize: 24, color: "#fff", letterSpacing: 1, marginBottom: 4 },
  ncaawSub: { fontFamily: FONTS.body, fontSize: 13, color: C.textSecondary },

  resultRow: {
    backgroundColor: C.cardElevated, borderWidth: 1, borderColor: C.cardBorder,
    borderRadius: 8, padding: 12, marginBottom: 6,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8,
  },
  resTeams: { fontFamily: FONTS.bodyBold, fontSize: 13, color: C.text },
  resMeta: { fontFamily: FONTS.mono, fontSize: 10, color: C.textSecondary, marginTop: 2 },
  resScore: { fontFamily: FONTS.monoBold, fontSize: 14, color: "#fff" },
  resBadge: { backgroundColor: C.background, borderWidth: 1, borderColor: C.cardBorder, borderRadius: 3, paddingHorizontal: 6, paddingVertical: 2, marginTop: 2 },
  resBadgeText: { fontFamily: FONTS.monoBold, fontSize: 9, color: C.textSecondary },

  // Draft hero
  draftHero: {
    marginHorizontal: 16, marginBottom: 8,
    backgroundColor: C.card, borderWidth: 1, borderRadius: 14, padding: 16,
  },
  draftLabel: { fontFamily: FONTS.monoBold, fontSize: 9, color: C.textSecondary, letterSpacing: 1.5, marginBottom: 6 },
  draftTitle: { fontFamily: FONTS.display, fontSize: 22, color: "#fff", letterSpacing: 1, marginBottom: 4 },
  draftSub: { fontFamily: FONTS.body, fontSize: 13, color: C.textSecondary },
  draftPick: {
    backgroundColor: C.cardElevated, borderWidth: 1, borderColor: C.cardBorder,
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, alignItems: "center", minWidth: 70,
  },
  draftPickN: { fontFamily: FONTS.monoBold, fontSize: 13, color: C.textSecondary },
  draftPickName: { fontFamily: FONTS.bodyBold, fontSize: 10, color: C.text, marginTop: 2 },
  draftPickSchool: { fontFamily: FONTS.mono, fontSize: 9, color: C.textSecondary },
});
