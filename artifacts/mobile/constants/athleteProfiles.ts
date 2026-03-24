// Comprehensive individual-sport athlete profiles
// Tennis: career stats, Grand Slams, surface records, earnings
// Combat: fight records by method, physical stats, titles
// X Games / Olympics: discipline, medals, event history

export interface GrandSlamRecord {
  ao: number; rg: number; wimbledon: number; uso: number;
}
export interface SurfaceRecord {
  hard: string; clay: string; grass: string; indoor?: string;
}
export interface TournamentResult {
  year: number; tournament: string; round: string; surface?: string;
}
export interface FightResult {
  year: number; opponent: string; result: "W" | "L" | "NC" | "D";
  method: "KO/TKO" | "Submission" | "Decision" | "Split Decision" | "DQ" | "NC" | "Draw";
  round?: number; event?: string;
}
export interface OlympicMedal {
  year: number; city: string; event: string; color: "Gold" | "Silver" | "Bronze";
}
export interface XGamesMedal {
  year: number; event: string; discipline: string; color: "Gold" | "Silver" | "Bronze";
}

export interface TennisProfile {
  sport: "tennis";
  name: string;
  league: "ATP" | "WTA";
  nationality: string;
  born: string;
  age: number;
  height: string;
  plays: "Right-handed" | "Left-handed";
  turnedPro: number;
  currentRanking: string;
  peakRanking: string;
  grandSlams: number;
  grandSlamBreakdown: GrandSlamRecord;
  tourTitles: number;
  careerEarnings: string;
  careerWins: number;
  careerLosses: number;
  surfaceRecord: SurfaceRecord;
  careerHighlights: string[];
  recentResults?: TournamentResult[];
  bio?: string;
}

export interface CombatProfile {
  sport: "combat";
  name: string;
  league: "UFC" | "BOXING";
  nationality: string;
  born: string;
  age: number;
  height: string;
  weight: string;
  reach: string;
  stance: "Orthodox" | "Southpaw" | "Switch";
  weightClass: string;
  record: { wins: number; losses: number; draws: number; nc?: number };
  byKoTko: number;
  bySubmission: number;
  byDecision: number;
  titles: string[];
  titleDefenses?: number;
  careerHighlights: string[];
  recentFights?: FightResult[];
  bio?: string;
}

export interface XGamesProfile {
  sport: "xgames";
  name: string;
  league: "XGAMES";
  nationality: string;
  born: string;
  age: number;
  disciplines: string[];
  goldMedals: number;
  silverMedals: number;
  bronzeMedals: number;
  totalMedals: number;
  careerHighlights: string[];
  medals?: XGamesMedal[];
  bio?: string;
}

export interface OlympicsProfile {
  sport: "olympics";
  name: string;
  league: "OLYMPICS";
  nationality: string;
  born: string;
  age: number;
  discipline: string;
  goldMedals: number;
  silverMedals: number;
  bronzeMedals: number;
  totalMedals: number;
  careerHighlights: string[];
  medals?: OlympicMedal[];
  bio?: string;
}

export type AthleteProfile = TennisProfile | CombatProfile | XGamesProfile | OlympicsProfile;

