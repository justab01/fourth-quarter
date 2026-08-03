export type BaseballAwardKind = "championship" | "gold-glove" | "all-star" | "silver" | "monthly";

export type BaseballAccolade = {
  id: string;
  year: number;
  date: string;
  title: string;
  shortTitle: string;
  kind: BaseballAwardKind;
  detail: string;
};

export type BaseballFeaturedPlayer = {
  id: string;
  name: string;
  team: string;
  position: "DH" | "CF" | "SP" | "RP";
  lane: "Hitter" | "Pitcher";
  espnId: string;
  color: string;
  stats: { label: string; value: string }[];
  awards: BaseballAccolade[];
};

const award = (
  id: string,
  year: number,
  date: string,
  title: string,
  shortTitle: string,
  kind: BaseballAwardKind,
  detail: string,
): BaseballAccolade => ({ id, year, date, title, shortTitle, kind, detail });

export const BASEBALL_FEATURED_PLAYERS: BaseballFeaturedPlayer[] = [
  {
    id: "yordan-alvarez",
    name: "Yordan Alvarez",
    team: "Houston Astros",
    position: "DH",
    lane: "Hitter",
    espnId: "36018",
    color: "#C86B3D",
    stats: [
      { label: "AVG", value: ".330" },
      { label: "HR", value: "35" },
      { label: "RBI", value: "84" },
      { label: "OPS", value: "1.092" },
    ],
    awards: [
      award("ya-2019-roy", 2019, "2019-11-11", "American League Rookie of the Year", "ROY", "all-star", "A unanimous arrival: Alvarez won all 30 first-place votes after one of baseball's loudest rookie debuts."),
      award("ya-2021-alcsmvp", 2021, "2021-10-22", "American League Championship Series MVP", "ALCS MVP", "championship", "He hit .522 in the series and powered Houston back to the World Series."),
      award("ya-2022-as", 2022, "2022-07-19", "MLB All-Star", "ALL-STAR", "all-star", "His first Midsummer Classic selection."),
      award("ya-2022-ss", 2022, "2022-11-10", "American League Silver Slugger", "SILVER", "silver", "Recognized as the league's premier offensive designated hitter."),
      award("ya-2022-allmlb", 2022, "2022-12-05", "All-MLB First Team", "ALL-MLB", "all-star", "Selected to baseball's top end-of-season team."),
      award("ya-2022-ws", 2022, "2022-11-05", "World Series Champion", "WORLD SERIES", "championship", "Alvarez's towering Game 6 home run helped seal Houston's championship."),
      award("ya-2023-as", 2023, "2023-07-11", "MLB All-Star", "ALL-STAR", "all-star", "Second straight All-Star selection."),
      award("ya-2024-as", 2024, "2024-07-16", "MLB All-Star", "ALL-STAR", "all-star", "Third consecutive All-Star honor."),
      award("ya-2024-allmlb", 2024, "2024-12-14", "All-MLB Second Team", "ALL-MLB", "all-star", "Another season among the game's best hitters."),
      award("ya-2026-as", 2026, "2026-07-14", "MLB All-Star", "ALL-STAR", "all-star", "His fourth career All-Star selection."),
    ],
  },
  {
    id: "pete-crow-armstrong",
    name: "Pete Crow-Armstrong",
    team: "Chicago Cubs",
    position: "CF",
    lane: "Hitter",
    espnId: "4717833",
    color: "#1C4C8C",
    stats: [
      { label: "AVG", value: ".282" },
      { label: "HR", value: "24" },
      { label: "RBI", value: "64" },
      { label: "SB", value: "26" },
    ],
    awards: [
      award("pca-2022-milbgg", 2022, "2022-11-22", "Minor League Gold Glove", "GOLD GLOVE", "gold-glove", "Named the best defensive outfielder across Minor League Baseball."),
      award("pca-2025-as", 2025, "2025-07-15", "National League All-Star", "ALL-STAR", "all-star", "His first MLB All-Star selection."),
      award("pca-2025-gg", 2025, "2025-11-02", "National League Gold Glove", "GOLD GLOVE", "gold-glove", "Elite range and instincts earned the center fielder his first MLB Gold Glove."),
      award("pca-2025-allmlb", 2025, "2025-12-12", "All-MLB Second Team", "ALL-MLB", "all-star", "Selected among baseball's best outfielders."),
      award("pca-2026-as", 2026, "2026-07-14", "National League All-Star", "ALL-STAR", "all-star", "A second consecutive trip to the Midsummer Classic."),
    ],
  },
  {
    id: "jacob-misiorowski",
    name: "Jacob Misiorowski",
    team: "Milwaukee Brewers",
    position: "SP",
    lane: "Pitcher",
    espnId: "5080761",
    color: "#BC8A32",
    stats: [
      { label: "W-L", value: "11-5" },
      { label: "ERA", value: "1.63" },
      { label: "SO", value: "195" },
      { label: "WHIP", value: "0.73" },
    ],
    awards: [
      award("jm-2025-rom", 2025, "2025-06-30", "National League Rookie of the Month", "ROOKIE", "monthly", "A dominant first full month immediately put the rookie on the national map."),
      award("jm-2025-as", 2025, "2025-07-15", "National League All-Star", "ALL-STAR", "all-star", "Selected to the All-Star team during his rookie season."),
      award("jm-2026-pow1", 2026, "2026-05-31", "National League Player of the Week", "PLAYER/WEEK", "monthly", "The first weekly league honor of his breakout 2026 season."),
      award("jm-2026-pow2", 2026, "2026-06-14", "National League Player of the Week", "PLAYER/WEEK", "monthly", "A second distinct weekly honor, earned two weeks later."),
      award("jm-2026-as", 2026, "2026-07-14", "National League All-Star", "ALL-STAR", "all-star", "Back-to-back All-Star selections."),
    ],
  },
  {
    id: "mason-miller",
    name: "Mason Miller",
    team: "San Diego Padres",
    position: "RP",
    lane: "Pitcher",
    espnId: "4730225",
    color: "#6F513C",
    stats: [
      { label: "SV", value: "28" },
      { label: "ERA", value: "0.76" },
      { label: "SO", value: "88" },
      { label: "WHIP", value: "0.80" },
    ],
    awards: [
      award("mm-2024-as", 2024, "2024-07-16", "American League All-Star", "ALL-STAR", "all-star", "The flamethrowing closer's first All-Star selection."),
      award("mm-2024-allmlb", 2024, "2024-12-14", "All-MLB Second Team", "ALL-MLB", "all-star", "Recognized among the game's elite relievers."),
      award("mm-2025-rom", 2025, "2025-09-30", "National League Reliever of the Month", "RELIEVER", "monthly", "A dominant September after joining San Diego."),
      award("mm-2026-apr", 2026, "2026-04-30", "National League Reliever of the Month", "RELIEVER", "monthly", "Opened 2026 by shutting down the ninth inning all month."),
      award("mm-2026-may", 2026, "2026-05-31", "National League Reliever of the Month", "RELIEVER", "monthly", "Repeated as the league's top reliever in May."),
      award("mm-2026-as", 2026, "2026-07-14", "National League All-Star", "ALL-STAR", "all-star", "His second career All-Star selection."),
    ],
  },
];

