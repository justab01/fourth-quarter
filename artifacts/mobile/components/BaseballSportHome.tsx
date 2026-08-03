import React, { useMemo, useState } from "react";
import {
  Image,
  ImageBackground,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { TeamLogo } from "@/components/GameCard";
import { SearchButton } from "@/components/SearchButton";
import { SportFloatingNav, SPORT_NAV_CLEARANCE } from "@/components/SportFloatingNav";
import { resolveBallparkImage } from "@/constants/ballparks";
import {
  BALLPARK_FEATURES,
  BASEBALL_FEATURED_PLAYERS,
  BASEBALL_HISTORY,
  BASEBALL_LESSONS,
  type BaseballAccolade,
  type BaseballFeaturedPlayer,
} from "@/constants/baseballHome";
import { getEspnHeadshotUrlById } from "@/constants/espnAthleteIds";
import { FONTS } from "@/constants/typography";
import type { Game, StandingEntry, SportNewsArticle } from "@/utils/api";

const P = {
  red: "#C62828",
  navy: "#0D2953",
  cream: "#EAD7B5",
  paper: "#FBF7EF",
  brown: "#7A4E2E",
  green: "#60723B",
  ink: "#15223A",
  muted: "#697384",
  line: "#D9D1C3",
  white: "#FFFFFF",
};

const BASEBALL = require("../assets/images/baseball-header.png");
const AWARD_SPRITE = require("../assets/baseball-awards/baseball-awards-collection.png");

type Athlete = {
  name: string;
  team?: string;
  stat?: string;
  position?: string;
  resolvedHeadshot?: string | null;
  athleteId?: string | null;
  rank?: number;
};

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

type SheetState =
  | { type: "player"; player: BaseballFeaturedPlayer }
  | { type: "award"; player: BaseballFeaturedPlayer; award: BaseballAccolade }
  | { type: "ranking" }
  | { type: "positions" }
  | { type: "compare" }
  | { type: "october" }
  | { type: "lesson"; item: (typeof BASEBALL_LESSONS)[number] }
  | { type: "history"; item: (typeof BASEBALL_HISTORY)[number] }
  | { type: "park"; item: (typeof BALLPARK_FEATURES)[number] }
  | null;

const nickname = (team: string) => {
  const trimmed = team.trim();
  if (/red sox$/i.test(trimmed)) return "Red Sox";
  if (/white sox$/i.test(trimmed)) return "White Sox";
  if (/blue jays$/i.test(trimmed)) return "Blue Jays";
  return trimmed.split(" ").pop() || trimmed;
};

const gameTime = (iso: string) => {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "TBD" : date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
};

const gameStatus = (game: Game) => {
  if (game.status === "live") return game.quarter || game.statusDetail || "LIVE";
  if (game.status === "finished") return "FINAL";
  return gameTime(game.startTime);
};

const openGame = (id: string) => router.push({ pathname: "/game/[id]", params: { id } } as any);
const openPlayer = (id: string) => router.push({ pathname: "/player/[id]", params: { id: `MLB-${id}` } } as any);

function SectionTitle({ eyebrow, title, action, onAction }: { eyebrow?: string; title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionTitleRow}>
      <View style={{ flex: 1 }}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {action ? (
        <Pressable onPress={onAction} hitSlop={10} style={styles.sectionAction}>
          <Text style={styles.sectionActionText}>{action}</Text>
          <Ionicons name="arrow-forward" size={14} color={P.red} />
        </Pressable>
      ) : null}
    </View>
  );
}

function AwardArtwork({ award, size = 64 }: { award: BaseballAccolade; size?: number }) {
  const spriteIndex = award.kind === "championship" ? 0 : award.kind === "gold-glove" ? 1 : 2;
  const pieceWidth = size * (612 / 856);
  return (
    <View style={{ width: pieceWidth, height: size, overflow: "hidden" }}>
      <Image
        source={AWARD_SPRITE}
        resizeMode="stretch"
        style={{ position: "absolute", width: pieceWidth * 3, height: size, left: -pieceWidth * spriteIndex }}
      />
    </View>
  );
}

function HardwareButton({ award, onPress }: { award: BaseballAccolade; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.hardwareButton} accessibilityRole="button" accessibilityLabel={`${award.year} ${award.title}`}>
      <AwardArtwork award={award} />
      <Text style={styles.hardwareYear}>{award.year}</Text>
      <Text style={styles.hardwareLabel} numberOfLines={2}>{award.shortTitle}</Text>
    </Pressable>
  );
}

function GameToKnow({ game, wide }: { game: Game; wide: boolean }) {
  const park = resolveBallparkImage(game.venue);
  const live = game.status === "live";
  return (
    <Pressable onPress={() => openGame(game.id)} style={[styles.heroCard, wide && styles.heroCardWide]}>
      {park ? <ImageBackground source={park} style={StyleSheet.absoluteFillObject} imageStyle={styles.heroImage} /> : null}
      <LinearGradient colors={["rgba(10,22,42,.10)", "rgba(10,22,42,.72)", "rgba(10,22,42,.98)"]} style={StyleSheet.absoluteFillObject} />
      <View style={styles.heroTopRow}>
        <View style={[styles.statusPill, live && styles.livePill]}>
          {live ? <View style={styles.liveDot} /> : null}
          <Text style={styles.statusPillText}>{live ? "LIVE NOW" : game.status === "finished" ? "FINAL" : "GAME TO KNOW"}</Text>
        </View>
        <Text style={styles.heroTime}>{gameStatus(game)}</Text>
      </View>
      <View style={styles.heroBottom}>
        <View style={styles.heroTeams}>
          <View style={styles.heroTeam}>
            <TeamLogo uri={game.awayTeamLogo} name={game.awayTeam} size={46} />
            <Text style={styles.heroTeamName}>{nickname(game.awayTeam)}</Text>
          </View>
          <View style={styles.heroCenter}>
            {game.status === "upcoming" ? <Text style={styles.heroAt}>AT</Text> : <Text style={styles.heroScore}>{game.awayScore ?? 0}–{game.homeScore ?? 0}</Text>}
            <Text style={styles.heroVenue} numberOfLines={1}>{game.venue || "Ballpark TBD"}</Text>
          </View>
          <View style={styles.heroTeam}>
            <TeamLogo uri={game.homeTeamLogo} name={game.homeTeam} size={46} />
            <Text style={styles.heroTeamName}>{nickname(game.homeTeam)}</Text>
          </View>
        </View>
        <View style={styles.heroReason}>
          <Ionicons name="sparkles" size={15} color={P.cream} />
          <Text style={styles.heroReasonText}>Follow every pitch, runner and momentum swing.</Text>
          <Ionicons name="chevron-forward" size={18} color={P.white} />
        </View>
      </View>
    </Pressable>
  );
}

