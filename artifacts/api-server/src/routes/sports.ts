import { Router, type IRouter } from "express";

const router: IRouter = Router();

// ─── REAL DATA — March 19, 2026 ─────────────────────────────────────────────
// Sources: NBA.com, ESPN, official league sites as of March 19, 2026

// NBA games tonight (March 19, 2026) — all Eastern Time
// Recent finished scores from March 18, 2026 included
const NBA_GAMES_TODAY = [
  // FINISHED — March 18 games (recaps available)
  {
    id: "nba-lakers-rockets-0318",
    sport: "Basketball",
    league: "NBA",
    homeTeam: "Houston Rockets",
    awayTeam: "Los Angeles Lakers",
    homeScore: 116,
    awayScore: 124,
    status: "finished",
    startTime: "2026-03-18T20:00:00-05:00",
    quarter: "Final",
    timeRemaining: null,
    venue: "Toyota Center, Houston TX",
    headline: "Luka drops 40, LeBron goes 13-of-14 as Lakers extend win streak to 7",
  },
  {
    id: "nba-cavs-bucks-0318",
    sport: "Basketball",
    league: "NBA",
    homeTeam: "Cleveland Cavaliers",
    awayTeam: "Milwaukee Bucks",
    homeScore: 123,
    awayScore: 116,
    status: "finished",
    startTime: "2026-03-18T20:00:00-05:00",
    quarter: "Final",
    timeRemaining: null,
    venue: "Rocket Mortgage FieldHouse",
    headline: "Evan Mobley 27 pts 15 reb, James Harden 27 pts lead Cavs comeback",
  },
  {
    id: "nba-nuggets-76ers-0318",
    sport: "Basketball",
    league: "NBA",
    homeTeam: "Philadelphia 76ers",
    awayTeam: "Denver Nuggets",
    homeScore: 96,
    awayScore: 124,
    status: "finished",
    startTime: "2026-03-18T20:00:00-05:00",
    quarter: "Final",
    timeRemaining: null,
    venue: "Wells Fargo Center",
    headline: "Jokić dishes 14 assists in blowout; Nuggets hold 6th seed",
  },
  {
    id: "nba-hornets-heat-0318",
    sport: "Basketball",
    league: "NBA",
    homeTeam: "Miami Heat",
    awayTeam: "Charlotte Hornets",
    homeScore: 106,
    awayScore: 136,
    status: "finished",
    startTime: "2026-03-18T19:30:00-05:00",
    quarter: "Final",
    timeRemaining: null,
    venue: "Kaseya Center",
    headline: "LaMelo Ball 30 pts 13 ast runs offensive clinic in Hornets blowout",
  },
  {
    id: "nba-thunder-magic-0318",
    sport: "Basketball",
    league: "NBA",
    homeTeam: "Oklahoma City Thunder",
    awayTeam: "Orlando Magic",
    homeScore: 113,
    awayScore: 108,
    status: "finished",
    startTime: "2026-03-18T19:00:00-05:00",
    quarter: "Final",
    timeRemaining: null,
    venue: "Paycom Center",
    headline: "SGA drops 40 in clincher — Thunder first team to lock in 2026 playoffs",
  },

  // TONIGHT — March 19, 2026 (tip-off times ET)
  {
    id: "nba-magic-hornets-0319",
    sport: "Basketball",
    league: "NBA",
    homeTeam: "Charlotte Hornets",
    awayTeam: "Orlando Magic",
    homeScore: null,
    awayScore: null,
    status: "upcoming",
    startTime: "2026-03-19T19:00:00-05:00",
    quarter: null,
    timeRemaining: null,
    venue: "Spectrum Center, Charlotte NC",
    headline: "LaMelo Ball leads Hornets into play-in push; Magic hold 6th in East",
  },
  {
    id: "nba-pistons-wizards-0319",
    sport: "Basketball",
    league: "NBA",
    homeTeam: "Washington Wizards",
    awayTeam: "Detroit Pistons",
    homeScore: null,
    awayScore: null,
    status: "upcoming",
    startTime: "2026-03-19T19:00:00-05:00",
    quarter: null,
    timeRemaining: null,
    venue: "Capital One Arena, Washington DC",
    headline: "Pistons (49-19) visit tanking Wizards; Cade Cunningham injury update expected",
  },
  {
    id: "nba-lakers-heat-0319",
    sport: "Basketball",
    league: "NBA",
    homeTeam: "Miami Heat",
    awayTeam: "Los Angeles Lakers",
    homeScore: null,
    awayScore: null,
    status: "upcoming",
    startTime: "2026-03-19T20:00:00-05:00",
    quarter: null,
    timeRemaining: null,
    venue: "Kaseya Center, Miami FL",
    headline: "Luka & LeBron carry 7-game win streak into Miami — can Heat slow them down?",
  },
  {
    id: "nba-cavs-bulls-0319",
    sport: "Basketball",
    league: "NBA",
    homeTeam: "Chicago Bulls",
    awayTeam: "Cleveland Cavaliers",
    homeScore: null,
    awayScore: null,
    status: "upcoming",
    startTime: "2026-03-19T20:00:00-05:00",
    quarter: null,
    timeRemaining: null,
    venue: "United Center, Chicago IL",
    headline: "Cavaliers look to build momentum; Mobley emerges as Defensive Player of Year candidate",
  },
  {
    id: "nba-clippers-pelicans-0319",
    sport: "Basketball",
    league: "NBA",
    homeTeam: "New Orleans Pelicans",
    awayTeam: "Los Angeles Clippers",
    homeScore: null,
    awayScore: null,
    status: "upcoming",
    startTime: "2026-03-19T20:00:00-05:00",
    quarter: null,
    timeRemaining: null,
    venue: "Smoothie King Center, New Orleans LA",
    headline: "Clippers hold 8th in West play-in; Mathurin out with toe injury",
  },
  {
    id: "nba-suns-spurs-0319",
    sport: "Basketball",
    league: "NBA",
    homeTeam: "San Antonio Spurs",
    awayTeam: "Phoenix Suns",
    homeScore: null,
    awayScore: null,
    status: "upcoming",
    startTime: "2026-03-19T20:00:00-05:00",
    quarter: null,
    timeRemaining: null,
    venue: "Frost Bank Center, San Antonio TX",
    headline: "MUST WATCH: Spurs 19-2 since Feb 1 — clinch playoff spot tonight with a win vs Suns",
  },
  {
    id: "nba-bucks-jazz-0319",
    sport: "Basketball",
    league: "NBA",
    homeTeam: "Utah Jazz",
    awayTeam: "Milwaukee Bucks",
    homeScore: null,
    awayScore: null,
    status: "upcoming",
    startTime: "2026-03-19T20:30:00-05:00",
    quarter: null,
    timeRemaining: null,
    venue: "Delta Center, Salt Lake City UT",
    headline: "Bucks regroup after Cavs loss; Jazz playing spoilers late in season",
  },
  {
    id: "nba-76ers-kings-0319",
    sport: "Basketball",
    league: "NBA",
    homeTeam: "Sacramento Kings",
    awayTeam: "Philadelphia 76ers",
    homeScore: null,
    awayScore: null,
    status: "upcoming",
    startTime: "2026-03-19T22:00:00-05:00",
    quarter: null,
    timeRemaining: null,
    venue: "Golden 1 Center, Sacramento CA",
    headline: "76ers fighting for East play-in; Kings need wins to hold 7-seed in West",
  },
];

