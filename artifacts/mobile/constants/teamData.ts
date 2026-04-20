import Colors from "./colors";

const C = Colors.dark;

export type Player = {
  id: string;
  name: string;
  number: string;
  position: string;
  age: number;
  height: string;
  weight: string;
  college?: string;
  birthdate?: string;
  group: "Offense" | "Defense" | "Special Teams" | "Pitching" | "Hitting" | "Bullpen" | "Forwards" | "Defensemen" | "Goalies" | "Midfielders" | "Defenders" | "Goalkeepers" | "Guards" | "Forwards/Centers" | "Bigs";
  stats?: Record<string, string | number>;
  bio?: string;
  athleteId?: string;
};

export type GameData = {
  id?: string;
  league?: string;
  date: string;
  opponent: string;
  opponentLogo?: string | null;
  result: string;
  score: string;
  quarterScores?: {
    home: number[];
    away: number[];
  };
  topPerformers?: {
    home: { name: string; points: number; rebounds?: number; assists?: number; stat?: string }[];
    away: { name: string; points: number; rebounds?: number; assists?: number; stat?: string }[];
  };
};

export type TeamData = {
  id: string;
  name: string;
  shortName: string;
  abbr: string;
  league: "NBA" | "NFL" | "MLB" | "MLS" | "NHL" | "WNBA" | "NCAAB" | "NCAAF" | "EPL" | "UCL" | "LIGA" | string;
  division: string;
  color: string;
  colorSecondary: string;
  logoUrl?: string | null;
  record: string;
  standing: string;
  coach: string;
  stadium: string;
  city: string;
  founded: number;
  roster: Player[];
  recentGames: GameData[];
  stats: { label: string; value: string; rank: string }[];
};

// ─── Team color map ───────────────────────────────────────────────────────────
const TEAM_COLORS: Record<string, [string, string]> = {
  // NBA – all 30
  "atlanta-hawks":             ["#E03A3E", "#C1D32F"],
  "boston-celtics":            ["#007A33", "#BA9653"],
  "brooklyn-nets":             ["#000000", "#FFFFFF"],
  "charlotte-hornets":         ["#1D1160", "#00788C"],
  "chicago-bulls":             ["#CE1141", "#000000"],
  "cleveland-cavaliers":       ["#6F263D", "#FFB81C"],
  "dallas-mavericks":          ["#00538C", "#002B5E"],
  "denver-nuggets":            ["#0E2240", "#FEC524"],
  "detroit-pistons":           ["#C8102E", "#1D42BA"],
  "golden-state-warriors":     ["#1D428A", "#FFC72C"],
  "houston-rockets":           ["#CE1141", "#C4CED4"],
  "indiana-pacers":            ["#002D62", "#FDBB30"],
  "los-angeles-clippers":      ["#C8102E", "#1D428A"],
  "la-clippers":               ["#C8102E", "#1D428A"],
  "los-angeles-lakers":        ["#552583", "#FDB927"],
  "memphis-grizzlies":         ["#5D76A9", "#12173F"],
  "miami-heat":                ["#98002E", "#F9A01B"],
  "milwaukee-bucks":           ["#00471B", "#EEE1C6"],
  "minnesota-timberwolves":    ["#0C2340", "#236192"],
  "new-orleans-pelicans":      ["#0C2340", "#C8102E"],
  "new-york-knicks":           ["#006BB6", "#F58426"],
  "oklahoma-city-thunder":     ["#007AC1", "#EF3B24"],
  "orlando-magic":             ["#0077C0", "#C4CED4"],
  "philadelphia-76ers":        ["#006BB6", "#ED174C"],
  "phoenix-suns":              ["#1D1160", "#E56020"],
  "portland-trail-blazers":    ["#E03A3E", "#000000"],
  "sacramento-kings":          ["#5A2D81", "#63727A"],
  "san-antonio-spurs":         ["#C4CED4", "#000000"],
  "toronto-raptors":           ["#CE1141", "#000000"],
  "utah-jazz":                 ["#002B5C", "#F9A01B"],
  "washington-wizards":        ["#002B5C", "#E31837"],
  // NFL – all 32
  "arizona-cardinals":         ["#97233F", "#000000"],
  "atlanta-falcons":           ["#A71930", "#000000"],
  "baltimore-ravens":          ["#241773", "#9E7C0C"],
  "buffalo-bills":             ["#00338D", "#C60C30"],
  "carolina-panthers":         ["#0085CA", "#101820"],
  "chicago-bears":             ["#C83803", "#0B162A"],
  "cincinnati-bengals":        ["#FB4F14", "#000000"],
  "cleveland-browns":          ["#311D00", "#FF3C00"],
  "dallas-cowboys":            ["#003594", "#869397"],
  "denver-broncos":            ["#FB4F14", "#002244"],
  "detroit-lions":             ["#0076B6", "#B0B7BC"],
  "green-bay-packers":         ["#203731", "#FFB612"],
  "houston-texans":            ["#03202F", "#A71930"],
  "indianapolis-colts":        ["#002C5F", "#A2AAAD"],
  "jacksonville-jaguars":      ["#006778", "#9F792C"],
  "kansas-city-chiefs":        ["#E31837", "#FFB81C"],
  "las-vegas-raiders":         ["#000000", "#A5ACAF"],
  "los-angeles-chargers":      ["#002A5E", "#FFC20E"],
  "los-angeles-rams":          ["#003594", "#FFA300"],
  "miami-dolphins":            ["#008E97", "#FC4C02"],
  "minnesota-vikings":         ["#4F2683", "#FFC62F"],
  "new-england-patriots":      ["#002244", "#C60C30"],
  "new-orleans-saints":        ["#D3BC8D", "#101820"],
  "new-york-giants":           ["#0B2265", "#A71930"],
  "new-york-jets":             ["#125740", "#FFFFFF"],
  "philadelphia-eagles":       ["#004C54", "#A5ACAF"],
  "pittsburgh-steelers":       ["#FFB612", "#101820"],
  "san-francisco-49ers":       ["#AA0000", "#B3995D"],
  "seattle-seahawks":          ["#002244", "#69BE28"],
  "tampa-bay-buccaneers":      ["#D50A0A", "#FF7900"],
  "tennessee-titans":          ["#4B92DB", "#0C2340"],
  "washington-commanders":     ["#5A1414", "#FFB612"],
  // MLB – all 30
  "arizona-diamondbacks":      ["#A71930", "#000000"],
  "atlanta-braves":            ["#CE1141", "#13274F"],
  "baltimore-orioles":         ["#DF4601", "#000000"],
  "boston-red-sox":            ["#BD3039", "#0C2340"],
  "chicago-cubs":              ["#0E3386", "#CC3433"],
  "chicago-white-sox":         ["#27251F", "#C4CED3"],
  "cincinnati-reds":           ["#C6011F", "#000000"],
  "cleveland-guardians":       ["#00385D", "#E50022"],
  "colorado-rockies":          ["#33006F", "#C4CED4"],
  "detroit-tigers":            ["#0C2340", "#FA4616"],
  "houston-astros":            ["#002D62", "#EB6E1F"],
  "kansas-city-royals":        ["#004687", "#C09A5B"],
  "los-angeles-angels":        ["#003263", "#BA0021"],
  "los-angeles-dodgers":       ["#005A9C", "#EF3E42"],
  "miami-marlins":             ["#00A3E0", "#EF3340"],
  "milwaukee-brewers":         ["#0A2351", "#B6922E"],
  "minnesota-twins":           ["#002B5C", "#D31145"],
  "new-york-mets":             ["#002D72", "#FF5910"],
  "new-york-yankees":          ["#132448", "#C4CED3"],
  "oakland-athletics":         ["#003831", "#EFB21E"],
  "philadelphia-phillies":     ["#E81828", "#002D72"],
  "pittsburgh-pirates":        ["#27251F", "#FDB827"],
  "san-diego-padres":          ["#2F241D", "#FFC425"],
  "san-francisco-giants":      ["#FD5A1E", "#27251F"],
  "seattle-mariners":          ["#0C2C56", "#005C5C"],
  "st-louis-cardinals":        ["#C41E3A", "#0C2340"],
  "tampa-bay-rays":            ["#092C5C", "#8FBCE6"],
  "texas-rangers":             ["#003278", "#C0111F"],
  "toronto-blue-jays":         ["#134A8E", "#1D2D5C"],
  "washington-nationals":      ["#AB0003", "#14225A"],
  // MLS – key teams
  "atlanta-united":            ["#80000A", "#221F1F"],
  "austin-fc":                 ["#00B140", "#000000"],
  "charlotte-fc":              ["#1A85C8", "#1D1D1B"],
  "chicago-fire":              ["#9A2243", "#FF0000"],
  "fc-cincinnati":             ["#003087", "#FE5000"],
  "fc-dallas":                 ["#000080", "#BF0D3E"],
  "colorado-rapids":           ["#960A2C", "#000000"],
  "columbus-crew":             ["#FDD20E", "#000000"],
  "dc-united":                 ["#231F20", "#BD0034"],
  "houston-dynamo":            ["#F4911E", "#101820"],
  "inter-miami-cf":            ["#F7B5CD", "#231F20"],
  "la-galaxy":                 ["#00245D", "#FFD100"],
  "los-angeles-fc":            ["#C39E6D", "#000000"],
  "minnesota-united":          ["#8CD2F4", "#231F20"],
  "cf-montreal":               ["#003DA5", "#C41E3A"],
  "nashville-sc":              ["#EAE82E", "#16224F"],
  "new-england-revolution":    ["#CE0F2D", "#003087"],
  "new-york-city-fc":          ["#6CACE4", "#041E42"],
  "new-york-red-bulls":        ["#ED1940", "#23356D"],
  "orlando-city":              ["#633492", "#FFC724"],
  "philadelphia-union":        ["#071B2C", "#B19B69"],
  "portland-timbers":          ["#004812", "#EBE72B"],
  "real-salt-lake":            ["#B30838", "#013474"],
  "san-diego-fc":              ["#0033A0", "#FF2D2D"],
  "san-jose-earthquakes":      ["#0D4C8B", "#C8102E"],
  "seattle-sounders":          ["#005695", "#5D9741"],
  "sporting-kansas-city":      ["#002B5C", "#91B0C4"],
  "st-louis-city-sc":          ["#C8102E", "#002B5C"],
  "toronto-fc":                ["#B81137", "#313F48"],
  "vancouver-whitecaps":       ["#00245D", "#009BDA"],
  // NHL – core
  "new-york-rangers":          ["#0038A8", "#CE1126"],
  "boston-bruins":             ["#FFB81C", "#000000"],
  "tampa-bay-lightning":       ["#002868", "#FFFFFF"],
  "colorado-avalanche":        ["#6F263D", "#236192"],
  "edmonton-oilers":           ["#041E42", "#FF4C00"],
  "vegas-golden-knights":      ["#B4975A", "#333F42"],
  // EPL – core
  "liverpool":                 ["#C8102E", "#00B2A9"],
  "manchester-city":           ["#6CABDD", "#1C2C5B"],
  "arsenal":                   ["#EF0107", "#063672"],
  "manchester-united":         ["#DA291C", "#FBE122"],
  "chelsea":                   ["#034694", "#DBA111"],
  "tottenham":                 ["#132257", "#FFFFFF"],
};