// ─── ATP MEN'S TENNIS ──────────────────────────────────────────────────────────
export const ATP_PROFILES: TennisProfile[] = [
  {
    sport: "tennis", name: "Jannik Sinner", league: "ATP",
    nationality: "Italy", born: "2001-08-16", age: 23,
    height: "6'2\"", plays: "Right-handed", turnedPro: 2018,
    currentRanking: "#1", peakRanking: "#1",
    grandSlams: 3, grandSlamBreakdown: { ao: 2, rg: 0, wimbledon: 0, uso: 1 },
    tourTitles: 23, careerEarnings: "$25M+", careerWins: 220, careerLosses: 60,
    surfaceRecord: { hard: "180-42", clay: "38-16", grass: "18-8" },
    careerHighlights: [
      "2024 Australian Open champion (def. Medvedev 3-2)",
      "2024 US Open champion (def. Fritz 4-1)",
      "2025 Australian Open champion (def. Zverev 3-0)",
      "ATP Year-End #1 in 2024 — youngest since Borg",
      "First Italian man to reach #1 ATP",
      "Won 8 titles in 2024 season",
      "Davis Cup champion with Italy 2023 & 2024",
    ],
    bio: "Jannik Sinner is the dominant force in men's tennis, becoming the first Italian man to hold the world #1 ranking. Known for his powerful baseline game and exceptional footwork, he turned professional at 18 and quickly rose through the rankings to become a multiple Grand Slam champion.",
  },
  {
    sport: "tennis", name: "Carlos Alcaraz", league: "ATP",
    nationality: "Spain", born: "2003-05-05", age: 21,
    height: "6'1\"", plays: "Right-handed", turnedPro: 2018,
    currentRanking: "#2", peakRanking: "#1",
    grandSlams: 4, grandSlamBreakdown: { ao: 0, rg: 2, wimbledon: 2, uso: 1 },
    tourTitles: 18, careerEarnings: "$22M+", careerWins: 195, careerLosses: 55,
    surfaceRecord: { hard: "110-35", clay: "70-18", grass: "25-5" },
    careerHighlights: [
      "2022 US Open champion (youngest #1 ever at 19)",
      "2023 Wimbledon champion (def. Djokovic)",
      "2024 French Open champion (def. Zverev)",
      "2024 Wimbledon champion (def. Djokovic again)",
      "First player born in 2000s to win a Grand Slam",
      "Won Wimbledon and French Open in same year (2024)",
    ],
    bio: "Carlos Alcaraz is a generational talent from El Palmar, Spain. He became the youngest player to reach ATP World No.1 and has won Grand Slams on all three surface types (hard, clay, grass) before turning 22.",
  },
  {
    sport: "tennis", name: "Novak Djokovic", league: "ATP",
    nationality: "Serbia", born: "1987-05-22", age: 37,
    height: "6'2\"", plays: "Right-handed", turnedPro: 2003,
    currentRanking: "#3", peakRanking: "#1",
    grandSlams: 24, grandSlamBreakdown: { ao: 10, rg: 3, wimbledon: 7, uso: 4 },
    tourTitles: 99, careerEarnings: "$180M+", careerWins: 1100, careerLosses: 210,
    surfaceRecord: { hard: "600-100", clay: "320-75", grass: "100-20", indoor: "80-15" },
    careerHighlights: [
      "24 Grand Slam titles — all-time record",
      "10x Australian Open champion (record)",
      "7x Wimbledon champion",
      "Held #1 ranking for 428 weeks (all-time record)",
      "2023 Olympic Gold Medal (Paris)",
      "2024 Olympic Gold Medal first-time win",
      "Career Golden Slam (all 4 majors + Olympic Gold)",
      "ATP Finals record 7 titles",
    ],
    bio: "Novak Djokovic is the most decorated tennis player in history with 24 Grand Slam singles titles. The Serbian champion holds numerous all-time records including most weeks at #1 and most Major titles, completing the career Golden Slam with Olympic gold in 2024.",
  },
  {
    sport: "tennis", name: "Alexander Zverev", league: "ATP",
    nationality: "Germany", born: "1997-04-20", age: 27,
    height: "6'6\"", plays: "Right-handed", turnedPro: 2013,
    currentRanking: "#2", peakRanking: "#2",
    grandSlams: 1, grandSlamBreakdown: { ao: 0, rg: 1, wimbledon: 0, uso: 0 },
    tourTitles: 24, careerEarnings: "$35M+", careerWins: 480, careerLosses: 190,
    surfaceRecord: { hard: "280-110", clay: "160-60", grass: "50-25" },
    careerHighlights: [
      "2024 French Open champion (first GS title)",
      "2020 Olympic Gold Medal (Tokyo)",
      "ATP Finals champion 2018 & 2021",
      "Reached #2 in world multiple times",
      "20+ ATP titles across multiple surfaces",
    ],
    bio: "Alexander Zverev, known as Sascha, is Germany's top player. His powerful serve and aggressive baseline game make him dangerous on any surface. He captured his first Grand Slam at the 2024 French Open after years of near-misses.",
  },
  {
    sport: "tennis", name: "Daniil Medvedev", league: "ATP",
    nationality: "Russia", born: "1996-02-11", age: 28,
    height: "6'6\"", plays: "Right-handed", turnedPro: 2014,
    currentRanking: "#5", peakRanking: "#1",
    grandSlams: 1, grandSlamBreakdown: { ao: 0, rg: 0, wimbledon: 0, uso: 1 },
    tourTitles: 21, careerEarnings: "$30M+", careerWins: 440, careerLosses: 185,
    surfaceRecord: { hard: "350-140", clay: "70-45", grass: "25-15" },
    careerHighlights: [
      "2021 US Open champion",
      "Reached #1 ATP ranking in 2022",
      "3x Australian Open finalist",
      "2020 ATP Finals champion",
      "Dominant hard court player — 350+ hard court wins",
    ],
    bio: "Daniil Medvedev is one of the most consistent players on the ATP tour, particularly dominant on hard courts. His unique playing style and counter-punching ability have earned him a Grand Slam title and multiple major finals.",
  },
  {
    sport: "tennis", name: "Taylor Fritz", league: "ATP",
    nationality: "USA", born: "1997-10-28", age: 27,
    height: "6'4\"", plays: "Right-handed", turnedPro: 2015,
    currentRanking: "#4", peakRanking: "#4",
    grandSlams: 0, grandSlamBreakdown: { ao: 0, rg: 0, wimbledon: 0, uso: 0 },
    tourTitles: 10, careerEarnings: "$12M+", careerWins: 300, careerLosses: 180,
    surfaceRecord: { hard: "220-120", clay: "50-45", grass: "30-15" },
    careerHighlights: [
      "2024 US Open finalist (lost to Sinner)",
      "First American man in major final since Roddick",
      "Won Indian Wells Masters 2022",
      "ATP 500 titles at Tokyo and Vienna",
      "Consistent top-10 player since 2022",
    ],
    bio: "Taylor Fritz is the leading American man in tennis, combining powerful serving with aggressive groundstrokes. He became the first American man to reach a Grand Slam final in decades when he appeared at the 2024 US Open.",
  },
  {
    sport: "tennis", name: "Casper Ruud", league: "ATP",
    nationality: "Norway", born: "1998-12-22", age: 26,
    height: "6'0\"", plays: "Right-handed", turnedPro: 2015,
    currentRanking: "#7", peakRanking: "#2",
    grandSlams: 0, grandSlamBreakdown: { ao: 0, rg: 0, wimbledon: 0, uso: 0 },
    tourTitles: 11, careerEarnings: "$15M+", careerWins: 300, careerLosses: 155,
    surfaceRecord: { hard: "150-80", clay: "140-55", grass: "15-25" },
    careerHighlights: [
      "Reached #2 ATP ranking in 2023",
      "3x Grand Slam finalist (2x Roland Garros, 1x US Open)",
      "Dominant clay court performer",
      "10+ ATP titles including multiple clay 500s",
      "Davis Cup performer for Norway",
    ],
    bio: "Casper Ruud is Norway's first tennis superstar and one of the best clay court players in the world. Known for his relentless topspin and tenacity, he has reached three Grand Slam finals and maintains a top-10 ranking consistently.",
  },
  {
    sport: "tennis", name: "Ben Shelton", league: "ATP",
    nationality: "USA", born: "2002-10-09", age: 22,
    height: "6'4\"", plays: "Left-handed", turnedPro: 2022,
    currentRanking: "#13", peakRanking: "#13",
    grandSlams: 0, grandSlamBreakdown: { ao: 0, rg: 0, wimbledon: 0, uso: 0 },
    tourTitles: 3, careerEarnings: "$5M+", careerWins: 120, careerLosses: 70,
    surfaceRecord: { hard: "90-50", clay: "20-15", grass: "10-8" },
    careerHighlights: [
      "2023 US Open semifinalist at age 20",
      "Biggest serve on tour — 149 mph+",
      "ATP 500 title at Tokyo 2023",
      "Fastest rise in ATP rankings in 2023",
      "Nicknamed 'The Shelton Shuffle' for signature celebration",
    ],
    bio: "Ben Shelton is an electrifying left-handed powerhouse from Atlanta, Georgia. Son of former college tennis coach Bryan Shelton, he turned pro from University of Florida and quickly made his mark with his exceptional serve and athleticism.",
  },
  {
    sport: "tennis", name: "Jack Draper", league: "ATP",
    nationality: "Great Britain", born: "2001-12-22", age: 23,
    height: "6'3\"", plays: "Left-handed", turnedPro: 2019,
    currentRanking: "#15", peakRanking: "#15",
    grandSlams: 0, grandSlamBreakdown: { ao: 0, rg: 0, wimbledon: 0, uso: 0 },
    tourTitles: 3, careerEarnings: "$4M+", careerWins: 130, careerLosses: 75,
    surfaceRecord: { hard: "90-45", clay: "25-20", grass: "20-12" },
    careerHighlights: [
      "2024 US Open semifinalist",
      "2025 Monte-Carlo champion (first Masters title)",
      "Left-handed powerhouse — 140+ mph serve",
      "British #1 since 2024",
      "Won 3 ATP titles in rapid succession",
    ],
    bio: "Jack Draper is Britain's brightest tennis hope, a left-handed powerhouse who has rapidly climbed into the top-15. His ability to generate extreme angles with his left-handed serve and forehand make him a unique threat on all surfaces.",
  },
  {
    sport: "tennis", name: "Tommy Paul", league: "ATP",
    nationality: "USA", born: "1997-05-17", age: 27,
    height: "6'1\"", plays: "Right-handed", turnedPro: 2016,
    currentRanking: "#12", peakRanking: "#12",
    grandSlams: 0, grandSlamBreakdown: { ao: 0, rg: 0, wimbledon: 0, uso: 0 },
    tourTitles: 4, careerEarnings: "$7M+", careerWins: 220, careerLosses: 150,
    surfaceRecord: { hard: "160-100", clay: "40-35", grass: "20-18" },
    careerHighlights: [
      "2023 Australian Open semifinalist",
      "Consistent top-15 ATP player since 2023",
      "ATP 500 title at Washington DC",
      "One of the fastest improvers on tour in 2023",
      "Key Davis Cup performer for USA",
    ],
    bio: "Tommy Paul is a versatile American with excellent movement and a well-rounded game. He burst onto the scene with a deep run at the 2023 Australian Open and has maintained a consistent top-15 ranking.",
  },
  {
    sport: "tennis", name: "Hubert Hurkacz", league: "ATP",
    nationality: "Poland", born: "1997-02-11", age: 28,
    height: "6'5\"", plays: "Right-handed", turnedPro: 2016,
    currentRanking: "#8", peakRanking: "#7",
    grandSlams: 0, grandSlamBreakdown: { ao: 0, rg: 0, wimbledon: 0, uso: 0 },
    tourTitles: 12, careerEarnings: "$16M+", careerWins: 300, careerLosses: 165,
    surfaceRecord: { hard: "200-110", clay: "60-40", grass: "40-15" },
    careerHighlights: [
      "2021 Wimbledon semifinalist",
      "Won Miami Masters 2021",
      "Bageled Federer 6-0 in Wimbledon QF",
      "Consistent performer in Masters 1000 events",
      "Won ATP Finals group stage matches vs top-10",
    ],
    bio: "Hubert Hurkacz is Poland's top tennis player and one of the best servers on tour. His height, powerful serve, and net presence make him a consistent threat at major tournaments.",
  },
  {
    sport: "tennis", name: "Andrey Rublev", league: "ATP",
    nationality: "Russia", born: "1997-10-20", age: 27,
    height: "6'1\"", plays: "Right-handed", turnedPro: 2014,
    currentRanking: "#9", peakRanking: "#5",
    grandSlams: 0, grandSlamBreakdown: { ao: 0, rg: 0, wimbledon: 0, uso: 0 },
    tourTitles: 18, careerEarnings: "$18M+", careerWins: 380, careerLosses: 190,
    surfaceRecord: { hard: "230-110", clay: "120-60", grass: "30-20" },
    careerHighlights: [
      "Won 5 ATP 500 titles (most in a calendar year record in 2020)",
      "Consistent top-10 since 2020",
      "Monte-Carlo Masters champion 2023",
      "Dubai champion 2020, 2021, 2023",
      "Always finishes season with 50+ wins",
    ],
    bio: "Andrey Rublev is one of the hardest workers on the ATP tour. Known for his explosive forehand and relentless topspin, he has won 18+ titles across his career and maintains consistent top-10 status.",
  },
];