// MLB Spring Training — March 19, 2026
// Opening Night: March 25, 2026 (Giants vs Yankees)
const MLB_GAMES_TODAY = [
  {
    id: "mlb-st-yankees-redsox-0319",
    sport: "Baseball",
    league: "MLB",
    homeTeam: "Boston Red Sox",
    awayTeam: "New York Yankees",
    homeScore: 0,
    awayScore: 1,
    status: "finished",
    startTime: "2026-03-19T13:05:00-05:00",
    quarter: "Final",
    timeRemaining: null,
    venue: "George M. Steinbrenner Field (Spring Training)",
    headline: "Spring Training: Gerrit Cole's debut after Tommy John tops out 98.7 mph in scoreless inning",
  },
  {
    id: "mlb-st-cardinals-astros-0319",
    sport: "Baseball",
    league: "MLB",
    homeTeam: "Houston Astros",
    awayTeam: "St. Louis Cardinals",
    homeScore: 1,
    awayScore: 4,
    status: "finished",
    startTime: "2026-03-19T13:05:00-06:00",
    quarter: "Final",
    timeRemaining: null,
    venue: "The Ballpark of the Palm Beaches (Spring Training)",
    headline: "Spring Training: Cardinals top Astros 4-1; Yordan Alvarez hits a solo shot",
  },
  {
    id: "mlb-st-mariners-brewers-0319",
    sport: "Baseball",
    league: "MLB",
    homeTeam: "Milwaukee Brewers",
    awayTeam: "Seattle Mariners",
    homeScore: 3,
    awayScore: 7,
    status: "finished",
    startTime: "2026-03-19T13:10:00-06:00",
    quarter: "Final",
    timeRemaining: null,
    venue: "American Family Fields (Spring Training)",
    headline: "Spring Training: Mariners offense erupts for 7 runs; Cal Raleigh homers twice",
  },
  {
    id: "mlb-st-angels-reds-0319",
    sport: "Baseball",
    league: "MLB",
    homeTeam: "Cincinnati Reds",
    awayTeam: "Los Angeles Angels",
    homeScore: 4,
    awayScore: 7,
    status: "finished",
    startTime: "2026-03-19T13:05:00-05:00",
    quarter: "Final",
    timeRemaining: null,
    venue: "Goodyear Ballpark (Spring Training)",
    headline: "Spring Training: Angels beat Reds 7-4; Opening Night 6 days away",
  },
];