export function teamColor(id: string): [string, string] {
  return TEAM_COLORS[id] ?? [C.accent, C.accentBlue];
}

// ─── NBA: Houston Rockets ─────────────────────────────────────────────────────
const rocketRoster: Player[] = [
  { id: "kevin-durant", name: "Kevin Durant", number: "7", position: "SF", age: 36, height: "6'10\"", weight: "240 lbs", college: "Texas", birthdate: "Sep 29, 1988", group: "Forwards/Centers", stats: { PPG: 23.6, RPG: 6.4, APG: 4.1, FG: "52.1%", PTS: 23.6, AST: 4.1, REB: 6.4, BLK: 1.1, STL: 0.8, MIN: 34.2 }, bio: "NBA champion and 2x Finals MVP, Kevin Durant joined the Rockets in 2025 looking to anchor a young core around Amen Thompson and Alperen Şengün." },
  { id: "jalen-green", name: "Jalen Green", number: "4", position: "SG", age: 23, height: "6'4\"", weight: "185 lbs", college: "G League Ignite", birthdate: "Feb 9, 2002", group: "Guards", stats: { PPG: 22.1, RPG: 3.9, APG: 4.2, FG: "44.8%", PTS: 22.1, AST: 4.2, REB: 3.9, STL: 1.0, MIN: 32.8 } },
  { id: "amen-thompson", name: "Amen Thompson", number: "1", position: "SG/SF", age: 22, height: "6'7\"", weight: "215 lbs", college: "Overtime Elite", birthdate: "Jan 8, 2003", group: "Guards", stats: { PPG: 17.9, RPG: 7.8, APG: 4.5, FG: "49.2%", PTS: 17.9, AST: 4.5, REB: 7.8, STL: 1.7, MIN: 30.4 } },
  { id: "alperen-sengun", name: "Alperen Şengün", number: "28", position: "C", age: 22, height: "6'9\"", weight: "240 lbs", college: "Bursa Uludağ (Turkey)", birthdate: "Jul 25, 2002", group: "Bigs", stats: { PPG: 19.3, RPG: 8.7, APG: 5.2, FG: "56.1%", PTS: 19.3, AST: 5.2, REB: 8.7, BLK: 1.3, MIN: 30.1 } },
  { id: "fred-vanvleet", name: "Fred VanVleet", number: "5", position: "PG", age: 30, height: "6'1\"", weight: "197 lbs", college: "Wichita State", birthdate: "Feb 22, 1994", group: "Guards", stats: { PPG: 13.8, RPG: 3.4, APG: 6.9, FG: "40.2%", PTS: 13.8, AST: 6.9, REB: 3.4, STL: 1.2, MIN: 29.5 } },
  { id: "tari-eason", name: "Tari Eason", number: "17", position: "SF/PF", age: 23, height: "6'8\"", weight: "220 lbs", college: "LSU", birthdate: "Jan 12, 2002", group: "Forwards/Centers", stats: { PPG: 9.4, RPG: 5.1, APG: 1.3, FG: "50.5%", PTS: 9.4, AST: 1.3, REB: 5.1, STL: 1.5, MIN: 24.8 } },
  { id: "jabari-smith", name: "Jabari Smith Jr.", number: "10", position: "PF", age: 22, height: "6'10\"", weight: "220 lbs", college: "Auburn", birthdate: "May 15, 2003", group: "Forwards/Centers", stats: { PPG: 10.2, RPG: 5.8, APG: 1.9, FG: "44.1%", PTS: 10.2, AST: 1.9, REB: 5.8, BLK: 0.7, MIN: 25.3 } },
  { id: "steven-adams", name: "Steven Adams", number: "12", position: "C", age: 31, height: "6'11\"", weight: "265 lbs", college: "Pittsburgh", birthdate: "Jul 20, 1993", group: "Bigs", stats: { PPG: 6.1, RPG: 9.4, APG: 2.1, FG: "63.2%", PTS: 6.1, AST: 2.1, REB: 9.4, BLK: 0.8, MIN: 21.4 } },
  { id: "dillon-brooks", name: "Dillon Brooks", number: "9", position: "SF", age: 29, height: "6'6\"", weight: "220 lbs", college: "Oregon", birthdate: "Jan 22, 1996", group: "Forwards/Centers", stats: { PPG: 11.3, RPG: 3.2, APG: 1.8, FG: "43.1%", PTS: 11.3, AST: 1.8, REB: 3.2, STL: 1.1, MIN: 24.1 } },
  { id: "cam-whitmore", name: "Cam Whitmore", number: "8", position: "SG/SF", age: 21, height: "6'7\"", weight: "215 lbs", college: "Villanova", birthdate: "Oct 8, 2003", group: "Guards", stats: { PPG: 8.6, RPG: 3.4, APG: 1.0, FG: "46.0%", PTS: 8.6, AST: 1.0, REB: 3.4, MIN: 18.2 } },
];

// ─── NFL: Houston Texans ──────────────────────────────────────────────────────
const texansRoster: Player[] = [
  { id: "cj-stroud", name: "C.J. Stroud", number: "7", position: "QB", age: 23, height: "6'3\"", weight: "218 lbs", college: "Ohio State", birthdate: "Oct 3, 2001", group: "Offense", stats: { YDS: 4108, TD: 28, INT: 9, QBR: 88.9, CMP: "65.2%", RATE: 101.4, YPA: 7.9, YARDS: 4108 }, bio: "2023 NFL Offensive Rookie of the Year. Stroud took the Texans to the playoffs in his first two seasons, showcasing elite pocket presence and deep ball accuracy." },
  { id: "stefon-diggs", name: "Stefon Diggs", number: "14", position: "WR", age: 31, height: "6'0\"", weight: "191 lbs", college: "Maryland", birthdate: "Nov 29, 1993", group: "Offense", stats: { REC: 78, YDS: 1024, TD: 8, YPR: "13.1" } },
  { id: "nico-collins", name: "Nico Collins", number: "12", position: "WR", age: 25, height: "6'4\"", weight: "215 lbs", college: "Michigan", birthdate: "Jan 26, 2000", group: "Offense", stats: { REC: 91, YDS: 1297, TD: 9, YPR: "14.2" } },
  { id: "dalton-schultz", name: "Dalton Schultz", number: "86", position: "TE", age: 28, height: "6'5\"", weight: "242 lbs", college: "Stanford", birthdate: "Nov 28, 1996", group: "Offense", stats: { REC: 52, YDS: 561, TD: 5, YPR: "10.8" } },
  { id: "joe-mixon", name: "Joe Mixon", number: "28", position: "RB", age: 28, height: "6'1\"", weight: "228 lbs", college: "Oklahoma", birthdate: "Jul 24, 1996", group: "Offense", stats: { CAR: 201, RUSH_YDS: 872, RUSH_TD: 8, YPC: "4.3" } },
  { id: "will-anderson", name: "Will Anderson Jr.", number: "51", position: "EDGE", age: 22, height: "6'4\"", weight: "243 lbs", college: "Alabama", birthdate: "Feb 4, 2002", group: "Defense", stats: { SACKS: 14.5, TFL: 18, PD: 4, FF: 2 } },
  { id: "demarvin-leal", name: "DeMarvion Overshown", number: "42", position: "LB", age: 26, height: "6'4\"", weight: "226 lbs", college: "Texas", birthdate: "Aug 3, 1999", group: "Defense", stats: { TKL: 74, SACKS: 2, TFL: 7, PD: 3 } },
  { id: "derek-stingley", name: "Derek Stingley Jr.", number: "24", position: "CB", age: 23, height: "6'0\"", weight: "195 lbs", college: "LSU", birthdate: "Apr 6, 2001", group: "Defense", stats: { TKL: 46, INT: 3, PD: 11, FF: 1 } },
  { id: "jalen-pitre", name: "Jalen Pitre", number: "5", position: "S", age: 25, height: "5'11\"", weight: "198 lbs", college: "Baylor", birthdate: "Sep 28, 1999", group: "Defense", stats: { TKL: 89, INT: 2, PD: 8, SACKS: 1 } },
  { id: "ka-imi-fairbairn", name: "Ka'imi Fairbairn", number: "7", position: "K", age: 30, height: "6'0\"", weight: "183 lbs", college: "UCLA", birthdate: "Oct 6, 1994", group: "Special Teams", stats: { FGM: 28, FGA: 32, PCT: "87.5%", LONG: 57 } },
];

