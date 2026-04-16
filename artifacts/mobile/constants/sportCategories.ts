export type LeagueGroup = "domestic" | "cups" | "international" | "college";

export type SportLeague = {
  key: string;
  label: string;
  group?: LeagueGroup;
};

export type SportCategory = {
  id: string;
  name: string;
  emoji: string;
  icon: string;
  color: string;
  gradient: [string, string];
  leagues: SportLeague[];
  tagline: string;
};

export const SPORT_CATEGORIES: SportCategory[] = [
  {
    id: "basketball",
    name: "Basketball",
    emoji: "🏀",
    icon: "basketball-outline",
    color: "#E8503A",
    gradient: ["#E8503A", "#9B2617"],
    tagline: "NBA · WNBA · NCAA",
    leagues: [
      { key: "NBA", label: "NBA" },
      { key: "WNBA", label: "WNBA" },
      { key: "NCAAB", label: "NCAA Men's" },
      { key: "NCAAW", label: "NCAA Women's" },
    ],
  },
  {
    id: "football",
    name: "Football",
    emoji: "🏈",
    icon: "american-football-outline",
    color: "#8B7355",
    gradient: ["#8B7355", "#52432F"],
    tagline: "NFL · NCAA Football",
    leagues: [
      { key: "NFL", label: "NFL" },
      { key: "NCAAF", label: "NCAA Football" },
    ],
  },
  {
    id: "baseball",
    name: "Baseball",
    emoji: "⚾",
    icon: "baseball-outline",
    color: "#3B6DB8",
    gradient: ["#3B6DB8", "#1E3D6B"],
    tagline: "MLB · NCAA Baseball",
    leagues: [
      { key: "MLB", label: "MLB" },
      { key: "NCAABB", label: "NCAA Baseball" },
    ],
  },
  {
    id: "hockey",
    name: "Hockey",
    emoji: "🏒",
    icon: "disc-outline",
    color: "#4A90D9",
    gradient: ["#4A90D9", "#1E5293"],
    tagline: "NHL · NCAA Hockey",
    leagues: [
      { key: "NHL", label: "NHL" },
      { key: "NCAAHM", label: "NCAA Men's" },
      { key: "NCAAHW", label: "NCAA Women's" },
    ],
  },
  {
    id: "soccer",
    name: "Soccer",
    emoji: "⚽",
    icon: "football-outline",
    color: "#27AE60",
    gradient: ["#27AE60", "#145A32"],
    tagline: "EPL · La Liga · UCL · MLS · NWSL",
    leagues: [
      { key: "EPL", label: "Premier League", group: "domestic" },
      { key: "LIGA", label: "La Liga", group: "domestic" },
      { key: "BUN", label: "Bundesliga", group: "domestic" },
      { key: "SERA", label: "Serie A", group: "domestic" },
      { key: "LIG1", label: "Ligue 1", group: "domestic" },
      { key: "MLS", label: "MLS", group: "domestic" },
      { key: "NWSL", label: "NWSL", group: "domestic" },
      { key: "UCL", label: "Champions League", group: "cups" },
      { key: "UEL", label: "Europa League", group: "cups" },
      { key: "UECL", label: "Conference League", group: "cups" },
      { key: "FWCM", label: "FIFA World Cup", group: "international" },
      { key: "EURO", label: "Euro", group: "international" },
      { key: "COPA", label: "Copa América", group: "international" },
      { key: "NCAASM", label: "NCAA Men's" },
      { key: "NCAASW", label: "NCAA Women's" },
    ],
  },
  {
    id: "golf",
    name: "Golf",
    emoji: "⛳",
    icon: "flag-outline",
    color: "#2ECC71",
    gradient: ["#2ECC71", "#0E6B38"],
    tagline: "PGA · LPGA · LIV · Majors",
    leagues: [
      { key: "PGA", label: "PGA Tour" },
      { key: "LPGA", label: "LPGA Tour" },
      { key: "LIV", label: "LIV Golf" },
    ],
  },
  {
    id: "tennis",
    name: "Tennis",
    emoji: "🎾",
    icon: "tennisball-outline",
    color: "#CDDC39",
    gradient: ["#9BA720", "#4A5010"],
    tagline: "ATP · WTA · Grand Slams",
    leagues: [
      { key: "ATP", label: "ATP" },
      { key: "WTA", label: "WTA" },
    ],
  },
  {
    id: "combat",
    name: "Combat",
    emoji: "🥊",
    icon: "flame-outline",
    color: "#E74C3C",
    gradient: ["#E74C3C", "#7B241C"],
    tagline: "UFC · Bellator · PFL · Boxing",
    leagues: [
      { key: "UFC", label: "UFC" },
      { key: "BELLATOR", label: "Bellator" },
      { key: "PFL", label: "PFL" },
      { key: "BOXING", label: "Boxing" },
    ],
  },
  {
    id: "motorsports",
    name: "Motorsports",
    emoji: "🏎️",
    icon: "car-sport-outline",
    color: "#F39C12",
    gradient: ["#F39C12", "#784D04"],
    tagline: "F1 · NASCAR · IndyCar",
    leagues: [
      { key: "F1", label: "Formula 1" },
      { key: "NASCAR", label: "NASCAR" },
      { key: "IRL", label: "IndyCar" },
    ],
  },
  {
    id: "more",
    name: "More",
    emoji: "📍",
    icon: "apps-outline",
    color: "#8E8E93",
    gradient: ["#8E8E93", "#3A3A3C"],
    tagline: "Esports · Olympics · X Games · Track",
    leagues: [
      { key: "ESPORTS_LOL", label: "LoL" },
      { key: "ESPORTS_VAL", label: "Valorant" },
      { key: "ESPORTS_CS", label: "CS2" },
      { key: "ESPORTS_CDL", label: "CoD" },
      { key: "OLYMPICS_SUMMER", label: "Summer Olympics" },
      { key: "OLYMPICS_WINTER", label: "Winter Olympics" },
      { key: "XGAMES_SUMMER", label: "X Games Summer" },
      { key: "XGAMES_WINTER", label: "X Games Winter" },
      { key: "DIAMOND_LEAGUE", label: "Diamond League" },
      { key: "WORLD_ATHLETICS", label: "World Championships" },
      { key: "NCAALM", label: "NCAA Lacrosse (M)" },
      { key: "NCAALW", label: "NCAA Lacrosse (W)" },
      { key: "NCAAVW", label: "NCAA Volleyball" },
      { key: "NCAAWP", label: "NCAA Water Polo" },
      { key: "NCAAFH", label: "NCAA Field Hockey" },
    ],
  },
];