// ─── WTA WOMEN'S TENNIS ───────────────────────────────────────────────────────
export const WTA_PROFILES: TennisProfile[] = [
  {
    sport: "tennis", name: "Aryna Sabalenka", league: "WTA",
    nationality: "Belarus", born: "1998-05-05", age: 26,
    height: "5'11\"", plays: "Right-handed", turnedPro: 2015,
    currentRanking: "#1", peakRanking: "#1",
    grandSlams: 3, grandSlamBreakdown: { ao: 3, rg: 0, wimbledon: 0, uso: 0 },
    tourTitles: 18, careerEarnings: "$28M+", careerWins: 340, careerLosses: 125,
    surfaceRecord: { hard: "250-85", clay: "70-32", grass: "20-10" },
    careerHighlights: [
      "2023, 2024, 2025 Australian Open champion",
      "3 consecutive AO titles — first since Henin 2004-07",
      "WTA Year-End #1 in 2023 and 2024",
      "One of the most powerful servers in women's tennis",
      "2021 Wimbledon and US Open semifinalist",
    ],
    bio: "Aryna Sabalenka is a dominant force in women's tennis, known for her powerful serve and aggressive baseline play. The Belarusian star has won three consecutive Australian Open titles and maintained the world #1 ranking.",
  },
  {
    sport: "tennis", name: "Iga Swiatek", league: "WTA",
    nationality: "Poland", born: "2001-05-31", age: 23,
    height: "5'9\"", plays: "Right-handed", turnedPro: 2016,
    currentRanking: "#2", peakRanking: "#1",
    grandSlams: 5, grandSlamBreakdown: { ao: 0, rg: 4, wimbledon: 0, uso: 1 },
    tourTitles: 23, careerEarnings: "$30M+", careerWins: 360, careerLosses: 90,
    surfaceRecord: { hard: "180-55", clay: "160-25", grass: "20-15" },
    careerHighlights: [
      "5x Grand Slam champion — 4x Roland Garros",
      "Held #1 ranking for 125+ consecutive weeks",
      "37-match win streak in 2022 (Open Era record)",
      "Roland Garros title run — 50-3 record on clay majors",
      "2020 Roland Garros champion at age 19 (unseeded)",
      "WTA Year-End #1 in 2022, 2023",
    ],
    bio: "Iga Swiatek is the best clay court player of her generation and one of the most dominant players of the modern era. The Polish champion's topspin-heavy game and exceptional movement have produced five Grand Slam titles, with four coming at Roland Garros.",
  },
  {
    sport: "tennis", name: "Coco Gauff", league: "WTA",
    nationality: "USA", born: "2004-03-13", age: 20,
    height: "5'9\"", plays: "Right-handed", turnedPro: 2018,
    currentRanking: "#3", peakRanking: "#2",
    grandSlams: 1, grandSlamBreakdown: { ao: 0, rg: 0, wimbledon: 0, uso: 1 },
    tourTitles: 10, careerEarnings: "$15M+", careerWins: 200, careerLosses: 90,
    surfaceRecord: { hard: "130-55", clay: "55-25", grass: "20-12" },
    careerHighlights: [
      "2023 US Open champion (home crowd favorite)",
      "Youngest WTA Top-3 player in over a decade",
      "2019 Wimbledon debut — beat Venus Williams at 15",
      "2022 Roland Garros finalist",
      "Olympic gold medalist (doubles) at Tokyo 2020",
    ],
    bio: "Coco Gauff became a household name at 15 when she beat her idol Venus Williams at Wimbledon. The Georgia native combines exceptional athleticism with mental toughness and won her first Grand Slam at the 2023 US Open at age 19.",
  },
  {
    sport: "tennis", name: "Elena Rybakina", league: "WTA",
    nationality: "Kazakhstan", born: "1999-06-17", age: 25,
    height: "6'0\"", plays: "Right-handed", turnedPro: 2016,
    currentRanking: "#5", peakRanking: "#4",
    grandSlams: 1, grandSlamBreakdown: { ao: 0, rg: 0, wimbledon: 1, uso: 0 },
    tourTitles: 11, careerEarnings: "$16M+", careerWins: 240, careerLosses: 115,
    surfaceRecord: { hard: "160-75", clay: "55-28", grass: "25-10" },
    careerHighlights: [
      "2022 Wimbledon champion (def. Jabeur)",
      "2023 Australian Open finalist",
      "Biggest serve in women's tennis — 125+ mph",
      "Born in Russia, competes for Kazakhstan",
      "Multiple WTA 1000 titles",
    ],
    bio: "Elena Rybakina is one of the most powerful players on the WTA tour. Born in Moscow but representing Kazakhstan, her massive serve and clean ball-striking make her a dominant force on all surfaces, particularly grass.",
  },
  {
    sport: "tennis", name: "Madison Keys", league: "WTA",
    nationality: "USA", born: "1995-02-17", age: 30,
    height: "5'11\"", plays: "Right-handed", turnedPro: 2009,
    currentRanking: "#6", peakRanking: "#7",
    grandSlams: 1, grandSlamBreakdown: { ao: 1, rg: 0, wimbledon: 0, uso: 0 },
    tourTitles: 9, careerEarnings: "$14M+", careerWins: 340, careerLosses: 190,
    surfaceRecord: { hard: "220-120", clay: "80-50", grass: "40-22" },
    careerHighlights: [
      "2025 Australian Open champion",
      "2017 US Open finalist",
      "One of the most powerful hitters on tour",
      "Career renaissance in her late 20s",
      "American fan favorite since 2012 debut",
    ],
    bio: "Madison Keys is an American powerhouse who won the 2025 Australian Open in triumphant fashion. Known for her huge forehand and serve, she has been one of the most dangerous players on tour for over a decade.",
  },
  {
    sport: "tennis", name: "Jessica Pegula", league: "WTA",
    nationality: "USA", born: "1994-02-24", age: 31,
    height: "5'7\"", plays: "Right-handed", turnedPro: 2010,
    currentRanking: "#4", peakRanking: "#3",
    grandSlams: 0, grandSlamBreakdown: { ao: 0, rg: 0, wimbledon: 0, uso: 0 },
    tourTitles: 7, careerEarnings: "$12M+", careerWins: 280, careerLosses: 175,
    surfaceRecord: { hard: "200-120", clay: "60-38", grass: "20-18" },
    careerHighlights: [
      "Consistent top-5 WTA player since 2022",
      "2024 US Open finalist",
      "Owner of Buffalo Bills and Buffalo Sabres",
      "Multiple Slam quarterfinals and semifinals",
      "Reliable doubles partner and singles threat",
    ],
    bio: "Jessica Pegula, daughter of NFL Bills owner Terry Pegula, has become one of the most consistent players on the WTA tour. Her steady game and mental resilience have earned her a top-5 ranking and multiple deep Grand Slam runs.",
  },
];