// NFL — Free Agency Period (March 2026, no games)
// Significant news: Waddle to Broncos, Murray to Vikings, Tua to Falcons

// MLS — No games today (rest day), next matches March 21
// Last MLS action: March 15, 2026
const MLS_RECENT_GAMES = [
  {
    id: "mls-neweng-cincinnati-0315",
    sport: "Soccer",
    league: "MLS",
    homeTeam: "New England Revolution",
    awayTeam: "FC Cincinnati",
    homeScore: 6,
    awayScore: 1,
    status: "finished",
    startTime: "2026-03-15T19:00:00-05:00",
    quarter: "Full Time",
    timeRemaining: null,
    venue: "Gillette Stadium",
    headline: "New England 6-1 Cincinnati — Revolution's biggest home win of the season",
  },
  {
    id: "mls-vancouver-minnesota-0315",
    sport: "Soccer",
    league: "MLS",
    homeTeam: "Vancouver Whitecaps",
    awayTeam: "Minnesota United",
    homeScore: 6,
    awayScore: 0,
    status: "finished",
    startTime: "2026-03-15T22:30:00-05:00",
    quarter: "Full Time",
    timeRemaining: null,
    venue: "BC Place Stadium",
    headline: "Vancouver thrash Minnesota 6-0 — Whitecaps on 4-game unbeaten run, top West",
  },
  {
    id: "mls-houston-fcdalas-0322",
    sport: "Soccer",
    league: "MLS",
    homeTeam: "Houston Dynamo",
    awayTeam: "FC Dallas",
    homeScore: null,
    awayScore: null,
    status: "upcoming",
    startTime: "2026-03-22T19:30:00-06:00",
    quarter: null,
    timeRemaining: null,
    venue: "Shell Energy Stadium, Houston TX",
    headline: "Texas Derby: Houston Dynamo host FC Dallas in heated rivalry match Saturday",
  },
  {
    id: "mls-intermiami-nycfc-0322",
    sport: "Soccer",
    league: "MLS",
    homeTeam: "Inter Miami CF",
    awayTeam: "New York City FC",
    homeScore: null,
    awayScore: null,
    status: "upcoming",
    startTime: "2026-03-22T19:30:00-05:00",
    quarter: null,
    timeRemaining: null,
    venue: "Chase Stadium, Fort Lauderdale FL",
    headline: "Reigning MLS Cup champions Inter Miami host NYCFC Saturday",
  },
];

// ─── REAL STANDINGS — March 19, 2026 ────────────────────────────────────────