function ParkGameCard({ game, width }: { game: Game; width: number }) {
  const live = game.status === "live";
  const baseCount = (game as any).situation?.basesOccupied?.length ?? 0;
  return (
    <Pressable onPress={() => openGame(game.id)} style={[styles.gameCard, { width }]}>
      <View style={styles.gameCardTop}>
        <Text style={[styles.gameCardStatus, live && { color: P.red }]}>{gameStatus(game)}</Text>
        <View style={styles.diamondRow}>
          {[0, 1, 2].map((base) => <View key={base} style={[styles.tinyDiamond, base < baseCount && styles.tinyDiamondOn]} />)}
        </View>
      </View>
      <View style={styles.gameTeamRow}>
        <TeamLogo uri={game.awayTeamLogo} name={game.awayTeam} size={27} />
        <Text style={styles.gameTeamName}>{nickname(game.awayTeam)}</Text>
        <Text style={styles.gameScore}>{game.status === "upcoming" ? "—" : game.awayScore ?? 0}</Text>
      </View>
      <View style={styles.gameTeamRow}>
        <TeamLogo uri={game.homeTeamLogo} name={game.homeTeam} size={27} />
        <Text style={styles.gameTeamName}>{nickname(game.homeTeam)}</Text>
        <Text style={styles.gameScore}>{game.status === "upcoming" ? "—" : game.homeScore ?? 0}</Text>
      </View>
      <Text style={styles.gameCardNote} numberOfLines={1}>{game.venue || "Matchup details"}</Text>
    </Pressable>
  );
}

