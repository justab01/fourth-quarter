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