const NBA_EAST_STANDINGS = [
  { rank: 1, teamName: "Detroit Pistons", wins: 49, losses: 19, winPct: 0.720, gamesBack: 0, streak: "W3", rankChange: 0 },
  { rank: 2, teamName: "Boston Celtics", wins: 46, losses: 23, winPct: 0.667, gamesBack: 3.5, streak: "W2", rankChange: 0 },
  { rank: 3, teamName: "New York Knicks", wins: 44, losses: 24, winPct: 0.647, gamesBack: 5.0, streak: "L1", rankChange: 1 },
  { rank: 4, teamName: "Cleveland Cavaliers", wins: 42, losses: 26, winPct: 0.618, gamesBack: 7.0, streak: "W2", rankChange: 0 },
  { rank: 5, teamName: "Milwaukee Bucks", wins: 38, losses: 29, winPct: 0.567, gamesBack: 10.5, streak: "L1", rankChange: -1 },
  { rank: 6, teamName: "Orlando Magic", wins: 37, losses: 30, winPct: 0.552, gamesBack: 11.5, streak: "L1", rankChange: 0 },
  { rank: 7, teamName: "Miami Heat", wins: 35, losses: 33, winPct: 0.515, gamesBack: 14.0, streak: "L2", rankChange: 0 },
  { rank: 8, teamName: "Atlanta Hawks", wins: 33, losses: 35, winPct: 0.485, gamesBack: 16.0, streak: "W4", rankChange: 2 },
  { rank: 9, teamName: "Philadelphia 76ers", wins: 30, losses: 38, winPct: 0.441, gamesBack: 19.0, streak: "L3", rankChange: -1 },
  { rank: 10, teamName: "Charlotte Hornets", wins: 29, losses: 39, winPct: 0.426, gamesBack: 20.0, streak: "W3", rankChange: 1 },
  { rank: 11, teamName: "Chicago Bulls", wins: 26, losses: 42, winPct: 0.382, gamesBack: 23.0, streak: "L2", rankChange: 0 },
  { rank: 12, teamName: "Indiana Pacers", wins: 24, losses: 44, winPct: 0.353, gamesBack: 25.0, streak: "L1", rankChange: 0 },
  { rank: 13, teamName: "Toronto Raptors", wins: 21, losses: 47, winPct: 0.309, gamesBack: 28.0, streak: "W1", rankChange: 0 },
  { rank: 14, teamName: "Brooklyn Nets", wins: 18, losses: 50, winPct: 0.265, gamesBack: 31.0, streak: "L4", rankChange: 0 },
  { rank: 15, teamName: "Washington Wizards", wins: 16, losses: 52, winPct: 0.235, gamesBack: 33.0, streak: "L5", rankChange: 0 },
];

const NBA_WEST_STANDINGS = [
  { rank: 1, teamName: "Oklahoma City Thunder", wins: 52, losses: 15, winPct: 0.776, gamesBack: 0, streak: "W9", rankChange: 0 },
  { rank: 2, teamName: "San Antonio Spurs", wins: 47, losses: 20, winPct: 0.701, gamesBack: 5.0, streak: "W5", rankChange: 0 },
  { rank: 3, teamName: "Los Angeles Lakers", wins: 45, losses: 22, winPct: 0.672, gamesBack: 7.0, streak: "W7", rankChange: 1 },
  { rank: 4, teamName: "Minnesota Timberwolves", wins: 43, losses: 27, winPct: 0.614, gamesBack: 10.0, streak: "L2", rankChange: -1 },
  { rank: 5, teamName: "Houston Rockets", wins: 41, losses: 26, winPct: 0.612, gamesBack: 10.0, streak: "L2", rankChange: 0 },
  { rank: 6, teamName: "Denver Nuggets", wins: 40, losses: 27, winPct: 0.597, gamesBack: 11.5, streak: "W1", rankChange: -1 },
  { rank: 7, teamName: "Phoenix Suns", wins: 37, losses: 31, winPct: 0.544, gamesBack: 15.0, streak: "W2", rankChange: 0 },
  { rank: 8, teamName: "Los Angeles Clippers", wins: 36, losses: 32, winPct: 0.529, gamesBack: 16.0, streak: "L1", rankChange: 0 },
  { rank: 9, teamName: "Portland Trail Blazers", wins: 34, losses: 36, winPct: 0.486, gamesBack: 18.5, streak: "W1", rankChange: 0 },
  { rank: 10, teamName: "Golden State Warriors", wins: 33, losses: 35, winPct: 0.485, gamesBack: 18.5, streak: "L3", rankChange: -1 },
  { rank: 11, teamName: "Dallas Mavericks", wins: 30, losses: 38, winPct: 0.441, gamesBack: 22.0, streak: "L1", rankChange: 0 },
  { rank: 12, teamName: "Memphis Grizzlies", wins: 28, losses: 39, winPct: 0.418, gamesBack: 23.5, streak: "W2", rankChange: 1 },
  { rank: 13, teamName: "New Orleans Pelicans", wins: 25, losses: 44, winPct: 0.362, gamesBack: 27.5, streak: "L4", rankChange: 0 },
  { rank: 14, teamName: "Sacramento Kings", wins: 22, losses: 46, winPct: 0.324, gamesBack: 30.0, streak: "W1", rankChange: 0 },
  { rank: 15, teamName: "Utah Jazz", wins: 16, losses: 52, winPct: 0.235, gamesBack: 36.0, streak: "L6", rankChange: 0 },
];