function OctoberPicture({ standings, league, setLeague, onExplain }: { standings: StandingEntry[]; league: "AL" | "NL"; setLeague: (v: "AL" | "NL") => void; onExplain: () => void }) {
  const seeded = useMemo(() => {
    const leagueWord = league === "AL" ? "American" : "National";
    const pool = standings.filter((entry) => !entry.conference || entry.conference.includes(league) || entry.conference.includes(leagueWord));
    const candidates = pool.length >= 6 ? pool : standings;
    const explicit = candidates.filter((entry) => entry.playoffSeed && entry.playoffSeed <= 6).sort((a, b) => (a.playoffSeed || 99) - (b.playoffSeed || 99));
    if (explicit.length >= 6) return explicit.slice(0, 6);
    const leaders = candidates.filter((entry) => entry.rank === 1 && entry.division).sort((a, b) => b.winPct - a.winPct).slice(0, 3);
    const leaderNames = new Set(leaders.map((entry) => entry.teamName));
    return [...leaders, ...candidates.filter((entry) => !leaderNames.has(entry.teamName)).sort((a, b) => b.winPct - a.winPct)].slice(0, 6);
  }, [league, standings]);

  return (
    <View style={styles.octoberCard}>
      <View style={styles.octoberTop}>
        <View>
          <Text style={styles.octoberKicker}>IF THE SEASON ENDED TODAY</Text>
          <Text style={styles.octoberTitle}>October picture</Text>
        </View>
        <Pressable onPress={onExplain} style={styles.helpButton}><Text style={styles.helpText}>?</Text></Pressable>
      </View>
      <View style={styles.leagueSwitch}>
        {(["AL", "NL"] as const).map((item) => (
          <Pressable key={item} onPress={() => setLeague(item)} style={[styles.leagueChoice, league === item && styles.leagueChoiceOn]}>
            <Text style={[styles.leagueChoiceText, league === item && styles.leagueChoiceTextOn]}>{item}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.seedGrid}>
        {seeded.length ? seeded.map((entry, index) => (
          <View key={`${league}-${entry.teamName}`} style={[styles.seedRow, index < 2 && styles.seedBye]}>
            <Text style={styles.seedNo}>{index + 1}</Text>
            <TeamLogo uri={entry.logoUrl} name={entry.teamName} size={26} />
            <View style={{ flex: 1 }}>
              <Text style={styles.seedTeam} numberOfLines={1}>{nickname(entry.teamName)}</Text>
              <Text style={styles.seedRecord}>{entry.wins}–{entry.losses}{entry.gamesBack ? ` · ${entry.gamesBack} GB` : ""}</Text>
            </View>
            <Text style={styles.seedPath}>{index < 2 ? "BYE" : index < 4 ? "HOST" : "WC"}</Text>
          </View>
        )) : <Text style={styles.emptyText}>Standings will fill this bracket as the season begins.</Text>}
      </View>
      <Pressable onPress={() => router.push("/(tabs)/standings" as any)} style={styles.octoberFooter}>
        <Text style={styles.octoberFooterText}>See every division and wild-card race</Text>
        <Ionicons name="arrow-forward" size={16} color={P.navy} />
      </Pressable>
    </View>
  );
}

function PlayerCard({ player, width, selected, onSelect, onQuickView, onAward }: {
  player: BaseballFeaturedPlayer;
  width: number;
  selected: boolean;
  onSelect: () => void;
  onQuickView: () => void;
  onAward: (award: BaseballAccolade) => void;
}) {
  const headshot = getEspnHeadshotUrlById(player.espnId, "MLB");
  const awards = [...player.awards].sort((a, b) => a.date.localeCompare(b.date));
  return (
    <View style={[styles.playerCard, { width, borderTopColor: player.color }]}>
      <View style={styles.playerTopline}>
        <View style={[styles.positionFlag, { backgroundColor: player.color }]}><Text style={styles.positionFlagText}>{player.position}</Text></View>
        <Pressable onPress={onSelect} style={[styles.compareToggle, selected && styles.compareToggleOn]}>
          <Ionicons name={selected ? "checkmark" : "add"} size={14} color={selected ? P.white : P.navy} />
          <Text style={[styles.compareToggleText, selected && { color: P.white }]}>{selected ? "Added" : "Compare"}</Text>
        </Pressable>
      </View>
      <View style={styles.playerStage}>
        <Pressable onPress={onQuickView} style={styles.playerPortraitButton}>
          {headshot ? <Image source={{ uri: headshot }} style={styles.playerPortrait} resizeMode="contain" /> : null}
          <LinearGradient colors={["transparent", "rgba(21,34,58,.12)"]} style={StyleSheet.absoluteFillObject} />
        </Pressable>
        <View style={styles.statCascadeLeft}>
          {player.stats.slice(0, 2).map((stat) => <View key={stat.label}><Text style={styles.floatStatValue}>{stat.value}</Text><Text style={styles.floatStatLabel}>{stat.label}</Text></View>)}
        </View>
        <View style={styles.statCascadeRight}>
          {player.stats.slice(2).map((stat) => <View key={stat.label}><Text style={styles.floatStatValue}>{stat.value}</Text><Text style={styles.floatStatLabel}>{stat.label}</Text></View>)}
        </View>
      </View>
      <Pressable onPress={() => openPlayer(player.espnId)} style={styles.playerNameButton}>
        <Text style={styles.playerName}>{player.name}</Text>
        <Ionicons name="arrow-forward-circle" size={17} color={player.color} />
      </Pressable>
      <Text style={styles.playerTeam}>{player.team} · {player.lane}</Text>
      <View style={styles.hardwareHeader}><Text style={styles.hardwareHeaderText}>CAREER HARDWARE · OLDEST TO NEWEST</Text></View>
      <ScrollView horizontal nestedScrollEnabled showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hardwareRail}>
        {awards.map((item) => <HardwareButton key={item.id} award={item} onPress={() => onAward(item)} />)}
      </ScrollView>
      <Pressable onPress={onQuickView} style={styles.quickViewButton}>
        <Text style={styles.quickViewText}>Stats + full award history</Text>
        <Ionicons name="chevron-up" size={15} color={P.navy} />
      </Pressable>
    </View>
  );
}

export function BaseballSportHome({ sportName, topInset, games, standings, news, leagues, activeLeague, onSelectLeague, gamesLoading }: Props) {
  const { width } = useWindowDimensions();
  const wide = width >= 720;
  const gutter = wide ? 28 : 16;
  const maxWidth = Math.min(width, 980);
  const innerWidth = maxWidth - gutter * 2;
  const heroGame = games.find((game) => game.status === "live") || games.find((game) => game.status === "upcoming") || games[0];
  const [league, setLeague] = useState<"AL" | "NL">("AL");
  const [category, setCategory] = useState<"Overall" | "Hitters" | "Pitchers" | "Defense">("Overall");
  const [position, setPosition] = useState<"All" | BaseballFeaturedPlayer["position"]>("All");
  const [selected, setSelected] = useState<string[]>([]);
  const [sheet, setSheet] = useState<SheetState>(null);

  const filteredPlayers = BASEBALL_FEATURED_PLAYERS.filter((player) => {
    const categoryMatch = category === "Overall" || (category === "Hitters" && player.lane === "Hitter") || (category === "Pitchers" && player.lane === "Pitcher") || (category === "Defense" && player.position === "CF");
    return categoryMatch && (position === "All" || player.position === position);
  });

  const dateLabel = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const gameCardWidth = Math.min(222, innerWidth * 0.64);
  const playerCardWidth = wide ? Math.min(430, (innerWidth - 14) / 2) : Math.min(356, innerWidth * 0.94);

  const toggleCompare = (id: string) => setSelected((current) => current.includes(id) ? current.filter((value) => value !== id) : current.length < 5 ? [...current, id] : current);

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: topInset + 6, paddingBottom: SPORT_NAV_CLEARANCE + 20 }}>
        <View style={[styles.page, { width: maxWidth }]}>
          <View style={[styles.header, { paddingHorizontal: gutter }]}>
            <Pressable onPress={() => router.back()} style={styles.iconButton} hitSlop={10}><Ionicons name="chevron-back" size={22} color={P.ink} /></Pressable>
            <View pointerEvents="none" style={styles.centerBrand}>
              <Image source={BASEBALL} style={styles.headerBall} resizeMode="contain" />
              <Text style={styles.headerTitle}>THE FOURTH QUARTER</Text>
            </View>
            <SearchButton />
          </View>

          <View style={[styles.intro, { paddingHorizontal: gutter }]}>
            <Text style={styles.pageTitle}>{sportName}</Text>
            <View style={styles.dateRow}>
              <Text style={styles.dateText}>{dateLabel}</Text>
              <View style={styles.dateDot} />
              <Text style={styles.dateStrong}>{games.length} {games.length === 1 ? "game" : "games"}</Text>
            </View>
            <View style={styles.scopeRow}>
              {leagues.map((item) => {
                const active = activeLeague === item.key || (activeLeague === "all" && item.key === leagues[0]?.key);
                return <Pressable key={item.key} onPress={() => onSelectLeague(item.key)} style={[styles.scopePill, active && styles.scopePillOn]}><Text style={[styles.scopeText, active && styles.scopeTextOn]}>{item.key === "NCAABB" ? "College" : item.label}</Text></Pressable>;
              })}
              <Pressable style={styles.followPill}><Ionicons name="star-outline" size={14} color={P.red} /><Text style={styles.followText}>Follow baseball</Text></Pressable>
            </View>
          </View>

          {gamesLoading ? <View style={[styles.loadingCard, { marginHorizontal: gutter }]}><Text style={styles.loadingText}>Getting today’s ballparks ready…</Text></View> : heroGame ? (
            <View style={{ paddingHorizontal: gutter }}><GameToKnow game={heroGame} wide={wide} /></View>
          ) : <View style={[styles.loadingCard, { marginHorizontal: gutter }]}><Text style={styles.loadingText}>No games scheduled yet. The season board updates automatically.</Text></View>}

          {games.length ? <>
            <View style={{ paddingHorizontal: gutter }}><SectionTitle eyebrow="TODAY" title="At the parks" action="All scores" onAction={() => router.push("/(tabs)/live" as any)} /></View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: gutter, gap: 10 }}>
              {games.slice(0, 10).map((game) => <ParkGameCard key={game.id} game={game} width={gameCardWidth} />)}
            </ScrollView>
          </> : null}

          <View style={{ paddingHorizontal: gutter }}>
            <SectionTitle eyebrow="THE RACE" title="October picture" />
            <OctoberPicture standings={standings} league={league} setLeague={setLeague} onExplain={() => setSheet({ type: "october" })} />
          </View>

          <View style={{ paddingHorizontal: gutter }}>
            <SectionTitle eyebrow="THE PEOPLE DEFINING THE SEASON" title="Faces of 2026" action={selected.length ? `Compare ${selected.length}` : "How ranked?"} onAction={() => setSheet(selected.length ? { type: "compare" } : { type: "ranking" })} />
            <View style={styles.filterRow}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {(["Overall", "Hitters", "Pitchers", "Defense"] as const).map((item) => <Pressable key={item} onPress={() => setCategory(item)} style={[styles.filterPill, category === item && styles.filterPillOn]}><Text style={[styles.filterText, category === item && styles.filterTextOn]}>{item}</Text></Pressable>)}
                <Pressable onPress={() => setSheet({ type: "positions" })} style={[styles.filterPill, position !== "All" && styles.filterPillOn]}><Text style={[styles.filterText, position !== "All" && styles.filterTextOn]}>{position === "All" ? "Position" : position}</Text><Ionicons name="chevron-down" size={13} color={position !== "All" ? P.white : P.navy} /></Pressable>
              </ScrollView>
            </View>
          </View>
          <ScrollView horizontal={!wide} showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.playerRail, { paddingHorizontal: gutter }, wide && styles.playerGrid]}>
            {filteredPlayers.map((player) => (
              <PlayerCard
                key={player.id}
                player={player}
                width={playerCardWidth}
                selected={selected.includes(player.id)}
                onSelect={() => toggleCompare(player.id)}
                onQuickView={() => setSheet({ type: "player", player })}
                onAward={(item) => setSheet({ type: "award", player, award: item })}
              />
            ))}
            {!filteredPlayers.length ? <Text style={styles.emptyText}>No featured player matches both filters.</Text> : null}
          </ScrollView>

          {news.length ? <View style={{ paddingHorizontal: gutter }}>
            <SectionTitle eyebrow="BASEBALL PULSE" title="What the game is talking about" />
            <View style={styles.newsStack}>
              {news.slice(0, 4).map((item, index) => (
                <Pressable key={item.id} onPress={() => router.push({ pathname: "/article/[id]", params: { id: item.id } } as any)} style={styles.newsCard}>
                  <Text style={styles.newsNumber}>0{index + 1}</Text>
                  <View style={{ flex: 1 }}><Text style={styles.newsTitle} numberOfLines={2}>{item.title}</Text><Text style={styles.newsMeta}>{item.publishedAt ? new Date(item.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Baseball now"}</Text></View>
                  <Ionicons name="arrow-forward" size={18} color={P.red} />
                </Pressable>
              ))}
            </View>
          </View> : null}

          <View>
            <View style={{ paddingHorizontal: gutter }}><SectionTitle eyebrow="THE GAME BEYOND THE BOX" title="Around the ballparks" /></View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: gutter, gap: 12 }}>
              {BALLPARK_FEATURES.map((item) => {
                const image = resolveBallparkImage(item.venue);
                return <Pressable key={item.id} onPress={() => setSheet({ type: "park", item })} style={styles.parkCard}>{image ? <Image source={image} style={StyleSheet.absoluteFillObject} /> : null}<LinearGradient colors={["transparent", "rgba(8,18,31,.92)"]} style={StyleSheet.absoluteFillObject} /><View style={styles.parkCopy}><Text style={styles.parkCity}>{item.city.toUpperCase()}</Text><Text style={styles.parkName}>{item.venue}</Text><Text style={styles.parkNote}>{item.note}</Text></View></Pressable>;
              })}
            </ScrollView>
          </View>

          <View style={{ paddingHorizontal: gutter }}>
            <SectionTitle eyebrow="BASEBALL SCHOOL" title="Learn the game by watching it" />
            <View style={[styles.lessonGrid, wide && styles.lessonGridWide]}>
              {BASEBALL_LESSONS.map((item) => <Pressable key={item.id} onPress={() => setSheet({ type: "lesson", item })} style={[styles.lessonCard, wide && { width: "31.8%" }]}><Ionicons name={item.icon as any} size={23} color={P.red} /><Text style={styles.lessonTitle}>{item.title}</Text><Text style={styles.lessonDek}>{item.dek}</Text><Ionicons name="arrow-forward" size={16} color={P.navy} /></Pressable>)}
            </View>
          </View>

          <View style={{ paddingHorizontal: gutter }}>
            <SectionTitle eyebrow="FROM THE ARCHIVE" title="On this day in baseball" />
            {BASEBALL_HISTORY.map((item) => <Pressable key={item.id} onPress={() => setSheet({ type: "history", item })} style={styles.historyCard}><View style={styles.historyDate}><Text style={styles.historyMonth}>AUG</Text><Text style={styles.historyDay}>03</Text></View><View style={{ flex: 1 }}><Text style={styles.historyEyebrow}>{item.date}</Text><Text style={styles.historyTitle}>{item.title}</Text><Text style={styles.historyBody} numberOfLines={2}>{item.body}</Text></View><Ionicons name="chevron-forward" size={19} color={P.red} /></Pressable>)}
          </View>
        </View>
      </ScrollView>

      <Modal visible={!!sheet} transparent animationType="slide" onRequestClose={() => setSheet(null)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setSheet(null)} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <Pressable onPress={() => setSheet(null)} style={styles.closeButton}><Ionicons name="close" size={21} color={P.ink} /></Pressable>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sheetContent}>
            {sheet?.type === "player" ? <PlayerSheet player={sheet.player} onAward={(award) => setSheet({ type: "award", player: sheet.player, award })} /> : null}
            {sheet?.type === "award" ? <AwardSheet player={sheet.player} award={sheet.award} /> : null}
            {sheet?.type === "ranking" ? <InfoSheet eyebrow="HOW IT WORKS" title="Four ways to see who is setting the pace" body="Overall balances season impact, production and role. Hitters highlights offensive creation. Pitchers weighs run prevention and dominance. Defense focuses on the positions where range, arm and run-saving matter most. This is an editorial lens—not a fake universal score." /> : null}
            {sheet?.type === "october" ? <InfoSheet eyebrow="PLAYOFF PRIMER" title="How to read the October picture" body="Each league sends six teams: three division winners and three wild cards. Seeds 1 and 2 earn a first-round bye. Seed 3 hosts seed 6, and seed 4 hosts seed 5. The board uses current standings, so every result can move the path." /> : null}
            {sheet?.type === "positions" ? <><InfoSheet eyebrow="FILTER THE FIELD" title="Choose a baseball role" body="DH and CF are hitters; SP and RP split starting pitchers from relievers." />{(["All", "DH", "CF", "SP", "RP"] as const).map((item) => <Pressable key={item} onPress={() => { setPosition(item); setSheet(null); }} style={styles.sheetOption}><Text style={styles.sheetOptionText}>{item === "All" ? "Every position" : item}</Text>{position === item ? <Ionicons name="checkmark-circle" size={21} color={P.red} /> : null}</Pressable>)}</> : null}
            {sheet?.type === "compare" ? <CompareSheet ids={selected} /> : null}
            {sheet?.type === "lesson" ? <InfoSheet eyebrow="BASEBALL SCHOOL" title={sheet.item.title} body={sheet.item.body} /> : null}
            {sheet?.type === "history" ? <InfoSheet eyebrow={sheet.item.date.toUpperCase()} title={sheet.item.title} body={sheet.item.body} /> : null}
            {sheet?.type === "park" ? <InfoSheet eyebrow={`${sheet.item.city.toUpperCase()} · BALLPARK GUIDE`} title={sheet.item.venue} body={`${sheet.item.note}. Open a matchup at this park to follow the live field, every play and the full game detail.`} /> : null}
          </ScrollView>
        </View>
      </Modal>
      <SportFloatingNav active="sports" />
    </View>
  );
}

