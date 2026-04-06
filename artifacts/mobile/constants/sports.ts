import Colors from "./colors";

const C = Colors.dark;

export const SPORTS = [
  { id: "NBA",      label: "NBA",              icon: "basketball",  color: C.nba      },
  { id: "NHL",      label: "NHL",              icon: "snow",        color: C.nhl      },
  { id: "NFL",      label: "NFL",              icon: "football",    color: C.nfl      },
  { id: "MLB",      label: "MLB",              icon: "baseball",    color: C.mlb      },
  { id: "NCAAB",    label: "NCAA Basketball",  icon: "school",      color: C.ncaab    },
  { id: "MLS",      label: "MLS",              icon: "football",    color: C.mls      },
  { id: "EPL",      label: "Premier League",   icon: "football",    color: C.eplBright },
  { id: "UCL",      label: "Champions Lge",    icon: "star",        color: C.ucl      },
  { id: "LIGA",     label: "La Liga",          icon: "football",    color: C.liga     },
  { id: "WNBA",     label: "WNBA",             icon: "basketball",  color: C.wnba     },
  { id: "UFC",      label: "UFC / MMA",        icon: "fitness",     color: C.ufc      },
  { id: "BOXING",   label: "Boxing",           icon: "hand-left",   color: C.boxing   },
  { id: "ATP",      label: "ATP Tennis",       icon: "tennisball",  color: C.atp      },
  { id: "WTA",      label: "WTA Tennis",       icon: "tennisball",  color: C.wta      },
  { id: "OLYMPICS", label: "Olympics",         icon: "medal",       color: C.olympics },
  { id: "XGAMES",   label: "X Games",          icon: "bicycle",     color: C.xgames   },
];