// ─── UFC FIGHTERS ──────────────────────────────────────────────────────────────
export const UFC_PROFILES: CombatProfile[] = [
  {
    sport: "combat", name: "Jon Jones", league: "UFC",
    nationality: "USA", born: "1987-07-19", age: 37,
    height: "6'4\"", weight: "250 lbs", reach: "84.5\"", stance: "Orthodox",
    weightClass: "Heavyweight",
    record: { wins: 28, losses: 1, draws: 0, nc: 1 },
    byKoTko: 10, bySubmission: 5, byDecision: 13,
    titles: ["UFC Heavyweight Champion", "Former UFC Light Heavyweight Champion (13 defenses)"],
    titleDefenses: 13,
    careerHighlights: [
      "UFC Light Heavyweight Champion — 13 title defenses (record)",
      "Moved to Heavyweight, KO'd Ciryl Gane for vacant title (2023)",
      "Youngest UFC champion ever (at Light Heavyweight, 2011)",
      "Widely considered the GOAT of MMA",
      "Defeated Lyoto Machida, Rashad Evans, Vitor Belfort, Daniel Cormier (2x)",
      "Only loss: DQ vs Matt Hamill (2009), no losses by strikes in career",
    ],
    recentFights: [
      { year: 2023, opponent: "Ciryl Gane", result: "W", method: "Submission", round: 1, event: "UFC 285" },
      { year: 2024, opponent: "Stipe Miocic", result: "W", method: "KO/TKO", round: 3, event: "UFC 309" },
    ],
    bio: "Jon Jones is widely considered the greatest MMA fighter of all time. The Albuquerque-based fighter dominated the light heavyweight division for over a decade before moving to heavyweight to capture his second UFC title.",
  },
  {
    sport: "combat", name: "Islam Makhachev", league: "UFC",
    nationality: "Russia", born: "1991-10-27", age: 33,
    height: "5'11\"", weight: "155 lbs", reach: "70.5\"", stance: "Orthodox",
    weightClass: "Lightweight",
    record: { wins: 26, losses: 1, draws: 0 },
    byKoTko: 5, bySubmission: 12, byDecision: 9,
    titles: ["UFC Lightweight Champion"],
    titleDefenses: 5,
    careerHighlights: [
      "UFC Lightweight Champion — 5 title defenses",
      "Trained by Khabib Nurmagomedov",
      "Won title by submitting Charles Oliveira (2022)",
      "Defended vs Volkanovski twice, Poirier, Moicano",
      "Pound-for-pound #1 ranking in 2023-24",
      "15-fight win streak before title run",
    ],
    recentFights: [
      { year: 2024, opponent: "Dustin Poirier", result: "W", method: "Submission", round: 3, event: "UFC 302" },
      { year: 2025, opponent: "Renato Moicano", result: "W", method: "Submission", round: 1, event: "UFC 311" },
    ],
    bio: "Islam Makhachev is the reigning UFC Lightweight Champion and one of the most dominant grapplers in MMA history. Trained by Khabib Nurmagomedov, he combines elite wrestling with devastating submissions to control opponents.",
  },
  {
    sport: "combat", name: "Alex Pereira", league: "UFC",
    nationality: "Brazil", born: "1987-07-07", age: 37,
    height: "6'4\"", weight: "205 lbs", reach: "79\"", stance: "Orthodox",
    weightClass: "Light Heavyweight",
    record: { wins: 12, losses: 2, draws: 0 },
    byKoTko: 9, bySubmission: 0, byDecision: 3,
    titles: ["UFC Light Heavyweight Champion", "Former UFC Middleweight Champion"],
    titleDefenses: 4,
    careerHighlights: [
      "2-division UFC champion (MW and LHW)",
      "Knocked out Israel Adesanya twice (MMA and kickboxing)",
      "GLORY Kickboxing Middleweight & Light Heavyweight Champion",
      "4 title defenses at Light Heavyweight",
      "Most knockout power in any UFC champion of the era",
      "Defeated Jiri Prochazka, Jamahal Hill, Magomed Ankalaev",
    ],
    recentFights: [
      { year: 2024, opponent: "Jiri Prochazka", result: "W", method: "KO/TKO", round: 4, event: "UFC 303" },
      { year: 2024, opponent: "Khalil Rountree", result: "W", method: "KO/TKO", round: 3, event: "UFC 307" },
    ],
    bio: "Alex 'Poatan' Pereira is a former kickboxing world champion turned UFC two-division champion. Known for his devastating knockout power, he has finished some of the best fighters in the world on his way to holding two UFC titles simultaneously.",
  },
  {
    sport: "combat", name: "Conor McGregor", league: "UFC",
    nationality: "Ireland", born: "1988-07-14", age: 36,
    height: "5'9\"", weight: "170 lbs", reach: "74\"", stance: "Southpaw",
    weightClass: "Welterweight",
    record: { wins: 22, losses: 6, draws: 0 },
    byKoTko: 19, bySubmission: 1, byDecision: 2,
    titles: ["Former UFC Featherweight Champion", "Former UFC Lightweight Champion"],
    titleDefenses: 0,
    careerHighlights: [
      "First UFC fighter to hold two titles simultaneously",
      "KO'd Jose Aldo in 13 seconds (fastest championship KO in UFC history)",
      "Famous wins over Eddie Alvarez, Donald Cerrone, Marcus Brimage",
      "Boxing match vs Floyd Mayweather (2017) — $600M gate",
      "Most PPV buys in UFC history",
      "Held featherweight and lightweight titles simultaneously in 2016",
    ],
    bio: "Conor McGregor is the biggest star in MMA history and a cultural phenomenon. The Dubliner became the first fighter to simultaneously hold two UFC championship belts and his rivalry with Khabib Nurmagomedov is one of sport's most memorable.",
  },
  {
    sport: "combat", name: "Sean O'Malley", league: "UFC",
    nationality: "USA", born: "1994-10-24", age: 30,
    height: "5'11\"", weight: "135 lbs", reach: "72\"", stance: "Southpaw",
    weightClass: "Bantamweight",
    record: { wins: 18, losses: 2, draws: 0 },
    byKoTko: 12, bySubmission: 0, byDecision: 6,
    titles: ["Former UFC Bantamweight Champion"],
    titleDefenses: 1,
    careerHighlights: [
      "UFC Bantamweight Champion 2023-2024",
      "KO'd Aljamain Sterling to win title (2023)",
      "Defended title vs Marlon Vera at UFC 299",
      "14+ fight win streak before title reign",
      "Won TUF (The Ultimate Fighter) 2017",
    ],
    bio: "Sean O'Malley, known as 'Sugar', is one of the most exciting fighters in the UFC with his unconventional striking and knockout power. The Montana native won the bantamweight title with a stunning KO of Aljamain Sterling.",
  },
  {
    sport: "combat", name: "Ilia Topuria", league: "UFC",
    nationality: "Georgia", born: "2000-01-21", age: 25,
    height: "5'8\"", weight: "145 lbs", reach: "71\"", stance: "Orthodox",
    weightClass: "Featherweight",
    record: { wins: 16, losses: 0, draws: 0 },
    byKoTko: 10, bySubmission: 4, byDecision: 2,
    titles: ["UFC Featherweight Champion"],
    titleDefenses: 1,
    careerHighlights: [
      "Undefeated UFC Featherweight Champion",
      "KO'd Alexander Volkanovski in Round 2 (UFC 298, 2024)",
      "Defended title vs Max Holloway at UFC 308",
      "Youngest UFC featherweight champion",
      "Perfect 16-0 professional record",
      "Competed at 145 lbs undefeated while being Georgian-Spanish",
    ],
    bio: "Ilia Topuria is an undefeated Georgian-Spanish champion who shocked the world by knocking out the previously unbeatable Alexander Volkanovski. At just 24, he became one of the most feared featherweights in history.",
  },
  {
    sport: "combat", name: "Leon Edwards", league: "UFC",
    nationality: "Great Britain", born: "1991-08-25", age: 33,
    height: "6'1\"", weight: "170 lbs", reach: "74\"", stance: "Orthodox",
    weightClass: "Welterweight",
    record: { wins: 22, losses: 3, draws: 0, nc: 1 },
    byKoTko: 9, bySubmission: 2, byDecision: 11,
    titles: ["Former UFC Welterweight Champion"],
    titleDefenses: 2,
    careerHighlights: [
      "KO'd Kamaru Usman with a head kick in Round 5 to win title (UFC 278)",
      "One of the greatest comebacks in UFC history",
      "Defended title vs Colby Covington and Kamaru Usman III",
      "10-fight win streak before title win",
      "Born in Jamaica, raised in Birmingham, UK",
    ],
    bio: "Leon Edwards delivered one of MMA's most memorable moments — knocking out Kamaru Usman with a head kick with just 1 minute remaining to claim the welterweight title. The Jamaican-born British fighter is a well-rounded world champion.",
  },
  {
    sport: "combat", name: "Dricus Du Plessis", league: "UFC",
    nationality: "South Africa", born: "1994-01-04", age: 31,
    height: "6'0\"", weight: "185 lbs", reach: "75.5\"", stance: "Orthodox",
    weightClass: "Middleweight",
    record: { wins: 22, losses: 2, draws: 0 },
    byKoTko: 11, bySubmission: 5, byDecision: 6,
    titles: ["UFC Middleweight Champion"],
    titleDefenses: 2,
    careerHighlights: [
      "First African UFC champion",
      "Won title by split decision vs Sean Strickland (UFC 297)",
      "Defended vs Israel Adesanya at UFC 305",
      "Unorthodox striking style with elite grappling",
      "Has beaten champions Adesanya and Strickland in same division",
    ],
    bio: "Dricus Du Plessis is South Africa's first UFC champion and one of the most technical fighters in the middleweight division. His relentless pressure and wrestling-heavy game plan have earned him victories over multiple champions.",
  },
  {
    sport: "combat", name: "Alexandre Pantoja", league: "UFC",
    nationality: "Brazil", born: "1990-07-15", age: 34,
    height: "5'5\"", weight: "125 lbs", reach: "65\"", stance: "Orthodox",
    weightClass: "Flyweight",
    record: { wins: 28, losses: 5, draws: 0 },
    byKoTko: 5, bySubmission: 13, byDecision: 10,
    titles: ["UFC Flyweight Champion"],
    titleDefenses: 3,
    careerHighlights: [
      "UFC Flyweight Champion with 3 title defenses",
      "Best submission artist in flyweight division",
      "Won title vs Brandon Moreno at UFC 290",
      "Trilogy with Brandon Moreno — one of UFC's best rivalries",
      "Brazil's flyweight king",
    ],
    bio: "Alexandre Pantoja is the UFC's flyweight king — a relentless submission artist who took over the flyweight division with technical grappling and iron determination. His rivalry with Brandon Moreno has produced some of the best fights in flyweight history.",
  },
  {
    sport: "combat", name: "Merab Dvalishvili", league: "UFC",
    nationality: "Georgia", born: "1991-05-10", age: 33,
    height: "5'7\"", weight: "135 lbs", reach: "67\"", stance: "Orthodox",
    weightClass: "Bantamweight",
    record: { wins: 17, losses: 4, draws: 0 },
    byKoTko: 2, bySubmission: 4, byDecision: 11,
    titles: ["UFC Bantamweight Champion"],
    titleDefenses: 1,
    careerHighlights: [
      "UFC Bantamweight Champion — won vs Sean O'Malley at UFC 306",
      "Elite wrestling volume — 10+ takedowns per fight",
      "Best friend and training partner of Islam Makhachev",
      "Won 9 consecutive fights before title win",
      "Suffocating pressure style makes every opponent struggle",
    ],
    bio: "Merab Dvalishvili is the Georgian grappling machine who took the UFC bantamweight title with his tireless wrestling and cardio. Friends with Islam Makhachev, he is part of the dominant AKA wrestling-based camp.",
  },
  {
    sport: "combat", name: "Khamzat Chimaev", league: "UFC",
    nationality: "Sweden", born: "1994-05-01", age: 30,
    height: "6'2\"", weight: "185 lbs", reach: "78\"", stance: "Orthodox",
    weightClass: "Middleweight",
    record: { wins: 13, losses: 0, draws: 0 },
    byKoTko: 6, bySubmission: 4, byDecision: 3,
    titles: [],
    careerHighlights: [
      "Undefeated — 13-0 professional record",
      "First fighter in UFC history to win bouts in two weight classes in same week",
      "Beat Nate Diaz, Gilbert Burns, Kevin Holland, Robert Whittaker",
      "Born in Chechnya, raised and fights out of Sweden",
      "Nicknamed 'Borz' (Wolf in Chechen)",
    ],
    bio: "Khamzat Chimaev is one of the most dominant and physically imposing fighters in the UFC. The undefeated Chechen-Swedish fighter combines elite wrestling with knockout power, making him a nightmare matchup at any weight class.",
  },
];