// ─── NBA: OKC Thunder ─────────────────────────────────────────────────────────
const thunderRoster: Player[] = [
  { id: "shai-gilgeous-alexander", name: "Shai Gilgeous-Alexander", number: "2", position: "PG", age: 26, height: "6'6\"", weight: "195 lbs", college: "Kentucky", birthdate: "Jul 12, 1998", group: "Guards", stats: { PPG: 32.1, RPG: 5.4, APG: 6.2, FG: "53.9%", PTS: 32.1, AST: 6.2, REB: 5.4, STL: 2.0, MIN: 33.4 } },
  { id: "jalen-williams", name: "Jalen Williams", number: "8", position: "SG", age: 23, height: "6'6\"", weight: "193 lbs", college: "Santa Clara", birthdate: "Nov 4, 2001", group: "Guards", stats: { PPG: 23.4, RPG: 5.0, APG: 4.8, FG: "49.7%", PTS: 23.4, AST: 4.8, REB: 5.0, STL: 1.4, MIN: 32.1 } },
  { id: "chet-holmgren", name: "Chet Holmgren", number: "7", position: "C/PF", age: 23, height: "7'1\"", weight: "195 lbs", college: "Gonzaga", birthdate: "May 1, 2002", group: "Bigs", stats: { PPG: 17.9, RPG: 8.0, APG: 2.4, FG: "52.6%", PTS: 17.9, AST: 2.4, REB: 8.0, BLK: 2.6, MIN: 30.2 } },
  { id: "luguentz-dort", name: "Luguentz Dort", number: "5", position: "SG", age: 25, height: "6'4\"", weight: "215 lbs", college: "Arizona State", birthdate: "Apr 19, 1999", group: "Guards", stats: { PPG: 12.4, RPG: 3.2, APG: 1.8, FG: "43.1%", PTS: 12.4, AST: 1.8, REB: 3.2, STL: 1.2, MIN: 28.4 } },
  { id: "isaiah-joe", name: "Isaiah Joe", number: "11", position: "SG", age: 24, height: "6'4\"", weight: "161 lbs", college: "Arkansas", birthdate: "Oct 13, 2000", group: "Guards", stats: { PPG: 9.1, RPG: 2.8, APG: 1.4, FG: "42.3%", PTS: 9.1, AST: 1.4, REB: 2.8, MIN: 22.1 } },
  { id: "alex-caruso", name: "Alex Caruso", number: "15", position: "PG/SG", age: 30, height: "6'5\"", weight: "186 lbs", college: "Texas A&M", birthdate: "Feb 28, 1994", group: "Guards", stats: { PPG: 9.8, RPG: 3.4, APG: 3.9, FG: "44.0%", PTS: 9.8, AST: 3.9, REB: 3.4, STL: 1.8, MIN: 24.8 } },
];

// ─── NBA: Boston Celtics ──────────────────────────────────────────────────────
const celticsRoster: Player[] = [
  { id: "jayson-tatum", name: "Jayson Tatum", number: "0", position: "SF/PF", age: 26, height: "6'8\"", weight: "210 lbs", college: "Duke", birthdate: "Mar 3, 1998", group: "Forwards/Centers", stats: { PPG: 27.1, RPG: 8.9, APG: 4.8, FG: "47.3%", PTS: 27.1, AST: 4.8, REB: 8.9, STL: 1.0, MIN: 35.9 } },
  { id: "jaylen-brown", name: "Jaylen Brown", number: "7", position: "SG/SF", age: 28, height: "6'6\"", weight: "220 lbs", college: "California", birthdate: "Oct 24, 1996", group: "Guards", stats: { PPG: 23.8, RPG: 5.5, APG: 3.9, FG: "48.2%", PTS: 23.8, AST: 3.9, REB: 5.5, STL: 1.1, MIN: 33.2 } },
  { id: "kristaps-porzingis", name: "Kristaps Porzingis", number: "8", position: "C/PF", age: 30, height: "7'3\"", weight: "240 lbs", college: "—", birthdate: "Aug 2, 1995", group: "Bigs", stats: { PPG: 18.8, RPG: 6.8, APG: 1.4, FG: "51.4%", PTS: 18.8, AST: 1.4, REB: 6.8, BLK: 1.9, MIN: 28.8 } },
  { id: "jrue-holiday", name: "Jrue Holiday", number: "4", position: "PG/SG", age: 35, height: "6'4\"", weight: "205 lbs", college: "UCLA", birthdate: "Jun 12, 1990", group: "Guards", stats: { PPG: 12.8, RPG: 4.9, APG: 5.1, FG: "46.1%", PTS: 12.8, AST: 5.1, REB: 4.9, STL: 1.5, MIN: 30.2 } },
  { id: "al-horford", name: "Al Horford", number: "42", position: "C/PF", age: 38, height: "6'9\"", weight: "240 lbs", college: "Florida", birthdate: "Jun 3, 1986", group: "Bigs", stats: { PPG: 9.4, RPG: 6.2, APG: 3.2, FG: "50.1%", PTS: 9.4, AST: 3.2, REB: 6.2, BLK: 1.0, MIN: 24.1 } },
];

// ─── NBA: Detroit Pistons ─────────────────────────────────────────────────────
const pistonsRoster: Player[] = [
  { id: "cade-cunningham", name: "Cade Cunningham", number: "2", position: "PG", age: 23, height: "6'6\"", weight: "220 lbs", college: "Oklahoma State", birthdate: "Sep 25, 2001", group: "Guards", stats: { PPG: 28.9, RPG: 6.0, APG: 9.4, FG: "46.8%", PTS: 28.9, AST: 9.4, REB: 6.0, STL: 1.3, MIN: 35.4 } },
  { id: "jaden-ivey", name: "Jaden Ivey", number: "23", position: "SG", age: 22, height: "6'4\"", weight: "195 lbs", college: "Purdue", birthdate: "Feb 26, 2002", group: "Guards", stats: { PPG: 16.4, RPG: 4.0, APG: 4.9, FG: "43.8%", PTS: 16.4, AST: 4.9, REB: 4.0, STL: 1.0, MIN: 28.2 } },
  { id: "isaiah-stewart", name: "Isaiah Stewart", number: "28", position: "C/PF", age: 24, height: "6'9\"", weight: "250 lbs", college: "Washington", birthdate: "May 22, 2001", group: "Bigs", stats: { PPG: 11.8, RPG: 9.3, APG: 2.1, FG: "55.2%", PTS: 11.8, AST: 2.1, REB: 9.3, BLK: 0.9, MIN: 28.9 } },
  { id: "ausar-thompson", name: "Ausar Thompson", number: "5", position: "SF", age: 22, height: "6'7\"", weight: "212 lbs", college: "Overtime Elite", birthdate: "Jan 8, 2003", group: "Forwards/Centers", stats: { PPG: 14.2, RPG: 6.8, APG: 2.4, FG: "52.1%", PTS: 14.2, AST: 2.4, REB: 6.8, STL: 1.6, MIN: 27.4 } },
  { id: "james-wiseman", name: "James Wiseman", number: "13", position: "C", age: 24, height: "7'1\"", weight: "247 lbs", college: "Memphis", birthdate: "Mar 31, 2001", group: "Bigs", stats: { PPG: 10.4, RPG: 7.2, APG: 0.8, FG: "59.4%", PTS: 10.4, AST: 0.8, REB: 7.2, BLK: 1.4, MIN: 22.8 } },
];

