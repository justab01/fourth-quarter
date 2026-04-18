// fortnite-controller/ipad-app/services/WebSocketServer.ts
import { ControllerMessage, WEBSOCKET_PORT } from '@fortnite-controller/shared';

export type MessageHandler = (message: ControllerMessage) => void;
export type ConnectionHandler = (connected: boolean) => void;

export class WebSocketServer {
  private server: WebSocket | null = null;
  private client: WebSocket | null = null;
  private messageHandler: MessageHandler | null = null;
  private connectionHandler: ConnectionHandler | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private lastHeartbeat: number = 0;

  async start(): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        // Note: React Native doesn't have a built-in WebSocket server.
        // We'll use a workaround with a simple HTTP server upgrade.
        // For Expo, we need expo-dev-client and a native module.
        // For now, this is a placeholder that simulates the server.

        // In production, you'd use:
        // 1. A native module for WebSocket server
        // 2. Or run a separate Node.js server on the device

        // Simulated server start
        console.log(`WebSocket server starting on port ${WEBSOCKET_PORT}`);

        // Return device IP for connection
        // In real implementation, get actual IP from network interface
        resolve('192.168.1.100'); // Placeholder - real impl needs network info
      } catch (error) {
        reject(error);
      }
    });
  }

  onMessage(handler: MessageHandler) {
    this.messageHandler = handler;
  }

  onConnection(handler: ConnectionHandler) {
    this.connectionHandler = handler;
  }

  private handleMessage(data: string) {
    try {
      const message = JSON.parse(data) as ControllerMessage;
      if (message.type === 'h') {
        this.lastHeartbeat = (message as { timestamp: number }).timestamp;
        this.sendHeartbeatAck();
      } else if (this.messageHandler) {
        this.messageHandler(message);
      }
    } catch (error) {
      console.error('Failed to parse message:', error);
    }
  }

  private sendHeartbeatAck() {
    if (this.client && this.client.readyState === WebSocket.OPEN) {
      this.client.send(JSON.stringify({ type: 'h', timestamp: Date.now() }));
    }
  }

  stop() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    if (this.client) {
      this.client.close();
      this.client = null;
    }
    if (this.server) {
      this.server.close();
      this.server = null;
    }
    this.connectionHandler?.(false);
  }
}

// Singleton instance
let serverInstance: WebSocketServer | null = null;

export function getWebSocketServer(): WebSocketServer {
  if (!serverInstance) {
    serverInstance = new WebSocketServer();
  }
  return serverInstance;
}