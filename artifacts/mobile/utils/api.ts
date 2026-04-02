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
  getGames: (league?: string, date?: string) => {
    const params = new URLSearchParams();
    if (league) params.set("league", league);
    if (date)   params.set("date", date);
    const q = params.toString();
    return apiFetch<{ games: Game[] }>(`/sports/games${q ? `?${q}` : ""}`);
  },

  getGameDetail: (gameId: string) =>
    apiFetch<GameDetail>(`/sports/game/${gameId}`),

  getStandings: (league: string) =>
    apiFetch<{ standings: StandingEntry[]; tournament: TournamentRound[] }>(`/sports/standings?league=${league}`),

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

  rewriteArticle: (content: string, title: string, mode: "easy" | "quick" | "cross-sport", targetSport?: string) =>
    apiFetch<{ rewritten: string }>("/ai/rewrite", {
      method: "POST",
      body: JSON.stringify({ content, title, mode, targetSport }),
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

  getAthleteProfile: (league: string, athleteId: string) =>
    apiFetch<AthleteProfile>(`/sports/athlete/${encodeURIComponent(league)}/${encodeURIComponent(athleteId)}`),

  getAthleteGameLog: (league: string, athleteId: string) =>
    apiFetch<AthleteGameLog>(`/sports/athlete/${encodeURIComponent(league)}/${encodeURIComponent(athleteId)}/gamelog`),

  searchAthletes: (q: string, league?: string, limit = 15) => {
    const params = new URLSearchParams({ q, limit: String(limit) });
    if (league) params.set("league", league);
    return apiFetch<{ athletes: AthleteSearchResult[] }>(`/sports/athlete/search?${params}`);
  },

  getSportNews: (sport: string, limit = 10) =>
    apiFetch<{ articles: SportNewsArticle[] }>(`/sports/news/${encodeURIComponent(sport)}?limit=${limit}`),

  getUpcomingEvents: (sport: string) =>
    apiFetch<{ events: UpcomingEvent[] }>(`/sports/upcoming/${encodeURIComponent(sport)}`),

  getInOneBreath: () =>
    apiFetch<{ summary: string; generated: string }>("/sports/in-one-breath"),
};

export type SportArchetype = "team" | "tennis" | "combat" | "multi_event";

export interface Game {
  id: string;
  sport: string;
  league: string;
  sportArchetype?: SportArchetype;
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
  eventTitle?: string | null;
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
  logoUrl: string | null;
  wins: number;
  losses: number;
  winPct: number;
  gamesBack: number | null;
  streak: string | null;
  conference: string | null;
  division: string | null;
  rankChange: number | null;
  homeRecord: string | null;
  awayRecord: string | null;
  last10: string | null;
  pointsFor: number | null;
  pointsAgainst: number | null;
  differential: number | null;
  draws: number | null;
  points: number | null;
  playoffSeed: number | null;
  clinched: string | null;
}

export interface TournamentMatchup {
  seed1: number | null;
  team1: string;
  logo1: string | null;
  score1: number | null;
  seed2: number | null;
  team2: string;
  logo2: string | null;
  score2: number | null;
  status: "upcoming" | "live" | "finished";
  winner: string | null;
}

export interface TournamentRound {
  name: string;
  matchups: TournamentMatchup[];
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

export interface SportNewsArticle {
  id: string;
  title: string;
  summary: string;
  source: string;
  imageUrl: string | null;
  publishedAt: string;
  leagues: string[];
}

export interface UpcomingEvent {
  id: string;
  type: "live" | "upcoming" | "result";
  name: string;
  league: string;
  date: string;
  time: string | null;
  venue: string | null;
  source: string;
  status?: string | null;
  homeTeam?: string | null;
  awayTeam?: string | null;
  homeScore?: string | null;
  awayScore?: string | null;
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
  roster: { name: string; jersey: string; position: string; athleteId: string }[];
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

export interface AthleteProfile {
  id: string;
  espnId: string;
  league: string;
  name: string;
  fullName: string;
  firstName: string;
  lastName: string;
  headshot: string | null;
  jersey: string | null;
  position: string | null;
  positionAbbr: string | null;
  team: string | null;
  teamAbbr: string | null;
  teamLogo: string | null;
  active: boolean;
  status: string;
  height: string | null;
  heightRaw: number | null;
  weight: string | null;
  weightRaw: number | null;
  age: number | null;
  birthDate: string | null;
  birthCity: string | null;
  birthState: string | null;
  birthCountry: string | null;
  yearsExperience: number | null;
  college: string | null;
  nationality: string | null;
  hand: string | null;
  draft: {
    year: number | null;
    round: number | null;
    pick: number | null;
    team: string | null;
  } | null;
  currentStats: Record<string, string>;
  seasons: { year: string; stats: Record<string, string> }[];
  careerStats: Record<string, string>;
}

export interface AthleteGameLog {
  leagueKey: string;
  athleteId: string;
  statLabels: string[];
  gameLogs: {
    date: string;
    opponent: string;
    homeAway: "home" | "away";
    result: string;
    score: string;
    stats: Record<string, string>;
  }[];
}

export interface AthleteSearchResult {
  id: string;
  espnId: string;
  league: string;
  name: string;
  headshot: string | null;
  jersey: string | null;
  position: string | null;
  positionFull: string | null;
  team: string | null;
  teamAbbr: string | null;
  teamLogo: string | null;
}