// ─── NFL: Kansas City Chiefs ──────────────────────────────────────────────────
const chiefsRoster: Player[] = [
  { id: "patrick-mahomes", name: "Patrick Mahomes", number: "15", position: "QB", age: 30, height: "6'2\"", weight: "230 lbs", college: "Texas Tech", birthdate: "Sep 17, 1995", group: "Offense", stats: { YDS: 4847, TD: 39, INT: 8, QBR: 104.1, CMP: "67.4%", RATE: 108.2, YPA: 8.4 } },
  { id: "travis-kelce", name: "Travis Kelce", number: "87", position: "TE", age: 35, height: "6'5\"", weight: "250 lbs", college: "Cincinnati", birthdate: "Oct 5, 1989", group: "Offense", stats: { REC: 93, YDS: 1054, TD: 7, YPR: "11.3" } },
  { id: "rashee-rice", name: "Rashee Rice", number: "4", position: "WR", age: 24, height: "6'1\"", weight: "200 lbs", college: "SMU", birthdate: "Mar 16, 2001", group: "Offense", stats: { REC: 79, YDS: 1049, TD: 8, YPR: "13.3" } },
  { id: "kenneth-walker", name: "Kenneth Walker III", number: "28", position: "RB", age: 25, height: "5'10\"", weight: "211 lbs", college: "Michigan State", birthdate: "May 16, 1999", group: "Offense", stats: { CAR: 227, RUSH_YDS: 1069, RUSH_TD: 10, YPC: "4.7" } },
  { id: "chris-jones", name: "Chris Jones", number: "95", position: "DT", age: 30, height: "6'5\"", weight: "298 lbs", college: "Mississippi State", birthdate: "Jul 3, 1994", group: "Defense", stats: { SACKS: 11.0, TFL: 15, QB_HITS: 28, FF: 2 } },
  { id: "trent-mcduffie", name: "Trent McDuffie", number: "22", position: "CB", age: 24, height: "5'11\"", weight: "195 lbs", college: "Washington", birthdate: "Nov 2, 2000", group: "Defense", stats: { TKL: 52, INT: 4, PD: 14, FF: 1 } },
];

// ─── MLB: Houston Astros ──────────────────────────────────────────────────────
const astrosRoster: Player[] = [
  { id: "yordan-alvarez", name: "Yordan Alvarez", number: "44", position: "DH/LF", age: 28, height: "6'5\"", weight: "225 lbs", college: "—", birthdate: "Jun 27, 1997", group: "Hitting", stats: { AVG: ".291", HR: 39, RBI: 109, OPS: ".985", OBP: ".381", SLG: ".604", R: 88 }, bio: "The most feared left-handed hitter in baseball. Alvarez is a perennial MVP candidate with elite power and plate discipline." },
  { id: "jose-altuve", name: "José Altuve", number: "27", position: "2B", age: 34, height: "5'6\"", weight: "165 lbs", college: "—", birthdate: "May 6, 1990", group: "Hitting", stats: { AVG: ".281", HR: 18, RBI: 64, OPS: ".828", OBP: ".351", SLG: ".477", R: 79 } },
  { id: "alex-bregman", name: "Alex Bregman", number: "2", position: "3B", age: 31, height: "6'0\"", weight: "180 lbs", college: "LSU", birthdate: "Mar 30, 1994", group: "Hitting", stats: { AVG: ".268", HR: 24, RBI: 87, OPS: ".862", OBP: ".364", SLG: ".498", R: 84 } },
  { id: "framber-valdez", name: "Framber Valdez", number: "59", position: "SP", age: 31, height: "5'11\"", weight: "239 lbs", college: "—", birthdate: "Nov 19, 1993", group: "Pitching", stats: { ERA: 2.81, W: 17, L: 7, SO: 198, IP: "201.1", WHIP: 1.09 } },
  { id: "ronel-blanco", name: "Ronel Blanco", number: "56", position: "SP", age: 30, height: "6'2\"", weight: "235 lbs", college: "—", birthdate: "Aug 31, 1993", group: "Pitching", stats: { ERA: 3.10, W: 14, L: 9, SO: 167, IP: "171.0", WHIP: 1.14 } },
  { id: "jeremy-pena", name: "Jeremy Peña", number: "3", position: "SS", age: 27, height: "6'0\"", weight: "202 lbs", college: "Maine", birthdate: "Sep 22, 1997", group: "Hitting", stats: { AVG: ".256", HR: 17, RBI: 71, OPS: ".764", OBP: ".316", SLG: ".448", R: 69 } },
  { id: "ryan-pressly", name: "Ryan Pressly", number: "55", position: "RP", age: 36, height: "6'3\"", weight: "215 lbs", college: "—", birthdate: "Dec 15, 1988", group: "Bullpen", stats: { ERA: 2.99, SV: 28, SO: 68, IP: "51.1", WHIP: 1.07 } },
  { id: "kyle-tucker", name: "Kyle Tucker", number: "30", position: "RF", age: 27, height: "6'4\"", weight: "199 lbs", college: "—", birthdate: "Jan 17, 1997", group: "Hitting", stats: { AVG: ".276", HR: 29, RBI: 96, OPS: ".890", OBP: ".358", SLG: ".532", R: 92 } },
];

// ─── MLS: Houston Dynamo ──────────────────────────────────────────────────────
const dynamoRoster: Player[] = [
  { id: "brooklyn-idem", name: "Brooklyn Idem", number: "30", position: "GK", age: 27, height: "6'5\"", weight: "185 lbs", college: "—", group: "Goalkeepers", stats: { GA: 8, SV: 29, SVP: "78.4%", CS: 3 } },
  { id: "adalberto-carrasquilla", name: "Adalberto Carrasquilla", number: "6", position: "CM", age: 25, height: "5'9\"", weight: "148 lbs", college: "—", group: "Midfielders", stats: { G: 3, A: 7, SH: 31, KEY_PASS: 42 } },
  { id: "ezequiel-ponce", name: "Ezequiel Ponce", number: "11", position: "FW", age: 27, height: "6'1\"", weight: "176 lbs", college: "—", group: "Forwards", stats: { G: 7, A: 3, SH: 48, DRBB: 22 } },
];

// ─── NFL: Buffalo Bills ───────────────────────────────────────────────────────
const billsRoster: Player[] = [
  { id: "josh-allen", name: "Josh Allen", number: "17", position: "QB", age: 28, height: "6'5\"", weight: "237 lbs", college: "Wyoming", birthdate: "May 21, 1996", group: "Offense", stats: { YDS: 4544, TD: 36, INT: 10, QBR: 99.8, CMP: "64.1%", RATE: 102.8, YPA: 8.1, RUSH_YDS: 684, RUSH_TD: 9 } },
  { id: "stefon-diggs-buf", name: "Stefon Diggs", number: "14", position: "WR", age: 31, height: "6'0\"", weight: "191 lbs", college: "Maryland", birthdate: "Nov 29, 1993", group: "Offense", stats: { REC: 68, YDS: 882, TD: 7, YPR: "13.0" } },
  { id: "dalton-kincaid", name: "Dalton Kincaid", number: "86", position: "TE", age: 25, height: "6'4\"", weight: "243 lbs", college: "Utah", birthdate: "Jan 20, 2000", group: "Offense", stats: { REC: 64, YDS: 684, TD: 5, YPR: "10.7" } },
  { id: "von-miller", name: "Von Miller", number: "40", position: "EDGE", age: 35, height: "6'3\"", weight: "250 lbs", college: "Texas A&M", birthdate: "Mar 26, 1989", group: "Defense", stats: { SACKS: 8.5, TFL: 12, FF: 3, QB_HITS: 19 } },
  { id: "taron-johnson", name: "Taron Johnson", number: "24", position: "CB", age: 28, height: "5'11\"", weight: "192 lbs", college: "Weber State", birthdate: "Jun 4, 1996", group: "Defense", stats: { TKL: 61, INT: 2, PD: 9, FF: 1 } },
];

// ─── NBA: LA Lakers ───────────────────────────────────────────────────────────
const lakersRoster: Player[] = [
  { id: "luka-doncic", name: "Luka Dončić", number: "77", position: "PG/SG", age: 25, height: "6'7\"", weight: "230 lbs", college: "—", birthdate: "Feb 28, 1999", group: "Guards", stats: { PPG: 29.8, RPG: 8.9, APG: 9.2, FG: "48.4%", PTS: 29.8, AST: 9.2, REB: 8.9, STL: 1.3, MIN: 37.1 } },
  { id: "lebron-james", name: "LeBron James", number: "23", position: "SF/PF", age: 40, height: "6'9\"", weight: "250 lbs", college: "—", birthdate: "Dec 30, 1984", group: "Forwards/Centers", stats: { PPG: 24.3, RPG: 7.6, APG: 8.8, FG: "53.2%", PTS: 24.3, AST: 8.8, REB: 7.6, STL: 1.0, MIN: 34.8 } },
  { id: "anthony-davis", name: "Anthony Davis", number: "3", position: "C/PF", age: 32, height: "6'10\"", weight: "253 lbs", college: "Kentucky", birthdate: "Mar 11, 1993", group: "Bigs", stats: { PPG: 24.1, RPG: 12.3, APG: 3.4, FG: "55.8%", PTS: 24.1, AST: 3.4, REB: 12.3, BLK: 2.3, MIN: 35.2 } },
  { id: "austin-reaves", name: "Austin Reaves", number: "15", position: "SG", age: 27, height: "6'5\"", weight: "206 lbs", college: "Oklahoma", birthdate: "May 29, 1998", group: "Guards", stats: { PPG: 18.4, RPG: 4.2, APG: 5.8, FG: "46.2%", PTS: 18.4, AST: 5.8, REB: 4.2, STL: 1.1, MIN: 31.4 } },
  { id: "rui-hachimura", name: "Rui Hachimura", number: "28", position: "SF/PF", age: 27, height: "6'8\"", weight: "230 lbs", college: "Gonzaga", birthdate: "Feb 8, 1998", group: "Forwards/Centers", stats: { PPG: 13.9, RPG: 4.8, APG: 1.4, FG: "50.2%", PTS: 13.9, AST: 1.4, REB: 4.8, MIN: 26.4 } },
];

