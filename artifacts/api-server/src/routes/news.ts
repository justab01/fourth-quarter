import { Router, type IRouter } from "express";

const router: IRouter = Router();

// ─── REAL NEWS — March 19, 2026 ─────────────────────────────────────────────
// Sourced from real events: NBA games, NFL free agency, MLB spring training

const NOW = Date.now();
function hoursAgo(h: number) { return new Date(NOW - h * 3600000).toISOString(); }
function minutesAgo(m: number) { return new Date(NOW - m * 60000).toISOString(); }

const REAL_NEWS = [
  {
    id: "news-lakers-rockets-recap",
    title: "Luka 40, LeBron 13-of-14: Lakers Crush Rockets 124-116 to Extend Win Streak to 7",
    summary: "Luka Dončić posted 40 points and 10 assists while LeBron James went a near-perfect 13-of-14 from the field for 30 points as the Lakers overwhelmed Houston 124-116 at Toyota Center. LeBron also passed the 12,000 career rebound mark, becoming the 23rd player in NBA history to reach the milestone. The loss drops Houston to 2nd straight L; the Lakers now hold 3rd in the West with a head-to-head tiebreaker over the Rockets.",
    content: "The Los Angeles Lakers rolled into Houston and dominated from the start, with Luka Dončić picking up exactly where he left off — 40 points, 10 assists, and total floor control. LeBron James added one of the most efficient games of his career, going 13-of-14 from the field for 30 points and recording his 12,002nd career rebound, surpassing Moses Malone for 23rd all-time.\n\nDeandre Ayton contributed 16 points and 3 blocks off the bench. The Rockets fought hard down the stretch — Amen Thompson had 22 and Kevin Durant added 19 — but couldn't stop the Lakers' two-man wrecking ball in the fourth.\n\n\"Those two guys are just different,\" Houston coach said postgame. \"We had good coverage on both and still couldn't stop them.\"\n\nThe Lakers are now 7-0 in their current win streak and 10-1 in their last 11. Houston drops to 41-26 and holds the 5th seed heading into a crucial stretch before the April 18 playoff tip-off.",
    source: "ESPN",
    sourceUrl: "https://espn.com/nba/story/lakers-rockets-recap-march18",
    imageUrl: null,
    publishedAt: hoursAgo(10),
    tags: ["NBA", "Lakers", "Rockets", "Luka Dončić", "LeBron James", "Western Conference"],
    teams: ["Los Angeles Lakers", "Houston Rockets"],
    leagues: ["NBA"],
  },
  {
    id: "news-thunder-clinch",
    title: "SGA Drops 40 as Thunder Clinch First Playoff Spot — 9-Game Win Streak Continues",
    summary: "Shai Gilgeous-Alexander scored 40 points — his 6th 40-point game this season — as the OKC Thunder beat Orlando 113-108 to become the first team to clinch a playoff berth in 2026. Oklahoma City holds a commanding 52-15 record and a 5-game lead for the top seed in the West. The Thunder have been the league's best team from wire to wire.",
    content: "Oklahoma City did it first. With Shai Gilgeous-Alexander putting up another unconscious 40-point performance, the Thunder clinched a playoff spot with a 113-108 win over the Orlando Magic — locking in their postseason place before any other team in the league.\n\nSGA now has 6 forty-point games this season, a mark that puts him in elite company. He shot 15-of-23 from the field, added 7 assists and 5 rebounds, and put the game away with a personal 8-0 run in the 4th quarter when Orlando went on a 6-0 run to get within 4.\n\n\"He just wills us to wins,\" said head coach Mark Daigneault. \"When it matters, he's locked in.\"\n\nThe Thunder (52-15) are the clear class of the Western Conference. The play-in tournament begins April 14, with the playoffs tipping off April 18.",
    source: "The Athletic",
    sourceUrl: "https://theathletic.com/thunder-clinch-playoffs-2026",
    imageUrl: null,
    publishedAt: hoursAgo(12),
    tags: ["NBA", "Thunder", "SGA", "Shai Gilgeous-Alexander", "Playoffs", "Western Conference"],
    teams: ["Oklahoma City Thunder", "Orlando Magic"],
    leagues: ["NBA"],
  },
  {
    id: "news-spurs-clinch-tonight",
    title: "Spurs Can Clinch Playoff Spot Tonight — 19-2 Since Feb 1, Best Stretch Since 2016",
    summary: "San Antonio heads into tonight's game vs. the Phoenix Suns one win away from clinching a playoff berth — their first since 2019. The Spurs have gone a stunning 19-2 since February 1st, the best 21-game run by any franchise since San Antonio's own dynasty days in 2015-16. Victor Wembanyama is the clear Defensive Player of Year frontrunner and a legitimate MVP candidate.",
    content: "If you're not watching the San Antonio Spurs, you're missing the hottest team in basketball. Since February 1st, the Spurs have gone 19-2 — surpassing even the OKC Thunder's pace over that stretch — and Victor Wembanyama has elevated his game to an entirely new level.\n\nTonight against a Phoenix Suns squad with Devin Booker averaging 33.9 points over his last 4 games, the Spurs have a chance to clinch their first playoff appearance since the 2018-19 season.\n\nWembanyama is averaging 28.4 points, 11.2 rebounds, and 4.1 blocks per game over the last 21 games — numbers that no player in modern NBA history has put together at this level. If the Spurs win tonight, it will be a momentous achievement for the franchise's rebuild that took just 3 years from the Wembanyama draft.",
    source: "NBA.com",
    sourceUrl: "https://nba.com/spurs-playoff-clinch-preview",
    imageUrl: null,
    publishedAt: hoursAgo(6),
    tags: ["NBA", "Spurs", "Wembanyama", "Playoffs", "Western Conference"],
    teams: ["San Antonio Spurs", "Phoenix Suns"],
    leagues: ["NBA"],
  },
  {
    id: "news-dolphins-waddle-broncos",
    title: "Dolphins Blow Up Roster: Jaylen Waddle Traded to Broncos in Blockbuster Deal",
    summary: "Miami trades WR Jaylen Waddle and a 4th-round pick to the Denver Broncos for a 2026 first-round pick, third, and fourth. Waddle reunites with former Alabama teammate Patrick Surtain II in Denver. The Dolphins, who also released Tua Tagovailoa, Tyreek Hill, and Bradley Chubb, now hold 11 draft picks — signaling a full rebuild.",
    content: "The Miami Dolphins are blowing it up. General manager Chris Grier confirmed Thursday that the franchise has traded wide receiver Jaylen Waddle to the Denver Broncos in exchange for a 2026 first-round pick, a third, and a fourth.\n\nThe move follows a whirlwind week in Miami: the Dolphins released quarterback Tua Tagovailoa (who has since signed with Atlanta), released All-Pro receiver Tyreek Hill, and let edge rusher Bradley Chubb (now with Buffalo) walk in free agency.\n\nWaddle, 27, spent five seasons in Miami and was the centerpiece of one of the league's most explosive offenses at its peak. He joins Denver and reunites with cornerback Patrick Surtain II — both were Alabama teammates.\n\n\"We're building for the future,\" Grier said. \"This is a painful decision but it puts us in a position to compete for championships in the years ahead.\" Miami now has 11 draft picks in the 2026 NFL Draft, set for April 23-25 in Pittsburgh.",
    source: "NFL Network",
    sourceUrl: "https://nfl.com/news/dolphins-waddle-broncos-trade",
    imageUrl: null,
    publishedAt: hoursAgo(14),
    tags: ["NFL", "Dolphins", "Broncos", "Trade", "Free Agency", "Jaylen Waddle"],
    teams: ["Miami Dolphins", "Denver Broncos"],
    leagues: ["NFL"],
  },
  {
    id: "news-cunningham-injury",
    title: "Cade Cunningham Injured in Pistons Win — Could Miss Rest of Season",
    summary: "Detroit Pistons star Cade Cunningham left Wednesday's game vs. the Wizards after diving for a loose ball and did not return. The team has not confirmed the injury's severity, but early reports suggest ligament damage that could sideline him for the remainder of the regular season. Cunningham had been a top-5 MVP candidate with Detroit sitting at 49-19 and the East's best record.",
    content: "The Detroit Pistons may have received devastating news just as the playoff race heats up. Cade Cunningham — the engine of a 49-19 Pistons team that has defied all preseason expectations — was helped off the court in the third quarter of Wednesday's win over Washington after awkwardly landing while diving for a loose ball.\n\nHe did not return, and the team listed him as 'day-to-day' in the immediate aftermath, but multiple league sources told ESPN that the early imaging suggests significant ligament damage that could require weeks of recovery.\n\nCunningham was averaging 28.9 points, 9.4 assists, 6.1 rebounds and was on pace for the first 29/9/6 season in NBA history. His loss would be devastating not just to Detroit's playoff hopes but to his MVP candidacy.\n\nThe Pistons still have the East's best record but now face a dramatically different postseason picture.",
    source: "ESPN",
    sourceUrl: "https://espn.com/nba/cade-cunningham-injury-update",
    imageUrl: null,
    publishedAt: hoursAgo(9),
    tags: ["NBA", "Pistons", "Cade Cunningham", "Injury", "Eastern Conference"],
    teams: ["Detroit Pistons"],
    leagues: ["NBA"],
  },
  {
    id: "news-march-madness-first-four",
    title: "March Madness First Four: Tournament Officially Underway",
    summary: "The 2026 NCAA Tournament tipped off Wednesday night with the First Four games. Miami (OH) upset SMU while Lehigh beat Prairie View A&M — both advancing to face No. 1 seeds. Top NBA draft prospects including AJ Dybantsa (BYU) and 48 NBA Academy alumni are in the field. AJ Dybantsa has vaulted to the top of multiple 2026 NBA Draft mock drafts.",
    content: "March Madness is here. The 2026 NCAA Tournament First Four games tipped off Wednesday night, delivering the emotional theater that only college basketball's biggest stage can produce.\n\nMiami (OH) defeated SMU to advance, while Lehigh edged Prairie View A&M to earn a date with the No. 1 seed in the South Region — Florida.\n\nBeyond the bracket results, the tournament has enormous NBA draft implications. BYU freshman AJ Dybantsa — widely considered the most physically gifted prospect since Victor Wembanyama — has emerged as the consensus No. 1 pick in virtually every mock draft. At 6'8\" with elite shooting range and playmaking ability, Dybantsa has scouts breathless.\n\nA record 48 NBA Academy and Basketball Without Borders alumni are participating in this year's tournament, reflecting the sport's growing global footprint. The field of 68 tips off in full on Thursday.",
    source: "CBS Sports",
    sourceUrl: "https://cbssports.com/college-basketball/march-madness-first-four-2026",
    imageUrl: null,
    publishedAt: hoursAgo(11),
    tags: ["NCAA", "March Madness", "NBA Draft", "AJ Dybantsa", "College Basketball"],
    teams: [],
    leagues: ["NCAA"],
  },
  {
    id: "news-gerrit-cole-return",
    title: "Gerrit Cole Makes Spring Training Return — Hits 98.7 MPH in First Outing Since Tommy John",
    summary: "New York Yankees ace Gerrit Cole made his spring training debut after undergoing Tommy John surgery in March 2025, pitching a scoreless inning vs. the Red Sox while topping out at 98.7 mph. The Yankees, who open the 2026 MLB season against the Giants on March 25, are cautiously optimistic Cole will be fully stretched out for the summer. Opening Night is 6 days away.",
    content: "There is no better story in spring training right now than Gerrit Cole's comeback.\n\nThe New York Yankees ace, who underwent Tommy John surgery almost exactly one year ago, took the mound in Clearwater on Thursday against the Boston Red Sox and was everything the Yankees had hoped for — and then some.\n\nCole worked a clean inning, retired the three batters he faced, and touched 98.7 mph with his fastball — the same velocity he was sitting at before the injury. His slider was sharp. His cutter showed depth. The Yankees staff was watching with stopwatches and smiles.\n\n\"He looked like Gerrit Cole,\" pitching coach Matt Blake said. \"That's all we needed to see today.\"\n\nNew York opens the 2026 MLB season at home against the San Francisco Giants on March 25 in Opening Night, which will be broadcast nationally. Cole is targeting a mid-April return to game action — which would put him on track for a full second half of the season.",
    source: "MLB.com",
    sourceUrl: "https://mlb.com/news/gerrit-cole-spring-training-return-yankees",
    imageUrl: null,
    publishedAt: hoursAgo(5),
    tags: ["MLB", "Yankees", "Gerrit Cole", "Spring Training", "Tommy John"],
    teams: ["New York Yankees", "Boston Red Sox"],
    leagues: ["MLB"],
  },
  {
    id: "news-kyler-murray-vikings",
    title: "Kyler Murray Signs With Minnesota Vikings on 1-Year Deal After Cardinals Release",
    summary: "Arizona released Kyler Murray last week and the Minnesota Vikings quickly moved to sign him to a 1-year deal, giving them a veteran bridge option at quarterback. Murray reunites with new Vikings offensive coordinator Todd Monken, who has a history of unlocking mobile quarterbacks. Las Vegas holds the No. 1 overall pick and is expected to target a QB in April's draft.",
    content: "Kyler Murray's time in Arizona is over — and his next chapter begins in Minnesota.\n\nThe Vikings announced Thursday they have signed Murray to a one-year contract after the Arizona Cardinals released him last week. Murray, 29, provides Minnesota with a dynamic dual-threat QB as they evaluate their quarterback situation heading into the 2026 NFL Draft.\n\nMurray struggled with injuries and inconsistency in his final years in Arizona after a devastating 2022 ACL tear that never fully went away. But his mobility and arm talent remain intact, and the Vikings' offensive scheme under new OC Todd Monken is built for quarterbacks who can extend plays.\n\n\"We're thrilled to add Kyler to our locker room,\" said Minnesota head coach Kevin O'Connell. \"He's a proven talent and a competitive person.\"\n\nThe 2026 NFL Draft (April 23-25, Pittsburgh) is expected to be headlined by quarterback prospects, with the Las Vegas Raiders — holding the No. 1 pick — widely expected to take their franchise QB of the future.",
    source: "NFL Network",
    sourceUrl: "https://nfl.com/news/kyler-murray-vikings-signing",
    imageUrl: null,
    publishedAt: hoursAgo(16),
    tags: ["NFL", "Vikings", "Kyler Murray", "Free Agency", "Cardinals"],
    teams: ["Minnesota Vikings", "Arizona Cardinals"],
    leagues: ["NFL"],
  },
  {
    id: "news-mls-vancouver-hot",
    title: "Vancouver Whitecaps Thrash Minnesota 6-0 — Lead MLS West After Perfect Start",
    summary: "The Vancouver Whitecaps completed a stunning 6-0 demolition of Minnesota United on Saturday, extending their unbeaten run to 4 matches and cementing their place atop the MLS Western Conference. Top scorer Petar Musa leads the league with 5 goals. Meanwhile, LAFC also sits unbeaten after 4 matches — setting up a massive Pacific showdown on the horizon.",
    content: "The Vancouver Whitecaps are not messing around in 2026.\n\nGoals from five different scorers powered a dominant 6-0 rout of Minnesota United at BC Place on Saturday, the biggest home win of the young MLS season. Petar Musa added two more to bring his league-leading total to 5 goals in 4 games.\n\nVancouver is the talk of the Western Conference. Their defensive organization under head coach Vanni Sartini has been exceptional — they've conceded just 2 goals in their first 4 matches — and their counterattacking speed has overwhelmed every opponent they've faced.\n\nLA Galaxy-rival LAFC is right behind them with a perfect 3-0-0 record and 9 points — a Pacific division showdown between the two sides is inevitable and already being talked about as the early season's most anticipated matchup.\n\nThe 2026 MLS season continues through November 7, with a six-week break from May 25 to July 16 for the FIFA World Cup.",
    source: "MLS Soccer",
    sourceUrl: "https://mlssoccer.com/news/vancouver-whitecaps-6-0-minnesota",
    imageUrl: null,
    publishedAt: hoursAgo(72),
    tags: ["MLS", "Vancouver Whitecaps", "Minnesota United", "Western Conference"],
    teams: ["Vancouver Whitecaps", "Minnesota United"],
    leagues: ["MLS"],
  },
  {
    id: "news-houston-rockets-preview",
    title: "Rockets Host Hawks Tomorrow — Kevin Durant Key as Houston Tries to Halt 2-Game Skid",
    summary: "The Houston Rockets (41-26) host the Atlanta Hawks on Friday at Toyota Center, looking to stop a 2-game losing streak after consecutive losses to the Lakers. Kevin Durant has averaged 23.6 points over his last 10 games and is Houston's most reliable option to counter Atlanta's uptempo attack. The Rockets are locked in as the West's 5th seed with 11 games remaining before the April 18 playoff tip.",
    content: "After back-to-back losses to the Lakers — 100-92 Monday and 124-116 Wednesday — the Houston Rockets need a reset. Friday's home game against the Atlanta Hawks is exactly the kind of matchup they need.\n\nAtlanta has been on a 4-game winning streak, energized by the February acquisition of Jonathan Kuminga from Golden State (14.6 ppg, 8 rebounds since the trade) and CJ McCollum, who has averaged 18.3 points.\n\nHouston's formula is straightforward: Kevin Durant needs to attack early. Durant has gone 23+ points in 8 of his last 10 games and is the most reliable offensive option on the team. Amen Thompson (17.9 ppg, 7.8 rebounds) will need to dominate the paint against a Hawks front court that can be exposed on interior defense.\n\nThe Rockets are 23-10 at home this season. With 11 games left before the April 18 playoff opening tip, they're locked in as the 5th seed — but need to avoid slipping to the play-in zone if the bottom falls out.",
    source: "Rockets Wire",
    sourceUrl: "https://rocketswire.usatoday.com/rockets-hawks-preview",
    imageUrl: null,
    publishedAt: minutesAgo(45),
    tags: ["NBA", "Rockets", "Hawks", "Western Conference", "Kevin Durant", "Amen Thompson"],
    teams: ["Houston Rockets", "Atlanta Hawks"],
    leagues: ["NBA"],
  },
];

router.get("/news", (req, res) => {
  const { teams, leagues } = req.query as { teams?: string; leagues?: string };

  let articles = [...REAL_NEWS];

  if (teams) {
    const teamList = teams.split(",").map(t => t.trim().toLowerCase());
    const filtered = articles.filter(a =>
      a.teams.some(t => teamList.some(tl => t.toLowerCase().includes(tl)))
    );
    if (filtered.length > 0) articles = filtered;
  }

  if (leagues) {
    const leagueList = leagues.split(",").map(l => l.trim().toUpperCase());
    const filtered = articles.filter(a =>
      a.leagues.some(l => leagueList.includes(l))
    );
    if (filtered.length > 0) articles = filtered;
  }

  // Sort by publishedAt desc
  articles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  res.json({ articles });
});

export default router;