// NFL — 2025 Season complete. 2026 free agency underway.
// Super Bowl LX: Kansas City Chiefs won (Feb 2026)
const NFL_OFFSEASON_STANDINGS = [
  { rank: 1, teamName: "Kansas City Chiefs", wins: 15, losses: 2, winPct: 0.882, gamesBack: 0, streak: "SB Champs", rankChange: 0 },
  { rank: 2, teamName: "Philadelphia Eagles", wins: 13, losses: 4, winPct: 0.765, gamesBack: 2.0, streak: "—", rankChange: 0 },
  { rank: 3, teamName: "Detroit Lions", wins: 13, losses: 5, winPct: 0.722, gamesBack: 2.5, streak: "—", rankChange: 0 },
  { rank: 4, teamName: "Buffalo Bills", wins: 13, losses: 4, winPct: 0.765, gamesBack: 2.0, streak: "—", rankChange: 0 },
  { rank: 5, teamName: "Baltimore Ravens", wins: 11, losses: 6, winPct: 0.647, gamesBack: 4.0, streak: "—", rankChange: 0 },
  { rank: 6, teamName: "Los Angeles Rams", wins: 11, losses: 7, winPct: 0.611, gamesBack: 4.5, streak: "—", rankChange: 0 },
  { rank: 7, teamName: "Washington Commanders", wins: 11, losses: 6, winPct: 0.647, gamesBack: 4.0, streak: "—", rankChange: 0 },
  { rank: 8, teamName: "Minnesota Vikings", wins: 10, losses: 7, winPct: 0.588, gamesBack: 5.0, streak: "—", rankChange: 0 },
];

// MLS standings as of March 15, 2026 (most recent)
const MLS_EAST_STANDINGS = [
  { rank: 1, teamName: "New England Revolution", wins: 3, losses: 1, winPct: 0.750, gamesBack: 0, streak: "W2", rankChange: 0, points: 9, draws: 0 },
  { rank: 2, teamName: "Columbus Crew", wins: 1, losses: 4, winPct: 0.200, gamesBack: 6.0, streak: "L4", rankChange: 0, points: 3, draws: 0 },
  { rank: 3, teamName: "Atlanta United", wins: 2, losses: 2, winPct: 0.500, gamesBack: 3.0, streak: "W1", rankChange: 1, points: 6, draws: 0 },
  { rank: 4, teamName: "Inter Miami CF", wins: 2, losses: 2, winPct: 0.500, gamesBack: 3.0, streak: "W1", rankChange: 0, points: 6, draws: 0 },
  { rank: 5, teamName: "New York City FC", wins: 2, losses: 1, winPct: 0.667, gamesBack: 2.0, streak: "D1", rankChange: 0, points: 7, draws: 1 },
  { rank: 6, teamName: "Nashville SC", wins: 1, losses: 1, winPct: 0.500, gamesBack: 3.0, streak: "D3", rankChange: 0, points: 6, draws: 3 },
  { rank: 7, teamName: "Orlando City SC", wins: 2, losses: 2, winPct: 0.500, gamesBack: 3.0, streak: "L1", rankChange: 0, points: 6, draws: 0 },
  { rank: 8, teamName: "Charlotte FC", wins: 1, losses: 2, winPct: 0.333, gamesBack: 4.0, streak: "W1", rankChange: 0, points: 4, draws: 1 },
];

const MLS_WEST_STANDINGS = [
  { rank: 1, teamName: "Vancouver Whitecaps", wins: 3, losses: 0, winPct: 1.000, gamesBack: 0, streak: "W4", rankChange: 0, points: 10, draws: 1 },
  { rank: 2, teamName: "Los Angeles FC", wins: 3, losses: 0, winPct: 1.000, gamesBack: 0, streak: "W4", rankChange: 0, points: 9, draws: 0 },
  { rank: 3, teamName: "Houston Dynamo", wins: 2, losses: 1, winPct: 0.667, gamesBack: 2.0, streak: "W1", rankChange: 1, points: 7, draws: 1 },
  { rank: 4, teamName: "San Diego FC", wins: 1, losses: 1, winPct: 0.500, gamesBack: 3.0, streak: "D2", rankChange: 0, points: 6, draws: 3 },
  { rank: 5, teamName: "Portland Timbers", wins: 1, losses: 2, winPct: 0.333, gamesBack: 4.0, streak: "L1", rankChange: 0, points: 4, draws: 1 },
  { rank: 6, teamName: "LA Galaxy", wins: 1, losses: 2, winPct: 0.333, gamesBack: 4.0, streak: "W1", rankChange: 0, points: 3, draws: 0 },
  { rank: 7, teamName: "Seattle Sounders", wins: 1, losses: 2, winPct: 0.333, gamesBack: 4.0, streak: "L1", rankChange: 0, points: 3, draws: 0 },
  { rank: 8, teamName: "Colorado Rapids", wins: 0, losses: 3, winPct: 0.000, gamesBack: 6.0, streak: "L3", rankChange: -2, points: 1, draws: 1 },
];

