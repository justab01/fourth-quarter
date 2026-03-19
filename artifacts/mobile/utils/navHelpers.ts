import { router } from "expo-router";
import * as Haptics from "expo-haptics";

function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export function teamPageId(teamName: string, league: string): string {
  return `${league.toLowerCase()}-${slugify(teamName)}`;
}

export function playerPageId(playerName: string): string {
  return slugify(playerName);
}

export function goToTeam(teamName: string, league: string): void {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  router.push({ pathname: "/team/[id]", params: { id: teamPageId(teamName, league) } } as any);
}

export function goToPlayer(playerName: string): void {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  router.push({ pathname: "/player/[id]", params: { id: playerPageId(playerName) } } as any);
}
