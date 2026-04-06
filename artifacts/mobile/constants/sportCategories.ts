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
    tagline: "NBA · WNBA",
    leagues: [
      { key: "NBA", label: "NBA" },
      { key: "WNBA", label: "WNBA" },
      { key: "NCAAB", label: "NCAA (M)" },
      { key: "NCAAW", label: "NCAA (W)" },
    ],
  },
  {
    id: "football",
    name: "Football",
    emoji: "🏈",
    icon: "american-football-outline",
    color: "#8B7355",
    gradient: ["#8B7355", "#52432F"],
    tagline: "NFL",
    leagues: [
      { key: "NFL", label: "NFL" },
    ],
  },
  {
    id: "baseball",
    name: "Baseball",
    emoji: "⚾",
    icon: "baseball-outline",
    color: "#3B6DB8",
    gradient: ["#3B6DB8", "#1E3D6B"],
    tagline: "MLB",
    leagues: [
      { key: "MLB", label: "MLB" },
      { key: "NCAABB", label: "College" },
    ],
  },
  {
    id: "hockey",
    name: "Hockey",
    emoji: "🏒",
    icon: "disc-outline",
    color: "#4A90D9",
    gradient: ["#4A90D9", "#1E5293"],
    tagline: "NHL · College Hockey",
    leagues: [
      { key: "NHL", label: "NHL" },
      { key: "NCAAHM", label: "College (M)" },
      { key: "NCAAHW", label: "College (W)" },
    ],
  },
  {
    id: "soccer",
    name: "Soccer",
    emoji: "⚽",
    icon: "football-outline",
    color: "#27AE60",
    gradient: ["#27AE60", "#145A32"],
    tagline: "EPL · La Liga · Bundesliga · Serie A · UCL · MLS",
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
      { key: "NCAASM", label: "NCAA (M)" },
      { key: "NCAASW", label: "NCAA (W)" },
    ],
  },
  {
    id: "golf",
    name: "Golf",
    emoji: "⛳",
    icon: "flag-outline",
    color: "#2ECC71",
    gradient: ["#2ECC71", "#0E6B38"],
    tagline: "PGA Tour · LPGA Tour · LIV Golf · Majors",
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
    id: "college",
    name: "College",
    emoji: "🎓",
    icon: "school-outline",
    color: "#5B3E96",
    gradient: ["#5B3E96", "#2E1F4D"],
    tagline: "Basketball · Football · Baseball · Hockey · Soccer · Lacrosse · Volleyball · More",
    leagues: [
      { key: "NCAAB", label: "Men's Basketball" },
      { key: "NCAAW", label: "Women's Basketball" },
      { key: "NCAAF", label: "Football" },
      { key: "NCAABB", label: "Baseball" },
      { key: "NCAAHM", label: "Men's Hockey" },
      { key: "NCAAHW", label: "Women's Hockey" },
      { key: "NCAASM", label: "Men's Soccer" },
      { key: "NCAASW", label: "Women's Soccer" },
      { key: "NCAALM", label: "Men's Lacrosse" },
      { key: "NCAALW", label: "Women's Lacrosse" },
      { key: "NCAAVW", label: "Volleyball" },
      { key: "NCAAWP", label: "Water Polo" },
      { key: "NCAAFH", label: "Field Hockey" },
    ],
  },
  {
    id: "womens",
    name: "Women's Sports",
    emoji: "⭐",
    icon: "star-outline",
    color: "#E91E8C",
    gradient: ["#E91E8C", "#7B0E4B"],
    tagline: "WNBA · WTA · NWSL · LPGA",
    leagues: [
      { key: "WNBA", label: "WNBA" },
      { key: "WTA", label: "WTA" },
      { key: "NWSL", label: "NWSL" },
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
    id: "track",
    name: "Track & Field",
    emoji: "🏃",
    icon: "timer-outline",
    color: "#FF6B35",
    gradient: ["#FF6B35", "#8B2A08"],
tagline: "Diamond League · World Championships",
    leagues: [
      { key: "DIAMOND_LEAGUE", label: "Diamond League" },
      { key: "WORLD_ATHLETICS", label: "World Championships" },
    ],
  },
  {
    id: "xgames",
    name: "X Games",
    emoji: "🛹",
    icon: "snow-outline",
    color: "#00D4FF",
    gradient: ["#00D4FF", "#005C7A"],
    tagline: "Skateboarding · Snowboarding · BMX",
    leagues: [
      { key: "XGAMES_SUMMER", label: "Summer" },
      { key: "XGAMES_WINTER", label: "Winter" },
    ],
  },
  {
    id: "esports",
    name: "Esports",
    emoji: "🎮",
    icon: "game-controller-outline",
    color: "#9B59B6",
    gradient: ["#9B59B6", "#4A1F6B"],
tagline: "LoL · VALORANT · CS2 · Dota 2 · Overwatch",
    leagues: [
      { key: "ESPORTS_LOL", label: "LoL" },
      { key: "ESPORTS_VAL", label: "Valorant" },
      { key: "ESPORTS_CS", label: "CS2" },
      { key: "ESPORTS_CDL", label: "CoD" },
    ],
  },
];

const SPORT_ALIASES: Record<string, string> = {
  mma: "combat",
  ufc: "combat",
  boxing: "combat",
  fighting: "combat",
  bellator: "combat",
  pfl: "combat",
  f1: "motorsports",
  nascar: "motorsports",
  indycar: "motorsports",
  irl: "motorsports",
  racing: "motorsports",
  indycar: "motorsports",
  irl: "motorsports",
  pga: "golf",
  lpga: "golf",
  liv: "golf",
  atp: "tennis",
  wta: "tennis",
  nba: "basketball",
  wnba: "basketball",
  ncaab: "college",
  ncaaw: "college",
  nfl: "football",
  ncaaf: "college",
  ncaabb: "college",
  ncaahm: "college",
  ncaahw: "college",
  ncaasm: "college",
  ncaasw: "college",
  ncaalm: "college",
  ncaalw: "college",
  ncaavw: "college",
  ncaawp: "college",
  ncaafh: "college",
  mlb: "baseball",
  nhl: "hockey",
  mls: "soccer",
  epl: "soccer",
  ucl: "soccer",
  liga: "soccer",
  bundesliga: "soccer",
  bun: "soccer",
  "serie-a": "soccer",
  "serie a": "soccer",
  sera: "soccer",
  "ligue-1": "soccer",
  "ligue 1": "soccer",
  lig1: "soccer",
  uel: "soccer",
  uecl: "soccer",
  nwsl: "soccer",
  "world-cup": "soccer",
  "world cup": "soccer",
  fwcm: "soccer",
  euro: "soccer",
  copa: "soccer",
  "copa-america": "soccer",
  "europa-league": "soccer",
  "champions-league": "soccer",
  ncaab: "college",
  ncaaw: "college",
  ncaaf: "college",
  ncaabb: "college",
  ncaahm: "college",
  ncaahw: "college",
  ncaasm: "college",
  ncaasw: "college",
  ncaalm: "college",
  ncaalw: "college",
  ncaavw: "college",
  ncaawp: "college",
  ncaafh: "college",
  lacrosse: "college",
  volleyball: "college",
  "water-polo": "college",
  "field-hockey": "college",
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