// ─── MLB: New York Yankees ────────────────────────────────────────────────────
const yankeesRoster: Player[] = [
  { id: "aaron-judge", name: "Aaron Judge", number: "99", position: "RF", age: 33, height: "6'7\"", weight: "282 lbs", college: "Fresno State", birthdate: "Apr 26, 1992", group: "Hitting", stats: { AVG: ".295", HR: 48, RBI: 124, OPS: "1.028", OBP: ".412", SLG: ".616", R: 107 }, bio: "The reigning AL MVP and Yankee captain. Judge is widely regarded as the best hitter in baseball." },
  { id: "juan-soto", name: "Juan Soto", number: "22", position: "LF", age: 26, height: "6'2\"", weight: "224 lbs", college: "—", birthdate: "Oct 25, 1998", group: "Hitting", stats: { AVG: ".288", HR: 34, RBI: 99, OPS: ".972", OBP: ".413", SLG: ".559", R: 101 } },
  { id: "gerrit-cole", name: "Gerrit Cole", number: "45", position: "SP", age: 34, height: "6'4\"", weight: "220 lbs", college: "UCLA", birthdate: "Sep 8, 1990", group: "Pitching", stats: { ERA: "—", W: 0, L: 0, SO: 0, IP: "TJS Recovery", WHIP: "—" } },
  { id: "giancarlo-stanton", name: "Giancarlo Stanton", number: "27", position: "DH", age: 35, height: "6'6\"", weight: "245 lbs", college: "—", birthdate: "Nov 8, 1989", group: "Hitting", stats: { AVG: ".248", HR: 31, RBI: 87, OPS: ".876", OBP: ".333", SLG: ".543", R: 72 } },
  { id: "clay-holmes", name: "Clay Holmes", number: "35", position: "RP/CL", age: 31, height: "6'5\"", weight: "245 lbs", college: "—", birthdate: "Mar 27, 1993", group: "Bullpen", stats: { ERA: 3.14, SV: 32, SO: 72, IP: "57.1", WHIP: 1.15 } },
];

// ─── NFL: Philadelphia Eagles ─────────────────────────────────────────────────
const eaglesRoster: Player[] = [
  { id: "jalen-hurts", name: "Jalen Hurts", number: "1", position: "QB", age: 26, height: "6'1\"", weight: "223 lbs", college: "Oklahoma", birthdate: "Aug 7, 1998", group: "Offense", stats: { YDS: 3988, TD: 31, INT: 7, QBR: 101.4, CMP: "67.1%", RATE: 109.4, RUSH_YDS: 712, RUSH_TD: 14 } },
  { id: "aj-brown", name: "A.J. Brown", number: "11", position: "WR", age: 27, height: "6'1\"", weight: "226 lbs", college: "Ole Miss", birthdate: "Jun 30, 1997", group: "Offense", stats: { REC: 88, YDS: 1337, TD: 11, YPR: "15.2" } },
  { id: "devonta-smith", name: "DeVonta Smith", number: "6", position: "WR", age: 28, height: "6'0\"", weight: "170 lbs", college: "Alabama", birthdate: "Nov 14, 1992", group: "Offense", stats: { REC: 82, YDS: 1092, TD: 8, YPR: "13.3" } },
  { id: "saquon-barkley", name: "Saquon Barkley", number: "26", position: "RB", age: 28, height: "5'11\"", weight: "232 lbs", college: "Penn State", birthdate: "Feb 9, 1997", group: "Offense", stats: { CAR: 239, RUSH_YDS: 1289, RUSH_TD: 12, YPC: "5.4" } },
  { id: "haason-reddick", name: "Haason Reddick", number: "7", position: "EDGE", age: 30, height: "6'1\"", weight: "237 lbs", college: "Temple", birthdate: "Sep 22, 1994", group: "Defense", stats: { SACKS: 12.5, TFL: 14, FF: 3, QB_HITS: 22 } },
];

// ─── NBA: Denver Nuggets ──────────────────────────────────────────────────────
const nuggetsRoster: Player[] = [
  { id: "nikola-jokic", name: "Nikola Jokić", number: "15", position: "C", age: 30, height: "6'11\"", weight: "284 lbs", college: "—", birthdate: "Feb 19, 1995", group: "Bigs", stats: { PPG: 26.8, RPG: 12.4, APG: 9.0, FG: "57.8%", PTS: 26.8, AST: 9.0, REB: 12.4, STL: 1.4, MIN: 33.7 } },
  { id: "jamal-murray", name: "Jamal Murray", number: "27", position: "PG", age: 28, height: "6'4\"", weight: "215 lbs", college: "Kentucky", birthdate: "Feb 23, 1997", group: "Guards", stats: { PPG: 22.4, RPG: 4.2, APG: 6.8, FG: "47.1%", PTS: 22.4, AST: 6.8, REB: 4.2, STL: 1.0, MIN: 32.4 } },
  { id: "michael-porter-jr", name: "Michael Porter Jr.", number: "1", position: "SF", age: 27, height: "6'10\"", weight: "210 lbs", college: "Missouri", birthdate: "Jun 29, 1998", group: "Forwards/Centers", stats: { PPG: 18.4, RPG: 6.8, APG: 1.8, FG: "51.8%", PTS: 18.4, AST: 1.8, REB: 6.8, MIN: 29.8 } },
  { id: "aaron-gordon", name: "Aaron Gordon", number: "50", position: "PF", age: 29, height: "6'8\"", weight: "235 lbs", college: "Arizona", birthdate: "Sep 16, 1995", group: "Forwards/Centers", stats: { PPG: 14.1, RPG: 6.8, APG: 3.3, FG: "54.2%", PTS: 14.1, AST: 3.3, REB: 6.8, BLK: 0.8, MIN: 30.4 } },
];

// ─── Registry ─────────────────────────────────────────────────────────────────
const [rangersC1, rangersC2] = teamColor("new-york-rangers");
const [liverpoolC1, liverpoolC2] = teamColor("liverpool");
const [rocketC1, rocketC2] = teamColor("houston-rockets");
const [texansC1, texansC2] = teamColor("houston-texans");
const [thunderC1, thunderC2] = teamColor("oklahoma-city-thunder");
const [celticsC1, celticsC2] = teamColor("boston-celtics");
const [pistonsC1, pistonsC2] = teamColor("detroit-pistons");
const [chiefsC1, chiefsC2] = teamColor("kansas-city-chiefs");
const [astrosC1, astrosC2] = teamColor("houston-astros");
const [dynamoC1, dynamoC2] = teamColor("houston-dynamo");
const [billsC1, billsC2] = teamColor("buffalo-bills");
const [lakersC1, lakersC2] = teamColor("los-angeles-lakers");
const [yankeesC1, yankeesC2] = teamColor("new-york-yankees");
const [eaglesC1, eaglesC2] = teamColor("philadelphia-eagles");
const [nuggetsC1, nuggetsC2] = teamColor("denver-nuggets");