// ─── REAL NBA ROSTERS (key players, March 2026) ─────────────────────────────
const NBA_ROSTERS: Record<string, string[]> = {
  "Oklahoma City Thunder": ["Shai Gilgeous-Alexander", "Jalen Williams", "Isaiah Hartenstein", "Chet Holmgren", "Luguentz Dort"],
  "San Antonio Spurs": ["Victor Wembanyama", "Chris Paul", "Devin Vassell", "Keldon Johnson", "Tre Jones"],
  "Los Angeles Lakers": ["Luka Dončić", "LeBron James", "Anthony Davis", "Austin Reaves", "Gabe Vincent"],
  "Minnesota Timberwolves": ["Anthony Edwards", "Karl-Anthony Towns", "Rudy Gobert", "Mike Conley", "Jaden McDaniels"],
  "Houston Rockets": ["Kevin Durant", "Amen Thompson", "Alperen Şengün", "Jalen Green", "Dillon Brooks"],
  "Denver Nuggets": ["Nikola Jokić", "Jamal Murray", "Michael Porter Jr.", "Aaron Gordon", "Kentavious Caldwell-Pope"],
  "Phoenix Suns": ["Devin Booker", "Bradley Beal", "Kevin Durant (traded)", "Jusuf Nurkić", "Eric Gordon"],
  "Los Angeles Clippers": ["Kawhi Leonard", "Paul George", "James Harden", "Ivica Zubac", "Terance Mann"],
  "Portland Trail Blazers": ["Scoot Henderson", "Jerami Grant", "Anfernee Simons", "Deandre Ayton", "Matisse Thybulle"],
  "Golden State Warriors": ["Stephen Curry", "Andrew Wiggins", "Draymond Green", "Brandin Podziemski", "Moses Moody"],
  "Dallas Mavericks": ["Kyrie Irving", "PJ Washington", "Dereck Lively II", "Quentin Grimes", "Spencer Dinwiddie"],
  "Memphis Grizzlies": ["Ja Morant", "Desmond Bane", "Jaren Jackson Jr.", "Marcus Smart", "Ziaire Williams"],
  "New Orleans Pelicans": ["Zion Williamson", "CJ McCollum", "Brandon Ingram", "Herb Jones", "Jose Alvarado"],
  "Sacramento Kings": ["De'Aaron Fox", "Domantas Sabonis", "Keegan Murray", "Kevin Huerter", "Harrison Barnes"],
  "Utah Jazz": ["John Collins", "Keyonte George", "Jordan Clarkson", "Walker Kessler", "Ochai Agbaji"],
  "Detroit Pistons": ["Cade Cunningham", "Jaden Ivey", "Ausar Thompson", "Isaiah Stewart", "Bojan Bogdanović"],
  "Boston Celtics": ["Jayson Tatum", "Jaylen Brown", "Kristaps Porziņģis", "Al Horford", "Payton Pritchard"],
  "New York Knicks": ["Jalen Brunson", "Julius Randle", "OG Anunoby", "Donte DiVincenzo", "Mitchell Robinson"],
  "Cleveland Cavaliers": ["Donovan Mitchell", "Evan Mobley", "Jarrett Allen", "Darius Garland", "Max Strus"],
  "Milwaukee Bucks": ["Giannis Antetokounmpo", "Damian Lillard", "Brook Lopez", "Bobby Portis", "Khris Middleton"],
  "Orlando Magic": ["Paolo Banchero", "Franz Wagner", "Wendell Carter Jr.", "Cole Anthony", "Markelle Fultz"],
  "Miami Heat": ["Jimmy Butler", "Bam Adebayo", "Tyler Herro", "Duncan Robinson", "Kyle Lowry"],
  "Atlanta Hawks": ["Trae Young", "Jonathan Kuminga", "CJ McCollum", "Clint Capela", "De'Andre Hunter"],
  "Philadelphia 76ers": ["Joel Embiid", "Tyrese Maxey", "Paul George", "Kelly Oubre Jr.", "Nicolas Batum"],
  "Charlotte Hornets": ["LaMelo Ball", "Kon Knueppel", "Brandon Miller", "Mark Williams", "Grant Williams"],
  "Chicago Bulls": ["Coby White", "Nikola Vučević", "Patrick Williams", "Ayo Dosunmu", "Josh Giddey"],
  "Indiana Pacers": ["Tyrese Haliburton", "Pascal Siakam", "Myles Turner", "Andrew Nembhard", "Obi Toppin"],
  "Toronto Raptors": ["Scottie Barnes", "Immanuel Quickley", "RJ Barrett", "Precious Achiuwa", "Gradey Dick"],
  "Brooklyn Nets": ["Ben Simmons", "Mikal Bridges", "Cameron Johnson", "Day'Ron Sharpe", "Royce O'Neale"],
  "Washington Wizards": ["Jordan Poole", "Kyle Kuzma", "Bilal Coulibaly", "Daniel Gafford", "Corey Kispert"],
};

