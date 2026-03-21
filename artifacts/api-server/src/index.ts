import http from "http";
import app from "./app";
import { logger } from "./lib/logger";
import { createWsServer, broadcastGames, broadcastGameState } from "./lib/wsServer";

process.on("uncaughtException", (err) => {
  logger.error({ err }, "Uncaught exception — keeping server alive");
});

process.on("unhandledRejection", (reason) => {
  logger.error({ reason }, "Unhandled promise rejection — keeping server alive");
});

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// Wrap Express in an HTTP server so we can attach WebSocket
const httpServer = http.createServer(app);
createWsServer(httpServer);

// ─── Live broadcast loop ──────────────────────────────────────────────────────
// Every 15s push current scoreboard to all "games" subscribers
// Every 15s push game state to "game:<id>" subscribers for live games
let broadcastRunning = false;

async function startBroadcastLoop() {
  if (broadcastRunning) return;
  broadcastRunning = true;

  const INTERVAL_MS = 15_000;

  async function tick() {
    try {
      // Fetch all live/recent games from internal ESPN endpoint
      const base = `http://localhost:${port}`;
      const resp = await fetch(`${base}/api/sports/games`).catch(() => null);
      if (resp?.ok) {
        const games = await resp.json();
        if (Array.isArray(games) && games.length > 0) {
          broadcastGames(games);

          // For each live game, also broadcast its specific state
          const liveGames = games.filter((g: any) => g.status === "live");
          for (const game of liveGames.slice(0, 5)) {
            const gameResp = await fetch(`${base}/api/sports/game/${game.id}`).catch(() => null);
            if (gameResp?.ok) {
              const detail = await gameResp.json();
              broadcastGameState(game.id, detail);
            }
          }
        }
      }
    } catch {
      // silent — don't crash the broadcast loop
    }
    setTimeout(tick, INTERVAL_MS);
  }

  // Delay first tick by 5s to let server fully initialize
  setTimeout(tick, 5_000);
}

httpServer.listen(port, () => {
  logger.info({ port }, "Server listening");
  startBroadcastLoop();
});
