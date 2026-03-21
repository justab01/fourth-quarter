import { useEffect, useRef, useState, useCallback } from "react";
import Constants from "expo-constants";

// ─── WebSocket hook for live game updates ────────────────────────────────────
// Connects to the API server WS endpoint, subscribes to a game topic,
// and returns the latest pushed state.

function getWsUrl(): string {
  const apiBase: string = Constants.expoConfig?.extra?.apiUrl ?? "";
  if (apiBase) {
    return apiBase.replace(/^https?:\/\//, "wss://").replace(/\/$/, "") + "/ws";
  }
  // Fallback: derive from environment
  const domain = process.env["EXPO_PUBLIC_API_URL"] ?? "";
  if (domain) {
    return domain.replace(/^https?:\/\//, "wss://").replace(/\/$/, "") + "/ws";
  }
  return "";
}

interface UseGameSocketOptions {
  gameId: string;
  enabled?: boolean;
  onUpdate?: (data: unknown) => void;
}

export function useGameSocket({ gameId, enabled = true, onUpdate }: UseGameSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<number>(0);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const connect = useCallback(() => {
    if (!enabled || !gameId) return;
    const url = getWsUrl();
    if (!url) return; // No WS URL configured — silent no-op

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mountedRef.current) return;
        setIsConnected(true);
        // Subscribe to this specific game topic
        ws.send(JSON.stringify({ type: "subscribe", topic: `game:${gameId}` }));
      };

      ws.onmessage = (evt) => {
        if (!mountedRef.current) return;
        try {
          const msg = JSON.parse(evt.data as string);
          if (msg.type === "update" && msg.topic === `game:${gameId}`) {
            setLastUpdate(Date.now());
            onUpdate?.(msg.data);
          }
        } catch { /* ignore */ }
      };

      ws.onclose = () => {
        if (!mountedRef.current) return;
        setIsConnected(false);
        // Auto-reconnect after 8s
        reconnectTimer.current = setTimeout(() => {
          if (mountedRef.current) connect();
        }, 8_000);
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch {
      // WebSocket not supported or URL invalid — graceful no-op
    }
  }, [gameId, enabled]);

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return { isConnected, lastUpdate };
}
