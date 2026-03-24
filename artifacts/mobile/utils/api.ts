const BASE = process.env.EXPO_PUBLIC_DOMAIN
  ? `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`
  : "/api";

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export const api = {
  getGames: (league?: string) =>
    apiFetch<{ games: Game[] }>(`/sports/games${league ? `?league=${league}` : ""}`),

  getGameDetail: (gameId: string) =>
    apiFetch<GameDetail>(`/sports/game/${gameId}`),

  getStandings: (league: string) =>
    apiFetch<{ standings: StandingEntry[] }>(`/sports/standings?league=${league}`),

  getNews: (teams?: string[], leagues?: string[]) => {
    const params = new URLSearchParams();
    if (teams?.length) params.set("teams", teams.join(","));
    if (leagues?.length) params.set("leagues", leagues.join(","));
    const q = params.toString();
    return apiFetch<{ articles: NewsArticle[] }>(`/news${q ? `?${q}` : ""}`);
  },

  summarize: (type: "article" | "game", content: string, title?: string) =>
    apiFetch<{ summary: string }>("/ai/summarize", {
      method: "POST",
      body: JSON.stringify({ type, content, title }),
    }),

  rewriteArticle: (content: string, title: string, mode: "simple" | "toddler") =>
    apiFetch<{ rewritten: string }>("/ai/rewrite", {
      method: "POST",
      body: JSON.stringify({ content, title, mode }),
    }),

  generateRecap: (data: RecapRequest) =>
    apiFetch<RecapResponse>("/ai/recap", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  savePreferences: (prefs: UserPreferencesPayload) =>
    apiFetch<{ success: boolean }>("/user/preferences", {
      method: "POST",
      body: JSON.stringify(prefs),
    }),

  getTeamInfo: (name: string, league: string) =>
    apiFetch<EspnTeamInfo>(`/sports/team?name=${encodeURIComponent(name)}&league=${encodeURIComponent(league)}`),
};

export interface Game {
  id: string;
  sport: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  status: "upcoming" | "live" | "finished";
  startTime: string;
  quarter: string | null;
  timeRemaining: string | null;
  venue: string | null;
  homeTeamLogo: string | null;
  awayTeamLogo: string | null;
}

export interface PlayerStatLine {
  name: string;
  starter: boolean;
  stats: Record<string, string>;
}

export interface GameDetail {
  game: Game;
  keyPlays: { time: string; description: string; team: string }[];
  homeStats: Record<string, string | number>;
  awayStats: Record<string, string | number>;
  homeLineup: string[];
  awayLineup: string[];
  homePlayerStats?: PlayerStatLine[];
  awayPlayerStats?: PlayerStatLine[];
  aiSummary: string | null;
}

export interface StandingEntry {
  rank: number;
  teamName: string;
  wins: number;
  losses: number;
  winPct: number;
  gamesBack: number | null;
  streak: string | null;
  conference: string | null;
  division: string | null;
  rankChange: number | null;
}

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  content: string | null;
  source: string;
  sourceUrl: string;
  imageUrl: string | null;
  publishedAt: string;
  tags: string[];
  teams: string[];
  leagues: string[];
}

export interface RecapRequest {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  keyPlays: string[];
  stats: Record<string, unknown>;
  league: string;
}

export interface RecapResponse {
  summary: string;
  keyPlayer: string;
  whatItMeans: string;
}

export interface EspnTeamInfo {
  espnTeamId: string;
  name: string;
  abbreviation: string;
  location: string;
  color: string;
  altColor: string;
  logo: string | null;
  venue: string | null;
  coach: string | null;
  league: string;
  roster: { name: string; jersey: string; position: string }[];
}

export interface UserPreferencesPayload {
  userId: string;
  name: string;
  favoriteTeams: string[];
  favoriteLeagues: string[];
  favoritePlayers: string[];
  rivals: string[];
  darkMode: boolean;
  notifications: boolean;
}
