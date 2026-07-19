import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "@/constants/colors";
import { FONTS } from "@/constants/typography";
import { ALL_TEAMS } from "@/constants/allPlayers";
import { TeamLogo } from "@/components/GameCard";
import type { Game, NewsArticle } from "@/utils/api";

const C = Colors.dark;

export type MomentGraphicData = {
  statusLabel: string;
  leagueLabel?: string;
  accentColor: string;
  game?: Game;
  article?: NewsArticle;
};

function getTeamEspnLogoUrl(teamName: string, league: string): string | null {
  const team = ALL_TEAMS.find((item) => item.name === teamName);
  if (!team?.abbr) return null;
  const abbr = team.abbr.toLowerCase();
  const sportMap: Record<string, string> = {
    NBA: "nba", WNBA: "wnba",
    NFL: "nfl", NCAAF: "college-football",
    MLB: "mlb", NCAABB: "college-baseball",
    NHL: "nhl", NCAAHM: "mens-college-hockey", NCAAHW: "womens-college-hockey",
    MLS: "soccer", NWSL: "soccer",
    EPL: "soccer", LIGA: "soccer", BUN: "soccer", SERA: "soccer", LIG1: "soccer",
    UCL: "soccer", UEL: "soccer", UECL: "soccer",
    NCAAB: "mens-college-basketball", NCAAW: "womens-college-basketball",
    ATP: "tennis", WTA: "tennis",
    UFC: "mma", BELLATOR: "mma", PFL: "mma",
    F1: "racing", NASCAR: "racing",
  };
  const sport = sportMap[league];
  if (!sport) return null;
  return `https://a.espncdn.com/i/teamlogos/${sport}/500/${abbr}.png`;
}

