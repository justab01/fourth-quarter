import { ALL_TEAMS } from "@/constants/allPlayers";

const SPORT_MAP: Record<string, string> = {
  NBA: "nba", WNBA: "wnba",
  NFL: "nfl", NCAAF: "college-football",
  MLB: "mlb",
  NHL: "nhl",
  MLS: "soccer", NWSL: "soccer",
  EPL: "soccer", LIGA: "soccer", BUN: "soccer", SERA: "soccer", LIG1: "soccer",
  UCL: "soccer", UEL: "soccer", UECL: "soccer",
  NCAAB: "mens-college-basketball", NCAAW: "womens-college-basketball",
};

// NHL: city / mascot → ESPN team abbreviation (used in /teamlogos/nhl/500/{abbr}.png)
const NHL_LOOKUP: Record<string, string> = {
  anaheim: "ana", ducks: "ana",
  arizona: "ari", coyotes: "ari",
  utah: "utah", utahhockeyclub: "utah",
  boston: "bos", bruins: "bos",
  buffalo: "buf", sabres: "buf",
  calgary: "cgy", flames: "cgy",
  carolina: "car", hurricanes: "car",
  chicago: "chi", blackhawks: "chi",
  colorado: "col", avalanche: "col",
  columbus: "cbj", bluejackets: "cbj",
  dallas: "dal", stars: "dal",
  detroit: "det", redwings: "det",
  edmonton: "edm", oilers: "edm",
  florida: "fla", panthers: "fla",
  losangeles: "lak", lakings: "lak", kings: "lak",
  minnesota: "min", wild: "min",
  montreal: "mtl", canadiens: "mtl",
  nashville: "nsh", predators: "nsh",
  newjersey: "nj", devils: "nj",
  nyislanders: "nyi", newyorkislanders: "nyi", islanders: "nyi",
  nyrangers: "nyr", newyorkrangers: "nyr", rangers: "nyr",
  ottawa: "ott", senators: "ott",
  philadelphia: "phi", flyers: "phi",
  pittsburgh: "pit", penguins: "pit",
  sanjose: "sj", sharks: "sj",
  seattle: "sea", kraken: "sea",
  stlouis: "stl", blues: "stl",
  tampabay: "tb", lightning: "tb",
  toronto: "tor", mapleleafs: "tor",
  vancouver: "van", canucks: "van",
  vegas: "vgk", goldenknights: "vgk",
  washington: "wsh", capitals: "wsh",
  winnipeg: "wpg", jets: "wpg",
};

// EPL: name → ESPN soccer team numeric ID (used in /teamlogos/soccer/500/{id}.png)
const EPL_LOOKUP: Record<string, string> = {
  arsenal: "359",
  astonvilla: "362",
  bournemouth: "349", afcbournemouth: "349",
  brentford: "337",
  brighton: "331", brightonhovealbion: "331",
  chelsea: "363",
  crystalpalace: "384",
  everton: "368",
  fulham: "370",
  ipswich: "373", ipswichtown: "373",
  leicester: "375", leicestercity: "375",
  liverpool: "364",
  manchestercity: "382", mancity: "382",
  manchesterunited: "360", manunited: "360", manutd: "360",
  newcastle: "361", newcastleunited: "361",
  nottinghamforest: "393", forest: "393",
  southampton: "376",
  tottenham: "367", spurs: "367", hotspur: "367", tottenhamhotspur: "367",
  westham: "371", westhamunited: "371",
  wolves: "380", wolverhampton: "380",
};

function cleanOpponent(label: string): string {
  return label
    .replace(/^(vs\.?|@)\s+/i, "")
    .replace(/\s*\((ST|SB|WC|Div|NFCCG|AFCCG|UCL|Wild Card|Playoffs?)\)\s*$/i, "")
    .trim();
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function buildLogoUrl(slug: string, league: string): string | null {
  const sport = SPORT_MAP[league];
  if (!sport) return null;
  return `https://a.espncdn.com/i/teamlogos/${sport}/500/${slug.toLowerCase()}.png`;
}

/**
 * Resolve a real ESPN team logo URL from an opponent label like
 * "vs Boston" / "@ Tampa Bay" / "Manchester City" plus a league code.
 * Returns null if no match — the caller falls back to initials.
 */
export function resolveOpponentLogoUrl(
  opponentLabel: string,
  league: string,
): string | null {
  const cleaned = cleanOpponent(opponentLabel);
  if (!cleaned) return null;
  const normTarget = normalize(cleaned);

  // 1. NHL supplemental lookup (city or mascot key)
  if (league === "NHL") {
    const slug = NHL_LOOKUP[normTarget] ?? findByPartialKey(NHL_LOOKUP, normTarget);
    if (slug) return buildLogoUrl(slug, league);
  }

  // 2. EPL supplemental lookup (numeric ESPN ID)
  if (league === "EPL") {
    const slug = EPL_LOOKUP[normTarget] ?? findByPartialKey(EPL_LOOKUP, normTarget);
    if (slug) return buildLogoUrl(slug, league);
  }

  // 3. ALL_TEAMS lookup for NBA/NFL/MLB/MLS
  const candidates = ALL_TEAMS.filter(t => t.league === league);
  let match = candidates.find(t => normalize(t.name) === normTarget);
  if (!match) match = candidates.find(t => t.abbr.toLowerCase() === normTarget);
  if (!match) match = candidates.find(t => t.city && normalize(t.city) === normTarget);
  if (!match) match = candidates.find(t => normalize(t.name).includes(normTarget));
  if (!match) {
    const targetWords = cleaned.toLowerCase().split(/\s+/).filter(Boolean);
    match = candidates.find(t => {
      const teamWords = t.name.toLowerCase().split(/\s+/);
      return targetWords.some(w => teamWords.includes(w));
    });
  }
  if (match) return buildLogoUrl(match.abbr, league);

  return null;
}

function findByPartialKey(table: Record<string, string>, target: string): string | undefined {
  // Try keys that start with or contain the target
  for (const [k, v] of Object.entries(table)) {
    if (k === target || k.startsWith(target) || target.startsWith(k)) return v;
  }
  return undefined;
}

/**
 * Get an ESPN logo URL directly from an abbreviation + league.
 */
export function abbrLogoUrl(abbr: string | null | undefined, league: string): string | null {
  if (!abbr) return null;
  return buildLogoUrl(abbr, league);
}