const SPORT_ALIASES: Record<string, string> = {
  // Combat
  mma: "combat",
  ufc: "combat",
  bellator: "combat",
  pfl: "combat",
  boxing: "combat",
  fighting: "combat",
  // More (catch-all)
  olympics: "more",
  "summer-games": "more",
  "winter-games": "more",
  esports: "more",
  "x-games": "more",
  xgames: "more",
  track: "more",
  "track-and-field": "more",
  lacrosse: "more",
  volleyball: "more",
  "water-polo": "more",
  "field-hockey": "more",
  // Motorsports
  f1: "motorsports",
  nascar: "motorsports",
  indycar: "motorsports",
  irl: "motorsports",
  racing: "motorsports",
  formula1: "motorsports",
  // Golf
  pga: "golf",
  lpga: "golf",
  liv: "golf",
  // Tennis
  atp: "tennis",
  wta: "tennis",
  // Basketball (includes NCAA)
  nba: "basketball",
  wnba: "basketball",
  ncaab: "basketball",
  ncaaw: "basketball",
  "ncaa-basketball": "basketball",
  "college-basketball": "basketball",
  // Football (includes NCAA)
  nfl: "football",
  ncaaf: "football",
  "ncaa-football": "football",
  "college-football": "football",
  // Baseball (includes NCAA)
  mlb: "baseball",
  ncaabb: "baseball",
  "ncaa-baseball": "baseball",
  "college-baseball": "baseball",
  // Hockey (includes NCAA)
  nhl: "hockey",
  ncaahm: "hockey",
  ncaahw: "hockey",
  "ncaa-hockey": "hockey",
  "college-hockey": "hockey",
  // Soccer
  mls: "soccer",
  epl: "soccer",
  "premier-league": "soccer",
  ucl: "soccer",
  "champions-league": "soccer",
  liga: "soccer",
  "la-liga": "soccer",
  bundesliga: "soccer",
  bun: "soccer",
  "serie-a": "soccer",
  sera: "soccer",
  "ligue-1": "soccer",
  lig1: "soccer",
  uel: "soccer",
  "europa-league": "soccer",
  uecl: "soccer",
  "conference-league": "soccer",
  nwsl: "soccer",
  "world-cup": "soccer",
  fwcm: "soccer",
  euro: "soccer",
  copa: "soccer",
  "copa-america": "soccer",
  ncaasm: "soccer",
  ncaasw: "soccer",
};

export function getSportById(id: string): SportCategory | undefined {
  const direct = SPORT_CATEGORIES.find((s) => s.id === id);
  if (direct) return direct;
  const aliased = SPORT_ALIASES[id.toLowerCase()];
  if (aliased) return SPORT_CATEGORIES.find((s) => s.id === aliased);
  return undefined;
}

export function getSportByLeague(leagueKey: string): SportCategory | undefined {
  return SPORT_CATEGORIES.find((s) =>
    s.leagues.some((l) => l.key === leagueKey)
  );
}

export const LEAGUE_TO_SPORT: Record<string, string> = Object.fromEntries(
  SPORT_CATEGORIES.flatMap((s) => s.leagues.map((l) => [l.key, s.id]))
);

LEAGUE_TO_SPORT['NWSL'] = 'soccer';

