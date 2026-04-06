export type SportArchetype = "team" | "tennis" | "combat" | "multi_event" | "golf" | "racing" | "seasonal";

const TENNIS_LEAGUES = new Set(["ATP", "WTA"]);
const COMBAT_LEAGUES = new Set(["UFC", "BOXING", "BELLATOR", "PFL"]);
const MULTI_LEAGUES  = new Set(["OLYMPICS", "XGAMES"]);
const GOLF_LEAGUES   = new Set(["PGA", "LPGA", "LIV"]);
const RACING_LEAGUES = new Set(["F1", "NASCAR", "IRL"]);
const SEASONAL_LEAGUES = new Set(["DIAMOND_LEAGUE", "WORLD_ATHLETICS", "XGAMES_SUMMER", "XGAMES_WINTER", "ESPORTS_LOL", "ESPORTS_VAL", "ESPORTS_CS", "ESPORTS_CDL"]);

export function getSportArchetype(league: string): SportArchetype {
  if (TENNIS_LEAGUES.has(league)) return "tennis";
  if (COMBAT_LEAGUES.has(league)) return "combat";
  if (GOLF_LEAGUES.has(league))   return "golf";
  if (RACING_LEAGUES.has(league)) return "racing";
  if (MULTI_LEAGUES.has(league))  return "multi_event";
  if (SEASONAL_LEAGUES.has(league)) return "seasonal";
  return "team";
}

export const isTennisLeague    = (l: string) => TENNIS_LEAGUES.has(l);
export const isCombatLeague    = (l: string) => COMBAT_LEAGUES.has(l);
export const isGolfLeague      = (l: string) => GOLF_LEAGUES.has(l);
export const isRacingLeague    = (l: string) => RACING_LEAGUES.has(l);
export const isMultiEventLeague = (l: string) => MULTI_LEAGUES.has(l);
export const isSeasonalLeague  = (l: string) => SEASONAL_LEAGUES.has(l);
export const isIndividualSport = (l: string) => TENNIS_LEAGUES.has(l) || COMBAT_LEAGUES.has(l) || GOLF_LEAGUES.has(l) || RACING_LEAGUES.has(l);
export const isTeamSport       = (l: string) => !isIndividualSport(l) && !MULTI_LEAGUES.has(l) && !SEASONAL_LEAGUES.has(l);

export function shortAthleteName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length <= 1) return fullName;
  const first = parts[0];
  const last  = parts.slice(1).join(" ");
  return `${first[0]}. ${last}`;
}

const FLAGS: Record<string, string> = {
  Italy: "🇮🇹", Spain: "🇪🇸", Serbia: "🇷🇸", Russia: "🇷🇺",
  Germany: "🇩🇪", Norway: "🇳🇴", Denmark: "🇩🇰", Greece: "🇬🇷",
  France: "🇫🇷", "United States": "🇺🇸", USA: "🇺🇸", Canada: "🇨🇦",
  Australia: "🇦🇺", "United Kingdom": "🇬🇧", "Great Britain": "🇬🇧",
  Poland: "🇵🇱", Belarus: "🇧🇾", Kazakhstan: "🇰🇿",
  "Czech Republic": "🇨🇿", Czechia: "🇨🇿",
  Argentina: "🇦🇷", Brazil: "🇧🇷", Japan: "🇯🇵", "South Korea": "🇰🇷",
  China: "🇨🇳", Netherlands: "🇳🇱", Belgium: "🇧🇪", Switzerland: "🇨🇭",
  Ukraine: "🇺🇦", Romania: "🇷🇴", Croatia: "🇭🇷", Hungary: "🇭🇺",
  Bulgaria: "🇧🇬", Georgia: "🇬🇪", Nigeria: "🇳🇬", Jamaica: "🇯🇲",
  Kenya: "🇰🇪", Ethiopia: "🇪🇹", Mexico: "🇲🇽", Colombia: "🇨🇴",
  Ireland: "🇮🇪", Sweden: "🇸🇪", Finland: "🇫🇮", Portugal: "🇵🇹",
  Austria: "🇦🇹", Turkey: "🇹🇷", Morocco: "🇲🇦", "New Zealand": "🇳🇿",
  Tunisia: "🇹🇳", "Dominican Republic": "🇩🇴", "Puerto Rico": "🇵🇷",
  Cuba: "🇨🇺", "South Africa": "🇿🇦", "S. Africa": "🇿🇦",
  "Slovak Republic": "🇸🇰", Slovakia: "🇸🇰", Latvia: "🇱🇻",
  Estonia: "🇪🇪", Lithuania: "🇱🇹",
  England: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", Scotland: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", Wales: "🏴󠁧󠁢󠁷󠁬󠁳󠁿",
  Peru: "🇵🇪", Chile: "🇨🇱", Uruguay: "🇺🇾", Ecuador: "🇪🇨",
  Paraguay: "🇵🇾", Bolivia: "🇧🇴", Venezuela: "🇻🇪",
  "Costa Rica": "🇨🇷", Honduras: "🇭🇳", Panama: "🇵🇦",
  Senegal: "🇸🇳", Ghana: "🇬🇭", Cameroon: "🇨🇲",
  Egypt: "🇪🇬", Algeria: "🇩🇿",
  "Saudi Arabia": "🇸🇦", Qatar: "🇶🇦", Iran: "🇮🇷",
  India: "🇮🇳", Thailand: "🇹🇭",
};