export const TEAM_REGISTRY: Record<string, TeamData> = {
  "nba-houston-rockets": {
    id: "nba-houston-rockets",
    name: "Houston Rockets",
    shortName: "Rockets",
    abbr: "HOU",
    league: "NBA",
    division: "Southwest Division",
    color: rocketC1, colorSecondary: rocketC2,
    record: "41-27", standing: "5th in West",
    coach: "Ime Udoka",
    stadium: "Toyota Center",
    city: "Houston, TX",
    founded: 1967,
    roster: rocketRoster,
    recentGames: [
      { date: "Mar 18", opponent: "vs Oklahoma City", result: "W", score: "112-104" },
      { date: "Mar 16", opponent: "@ Denver", result: "L", score: "98-108" },
      { date: "Mar 14", opponent: "vs Golden State", result: "W", score: "124-115" },
      { date: "Mar 12", opponent: "@ Memphis", result: "W", score: "118-101" },
      { date: "Mar 10", opponent: "vs Sacramento", result: "L", score: "109-117" },
    ],
    stats: [
      { label: "PPG", value: "117.4", rank: "6th" },
      { label: "OPP PPG", value: "111.8", rank: "8th" },
      { label: "NET RTG", value: "+4.1", rank: "7th" },
      { label: "3P%", value: "36.9%", rank: "14th" },
    ],
  },
  "nhl-new-york-rangers": {
    id: "nhl-new-york-rangers",
    name: "New York Rangers",
    shortName: "Rangers",
    abbr: "NYR",
    league: "NHL",
    division: "Metropolitan",
    color: rangersC1, colorSecondary: rangersC2,
    record: "47-22-7", standing: "2nd in Metro",
    coach: "Peter Laviolette",
    stadium: "Madison Square Garden",
    city: "New York, NY",
    founded: 1926,
    roster: [
      { id: "artemi-panarin", name: "Artemi Panarin", number: "10", position: "LW", age: 33, height: "5'11\"", weight: "170 lbs", college: "—", birthdate: "Oct 30, 1991", group: "Forwards", stats: { G: 38, A: 62, PTS: 100, "+/-": 22, PPG: 14, SOG: 281, "S%": "13.5%" } },
      { id: "mika-zibanejad", name: "Mika Zibanejad", number: "93", position: "C", age: 32, height: "6'2\"", weight: "207 lbs", college: "—", birthdate: "Apr 18, 1993", group: "Forwards", stats: { G: 28, A: 41, PTS: 69, "+/-": 8, PPG: 10, SOG: 224, "S%": "12.5%" } },
      { id: "adam-fox", name: "Adam Fox", number: "23", position: "D", age: 27, height: "5'11\"", weight: "183 lbs", college: "Harvard", birthdate: "Feb 17, 1998", group: "Defensemen", stats: { G: 11, A: 53, PTS: 64, "+/-": 17, PPG: 5, SOG: 146, TOI: "24:18" } },
      { id: "igor-shesterkin", name: "Igor Shesterkin", number: "31", position: "G", age: 29, height: "6'1\"", weight: "187 lbs", college: "—", birthdate: "Dec 30, 1995", group: "Goalies", stats: { W: 33, L: 14, "OT": 4, GAA: 2.41, "SV%": ".921", SO: 5 } },
      { id: "chris-kreider", name: "Chris Kreider", number: "20", position: "LW", age: 33, height: "6'3\"", weight: "226 lbs", college: "Boston College", birthdate: "Apr 30, 1991", group: "Forwards", stats: { G: 35, A: 22, PTS: 57, "+/-": 9, PPG: 18, SOG: 198, "S%": "17.7%" } },
      { id: "jacob-trouba", name: "Jacob Trouba", number: "8", position: "D", age: 31, height: "6'3\"", weight: "209 lbs", college: "Michigan", birthdate: "Feb 26, 1994", group: "Defensemen", stats: { G: 4, A: 18, PTS: 22, "+/-": 6, HITS: 188, BLK: 113, TOI: "21:46" } },
    ],
    recentGames: [
      { date: "Mar 18", opponent: "vs Boston", result: "W", score: "4-2" },
      { date: "Mar 16", opponent: "@ Tampa Bay", result: "W", score: "5-3" },
      { date: "Mar 14", opponent: "vs Philadelphia", result: "L", score: "1-3" },
      { date: "Mar 12", opponent: "@ Pittsburgh", result: "W", score: "3-2 OT" },
      { date: "Mar 10", opponent: "vs Carolina", result: "W", score: "4-1" },
    ],
    stats: [
      { label: "G/G", value: "3.42", rank: "5th" },
      { label: "GAA", value: "2.68", rank: "6th" },
      { label: "PP%", value: "26.1%", rank: "3rd" },
      { label: "PK%", value: "82.4%", rank: "8th" },
    ],
  },
  "epl-liverpool": {
    id: "epl-liverpool",
    name: "Liverpool",
    shortName: "Liverpool",
    abbr: "LIV",
    league: "EPL",
    division: "Premier League",
    color: liverpoolC1, colorSecondary: liverpoolC2,
    record: "23-7-4", standing: "1st in Premier League",
    coach: "Arne Slot",
    stadium: "Anfield",
    city: "Liverpool, England",
    founded: 1892,
    roster: [
      { id: "mohamed-salah", name: "Mohamed Salah", number: "11", position: "FW", age: 33, height: "5'9\"", weight: "157 lbs", college: "—", birthdate: "Jun 15, 1992", group: "Forwards", stats: { G: 24, A: 14, SH: 112, KEY_PASS: 68, MIN: 2780, "xG": 21.8 } },
      { id: "virgil-van-dijk", name: "Virgil van Dijk", number: "4", position: "CB", age: 33, height: "6'4\"", weight: "203 lbs", college: "—", birthdate: "Jul 8, 1991", group: "Defenders", stats: { G: 3, A: 1, BLK: 38, INT: 42, CLR: 124, "Pass%": "91%" } },
      { id: "alisson-becker", name: "Alisson", number: "1", position: "GK", age: 32, height: "6'3\"", weight: "201 lbs", college: "—", birthdate: "Oct 2, 1992", group: "Goalkeepers", stats: { GA: 22, SV: 87, "SV%": "79.8%", CS: 12, MIN: 2880 } },
      { id: "trent-alexander-arnold", name: "Trent Alexander-Arnold", number: "66", position: "RB", age: 26, height: "5'9\"", weight: "152 lbs", college: "—", birthdate: "Oct 7, 1998", group: "Defenders", stats: { G: 3, A: 9, KEY_PASS: 78, CRS: 142, "Pass%": "87%" } },
      { id: "luis-diaz", name: "Luis Díaz", number: "7", position: "LW", age: 28, height: "5'10\"", weight: "143 lbs", college: "—", birthdate: "Jan 13, 1997", group: "Forwards", stats: { G: 11, A: 5, SH: 64, DRBB: 89, KEY_PASS: 42, MIN: 2410 } },
      { id: "ryan-gravenberch", name: "Ryan Gravenberch", number: "38", position: "CM", age: 22, height: "6'3\"", weight: "172 lbs", college: "—", birthdate: "May 16, 2002", group: "Midfielders", stats: { G: 3, A: 6, KEY_PASS: 38, "Pass%": "89%", TKL: 64, INT: 38 } },
    ],
    recentGames: [
      { date: "Mar 16", opponent: "vs Manchester City", result: "W", score: "2-0" },
      { date: "Mar 13", opponent: "@ PSG (UCL)", result: "W", score: "1-0" },
      { date: "Mar 9", opponent: "vs Southampton", result: "W", score: "3-1" },
      { date: "Mar 5", opponent: "vs Newcastle", result: "D", score: "2-2" },
      { date: "Mar 1", opponent: "@ Aston Villa", result: "W", score: "2-1" },
    ],
    stats: [
      { label: "GF", value: "2.45", rank: "1st" },
      { label: "GA", value: "0.94", rank: "1st" },
      { label: "POSS %", value: "61.2%", rank: "2nd" },
      { label: "xG", value: "2.18", rank: "1st" },
    ],
  },
  "nfl-houston-texans": {
    id: "nfl-houston-texans",
    name: "Houston Texans",
    shortName: "Texans",
    abbr: "HOU",
    league: "NFL",
    division: "AFC South",
    color: texansC1, colorSecondary: texansC2,
    record: "11-7", standing: "AFC South Champions",
    coach: "DeMeco Ryans",
    stadium: "NRG Stadium",
    city: "Houston, TX",
    founded: 2002,
    roster: texansRoster,
    recentGames: [
      { date: "Jan 18", opponent: "@ Kansas City", result: "L", score: "20-27" },
      { date: "Jan 11", opponent: "vs Buffalo", result: "W", score: "23-20" },
      { date: "Jan 4", opponent: "vs Cincinnati", result: "W", score: "30-14" },
      { date: "Dec 28", opponent: "@ Tennessee", result: "W", score: "24-17" },
      { date: "Dec 21", opponent: "vs Jacksonville", result: "W", score: "28-10" },
    ],
    stats: [
      { label: "PPG OFF", value: "26.4", rank: "8th" },
      { label: "PPG DEF", value: "20.1", rank: "6th" },
      { label: "PASS YDS", value: "244.8", rank: "11th" },
      { label: "RUSH YDS", value: "138.2", rank: "4th" },
    ],
  },
  "nba-okc-thunder": {
    id: "nba-okc-thunder",
    name: "Oklahoma City Thunder",
    shortName: "Thunder",
    abbr: "OKC",
    league: "NBA",
    division: "Northwest Division",
    color: thunderC1, colorSecondary: thunderC2,
    record: "52-15", standing: "1st in West",
    coach: "Mark Daigneault",
    stadium: "Paycom Center",
    city: "Oklahoma City, OK",
    founded: 1967,
    roster: thunderRoster,
    recentGames: [
      { date: "Mar 18", opponent: "@ Houston", result: "L", score: "104-112" },
      { date: "Mar 16", opponent: "vs Minnesota", result: "W", score: "114-98" },
      { date: "Mar 14", opponent: "@ LA Clippers", result: "W", score: "126-108" },
      { date: "Mar 12", opponent: "vs Utah", result: "W", score: "138-114" },
      { date: "Mar 10", opponent: "@ Memphis", result: "W", score: "121-99" },
    ],
    stats: [
      { label: "PPG", value: "122.8", rank: "2nd" },
      { label: "OPP PPG", value: "107.4", rank: "1st" },
      { label: "NET RTG", value: "+9.8", rank: "1st" },
      { label: "3P%", value: "38.4%", rank: "5th" },
    ],
  },
  "nba-boston-celtics": {
    id: "nba-boston-celtics",
    name: "Boston Celtics",
    shortName: "Celtics",
    abbr: "BOS",
    league: "NBA",
    division: "Atlantic Division",
    color: celticsC1, colorSecondary: celticsC2,
    record: "48-19", standing: "2nd in East",
    coach: "Joe Mazzulla",
    stadium: "TD Garden",
    city: "Boston, MA",
    founded: 1946,
    roster: celticsRoster,
    recentGames: [
      { date: "Mar 18", opponent: "vs Miami", result: "W", score: "121-108" },
      { date: "Mar 16", opponent: "@ Cleveland", result: "L", score: "109-117" },
      { date: "Mar 14", opponent: "vs Brooklyn", result: "W", score: "129-104" },
      { date: "Mar 12", opponent: "@ Philadelphia", result: "W", score: "118-107" },
      { date: "Mar 10", opponent: "vs Chicago", result: "W", score: "124-112" },
    ],
    stats: [
      { label: "PPG", value: "120.1", rank: "4th" },
      { label: "OPP PPG", value: "108.9", rank: "3rd" },
      { label: "NET RTG", value: "+7.4", rank: "3rd" },
      { label: "3P%", value: "39.8%", rank: "2nd" },
    ],
  },
  "nba-detroit-pistons": {
    id: "nba-detroit-pistons",
    name: "Detroit Pistons",
    shortName: "Pistons",
    abbr: "DET",
    league: "NBA",
    division: "Central Division",
    color: pistonsC1, colorSecondary: pistonsC2,
    record: "49-19", standing: "1st in East",
    coach: "J.B. Bickerstaff",
    stadium: "Little Caesars Arena",
    city: "Detroit, MI",
    founded: 1941,
    roster: pistonsRoster,
    recentGames: [
      { date: "Mar 18", opponent: "vs Philadelphia", result: "W", score: "118-102" },
      { date: "Mar 16", opponent: "@ New York", result: "W", score: "114-109" },
      { date: "Mar 14", opponent: "vs Indiana", result: "L", score: "117-122" },
      { date: "Mar 12", opponent: "@ Milwaukee", result: "W", score: "108-104" },
      { date: "Mar 10", opponent: "vs Cleveland", result: "W", score: "121-112" },
    ],
    stats: [
      { label: "PPG", value: "118.8", rank: "5th" },
      { label: "OPP PPG", value: "109.4", rank: "4th" },
      { label: "NET RTG", value: "+8.1", rank: "2nd" },
      { label: "3P%", value: "37.4%", rank: "10th" },
    ],
  },
  "nfl-kansas-city-chiefs": {
    id: "nfl-kansas-city-chiefs",
    name: "Kansas City Chiefs",
    shortName: "Chiefs",
    abbr: "KC",
    league: "NFL",
    division: "AFC West",
    color: chiefsC1, colorSecondary: chiefsC2,
    record: "15-5", standing: "Super Bowl LIX Champions",
    coach: "Andy Reid",
    stadium: "GEHA Field at Arrowhead Stadium",
    city: "Kansas City, MO",
    founded: 1960,
    roster: chiefsRoster,
    recentGames: [
      { date: "Feb 9", opponent: "vs Philadelphia (SB)", result: "W", score: "32-24" },
      { date: "Jan 26", opponent: "vs Buffalo (AFCCG)", result: "W", score: "34-27" },
      { date: "Jan 18", opponent: "vs Houston", result: "W", score: "27-20" },
      { date: "Jan 11", opponent: "vs LA Chargers (Wild Card)", result: "W", score: "31-14" },
      { date: "Jan 4", opponent: "vs Las Vegas", result: "W", score: "28-17" },
    ],
    stats: [
      { label: "PPG OFF", value: "29.8", rank: "1st" },
      { label: "PPG DEF", value: "18.4", rank: "2nd" },
      { label: "PASS YDS", value: "278.4", rank: "3rd" },
      { label: "TO DIFF", value: "+14", rank: "1st" },
    ],
  },
  "mlb-houston-astros": {
    id: "mlb-houston-astros",
    name: "Houston Astros",
    shortName: "Astros",
    abbr: "HOU",
    league: "MLB",
    division: "AL West",
    color: astrosC1, colorSecondary: astrosC2,
    record: "8-7 (ST)", standing: "AL West — Spring Training",
    coach: "Joe Espada",
    stadium: "Minute Maid Park",
    city: "Houston, TX",
    founded: 1962,
    roster: astrosRoster,
    recentGames: [
      { date: "Mar 18", opponent: "vs St. Louis (ST)", result: "W", score: "7-4" },
      { date: "Mar 16", opponent: "@ Chicago WS (ST)", result: "W", score: "9-3" },
      { date: "Mar 14", opponent: "vs Detroit (ST)", result: "L", score: "3-5" },
      { date: "Mar 12", opponent: "@ Miami (ST)", result: "W", score: "6-2" },
      { date: "Mar 10", opponent: "vs New York Mets (ST)", result: "L", score: "4-8" },
    ],
    stats: [
      { label: "TEAM AVG", value: ".274", rank: "3rd (ST)" },
      { label: "TEAM ERA", value: "3.42", rank: "5th (ST)" },
      { label: "HR/G", value: "1.4", rank: "8th (ST)" },
      { label: "K/9", value: "9.4", rank: "6th (ST)" },
    ],
  },
  "mls-houston-dynamo": {
    id: "mls-houston-dynamo",
    name: "Houston Dynamo",
    shortName: "Dynamo",
    abbr: "HOU",
    league: "MLS",
    division: "Western Conference",
    color: dynamoC1, colorSecondary: dynamoC2,
    record: "4-2-1", standing: "3rd in West",
    coach: "Ben Olsen",
    stadium: "Shell Energy Stadium",
    city: "Houston, TX",
    founded: 2006,
    roster: dynamoRoster,
    recentGames: [
      { date: "Mar 15", opponent: "vs New England", result: "W", score: "2-1" },
      { date: "Mar 8", opponent: "@ Austin FC", result: "D", score: "1-1" },
      { date: "Mar 1", opponent: "vs LAFC", result: "L", score: "1-3" },
      { date: "Feb 22", opponent: "@ Nashville", result: "W", score: "2-0" },
      { date: "Feb 15", opponent: "vs Portland", result: "W", score: "3-2" },
    ],
    stats: [
      { label: "GOALS", value: "13", rank: "4th in West" },
      { label: "GA", value: "8", rank: "3rd in West" },
      { label: "SHOTS/GM", value: "13.4", rank: "6th" },
      { label: "POSS%", value: "51.2%", rank: "9th" },
    ],
  },
  "nfl-buffalo-bills": {
    id: "nfl-buffalo-bills",
    name: "Buffalo Bills",
    shortName: "Bills",
    abbr: "BUF",
    league: "NFL",
    division: "AFC East",
    color: billsC1, colorSecondary: billsC2,
    record: "14-6", standing: "AFC East Champions",
    coach: "Sean McDermott",
    stadium: "Highmark Stadium",
    city: "Orchard Park, NY",
    founded: 1960,
    roster: billsRoster,
    recentGames: [
      { date: "Jan 26", opponent: "@ Kansas City (AFCCG)", result: "L", score: "27-34" },
      { date: "Jan 18", opponent: "vs Baltimore (Div)", result: "W", score: "31-24" },
      { date: "Jan 11", opponent: "vs Denver (Wild Card)", result: "W", score: "24-17" },
      { date: "Jan 4", opponent: "vs New England", result: "W", score: "35-10" },
      { date: "Dec 28", opponent: "@ NY Jets", result: "W", score: "27-14" },
    ],
    stats: [
      { label: "PPG OFF", value: "28.4", rank: "3rd" },
      { label: "PPG DEF", value: "19.8", rank: "5th" },
      { label: "PASS YDS", value: "294.1", rank: "2nd" },
      { label: "RUSH YDS", value: "128.4", rank: "9th" },
    ],
  },
  "nba-los-angeles-lakers": {
    id: "nba-los-angeles-lakers",
    name: "Los Angeles Lakers",
    shortName: "Lakers",
    abbr: "LAL",
    league: "NBA",
    division: "Pacific Division",
    color: lakersC1, colorSecondary: lakersC2,
    record: "39-29", standing: "3rd in West",
    coach: "JJ Redick",
    stadium: "Crypto.com Arena",
    city: "Los Angeles, CA",
    founded: 1947,
    roster: lakersRoster,
    recentGames: [
      { date: "Mar 18", opponent: "vs Phoenix", result: "W", score: "118-107" },
      { date: "Mar 16", opponent: "@ Golden State", result: "L", score: "108-121" },
      { date: "Mar 14", opponent: "vs Dallas", result: "W", score: "121-114" },
      { date: "Mar 12", opponent: "@ Sacramento", result: "W", score: "119-111" },
      { date: "Mar 10", opponent: "vs Memphis", result: "W", score: "114-98" },
    ],
    stats: [
      { label: "PPG", value: "116.8", rank: "9th" },
      { label: "OPP PPG", value: "113.4", rank: "12th" },
      { label: "NET RTG", value: "+2.4", rank: "9th" },
      { label: "3P%", value: "35.8%", rank: "19th" },
    ],
  },
  "mlb-new-york-yankees": {
    id: "mlb-new-york-yankees",
    name: "New York Yankees",
    shortName: "Yankees",
    abbr: "NYY",
    league: "MLB",
    division: "AL East",
    color: yankeesC1, colorSecondary: yankeesC2,
    record: "9-6 (ST)", standing: "AL East — Spring Training",
    coach: "Aaron Boone",
    stadium: "Yankee Stadium",
    city: "Bronx, NY",
    founded: 1903,
    roster: yankeesRoster,
    recentGames: [
      { date: "Mar 18", opponent: "vs Boston (ST)", result: "W", score: "8-3" },
      { date: "Mar 16", opponent: "@ Philadelphia (ST)", result: "W", score: "5-4" },
      { date: "Mar 14", opponent: "vs Toronto (ST)", result: "L", score: "2-6" },
      { date: "Mar 12", opponent: "@ Baltimore (ST)", result: "W", score: "6-5" },
      { date: "Mar 10", opponent: "vs Tampa Bay (ST)", result: "W", score: "4-1" },
    ],
    stats: [
      { label: "TEAM AVG", value: ".278", rank: "2nd (ST)" },
      { label: "TEAM ERA", value: "3.18", rank: "3rd (ST)" },
      { label: "HR/G", value: "1.7", rank: "4th (ST)" },
      { label: "K/9", value: "9.8", rank: "4th (ST)" },
    ],
  },
  "nfl-philadelphia-eagles": {
    id: "nfl-philadelphia-eagles",
    name: "Philadelphia Eagles",
    shortName: "Eagles",
    abbr: "PHI",
    league: "NFL",
    division: "NFC East",
    color: eaglesC1, colorSecondary: eaglesC2,
    record: "14-5", standing: "NFC East Champions",
    coach: "Nick Sirianni",
    stadium: "Lincoln Financial Field",
    city: "Philadelphia, PA",
    founded: 1933,
    roster: eaglesRoster,
    recentGames: [
      { date: "Feb 9", opponent: "@ Kansas City (SB)", result: "L", score: "24-32" },
      { date: "Jan 26", opponent: "vs Washington (NFCCG)", result: "W", score: "38-24" },
      { date: "Jan 18", opponent: "vs LA Rams (Div)", result: "W", score: "27-21" },
      { date: "Jan 11", opponent: "vs Green Bay (Wild Card)", result: "W", score: "22-14" },
      { date: "Jan 4", opponent: "vs NY Giants", result: "W", score: "34-10" },
    ],
    stats: [
      { label: "PPG OFF", value: "27.8", rank: "5th" },
      { label: "PPG DEF", value: "19.2", rank: "3rd" },
      { label: "RUSH YDS", value: "161.4", rank: "2nd" },
      { label: "SACKS", value: "52", rank: "1st" },
    ],
  },
  "nba-denver-nuggets": {
    id: "nba-denver-nuggets",
    name: "Denver Nuggets",
    shortName: "Nuggets",
    abbr: "DEN",
    league: "NBA",
    division: "Northwest Division",
    color: nuggetsC1, colorSecondary: nuggetsC2,
    record: "41-26", standing: "6th in West",
    coach: "Michael Malone",
    stadium: "Ball Arena",
    city: "Denver, CO",
    founded: 1967,
    roster: nuggetsRoster,
    recentGames: [
      { date: "Mar 18", opponent: "vs Houston", result: "W", score: "108-98" },
      { date: "Mar 16", opponent: "@ Utah", result: "W", score: "124-108" },
      { date: "Mar 14", opponent: "vs Golden State", result: "W", score: "119-112" },
      { date: "Mar 12", opponent: "@ Memphis", result: "L", score: "104-111" },
      { date: "Mar 10", opponent: "vs Portland", result: "W", score: "127-114" },
    ],
    stats: [
      { label: "PPG", value: "119.2", rank: "7th" },
      { label: "OPP PPG", value: "114.1", rank: "14th" },
      { label: "NET RTG", value: "+3.8", rank: "8th" },
      { label: "3P%", value: "37.2%", rank: "12th" },
    ],
  },
};