export const TEAMS_BY_LEAGUE: Record<string, string[]> = {
  NFL: [
    "Kansas City Chiefs", "Buffalo Bills", "Philadelphia Eagles",
    "Baltimore Ravens", "Houston Texans", "Detroit Lions",
    "Los Angeles Rams", "Minnesota Vikings", "Denver Broncos",
    "San Francisco 49ers", "Dallas Cowboys", "Miami Dolphins",
    "Washington Commanders", "Cincinnati Bengals", "New England Patriots",
    "Green Bay Packers", "Chicago Bears", "New Orleans Saints",
  ],
  NBA: [
    "Houston Rockets", "Los Angeles Lakers", "Boston Celtics",
    "Oklahoma City Thunder", "San Antonio Spurs", "Detroit Pistons",
    "Cleveland Cavaliers", "Minnesota Timberwolves", "Denver Nuggets",
    "New York Knicks", "Golden State Warriors", "Miami Heat",
    "Dallas Mavericks", "Phoenix Suns", "Milwaukee Bucks",
    "Indiana Pacers", "Atlanta Hawks", "Sacramento Kings",
    "Memphis Grizzlies", "New Orleans Pelicans", "Orlando Magic",
  ],
  MLB: [
    "Houston Astros", "New York Yankees", "Los Angeles Dodgers",
    "Atlanta Braves", "Boston Red Sox", "San Diego Padres",
    "Seattle Mariners", "Philadelphia Phillies", "Baltimore Orioles",
    "Texas Rangers", "Chicago Cubs", "Toronto Blue Jays",
    "New York Mets", "San Francisco Giants", "Cleveland Guardians",
    "Minnesota Twins", "Pittsburgh Pirates", "Tampa Bay Rays",
  ],
  NHL: [
    "Vegas Golden Knights", "Boston Bruins", "Colorado Avalanche",
    "New York Rangers", "Toronto Maple Leafs", "Carolina Hurricanes",
    "Edmonton Oilers", "Florida Panthers", "Dallas Stars",
    "Tampa Bay Lightning", "New Jersey Devils", "Pittsburgh Penguins",
    "Washington Capitals", "Nashville Predators", "Los Angeles Kings",
    "Seattle Kraken", "Winnipeg Jets", "Ottawa Senators",
  ],
  WNBA: [
    "Las Vegas Aces", "New York Liberty", "Seattle Storm",
    "Connecticut Sun", "Chicago Sky", "Dallas Wings",
    "Minnesota Lynx", "Los Angeles Sparks", "Indiana Fever",
    "Phoenix Mercury", "Washington Mystics", "Atlanta Dream",
  ],
  NCAAB: [
    "Duke Blue Devils", "Kansas Jayhawks", "Kentucky Wildcats",
    "North Carolina Tar Heels", "Gonzaga Bulldogs", "Michigan State Spartans",
    "Alabama Crimson Tide", "Houston Cougars", "Auburn Tigers",
    "Tennessee Volunteers", "Arizona Wildcats", "Purdue Boilermakers",
    "Connecticut Huskies", "UCLA Bruins", "Villanova Wildcats",
  ],
  MLS: [
    "Houston Dynamo", "Vancouver Whitecaps", "Los Angeles FC",
    "Inter Miami CF", "New England Revolution", "LA Galaxy",
    "Atlanta United", "New York City FC", "Nashville SC",
    "Portland Timbers", "Seattle Sounders", "Austin FC",
    "Charlotte FC", "San Diego FC", "St. Louis City SC",
  ],
  EPL: [
    "Arsenal", "Manchester City", "Liverpool", "Chelsea",
    "Manchester United", "Tottenham Hotspur", "Newcastle United",
    "Aston Villa", "Brighton", "West Ham United",
    "Everton", "Fulham", "Crystal Palace",
  ],
  UCL: [
    "Real Madrid", "Manchester City", "Bayern Munich", "PSG",
    "Arsenal", "Liverpool", "Barcelona", "Atletico Madrid",
    "Juventus", "Inter Milan", "Borussia Dortmund", "Porto",
  ],
  LIGA: [
    "Real Madrid", "Barcelona", "Atletico Madrid", "Sevilla",
    "Real Sociedad", "Villarreal", "Athletic Club", "Valencia",
    "Real Betis", "Osasuna",
  ],
  BUN: [
    "Bayern Munich", "Borussia Dortmund", "RB Leipzig",
    "Bayer Leverkusen", "VfB Stuttgart", "Eintracht Frankfurt",
  ],
  SERA: [
    "Inter Milan", "AC Milan", "Juventus", "Napoli",
    "AS Roma", "Atalanta", "Lazio", "Fiorentina",
  ],
  LIG1: [
    "Paris Saint-Germain", "Marseille", "Monaco",
    "Lyon", "Lille", "Nice",
  ],
  NWSL: [
    "Portland Thorns", "Kansas City Current", "OL Reign",
    "NJ/NY Gotham FC", "San Diego Wave", "Angel City FC",
  ],
  UEL: [
    "Roma", "Ajax", "Lazio", "Athletic Club",
    "Tottenham Hotspur", "Eintracht Frankfurt",
  ],
  UECL: [
    "Fiorentina", "Chelsea", "Real Betis", "Olympiacos",
  ],
  FWCM: [
    "Brazil", "France", "Argentina", "Germany", "England", "Spain",
  ],
  EURO: [
    "France", "Germany", "Spain", "England", "Italy", "Portugal",
  ],
  COPA: [
    "Argentina", "Brazil", "Uruguay", "Colombia", "Chile",
  ],
  UFC: [
    "Jon Jones", "Islam Makhachev", "Alex Pereira", "Ilia Topuria",
    "Leon Edwards", "Dricus Du Plessis", "Merab Dvalishvili",
    "Alexandre Pantoja", "Tom Aspinall", "Sean O'Malley",
  ],
  BOXING: [
    "Canelo Alvarez", "Tyson Fury", "Oleksandr Usyk", "Dmitry Bivol",
    "Naoya Inoue", "Terence Crawford", "Errol Spence Jr.",
    "David Benavidez", "Jermell Charlo", "Gervonta Davis",
  ],
  ATP: [
    "Jannik Sinner", "Carlos Alcaraz", "Novak Djokovic", "Daniil Medvedev",
    "Alexander Zverev", "Casper Ruud", "Andrey Rublev", "Hubert Hurkacz",
    "Taylor Fritz", "Grigor Dimitrov", "Ben Shelton", "Tommy Paul",
  ],
  WTA: [
    "Aryna Sabalenka", "Iga Swiatek", "Coco Gauff", "Jessica Pegula",
    "Elena Rybakina", "Madison Keys", "Barbora Krejcikova", "Mirra Andreeva",
    "Jasmine Paolini", "Daria Kasatkina", "Emma Navarro", "Paula Badosa",
  ],
  OLYMPICS: [],
  XGAMES: [
    "Shaun White", "Chloe Kim", "Nyjah Huston", "Tony Hawk",
    "Kelly Slater", "Travis Pastrana", "Sasha DiGiulian", "Scotty James",
  ],
};

export const LEAGUE_COLORS: Record<string, string> = {
  NFL:      C.nfl,
  NBA:      C.nba,
  MLB:      C.mlb,
  MLS:      C.mls,
  NHL:      C.nhl,
  WNBA:     C.wnba,
  NCAAB:    C.ncaab,
  NCAAF:    C.ncaaf,
  EPL:      C.eplBright,
  UCL:      C.ucl,
  LIGA:     C.liga,
  BUN:      "#D50000",
  SERA:     "#009CDE",
  LIG1:     "#091C3E",
  UEL:      "#F68E1E",
  UECL:     "#19A87A",
  NWSL:     "#FF6F61",
  FWCM:     "#5B3888",
  EURO:     "#0056A0",
  COPA:     "#1F5F2A",
  UFC:      C.ufc,
  NCAA:     C.accentGold,
  BOXING:   C.boxing,
  ATP:      C.atp,
  WTA:      C.wta,
  OLYMPICS: C.olympics,
  XGAMES:   C.xgames,
  Tennis:   C.tennis,
};
