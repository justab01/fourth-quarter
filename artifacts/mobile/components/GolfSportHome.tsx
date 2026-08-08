import React, { useMemo, useState } from "react";
import {
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { SearchButton } from "@/components/SearchButton";
import { SportFloatingNav, SPORT_NAV_CLEARANCE } from "@/components/SportFloatingNav";
import { FONTS } from "@/constants/typography";
import { GOLF_CULTURE_CARDS, GOLF_FEATURED_FACES, GOLF_LESSONS, GOLF_STORY_LABELS } from "@/constants/golfHome";
import type {
  GolfHomeResponse,
  GolfLeaderboardEntry,
  GolfRankingEntry,
  GolfTournament,
  GolfTournamentSnapshot,
  SportNewsArticle,
} from "@/utils/api";

const P = {
  ink: "#2C3E50",
  inkDeep: "#1E2D38",
  blueGray: "#758789",
  sage: "#C8CDC7",
  egret: "#DED8CF",
  paper: "#F4F1EC",
  pearl: "#E8DED6",
  green: "#315847",
  greenSoft: "#6F887A",
  live: "#A3424F",
  sand: "#C9B48B",
  white: "#FFFFFF",
  line: "rgba(44,62,80,.14)",
  muted: "#6C777B",
};

interface Props {
  topInset: number;
  activeLeague: string;
  onSelectLeague: (key: string) => void;
  home: GolfHomeResponse | undefined;
  schedule: GolfTournament[];
  rankings: GolfRankingEntry[];
  news: SportNewsArticle[];
  loading: boolean;
  refreshing: boolean;
  onRefresh: () => void;
}

const TOUR_FILTERS = [
  { key: "all", label: "All Golf" },
  { key: "PGA", label: "PGA Tour" },
  { key: "LPGA", label: "LPGA" },
  { key: "LIV", label: "LIV" },
] as const;

const TOUR_ART: Record<string, string> = {
  PGA: "https://a.espncdn.com/photo/2026/0808/r1698980_600x400_3-2.jpg",
  LPGA: "https://a.espncdn.com/photo/2025/0824/r1536283_1296x729_16-9.jpg",
  LIV: "https://a.espncdn.com/photo/2026/0430/r1651426_1296x729_16-9.jpg",
};

const stateLabel = (event: GolfTournamentSnapshot) => {
  if (event.status.state === "live") return "LIVE";
  if (event.status.state === "playoff") return "PLAYOFF";
  if (event.status.state === "delayed") return "DELAYED";
  if (event.status.state === "suspended") return "SUSPENDED";
  if (event.status.state === "round_complete") return "ROUND COMPLETE";
  if (event.status.state === "final") return "FINAL";
  return "NEXT UP";
};

const relativeTime = (iso: string) => {
  const timestamp = new Date(iso).getTime();
  if (!Number.isFinite(timestamp)) return "Update time unavailable";
  const minutes = Math.max(0, Math.round((Date.now() - timestamp) / 60_000));
  if (minutes < 1) return "Updated just now";
  if (minutes === 1) return "Updated 1 min ago";
  if (minutes < 60) return `Updated ${minutes} min ago`;
  return `Updated ${new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
};

const initials = (name: string) => name.split(/\s+/).map((word) => word[0]).join("").slice(0, 2).toUpperCase();

const countryFlag = (code: string) => {
  if (!/^[A-Z]{2}$/.test(code)) return "";
  return String.fromCodePoint(...code.split("").map((letter) => 127397 + letter.charCodeAt(0)));
};

const formatDate = (iso: string | null) => {
  if (!iso) return "Date TBD";
  const calendarDate = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  const date = calendarDate
    ? new Date(Number(calendarDate[1]), Number(calendarDate[2]) - 1, Number(calendarDate[3]), 12)
    : new Date(iso);
  if (Number.isNaN(date.getTime())) return "Date TBD";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const holeTone = (score: number | null) => {
  if (score == null || score === 0) return { backgroundColor: "rgba(255,255,255,.12)", borderColor: "rgba(255,255,255,.28)" };
  if (score <= -2) return { backgroundColor: "#D7B866", borderColor: "#F1D88E" };
  if (score === -1) return { backgroundColor: "#7EAA91", borderColor: "#A9CCB8" };
  if (score === 1) return { backgroundColor: "#A45A56", borderColor: "#C87A74" };
  return { backgroundColor: "#793E43", borderColor: "#A65C63" };
};

function Headshot({ uri, name, size = 44, dark = false }: { uri?: string | null; name: string; size?: number; dark?: boolean }) {
  const [failed, setFailed] = useState(false);
  if (!uri || failed) {
    return (
      <View style={[styles.headshotFallback, { width: size, height: size, borderRadius: size / 2 }, dark && styles.headshotFallbackDark]}>
        <Text style={[styles.headshotInitials, dark && { color: P.paper }]}>{initials(name)}</Text>
      </View>
    );
  }
  return (
    <Image
      source={{ uri }}
      style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: P.sage }}
      resizeMode="cover"
      onError={() => setFailed(true)}
      accessibilityLabel={`${name} headshot`}
    />
  );
}

function SectionHeading({ eyebrow, title, action, onAction }: { eyebrow: string; title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionHeading}>
      <View style={{ flex: 1 }}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {action && onAction ? (
        <Pressable onPress={onAction} hitSlop={10} style={styles.headingAction}>
          <Text style={styles.headingActionText}>{action}</Text>
          <Ionicons name="arrow-forward" size={15} color={P.green} />
        </Pressable>
      ) : action ? <Text style={styles.headingHint}>{action}</Text> : null}
    </View>
  );
}

function TournamentStatus({ event }: { event: GolfTournamentSnapshot }) {
  const live = ["live", "playoff", "delayed", "suspended"].includes(event.status.state);
  return (
    <View style={[styles.eventStatus, live && styles.eventStatusLive]}>
      {live ? <View style={styles.liveDot} /> : null}
      <Text style={[styles.eventStatusText, live && styles.eventStatusTextLive]}>{stateLabel(event)}</Text>
    </View>
  );
}

function LeaderRow({ entry, event, featured = false }: { entry: GolfLeaderboardEntry; event: GolfTournamentSnapshot; featured?: boolean }) {
  const openPlayer = () => {
    if (!entry.athleteId) return;
    router.push({ pathname: "/player/[id]", params: { id: `${event.tour}-${entry.athleteId}` } } as any);
  };
  return (
    <Pressable onPress={openPlayer} disabled={!entry.athleteId} style={[styles.leaderRow, featured && styles.leaderRowFeatured]} accessibilityRole={entry.athleteId ? "button" : undefined}>
      <View style={styles.positionColumn}>
        <Text style={[styles.positionText, featured && styles.positionTextFeatured]}>{entry.positionLabel}</Text>
      </View>
      <Headshot uri={entry.headshotUrl} name={entry.name} size={featured ? 50 : 42} />
      <View style={styles.leaderIdentity}>
        <Text style={styles.leaderName} numberOfLines={1}>{entry.name}</Text>
        <Text style={styles.leaderMeta} numberOfLines={1}>
          {[countryFlag(entry.countryCode), entry.country, entry.activeRound ? `R${entry.activeRound}` : null].filter(Boolean).join("  ·  ")}
        </Text>
      </View>
      <View style={styles.roundColumn}>
        <Text style={styles.todayScore}>{entry.today}</Text>
        <Text style={styles.thruText}>{entry.thru === "F" ? "ROUND FINAL" : entry.thru === "-" ? "NOT STARTED" : `THRU ${entry.thru}`}</Text>
      </View>
      <Text style={styles.totalScore}>{entry.score}</Text>
    </Pressable>
  );
}

function LiveGolfWorld({ home }: { home: GolfHomeResponse }) {
  const event = home.featured;
  if (!event) {
    return (
      <View style={styles.emptyCard}>
        <Ionicons name="flag-outline" size={25} color={P.green} />
        <Text style={styles.emptyTitle}>The course is quiet right now</Text>
        <Text style={styles.emptyText}>The next verified tournament and tee-time window will appear here as soon as the feed publishes it.</Text>
      </View>
    );
  }

  const leader = event.leaderboard[0];
  const activeRound = leader?.rounds.find((round) => round.round === leader.activeRound && round.holesCompleted > 0);
  const holes = activeRound?.holes ?? [];
  const openTournament = () => router.push({ pathname: "/golf/tournament/[id]", params: { id: event.id, tour: event.tour } } as any);
  const openCourse = () => router.push({ pathname: "/golf/course/[id]", params: { id: event.id, name: event.venue, tournament: event.name } } as any);

  return (
    <View style={styles.liveWorld}>
      <View style={styles.liveWorldTop}>
        <View style={{ flex: 1 }}>
          <View style={styles.liveMetaRow}>
            <Text style={styles.tourMark}>{event.tour}</Text>
            <TournamentStatus event={event} />
          </View>
          <Text style={styles.eventName}>{event.name}</Text>
          <Text style={styles.eventVenue}>{[event.venue, event.location].filter(Boolean).join("  ·  ")}</Text>
        </View>
        <View style={styles.roundBadge}>
          <Text style={styles.roundBadgeSmall}>ROUND</Text>
          <Text style={styles.roundBadgeNumber}>{event.status.round ?? "—"}</Text>
        </View>
      </View>

      <View style={styles.leaderboardHeader}>
        <Text style={styles.tableLabel}>LEADERBOARD GLANCE</Text>
        <Text style={styles.tableLabel}>{event.leaderboard.length} PLAYERS</Text>
      </View>
      <View style={styles.leaderboardRows}>
        {event.leaderboard.slice(0, 5).map((entry, index) => (
          <LeaderRow key={`${entry.athleteId ?? entry.name}-${index}`} entry={entry} event={event} featured={index === 0} />
        ))}
      </View>
      <Pressable onPress={openTournament} style={styles.fullBoardButton} accessibilityRole="button">
        <Text style={styles.fullBoardButtonText}>Open the Tournament Room</Text>
        <Ionicons name="arrow-forward" size={18} color={P.paper} />
      </Pressable>

      <View style={styles.coursePulse}>
        <View style={styles.pulseHeader}>
          <View>
            <Text style={styles.pulseEyebrow}>COURSE PULSE</Text>
            <Text style={styles.pulseTitle}>{home.pulse?.headline ?? event.status.detail}</Text>
          </View>
          <Ionicons name="pulse" size={26} color={P.sand} />
        </View>
        {holes.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.holeRail} accessibilityLabel={`${leader?.name ?? "Leader"} hole progress`}>
            {holes.map((hole) => (
              <View key={`${hole.hole}-${hole.playingOrder}`} style={styles.holeItem}>
                <Text style={styles.holeNumber}>{hole.hole}</Text>
                <View style={[styles.holeResult, holeTone(hole.scoreToPar)]}>
                  <Text style={styles.holeStrokes}>{hole.displayStrokes ?? "—"}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        ) : (
          <Text style={styles.pulseUnavailable}>Hole-by-hole scoring has not been published for this round.</Text>
        )}
        <View style={styles.pulseFooter}>
          <Text style={styles.pulseDetail}>{home.pulse?.detail ?? event.status.detail}</Text>
          <Text style={styles.freshness}>{relativeTime(event.provenance.sourceTimestamp)}{event.provenance.stale ? " · delayed feed" : ""}</Text>
        </View>
      </View>

      <Pressable onPress={openCourse} style={styles.courseEntry} accessibilityRole="button">
        <View style={styles.courseContour}>
          <View style={styles.greenShape} />
          <View style={styles.fairwayShape} />
          <View style={styles.teeShape} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.courseEntryEyebrow}>COURSE ATLAS</Text>
          <Text style={styles.courseEntryTitle}>{event.venue || "Course details"}</Text>
          <Text style={styles.courseEntryText}>Explore verified hole information and available course geometry.</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={P.ink} />
      </Pressable>
    </View>
  );
}

function AcrossTours({ events }: { events: GolfTournamentSnapshot[] }) {
  if (events.length === 0) return null;
  return (
    <View style={styles.section}>
      <SectionHeading eyebrow="ACROSS THE TOURS" title="Two live worlds. One glance." action="Swipe" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalRail}>
        {events.map((event) => {
          const leader = event.leaderboard[0];
          const imageUrl = TOUR_ART[event.tour];
          const metrics = leader ? [
            { value: leader.name.split(" ").at(-1) ?? leader.name, label: "LEADER" },
            { value: leader.thru === "-" ? "—" : leader.thru, label: leader.thru === "F" ? "FINISHED" : "THRU" },
            { value: event.course?.par ? String(event.course.par) : event.purse || "—", label: event.course?.par ? "PAR" : "PURSE" },
          ] : [
            { value: formatDate(event.date), label: "FIRST TEE" },
            { value: event.course?.par ? String(event.course.par) : "—", label: "PAR" },
            { value: event.purse || "—", label: "PURSE" },
          ];
          return (
            <Pressable key={`${event.tour}-${event.id}`} onPress={() => router.push({ pathname: "/golf/tournament/[id]", params: { id: event.id, tour: event.tour } } as any)} style={styles.tourCard}>
              <View style={styles.tourArt}>
                {imageUrl ? <Image source={{ uri: imageUrl }} style={StyleSheet.absoluteFillObject} resizeMode="cover" /> : null}
                <LinearGradient colors={["rgba(30,45,56,.02)", "rgba(30,45,56,.84)"]} style={StyleSheet.absoluteFillObject} />
                <View style={styles.tourArtBadge}><Text style={styles.tourArtBadgeText}>{event.tour} · {stateLabel(event)}</Text></View>
                <Text style={styles.tourArtScore}>{leader?.score ?? formatDate(event.date)}</Text>
              </View>
              <View style={styles.tourCardBody}>
                <Text style={styles.tourCardTitle} numberOfLines={2}>{event.name}</Text>
                <Text style={styles.tourCardVenue} numberOfLines={1}>{event.venue || event.location || "Venue to be confirmed"}</Text>
                <View style={styles.tourMetrics}>{metrics.map((metric) => <View key={metric.label} style={styles.tourMetric}><Text style={styles.tourMetricValue} numberOfLines={1}>{metric.value}</Text><Text style={styles.tourMetricLabel}>{metric.label}</Text></View>)}</View>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

function PressureCard({ event }: { event: GolfTournamentSnapshot | null }) {
  if (!event || event.leaderboard.length === 0) return null;
  const scores = event.leaderboard.slice(0, 5).map((entry) => entry.toPar).filter((score): score is number => score != null);
  const spread = scores.length > 1 ? Math.max(...scores) - Math.min(...scores) : null;
  const leader = event.leaderboard[0];
  const leaderRound = leader?.rounds.find((round) => round.round === leader.activeRound && round.holesCompleted > 0);
  const completedHoles = leaderRound?.holes.filter((hole) => hole.completed) ?? [];
  const birdies = completedHoles.filter((hole) => hole.scoreToPar != null && hole.scoreToPar < 0).length;
  const pars = completedHoles.filter((hole) => hole.scoreToPar === 0).length;
  const bogeys = completedHoles.filter((hole) => hole.scoreToPar != null && hole.scoreToPar > 0).length;
  const leaderScore = leader?.toPar;
  const inRange = leaderScore == null ? 0 : event.leaderboard.filter((entry) => entry.toPar != null && entry.toPar - leaderScore <= 2).length;
  const activeContenders = event.leaderboard.slice(0, 5).filter((entry) => entry.holesCompleted > 0 && entry.holesCompleted < 18);
  const remaining = activeContenders.length > 0
    ? Math.max(...activeContenders.map((entry) => 18 - entry.holesCompleted))
    : null;
  const headline = spread == null
    ? "The leaderboard is still taking shape."
    : spread <= 2
      ? "One swing can rewrite the top of the board."
      : spread <= 5
        ? "The leaders have separation—but not safety."
        : "The chase needs a run of red numbers.";
  return (
    <View style={styles.section}>
      <SectionHeading eyebrow="INSIDE THE ROUND" title="Pressure, translated" action="Why it matters" />
      <View style={styles.pressureCard}>
        <View style={styles.pressureTop}>
          <Text style={styles.pressureTitle}>{headline}</Text>
          <View style={styles.pressureNumberBlock}><Text style={styles.pressureNumber}>{inRange || "—"}</Text><Text style={styles.pressureNumberLabel}>IN RANGE</Text></View>
        </View>
        <Text style={styles.pressureText}>{spread == null ? event.status.detail : `Only ${spread} ${spread === 1 ? "stroke" : "strokes"} separate the top five verified scores.`}{remaining != null ? ` A top-five contender still has ${remaining} holes to answer.` : ""}</Text>
        <View style={styles.pressureStats}>
          {[{ value: birdies, label: "BIRDIES", tone: "good" }, { value: pars, label: "PARS" }, { value: bogeys, label: "BOGEYS", tone: "bad" }, { value: completedHoles.length || "—", label: "PLAYED" }, { value: spread ?? "—", label: "SHOT GAP" }].map((stat) => (
            <View key={stat.label} style={[styles.pressureStat, stat.tone === "good" && styles.pressureStatGood, stat.tone === "bad" && styles.pressureStatBad]}><Text style={styles.pressureStatValue}>{stat.value}</Text><Text style={styles.pressureStatLabel}>{stat.label}</Text></View>
          ))}
        </View>
      </View>
    </View>
  );
}

function KnowTheGround({ event, imageUrl }: { event: GolfTournamentSnapshot | null; imageUrl?: string | null }) {
  if (!event?.venue) return null;
  return (
    <View style={styles.section}>
      <SectionHeading eyebrow="COURSE INTELLIGENCE" title="Know the ground" action="Course Atlas" onAction={() => router.push({ pathname: "/golf/course/[id]", params: { id: event.id, name: event.venue, tournament: event.name } } as any)} />
      <Pressable style={styles.groundCard} onPress={() => router.push({ pathname: "/golf/course/[id]", params: { id: event.id, name: event.venue, tournament: event.name } } as any)}>
        {imageUrl ? <Image source={{ uri: imageUrl }} style={StyleSheet.absoluteFillObject} resizeMode="cover" /> : null}
        <LinearGradient colors={imageUrl ? ["rgba(30,45,56,.05)", "rgba(30,45,56,.88)"] : [P.greenSoft, P.inkDeep]} style={StyleSheet.absoluteFillObject} />
        <View style={styles.groundTopLine}>
          <View style={styles.groundPin}><Ionicons name="flag" size={15} color={P.paper} /></View>
          <Text style={styles.groundLocation}>{event.location || "Location not supplied"}</Text>
        </View>
        <View style={styles.groundBottom}>
          <Text style={styles.groundName}>{event.venue} is shaping every decision.</Text>
          <Text style={styles.groundEvent}>{event.name} · {event.location}</Text>
          <Text style={styles.groundHonesty}>Open the verified routing to see every hole, par, yardage and current condition.</Text>
        </View>
        <View style={styles.groundMetrics}>
          {[{ value: event.course?.par ?? "—", label: "PAR" }, { value: event.course?.totalYards?.toLocaleString() ?? "—", label: "YARDS" }, { value: event.course?.weather?.temperature != null ? `${event.course.weather.temperature}°` : "—", label: "WEATHER" }, { value: event.course?.weather?.windSpeed ?? "—", label: "WIND MPH" }].map((metric) => <View key={metric.label} style={styles.groundMetric}><Text style={styles.groundMetricValue}>{metric.value}</Text><Text style={styles.groundMetricLabel}>{metric.label}</Text></View>)}
        </View>
      </Pressable>
    </View>
  );
}

function SeasonRace({ rankings, activeLeague }: { rankings: GolfRankingEntry[]; activeLeague: string }) {
  if (rankings.length === 0 || (activeLeague !== "all" && activeLeague !== "PGA")) return null;
  const shown = [rankings[0], rankings[1], rankings[2], rankings[29]].filter((entry): entry is GolfRankingEntry => Boolean(entry));
  return (
    <View style={styles.section}>
      <SectionHeading eyebrow="THE SEASON RACE" title="The road narrows now" action="FedExCup" />
      <View style={styles.raceCard}>
        <View style={styles.raceIntro}>
          <Text style={styles.raceIntroTitle}>From 70 golfers{`\n`}to one champion.</Text>
          <Text style={styles.raceIntroMeta}>THE PLAYOFF PATH</Text>
        </View>
        <View style={styles.raceExplanation}><Ionicons name="eye-outline" size={21} color={P.green} /><Text style={styles.raceExplanationText}>Each playoff week removes another group. The number is how many golfers survive into that stage.</Text></View>
        <View style={styles.raceGates}>
          {[{ number: 70, name: "ST. JUDE", note: "Begin" }, { number: 50, name: "BMW", note: "Survive" }, { number: 30, name: "TOUR CHAMP.", note: "Finale" }].map((gate, index) => <React.Fragment key={gate.number}><View style={[styles.raceGate, index === 0 && styles.raceGateActive]}><Text style={[styles.raceGateNumber, index === 0 && styles.raceGateNumberActive]}>{gate.number}</Text><Text style={[styles.raceGateName, index === 0 && styles.raceGateNameActive]}>{gate.name}</Text><Text style={[styles.raceGateNote, index === 0 && styles.raceGateNoteActive]}>{gate.note}</Text></View>{index < 2 ? <Ionicons name="chevron-forward" size={14} color={P.blueGray} /> : null}</React.Fragment>)}
        </View>
        {shown.map((entry) => (
          <View key={`${entry.rank}-${entry.name}`} style={styles.raceRow}>
            <Text style={styles.raceRank}>{entry.rank}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.raceName}>{entry.name}</Text>
              <Text style={styles.raceCountry}>{entry.country || `${entry.events} events`}</Text>
            </View>
            <View style={styles.racePointsBlock}>
              <Text style={styles.racePoints}>{entry.points.toLocaleString()}</Text>
              <Text style={styles.racePointsLabel}>POINTS</Text>
            </View>
          </View>
        ))}
        <View style={styles.raceBubble}><Text style={styles.raceBubbleTitle}>The final doorway</Text><Text style={styles.raceBubbleText}>Only the top 30 reach the finale</Text></View>
      </View>
    </View>
  );
}

function FacePortrait({ uri, name }: { uri: string; name: string }) {
  const [failed, setFailed] = useState(false);
  return failed ? <View style={styles.faceImageFallback}><Text style={styles.faceImageFallbackText}>{initials(name)}</Text></View> : <Image source={{ uri }} style={styles.faceImage} resizeMode="contain" onError={() => setFailed(true)} accessibilityLabel={`${name} portrait`} />;
}

function FacesOfGolf({ rankings, activeLeague }: { rankings: GolfRankingEntry[]; activeLeague: string }) {
  const dynamicPga = rankings.slice(0, 4).map((entry) => ({
    athleteId: entry.athleteId ?? "",
    name: entry.name,
    tour: "PGA",
    country: entry.country,
    badge: `FEDEXCUP ${entry.rank}`,
    headshotUrl: entry.headshotUrl ?? "",
    accolades: [`${entry.points.toLocaleString()} points`, `${entry.wins} ${entry.wins === 1 ? "win" : "wins"}`, `${entry.topTens} top 10s`],
  }));
  const curated = GOLF_FEATURED_FACES.filter((athlete) => activeLeague === "all" || athlete.tour === activeLeague);
  const visible = activeLeague === "PGA" && dynamicPga.length > 0 ? dynamicPga : curated;
  if (visible.length === 0) return null;
  return (
    <View style={styles.section}>
      <SectionHeading eyebrow="FACES OF THE GAME" title="Golf has more than one center" action="Follow golfers" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.playerRail}>
        {visible.slice(0, 10).map((athlete, index) => (
          <Pressable
            key={`${athlete.name}-${index}`}
            style={styles.playerCard}
            onPress={() => athlete.athleteId ? router.push({ pathname: "/player/[id]", params: { id: `${athlete.tour}-${athlete.athleteId}` } } as any) : undefined}
          >
            <LinearGradient colors={[index % 3 === 0 ? P.blueGray : index % 3 === 1 ? "#D2C7B9" : "#667A77", P.inkDeep]} style={styles.playerPortrait}>
              <View style={styles.faceFollow}><Ionicons name="add" size={16} color={P.white} /></View>
              <View style={styles.playerRankBadge}><Text style={styles.playerRankText}>{athlete.badge}</Text></View>
              <FacePortrait uri={athlete.headshotUrl} name={athlete.name} />
              <LinearGradient colors={["transparent", "rgba(30,45,56,.96)"]} style={styles.faceGradient} />
              <View style={styles.faceIdentity}><Text style={styles.playerName} numberOfLines={1}>{athlete.name}</Text><Text style={styles.playerCountry} numberOfLines={1}>{athlete.tour} · {athlete.country}</Text></View>
              <View style={styles.faceAccolades}>{athlete.accolades.map((accolade) => <View key={accolade} style={styles.faceAccolade}><Text style={styles.faceAccoladeText}>{accolade}</Text></View>)}</View>
            </LinearGradient>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

function LearnGolf() {
  return (
    <View style={styles.section}>
      <SectionHeading eyebrow="UNDERSTAND THE GAME" title="See what the golfer sees" action="Golf intelligence" />
      <View style={styles.lessonGrid}>
        {GOLF_LESSONS.map((lesson, index) => (
          <View key={lesson.id} style={[styles.lessonCard, index === 0 && styles.lessonCardDark, index === 1 && styles.lessonCardWarm]}>
            <View style={styles.lessonIcon}><Ionicons name={lesson.icon} size={22} color={P.paper} /></View>
            <Text style={[styles.lessonTitle, index === 0 && { color: P.paper }]}>{lesson.title}</Text>
            <Text style={[styles.lessonText, index === 0 && { color: P.sage }]}>{lesson.description}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function GolfSchedule({ schedule }: { schedule: GolfTournament[] }) {
  if (schedule.length === 0) return null;
  const items = schedule.filter((event) => event.status !== "completed").slice(0, 8);
  if (items.length === 0) return null;
  return (
    <View style={styles.section}>
      <SectionHeading eyebrow="THE NEXT SEVEN DAYS" title="Golf never stops moving" action="Full calendar" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timelineRail}>
        {items.map((event, index) => (
          <View key={event.id} style={styles.timelineDay}>
            <Text style={styles.timelineDate}>{formatDate(event.date).toUpperCase()}</Text>
            <View style={[styles.timelineDot, index === 0 && styles.timelineDotLive]} />
            <Text style={styles.timelineTitle} numberOfLines={3}>{event.name}</Text>
            <Text style={styles.timelineCopy} numberOfLines={3}>{[event.course, event.location].filter(Boolean).join(" · ") || "Venue to be confirmed"}</Text>
            <Text style={styles.timelineTag}>{index === 0 && event.status === "live" ? "LIVE NOW" : event.isMajor ? "MAJOR" : "TOUR STOP"}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function GolfCulture() {
  return (
    <View style={styles.section}>
      <SectionHeading eyebrow="STORIES · GUIDES · GOLF CULTURE" title="Golf, in full" action="Beyond the leaderboard" />
      <View style={styles.cultureGrid}>
        {GOLF_CULTURE_CARDS.map((card, index) => <View key={card.title} style={[styles.cultureCard, index === 1 && styles.cultureCardLight]}><View style={styles.cultureTop}><Text style={[styles.cultureEyebrow, index === 1 && styles.cultureTextDark]}>{card.eyebrow}</Text><Text style={[styles.cultureFormat, index === 1 && styles.cultureTextDark]}>{card.format}</Text></View><Ionicons name={card.icon} size={27} color={index === 1 ? P.ink : P.sand} /><Text style={[styles.cultureTitle, index === 1 && styles.cultureTextDark]}>{card.title}</Text><Text style={[styles.cultureDescription, index === 1 && styles.cultureDescriptionDark]}>{card.description}</Text></View>)}
      </View>
    </View>
  );
}

function GolfStories({ news }: { news: SportNewsArticle[] }) {
  if (news.length === 0) return null;
  return (
    <View style={styles.section}>
      <SectionHeading eyebrow="AROUND THE GOLF WORLD" title="Stories worth the walk" action="All golf news" />
      <View style={styles.storyStack}>
        {news.slice(0, 6).map((article, index) => (
          <Pressable key={article.id} style={[styles.storyCard, index === 0 && styles.storyCardLead]}>
            {article.imageUrl ? <Image source={{ uri: article.imageUrl }} style={index === 0 ? styles.storyImageLead : styles.storyImage} resizeMode="cover" /> : null}
            {index === 0 ? <LinearGradient colors={["rgba(30,45,56,.04)", "rgba(30,45,56,.96)"]} style={StyleSheet.absoluteFillObject} /> : null}
            <View style={styles.storyCopy}>
              <Text style={styles.storyLabel}>{GOLF_STORY_LABELS[index % GOLF_STORY_LABELS.length]} · {article.source}</Text>
              <Text style={[styles.storyTitle, index === 0 && styles.storyTitleLead]} numberOfLines={index === 0 ? 3 : 2}>{article.title}</Text>
              {index === 0 && article.summary ? <Text style={styles.storySummary} numberOfLines={3}>{article.summary}</Text> : null}
            </View>
            <Ionicons name="arrow-up-outline" size={17} color={P.green} style={{ transform: [{ rotate: "45deg" }] }} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export default function GolfSportHome({
  topInset,
  activeLeague,
  onSelectLeague,
  home,
  schedule,
  rankings,
  news,
  loading,
  refreshing,
  onRefresh,
}: Props) {
  const { width } = useWindowDimensions();
  const wide = width >= 760;
  const [following, setFollowing] = useState(false);
  const heroImage = news.find((article) => article.imageUrl)?.imageUrl ?? null;
  const venueImage = useMemo(() => {
    const eventWords = home?.featured?.name.toLowerCase().split(/\s+/).filter((word) => word.length > 4) ?? [];
    return news.find((article) => article.imageUrl && eventWords.some((word) => `${article.title} ${article.summary}`.toLowerCase().includes(word)))?.imageUrl ?? null;
  }, [home?.featured?.name, news]);
  const liveCount = [home?.featured, ...(home?.acrossTours ?? [])].filter((event) => event && ["live", "playoff", "delayed", "suspended"].includes(event.status.state)).length;
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });

  return (
    <View style={[styles.root, { paddingTop: topInset }]}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, wide && styles.scrollContentWide]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={P.green} />}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.headerButton} hitSlop={8} accessibilityLabel="Back">
            <Ionicons name="chevron-back" size={23} color={P.ink} />
          </Pressable>
          <View style={styles.headerIdentity} pointerEvents="none">
            <Text style={styles.headerBrand}>THE FOURTH QUARTER</Text>
            <Text style={styles.headerSport}>GOLF</Text>
          </View>
          <View style={styles.headerButton}><SearchButton /></View>
        </View>

        <View style={styles.dayRow}>
          <View>
            <Text style={styles.dayText}>{today}</Text>
            <Text style={styles.daySubtext}>{liveCount > 0 ? `${liveCount} live ${liveCount === 1 ? "tournament" : "tournaments"}` : "The next meaningful tee time"}</Text>
          </View>
          <Pressable onPress={() => setFollowing((value) => !value)} style={[styles.followButton, following && styles.followButtonActive]}>
            <Ionicons name={following ? "checkmark" : "add"} size={17} color={following ? P.paper : P.green} />
            <Text style={[styles.followText, following && styles.followTextActive]}>{following ? "Following" : "Follow"}</Text>
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tourFilters}>
          {TOUR_FILTERS.map((tour) => {
            const active = activeLeague === tour.key;
            return (
              <Pressable key={tour.key} onPress={() => onSelectLeague(tour.key)} style={[styles.tourFilter, active && styles.tourFilterActive]}>
                <Text style={[styles.tourFilterText, active && styles.tourFilterTextActive]}>{tour.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.heartbeatHero}>
          {heroImage ? <Image source={{ uri: heroImage }} style={StyleSheet.absoluteFillObject} resizeMode="cover" /> : null}
          <LinearGradient colors={heroImage ? ["rgba(30,45,56,.16)", "rgba(30,45,56,.94)"] : [P.greenSoft, P.inkDeep]} style={StyleSheet.absoluteFillObject} />
          <View style={styles.heroTop}>
            <View style={styles.heroFlag}><Ionicons name="flag" size={16} color={P.ink} /></View>
            <Text style={styles.heroKicker}>{home?.featured?.isMajor ? "MAJOR MODE" : liveCount > 0 ? "THE GOLF HEARTBEAT" : "NEXT ON THE TEE"}</Text>
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.heroTitle}>{home?.pulse?.headline ?? home?.featured?.name ?? "Golf is always moving somewhere"}</Text>
            <Text style={styles.heroDescription}>{home?.pulse?.detail ?? home?.featured?.status.detail ?? "Live tournaments, the season race and the next course that matters—together in one place."}</Text>
            {home?.featured ? (
              <Pressable onPress={() => router.push({ pathname: "/golf/tournament/[id]", params: { id: home.featured!.id, tour: home.featured!.tour } } as any)} style={styles.heroAction}>
                <Text style={styles.heroActionText}>{liveCount > 0 ? "Enter live tournament" : "Preview tournament"}</Text>
                <Ionicons name="arrow-forward" size={17} color={P.ink} />
              </Pressable>
            ) : null}
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeading eyebrow="RIGHT NOW" title="The Live Golf World" />
          {home ? <LiveGolfWorld home={home} /> : (
            <View style={styles.loadingCard}>
              <View style={styles.loadingLineWide} />
              <View style={styles.loadingLine} />
              <View style={styles.loadingRows} />
              <Text style={styles.loadingText}>{loading ? "Reading the course…" : "Live golf is temporarily unavailable."}</Text>
            </View>
          )}
        </View>

        <AcrossTours events={home?.acrossTours ?? []} />
        <PressureCard event={home?.featured ?? null} />
        <KnowTheGround event={home?.featured ?? null} imageUrl={venueImage} />
        <SeasonRace rankings={rankings} activeLeague={activeLeague} />
        <FacesOfGolf rankings={rankings} activeLeague={activeLeague} />
        <LearnGolf />
        <GolfSchedule schedule={schedule} />
        <GolfCulture />
        <GolfStories news={news} />

        <View style={styles.footerNote}>
          <Ionicons name="shield-checkmark-outline" size={19} color={P.green} />
          <Text style={styles.footerNoteText}>Live scores are provider-owned and timestamped. Unavailable details are omitted, never invented.</Text>
        </View>
      </ScrollView>
      <SportFloatingNav active="sports" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: P.paper },
  scrollContent: { paddingBottom: SPORT_NAV_CLEARANCE + 38 },
  scrollContentWide: { width: "100%", maxWidth: 1120, alignSelf: "center" },
  header: { height: 68, marginHorizontal: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between", position: "relative" },
  headerButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  headerIdentity: { position: "absolute", left: 54, right: 54, alignItems: "center", justifyContent: "center" },
  headerBrand: { fontFamily: FONTS.bodyBold, fontSize: 10, letterSpacing: 2.2, color: P.blueGray },
  headerSport: { fontFamily: FONTS.display, fontSize: 23, letterSpacing: 1.2, color: P.ink, marginTop: -1 },
  dayRow: { marginHorizontal: 20, marginTop: 6, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  dayText: { fontFamily: FONTS.bodyBold, fontSize: 15, color: P.ink },
  daySubtext: { fontFamily: FONTS.body, fontSize: 12, color: P.muted, marginTop: 3 },
  followButton: { minHeight: 44, paddingHorizontal: 15, borderRadius: 22, borderWidth: 1, borderColor: P.green, flexDirection: "row", gap: 6, alignItems: "center", justifyContent: "center" },
  followButtonActive: { backgroundColor: P.green },
  followText: { fontFamily: FONTS.bodyBold, fontSize: 12, color: P.green },
  followTextActive: { color: P.paper },
  tourFilters: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 4, gap: 8 },
  tourFilter: { minHeight: 40, paddingHorizontal: 16, borderRadius: 20, backgroundColor: P.white, borderWidth: 1, borderColor: P.line, alignItems: "center", justifyContent: "center" },
  tourFilterActive: { backgroundColor: P.ink, borderColor: P.ink },
  tourFilterText: { fontFamily: FONTS.bodySemiBold, fontSize: 12, color: P.ink },
  tourFilterTextActive: { color: P.paper },
  heartbeatHero: { height: 326, borderRadius: 28, overflow: "hidden", marginHorizontal: 20, marginTop: 18, padding: 22, justifyContent: "space-between", shadowColor: P.inkDeep, shadowOffset: { width: 0, height: 14 }, shadowOpacity: 0.18, shadowRadius: 22, elevation: 8 },
  heroTop: { flexDirection: "row", alignItems: "center", gap: 9 },
  heroFlag: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: P.egret },
  heroKicker: { fontFamily: FONTS.monoBold, fontSize: 10, letterSpacing: 1.5, color: P.paper },
  heroCopy: { maxWidth: 570 },
  heroTitle: { fontFamily: FONTS.display, fontSize: 34, lineHeight: 39, color: P.white, letterSpacing: -0.4 },
  heroDescription: { fontFamily: FONTS.bodyMedium, fontSize: 14, lineHeight: 20, color: "rgba(255,255,255,.78)", marginTop: 9, maxWidth: 470 },
  heroAction: { alignSelf: "flex-start", minHeight: 46, borderRadius: 23, paddingHorizontal: 17, backgroundColor: P.egret, flexDirection: "row", gap: 10, alignItems: "center", marginTop: 18 },
  heroActionText: { fontFamily: FONTS.bodyBold, fontSize: 12, color: P.ink },
  section: { marginTop: 34 },
  sectionHeading: { marginHorizontal: 20, marginBottom: 14, flexDirection: "row", alignItems: "flex-end", gap: 12 },
  eyebrow: { fontFamily: FONTS.monoBold, fontSize: 9, letterSpacing: 1.65, color: P.green, marginBottom: 4 },
  sectionTitle: { fontFamily: FONTS.display, fontSize: 27, lineHeight: 31, color: P.ink },
  headingAction: { minHeight: 44, flexDirection: "row", alignItems: "center", gap: 6, paddingLeft: 8 },
  headingActionText: { fontFamily: FONTS.bodyBold, fontSize: 11, color: P.green },
  headingHint: { fontFamily: FONTS.bodyBold, fontSize: 10, color: P.blueGray, paddingBottom: 3 },
  emptyCard: { marginHorizontal: 20, padding: 24, borderRadius: 24, backgroundColor: P.white, borderWidth: 1, borderColor: P.line },
  emptyTitle: { fontFamily: FONTS.display, fontSize: 22, color: P.ink, marginTop: 13 },
  emptyText: { fontFamily: FONTS.body, fontSize: 13, lineHeight: 19, color: P.muted, marginTop: 7 },
  liveWorld: { marginHorizontal: 20, borderRadius: 26, backgroundColor: P.white, borderWidth: 1, borderColor: P.line, padding: 15, shadowColor: P.ink, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.09, shadowRadius: 24, elevation: 5 },
  liveWorldTop: { flexDirection: "row", gap: 12, alignItems: "flex-start", padding: 5 },
  liveMetaRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 9 },
  tourMark: { fontFamily: FONTS.monoBold, fontSize: 10, letterSpacing: 1.4, color: P.green },
  eventStatus: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, backgroundColor: P.pearl, flexDirection: "row", alignItems: "center", gap: 5 },
  eventStatusLive: { backgroundColor: "rgba(163,66,79,.10)" },
  eventStatusText: { fontFamily: FONTS.monoBold, fontSize: 8, letterSpacing: 0.8, color: P.ink },
  eventStatusTextLive: { color: P.live },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: P.live },
  eventName: { fontFamily: FONTS.display, fontSize: 24, lineHeight: 29, color: P.ink },
  eventVenue: { fontFamily: FONTS.body, fontSize: 11, color: P.muted, marginTop: 5, lineHeight: 16 },
  roundBadge: { width: 57, height: 64, borderRadius: 18, backgroundColor: P.ink, alignItems: "center", justifyContent: "center" },
  roundBadgeSmall: { fontFamily: FONTS.monoBold, fontSize: 7, letterSpacing: 1, color: P.sage },
  roundBadgeNumber: { fontFamily: FONTS.display, fontSize: 26, color: P.paper, marginTop: -1 },
  leaderboardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 6, marginTop: 17, marginBottom: 7 },
  tableLabel: { fontFamily: FONTS.monoBold, fontSize: 8, letterSpacing: 1.15, color: P.blueGray },
  leaderboardRows: { borderRadius: 19, borderWidth: 1, borderColor: P.line, overflow: "hidden" },
  leaderRow: { minHeight: 66, paddingHorizontal: 10, flexDirection: "row", gap: 9, alignItems: "center", backgroundColor: P.paper, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: P.line },
  leaderRowFeatured: { minHeight: 76, backgroundColor: "#E5E8E2" },
  positionColumn: { width: 27, alignItems: "center" },
  positionText: { fontFamily: FONTS.monoBold, fontSize: 12, color: P.ink },
  positionTextFeatured: { fontFamily: FONTS.display, fontSize: 19, color: P.green },
  headshotFallback: { alignItems: "center", justifyContent: "center", backgroundColor: P.egret, borderWidth: 1, borderColor: P.line },
  headshotFallbackDark: { backgroundColor: P.greenSoft, borderColor: "rgba(255,255,255,.2)" },
  headshotInitials: { fontFamily: FONTS.monoBold, fontSize: 10, color: P.green },
  leaderIdentity: { flex: 1, minWidth: 0 },
  leaderName: { fontFamily: FONTS.bodyBold, fontSize: 13, color: P.ink },
  leaderMeta: { fontFamily: FONTS.body, fontSize: 9, color: P.muted, marginTop: 3 },
  roundColumn: { width: 55, alignItems: "flex-end" },
  todayScore: { fontFamily: FONTS.monoBold, fontSize: 11, color: P.green },
  thruText: { fontFamily: FONTS.mono, fontSize: 6.8, color: P.blueGray, marginTop: 3, letterSpacing: 0.25 },
  totalScore: { width: 40, textAlign: "right", fontFamily: FONTS.display, fontSize: 20, color: P.ink },
  fullBoardButton: { minHeight: 48, borderRadius: 16, marginTop: 10, paddingHorizontal: 16, backgroundColor: P.green, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  fullBoardButtonText: { fontFamily: FONTS.bodyBold, fontSize: 12, color: P.paper },
  coursePulse: { borderRadius: 20, backgroundColor: P.inkDeep, padding: 17, marginTop: 12, overflow: "hidden" },
  pulseHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 },
  pulseEyebrow: { fontFamily: FONTS.monoBold, fontSize: 8, letterSpacing: 1.4, color: P.sand },
  pulseTitle: { fontFamily: FONTS.display, fontSize: 21, lineHeight: 26, color: P.white, marginTop: 5, maxWidth: 260 },
  holeRail: { gap: 9, paddingTop: 18, paddingBottom: 5 },
  holeItem: { alignItems: "center", gap: 5 },
  holeNumber: { fontFamily: FONTS.mono, fontSize: 8, color: P.sage },
  holeResult: { width: 30, height: 30, borderRadius: 15, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  holeStrokes: { fontFamily: FONTS.monoBold, fontSize: 10, color: P.white },
  pulseUnavailable: { fontFamily: FONTS.body, fontSize: 12, color: P.sage, paddingVertical: 20 },
  pulseFooter: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "rgba(255,255,255,.16)", marginTop: 10, paddingTop: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  pulseDetail: { flex: 1, fontFamily: FONTS.bodySemiBold, fontSize: 10, color: P.paper },
  freshness: { fontFamily: FONTS.mono, fontSize: 7.5, color: P.sage },
  courseEntry: { minHeight: 104, borderRadius: 20, backgroundColor: P.pearl, padding: 13, marginTop: 12, flexDirection: "row", alignItems: "center", gap: 12 },
  courseContour: { width: 76, height: 76, borderRadius: 18, backgroundColor: P.greenSoft, overflow: "hidden", position: "relative" },
  greenShape: { position: "absolute", width: 44, height: 30, borderRadius: 20, backgroundColor: "#AFC5A7", right: -5, top: 3, transform: [{ rotate: "-15deg" }] },
  fairwayShape: { position: "absolute", width: 34, height: 76, borderRadius: 20, backgroundColor: "#8EAA86", left: 22, top: 17, transform: [{ rotate: "27deg" }] },
  teeShape: { position: "absolute", width: 12, height: 12, borderRadius: 6, backgroundColor: P.sand, left: 11, bottom: 8 },
  courseEntryEyebrow: { fontFamily: FONTS.monoBold, fontSize: 8, letterSpacing: 1.25, color: P.green },
  courseEntryTitle: { fontFamily: FONTS.bodyBold, fontSize: 14, color: P.ink, marginTop: 5 },
  courseEntryText: { fontFamily: FONTS.body, fontSize: 10, lineHeight: 14, color: P.muted, marginTop: 3 },
  horizontalRail: { paddingHorizontal: 20, gap: 12 },
  tourCard: { width: 282, minHeight: 244, borderRadius: 22, backgroundColor: P.white, borderWidth: 1, borderColor: P.line, overflow: "hidden" },
  tourArt: { height: 116, backgroundColor: P.greenSoft, position: "relative", justifyContent: "space-between", padding: 11 },
  tourArtBadge: { alignSelf: "flex-start", borderRadius: 14, paddingHorizontal: 9, paddingVertical: 6, backgroundColor: "rgba(255,255,255,.88)" },
  tourArtBadgeText: { fontFamily: FONTS.monoBold, fontSize: 7.5, letterSpacing: .8, color: P.ink },
  tourArtScore: { alignSelf: "flex-end", fontFamily: FONTS.display, fontSize: 27, color: P.white },
  tourCardBody: { padding: 13 },
  tourCardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  tourCardMark: { fontFamily: FONTS.monoBold, fontSize: 10, letterSpacing: 1.5, color: P.green },
  tourCardTitle: { fontFamily: FONTS.bodyHeavy, fontSize: 15, lineHeight: 19, color: P.ink },
  tourCardVenue: { fontFamily: FONTS.body, fontSize: 10, color: P.muted, marginTop: 5 },
  tourMetrics: { flexDirection: "row", borderTopWidth: 1, borderTopColor: P.line, marginTop: 12, paddingTop: 10 },
  tourMetric: { flex: 1, minWidth: 0 },
  tourMetricValue: { fontFamily: FONTS.bodyHeavy, fontSize: 11, color: P.ink },
  tourMetricLabel: { fontFamily: FONTS.mono, fontSize: 6.5, letterSpacing: .8, color: P.blueGray, marginTop: 2 },
  tourCardDivider: { height: 1, backgroundColor: P.line, marginVertical: 14 },
  tourLeader: { flexDirection: "row", alignItems: "center", gap: 9 },
  tourLeaderName: { fontFamily: FONTS.bodyBold, fontSize: 11, color: P.ink },
  tourLeaderMeta: { fontFamily: FONTS.mono, fontSize: 8, color: P.muted, marginTop: 2 },
  tourLeaderScore: { fontFamily: FONTS.display, fontSize: 19, color: P.green },
  nextTeeTime: { fontFamily: FONTS.bodySemiBold, fontSize: 11, color: P.green },
  pressureCard: { marginHorizontal: 20, borderRadius: 24, padding: 16, backgroundColor: P.pearl, borderWidth: 1, borderColor: P.line },
  pressureTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 15 },
  pressureNumberBlock: { alignItems: "flex-end" },
  pressureNumber: { fontFamily: FONTS.display, fontSize: 34, color: P.live },
  pressureNumberLabel: { fontFamily: FONTS.monoBold, fontSize: 6.5, letterSpacing: .9, color: P.blueGray },
  pressureCopy: { maxWidth: 620 },
  pressureTitle: { flex: 1, fontFamily: FONTS.bodyHeavy, fontSize: 20, lineHeight: 23, color: P.ink },
  pressureText: { fontFamily: FONTS.body, fontSize: 11, lineHeight: 17, color: P.muted, marginTop: 10 },
  pressureStats: { flexDirection: "row", gap: 5, marginTop: 14 },
  pressureStat: { flex: 1, minHeight: 57, borderRadius: 13, backgroundColor: "rgba(255,255,255,.72)", alignItems: "center", justifyContent: "center" },
  pressureStatGood: { backgroundColor: "#D8E3DC" },
  pressureStatBad: { backgroundColor: "#EAD7D4" },
  pressureStatValue: { fontFamily: FONTS.bodyHeavy, fontSize: 11, color: P.ink },
  pressureStatLabel: { fontFamily: FONTS.mono, fontSize: 6.2, color: P.blueGray, marginTop: 4 },
  pressureMeter: { marginTop: 22 },
  pressureTrack: { height: 9, borderRadius: 5, backgroundColor: "rgba(44,62,80,.12)", overflow: "hidden" },
  pressureFill: { height: "100%", borderRadius: 5, backgroundColor: P.live },
  pressureScale: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  pressureScaleText: { fontFamily: FONTS.monoBold, fontSize: 7, letterSpacing: 1, color: P.blueGray },
  groundCard: { height: 356, marginHorizontal: 20, borderRadius: 26, overflow: "hidden", padding: 20, justifyContent: "space-between", backgroundColor: P.green },
  groundTopLine: { flexDirection: "row", alignItems: "center", gap: 8 },
  groundPin: { width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(255,255,255,.16)", alignItems: "center", justifyContent: "center" },
  groundLocation: { fontFamily: FONTS.monoBold, fontSize: 9, letterSpacing: 1.1, color: P.paper },
  groundBottom: { maxWidth: 560 },
  groundName: { fontFamily: FONTS.bodyHeavy, fontSize: 25, lineHeight: 29, color: P.white },
  groundEvent: { fontFamily: FONTS.bodySemiBold, fontSize: 12, color: P.egret, marginTop: 6 },
  groundHonesty: { fontFamily: FONTS.body, fontSize: 11, lineHeight: 16, color: "rgba(255,255,255,.67)", marginTop: 10 },
  groundMetrics: { flexDirection: "row", borderRadius: 17, paddingVertical: 11, backgroundColor: "rgba(30,45,56,.78)" },
  groundMetric: { flex: 1, alignItems: "center", borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: "rgba(255,255,255,.18)" },
  groundMetricValue: { fontFamily: FONTS.display, fontSize: 16, color: P.white },
  groundMetricLabel: { fontFamily: FONTS.mono, fontSize: 6, letterSpacing: .7, color: P.sage, marginTop: 2 },
  raceCard: { marginHorizontal: 20, borderRadius: 24, padding: 15, overflow: "hidden", backgroundColor: P.white, borderWidth: 1, borderColor: P.line },
  raceIntro: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  raceIntroTitle: { fontFamily: FONTS.bodyHeavy, fontSize: 19, lineHeight: 22, color: P.ink },
  raceIntroMeta: { fontFamily: FONTS.monoBold, fontSize: 7, letterSpacing: 1, color: P.blueGray },
  raceExplanation: { minHeight: 62, marginTop: 12, padding: 10, borderRadius: 14, flexDirection: "row", alignItems: "center", gap: 9, backgroundColor: P.pearl },
  raceExplanationText: { flex: 1, fontFamily: FONTS.body, fontSize: 8.5, lineHeight: 13, color: P.muted },
  raceGates: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 4, marginVertical: 12 },
  raceGate: { flex: 1, minHeight: 78, borderRadius: 14, padding: 9, justifyContent: "center", backgroundColor: P.paper, borderWidth: 1, borderColor: P.line },
  raceGateActive: { backgroundColor: P.ink, borderColor: P.ink },
  raceGateNumber: { fontFamily: FONTS.display, fontSize: 20, color: P.ink },
  raceGateNumberActive: { color: P.white },
  raceGateName: { fontFamily: FONTS.monoBold, fontSize: 6.5, color: P.blueGray, marginTop: 3 },
  raceGateNameActive: { color: P.sage },
  raceGateNote: { fontFamily: FONTS.body, fontSize: 6.5, color: P.muted, marginTop: 5 },
  raceGateNoteActive: { color: P.sage },
  raceRow: { minHeight: 48, paddingHorizontal: 4, flexDirection: "row", alignItems: "center", gap: 9, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: P.line },
  raceRank: { width: 24, fontFamily: FONTS.display, fontSize: 19, color: P.sand },
  raceName: { fontFamily: FONTS.bodyBold, fontSize: 11, color: P.ink },
  raceCountry: { fontFamily: FONTS.body, fontSize: 8, color: P.muted, marginTop: 2 },
  racePointsBlock: { alignItems: "flex-end" },
  racePoints: { fontFamily: FONTS.monoBold, fontSize: 11, color: P.ink },
  racePointsLabel: { fontFamily: FONTS.mono, fontSize: 6.5, letterSpacing: 0.8, color: P.blueGray, marginTop: 2 },
  raceBubble: { marginTop: 8, borderRadius: 14, backgroundColor: "#F2E3DF", padding: 11, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  raceBubbleTitle: { fontFamily: FONTS.bodyBold, fontSize: 10, color: "#69343A" },
  raceBubbleText: { fontFamily: FONTS.body, fontSize: 8, color: "#69343A" },
  filterRail: { paddingHorizontal: 20, gap: 8, paddingBottom: 13 },
  performanceFilter: { minHeight: 38, paddingHorizontal: 14, borderRadius: 19, borderWidth: 1, borderColor: P.line, backgroundColor: P.white, alignItems: "center", justifyContent: "center" },
  performanceFilterActive: { backgroundColor: P.green, borderColor: P.green },
  performanceFilterText: { fontFamily: FONTS.bodySemiBold, fontSize: 10, color: P.ink },
  performanceFilterTextActive: { color: P.paper },
  playerRail: { paddingHorizontal: 20, gap: 12 },
  playerCard: { width: 190, height: 282, borderRadius: 23, backgroundColor: P.white, borderWidth: 1, borderColor: P.line, overflow: "hidden" },
  playerPortrait: { flex: 1, position: "relative", overflow: "hidden" },
  playerRankBadge: { position: "absolute", zIndex: 3, top: 10, right: 10, minHeight: 26, borderRadius: 13, paddingHorizontal: 9, backgroundColor: "rgba(255,255,255,.86)", alignItems: "center", justifyContent: "center" },
  playerRankText: { fontFamily: FONTS.monoBold, fontSize: 7, letterSpacing: .6, color: P.ink },
  faceFollow: { position: "absolute", zIndex: 3, top: 10, left: 10, width: 28, height: 28, borderRadius: 14, backgroundColor: "rgba(30,45,56,.48)", borderWidth: 1, borderColor: "rgba(255,255,255,.25)", alignItems: "center", justifyContent: "center" },
  faceImage: { position: "absolute", left: 15, right: 15, bottom: 29, width: 160, height: 235 },
  faceImageFallback: { position: "absolute", left: 35, right: 35, top: 55, height: 120, borderRadius: 60, backgroundColor: P.sage, alignItems: "center", justifyContent: "center" },
  faceImageFallbackText: { fontFamily: FONTS.display, fontSize: 28, color: P.ink },
  faceGradient: { ...StyleSheet.absoluteFillObject },
  faceIdentity: { position: "absolute", zIndex: 3, left: 12, right: 12, bottom: 43 },
  faceAccolades: { position: "absolute", zIndex: 3, left: 10, right: 10, bottom: 10, flexDirection: "row", gap: 4 },
  faceAccolade: { borderRadius: 10, paddingHorizontal: 7, paddingVertical: 5, backgroundColor: "rgba(255,255,255,.15)", borderWidth: 1, borderColor: "rgba(255,255,255,.18)" },
  faceAccoladeText: { fontFamily: FONTS.monoBold, fontSize: 5.7, color: P.white },
  playerInfo: { padding: 14, minHeight: 112 },
  playerName: { fontFamily: FONTS.bodyHeavy, fontSize: 16, color: P.white },
  playerCountry: { fontFamily: FONTS.mono, fontSize: 7.5, letterSpacing: 0.5, color: P.sage, marginTop: 3 },
  playerSignal: { fontFamily: FONTS.body, fontSize: 10.5, lineHeight: 15, color: P.muted, marginTop: 9 },
  lessonGrid: { marginHorizontal: 20, flexDirection: "row", flexWrap: "wrap", gap: 9 },
  lessonCard: { width: "48.6%", minHeight: 150, borderRadius: 21, backgroundColor: P.white, borderWidth: 1, borderColor: P.line, padding: 14 },
  lessonCardDark: { backgroundColor: P.ink },
  lessonCardWarm: { backgroundColor: P.sand },
  lessonIcon: { width: 38, height: 38, borderRadius: 14, backgroundColor: "rgba(49,88,71,.72)", alignItems: "center", justifyContent: "center" },
  lessonEyebrow: { fontFamily: FONTS.monoBold, fontSize: 8, letterSpacing: 1.2, color: P.sand, marginTop: 18 },
  lessonTitle: { fontFamily: FONTS.bodyHeavy, fontSize: 15, color: P.ink, marginTop: 17 },
  lessonText: { fontFamily: FONTS.body, fontSize: 9, lineHeight: 13, color: P.muted, marginTop: 6 },
  timelineRail: { paddingHorizontal: 20 },
  timelineDay: { width: 124, minHeight: 150, padding: 12, borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: P.line },
  timelineDate: { fontFamily: FONTS.monoBold, fontSize: 8, color: P.blueGray },
  timelineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: P.blueGray, marginVertical: 11 },
  timelineDotLive: { backgroundColor: P.live, shadowColor: P.live, shadowOpacity: .4, shadowRadius: 5 },
  timelineTitle: { fontFamily: FONTS.bodyHeavy, fontSize: 11, lineHeight: 14, color: P.ink },
  timelineCopy: { fontFamily: FONTS.body, fontSize: 8, lineHeight: 12, color: P.muted, marginTop: 5 },
  timelineTag: { fontFamily: FONTS.monoBold, fontSize: 6.5, color: P.green, marginTop: "auto" },
  cultureGrid: { marginHorizontal: 20, flexDirection: "row", gap: 9 },
  cultureCard: { flex: 1.08, minHeight: 210, borderRadius: 22, padding: 14, backgroundColor: P.ink, justifyContent: "space-between", overflow: "hidden" },
  cultureCardLight: { flex: .92, backgroundColor: P.sage },
  cultureTop: { gap: 5 },
  cultureEyebrow: { fontFamily: FONTS.monoBold, fontSize: 7, letterSpacing: .8, color: P.sage },
  cultureFormat: { alignSelf: "flex-start", borderRadius: 9, paddingHorizontal: 6, paddingVertical: 4, backgroundColor: "rgba(255,255,255,.12)", fontFamily: FONTS.mono, fontSize: 5.5, color: P.white },
  cultureTitle: { fontFamily: FONTS.bodyHeavy, fontSize: 17, lineHeight: 20, color: P.white },
  cultureDescription: { fontFamily: FONTS.body, fontSize: 8.5, lineHeight: 13, color: P.sage },
  cultureTextDark: { color: P.ink },
  cultureDescriptionDark: { color: P.muted },
  lessonAction: { marginTop: "auto", paddingTop: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  lessonActionText: { fontFamily: FONTS.bodyBold, fontSize: 10, color: P.paper },
  scheduleCard: { width: 278, minHeight: 170, borderRadius: 23, backgroundColor: P.white, borderWidth: 1, borderColor: P.line, padding: 15, flexDirection: "row", gap: 13 },
  scheduleDateBlock: { width: 54, height: 70, borderRadius: 17, backgroundColor: P.pearl, alignItems: "center", justifyContent: "center" },
  scheduleMonth: { fontFamily: FONTS.monoBold, fontSize: 8, letterSpacing: 1, color: P.green, textTransform: "uppercase" },
  scheduleDay: { fontFamily: FONTS.display, fontSize: 24, color: P.ink },
  scheduleTagRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  scheduleTour: { fontFamily: FONTS.monoBold, fontSize: 7.5, letterSpacing: 1, color: P.live },
  scheduleOrder: { fontFamily: FONTS.mono, fontSize: 8, color: P.blueGray },
  scheduleTitle: { fontFamily: FONTS.display, fontSize: 20, lineHeight: 24, color: P.ink, marginTop: 11 },
  scheduleVenue: { fontFamily: FONTS.body, fontSize: 10, lineHeight: 15, color: P.muted, marginTop: 6 },
  storyStack: { marginHorizontal: 20, gap: 10 },
  storyCard: { minHeight: 104, borderRadius: 20, backgroundColor: P.white, borderWidth: 1, borderColor: P.line, padding: 11, flexDirection: "row", alignItems: "center", gap: 11 },
  storyCardLead: { minHeight: 288, padding: 0, overflow: "hidden", alignItems: "flex-end", backgroundColor: P.ink },
  storyImage: { width: 88, height: 80, borderRadius: 14, backgroundColor: P.sage },
  storyImageLead: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, opacity: 0.72 },
  storyCopy: { flex: 1, padding: 2 },
  storyLabel: { fontFamily: FONTS.monoBold, fontSize: 7.5, letterSpacing: 1, color: P.green, textTransform: "uppercase" },
  storyTitle: { fontFamily: FONTS.bodyBold, fontSize: 13, lineHeight: 18, color: P.ink, marginTop: 5 },
  storyTitleLead: { fontFamily: FONTS.display, fontSize: 27, lineHeight: 32, color: P.white, maxWidth: 520 },
  storySummary: { fontFamily: FONTS.body, fontSize: 11, lineHeight: 16, color: P.egret, marginTop: 8, maxWidth: 520 },
  loadingCard: { marginHorizontal: 20, borderRadius: 24, backgroundColor: P.white, padding: 20, borderWidth: 1, borderColor: P.line },
  loadingLineWide: { width: "68%", height: 18, borderRadius: 9, backgroundColor: P.egret },
  loadingLine: { width: "45%", height: 10, borderRadius: 5, backgroundColor: P.pearl, marginTop: 10 },
  loadingRows: { height: 180, borderRadius: 18, backgroundColor: P.paper, marginTop: 18 },
  loadingText: { fontFamily: FONTS.bodyMedium, fontSize: 11, color: P.muted, marginTop: 12 },
  footerNote: { marginHorizontal: 20, marginTop: 34, padding: 16, borderRadius: 19, backgroundColor: P.pearl, flexDirection: "row", alignItems: "center", gap: 11 },
  footerNoteText: { flex: 1, fontFamily: FONTS.body, fontSize: 10, lineHeight: 15, color: P.muted },
});
