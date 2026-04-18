// mobile/components/team/RosterTab.tsx

import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Image } from "react-native";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { FONTS, FONT_SIZES } from "@/constants/typography";
import { getSportStatsConfig } from "@/constants/teamStatsConfig";
import type { TeamData, Player } from "@/constants/teamData";

const C = Colors.dark;

const GROUP_ORDER: string[] = [
  "Guards", "Forwards/Centers", "Bigs",
  "Offense", "Defense", "Special Teams",
  "Pitching", "Hitting", "Bullpen",
  "Goalkeepers", "Defenders", "Midfielders", "Forwards",
  "Defensemen", "Goalies",
];

function groupRoster(roster: Player[]): Record<string, Player[]> {
  const groups: Record<string, Player[]> = {};
  for (const p of roster) {
    if (!groups[p.group]) groups[p.group] = [];
    groups[p.group].push(p);
  }
  const sorted: Record<string, Player[]> = {};
  const keys = Object.keys(groups);
  keys.sort((a, b) => {
    const ai = GROUP_ORDER.indexOf(a);
    const bi = GROUP_ORDER.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
  for (const k of keys) sorted[k] = groups[k];
  return sorted;
}

function PlayerCard({ player, teamColor, isStarter, league }: { player: Player; teamColor: string; isStarter: boolean; league: string }) {
  const headshotUrl = player.athleteId
    ? `https://a.espncdn.com/combiner/i?img=/i/headshots/${league.toLowerCase()}/players/full/${player.athleteId}.png&w=80&h=80&cb=1`
    : null;

  const [imgError, setImgError] = React.useState(false);

  return (
    <Pressable
      style={[playerCard.container, isStarter && { borderColor: `${teamColor}40`, backgroundColor: `${teamColor}10` }]}
      onPress={() => {
        Haptics.selectionAsync();
        router.push({
          pathname: "/player/[id]",
          params: { id: player.id, athleteId: player.athleteId ?? "", league },
        } as any);
      }}
    >
      <View style={[playerCard.avatar, { backgroundColor: `${teamColor}20`, borderColor: `${teamColor}40` }]}>
        {headshotUrl && !imgError ? (
          <Image
            source={{ uri: headshotUrl }}
            style={playerCard.headshot}
            resizeMode="cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <Text style={[playerCard.avatarNum, { color: teamColor }]}>{player.number}</Text>
        )}
        {isStarter && <View style={[playerCard.star, { backgroundColor: teamColor }]}><Text style={playerCard.starText}>⭐</Text></View>}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={playerCard.name}>{player.name}</Text>
        <Text style={playerCard.meta}>#{player.number} • {player.position}</Text>
      </View>
      {player.stats && Object.keys(player.stats).length > 0 && (
        <View style={playerCard.statsWrap}>
          <Text style={[playerCard.statValue, { color: teamColor }]}>{Object.values(player.stats)[0] as string}</Text>
          <Text style={playerCard.statLabel}>{Object.keys(player.stats)[0]}</Text>
        </View>
      )}
    </Pressable>
  );
}

interface RosterTabProps {
  team: TeamData;
}

export function RosterTab({ team }: RosterTabProps) {
  const groups = groupRoster(team.roster);
  const config = getSportStatsConfig(team.league);
  const startersPerGroup = Math.ceil(config.rosterStarters / Math.max(Object.keys(groups).length, 1));

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container}>
      {Object.entries(groups).map(([group, players]) => (
        <View key={group} style={styles.groupSection}>
          <View style={styles.groupHeader}>
            <Text style={styles.groupTitle}>{group.toUpperCase()}</Text>
            <Text style={styles.groupCount}>{players.length} players</Text>
          </View>

          {players.map((player, idx) => (
            <PlayerCard
              key={player.id}
              player={player}
              teamColor={team.color}
              isStarter={idx < startersPerGroup}
              league={team.league}
            />
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16, paddingBottom: 40 },
  groupSection: { gap: 8 },
  groupHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  groupTitle: { color: C.textTertiary, fontSize: 11, fontWeight: "900", letterSpacing: 1.2 },
  groupCount: { color: C.textSecondary, fontSize: 11 },
});

const playerCard = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.cardBorder,
    gap: 12,
  },
  avatar: {
    width: 48, height: 48, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1.5,
    overflow: "hidden",
  },
  headshot: { width: 48, height: 48 },
  avatarNum: { fontSize: 16, fontWeight: "900" },
  star: { position: "absolute", top: -4, right: -4, width: 16, height: 16, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  starText: { fontSize: 8 },
  name: { color: C.text, fontSize: 14, fontWeight: "600", fontFamily: FONTS.bodySemiBold },
  meta: { color: C.textSecondary, fontSize: 12, marginTop: 2 },
  statsWrap: { alignItems: "flex-end" },
  statValue: { fontSize: 14, fontWeight: "800", fontFamily: FONTS.bodyBold },
  statLabel: { fontSize: 10, color: C.textTertiary, marginTop: 2 },
});