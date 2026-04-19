// mobile/constants/teamStatsConfig.ts

export type PersonalityBadge = {
  id: string;
  emoji: string;
  label: string;
  description: string;
};

export type HeroStat = {
  key: string;
  label: string;
  format: (value: number) => string;
  rankLabel: string;
};

export type SportStatsConfig = {
  heroStats: HeroStat[];
  personalityBadges: {
    positive: { threshold: { statKey: string; topN: number }; badge: PersonalityBadge }[];
    negative: { threshold: { statKey: string; bottomN: number }; badge: PersonalityBadge }[];
  };
  spiderChartMetrics: string[];
  progressBars: { key: string; label: string; format: (v: number) => string }[];
  rosterStarters: number;
};

export const SPORT_STATS_CONFIG: Record<string, SportStatsConfig> = {
  NBA: {
    heroStats: [
      { key: "ppg", label: "PPG", format: (v) => v.toFixed(1), rankLabel: "NBA" },
      { key: "threePtPct", label: "3PT%", format: (v) => `${(v * 100).toFixed(1)}%`, rankLabel: "NBA" },
      { key: "defRtg", label: "Def Rtg", format: (v) => v.toFixed(1), rankLabel: "NBA" },
      { key: "tovPerGame", label: "TOV/Gm", format: (v) => v.toFixed(1), rankLabel: "NBA" },
    ],
    personalityBadges: {
      positive: [
        { threshold: { statKey: "ppg", topN: 5 }, badge: { id: "fast-pace", emoji: "⚡", label: "FAST-PACED OFFENSE", description: "Top 5 scoring team" } },
        { threshold: { statKey: "defrtg", topN: 5 }, badge: { id: "lockdown-d", emoji: "🛡️", label: "LOCKDOWN DEFENSE", description: "Top 5 defensive rating" } },
        { threshold: { statKey: "3pt%", topN: 5 }, badge: { id: "three-point", emoji: "🎯", label: "THREE-POINT THREAT", description: "Top 5 three-point shooting" } },
      ],
      negative: [
        { threshold: { statKey: "tov/gm", bottomN: 10 }, badge: { id: "turnover-prone", emoji: "⚠️", label: "TURNOVER PRONE", description: "Bottom 10 in turnovers" } },
      ],
    },
    spiderChartMetrics: ["offRtg", "defRtg", "pace", "rebRate", "astRate", "tovRate"],
    progressBars: [
      { key: "ppg", label: "Points Per Game", format: (v) => v.toFixed(1) },
      { key: "3pt%", label: "3-Point %", format: (v) => `${(v * 100).toFixed(1)}%` },
      { key: "defrtg", label: "Defensive Rating", format: (v) => v.toFixed(1) },
      { key: "tov/gm", label: "Turnovers Per Game", format: (v) => v.toFixed(1) },
    ],
    rosterStarters: 5,
  },
  WNBA: {
    heroStats: [
      { key: "ppg", label: "PPG", format: (v) => v.toFixed(1), rankLabel: "WNBA" },
      { key: "threePtPct", label: "3PT%", format: (v) => `${(v * 100).toFixed(1)}%`, rankLabel: "WNBA" },
      { key: "defRtg", label: "Def Rtg", format: (v) => v.toFixed(1), rankLabel: "WNBA" },
      { key: "tovPerGame", label: "TOV/Gm", format: (v) => v.toFixed(1), rankLabel: "WNBA" },
    ],
    personalityBadges: {
      positive: [
        { threshold: { statKey: "ppg", topN: 5 }, badge: { id: "fast-pace", emoji: "⚡", label: "FAST-PACED OFFENSE", description: "Top 5 scoring team" } },
        { threshold: { statKey: "defrtg", topN: 5 }, badge: { id: "lockdown-d", emoji: "🛡️", label: "LOCKDOWN DEFENSE", description: "Top 5 defensive rating" } },
      ],
      negative: [],
    },
    spiderChartMetrics: ["offRtg", "defRtg", "pace", "rebRate", "astRate", "tovRate"],
    progressBars: [
      { key: "ppg", label: "Points Per Game", format: (v) => v.toFixed(1) },
      { key: "3pt%", label: "3-Point %", format: (v) => `${(v * 100).toFixed(1)}%` },
      { key: "defrtg", label: "Defensive Rating", format: (v) => v.toFixed(1) },
    ],
    rosterStarters: 5,
  },
  NCAAB: {
    heroStats: [
      { key: "ppg", label: "PPG", format: (v) => v.toFixed(1), rankLabel: "NCAA" },
      { key: "oppPpg", label: "Opp PPG", format: (v) => v.toFixed(1), rankLabel: "NCAA" },
      { key: "netRtg", label: "NET RTG", format: (v) => v > 0 ? `+${v.toFixed(1)}` : v.toFixed(1), rankLabel: "NCAA" },
      { key: "threePtPct", label: "3PT%", format: (v) => `${(v * 100).toFixed(1)}%`, rankLabel: "NCAA" },
    ],
    personalityBadges: {
      positive: [
        { threshold: { statKey: "ppg", topN: 5 }, badge: { id: "fast-pace", emoji: "⚡", label: "FAST-PACED OFFENSE", description: "Top 5 scoring team" } },
        { threshold: { statKey: "netrtg", topN: 5 }, badge: { id: "elite", emoji: "👑", label: "ELITE EFFICIENCY", description: "Top 5 net rating" } },
      ],
      negative: [],
    },
    spiderChartMetrics: ["offRtg", "defRtg", "pace", "rebRate", "astRate", "tovRate"],
    progressBars: [
      { key: "ppg", label: "Points Per Game", format: (v) => v.toFixed(1) },
      { key: "opp ppg", label: "Opponent PPG", format: (v) => v.toFixed(1) },
      { key: "netrtg", label: "Net Rating", format: (v) => v > 0 ? `+${v.toFixed(1)}` : v.toFixed(1) },
    ],
    rosterStarters: 5,
  },
  NFL: {
    heroStats: [
      { key: "passYdsPerGame", label: "Pass Y/G", format: (v) => v.toFixed(1), rankLabel: "NFL" },
      { key: "thirdDownPct", label: "3rd Down %", format: (v) => `${(v * 100).toFixed(1)}%`, rankLabel: "NFL" },
      { key: "redZonePct", label: "Red Zone %", format: (v) => `${(v * 100).toFixed(1)}%`, rankLabel: "NFL" },
      { key: "tovDiff", label: "TO Diff", format: (v) => v > 0 ? `+${v}` : `${v}`, rankLabel: "NFL" },
    ],
    personalityBadges: {
      positive: [
        { threshold: { statKey: "pass y/g", topN: 5 }, badge: { id: "air-raid", emoji: "⚡", label: "AIR RAID OFFENSE", description: "Top 5 passing yards" } },
        { threshold: { statKey: "to diff", topN: 3 }, badge: { id: "championship", emoji: "👑", label: "CHAMPIONSHIP CALIBER", description: "Top 3 turnover differential" } },
      ],
      negative: [],
    },
    spiderChartMetrics: ["passEff", "rushEff", "defEff", "tovDiff", "sackRate", "redZone"],
    progressBars: [
      { key: "pass y/g", label: "Pass Yards/Game", format: (v) => v.toFixed(1) },
      { key: "rush y/g", label: "Rush Yards/Game", format: (v) => v.toFixed(1) },
      { key: "ppg", label: "Points Per Game", format: (v) => v.toFixed(1) },
      { key: "opp ppg", label: "Points Allowed", format: (v) => v.toFixed(1) },
    ],
    rosterStarters: 11,
  },
  NCAAF: {
    heroStats: [
      { key: "ppg", label: "PPG", format: (v) => v.toFixed(1), rankLabel: "NCAA" },
      { key: "oppPpg", label: "Opp PPG", format: (v) => v.toFixed(1), rankLabel: "NCAA" },
      { key: "passYdsPerGame", label: "Pass Y/G", format: (v) => v.toFixed(1), rankLabel: "NCAA" },
      { key: "rushYdsPerGame", label: "Rush Y/G", format: (v) => v.toFixed(1), rankLabel: "NCAA" },
    ],
    personalityBadges: {
      positive: [
        { threshold: { statKey: "ppg", topN: 5 }, badge: { id: "explosive", emoji: "💥", label: "EXPLOSIVE OFFENSE", description: "Top 5 scoring team" } },
      ],
      negative: [],
    },
    spiderChartMetrics: ["passEff", "rushEff", "defEff", "tovDiff", "sackRate", "redZone"],
    progressBars: [
      { key: "ppg", label: "Points Per Game", format: (v) => v.toFixed(1) },
      { key: "opp ppg", label: "Points Allowed", format: (v) => v.toFixed(1) },
    ],
    rosterStarters: 11,
  },
  MLB: {
    heroStats: [
      { key: "homeRuns", label: "HR", format: (v) => v.toString(), rankLabel: "MLB" },
      { key: "runsPerGame", label: "R/G", format: (v) => v.toFixed(1), rankLabel: "MLB" },
      { key: "teamAvg", label: "AVG", format: (v) => v.toFixed(3), rankLabel: "MLB" },
      { key: "teamEra", label: "ERA", format: (v) => v.toFixed(2), rankLabel: "MLB" },
    ],
    personalityBadges: {
      positive: [
        { threshold: { statKey: "hr", topN: 5 }, badge: { id: "power-hitters", emoji: "💪", label: "POWER HITTERS", description: "Top 5 in home runs" } },
        { threshold: { statKey: "era", topN: 5 }, badge: { id: "pitching-factory", emoji: "🏭", label: "PITCHING FACTORY", description: "Top 5 team ERA" } },
      ],
      negative: [],
    },
    spiderChartMetrics: ["battingAvg", "slugging", "onBase", "era", "whip", "fielding"],
    progressBars: [
      { key: "avg", label: "Team Batting Avg", format: (v) => v.toFixed(3) },
      { key: "hr", label: "Home Runs", format: (v) => v.toString() },
      { key: "era", label: "Team ERA", format: (v) => v.toFixed(2) },
      { key: "r/g", label: "Runs Per Game", format: (v) => v.toFixed(1) },
    ],
    rosterStarters: 9,
  },
  NHL: {
    heroStats: [
      { key: "goalsAgainstAvg", label: "GAA", format: (v) => v.toFixed(2), rankLabel: "NHL" },
      { key: "savePct", label: "SV%", format: (v) => `${(v * 100).toFixed(1)}%`, rankLabel: "NHL" },
      { key: "goalsPerGame", label: "G/G", format: (v) => v.toFixed(1), rankLabel: "NHL" },
      { key: "pkPct", label: "PK%", format: (v) => `${(v * 100).toFixed(1)}%`, rankLabel: "NHL" },
    ],
    personalityBadges: {
      positive: [
        { threshold: { statKey: "gaa", topN: 5 }, badge: { id: "elite-goaltending", emoji: "🛡️", label: "ELITE GOALTENDING", description: "Top 5 goals against average" } },
        { threshold: { statKey: "g/g", topN: 5 }, badge: { id: "high-scoring", emoji: "🔥", label: "HIGH-SCORING OFFENSE", description: "Top 5 goals per game" } },
      ],
      negative: [],
    },
    spiderChartMetrics: ["goalsFor", "goalsAgainst", "powerPlay", "penaltyKill", "shotsFor", "corsi"],
    progressBars: [
      { key: "g/g", label: "Goals Per Game", format: (v) => v.toFixed(1) },
      { key: "gaa", label: "Goals Against Avg", format: (v) => v.toFixed(2) },
      { key: "sv%", label: "Save Percentage", format: (v) => `${(v * 100).toFixed(1)}%` },
      { key: "pk%", label: "Penalty Kill %", format: (v) => `${(v * 100).toFixed(1)}%` },
    ],
    rosterStarters: 6,
  },
  MLS: {
    heroStats: [
      { key: "goalsScored", label: "GF", format: (v) => v.toString(), rankLabel: "MLS" },
      { key: "xG", label: "xG", format: (v) => v.toFixed(1), rankLabel: "MLS" },
      { key: "possessionPct", label: "Poss%", format: (v) => `${(v * 100).toFixed(0)}%`, rankLabel: "MLS" },
      { key: "cleanSheets", label: "CS", format: (v) => v.toString(), rankLabel: "MLS" },
    ],
    personalityBadges: {
      positive: [
        { threshold: { statKey: "gf", topN: 5 }, badge: { id: "high-press", emoji: "⚡", label: "HIGH PRESS ATTACK", description: "Top 5 goals scored" } },
        { threshold: { statKey: "cs", topN: 5 }, badge: { id: "defensive-fortress", emoji: "🏰", label: "DEFENSIVE FORTRESS", description: "Top 5 clean sheets" } },
      ],
      negative: [],
    },
    spiderChartMetrics: ["goals", "assists", "xG", "xGA", "possession", "passAccuracy"],
    progressBars: [
      { key: "gf", label: "Goals Scored", format: (v) => v.toString() },
      { key: "xg", label: "Expected Goals", format: (v) => v.toFixed(1) },
      { key: "poss%", label: "Possession %", format: (v) => `${(v * 100).toFixed(0)}%` },
      { key: "cs", label: "Clean Sheets", format: (v) => v.toString() },
    ],
    rosterStarters: 11,
  },
  EPL: {
    heroStats: [
      { key: "goalsScored", label: "GF", format: (v) => v.toString(), rankLabel: "EPL" },
      { key: "xG", label: "xG", format: (v) => v.toFixed(1), rankLabel: "EPL" },
      { key: "possessionPct", label: "Poss%", format: (v) => `${(v * 100).toFixed(0)}%`, rankLabel: "EPL" },
      { key: "goalsConceded", label: "GA", format: (v) => v.toString(), rankLabel: "EPL" },
    ],
    personalityBadges: {
      positive: [
        { threshold: { statKey: "gf", topN: 5 }, badge: { id: "attack-force", emoji: "⚽", label: "ATTACKING FORCE", description: "Top 5 goals scored" } },
      ],
      negative: [],
    },
    spiderChartMetrics: ["goals", "xG", "xGA", "possession", "passAccuracy", "shots"],
    progressBars: [
      { key: "gf", label: "Goals Scored", format: (v) => v.toString() },
      { key: "xg", label: "Expected Goals", format: (v) => v.toFixed(1) },
      { key: "poss%", label: "Possession %", format: (v) => `${(v * 100).toFixed(0)}%` },
      { key: "ga", label: "Goals Conceded", format: (v) => v.toString() },
    ],
    rosterStarters: 11,
  },
  UCL: {
    heroStats: [
      { key: "goalsScored", label: "GF", format: (v) => v.toString(), rankLabel: "UCL" },
      { key: "xG", label: "xG", format: (v) => v.toFixed(1), rankLabel: "UCL" },
      { key: "possessionPct", label: "Poss%", format: (v) => `${(v * 100).toFixed(0)}%`, rankLabel: "UCL" },
      { key: "goalsConceded", label: "GA", format: (v) => v.toString(), rankLabel: "UCL" },
    ],
    personalityBadges: {
      positive: [],
      negative: [],
    },
    spiderChartMetrics: ["goals", "xG", "xGA", "possession", "passAccuracy", "shots"],
    progressBars: [
      { key: "gf", label: "Goals Scored", format: (v) => v.toString() },
      { key: "xg", label: "Expected Goals", format: (v) => v.toFixed(1) },
    ],
    rosterStarters: 11,
  },
  LIGA: {
    heroStats: [
      { key: "goalsScored", label: "GF", format: (v) => v.toString(), rankLabel: "La Liga" },
      { key: "xG", label: "xG", format: (v) => v.toFixed(1), rankLabel: "La Liga" },
      { key: "possessionPct", label: "Poss%", format: (v) => `${(v * 100).toFixed(0)}%`, rankLabel: "La Liga" },
      { key: "goalsConceded", label: "GA", format: (v) => v.toString(), rankLabel: "La Liga" },
    ],
    personalityBadges: {
      positive: [],
      negative: [],
    },
    spiderChartMetrics: ["goals", "xG", "xGA", "possession", "passAccuracy", "shots"],
    progressBars: [
      { key: "gf", label: "Goals Scored", format: (v) => v.toString() },
      { key: "xg", label: "Expected Goals", format: (v) => v.toFixed(1) },
    ],
    rosterStarters: 11,
  },
};

