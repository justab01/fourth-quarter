// fortnite-controller/phone-app/services/ConnectionService.ts
import {
  ControllerMessage,
  ConnectionStatus,
  WEBSOCKET_PORT,
  HEARTBEAT_INTERVAL_MS,
  HEARTBEAT_TIMEOUT_MS,
  RECONNECT_DELAY_MS,
  MAX_RECONNECT_DELAY_MS,
} from '@fortnite-controller/shared';

export type StatusCallback = (status: ConnectionStatus) => void;

export class ConnectionService {
  private ws: WebSocket | null = null;
  private status: ConnectionStatus = 'disconnected';
  private statusCallback: StatusCallback | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private lastHeartbeatResponse: number = 0;
  private reconnectAttempts: number = 0;
  private targetIp: string | null = null;

  connect(ip: string) {
    this.targetIp = ip;
    this.setStatus('connecting');
    this.createConnection(ip);
  }

  private createConnection(ip: string) {
    const url = `ws://${ip}:${WEBSOCKET_PORT}`;

    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.setStatus('connected');
        this.reconnectAttempts = 0;
        this.startHeartbeat();
      };

      this.ws.onclose = () => {
        this.handleDisconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.setStatus('error');
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(event.data);
      };
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      this.setStatus('error');
      this.scheduleReconnect();
    }
  }

  private handleMessage(data: string) {
    try {
      const message = JSON.parse(data);
      if (message.type === 'h') {
        this.lastHeartbeatResponse = Date.now();
      }
    } catch (error) {
      console.error('Failed to parse message:', error);
    }
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.lastHeartbeatResponse = Date.now();

    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        // Check for timeout
        if (Date.now() - this.lastHeartbeatResponse > HEARTBEAT_TIMEOUT_MS) {
          console.log('Heartbeat timeout, reconnecting...');
          this.handleDisconnect();
          return;
        }

        // Send heartbeat
        this.send({ type: 'h', timestamp: Date.now() });
      }
    }, HEARTBEAT_INTERVAL_MS);
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private handleDisconnect() {
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.setStatus('disconnected');
    this.scheduleReconnect();
  }

  private scheduleReconnect() {
    if (!this.targetIp) return;

    const delay = Math.min(
      RECONNECT_DELAY_MS * Math.pow(2, this.reconnectAttempts),
      MAX_RECONNECT_DELAY_MS
    );

    this.reconnectAttempts++;

    setTimeout(() => {
      if (this.targetIp && this.status !== 'connected') {
        this.createConnection(this.targetIp);
      }
    }, delay);
  }

  send(message: ControllerMessage) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  onStatusChange(callback: StatusCallback) {
    this.statusCallback = callback;
  }

  private setStatus(status: ConnectionStatus) {
    this.status = status;
    this.statusCallback?.(status);
  }

  getStatus(): ConnectionStatus {
    return this.status;
  }

  disconnect() {
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.targetIp = null;
    this.setStatus('disconnected');
  }
}

// Singleton
let connectionInstance: ConnectionService | null = null;

export function getConnectionService(): ConnectionService {
  if (!connectionInstance) {
    connectionInstance = new ConnectionService();
  }
  return connectionInstance;
}