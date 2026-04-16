const BASE = process.env.EXPO_PUBLIC_DOMAIN
  ? (process.env.EXPO_PUBLIC_DOMAIN.includes("localhost") || process.env.EXPO_PUBLIC_DOMAIN.includes("127.0.0.1")
      ? `http://${process.env.EXPO_PUBLIC_DOMAIN}/api`
      : `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`)
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

  whyWatch: (sport: string, games?: { homeTeam: string; awayTeam: string; status: string; league: string }[], standings?: { teamName: string; rank: number }[]) =>
    apiFetch<{ context: string }>("/ai/why-watch", {
      method: "POST",
      body: JSON.stringify({ sport, games, standings }),
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

  getAthleteGameLog: (league: string, athleteId: string, season?: number) =>
    apiFetch<AthleteGameLog>(`/sports/athlete/${encodeURIComponent(league)}/${encodeURIComponent(athleteId)}/gamelog${season ? `?season=${season}` : ""}`),

  searchAthletes: (q: string, league?: string, limit = 15) => {
    const params = new URLSearchParams({ q, limit: String(limit) });
    if (league) params.set("league", league);
    return apiFetch<{ athletes: AthleteSearchResult[] }>(`/sports/athlete/search?${params}`);
  },

  getSportNews: (sport: string, limit = 10) =>
    apiFetch<{ articles: SportNewsArticle[] }>(`/sports/news/${encodeURIComponent(sport)}?limit=${limit}`),

  getUpcomingEvents: (sport: string) =>
    apiFetch<{ events: UpcomingEvent[] }>(`/sports/upcoming/${encodeURIComponent(sport)}`),

  getGolfLeaderboard: (league?: string) =>
    apiFetch<GolfLeaderboardResponse>(`/sports/golf/leaderboard${league ? `?league=${encodeURIComponent(league)}` : ""}`),

  getInOneBreath: () =>
    apiFetch<{ summary: string; generated: string }>("/sports/in-one-breath"),

  getDraft: (league: string, year?: number) => {
    const params = year ? `?year=${year}` : "";
    return apiFetch<DraftData>(`/sports/draft/${encodeURIComponent(league)}${params}`);
  },

  getRankings: (league: string) =>
    apiFetch<{ groups: RankingsGroup[] }>(`/sports/rankings/${encodeURIComponent(league)}`),

  getTennisDraw: (league: string) =>
    apiFetch<TennisDrawData>(`/sports/tennis/draw/${encodeURIComponent(league)}`),

  getRacingSchedule: (league: string) =>
    apiFetch<RacingScheduleResponse>(`/sports/racing/schedule/${encodeURIComponent(league)}`),

  getSeasonalData: (sport: string) =>
    apiFetch<SeasonalSportData>(`/sports/seasonal/${encodeURIComponent(sport)}`),

  getGamePreview: (gameId: string) =>
    apiFetch<{ preview: string | null; homeTeam: string; awayTeam: string; league: string }>(`/sports/game-preview/${encodeURIComponent(gameId)}`),

  getTopAthletes: (league: string, limit = 10) =>
    apiFetch<{ athletes: TopAthlete[] }>(`/sports/top-athletes/${encodeURIComponent(league)}?limit=${limit}`),
};

export interface SeasonalEvent {
  id: string;
  name: string;
  date: string;
  endDate?: string;
  location: string;
  venue?: string;
  status: "upcoming" | "live" | "completed";
  league: string;
  description?: string;
  disciplines?: string[];
}

export interface SeasonalAthlete {
  name: string;
  country: string;
  event: string;
  achievement?: string;
}

export interface SeasonalSportData {
  sport: string;
  title: string;
  subtitle: string;
  season: string;
  events: SeasonalEvent[];
  athletes: SeasonalAthlete[];
  nextEvent: SeasonalEvent | null;
}

export type SportArchetype = "team" | "tennis" | "combat" | "multi_event" | "golf" | "racing" | "seasonal";

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
  leaderboard?: Array<{ position: number; name: string; score: string; headshot?: string | null }>;
  circuitName?: string | null;
  round?: string | null;
  seed1?: number | null;
  seed2?: number | null;
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

export interface GolfLeaderboardEntry {
  position: number | null;
  name: string;
  score: string;
  thru: string;
  today: string;
  country: string;
  headshotUrl: string | null;
}

export interface GolfLeaderboardResponse {
  tournament: string;
  venue: string;
  status: string;
  round: string;
  leaderboard: GolfLeaderboardEntry[];
}

export interface RaceResult {
  position: number;
  driver: string;
  team: string | null;
  time: string | null;
  headshot: string | null;
}

export interface RaceEvent {
  id: string;
  name: string;
  date: string;
  circuit: string | null;
  location: string | null;
  status: "upcoming" | "live" | "finished";
  results: RaceResult[];
  qualifying: RaceResult[];
}

export interface NextRace {
  name: string;
  date: string;
  circuit: string | null;
  location: string | null;
  countdownMs: number;
}

export interface RacingScheduleResponse {
  league: string;
  nextRace: NextRace | null;
  races: RaceEvent[];
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

export interface GameLogEntry {
  date: string;
  opponent: string;
  opponentId: string;
  homeAway: "home" | "away";
  result: string;
  score: string;
  stats: Record<string, string>;
}

export interface GameLogCategory {
  displayName: string;
  games: GameLogEntry[];
}

export type GameLogSectionType = "regular" | "postseason" | "playin" | "preseason" | "allstar" | "other";

export interface GameLogSection {
  type: GameLogSectionType;
  displayName: string;
  categories: GameLogCategory[];
}

export interface AthleteGameLog {
  leagueKey: string;
  athleteId: string;
  season?: number;
  statLabels: string[];
  sections?: GameLogSection[];
  gameLogs: GameLogEntry[];
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

export interface DraftPick {
  pick: number;
  overall: number;
  round: number;
  traded: boolean;
  tradeNote: string;
  status: string;
  team: { id: string; name: string; abbreviation: string; logo: string } | null;
  athlete: {
    id: string;
    name: string;
    position: string;
    school: string;
    headshot: string;
    height: string;
    weight: string;
    grade: string | null;
    rank: string | null;
  } | null;
}

export interface DraftTeam {
  id: string;
  name: string;
  abbreviation: string;
  location: string;
  logo: string;
  needs: { position: string; met: boolean }[];
  nextPick: number | null;
  record: string | null;
}

export interface DraftProspect {
  id: string;
  name: string;
  position: string;
  school: string;
  headshot: string;
  height: string;
  weight: string;
  grade: string | null;
  rank: string | null;
}

export interface DraftData {
  league: string;
  year: number;
  displayName: string;
  status: string;
  statusName: string;
  currentPick: number | null;
  totalRounds: number;
  picks: DraftPick[];
  teams: DraftTeam[];
  prospects: DraftProspect[];
  positions: { id: string; abbreviation: string }[];
}

export interface RankingEntry {
  rank: number;
  name: string;
  points: string | null;
  record: string | null;
  trend: string | null;
  headshot: string | null;
  country: string | null;
  division?: string;
}

export interface RankingsGroup {
  title: string;
  entries: RankingEntry[];
}

export interface TennisDrawMatch {
  id: string;
  player1: string;
  player2: string;
  seed1: number | null;
  seed2: number | null;
  score1: number | null;
  score2: number | null;
  winner: number | null;
  status: string;
  round: string;
  headshot1: string | null;
  headshot2: string | null;
  setScores: string | null;
}

export interface TennisDrawRound {
  name: string;
  order: number;
  matches: TennisDrawMatch[];
}

export interface TennisTournament {
  id: string;
  name: string;
  status: string;
  date: string;
  venue: string | null;
  rounds: TennisDrawRound[];
}

export interface TennisDrawData {
  league: string;
  tournaments: TennisTournament[];
}

export interface TopAthlete {
  name: string;
  rank: number;
  stat: string | null;
  headshot: string | null;
  country: string | null;
  team: string | null;
  league: string;
}