// Default config for leagues not explicitly defined
const DEFAULT_CONFIG: SportStatsConfig = {
  heroStats: [
    { key: "ppg", label: "PPG", format: (v) => v.toFixed(1), rankLabel: "League" },
    { key: "oppPpg", label: "Opp PPG", format: (v) => v.toFixed(1), rankLabel: "League" },
  ],
  personalityBadges: { positive: [], negative: [] },
  spiderChartMetrics: ["offense", "defense"],
  progressBars: [
    { key: "ppg", label: "Points Per Game", format: (v) => v.toFixed(1) },
  ],
  rosterStarters: 5,
};

export function getSportStatsConfig(league: string): SportStatsConfig {
  return SPORT_STATS_CONFIG[league.toUpperCase()] ?? DEFAULT_CONFIG;
}

export function generatePersonalityBadge(
  league: string,
  stats: Record<string, { value: number; rank: number; total: number }>
): PersonalityBadge | null {
  const config = getSportStatsConfig(league);

  // Check positive badges first
  for (const { threshold, badge } of config.personalityBadges.positive) {
    const normalizedKey = threshold.statKey.toLowerCase().replace(/[^a-z]/g, "");
    const stat = stats[normalizedKey];
    if (stat && stat.rank <= threshold.topN) {
      return badge;
    }
  }

  // Then check negative badges
  for (const { threshold, badge } of config.personalityBadges.negative) {
    const normalizedKey = threshold.statKey.toLowerCase().replace(/[^a-z]/g, "");
    const stat = stats[normalizedKey];
    const bottomThreshold = stat ? stat.total - threshold.bottomN : 0;
    if (stat && stat.rank >= bottomThreshold) {
      return badge;
    }
  }

  return null;
}

export function formatStatRank(rank: number, total: number): string {
  const suffix = rank === 1 ? "st" : rank === 2 ? "nd" : rank === 3 ? "rd" : "th";
  return `${rank}${suffix}`;
}