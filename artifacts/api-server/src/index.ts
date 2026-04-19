import http from "http";
import net from "net";
import app from "./app";
import { logger } from "./lib/logger";
import { createWsServer, broadcastGames, broadcastGameState } from "./lib/wsServer";

process.on("uncaughtException", (err: NodeJS.ErrnoException) => {
  logger.error({ err }, "Uncaught exception — keeping server alive");
});

process.on("unhandledRejection", (reason) => {
  logger.error({ reason }, "Unhandled promise rejection — keeping server alive");
});

const rawPort = process.env["PORT"] ?? "3001"; // Default to 3001 for local dev

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// ─── Wait until the port is free before binding ──────────────────────────────
// When Replit restarts the workflow, the old tsx process may still hold the
// port for a few seconds. Rather than crashing, we poll until it's available.
async function waitForPortFree(p: number, maxWaitMs = 30_000): Promise<void> {
  const deadline = Date.now() + maxWaitMs;
  while (Date.now() < deadline) {
    const free = await new Promise<boolean>((resolve) => {
      const probe = net.createServer();
      probe.once("error", () => { probe.close(); resolve(false); });
      probe.once("listening", () => { probe.close(() => resolve(true)); });
      probe.listen(p, "::");
    });
    if (free) return;
    logger.warn({ port: p }, "Port busy — waiting 1s for previous process to exit…");
    await new Promise(r => setTimeout(r, 1000));
  }
  logger.error({ port: p }, "Port still busy after 30s — proceeding anyway (may fail)");
}

// Wrap Express in an HTTP server so we can attach WebSocket
const httpServer = http.createServer(app);
createWsServer(httpServer);

// ─── Live broadcast loop ──────────────────────────────────────────────────────
let broadcastRunning = false;

async function startBroadcastLoop() {
  if (broadcastRunning) return;
  broadcastRunning = true;

  const INTERVAL_MS = 15_000;

  async function tick() {
    try {
      const base = `http://localhost:${port}`;
      const resp = await fetch(`${base}/api/sports/games`).catch(() => null);
      if (resp?.ok) {
        const games = await resp.json();
        if (Array.isArray(games) && games.length > 0) {
          broadcastGames(games);

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
      // silent
    }
    setTimeout(tick, INTERVAL_MS);
  }

  setTimeout(tick, 5_000);
}

// Wait for port, then bind
await waitForPortFree(port);

httpServer.listen(port, () => {
  logger.info({ port }, "Server listening");
  startBroadcastLoop();
});
