import { Router, type IRouter } from "express";
import OpenAI from "openai";

const router: IRouter = Router();

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
});

router.post("/ai/summarize", async (req, res) => {
  const { type, content, title } = req.body;

  try {
    const prompt = type === "article"
      ? `Summarize this sports article in 2-3 sentences for a fan. Be concise and highlight the most important points.\n\nTitle: ${title || ""}\n\nContent: ${content}`
      : `Give a quick 1-2 sentence summary of this game's current situation for a sports fan.\n\nDetails: ${content}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_completion_tokens: 150,
      messages: [{ role: "user", content: prompt }],
    });

    const summary = completion.choices[0]?.message?.content ?? "Summary unavailable.";
    res.json({ summary });
  } catch (err) {
    console.error("AI summarize error:", err);
    res.json({ summary: "Summary temporarily unavailable." });
  }
});

router.post("/ai/recap", async (req, res) => {
  const { homeTeam, awayTeam, homeScore, awayScore, keyPlays, stats, league } = req.body;

  const winner = homeScore > awayScore ? homeTeam : awayTeam;
  const loser = homeScore > awayScore ? awayTeam : homeTeam;
  const winScore = Math.max(homeScore, awayScore);
  const loseScore = Math.min(homeScore, awayScore);

  try {
    const prompt = `Generate a postgame recap for this ${league} game.

Result: ${winner} defeated ${loser} ${winScore}-${loseScore}
Key plays: ${keyPlays.slice(0, 5).join("; ")}

Provide:
1. A 2-3 sentence "what happened" summary
2. The single key player who made the biggest impact (just a name, make one up if needed)
3. A 1-2 sentence "what it means" for standings/playoff implications

Format as JSON: { "summary": "...", "keyPlayer": "...", "whatItMeans": "..." }`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_completion_tokens: 300,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw);

    res.json({
      summary: parsed.summary ?? `${winner} defeated ${loser} ${winScore}-${loseScore} in a hard-fought ${league} contest.`,
      keyPlayer: parsed.keyPlayer ?? "Team effort",
      whatItMeans: parsed.whatItMeans ?? "The win has significant playoff implications.",
    });
  } catch (err) {
    console.error("AI recap error:", err);
    res.json({
      summary: `${winner} defeated ${loser} ${winScore}-${loseScore} in tonight's ${league} matchup.`,
      keyPlayer: "Team effort",
      whatItMeans: "The result impacts playoff standings.",
    });
  }
});

const REWRITE_PROMPTS: Record<string, string> = {
  simple: `Rewrite this sports news summary in plain, friendly language for someone who is new to sports or casual fans. Avoid all technical jargon and sports-specific terms. If you must mention a rule or concept, briefly explain it in everyday words. Keep it to 2-3 sentences. Be warm and approachable.`,
  toddler: `Rewrite this sports news summary as if you are explaining it to a 4-year-old child. Use the simplest possible words, make it playful and silly, use funny comparisons (like comparing the teams to animals or snacks or cartoon characters). Keep it to 2-3 short sentences. Make it fun!`,
};

const SPORT_TRANSLATE_SYSTEM = (targetSport: string) =>
  `You are a sports translator. Rewrite the following sports news story using the language, terminology, and culture of ${targetSport}. Map the key concepts from the original sport into equivalent ${targetSport} concepts (e.g., if it's about basketball and the target is football: a dunk → a touchdown, a three-pointer → a field goal, points → yards, etc.). The goal is to help a ${targetSport} fan fully understand the significance and excitement of what happened. Keep it 2-3 sentences. Be specific with the analogies.`;

router.post("/ai/rewrite", async (req, res) => {
  const { content, title, mode, targetSport } = req.body as { content: string; title: string; mode: "simple" | "toddler" | "translate"; targetSport?: string };

  let systemPrompt: string;
  if (mode === "translate") {
    if (!targetSport) return res.status(400).json({ error: "targetSport required for translate mode" });
    systemPrompt = SPORT_TRANSLATE_SYSTEM(targetSport);
  } else {
    systemPrompt = REWRITE_PROMPTS[mode];
    if (!systemPrompt) return res.status(400).json({ error: "Invalid mode" });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_completion_tokens: 200,
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

export default router;