// ─── Quick lookup by team name ────────────────────────────────────────────────
export const TEAM_NAME_TO_ID: Record<string, string> = {
  "Houston Rockets": "nba-houston-rockets",
  "Oklahoma City Thunder": "nba-okc-thunder",
  "Boston Celtics": "nba-boston-celtics",
  "Detroit Pistons": "nba-detroit-pistons",
  "Los Angeles Lakers": "nba-los-angeles-lakers",
  "Denver Nuggets": "nba-denver-nuggets",
  "Kansas City Chiefs": "nfl-kansas-city-chiefs",
  "Buffalo Bills": "nfl-buffalo-bills",
  "Houston Texans": "nfl-houston-texans",
  "Philadelphia Eagles": "nfl-philadelphia-eagles",
  "Houston Astros": "mlb-houston-astros",
  "New York Yankees": "mlb-new-york-yankees",
  "Houston Dynamo": "mls-houston-dynamo",
};

// ─── Player lookup ────────────────────────────────────────────────────────────
export const PLAYER_TEAM_MAP: Record<string, string> = {
  "kevin-durant": "nba-houston-rockets",
  "jalen-green": "nba-houston-rockets",
  "amen-thompson": "nba-houston-rockets",
  "alperen-sengun": "nba-houston-rockets",
  "fred-vanvleet": "nba-houston-rockets",
  "tari-eason": "nba-houston-rockets",
  "jabari-smith": "nba-houston-rockets",
  "dillon-brooks": "nba-houston-rockets",
  "cam-whitmore": "nba-houston-rockets",
  "steven-adams": "nba-houston-rockets",
  "shai-gilgeous-alexander": "nba-okc-thunder",
  "jalen-williams": "nba-okc-thunder",
  "chet-holmgren": "nba-okc-thunder",
  "luguentz-dort": "nba-okc-thunder",
  "alex-caruso": "nba-okc-thunder",
  "jayson-tatum": "nba-boston-celtics",
  "jaylen-brown": "nba-boston-celtics",
  "kristaps-porzingis": "nba-boston-celtics",
  "jrue-holiday": "nba-boston-celtics",
  "al-horford": "nba-boston-celtics",
  "cade-cunningham": "nba-detroit-pistons",
  "jaden-ivey": "nba-detroit-pistons",
  "isaiah-stewart": "nba-detroit-pistons",
  "ausar-thompson": "nba-detroit-pistons",
  "luka-doncic": "nba-los-angeles-lakers",
  "lebron-james": "nba-los-angeles-lakers",
  "anthony-davis": "nba-los-angeles-lakers",
  "austin-reaves": "nba-los-angeles-lakers",
  "nikola-jokic": "nba-denver-nuggets",
  "jamal-murray": "nba-denver-nuggets",
  "michael-porter-jr": "nba-denver-nuggets",
  "aaron-gordon": "nba-denver-nuggets",
  "cj-stroud": "nfl-houston-texans",
  "will-anderson": "nfl-houston-texans",
  "derek-stingley": "nfl-houston-texans",
  "nico-collins": "nfl-houston-texans",
  "joe-mixon": "nfl-houston-texans",
  "patrick-mahomes": "nfl-kansas-city-chiefs",
  "travis-kelce": "nfl-kansas-city-chiefs",
  "rashee-rice": "nfl-kansas-city-chiefs",
  "kenneth-walker": "nfl-kansas-city-chiefs",
  "josh-allen": "nfl-buffalo-bills",
  "von-miller": "nfl-buffalo-bills",
  "jalen-hurts": "nfl-philadelphia-eagles",
  "aj-brown": "nfl-philadelphia-eagles",
  "saquon-barkley": "nfl-philadelphia-eagles",
  "yordan-alvarez": "mlb-houston-astros",
  "jose-altuve": "mlb-houston-astros",
  "framber-valdez": "mlb-houston-astros",
  "kyle-tucker": "mlb-houston-astros",
  "aaron-judge": "mlb-new-york-yankees",
  "juan-soto": "mlb-new-york-yankees",
  "gerrit-cole": "mlb-new-york-yankees",
  "artemi-panarin": "nhl-new-york-rangers",
  "mika-zibanejad": "nhl-new-york-rangers",
  "adam-fox": "nhl-new-york-rangers",
  "igor-shesterkin": "nhl-new-york-rangers",
  "chris-kreider": "nhl-new-york-rangers",
  "jacob-trouba": "nhl-new-york-rangers",
  "mohamed-salah": "epl-liverpool",
  "virgil-van-dijk": "epl-liverpool",
  "alisson-becker": "epl-liverpool",
  "trent-alexander-arnold": "epl-liverpool",
  "luis-diaz": "epl-liverpool",
  "ryan-gravenberch": "epl-liverpool",
};

export function getTeamById(id: string): TeamData | null {
  return TEAM_REGISTRY[id] ?? null;
}

export function getTeamByName(name: string): TeamData | null {
  const id = TEAM_NAME_TO_ID[name];
  return id ? TEAM_REGISTRY[id] ?? null : null;
}

export function getPlayerById(playerId: string): { player: Player; team: TeamData } | null {
  const teamId = PLAYER_TEAM_MAP[playerId];
  if (!teamId) return null;
  const team = TEAM_REGISTRY[teamId];
  if (!team) return null;
  const player = team.roster.find(p => p.id === playerId);
  if (!player) return null;
  return { player, team };
}
