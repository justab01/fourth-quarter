import { Router, type IRouter } from "express";

const router: IRouter = Router();

const NFL_TEAMS = ["Kansas City Chiefs", "Buffalo Bills", "San Francisco 49ers", "Dallas Cowboys", "Philadelphia Eagles", "Baltimore Ravens", "Miami Dolphins", "Detroit Lions"];
const NBA_TEAMS = ["Houston Rockets", "Golden State Warriors", "Los Angeles Lakers", "Boston Celtics", "Miami Heat", "Denver Nuggets", "Phoenix Suns", "Milwaukee Bucks"];
const MLB_TEAMS = ["Houston Astros", "New York Yankees", "Los Angeles Dodgers", "Atlanta Braves", "Texas Rangers", "Boston Red Sox", "Chicago Cubs", "San Diego Padres"];
const MLS_TEAMS = ["LA Galaxy", "Atlanta United", "NYCFC", "Seattle Sounders", "Portland Timbers", "Inter Miami", "Austin FC", "Charlotte FC"];

function randomScore(max: number) { return Math.floor(Math.random() * max); }
function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

function generateGames(league: string, teams: string[], count: number) {
  const statuses = ["upcoming", "live", "finished"] as const;
  const games = [];
  for (let i = 0; i < count; i++) {
    const homeIdx = Math.floor(Math.random() * teams.length);
    let awayIdx = (homeIdx + 1 + Math.floor(Math.random() * (teams.length - 1))) % teams.length;
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const hasScore = status !== "upcoming";
    const sport = league === "NFL" ? "Football" : league === "NBA" ? "Basketball" : league === "MLB" ? "Baseball" : "Soccer";
    games.push({
      id: `${league.toLowerCase()}-${i}-${Date.now()}`,
      sport,
      league,
      homeTeam: teams[homeIdx],
      awayTeam: teams[awayIdx],
      homeScore: hasScore ? randomScore(league === "MLB" ? 12 : league === "NBA" ? 120 : league === "NFL" ? 35 : 5) : null,
      awayScore: hasScore ? randomScore(league === "MLB" ? 12 : league === "NBA" ? 120 : league === "NFL" ? 35 : 5) : null,
      status,
      startTime: new Date(Date.now() + (i - 2) * 3600000).toISOString(),
      quarter: status === "live" ? (league === "NBA" ? `Q${Math.ceil(Math.random() * 4)}` : league === "NFL" ? `Q${Math.ceil(Math.random() * 4)}` : league === "MLB" ? `${Math.ceil(Math.random() * 9)}th` : `${Math.ceil(Math.random() * 2)}H`) : null,
      timeRemaining: status === "live" ? `${Math.floor(Math.random() * 12)}:${String(Math.floor(Math.random() * 60)).padStart(2, "0")}` : null,
      venue: null,
      homeTeamLogo: null,
      awayTeamLogo: null,
    });
  }
  return games;
}

router.get("/sports/games", (req, res) => {
  const { league } = req.query;
  let games: ReturnType<typeof generateGames> = [];

  if (!league || league === "NFL") games = [...games, ...generateGames("NFL", NFL_TEAMS, 4)];
  if (!league || league === "NBA") games = [...games, ...generateGames("NBA", NBA_TEAMS, 4)];
  if (!league || league === "MLB") games = [...games, ...generateGames("MLB", MLB_TEAMS, 3)];
  if (!league || league === "MLS") games = [...games, ...generateGames("MLS", MLS_TEAMS, 3)];

  res.json({ games });
});

router.get("/sports/game/:gameId", (req, res) => {
  const { gameId } = req.params;
  const league = gameId.split("-")[0].toUpperCase();
  const teams = league === "NFL" ? NFL_TEAMS : league === "NBA" ? NBA_TEAMS : league === "MLB" ? MLB_TEAMS : MLS_TEAMS;
  const homeTeam = pick(teams);
  const awayTeam = pick(teams.filter(t => t !== homeTeam));

  res.json({
    game: {
      id: gameId,
      sport: league === "NFL" ? "Football" : "Basketball",
      league,
      homeTeam,
      awayTeam,
      homeScore: 98,
      awayScore: 92,
      status: "live",
      startTime: new Date().toISOString(),
      quarter: "Q4",
      timeRemaining: "3:42",
      venue: "Home Arena",
      homeTeamLogo: null,
      awayTeamLogo: null,
    },
    keyPlays: [
      { time: "Q4 5:30", description: `${homeTeam} - 3PT from deep - ${pick(["Marcus Thompson", "James Williams", "Chris Davis"])}`, team: homeTeam },
      { time: "Q4 7:15", description: `${awayTeam} - Fast break layup - ${pick(["Kyle Anderson", "Robert Lee", "DeShawn Harper"])}`, team: awayTeam },
      { time: "Q3 2:00", description: `${homeTeam} - Free throws (2/2) - ${pick(["Alex Johnson", "Tyler Moore", "Brandon Smith"])}`, team: homeTeam },
      { time: "Q3 4:22", description: `${awayTeam} - Mid-range jumper - ${pick(["Derrick Brown", "Kenny Wilson", "Paul Jackson"])}`, team: awayTeam },
      { time: "Q2 0:45", description: `${homeTeam} - Alley-oop slam dunk!`, team: homeTeam },
    ],
    homeStats: { points: 98, rebounds: 42, assists: 23, fieldGoalPct: "48.2%", threePointPct: "36.4%", freeThrowPct: "78.6%" },
    awayStats: { points: 92, rebounds: 38, assists: 19, fieldGoalPct: "44.7%", threePointPct: "33.1%", freeThrowPct: "82.1%" },
    homeLineup: ["Marcus Thompson", "James Williams", "Chris Davis", "Alex Johnson", "Tyler Moore"],
    awayLineup: ["Kyle Anderson", "Robert Lee", "DeShawn Harper", "Derrick Brown", "Kenny Wilson"],
    aiSummary: null,
  });
});

router.get("/sports/standings", (req, res) => {
  const { league } = req.query as { league: string };
  const teams = league === "NFL" ? NFL_TEAMS : league === "NBA" ? NBA_TEAMS : league === "MLB" ? MLB_TEAMS : MLS_TEAMS;

  const standings = teams.map((teamName, idx) => {
    const wins = 45 - idx * 4 + Math.floor(Math.random() * 5);
    const losses = 37 - (8 - idx) * 3 + Math.floor(Math.random() * 5);
    return {
      rank: idx + 1,
      teamName,
      wins,
      losses,
      winPct: Math.round((wins / (wins + losses)) * 1000) / 1000,
      gamesBack: idx === 0 ? 0 : idx * 1.5,
      streak: `W${Math.ceil(Math.random() * 5)}`,
      conference: idx < 4 ? "East" : "West",
      division: idx < 2 ? "Atlantic" : idx < 4 ? "Central" : idx < 6 ? "Pacific" : "Southwest",
      rankChange: Math.floor(Math.random() * 5) - 2,
    };
  }).sort((a, b) => b.wins - a.wins).map((s, i) => ({ ...s, rank: i + 1 }));

  res.json({ standings });
});

export default router;
