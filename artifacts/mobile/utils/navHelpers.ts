import { router, type Href } from "expo-router";
import * as Haptics from "expo-haptics";

export type GameDetailTab = "gamecast" | "boxscore" | "playbyplay" | "stats" | "lineups";

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

export function gameDetailId(gameId: string, league?: string): string {
  const trimmed = gameId.trim();
  if (!trimmed) return trimmed;
  if (/^[a-z0-9]+-/i.test(trimmed)) return trimmed;
  return league ? `${league.toLowerCase()}-${trimmed}` : trimmed;
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

export function goToGame(gameId: string, league?: string, tab: GameDetailTab = "gamecast"): void {
  const id = gameDetailId(gameId, league);
  if (!id) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  router.push({ pathname: "/game/[id]", params: { id, tab } } as Href);
}
