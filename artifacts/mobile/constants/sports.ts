import Colors from "./colors";

const C = Colors.dark;

export const SPORTS = [
  { id: "NFL", label: "NFL", icon: "football", color: C.nfl },
  { id: "NBA", label: "NBA", icon: "basketball", color: C.nba },
  { id: "MLB", label: "MLB", icon: "baseball", color: C.mlb },
  { id: "MLS", label: "MLS", icon: "football", color: C.mls },
  { id: "UFC", label: "UFC", icon: "fitness", color: C.ufc },
  { id: "NHL", label: "NHL", icon: "snow", color: C.nhl },
];

export const TEAMS_BY_LEAGUE: Record<string, string[]> = {
  NFL: [
    "Kansas City Chiefs",
    "Buffalo Bills",
    "Philadelphia Eagles",
    "Baltimore Ravens",
    "Houston Texans",
    "Detroit Lions",
    "Los Angeles Rams",
    "Minnesota Vikings",
    "Denver Broncos",
    "San Francisco 49ers",
    "Dallas Cowboys",
    "Miami Dolphins",
    "Washington Commanders",
    "Cincinnati Bengals",
    "New England Patriots",
  ],
  NBA: [
    "Houston Rockets",
    "Los Angeles Lakers",
    "Boston Celtics",
    "Oklahoma City Thunder",
    "San Antonio Spurs",
    "Detroit Pistons",
    "Cleveland Cavaliers",
    "Minnesota Timberwolves",
    "Denver Nuggets",
    "New York Knicks",
    "Golden State Warriors",
    "Miami Heat",
    "Dallas Mavericks",
    "Phoenix Suns",
    "Milwaukee Bucks",
  ],
  MLB: [
    "Houston Astros",
    "New York Yankees",
    "Los Angeles Dodgers",
    "Atlanta Braves",
    "Boston Red Sox",
    "San Diego Padres",
    "Seattle Mariners",
    "Philadelphia Phillies",
    "Baltimore Orioles",
    "Texas Rangers",
    "Chicago Cubs",
    "Toronto Blue Jays",
  ],
  MLS: [
    "Houston Dynamo",
    "Vancouver Whitecaps",
    "Los Angeles FC",
    "Inter Miami CF",
    "New England Revolution",
    "LA Galaxy",
    "Atlanta United",
    "New York City FC",
    "Nashville SC",
    "Portland Timbers",
    "Seattle Sounders",
    "Austin FC",
    "Charlotte FC",
    "San Diego FC",
  ],
  UFC: [],
  NHL: [
    "Vegas Golden Knights",
    "Boston Bruins",
    "Colorado Avalanche",
    "New York Rangers",
    "Toronto Maple Leafs",
    "Carolina Hurricanes",
    "Edmonton Oilers",
    "Florida Panthers",
  ],
};

export const LEAGUE_COLORS: Record<string, string> = {
  NFL:  C.nfl,        // Vivid Teal
  NBA:  C.nba,        // Energy Orange
  MLB:  C.mlb,        // Steel Blue
  MLS:  C.mls,        // Vivid Teal
  UFC:  C.ufc,        // Energy Orange
  NHL:  C.nhl,        // Steel Blue
  NCAA: C.accentGold, // Gold
};