function InfoSheet({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) {
  return <View><Text style={styles.sheetEyebrow}>{eyebrow}</Text><Text style={styles.sheetTitle}>{title}</Text><Text style={styles.sheetBody}>{body}</Text></View>;
}

function PlayerSheet({ player, onAward }: { player: BaseballFeaturedPlayer; onAward: (award: BaseballAccolade) => void }) {
  const headshot = getEspnHeadshotUrlById(player.espnId, "MLB");
  return <View><View style={styles.sheetPlayerTop}>{headshot ? <Image source={{ uri: headshot }} style={styles.sheetPortrait} resizeMode="contain" /> : null}<View style={{ flex: 1 }}><Text style={styles.sheetEyebrow}>{player.team.toUpperCase()} · {player.position}</Text><Text style={styles.sheetTitle}>{player.name}</Text><Pressable onPress={() => openPlayer(player.espnId)} style={styles.profileLink}><Text style={styles.profileLinkText}>Open full player profile</Text><Ionicons name="arrow-forward" size={15} color={P.red} /></Pressable></View></View><View style={styles.sheetStats}>{player.stats.map((stat) => <View key={stat.label} style={styles.sheetStat}><Text style={styles.sheetStatValue}>{stat.value}</Text><Text style={styles.sheetStatLabel}>{stat.label}</Text></View>)}</View><Text style={styles.sheetSubhead}>Complete career hardware</Text><Text style={styles.sheetHint}>Chronological · tap any object for its story</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hardwareRail}>{[...player.awards].sort((a, b) => a.date.localeCompare(b.date)).map((award) => <HardwareButton key={award.id} award={award} onPress={() => onAward(award)} />)}</ScrollView></View>;
}