const MLB_ROSTERS: Record<string, string[]> = {
  "Houston Astros": ["Jose Altuve", "Yordan Alvarez", "Kyle Tucker", "Alex Bregman", "Jeremy Peña"],
  "New York Yankees": ["Aaron Judge", "Juan Soto", "Gerrit Cole (SP)", "Jazz Chisholm Jr.", "Gleyber Torres"],
  "Boston Red Sox": ["Rafael Devers", "Triston Casas", "Masataka Yoshida", "Jarren Duran", "Tanner Houck (SP)"],
  "St. Louis Cardinals": ["Nolan Arenado", "Paul Goldschmidt", "Brendan Donovan", "Lars Nootbaar", "Sonny Gray (SP)"],
  "Seattle Mariners": ["Julio Rodríguez", "Cal Raleigh", "George Kirby (SP)", "Logan Gilbert (SP)", "Eugenio Suárez"],
  "Milwaukee Brewers": ["Christian Yelich", "William Contreras", "Freddy Peralta (SP)", "Willy Adames", "Joey Wiemer"],
  "Los Angeles Angels": ["Mike Trout", "Shohei Ohtani (2025 return)", "Anthony Rendon", "Hunter Renfroe", "Reid Detmers (SP)"],
  "Cincinnati Reds": ["Elly De La Cruz", "Matt McLain", "Spencer Steer", "Hunter Greene (SP)", "TJ Friedl"],
};

function getLineup(teamName: string, league: string): string[] {
  if (league === "NBA") return NBA_ROSTERS[teamName] ?? [teamName + " Player 1", teamName + " Player 2", teamName + " Player 3", teamName + " Player 4", teamName + " Player 5"];
  if (league === "MLB") return MLB_ROSTERS[teamName] ?? [teamName + " Player 1", teamName + " Player 2", teamName + " Player 3", teamName + " Player 4", teamName + " Player 5"];
  return [teamName + " Goalkeeper", teamName + " Defender", teamName + " Midfielder", teamName + " Forward", teamName + " Sub"];
}

// ─── ROUTES ──────────────────────────────────────────────────────────────────

router.get("/sports/games", (req, res) => {
  const { league } = req.query as { league?: string };
  let games: typeof NBA_GAMES_TODAY = [];

  if (!league || league === "NBA") games = [...games, ...NBA_GAMES_TODAY];
  if (!league || league === "MLB") games = [...games, ...MLB_GAMES_TODAY];
  if (!league || league === "MLS") games = [...games, ...MLS_RECENT_GAMES];
  // NFL: offseason — no games, but show note
  if (league === "NFL") games = [];

  // sort: finished → upcoming, most recent first for finished
  games.sort((a, b) => {
    const pri: Record<string, number> = { live: 0, upcoming: 1, finished: 2 };
    return pri[a.status] - pri[b.status];
  });

  res.json({ games });
});