export const SOCCER_LEAGUE_GROUPS: Record<string, SportLeague[]> = {
  domestic: SPORT_CATEGORIES.find(s => s.id === "soccer")?.leagues.filter(l => l.group === "domestic") ?? [],
  cups: SPORT_CATEGORIES.find(s => s.id === "soccer")?.leagues.filter(l => l.group === "cups") ?? [],
  international: SPORT_CATEGORIES.find(s => s.id === "soccer")?.leagues.filter(l => l.group === "international") ?? [],
};

// Sport Archetype Styling Configuration

export type SportArchetypeType = "team" | "tennis" | "combat" | "golf" | "racing" | "seasonal" | "multi_event";

export type ArchetypeStyle = {
  heroGradient: [string, string, string];
  cardStyle: "score" | "match" | "leaderboard" | "bracket" | "event";
  accentColor: string;
  sectionOrder: string[];
  showRankings: boolean;
  showStandings: boolean;
  showLeaderboard: boolean;
  athleteStatLabel: string;
};

export const ARCHETYPE_STYLES: Record<SportArchetypeType, ArchetypeStyle> = {
  team: {
    heroGradient: ["#1A1A2E", "#16213E", "#0F0F1A"],
    cardStyle: "score",
    accentColor: "#E8503A",
    sectionOrder: ["live", "games", "standings", "athletes", "news"],
    showRankings: false,
    showStandings: true,
    showLeaderboard: false,
    athleteStatLabel: "PPG",
  },
  tennis: {
    heroGradient: ["#9BA720", "#4A5010", "#1A1D05"],
    cardStyle: "match",
    accentColor: "#CDDC39",
    sectionOrder: ["live", "draw", "rankings", "athletes", "news"],
    showRankings: true,
    showStandings: false,
    showLeaderboard: false,
    athleteStatLabel: "Rank",
  },
  combat: {
    heroGradient: ["#E74C3C", "#7B241C", "#2A0A08"],
    cardStyle: "match",
    accentColor: "#E74C3C",
    sectionOrder: ["live", "rankings", "upcoming", "athletes", "news"],
    showRankings: true,
    showStandings: false,
    showLeaderboard: false,
    athleteStatLabel: "Record",
  },
  golf: {
    heroGradient: ["#2ECC71", "#0E6B38", "#053320"],
    cardStyle: "leaderboard",
    accentColor: "#2ECC71",
    sectionOrder: ["leaderboard", "rankings", "athletes", "news"],
    showRankings: true,
    showStandings: false,
    showLeaderboard: true,
    athleteStatLabel: "Score",
  },
  racing: {
    heroGradient: ["#F39C12", "#784D04", "#2A1A05"],
    cardStyle: "event",
    accentColor: "#F39C12",
    sectionOrder: ["live", "schedule", "standings", "athletes", "news"],
    showRankings: true,
    showStandings: true,
    showLeaderboard: false,
    athleteStatLabel: "Points",
  },
  seasonal: {
    heroGradient: ["#8E8E93", "#3A3A3C", "#1A1A1A"],
    cardStyle: "event",
    accentColor: "#8E8E93",
    sectionOrder: ["events", "athletes", "news"],
    showRankings: false,
    showStandings: false,
    showLeaderboard: false,
    athleteStatLabel: "",
  },
  multi_event: {
    heroGradient: ["#D4A843", "#8B6914", "#2A1D05"],
    cardStyle: "bracket",
    accentColor: "#D4A843",
    sectionOrder: ["events", "medals", "athletes", "news"],
    showRankings: false,
    showStandings: false,
    showLeaderboard: false,
    athleteStatLabel: "Medals",
  },
};

// League-to-archetype mappings (module-level for efficiency)
const TENNIS_LEAGUES = new Set(["ATP", "WTA"]);
const COMBAT_LEAGUES = new Set(["UFC", "BELLATOR", "PFL", "BOXING"]);
const GOLF_LEAGUES = new Set(["PGA", "LPGA", "LIV"]);
const RACING_LEAGUES = new Set(["F1", "NASCAR", "IRL"]);

export function getArchetypeForLeague(leagueKey: string): SportArchetypeType {
  if (TENNIS_LEAGUES.has(leagueKey)) return "tennis";
  if (COMBAT_LEAGUES.has(leagueKey)) return "combat";
  if (GOLF_LEAGUES.has(leagueKey)) return "golf";
  if (RACING_LEAGUES.has(leagueKey)) return "racing";
  if (leagueKey.startsWith("OLYMPICS") || leagueKey.startsWith("XGAMES")) return "multi_event";
  if (leagueKey.startsWith("DIAMOND") || leagueKey.startsWith("WORLD_ATHLETICS")) return "seasonal";
  return "team";
}

export function getArchetypeStyle(leagueKey: string): ArchetypeStyle {
  const archetype = getArchetypeForLeague(leagueKey);
  return ARCHETYPE_STYLES[archetype];
}