// ─── BOXING CHAMPIONS ─────────────────────────────────────────────────────────
export const BOXING_PROFILES: CombatProfile[] = [
  {
    sport: "combat", name: "Canelo Alvarez", league: "BOXING",
    nationality: "Mexico", born: "1990-07-18", age: 34,
    height: "5'8\"", weight: "168 lbs", reach: "70.5\"", stance: "Orthodox",
    weightClass: "Super Middleweight",
    record: { wins: 61, losses: 2, draws: 2 },
    byKoTko: 39, bySubmission: 0, byDecision: 22,
    titles: ["WBA/WBC/IBF/WBO Super Middleweight Champion (Undisputed)"],
    titleDefenses: 9,
    careerHighlights: [
      "Undisputed Super Middleweight Champion (all 4 major belts)",
      "Beat Gennady Golovkin trilogy — defining rivalry",
      "Only losses: Floyd Mayweather Jr (2013) and Dmitry Bivol (2022)",
      "World champion in 4 weight classes",
      "Mexico's most celebrated active boxer",
      "Ring Magazine Fighter of the Year multiple times",
    ],
    bio: "Saúl 'Canelo' Alvarez is Mexico's greatest boxer and the undisputed super middleweight champion. His technical mastery, pinpoint counter-punching, and relentless pressure have made him the biggest star in boxing today.",
  },
  {
    sport: "combat", name: "Oleksandr Usyk", league: "BOXING",
    nationality: "Ukraine", born: "1987-01-17", age: 38,
    height: "6'3\"", weight: "215 lbs", reach: "78\"", stance: "Southpaw",
    weightClass: "Heavyweight",
    record: { wins: 22, losses: 0, draws: 0 },
    byKoTko: 14, bySubmission: 0, byDecision: 8,
    titles: ["Undisputed Heavyweight Champion (WBA/WBC/IBF/WBO)"],
    titleDefenses: 2,
    careerHighlights: [
      "Undisputed Heavyweight Champion — unified all 4 belts",
      "Previously Undisputed Cruiserweight Champion",
      "Beat Anthony Joshua twice",
      "Beat Tyson Fury by split decision (May 2024) — first undisputed HW since Lennox Lewis",
      "WBA Cruiserweight World Series (WBSS) Ali Trophy winner",
      "2012 Olympic Gold Medal (London) — Super Heavyweight",
    ],
    bio: "Oleksandr Usyk is the undisputed heavyweight champion of the world and arguably the best boxer of the modern era. The Ukrainian southpaw won every major belt at cruiserweight before moving to heavyweight and defeating both Anthony Joshua and Tyson Fury.",
  },
  {
    sport: "combat", name: "Naoya Inoue", league: "BOXING",
    nationality: "Japan", born: "1993-04-10", age: 31,
    height: "5'5\"", weight: "122 lbs", reach: "67\"", stance: "Orthodox",
    weightClass: "Super Bantamweight",
    record: { wins: 28, losses: 0, draws: 0 },
    byKoTko: 25, bySubmission: 0, byDecision: 3,
    titles: ["Undisputed Super Bantamweight Champion (WBC/WBA/IBF/WBO)"],
    titleDefenses: 3,
    careerHighlights: [
      "Undisputed Super Bantamweight Champion",
      "Previously Undisputed Bantamweight Champion",
      "89% knockout rate — one of the highest in boxing history",
      "Ring Magazine Fighter of the Year 2019 & 2023",
      "3-weight class world champion",
      "Nicknamed 'The Monster' for his devastating power",
    ],
    bio: "Naoya 'The Monster' Inoue is Japan's greatest boxer and a pound-for-pound king known for his extraordinary knockout power relative to his size. He has unified all four major belts at bantamweight and super bantamweight.",
  },
  {
    sport: "combat", name: "Dmitry Bivol", league: "BOXING",
    nationality: "Russia", born: "1990-12-18", age: 34,
    height: "6'1\"", weight: "175 lbs", reach: "74\"", stance: "Orthodox",
    weightClass: "Light Heavyweight",
    record: { wins: 23, losses: 0, draws: 0 },
    byKoTko: 11, bySubmission: 0, byDecision: 12,
    titles: ["WBA Light Heavyweight Champion"],
    titleDefenses: 8,
    careerHighlights: [
      "WBA Light Heavyweight World Champion — 8 defenses",
      "Famous upset over Canelo Alvarez (2022) — only 2nd pro loss",
      "Born in Russia, trained in Kyrgyzstan",
      "Master technician — textbook boxer with elite footwork",
      "Rematch with Canelo rumored for 2025",
    ],
    bio: "Dmitry Bivol is one of boxing's most skilled technicians and the WBA Light Heavyweight Champion. His victory over Canelo Alvarez in 2022 stands as one of the biggest upsets in recent boxing history and cemented his place among the elite.",
  },
  {
    sport: "combat", name: "Gervonta Davis", league: "BOXING",
    nationality: "USA", born: "1994-11-07", age: 30,
    height: "5'6\"", weight: "135 lbs", reach: "67.5\"", stance: "Southpaw",
    weightClass: "Lightweight",
    record: { wins: 29, losses: 0, draws: 0 },
    byKoTko: 27, bySubmission: 0, byDecision: 2,
    titles: ["WBA Lightweight Champion"],
    titleDefenses: 3,
    careerHighlights: [
      "3-weight class world champion (super feather, light, super light)",
      "93% knockout rate — extraordinary punching power",
      "Promoted by Floyd Mayweather Jr",
      "Beat Ryan Garcia with body shot KO (2023)",
      "TKO'd Gervonta 'Tank' Davis's opponents in spectacular fashion repeatedly",
    ],
    bio: "Gervonta 'Tank' Davis is one of the most electrifying fighters in boxing, boasting a 93% knockout rate and three world titles across different weight classes. His devastating left hand makes him one of the most feared punchers in the sport.",
  },
  {
    sport: "combat", name: "Anthony Joshua", league: "BOXING",
    nationality: "Great Britain", born: "1989-10-15", age: 35,
    height: "6'6\"", weight: "240 lbs", reach: "82\"", stance: "Orthodox",
    weightClass: "Heavyweight",
    record: { wins: 28, losses: 4, draws: 0 },
    byKoTko: 25, bySubmission: 0, byDecision: 3,
    titles: ["Former WBA/IBF/WBO Heavyweight Champion"],
    titleDefenses: 4,
    careerHighlights: [
      "2x World Heavyweight Champion (IBF, WBA, WBO)",
      "2012 Olympic Gold Medalist (London)",
      "Legendary win vs Wladimir Klitschko at Wembley (90,000+)",
      "Beaten 4 times: Ruiz, Usyk (twice), and one more",
      "Comeback wins after Ruiz upset (2019 rematch)",
      "One of the most popular sports figures in UK history",
    ],
    bio: "Anthony Joshua is Britain's most decorated heavyweight boxer and a 2012 Olympic gold medalist. Despite setbacks against Usyk and Ruiz, he remains one of boxing's biggest stars and a two-time world heavyweight champion.",
  },
];

