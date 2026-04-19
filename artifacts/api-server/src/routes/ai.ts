import { Router, type IRouter } from "express";
import OpenAI from "openai";

const router: IRouter = Router();

// GROQ API client - optional for local dev
const groq = process.env.GROQ_API_KEY
  ? new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1",
    })
  : null;

const MODEL = "llama-3.1-8b-instant";

// ─── Sensitive topic detector ─────────────────────────────────────────────────
// When a story involves injuries, legal matters, deaths, etc., we append a
// stricter tone clause to every rewrite prompt.
const SENSITIVE_KEYWORDS = [
  "injur", "died", "death", "passed away", "surgery", "hospital",
  "arrest", "charged", "indicted", "suspended", "banned", "abuse",
  "allegation", "fired", "released", "cut", "cancer", "medical",
  "lawsuit", "settlement", "assault", "drug", "domestic",
];

function isSensitive(text: string): boolean {
  const lower = text.toLowerCase();
  return SENSITIVE_KEYWORDS.some(kw => lower.includes(kw));
}

const GUARDRAILS = `
Rules you must follow:
- Preserve all core facts: names, teams, scores, outcomes.
- Do not invent statistics, context, or quotes.
- Do not exaggerate or downplay outcomes.
- Do not turn the story into a joke or parody.
- Keep all names, teams, and results accurate.
- Do not replace uncertainty with false certainty.
- Respect injuries, legal matters, medical news, and sensitive topics with a measured, serious tone.`;

const SENSITIVE_ADDENDUM = `
This story involves a sensitive topic (injury, legal matter, suspension, or similar). Maintain a respectful, straightforward tone throughout. Do not make light of the situation.`;

// ─── Rewrite prompts ──────────────────────────────────────────────────────────
const REWRITE_PROMPTS: Record<string, string> = {
  easy: `You are a sports writer helping casual fans understand a sports news story. Rewrite the story in clear, natural, everyday language. Avoid unnecessary jargon, front-office terms, and advanced analytics language. If a sports term must be used, explain it briefly in plain English. Keep the meaning fully accurate. Write in 2–4 sentences. Sound confident, modern, and easy to follow — not childish.`,
  quick: `You are a sports editor. Condense this sports news story into a short, clean, highly readable version that captures only the most important takeaway. Keep it to 1–3 sentences. Make it easy to scan and understand immediately. Preserve the key facts and tone of the original. Do not sound childish, goofy, or overly casual.`,
};

const CROSS_SPORT_SYSTEM = (targetSport: string) =>
  `You are a sports writer helping a ${targetSport} fan understand a story from a different sport. Rewrite this sports story so a ${targetSport} fan can immediately grasp its significance. Use the language, concepts, pacing, and cultural logic of ${targetSport} to explain what happened. Map key actions and stakes into equivalent ideas where it genuinely aids understanding. Keep analogies accurate and purposeful — they should clarify, not become a joke or a stretch. Keep it to 2–4 sentences.`;

// ─── POST /ai/summarize ───────────────────────────────────────────────────────
router.post("/ai/summarize", async (req, res) => {
  const { type, content, title } = req.body;

  // Return fallback if no API key
  if (!groq) {
    res.json({ summary: "AI summaries require API configuration." });
    return;
  }

  try {
    const prompt = type === "article"
      ? `Summarize this sports article in 2-3 sentences for a fan. Be concise and highlight the most important points.\n\nTitle: ${title || ""}\n\nContent: ${content}`
      : `Give a quick 1-2 sentence summary of this game's current situation for a sports fan.\n\nDetails: ${content}`;

    const completion = await groq!.chat.completions.create({
      model: MODEL,
      max_tokens: 150,
      messages: [
        { role: "system", content: "You are a sports journalist assistant. Be concise and accurate." },
        { role: "user", content: prompt },
      ],
    });

    const summary = completion.choices[0]?.message?.content ?? "Summary unavailable.";
    res.json({ summary });
  } catch (err) {
    console.error("AI summarize error:", err);
    res.json({ summary: "Summary temporarily unavailable." });
  }
});

