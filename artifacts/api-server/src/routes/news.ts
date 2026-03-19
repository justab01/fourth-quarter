import { Router, type IRouter } from "express";

const router: IRouter = Router();

const MOCK_NEWS = [
  {
    id: "news-1",
    title: "Rockets Dominate Warriors in Overtime Thriller",
    summary: "The Houston Rockets edged out the Golden State Warriors 118-114 in double overtime, with Jalen Green posting a career-high 41 points. The win pushes Houston to 3rd in the Western Conference.",
    content: null,
    source: "ESPN",
    sourceUrl: "https://espn.com",
    imageUrl: null,
    publishedAt: new Date(Date.now() - 3600000).toISOString(),
    tags: ["NBA", "Rockets", "Warriors"],
    teams: ["Houston Rockets", "Golden State Warriors"],
    leagues: ["NBA"],
  },
  {
    id: "news-2",
    title: "Chiefs Sign Star WR to Record Extension",
    summary: "The Kansas City Chiefs locked up their top wide receiver with a 4-year, $120 million extension. The deal makes him the highest-paid receiver in franchise history and signals Super Bowl intentions.",
    content: null,
    source: "NFL Network",
    sourceUrl: "https://nfl.com",
    imageUrl: null,
    publishedAt: new Date(Date.now() - 7200000).toISOString(),
    tags: ["NFL", "Chiefs", "Contract"],
    teams: ["Kansas City Chiefs"],
    leagues: ["NFL"],
  },
  {
    id: "news-3",
    title: "Astros Ace Throws No-Hitter in Dominant Outing",
    summary: "Houston Astros starter Framber Valdez tossed a complete-game no-hitter against the Yankees, striking out 12 and walking just one. It was the first Astros no-hitter since 2022.",
    content: null,
    source: "MLB.com",
    sourceUrl: "https://mlb.com",
    imageUrl: null,
    publishedAt: new Date(Date.now() - 10800000).toISOString(),
    tags: ["MLB", "Astros", "No-Hitter"],
    teams: ["Houston Astros", "New York Yankees"],
    leagues: ["MLB"],
  },
  {
    id: "news-4",
    title: "Celtics Injury Report: Star PG Questionable for Playoffs",
    summary: "Boston Celtics point guard Jaylen Brown is listed as questionable ahead of the first-round playoff series opener. The team is reportedly optimistic but will monitor him through morning shootaround.",
    content: null,
    source: "The Athletic",
    sourceUrl: "https://theathletic.com",
    imageUrl: null,
    publishedAt: new Date(Date.now() - 14400000).toISOString(),
    tags: ["NBA", "Celtics", "Injury"],
    teams: ["Boston Celtics"],
    leagues: ["NBA"],
  },
  {
    id: "news-5",
    title: "Eagles Offseason Moves: Three Key Free Agent Signings",
    summary: "The Philadelphia Eagles made three major free agent signings this week, bolstering their offensive line and adding depth at linebacker. Analysts give the moves high marks heading into training camp.",
    content: null,
    source: "CBS Sports",
    sourceUrl: "https://cbssports.com",
    imageUrl: null,
    publishedAt: new Date(Date.now() - 18000000).toISOString(),
    tags: ["NFL", "Eagles", "Free Agency"],
    teams: ["Philadelphia Eagles"],
    leagues: ["NFL"],
  },
  {
    id: "news-6",
    title: "Nuggets Advance to Western Conference Finals",
    summary: "Nikola Jokic triple-doubled in Denver's Game 6 clincher, sending the Nuggets to the Western Conference Finals for the third consecutive year. Jokic finished with 28 points, 14 rebounds, and 11 assists.",
    content: null,
    source: "ESPN",
    sourceUrl: "https://espn.com",
    imageUrl: null,
    publishedAt: new Date(Date.now() - 21600000).toISOString(),
    tags: ["NBA", "Nuggets", "Playoffs"],
    teams: ["Denver Nuggets"],
    leagues: ["NBA"],
  },
  {
    id: "news-7",
    title: "Bills vs. Dolphins Rivalry Heats Up in Training Camp",
    summary: "Reports from Bills and Dolphins training camps suggest both AFC East rivals are hyper-focused on each other this summer. Buffalo added a new cornerback package specifically designed to stop Miami's speed game.",
    content: null,
    source: "NFL Network",
    sourceUrl: "https://nfl.com",
    imageUrl: null,
    publishedAt: new Date(Date.now() - 25200000).toISOString(),
    tags: ["NFL", "Bills", "Dolphins"],
    teams: ["Buffalo Bills", "Miami Dolphins"],
    leagues: ["NFL"],
  },
  {
    id: "news-8",
    title: "Lakers Reportedly Targeting Star Point Guard in Trade",
    summary: "Los Angeles Lakers front office is in active trade discussions for a starting caliber point guard, per multiple league insiders. Several teams have been contacted and a deal could come before the deadline.",
    content: null,
    source: "The Athletic",
    sourceUrl: "https://theathletic.com",
    imageUrl: null,
    publishedAt: new Date(Date.now() - 28800000).toISOString(),
    tags: ["NBA", "Lakers", "Trade"],
    teams: ["Los Angeles Lakers"],
    leagues: ["NBA"],
  },
];

router.get("/news", (req, res) => {
  const { teams, leagues } = req.query as { teams?: string; leagues?: string };

  let articles = [...MOCK_NEWS];

  if (teams) {
    const teamList = teams.split(",").map(t => t.trim().toLowerCase());
    articles = articles.filter(a =>
      a.teams.some(t => teamList.some(tl => t.toLowerCase().includes(tl)))
    );
  }

  if (leagues) {
    const leagueList = leagues.split(",").map(l => l.trim().toUpperCase());
    articles = articles.filter(a =>
      a.leagues.some(l => leagueList.includes(l))
    );
  }

  if (articles.length === 0) articles = MOCK_NEWS;

  res.json({ articles });
});

export default router;