// ─── X GAMES ATHLETES ─────────────────────────────────────────────────────────
export const XGAMES_PROFILES: XGamesProfile[] = [
  {
    sport: "xgames", name: "Tony Hawk", league: "XGAMES",
    nationality: "USA", born: "1968-05-12", age: 56,
    disciplines: ["Skateboarding — Vert"],
    goldMedals: 9, silverMedals: 3, bronzeMedals: 1, totalMedals: 13,
    careerHighlights: [
      "First person to land a 900 in competition (1999 X Games)",
      "9 X Games gold medals in vert skateboarding",
      "Pro Skater series — best-selling skateboarding game franchise ever",
      "Turned professional at age 14 (1982)",
      "Dominated vert skating throughout the 1980s and 90s",
      "Inducted into Skateboarding Hall of Fame",
    ],
    bio: "Tony Hawk is the most recognizable skateboarder in history. His 1999 X Games performance — landing the first-ever 900 on a vert ramp — remains one of sport's greatest moments. He has won 9 X Games gold medals and transformed skateboarding into a global phenomenon.",
  },
  {
    sport: "xgames", name: "Shaun White", league: "XGAMES",
    nationality: "USA", born: "1986-09-03", age: 38,
    disciplines: ["Snowboarding — Halfpipe", "Skateboarding — Vert"],
    goldMedals: 18, silverMedals: 3, bronzeMedals: 2, totalMedals: 23,
    careerHighlights: [
      "3x Olympic Gold Medalist in Halfpipe (2006, 2010, 2018)",
      "23 X Games medals — most in history (18 gold)",
      "Only athlete to medal in both Summer and Winter X Games",
      "Inventor of the 'Double McTwist 1260' in halfpipe",
      "Nicknamed 'The Flying Tomato' for his red hair",
      "Retired after 2022 Beijing Olympics",
    ],
    bio: "Shaun White is the most decorated X Games athlete of all time with 23 total medals. He dominated both halfpipe snowboarding and vert skateboarding for two decades, winning three Olympic gold medals and 18 X Games gold medals.",
  },
  {
    sport: "xgames", name: "Nyjah Huston", league: "XGAMES",
    nationality: "USA", born: "1994-11-30", age: 30,
    disciplines: ["Skateboarding — Street"],
    goldMedals: 12, silverMedals: 4, bronzeMedals: 2, totalMedals: 18,
    careerHighlights: [
      "Most X Games gold medals in skateboard street (12)",
      "18 total X Games medals",
      "2020 Tokyo Olympics — skateboarding inaugural year (USA)",
      "Dominated street skateboarding from age 7",
      "Multiple Tampa Pro and Street League championships",
      "Youngest ever to be named Street League champion",
    ],
    bio: "Nyjah Huston is the most dominant street skateboarder of his generation with 12 X Games gold medals. He has been competing professionally since childhood and transformed street skating with his technical precision and consistency.",
  },
  {
    sport: "xgames", name: "Kelly Slater", league: "XGAMES",
    nationality: "USA", born: "1972-02-11", age: 53,
    disciplines: ["Surfing"],
    goldMedals: 7, silverMedals: 2, bronzeMedals: 3, totalMedals: 12,
    careerHighlights: [
      "11x World Surf League Champion — most in history",
      "World Champion from age 20 to age 39",
      "First and only 11-time WSL champion",
      "Inducted into the International Surfing Association Hall of Fame",
      "Developed the Surf Ranch artificial wave pool",
    ],
    bio: "Kelly Slater is the greatest surfer in history with 11 World Surf League championships spanning from 1992 to 2011. The Florida native revolutionized competitive surfing with his progressive maneuvers and superhuman consistency.",
  },
  {
    sport: "xgames", name: "Travis Pastrana", league: "XGAMES",
    nationality: "USA", born: "1983-10-08", age: 41,
    disciplines: ["Moto X", "Rally Racing", "Stunt Performance"],
    goldMedals: 11, silverMedals: 7, bronzeMedals: 2, totalMedals: 20,
    careerHighlights: [
      "First double backflip in competition history (2006 X Games)",
      "11 X Games gold medals in Moto X and Supercross",
      "NASCAR and Rally Car racing career",
      "Jumped the Grand Canyon on a motorcycle for TV special",
      "Founded Nitro Circus touring stunt show",
    ],
    bio: "Travis Pastrana is action sports' ultimate daredevil. He became the first person to land a double backflip on a motorcycle in competition, has won 11 X Games gold medals, and founded the global Nitro Circus franchise.",
  },
  {
    sport: "xgames", name: "Mark McMorris", league: "XGAMES",
    nationality: "Canada", born: "1993-12-09", age: 31,
    disciplines: ["Snowboarding — Slopestyle", "Snowboarding — Big Air"],
    goldMedals: 8, silverMedals: 5, bronzeMedals: 3, totalMedals: 16,
    careerHighlights: [
      "3x Olympic bronze medalist (Slopestyle and Big Air)",
      "Most X Games snowboard slopestyle medals of all time",
      "Returned to win X Games gold months after near-fatal crash in 2017",
      "Triple cork 1440 — his signature move",
      "14 consecutive X Games appearances and podiums",
    ],
    bio: "Mark McMorris is Canada's most decorated snowboarder and one of the most resilient athletes in action sports. He survived a life-threatening crash in 2017 and returned months later to win an Olympic medal — one of sport's great comeback stories.",
  },
];