function AwardSheet({ player, award }: { player: BaseballFeaturedPlayer; award: BaseballAccolade }) {
  return <View style={styles.awardSheet}><Text style={styles.sheetEyebrow}>{player.name.toUpperCase()} · {award.year}</Text><View style={styles.largeAward}><AwardArtwork award={award} size={168} /></View><Text style={styles.sheetTitle}>{award.title}</Text><Text style={styles.awardDate}>{new Date(`${award.date}T12:00:00`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</Text><Text style={styles.sheetBody}>{award.detail}</Text></View>;
}

function CompareSheet({ ids }: { ids: string[] }) {
  const players = BASEBALL_FEATURED_PLAYERS.filter((player) => ids.includes(player.id));
  return <View><InfoSheet eyebrow="SIDE BY SIDE" title="Compare the season-shapers" body="Stats remain labeled because hitters and pitchers create value in different ways." />{players.map((player) => <View key={player.id} style={styles.compareRow}><View style={[styles.compareStripe, { backgroundColor: player.color }]} /><View style={{ flex: 1 }}><Text style={styles.compareName}>{player.name}</Text><Text style={styles.compareMeta}>{player.team} · {player.position}</Text><View style={styles.compareStats}>{player.stats.map((stat) => <Text key={stat.label} style={styles.compareStat}>{stat.value} <Text style={styles.compareStatLabel}>{stat.label}</Text></Text>)}</View></View></View>)}</View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: P.paper }, page: { alignSelf: "center" },
  header: { height: 52, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  iconButton: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,.72)", borderWidth: 1, borderColor: P.line },
  centerBrand: { position: "absolute", left: 70, right: 70, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 7 },
  headerBall: { width: 28, height: 28 }, headerTitle: { fontSize: 11, letterSpacing: 1.3, color: P.navy, fontFamily: FONTS.bodyHeavy },
  intro: { paddingTop: 9, paddingBottom: 17 }, pageTitle: { color: P.ink, fontFamily: FONTS.bodyHeavy, fontSize: 34, letterSpacing: -1.2 },
  dateRow: { marginTop: 5, flexDirection: "row", alignItems: "center", gap: 7 }, dateText: { color: P.muted, fontFamily: FONTS.bodyMedium, fontSize: 12 }, dateStrong: { color: P.red, fontFamily: FONTS.bodyBold, fontSize: 12 }, dateDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: P.brown },
  scopeRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 7, marginTop: 13 }, scopePill: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 30, backgroundColor: P.white, borderWidth: 1, borderColor: P.line }, scopePillOn: { backgroundColor: P.navy, borderColor: P.navy }, scopeText: { color: P.navy, fontFamily: FONTS.bodyBold, fontSize: 12 }, scopeTextOn: { color: P.white }, followPill: { marginLeft: "auto", flexDirection: "row", gap: 5, alignItems: "center", paddingHorizontal: 12, paddingVertical: 8 }, followText: { color: P.red, fontFamily: FONTS.bodyBold, fontSize: 12 },
  loadingCard: { padding: 24, backgroundColor: P.cream, borderRadius: 24 }, loadingText: { color: P.navy, fontFamily: FONTS.bodySemiBold, lineHeight: 20 },
  heroCard: { height: 300, borderRadius: 28, overflow: "hidden", backgroundColor: P.navy }, heroCardWide: { height: 350 }, heroImage: { borderRadius: 28 }, heroTopRow: { padding: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, statusPill: { paddingHorizontal: 11, paddingVertical: 6, borderRadius: 20, backgroundColor: P.red, flexDirection: "row", alignItems: "center", gap: 6 }, livePill: { backgroundColor: "rgba(198,40,40,.92)" }, statusPillText: { color: P.white, fontSize: 10, letterSpacing: 1, fontFamily: FONTS.bodyHeavy }, liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: P.white }, heroTime: { color: P.white, fontFamily: FONTS.display, fontSize: 18 }, heroBottom: { position: "absolute", left: 15, right: 15, bottom: 14 }, heroTeams: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, heroTeam: { alignItems: "center", width: 88, gap: 5 }, heroTeamName: { color: P.white, fontFamily: FONTS.bodyHeavy, fontSize: 13, textAlign: "center" }, heroCenter: { alignItems: "center", flex: 1 }, heroAt: { color: P.cream, fontFamily: FONTS.monoBold, fontSize: 12 }, heroScore: { color: P.white, fontFamily: FONTS.display, fontSize: 30 }, heroVenue: { color: "rgba(255,255,255,.75)", fontFamily: FONTS.bodyMedium, fontSize: 10, marginTop: 3, maxWidth: 130 }, heroReason: { marginTop: 15, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "rgba(255,255,255,.28)", paddingTop: 12, flexDirection: "row", alignItems: "center", gap: 8 }, heroReasonText: { flex: 1, color: P.white, fontSize: 12, fontFamily: FONTS.bodySemiBold },
  sectionTitleRow: { paddingTop: 28, paddingBottom: 12, flexDirection: "row", alignItems: "flex-end", gap: 12 }, eyebrow: { color: P.red, fontFamily: FONTS.monoBold, fontSize: 9, letterSpacing: 1.25, marginBottom: 4 }, sectionTitle: { color: P.ink, fontFamily: FONTS.bodyHeavy, fontSize: 22, letterSpacing: -.5 }, sectionAction: { flexDirection: "row", alignItems: "center", gap: 4, paddingBottom: 2 }, sectionActionText: { color: P.red, fontFamily: FONTS.bodyBold, fontSize: 12 },
  gameCard: { backgroundColor: P.white, padding: 13, borderRadius: 19, borderWidth: 1, borderColor: P.line }, gameCardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }, gameCardStatus: { color: P.navy, fontFamily: FONTS.bodyHeavy, fontSize: 11 }, diamondRow: { flexDirection: "row", gap: 3 }, tinyDiamond: { width: 8, height: 8, transform: [{ rotate: "45deg" }], borderWidth: 1, borderColor: P.brown }, tinyDiamondOn: { backgroundColor: P.red, borderColor: P.red }, gameTeamRow: { flexDirection: "row", alignItems: "center", minHeight: 34, gap: 8 }, gameTeamName: { flex: 1, color: P.ink, fontFamily: FONTS.bodyBold, fontSize: 13 }, gameScore: { color: P.navy, fontFamily: FONTS.display, fontSize: 18 }, gameCardNote: { color: P.muted, fontFamily: FONTS.body, fontSize: 10, marginTop: 7 },
  octoberCard: { backgroundColor: P.white, borderRadius: 26, borderWidth: 1, borderColor: P.line, padding: 17, overflow: "hidden" }, octoberTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }, octoberKicker: { color: P.green, fontFamily: FONTS.monoBold, fontSize: 9, letterSpacing: 1 }, octoberTitle: { color: P.navy, fontFamily: FONTS.bodyHeavy, fontSize: 25, marginTop: 4 }, helpButton: { width: 30, height: 30, borderRadius: 15, borderWidth: 1, borderColor: P.line, alignItems: "center", justifyContent: "center" }, helpText: { color: P.navy, fontFamily: FONTS.bodyHeavy, fontSize: 15 }, leagueSwitch: { alignSelf: "flex-start", flexDirection: "row", padding: 3, borderRadius: 20, backgroundColor: "#EEE8DD", marginVertical: 14 }, leagueChoice: { paddingVertical: 7, paddingHorizontal: 18, borderRadius: 18 }, leagueChoiceOn: { backgroundColor: P.navy }, leagueChoiceText: { color: P.muted, fontFamily: FONTS.bodyBold, fontSize: 11 }, leagueChoiceTextOn: { color: P.white }, seedGrid: { gap: 7 }, seedRow: { minHeight: 51, paddingHorizontal: 10, flexDirection: "row", alignItems: "center", gap: 9, backgroundColor: P.paper, borderRadius: 13 }, seedBye: { backgroundColor: "#F1E5D0" }, seedNo: { width: 14, color: P.red, fontFamily: FONTS.display, fontSize: 16 }, seedTeam: { color: P.ink, fontFamily: FONTS.bodyBold, fontSize: 13 }, seedRecord: { color: P.muted, fontFamily: FONTS.mono, fontSize: 9, marginTop: 2 }, seedPath: { color: P.green, fontFamily: FONTS.monoBold, fontSize: 9 }, octoberFooter: { marginTop: 14, paddingTop: 13, borderTopWidth: 1, borderTopColor: P.line, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, octoberFooterText: { color: P.navy, fontFamily: FONTS.bodyBold, fontSize: 12 }, emptyText: { color: P.muted, fontFamily: FONTS.bodyMedium, padding: 16 },
  filterRow: { marginBottom: 12 }, filterPill: { minHeight: 35, paddingHorizontal: 13, borderRadius: 18, backgroundColor: P.white, borderWidth: 1, borderColor: P.line, flexDirection: "row", alignItems: "center", gap: 5 }, filterPillOn: { backgroundColor: P.navy, borderColor: P.navy }, filterText: { color: P.navy, fontFamily: FONTS.bodyBold, fontSize: 11 }, filterTextOn: { color: P.white },
  playerRail: { gap: 14 }, playerGrid: { flexWrap: "wrap" }, playerCard: { borderRadius: 24, borderWidth: 1, borderColor: P.line, borderTopWidth: 5, backgroundColor: P.white, overflow: "hidden", paddingTop: 12, paddingBottom: 12 }, playerTopline: { paddingHorizontal: 13, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, positionFlag: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 13 }, positionFlagText: { color: P.white, fontFamily: FONTS.monoBold, fontSize: 10 }, compareToggle: { flexDirection: "row", gap: 4, alignItems: "center", borderRadius: 15, borderWidth: 1, borderColor: P.line, paddingHorizontal: 9, paddingVertical: 5 }, compareToggleOn: { backgroundColor: P.navy, borderColor: P.navy }, compareToggleText: { color: P.navy, fontFamily: FONTS.bodyBold, fontSize: 9 }, playerStage: { height: 185, marginTop: 1, position: "relative", justifyContent: "flex-end" }, playerPortraitButton: { width: "62%", height: "100%", alignSelf: "center", overflow: "hidden" }, playerPortrait: { width: "100%", height: "100%" }, statCascadeLeft: { position: "absolute", left: 15, top: 38, gap: 24 }, statCascadeRight: { position: "absolute", right: 15, top: 64, gap: 24, alignItems: "flex-end" }, floatStatValue: { color: P.ink, fontFamily: FONTS.display, fontSize: 18, letterSpacing: .3 }, floatStatLabel: { color: P.red, fontFamily: FONTS.monoBold, fontSize: 8, letterSpacing: .9, marginTop: -2 }, playerNameButton: { paddingHorizontal: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 }, playerName: { color: P.ink, fontFamily: FONTS.bodyHeavy, fontSize: 18 }, playerTeam: { color: P.muted, textAlign: "center", fontFamily: FONTS.bodyMedium, fontSize: 10, marginTop: 3 }, hardwareHeader: { marginHorizontal: 13, marginTop: 13, paddingTop: 10, borderTopWidth: 1, borderTopColor: P.line }, hardwareHeaderText: { color: P.brown, fontFamily: FONTS.monoBold, fontSize: 8, letterSpacing: .8 }, hardwareRail: { gap: 9, paddingHorizontal: 13, paddingTop: 8, paddingBottom: 5 }, hardwareButton: { width: 74, minHeight: 108, alignItems: "center", justifyContent: "flex-start", paddingTop: 3, paddingHorizontal: 4, borderRadius: 13, backgroundColor: P.paper, borderWidth: 1, borderColor: "#E9E1D5" }, hardwareYear: { color: P.red, fontFamily: FONTS.monoBold, fontSize: 9, marginTop: 2 }, hardwareLabel: { color: P.navy, fontFamily: FONTS.bodyHeavy, textAlign: "center", fontSize: 8, lineHeight: 10, marginTop: 2 }, quickViewButton: { marginHorizontal: 13, marginTop: 8, height: 37, borderRadius: 19, backgroundColor: "#F0E6D5", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 }, quickViewText: { color: P.navy, fontFamily: FONTS.bodyBold, fontSize: 11 },
  newsStack: { gap: 8 }, newsCard: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: P.white, borderRadius: 17, borderWidth: 1, borderColor: P.line, padding: 13 }, newsNumber: { color: P.cream, fontFamily: FONTS.display, fontSize: 25 }, newsTitle: { color: P.ink, fontFamily: FONTS.bodyBold, fontSize: 13, lineHeight: 18 }, newsMeta: { color: P.muted, fontFamily: FONTS.mono, fontSize: 9, marginTop: 5 },
  parkCard: { width: 245, height: 178, borderRadius: 22, overflow: "hidden", backgroundColor: P.navy }, parkCopy: { position: "absolute", left: 14, right: 14, bottom: 14 }, parkCity: { color: P.cream, fontFamily: FONTS.monoBold, fontSize: 9, letterSpacing: 1 }, parkName: { color: P.white, fontFamily: FONTS.bodyHeavy, fontSize: 19, marginTop: 3 }, parkNote: { color: "rgba(255,255,255,.78)", fontFamily: FONTS.bodyMedium, fontSize: 10, marginTop: 3 },
  lessonGrid: { gap: 9 }, lessonGridWide: { flexDirection: "row", flexWrap: "wrap" }, lessonCard: { minHeight: 124, padding: 15, borderRadius: 18, backgroundColor: P.cream, borderWidth: 1, borderColor: "#D8C09A" }, lessonTitle: { color: P.navy, fontFamily: FONTS.bodyHeavy, fontSize: 15, marginTop: 8 }, lessonDek: { color: P.brown, fontFamily: FONTS.bodyMedium, fontSize: 11, lineHeight: 16, marginVertical: 5, flex: 1 },
  historyCard: { minHeight: 112, padding: 12, marginBottom: 9, borderRadius: 19, backgroundColor: P.navy, flexDirection: "row", alignItems: "center", gap: 12 }, historyDate: { width: 51, height: 66, borderRadius: 13, backgroundColor: P.red, alignItems: "center", justifyContent: "center" }, historyMonth: { color: P.white, fontFamily: FONTS.monoBold, fontSize: 9 }, historyDay: { color: P.white, fontFamily: FONTS.display, fontSize: 27 }, historyEyebrow: { color: P.cream, fontFamily: FONTS.monoBold, fontSize: 8 }, historyTitle: { color: P.white, fontFamily: FONTS.bodyHeavy, fontSize: 15, marginTop: 3 }, historyBody: { color: "rgba(255,255,255,.68)", fontFamily: FONTS.body, fontSize: 10, lineHeight: 14, marginTop: 3 },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(8,15,27,.55)" }, sheet: { position: "absolute", left: 0, right: 0, bottom: 0, maxHeight: "84%", borderTopLeftRadius: 30, borderTopRightRadius: 30, backgroundColor: P.paper, paddingTop: 10 }, sheetHandle: { width: 42, height: 5, borderRadius: 3, backgroundColor: "#C8C0B4", alignSelf: "center" }, closeButton: { position: "absolute", zIndex: 2, right: 16, top: 16, width: 35, height: 35, borderRadius: 18, backgroundColor: P.white, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: P.line }, sheetContent: { padding: 22, paddingTop: 35, paddingBottom: 42 }, sheetEyebrow: { color: P.red, fontFamily: FONTS.monoBold, fontSize: 10, letterSpacing: 1.1, marginBottom: 6 }, sheetTitle: { color: P.ink, fontFamily: FONTS.bodyHeavy, fontSize: 27, letterSpacing: -.6, paddingRight: 35 }, sheetBody: { color: P.muted, fontFamily: FONTS.body, fontSize: 14, lineHeight: 22, marginTop: 12 }, sheetOption: { minHeight: 52, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: P.line }, sheetOptionText: { color: P.ink, fontFamily: FONTS.bodyBold, fontSize: 15 }, sheetPlayerTop: { flexDirection: "row", alignItems: "center", gap: 14 }, sheetPortrait: { width: 100, height: 118, borderRadius: 20, backgroundColor: P.cream }, profileLink: { marginTop: 9, flexDirection: "row", alignItems: "center", gap: 5 }, profileLinkText: { color: P.red, fontFamily: FONTS.bodyBold, fontSize: 11 }, sheetStats: { flexDirection: "row", gap: 7, marginTop: 18 }, sheetStat: { flex: 1, alignItems: "center", paddingVertical: 12, borderRadius: 14, backgroundColor: P.white, borderWidth: 1, borderColor: P.line }, sheetStatValue: { color: P.navy, fontFamily: FONTS.display, fontSize: 18 }, sheetStatLabel: { color: P.red, fontFamily: FONTS.monoBold, fontSize: 8 }, sheetSubhead: { color: P.ink, fontFamily: FONTS.bodyHeavy, fontSize: 17, marginTop: 22 }, sheetHint: { color: P.muted, fontFamily: FONTS.bodyMedium, fontSize: 10, marginTop: 3 }, awardSheet: { alignItems: "center" }, largeAward: { height: 190, justifyContent: "center", alignItems: "center", marginVertical: 8 }, awardDate: { color: P.red, fontFamily: FONTS.monoBold, fontSize: 10, marginTop: 8 }, compareRow: { flexDirection: "row", backgroundColor: P.white, borderRadius: 17, overflow: "hidden", marginTop: 12, borderWidth: 1, borderColor: P.line }, compareStripe: { width: 6 }, compareName: { color: P.ink, fontFamily: FONTS.bodyHeavy, fontSize: 16, marginTop: 12, paddingHorizontal: 12 }, compareMeta: { color: P.muted, fontFamily: FONTS.bodyMedium, fontSize: 10, paddingHorizontal: 12, marginTop: 2 }, compareStats: { flexDirection: "row", flexWrap: "wrap", gap: 8, padding: 12 }, compareStat: { color: P.navy, fontFamily: FONTS.display, fontSize: 13 }, compareStatLabel: { color: P.red, fontFamily: FONTS.monoBold, fontSize: 8 },
});
