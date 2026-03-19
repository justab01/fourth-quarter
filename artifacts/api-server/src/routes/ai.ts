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
      model: "gpt-5-mini",
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
      model: "gpt-5-mini",
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

export default router;