// ─── OLYMPICS ATHLETES ────────────────────────────────────────────────────────
export const OLYMPICS_PROFILES: OlympicsProfile[] = [
  {
    sport: "olympics", name: "Simone Biles", league: "OLYMPICS",
    nationality: "USA", born: "1997-03-14", age: 27,
    discipline: "Gymnastics",
    goldMedals: 7, silverMedals: 2, bronzeMedals: 2, totalMedals: 11,
    careerHighlights: [
      "7 Olympic gold medals — most decorated American gymnast ever",
      "2024 Paris Olympics: 4 gold medals at age 27",
      "30 World Championship medals (23 gold) — most in history",
      "4 skills named after her in the gymnastics Code of Points",
      "Returned from mental health withdrawal at 2020 Tokyo to win at Paris 2024",
      "Considered the greatest gymnast of all time",
    ],
    medals: [
      { year: 2016, city: "Rio", event: "Team", color: "Gold" },
      { year: 2016, city: "Rio", event: "All-Around", color: "Gold" },
      { year: 2016, city: "Rio", event: "Floor Exercise", color: "Gold" },
      { year: 2016, city: "Rio", event: "Vault", color: "Gold" },
      { year: 2024, city: "Paris", event: "Team", color: "Gold" },
      { year: 2024, city: "Paris", event: "All-Around", color: "Gold" },
      { year: 2024, city: "Paris", event: "Vault", color: "Gold" },
      { year: 2024, city: "Paris", event: "Floor Exercise", color: "Gold" },
    ],
    bio: "Simone Biles is the greatest gymnast in history. Her 7 Olympic gold medals and 23 World Championship gold medals are unmatched, and she has four gymnastic skills officially named after her. Her return from mental health challenges to win 4 golds at Paris 2024 is one of sport's greatest comebacks.",
  },
  {
    sport: "olympics", name: "Usain Bolt", league: "OLYMPICS",
    nationality: "Jamaica", born: "1986-08-21", age: 38,
    discipline: "Track & Field — Sprints",
    goldMedals: 8, silverMedals: 0, bronzeMedals: 2, totalMedals: 10,
    careerHighlights: [
      "100m world record: 9.58s (2009 Berlin)",
      "200m world record: 19.19s (2009 Berlin)",
      "8 Olympic gold medals across 3 Olympics",
      "Triple-triple: 100m, 200m, 4x100m relay gold at 3 Olympics (2008, 2012, 2016)",
      "Only man to hold both 100m and 200m world records simultaneously",
      "Nicknamed 'Lightning Bolt' — most celebrated track athlete ever",
    ],
    bio: "Usain Bolt is the fastest man in human history and the most dominant sprinter of all time. His 100m world record of 9.58 seconds set in Berlin may stand forever. He won the 100m, 200m, and 4x100m relay gold at three consecutive Olympics (2008-2016).",
  },
  {
    sport: "olympics", name: "Michael Phelps", league: "OLYMPICS",
    nationality: "USA", born: "1985-06-30", age: 39,
    discipline: "Swimming",
    goldMedals: 23, silverMedals: 3, bronzeMedals: 2, totalMedals: 28,
    careerHighlights: [
      "28 Olympic medals — most in history",
      "23 Olympic gold medals — most in history",
      "Won 8 gold medals in one Olympics (2008 Beijing)",
      "Won gold medals at 4 Olympics (2000, 2004, 2008, 2012, 2016)",
      "39 World Championship medals (26 gold)",
      "World record in 7 events",
    ],
    bio: "Michael Phelps is the most decorated Olympian in history with 28 medals (23 gold). His 2008 Beijing performance — winning 8 gold medals in 8 events — is considered the greatest single Olympic performance ever.",
  },
  {
    sport: "olympics", name: "Noah Lyles", league: "OLYMPICS",
    nationality: "USA", born: "2000-07-18", age: 24,
    discipline: "Track & Field — Sprints",
    goldMedals: 1, silverMedals: 0, bronzeMedals: 2, totalMedals: 3,
    careerHighlights: [
      "2024 Paris Olympics 100m champion (9.79s)",
      "5x World Championship gold medals",
      "World 200m champion 2022, 2023",
      "4x100m relay world champion",
      "Known for his personality — 'NBA level' entertainment",
      "Outspoken advocate for track and field's growth",
    ],
    bio: "Noah Lyles is the new face of global sprinting. The American superstar won the 100m gold at the 2024 Paris Olympics in one of the closest finishes in history (5 thousandths of a second) and is aiming to become the next Usain Bolt.",
  },
  {
    sport: "olympics", name: "Sydney McLaughlin-Levrone", league: "OLYMPICS",
    nationality: "USA", born: "1999-08-07", age: 25,
    discipline: "Track & Field — 400m Hurdles",
    goldMedals: 4, silverMedals: 0, bronzeMedals: 0, totalMedals: 4,
    careerHighlights: [
      "4x Olympic gold medalist",
      "World record holder at 400m hurdles — 50.37s (2024 Paris)",
      "Has broken her own world record 6 times",
      "Undefeated in Olympic competition",
      "Youngest US Olympic track team member at Tokyo 2020",
    ],
    bio: "Sydney McLaughlin-Levrone is the fastest 400m hurdler in history, breaking her own world record repeatedly. The New Jersey native is undefeated in Olympic competition and has broken the world record 6 times in her young career.",
  },
  {
    sport: "olympics", name: "Armand Mondo Duplantis", league: "OLYMPICS",
    nationality: "Sweden", born: "1999-11-10", age: 25,
    discipline: "Track & Field — Pole Vault",
    goldMedals: 2, silverMedals: 0, bronzeMedals: 0, totalMedals: 2,
    careerHighlights: [
      "World record holder — 6.24m (2024)",
      "Has broken world record 10+ times",
      "2020 Tokyo & 2024 Paris Olympic gold",
      "2-time World Champion",
      "Born to Swedish-American parents, competes for Sweden",
      "Called 'Mondo' since childhood — dominates every competition",
    ],
    bio: "Armand 'Mondo' Duplantis is redefining what's possible in pole vault. The Swedish-American prodigy has broken the world record over 10 times and is considered by many to be unbeatable in his event for years to come.",
  },
  {
    sport: "olympics", name: "Leon Marchand", league: "OLYMPICS",
    nationality: "France", born: "2002-05-17", age: 22,
    discipline: "Swimming",
    goldMedals: 5, silverMedals: 0, bronzeMedals: 1, totalMedals: 6,
    careerHighlights: [
      "2024 Paris Olympics: 4 individual gold + 1 relay gold",
      "World records in 200m, 400m Individual Medley",
      "Broke Michael Phelps' 200m IM world record (15 years old)",
      "Trained by Bob Bowman (Phelps' former coach)",
      "Became national hero in France at Paris 2024",
    ],
    bio: "Leon Marchand is France's swimming superstar and one of the most remarkable athletes at the Paris 2024 Olympics. He won 4 individual gold medals in his home country, breaking world records in the process and being coached by Michael Phelps' legendary coach Bob Bowman.",
  },
];

// ─── Lookup helper ────────────────────────────────────────────────────────────
const ALL_PROFILES: AthleteProfile[] = [
  ...ATP_PROFILES,
  ...WTA_PROFILES,
  ...UFC_PROFILES,
  ...BOXING_PROFILES,
  ...XGAMES_PROFILES,
  ...OLYMPICS_PROFILES,
];

export function getAthleteProfile(name: string): AthleteProfile | null {
  const normalized = name.toLowerCase().trim();
  return ALL_PROFILES.find(p =>
    p.name.toLowerCase() === normalized ||
    p.name.toLowerCase().includes(normalized) ||
    normalized.includes(p.name.toLowerCase())
  ) ?? null;
}

export function getProfilesByLeague(league: string): AthleteProfile[] {
  return ALL_PROFILES.filter(p => p.league === league.toUpperCase());
}
