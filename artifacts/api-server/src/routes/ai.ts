import { Router, type IRouter } from "express";
import { GoogleGenAI } from "@google/genai";

const router: IRouter = Router();

const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY ?? "dummy",
  httpOptions: {
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
  },
});

const MODEL = "gemini-2.5-flash";

async function generateText(systemPrompt: string, userPrompt: string, jsonMode = false): Promise<string> {
  const config: Record<string, unknown> = { maxOutputTokens: 8192 };
  if (jsonMode) config.responseMimeType = "application/json";

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    config: {
      ...config,
      systemInstruction: systemPrompt,
    },
  });
  return response.text ?? "";
}

router.post("/ai/summarize", async (req, res) => {
  const { type, content, title } = req.body;

  try {
    const systemPrompt = "You are a sports journalist assistant. Be concise and accurate.";
    const userPrompt = type === "article"
      ? `Summarize this sports article in 2-3 sentences for a fan. Be concise and highlight the most important points.\n\nTitle: ${title || ""}\n\nContent: ${content}`
      : `Give a quick 1-2 sentence summary of this game's current situation for a sports fan.\n\nDetails: ${content}`;

    const summary = await generateText(systemPrompt, userPrompt);
    res.json({ summary });
  } catch (err) {
    console.error("AI summarize error:", err);
    res.json({ summary: "Summary temporarily unavailable." });
  }
});

router.post("/ai/recap", async (req, res) => {
  const { homeTeam, awayTeam, homeScore, awayScore, keyPlays, league } = req.body;

  const winner = homeScore > awayScore ? homeTeam : awayTeam;
  const loser = homeScore > awayScore ? awayTeam : homeTeam;
  const winScore = Math.max(homeScore, awayScore);
  const loseScore = Math.min(homeScore, awayScore);

  try {
    const systemPrompt = "You are a sports journalist. Respond only with valid JSON.";
    const userPrompt = `Generate a postgame recap for this ${league} game.

Result: ${winner} defeated ${loser} ${winScore}-${loseScore}
Key plays: ${(keyPlays as string[]).slice(0, 5).join("; ")}

Provide:
1. A 2-3 sentence "what happened" summary
2. The single key player who made the biggest impact (just a name)
3. A 1-2 sentence "what it means" for standings/playoff implications

Respond with JSON only: { "summary": "...", "keyPlayer": "...", "whatItMeans": "..." }`;

    const raw = await generateText(systemPrompt, userPrompt, true);
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
  simple: `Rewrite this sports news summary in plain, friendly language for someone who is new to sports or a casual fan. Avoid all technical jargon and sports-specific terms. If you must mention a rule or concept, briefly explain it in everyday words. Keep it to 2-3 sentences. Be warm and approachable.`,
  toddler: `Rewrite this sports news summary as if you are explaining it to a 4-year-old child. Use the simplest possible words, make it playful and silly, use funny comparisons (like comparing the teams to animals or snacks or cartoon characters). Keep it to 2-3 short sentences. Make it fun!`,
};

const SPORT_TRANSLATE_SYSTEM = (targetSport: string) =>
  `You are a sports translator. Rewrite the following sports news story using the language, terminology, and culture of ${targetSport}. Map the key concepts from the original sport into equivalent ${targetSport} concepts (e.g., if it's about basketball and the target is football: a dunk → a touchdown, a three-pointer → a field goal, points → yards, etc.). The goal is to help a ${targetSport} fan fully understand the significance and excitement of what happened. Keep it 2-3 sentences. Be specific with the analogies.`;

router.post("/ai/rewrite", async (req, res) => {
  const { content, title, mode, targetSport } = req.body as {
    content: string;
    title: string;
    mode: "simple" | "toddler" | "translate";
    targetSport?: string;
  };

  let systemPrompt: string;
  if (mode === "translate") {
    if (!targetSport) return res.status(400).json({ error: "targetSport required for translate mode" });
    systemPrompt = SPORT_TRANSLATE_SYSTEM(targetSport);
  } else {
    systemPrompt = REWRITE_PROMPTS[mode];
    if (!systemPrompt) return res.status(400).json({ error: "Invalid mode" });
  }

  try {
    const userPrompt = `Title: ${title || ""}\n\n${content}`;
    const rewritten = await generateText(systemPrompt, userPrompt);
    res.json({ rewritten });
  } catch (err) {
    console.error("AI rewrite error:", err);
    res.json({ rewritten: content });
  }
});

export default router;