export const BASEBALL_LESSONS = [
  { id: "inning", icon: "play-circle-outline", title: "Watch one inning", dek: "Follow three outs from first pitch to side retired.", body: "Start with the count, watch how runners change the defense, and notice how the pitcher attacks each hitter differently. One inning is enough to see baseball's strategy unfold." },
  { id: "box", icon: "grid-outline", title: "Read any box score", dek: "Turn the columns into the story of the game.", body: "R, H and E summarize the team line. For hitters, AB, H, RBI and BB show how they created offense. For pitchers, IP, H, ER, BB and K explain how they controlled the game." },
  { id: "bullpen", icon: "swap-horizontal-outline", title: "Why pitchers change", dek: "Learn the starter-to-bullpen chess match.", body: "Starters pace themselves through a lineup. Relievers enter for shorter, more specific matchups. Managers weigh pitch count, fatigue, handedness and the leverage of the moment." },
  { id: "atbat", icon: "analytics-outline", title: "Win the at-bat", dek: "Why the result is bigger than hit or out.", body: "A hitter can win by forcing pitches, moving a runner, drawing a walk or driving a ball hard. A pitcher wins by controlling the count and limiting the hitter's best swing." },
  { id: "positions", icon: "baseball-outline", title: "Know every position", dek: "Nine defenders, nine different responsibilities.", body: "The battery is pitcher and catcher. Four infielders guard the dirt, three outfielders patrol the gaps, and every ball in play triggers a coordinated backup and relay system." },
] as const;

export const BASEBALL_HISTORY = [
  { id: "hof-1942", date: "August 3, 1942", title: "Baseball returned to Cooperstown", body: "The Cardinals defeated the Athletics 5–2 at Doubleday Field in the third Hall of Fame Game, continuing a summer tradition beside the museum." },
  { id: "glaus-1976", date: "Born August 3, 1976", title: "Troy Glaus", body: "The four-time All-Star became a World Series champion and the 2002 World Series MVP after driving in eight runs across seven games." },
] as const;

export const BALLPARK_FEATURES = [
  { id: "wrigley", venue: "Wrigley Field", city: "Chicago", note: "Ivy, rooftops and afternoon baseball" },
  { id: "fenway", venue: "Fenway Park", city: "Boston", note: "The Green Monster changes every fly ball" },
  { id: "coors", venue: "Coors Field", city: "Denver", note: "Altitude turns contact into instant danger" },
] as const;
