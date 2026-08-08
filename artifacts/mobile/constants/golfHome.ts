export const GOLF_LESSONS = [
  {
    id: "scorecard",
    eyebrow: "START HERE",
    title: "Read a scorecard",
    description: "Par, birdie, bogey and the running total—without the broadcast jargon.",
    icon: "grid-outline" as const,
  },
  {
    id: "cut",
    eyebrow: "TOURNAMENT FLOW",
    title: "How the cut works",
    description: "Why the field shrinks and every Friday putt can change the weekend.",
    icon: "cut-outline" as const,
  },
  {
    id: "lie",
    eyebrow: "SHOT DECISIONS",
    title: "Understand the lie",
    description: "Fairway, rough, bunker and slope change what a golfer can attempt.",
    icon: "layers-outline" as const,
  },
  {
    id: "strokes-gained",
    eyebrow: "MODERN STATS",
    title: "Strokes gained",
    description: "The cleanest way to see where a player is gaining on the field.",
    icon: "analytics-outline" as const,
  },
] as const;

export const GOLF_FEATURED_FACES = [
  {
    athleteId: "9478",
    name: "Scottie Scheffler",
    tour: "PGA",
    country: "United States",
    badge: "FEDEXCUP",
    headshotUrl: "https://a.espncdn.com/i/headshots/golf/players/full/9478.png",
    accolades: ["2× Masters", "Olympic gold"],
  },
  {
    athleteId: "9012",
    name: "Nelly Korda",
    tour: "LPGA",
    country: "United States",
    badge: "LPGA ICON",
    headshotUrl: "https://a.espncdn.com/i/headshots/golf/players/full/9012.png",
    accolades: ["Major champion", "Olympic gold"],
  },
  {
    athleteId: "11099",
    name: "Joaquín Niemann",
    tour: "LIV",
    country: "Chile",
    badge: "LIV LEADER",
    headshotUrl: "https://a.espncdn.com/i/headshots/golf/players/full/11099.png",
    accolades: ["LIV winner", "Presidents Cup"],
  },
  {
    athleteId: "3470",
    name: "Rory McIlroy",
    tour: "PGA",
    country: "Northern Ireland",
    badge: "CAREER SLAM",
    headshotUrl: "https://a.espncdn.com/i/headshots/golf/players/full/3470.png",
    accolades: ["5× major", "Career Grand Slam"],
  },
] as const;

export const GOLF_CULTURE_CARDS = [
  {
    eyebrow: "COURSE CULTURE",
    format: "STORY · 5 MIN",
    title: "Why classic greens still unsettle modern players.",
    description: "Architecture, angles and the small decisions hidden inside an approach shot.",
    icon: "map-outline" as const,
  },
  {
    eyebrow: "THE BAG",
    format: "CURATED GUIDE",
    title: "Fourteen clubs. Fourteen different questions.",
    description: "The job, distance and tradeoff behind every club a golfer can carry.",
    icon: "golf-outline" as const,
  },
] as const;

export const GOLF_STORY_LABELS = ["Story", "Guide", "Interview", "Course", "History", "Culture"] as const;
