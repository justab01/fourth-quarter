import { router, type Href } from "expo-router";
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
  const id = teamPageId(teamName, league);
  router.push(`/team/${id}` as Href);
}

export function goToPlayer(playerName: string): void {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  const id = playerPageId(playerName);
  router.push(`/player/${id}` as Href);
}