function formatGamePlate(game: Game) {
  if (game.homeScore != null && game.awayScore != null) return `${game.awayScore}-${game.homeScore}`;
  if (game.status === "live") return [game.quarter, game.timeRemaining].filter(Boolean).join(" ") || "LIVE";
  if (game.status === "finished") return "FINAL";
  return new Date(game.startTime).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function getFallbackLabel(moment: MomentGraphicData) {
  if (moment.leagueLabel) return moment.leagueLabel;
  if (moment.article?.leagues?.[0]) return moment.article.leagues[0];
  if (moment.article?.tags?.[0]) return moment.article.tags[0].toUpperCase();
  return moment.article ? "STORY" : "PULSE";
}

function getFallbackSignal(moment: MomentGraphicData) {
  if (moment.article) return "Story card";
  if (moment.game?.status === "live") return "Live board";
  if (moment.game?.status === "upcoming") return "Next up";
  return "Sports pulse";
}

export function MomentGraphic({
  moment,
  variant = "rail",
}: {
  moment: MomentGraphicData;
  variant?: "rail" | "thumbnail";
}) {
  const accent = moment.accentColor;
  const isThumbnail = variant === "thumbnail";
  const frameStyle = [styles.graphicFrame, isThumbnail && styles.thumbnailFrame, { borderColor: `${accent}55` }];
  const logoSize = isThumbnail ? 28 : 54;

  if (moment.game) {
    const game = moment.game;
    const awayLogo = game.awayTeamLogo ?? getTeamEspnLogoUrl(game.awayTeam, game.league);
    const homeLogo = game.homeTeamLogo ?? getTeamEspnLogoUrl(game.homeTeam, game.league);

    return (
      <View style={frameStyle}>
        <LinearGradient
          colors={[`${accent}34`, "rgba(255,248,232,0.04)", "rgba(23,32,42,0.18)"]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <View style={[styles.graphicOrb, styles.graphicOrbLeft, { backgroundColor: `${accent}18` }]} />
        <View style={[styles.graphicOrb, styles.graphicOrbRight, { backgroundColor: `${accent}22` }]} />
        <View style={[styles.versusLogos, isThumbnail && styles.thumbnailVersusLogos]}>
          <TeamLogo uri={awayLogo} name={game.awayTeam} size={logoSize} borderColor={`${accent}66`} />
          {!isThumbnail ? <View style={styles.vsBadge}>
            <Text style={styles.vsText}>VS</Text>
          </View> : null}
          <TeamLogo uri={homeLogo} name={game.homeTeam} size={logoSize} borderColor={`${accent}66`} />
        </View>
        {!isThumbnail ? <View style={styles.scorePlate}>
          <Text style={styles.scorePlateText} numberOfLines={1}>{formatGamePlate(game)}</Text>
        </View> : null}
      </View>
    );
  }

  if (moment.article?.imageUrl) {
    return (
      <View style={frameStyle}>
        <Image source={{ uri: moment.article.imageUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        <LinearGradient
          colors={isThumbnail ? ["rgba(23,32,42,0.0)", "rgba(23,32,42,0.38)"] : ["rgba(23,32,42,0.08)", "rgba(23,32,42,0.68)"]}
          style={StyleSheet.absoluteFill}
        />
        {!isThumbnail ? <View style={styles.articleImageBadge}>
          <Text style={styles.articleImageBadgeText}>{getFallbackLabel(moment)}</Text>
        </View> : null}
      </View>
    );
  }

  // No image → intentional league-tinted tile (not a broken-looking framed icon).
  return (
    <View style={[frameStyle, isThumbnail && { borderColor: `${accent}33` }]}>
      <LinearGradient
        colors={isThumbnail
          ? [`${accent}4D`, `${accent}1F`, "rgba(23,32,42,0.35)"]
          : [`${accent}28`, C.cardElevated, "rgba(255,255,255,0.02)"]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <View style={[
        styles.generatedRing,
        isThumbnail && styles.thumbnailGeneratedRing,
        isThumbnail
          ? { borderColor: "transparent", backgroundColor: `${accent}33` }
          : { borderColor: `${accent}66` },
      ]}>
        <Ionicons
          name={moment.article ? "newspaper" : "pulse"}
          size={isThumbnail ? 18 : 28}
          color={isThumbnail ? "#fff" : accent}
        />
      </View>
      {!isThumbnail ? (
        <>
          <Text style={styles.generatedLabel} numberOfLines={1}>{getFallbackLabel(moment)}</Text>
          <Text style={styles.generatedSubLabel}>{getFallbackSignal(moment)}</Text>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  graphicFrame: {
    width: 108,
    minHeight: 152,
    alignSelf: "stretch",
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    backgroundColor: C.cardElevated,
    justifyContent: "center",
    alignItems: "center",
  },
  thumbnailFrame: {
    width: 58,
    minHeight: 58,
    height: 58,
    borderRadius: 10,
  },
  graphicOrb: {
    position: "absolute",
    width: 86,
    height: 86,
    borderRadius: 43,
  },
  graphicOrbLeft: { left: -36, top: 12 },
  graphicOrbRight: { right: -34, bottom: 10 },
  versusLogos: { alignItems: "center", justifyContent: "center", gap: 3 },
  thumbnailVersusLogos: { flexDirection: "row", gap: 0 },
  vsBadge: {
    minWidth: 30,
    minHeight: 22,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    backgroundColor: "rgba(23,32,42,0.52)",
    borderWidth: 1,
    borderColor: C.glassBorder,
  },
  vsText: { color: C.text, fontSize: 10, fontWeight: "900", fontFamily: FONTS.bodyHeavy, letterSpacing: 0.8 },
  scorePlate: {
    position: "absolute",
    left: 10,
    right: 10,
    bottom: 10,
    minHeight: 26,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    backgroundColor: "rgba(23,32,42,0.58)",
    borderWidth: 1,
    borderColor: C.glassBorder,
  },
  scorePlateText: { color: C.text, fontSize: 12, fontWeight: "900", fontFamily: FONTS.bodyHeavy },
  articleImageBadge: {
    position: "absolute",
    left: 9,
    right: 9,
    bottom: 9,
    minHeight: 26,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    backgroundColor: "rgba(23,32,42,0.62)",
    borderWidth: 1,
    borderColor: C.glassBorder,
  },
  articleImageBadgeText: { color: C.text, fontSize: 10, fontWeight: "900", fontFamily: FONTS.bodyBold, letterSpacing: 0.7 },
  generatedRing: {
    width: 66,
    height: 66,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    backgroundColor: "rgba(23,32,42,0.38)",
  },
  thumbnailGeneratedRing: {
    width: 38,
    height: 38,
    borderRadius: 14,
  },
  generatedLabel: {
    maxWidth: 82,
    marginTop: 12,
    color: C.text,
    fontSize: 12,
    fontWeight: "900",
    fontFamily: FONTS.bodyHeavy,
    textAlign: "center",
  },
  generatedSubLabel: {
    marginTop: 3,
    color: C.textTertiary,
    fontSize: 8,
    fontWeight: "900",
    fontFamily: FONTS.bodyBold,
    letterSpacing: 0.8,
  },
});
