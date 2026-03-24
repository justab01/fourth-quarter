export type SportLeague = {
  key: string;
  label: string;
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
      { key: "NCAAB", label: "NCAA" },
    ],
  },
  {
    id: "football",
    name: "Football",
    emoji: "🏈",
    icon: "american-football-outline",
    color: "#8B7355",
    gradient: ["#8B7355", "#52432F"],
    tagline: "NFL · College Football",
    leagues: [
      { key: "NFL", label: "NFL" },
      { key: "NCAAF", label: "College" },
    ],
  },
  {
    id: "baseball",
    name: "Baseball",
    emoji: "⚾",
    icon: "baseball-outline",
    color: "#3B6DB8",
    gradient: ["#3B6DB8", "#1E3D6B"],
    tagline: "MLB · College Baseball",
    leagues: [
      { key: "MLB", label: "MLB" },
    ],
  },
  {
    id: "hockey",
    name: "Hockey",
    emoji: "🏒",
    icon: "disc-outline",
    color: "#4A90D9",
    gradient: ["#4A90D9", "#1E5293"],
    tagline: "NHL · International",
    leagues: [
      { key: "NHL", label: "NHL" },
    ],
  },
  {
    id: "soccer",
    name: "Soccer",
    emoji: "⚽",
    icon: "football-outline",
    color: "#27AE60",
    gradient: ["#27AE60", "#145A32"],
    tagline: "EPL · UCL · La Liga · MLS",
    leagues: [
      { key: "EPL", label: "Premier League" },
      { key: "UCL", label: "Champions League" },
      { key: "LIGA", label: "La Liga" },
      { key: "MLS", label: "MLS" },
    ],
  },
  {
    id: "golf",
    name: "Golf",
    emoji: "⛳",
    icon: "flag-outline",
    color: "#2ECC71",
    gradient: ["#2ECC71", "#0E6B38"],
    tagline: "PGA Tour · LIV Golf · Majors",
    leagues: [
      { key: "PGA", label: "PGA Tour" },
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
    tagline: "UFC · Boxing",
    leagues: [
      { key: "UFC", label: "UFC" },
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
    tagline: "Basketball · Football · Baseball",
    leagues: [
      { key: "NCAAB", label: "Basketball" },
      { key: "NCAAF", label: "Football" },
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
    ],
  },
  {
    id: "motorsports",
    name: "Motorsports",
    emoji: "🏎️",
    icon: "car-sport-outline",
    color: "#F39C12",
    gradient: ["#F39C12", "#784D04"],
    tagline: "F1 · NASCAR · IndyCar · MotoGP",
    leagues: [
      { key: "F1", label: "Formula 1" },
      { key: "NASCAR", label: "NASCAR" },
    ],
  },
  {
    id: "track",
    name: "Track & Field",
    emoji: "🏃",
    icon: "timer-outline",
    color: "#FF6B35",
    gradient: ["#FF6B35", "#8B2A08"],
    tagline: "World Athletics · Olympics",
    leagues: [
      { key: "OLYMPICS", label: "Olympics" },
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
      { key: "XGAMES", label: "X Games" },
    ],
  },
  {
    id: "esports",
    name: "Esports",
    emoji: "🎮",
    icon: "game-controller-outline",
    color: "#9B59B6",
    gradient: ["#9B59B6", "#4A1F6B"],
    tagline: "COD · Valorant · LoL · CS",
    leagues: [],
  },
];

export function getSportById(id: string): SportCategory | undefined {
  return SPORT_CATEGORIES.find((s) => s.id === id);
}

export function getSportByLeague(leagueKey: string): SportCategory | undefined {
  return SPORT_CATEGORIES.find((s) =>
    s.leagues.some((l) => l.key === leagueKey)
  );
}

export const LEAGUE_TO_SPORT: Record<string, string> = Object.fromEntries(
  SPORT_CATEGORIES.flatMap((s) => s.leagues.map((l) => [l.key, s.id]))
);
