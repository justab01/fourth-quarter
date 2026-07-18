export type PreviewContext = "home" | "game" | "team" | "news" | "sport";

export type CreatorPreview = {
  id: string;
  name: string;
  handle: string;
  role: string;
  topic: string;
  take: string;
  context: PreviewContext[];
  leagues?: string[];
  teams?: string[];
  disclosure: string;
};

export type FanPulsePrompt = {
  id: string;
  title: string;
  prompt: string;
  context: PreviewContext[];
  options?: string[];
  leagues?: string[];
  teams?: string[];
  disclosure: string;
};

export type CommunityPreview = {
  id: string;
  name: string;
  description: string;
  context: PreviewContext[];
  leagues?: string[];
  teams?: string[];
  disclosure: string;
};

export type PollPreview = {
  id: string;
  question: string;
  options: string[];
  context: PreviewContext[];
  leagues?: string[];
  teams?: string[];
  disclosure: string;
};

export const CREATOR_PREVIEWS: CreatorPreview[] = [
  {
    id: "film-room",
    name: "The Film Room",
    handle: "@filmroom",
    role: "Tactical breakdowns",
    topic: "Late-game adjustments",
    take: "The best teams are winning the margins: timeout timing, lineup counters, and who gets the last clean look.",
    context: ["home", "game", "team"],
    leagues: ["NBA", "NFL", "NHL", "MLB"],
    disclosure: "Curated creator preview",
  },
  {
    id: "cap-space-desk",
    name: "Cap Space Desk",
    handle: "@capdesk",
    role: "Roster strategy",
    topic: "Team-building angle",
    take: "The box score tells you what happened. The roster sheet tells you why the next move is already coming.",
    context: ["home", "team", "news"],
    leagues: ["NBA", "NFL", "NHL", "MLB"],
    disclosure: "Curated creator preview",
  },
  {
    id: "numbers-after-dark",
    name: "Numbers After Dark",
    handle: "@numbers",
    role: "Stats and trends",
    topic: "Hidden signal",
    take: "The trend to watch is not the final score. It is shot quality, possession pressure, and who controlled the middle stretch.",
    context: ["home", "game", "sport"],
    leagues: ["NBA", "MLS", "EPL", "NHL"],
    disclosure: "Curated creator preview",
  },
  {
    id: "injury-impact",
    name: "Injury Impact",
    handle: "@injuryimpact",
    role: "Availability watch",
    topic: "Fantasy and rotation impact",
    take: "One absence can change usage, pace, matchup hunting, and the entire second-unit rhythm.",
    context: ["home", "game", "team", "news"],
    leagues: ["NBA", "NFL", "MLB", "NHL"],
    disclosure: "Curated creator preview",
  },
];

export const FAN_PULSE_PROMPTS: FanPulsePrompt[] = [
  {
    id: "watch-angle",
    title: "Fan Pulse",
    prompt: "What is the real reason to watch this one?",
    options: ["Star matchup", "Playoff stakes", "Upset watch", "Rivalry energy"],
    context: ["home", "game"],
    disclosure: "Preview prompt",
  },
  {
    id: "team-temperature",
    title: "Team Temperature",
    prompt: "How should fans feel about this team right now?",
    options: ["All in", "Cautiously optimistic", "Need a move", "Hit reset"],
    context: ["team", "home"],
    disclosure: "Preview prompt",
  },
  {
    id: "news-reaction",
    title: "Story Pulse",
    prompt: "What is the real takeaway from this story?",
    options: ["Big deal", "Wait and see", "Overreaction", "Changes everything"],
    context: ["news"],
    disclosure: "Preview prompt",
  },
  {
    id: "sport-rhythm",
    title: "League Pulse",
    prompt: "What conversation is defining the league this week?",
    options: ["Title race", "Injuries", "Trade market", "Rising teams"],
    context: ["sport", "home"],
    disclosure: "Preview prompt",
  },
];

export const COMMUNITY_PREVIEWS: CommunityPreview[] = [
  {
    id: "game-room",
    name: "Game Room",
    description: "A future live space for reactions, polls, and creator takes around the game.",
    context: ["game"],
    disclosure: "Community preview",
  },
  {
    id: "team-room",
    name: "Team Room",
    description: "A future fan base hub for team debates, roster talk, game threads, and recurring creator segments.",
    context: ["team"],
    disclosure: "Community preview",
  },
  {
    id: "story-room",
    name: "Story Room",
    description: "A future discussion layer for news, context, and fan reactions around the biggest sports stories.",
    context: ["news"],
    disclosure: "Community preview",
  },
];

export const POLL_PREVIEWS: PollPreview[] = FAN_PULSE_PROMPTS
  .filter((prompt): prompt is FanPulsePrompt & { options: string[] } => Array.isArray(prompt.options))
  .map((prompt) => ({
    id: `${prompt.id}-poll`,
    question: prompt.prompt,
    options: prompt.options,
    context: prompt.context,
    leagues: prompt.leagues,
    teams: prompt.teams,
    disclosure: prompt.disclosure,
  }));

function matchesContext<T extends { context: PreviewContext[] }>(item: T, context: PreviewContext) {
  return item.context.includes(context);
}

function matchesLeague<T extends { leagues?: string[] }>(item: T, league?: string) {
  return !league || !item.leagues || item.leagues.includes(league.toUpperCase());
}

function matchesTeam<T extends { teams?: string[] }>(item: T, team?: string) {
  return !team || !item.teams || item.teams.includes(team);
}

export function getCreatorPreviews(context: PreviewContext, options: { league?: string; team?: string; limit?: number } = {}) {
  const { league, team, limit = 2 } = options;
  return CREATOR_PREVIEWS
    .filter((item) => matchesContext(item, context) && matchesLeague(item, league) && matchesTeam(item, team))
    .slice(0, limit);
}

export function getFanPulsePrompts(context: PreviewContext, options: { league?: string; team?: string; limit?: number } = {}) {
  const { league, team, limit = 1 } = options;
  return FAN_PULSE_PROMPTS
    .filter((item) => matchesContext(item, context) && matchesLeague(item, league) && matchesTeam(item, team))
    .slice(0, limit);
}

export function getCommunityPreviews(context: PreviewContext, options: { league?: string; team?: string; limit?: number } = {}) {
  const { league, team, limit = 1 } = options;
  return COMMUNITY_PREVIEWS
    .filter((item) => matchesContext(item, context) && matchesLeague(item, league) && matchesTeam(item, team))
    .slice(0, limit);
}

export function getPollPreviews(context: PreviewContext, options: { league?: string; team?: string; limit?: number } = {}) {
  const { league, team, limit = 1 } = options;
  return POLL_PREVIEWS
    .filter((item) => matchesContext(item, context) && matchesLeague(item, league) && matchesTeam(item, team))
    .slice(0, limit);
}