export function getCountryFlag(nationality: string): string {
  return FLAGS[nationality] ?? "🌐";
}

const WEIGHT_CLASS_MAP: Record<string, string> = {
  HW:  "Heavyweight",       LHW: "Light Heavyweight", MW:  "Middleweight",
  WW:  "Welterweight",      LW:  "Lightweight",        FW:  "Featherweight",
  BW:  "Bantamweight",      FLW: "Flyweight",
  SMW: "Super Middleweight", SWW: "Super Welterweight",
  SLW: "Super Lightweight",  SBW: "Super Bantamweight",
  WSW: "Women's Strawweight", WFLW: "Women's Flyweight",
  WBW: "Women's Bantamweight", WFW: "Women's Featherweight",
};

export function getWeightClassLabel(position: string): string {
  return WEIGHT_CLASS_MAP[position?.toUpperCase()] ?? position ?? "—";
}

export function extractRankingDisplay(stat: string): string {
  const match = stat?.match(/^(#\d+)/);
  return match ? match[1] : stat?.split("—")[0].trim() ?? "—";
}

export const SPORT_EMOJI: Record<string, string> = {
  ATP: "🎾", WTA: "🎾",
  UFC: "🥋", BOXING: "🥊", BELLATOR: "🥋", PFL: "🥋",
  NBA: "🏀", NFL: "🏈", MLB: "⚾", NHL: "🏒",
  MLS: "⚽", EPL: "⚽", UCL: "⚽", LIGA: "⚽",
BUN: "⚽", SERA: "⚽", LIG1: "⚽", UEL: "⚽", UECL: "⚽",
  NWSL: "⚽", FWCM: "⚽", EURO: "⚽", COPA: "⚽",
  WNBA: "🏀", NCAAB: "🏀", NCAAW: "🏀",
  NCAAF: "🏈", NCAABB: "⚾",
  NCAAHM: "🏒", NCAAHW: "🏒",
  NCAASM: "⚽", NCAASW: "⚽",
  NCAALM: "🥍", NCAALW: "🥍",
  NCAAVW: "🏐", NCAAWP: "🤽", NCAAFH: "🏑",
  PGA: "⛳", LPGA: "⛳", LIV: "⛳",
  F1: "🏎️", NASCAR: "🏁", IRL: "🏁",
  OLYMPICS: "🏅", XGAMES: "🏂",
  DIAMOND_LEAGUE: "🏃", WORLD_ATHLETICS: "🏃",
  XGAMES_SUMMER: "🛹", XGAMES_WINTER: "🏂",
  ESPORTS_LOL: "🎮", ESPORTS_VAL: "🎮", ESPORTS_CS: "🎮", ESPORTS_CDL: "🎮",
};