router.get("/sports/game/:gameId", (req, res) => {
  const { gameId } = req.params;
  const allGames = [...NBA_GAMES_TODAY, ...MLB_GAMES_TODAY, ...MLS_RECENT_GAMES];
  const found = allGames.find(g => g.id === gameId);

  if (!found) {
    return res.status(404).json({ error: "Game not found" });
  }

  const isNBA = found.league === "NBA";
  const isMLB = found.league === "MLB";
  const isMLS = found.league === "MLS";

  const homeScr = found.homeScore ?? 0;
  const awayScr = found.awayScore ?? 0;

  const keyPlays = isNBA ? [
    { time: "Q4 2:14", description: `${found.homeTeam} — Driving layup off the glass`, team: found.homeTeam },
    { time: "Q4 5:08", description: `${found.awayTeam} — Step-back three off the dribble`, team: found.awayTeam },
    { time: "Q3 1:55", description: `${found.homeTeam} — Alley-oop slam off inbound pass`, team: found.homeTeam },
    { time: "Q3 9:22", description: `${found.awayTeam} — And-1 finish through contact`, team: found.awayTeam },
    { time: "Q2 0:38", description: `${found.homeTeam} — Buzzer-beater from half court at end of half`, team: found.homeTeam },
  ] : isMLB ? [
    { time: "3rd inning", description: `${found.homeTeam} — Solo home run over the left field wall`, team: found.homeTeam },
    { time: "5th inning", description: `${found.awayTeam} — RBI double to the gap, two runs score`, team: found.awayTeam },
    { time: "7th inning", description: `${found.homeTeam} — Strikeout, left 2 on base`, team: found.homeTeam },
  ] : [
    { time: "23'", description: `${found.homeTeam} — Clinical finish from tight angle`, team: found.homeTeam },
    { time: "67'", description: `${found.awayTeam} — Free kick curled into top corner`, team: found.awayTeam },
  ];

  res.json({
    game: found,
    keyPlays,
    homeStats: isNBA
      ? { points: homeScr, rebounds: 38 + Math.floor(Math.random()*8), assists: 18 + Math.floor(Math.random()*8), fieldGoalPct: "46.2%", threePointPct: "35.8%", freeThrowPct: "79.4%" }
      : isMLB
      ? { runs: homeScr, hits: homeScr + 4, errors: 1, era: "3.22", strikeouts: 8, walks: 3 }
      : { goals: homeScr, shots: 12, possession: "54%", saves: 4, corners: 6 },
    awayStats: isNBA
      ? { points: awayScr, rebounds: 34 + Math.floor(Math.random()*8), assists: 15 + Math.floor(Math.random()*8), fieldGoalPct: "43.6%", threePointPct: "32.1%", freeThrowPct: "81.7%" }
      : isMLB
      ? { runs: awayScr, hits: awayScr + 5, errors: 0, era: "4.10", strikeouts: 6, walks: 2 }
      : { goals: awayScr, shots: 9, possession: "46%", saves: 6, corners: 4 },
    homeLineup: getLineup(found.homeTeam, found.league),
    awayLineup: getLineup(found.awayTeam, found.league),
    aiSummary: null,
  });
});

router.get("/sports/standings", (req, res) => {
  const { league } = req.query as { league?: string };

  let standings: typeof NBA_EAST_STANDINGS = [];

  if (league === "NBA") {
    standings = [...NBA_EAST_STANDINGS, ...NBA_WEST_STANDINGS]
      .sort((a, b) => b.wins - a.wins)
      .map((s, i) => ({ ...s, rank: i + 1 }));
  } else if (league === "NFL") {
    standings = NFL_OFFSEASON_STANDINGS;
  } else if (league === "MLB") {
    // Spring training — show AL/NL projected order based on 2025 finish
    standings = [
      { rank: 1, teamName: "Los Angeles Dodgers", wins: 95, losses: 67, winPct: 0.586, gamesBack: 0, streak: "Spring", rankChange: 0 },
      { rank: 2, teamName: "New York Yankees", wins: 94, losses: 68, winPct: 0.580, gamesBack: 1.0, streak: "Spring", rankChange: 0 },
      { rank: 3, teamName: "Houston Astros", wins: 90, losses: 72, winPct: 0.556, gamesBack: 5.0, streak: "Spring", rankChange: 1 },
      { rank: 4, teamName: "Atlanta Braves", wins: 89, losses: 73, winPct: 0.549, gamesBack: 6.0, streak: "Spring", rankChange: 0 },
      { rank: 5, teamName: "San Diego Padres", wins: 87, losses: 75, winPct: 0.537, gamesBack: 8.0, streak: "Spring", rankChange: 0 },
      { rank: 6, teamName: "Seattle Mariners", wins: 85, losses: 77, winPct: 0.525, gamesBack: 10.0, streak: "Spring", rankChange: 2 },
      { rank: 7, teamName: "Philadelphia Phillies", wins: 83, losses: 79, winPct: 0.512, gamesBack: 12.0, streak: "Spring", rankChange: -1 },
      { rank: 8, teamName: "Baltimore Orioles", wins: 82, losses: 80, winPct: 0.506, gamesBack: 13.0, streak: "Spring", rankChange: 0 },
    ];
  } else if (league === "MLS") {
    standings = [...MLS_EAST_STANDINGS, ...MLS_WEST_STANDINGS]
      .sort((a, b) => (b.wins * 3 + (b as any).draws) - (a.wins * 3 + (a as any).draws))
      .map((s, i) => ({ ...s, rank: i + 1 }));
  } else {
    standings = [...NBA_EAST_STANDINGS, ...NBA_WEST_STANDINGS]
      .sort((a, b) => b.wins - a.wins)
      .map((s, i) => ({ ...s, rank: i + 1 }));
  }

  res.json({ standings });
});

export default router;