// ─── POST /ai/recap ───────────────────────────────────────────────────────────
router.post("/ai/recap", async (req, res) => {
  const { homeTeam, awayTeam, homeScore, awayScore, keyPlays, league } = req.body;

  const winner = homeScore > awayScore ? homeTeam : awayTeam;
  const loser  = homeScore > awayScore ? awayTeam : homeTeam;
  const winScore  = Math.max(homeScore, awayScore);
  const loseScore = Math.min(homeScore, awayScore);

  // Return fallback if no API key
  if (!groq) {
    res.json({
      summary: `${winner} defeated ${loser} ${winScore}-${loseScore} in a ${league} matchup.`,
      keyPlayer: "Team effort",
      whatItMeans: "The result impacts playoff standings.",
    });
    return;
  }

  try {
    const completion = await groq!.chat.completions.create({
      model: MODEL,
      max_tokens: 300,
      messages: [
        { role: "system", content: "You are a sports journalist. Respond only with valid JSON." },
        {
          role: "user",
          content: `Generate a postgame recap for this ${league} game.

Result: ${winner} defeated ${loser} ${winScore}-${loseScore}
Key plays: ${(keyPlays as string[]).slice(0, 5).join("; ")}

Provide:
1. A 2-3 sentence "what happened" summary
2. The single key player who made the biggest impact (just a name)
3. A 1-2 sentence "what it means" for standings/playoff implications

Respond with JSON only: { "summary": "...", "keyPlayer": "...", "whatItMeans": "..." }`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const raw    = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw);

    res.json({
      summary:     parsed.summary     ?? `${winner} defeated ${loser} ${winScore}-${loseScore} in a hard-fought ${league} contest.`,
      keyPlayer:   parsed.keyPlayer   ?? "Team effort",
      whatItMeans: parsed.whatItMeans ?? "The win has significant playoff implications.",
    });
  } catch (err) {
    console.error("AI recap error:", err);
    res.json({
      summary:     `${winner} defeated ${loser} ${winScore}-${loseScore} in tonight's ${league} matchup.`,
      keyPlayer:   "Team effort",
      whatItMeans: "The result impacts playoff standings.",
    });
  }
});

// ─── POST /ai/rewrite ─────────────────────────────────────────────────────────
router.post("/ai/rewrite", async (req, res) => {
  const { content, title, mode, targetSport } = req.body as {
    content: string;
    title: string;
    mode: "easy" | "quick" | "cross-sport";
    targetSport?: string;
  };

  // Return fallback if no API key
  if (!groq) {
    res.json({ rewritten: content });
    return;
  }

  const fullText = `${title || ""} ${content}`;
  const sensitive = isSensitive(fullText);
  const sensitiveClause = sensitive ? SENSITIVE_ADDENDUM : "";

  let systemPrompt: string;
  if (mode === "cross-sport") {
    if (!targetSport) {
      res.status(400).json({ error: "targetSport required for cross-sport mode" });
      return;
    }
    systemPrompt = CROSS_SPORT_SYSTEM(targetSport) + GUARDRAILS + sensitiveClause;
  } else {
    const base = REWRITE_PROMPTS[mode];
    if (!base) {
      res.status(400).json({ error: "Invalid mode" });
      return;
    }
    systemPrompt = base + GUARDRAILS + sensitiveClause;
  }

  try {
    const completion = await groq!.chat.completions.create({
      model: MODEL,
      max_tokens: 200,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Title: ${title || ""}\n\n${content}` },
      ],
    });
    const rewritten = completion.choices[0]?.message?.content ?? content;
    res.json({ rewritten });
  } catch (err) {
    console.error("AI rewrite error:", err);
    res.json({ rewritten: content });
  }
});

// ─── POST /ai/why-watch ───────────────────────────────────────────────────────
router.post("/ai/why-watch", async (req, res) => {
  const { sport, games, standings } = req.body as {
    sport: string;
    games?: Array<{ homeTeam: string; awayTeam: string; status: string; league: string }>;
    standings?: Array<{ teamName: string; rank: number }>;
  };

  // Return fallback if no API key
  if (!groq) {
    res.json({ context: `Big moments happening in ${sport} today.` });
    return;
  }

  try {
    const gamesContext = games && games.length > 0
      ? `Games today: ${games.slice(0, 5).map(g => `${g.awayTeam} @ ${g.homeTeam}${g.status === "live" ? " (LIVE)" : ""}`).join(", ")}`
      : "No major games today.";
    const standingsContext = standings && standings.length > 0
      ? `Top teams: ${standings.slice(0, 3).map(s => `${s.teamName} (${s.rank})`).join(", ")}`
      : "";

    const completion = await groq!.chat.completions.create({
      model: MODEL,
      max_tokens: 100,
      messages: [
        {
          role: "system",
          content: "You are a sports analyst. Give a single compelling sentence (under 25 words) about why this sport is worth watching today. Focus on stakes, storylines, or exciting matchups. Be specific and punchy.",
        },
        {
          role: "user",
          content: `Sport: ${sport}\n${gamesContext}\n${standingsContext}\n\nWhy should a fan watch today?`,
        },
      ],
    });

    const context = completion.choices[0]?.message?.content ?? "Exciting action ahead.";
    res.json({ context });
  } catch (err) {
    console.error("AI why-watch error:", err);
    res.json({ context: "Big moments are happening." });
  }
});

export default router;
