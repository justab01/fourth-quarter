import { WebSocketServer, WebSocket } from "ws";
import type { IncomingMessage, Server } from "http";
import { logger } from "./logger";

// ─── WebSocket broadcast layer ────────────────────────────────────────────────
// Clients subscribe to topics like "games", "game:ESPN123"
// Server pushes updates without clients polling

interface Client {
  ws: WebSocket;
  topics: Set<string>;
  lastSeen: number;
}

const clients = new Map<string, Client>();
let nextId = 1;

export function createWsServer(httpServer: Server): WebSocketServer {
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  wss.on("connection", (ws: WebSocket, _req: IncomingMessage) => {
    const id = `c${nextId++}`;
    clients.set(id, { ws, topics: new Set(["games"]), lastSeen: Date.now() });
    logger.info({ id }, "WS client connected");

    ws.on("message", (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        const client = clients.get(id);
        if (!client) return;
        client.lastSeen = Date.now();

        if (msg.type === "subscribe" && typeof msg.topic === "string") {
          client.topics.add(msg.topic);
          ws.send(JSON.stringify({ type: "subscribed", topic: msg.topic }));
        }
        if (msg.type === "unsubscribe" && typeof msg.topic === "string") {
          client.topics.delete(msg.topic);
        }
        if (msg.type === "ping") {
          ws.send(JSON.stringify({ type: "pong", ts: Date.now() }));
        }
      } catch {
        // ignore malformed messages
      }
    });

    ws.on("close", () => {
      clients.delete(id);
      logger.info({ id }, "WS client disconnected");
    });

    ws.on("error", () => clients.delete(id));

    // Send welcome
    ws.send(JSON.stringify({ type: "connected", id, ts: Date.now() }));
  });

  // Heartbeat — remove stale clients every 30s
  setInterval(() => {
    const cutoff = Date.now() - 60_000;
    for (const [id, client] of clients) {
      if (client.lastSeen < cutoff || client.ws.readyState !== WebSocket.OPEN) {
        client.ws.terminate();
        clients.delete(id);
      }
    }
  }, 30_000);

  logger.info("WebSocket server ready at /ws");
  return wss;
}

// ─── Broadcast helpers ────────────────────────────────────────────────────────

export function broadcast(topic: string, payload: unknown): void {
  const msg = JSON.stringify({ type: "update", topic, data: payload, ts: Date.now() });
  for (const client of clients.values()) {
    if (client.topics.has(topic) && client.ws.readyState === WebSocket.OPEN) {
      try { client.ws.send(msg); } catch { /* ignore */ }
    }
  }
}

export function broadcastGames(games: unknown[]): void {
  broadcast("games", games);
}

export function broadcastGameState(gameId: string, state: unknown): void {
  broadcast(`game:${gameId}`, state);
}

export function clientCount(): number {
  return clients.size;
}
