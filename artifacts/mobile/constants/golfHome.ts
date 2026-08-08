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

export const GOLF_PERFORMANCE_FILTERS = [
  "Overall form",
  "Driving",
  "Approach",
  "Short game",
  "Putting",
] as const;

export const GOLF_STORY_LABELS = ["Story", "Guide", "Interview", "Course", "History", "Culture"] as const;
