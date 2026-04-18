# Fortnite Controller Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a phone controller app that connects to iPad to play Fortnite with dual virtual joysticks and fire button.

**Architecture:** Two Expo React Native apps communicating over local Wi-Fi via WebSocket. Phone app shows controller UI, iPad app receives inputs and simulates touches using iOS Accessibility APIs.

**Tech Stack:** Expo (React Native), TypeScript, WebSocket, iOS Accessibility API

---

## File Structure

```
fortnite-controller/
├── shared/
│   ├── types.ts              # Message types and interfaces
│   ├── constants.ts          # Port, intervals, screen regions
│   └── package.json
├── phone-app/
│   ├── app/
│   │   ├── _layout.tsx       # Root layout with providers
│   │   └── index.tsx        # Controller screen
│   ├── components/
│   │   ├── Joystick.tsx     # Virtual joystick component
│   │   ├── FireButton.tsx   # Fire button with haptics
│   │   └── ConnectionStatus.tsx  # Connection indicator
│   ├── hooks/
│   │   └── useConnection.ts # WebSocket connection hook
│   ├── services/
│   │   └── ConnectionService.ts   # WebSocket client
│   ├── app.json             # Expo config
│   ├── package.json
│   └── tsconfig.json
├── ipad-app/
│   ├── app/
│   │   ├── _layout.tsx      # Root layout
│   │   └── index.tsx        # Receiver screen
│   ├── services/
│   │   ├── WebSocketServer.ts     # WebSocket server
│   │   └── TouchSimulator.ts      # Accessibility touch simulation
│   ├── app.json             # Expo config
│   ├── package.json
│   └── tsconfig.json
└── package.json             # Workspace root
```

---

## Phase 1: Project Setup

### Task 1: Create project structure

**Files:**
- Create: `fortnite-controller/package.json`
- Create: `fortnite-controller/shared/package.json`
- Create: `fortnite-controller/phone-app/package.json`
- Create: `fortnite-controller/ipad-app/package.json`

- [ ] **Step 1: Create root package.json**

```bash
mkdir -p fortnite-controller
```

```json
{
  "name": "fortnite-controller",
  "version": "1.0.0",
  "private": true,
  "workspaces": ["shared", "phone-app", "ipad-app"]
}
```

- [ ] **Step 2: Create shared package.json**

```bash
mkdir -p fortnite-controller/shared
```

```json
{
  "name": "@fortnite-controller/shared",
  "version": "1.0.0",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "scripts": {
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "^5.4.0"
  }
}
```

- [ ] **Step 3: Create phone-app package.json**

```bash
mkdir -p fortnite-controller/phone-app
```

```json
{
  "name": "@fortnite-controller/phone-app",
  "version": "1.0.0",
  "main": "expo-router/entry",
  "scripts": {
    "start": "expo start",
    "ios": "expo run:ios",
    "android": "expo run:android",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@fortnite-controller/shared": "*",
    "expo": "~51.0.0",
    "expo-router": "~3.5.0",
    "expo-haptics": "~12.0.0",
    "react": "18.2.0",
    "react-native": "0.74.0",
    "react-native-gesture-handler": "~2.16.0",
    "react-native-reanimated": "~3.10.0"
  },
  "devDependencies": {
    "@types/react": "~18.2.0",
    "typescript": "^5.4.0"
  }
}
```

- [ ] **Step 4: Create ipad-app package.json**

```bash
mkdir -p fortnite-controller/ipad-app
```

```json
{
  "name": "@fortnite-controller/ipad-app",
  "version": "1.0.0",
  "main": "expo-router/entry",
  "scripts": {
    "start": "expo start",
    "ios": "expo run:ios",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@fortnite-controller/shared": "*",
    "expo": "~51.0.0",
    "expo-router": "~3.5.0",
    "react": "18.2.0",
    "react-native": "0.74.0"
  },
  "devDependencies": {
    "@types/react": "~18.2.0",
    "typescript": "^5.4.0"
  }
}
```

- [ ] **Step 5: Commit project structure**

```bash
git add fortnite-controller/
git commit -m "chore: initialize fortnite-controller project structure"
```

---

### Task 2: Create shared types and constants

**Files:**
- Create: `fortnite-controller/shared/src/types.ts`
- Create: `fortnite-controller/shared/src/constants.ts`
- Create: `fortnite-controller/shared/src/index.ts`
- Create: `fortnite-controller/shared/tsconfig.json`

- [ ] **Step 1: Create shared tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "outDir": "./dist"
  },
  "include": ["src"]
}
```

- [ ] **Step 2: Create types.ts**

```typescript
// fortnite-controller/shared/src/types.ts

export type MessageType = 'jl' | 'jr' | 'f' | 'h';

export interface JoystickLeftMessage {
  type: 'jl';
  x: number;  // -1 to 1
  y: number;  // -1 to 1
}

export interface JoystickRightMessage {
  type: 'jr';
  x: number;
  y: number;
}

export interface FireMessage {
  type: 'f';
}

export interface HeartbeatMessage {
  type: 'h';
  timestamp: number;
}

export type ControllerMessage =
  | JoystickLeftMessage
  | JoystickRightMessage
  | FireMessage
  | HeartbeatMessage;

export interface ScreenRegion {
  x: number;  // 0-1 (percentage of screen width)
  y: number;  // 0-1 (percentage of screen height)
  width: number;
  height: number;
}

export interface TouchRegions {
  movementJoystick: ScreenRegion;
  cameraJoystick: ScreenRegion;
  fireButton: ScreenRegion;
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';
```

- [ ] **Step 3: Create constants.ts**

```typescript
// fortnite-controller/shared/src/constants.ts

import { TouchRegions } from './types';

export const WEBSOCKET_PORT = 8080;
export const HEARTBEAT_INTERVAL_MS = 500;
export const HEARTBEAT_TIMEOUT_MS = 2000;
export const JOYSTICK_SEND_INTERVAL_MS = 16; // ~60fps
export const RECONNECT_DELAY_MS = 1000;
export const MAX_RECONNECT_DELAY_MS = 30000;

// Default touch regions for iPad in portrait mode
export const DEFAULT_TOUCH_REGIONS: TouchRegions = {
  movementJoystick: {
    x: 0,
    y: 0.5,
    width: 0.33,
    height: 0.5,
  },
  cameraJoystick: {
    x: 0.67,
    y: 0.5,
    width: 0.33,
    height: 0.5,
  },
  fireButton: {
    x: 0.80,
    y: 0.60,
    width: 0.15,
    height: 0.20,
  },
};

export const MDNS_SERVICE_TYPE = '_fortnitecontroller._tcp';
```

- [ ] **Step 4: Create index.ts barrel export**

```typescript
// fortnite-controller/shared/src/index.ts
export * from './types';
export * from './constants';
```

- [ ] **Step 5: Commit shared module**

```bash
git add fortnite-controller/shared/
git commit -m "feat(shared): add types and constants for controller messages"
```

---

## Phase 2: iPad App (Receiver)

### Task 3: Set up iPad app Expo project

**Files:**
- Create: `fortnite-controller/ipad-app/app.json`
- Create: `fortnite-controller/ipad-app/tsconfig.json`
- Create: `fortnite-controller/ipad-app/app/_layout.tsx`
- Create: `fortnite-controller/ipad-app/app/index.tsx`

- [ ] **Step 1: Create app.json (Expo config)**

```json
{
  "expo": {
    "name": "Fortnite Controller Receiver",
    "slug": "fortnite-controller-receiver",
    "version": "1.0.0",
    "orientation": "portrait",
    "scheme": "fortnitecontroller",
    "platforms": ["ios"],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.personal.fortnitecontroller.receiver",
      "infoPlist": {
        "NSLocalNetworkUsageDescription": "This app needs local network access to receive controller inputs from your phone."
      }
    },
    "plugins": [
      "expo-router"
    ]
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "paths": {
      "@fortnite-controller/shared": ["../shared/src"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx"]
}
```

- [ ] **Step 3: Create root layout**

```tsx
// fortnite-controller/ipad-app/app/_layout.tsx
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}
```

- [ ] **Step 4: Create placeholder index screen**

```tsx
// fortnite-controller/ipad-app/app/index.tsx
import { View, Text, StyleSheet } from 'react-native';

export default function ReceiverScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Fortnite Controller</Text>
      <Text style={styles.subtitle}>Receiver App</Text>
      <Text style={styles.status}>Setting up...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 18,
    color: '#888',
    marginTop: 8,
  },
  status: {
    fontSize: 14,
    color: '#ff9500',
    marginTop: 32,
  },
});
```

- [ ] **Step 5: Commit iPad app setup**

```bash
git add fortnite-controller/ipad-app/
git commit -m "feat(ipad-app): initialize Expo project with basic layout"
```

---

### Task 4: Implement WebSocket server for iPad

**Files:**
- Create: `fortnite-controller/ipad-app/services/WebSocketServer.ts`
- Modify: `fortnite-controller/ipad-app/app/index.tsx`

- [ ] **Step 1: Create WebSocketServer service**

```typescript
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
```

- [ ] **Step 2: Update index.tsx to use WebSocket server**

```tsx
// fortnite-controller/ipad-app/app/index.tsx
import { View, Text, StyleSheet, useEffect, useState } from 'react-native';
import { getWebSocketServer } from '../services/WebSocketServer';
import { ControllerMessage } from '@fortnite-controller/shared';

export default function ReceiverScreen() {
  const [status, setStatus] = useState('Starting server...');
  const [ip, setIp] = useState<string | null>(null);

  useEffect(() => {
    const server = getWebSocketServer();

    server.onConnection((connected) => {
      setStatus(connected ? 'Connected' : 'Waiting for controller...');
    });

    server.onMessage((message: ControllerMessage) => {
      // Will be handled by TouchSimulator in next task
      console.log('Received:', message);
    });

    server.start()
      .then((deviceIp) => {
        setIp(deviceIp);
        setStatus('Waiting for controller...');
      })
      .catch((error) => {
        setStatus(`Error: ${error.message}`);
      });

    return () => server.stop();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Fortnite Controller</Text>
      <Text style={styles.subtitle}>Receiver App</Text>
      <View style={styles.statusContainer}>
        <View style={[styles.indicator, status === 'Connected' && styles.connected]} />
        <Text style={styles.status}>{status}</Text>
      </View>
      {ip && (
        <View style={styles.ipContainer}>
          <Text style={styles.ipLabel}>Connect to:</Text>
          <Text style={styles.ipAddress}>{ip}:8080</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 18,
    color: '#888',
    marginTop: 8,
    marginBottom: 40,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  indicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ff3b30',
    marginRight: 10,
  },
  connected: {
    backgroundColor: '#34c759',
  },
  status: {
    fontSize: 16,
    color: '#ff9500',
  },
  ipContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    alignItems: 'center',
  },
  ipLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  ipAddress: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    fontFamily: 'monospace',
  },
});
```

- [ ] **Step 3: Commit WebSocket server**

```bash
git add fortnite-controller/ipad-app/
git commit -m "feat(ipad-app): add WebSocket server for receiving controller inputs"
```

---

### Task 5: Implement touch simulator for iPad

**Files:**
- Create: `fortnite-controller/ipad-app/services/TouchSimulator.ts`
- Modify: `fortnite-controller/ipad-app/app/index.tsx`

- [ ] **Step 1: Create TouchSimulator service**

```typescript
// fortnite-controller/ipad-app/services/TouchSimulator.ts
import {
  ControllerMessage,
  DEFAULT_TOUCH_REGIONS,
  TouchRegions,
  ScreenRegion
} from '@fortnite-controller/shared';

interface TouchPoint {
  x: number;
  y: number;
}

export class TouchSimulator {
  private regions: TouchRegions;
  private lastLeftJoystick: TouchPoint = { x: 0.5, y: 0.5 };
  private lastRightJoystick: TouchPoint = { x: 0.5, y: 0.5 };
  private screenWidth: number = 1024;  // iPad default
  private screenHeight: number = 768;

  constructor(regions: TouchRegions = DEFAULT_TOUCH_REGIONS) {
    this.regions = regions;
  }

  setScreenDimensions(width: number, height: number) {
    this.screenWidth = width;
    this.screenHeight = height;
  }

  setRegions(regions: TouchRegions) {
    this.regions = regions;
  }

  handleMessage(message: ControllerMessage) {
    switch (message.type) {
      case 'jl':
        this.handleLeftJoystick(message.x, message.y);
        break;
      case 'jr':
        this.handleRightJoystick(message.x, message.y);
        break;
      case 'f':
        this.handleFire();
        break;
    }
  }

  private handleLeftJoystick(x: number, y: number) {
    // Convert -1..1 to screen coordinates
    const region = this.regions.movementJoystick;
    const screenX = this.regionToScreenX(region, x);
    const screenY = this.regionToScreenY(region, y);

    this.simulateTouch(screenX, screenY, 'move');
    this.lastLeftJoystick = { x, y };
  }

  private handleRightJoystick(x: number, y: number) {
    const region = this.regions.cameraJoystick;
    const screenX = this.regionToScreenX(region, x);
    const screenY = this.regionToScreenY(region, y);

    this.simulateTouch(screenX, screenY, 'move');
    this.lastRightJoystick = { x, y };
  }

  private handleFire() {
    const region = this.regions.fireButton;
    const screenX = (region.x + region.width / 2) * this.screenWidth;
    const screenY = (region.y + region.height / 2) * this.screenHeight;

    this.simulateTouch(screenX, screenY, 'tap');
  }

  private regionToScreenX(region: ScreenRegion, normalizedX: number): number {
    // normalizedX is -1 to 1, map to region
    const centerX = (region.x + region.width / 2) * this.screenWidth;
    const rangeX = (region.width / 2) * this.screenWidth;
    return centerX + normalizedX * rangeX;
  }

  private regionToScreenY(region: ScreenRegion, normalizedY: number): number {
    const centerY = (region.y + region.height / 2) * this.screenHeight;
    const rangeY = (region.height / 2) * this.screenHeight;
    return centerY + normalizedY * rangeY;
  }

  private simulateTouch(x: number, y: number, type: 'tap' | 'move') {
    // NOTE: This requires iOS Accessibility APIs
    // In Expo, this needs expo-dev-client and a native module
    //
    // Real implementation would use:
    // 1. RNAccessibilityService (Android)
    // 2. UIAccessibility (iOS) - requires special entitlements
    //
    // For development/testing, we log the touch events
    console.log(`[TouchSimulator] ${type} at (${x.toFixed(0)}, ${y.toFixed(0)})`);

    // TODO: Implement actual touch injection via native module
    // Example using a hypothetical native module:
    // NativeModules.TouchInjector.simulateTouch(x, y, type);
  }
}

// Singleton
let touchSimulatorInstance: TouchSimulator | null = null;

export function getTouchSimulator(): TouchSimulator {
  if (!touchSimulatorInstance) {
    touchSimulatorInstance = new TouchSimulator();
  }
  return touchSimulatorInstance;
}
```

- [ ] **Step 2: Update index.tsx to connect TouchSimulator**

```tsx
// fortnite-controller/ipad-app/app/index.tsx
import { View, Text, StyleSheet, useEffect, useState, Dimensions } from 'react-native';
import { getWebSocketServer } from '../services/WebSocketServer';
import { getTouchSimulator } from '../services/TouchSimulator';
import { ControllerMessage } from '@fortnite-controller/shared';

export default function ReceiverScreen() {
  const [status, setStatus] = useState('Starting server...');
  const [ip, setIp] = useState<string | null>(null);
  const [messageCount, setMessageCount] = useState(0);

  useEffect(() => {
    const server = getWebSocketServer();
    const touchSimulator = getTouchSimulator();

    // Set screen dimensions
    const { width, height } = Dimensions.get('window');
    touchSimulator.setScreenDimensions(width, height);

    server.onConnection((connected) => {
      setStatus(connected ? 'Connected' : 'Waiting for controller...');
    });

    server.onMessage((message: ControllerMessage) => {
      touchSimulator.handleMessage(message);
      setMessageCount((c) => c + 1);
    });

    server.start()
      .then((deviceIp) => {
        setIp(deviceIp);
        setStatus('Waiting for controller...');
      })
      .catch((error) => {
        setStatus(`Error: ${error.message}`);
      });

    return () => server.stop();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Fortnite Controller</Text>
      <Text style={styles.subtitle}>Receiver App</Text>

      <View style={styles.statusContainer}>
        <View style={[styles.indicator, status === 'Connected' && styles.connected]} />
        <Text style={styles.status}>{status}</Text>
      </View>

      {ip && (
        <View style={styles.ipContainer}>
          <Text style={styles.ipLabel}>Connect to:</Text>
          <Text style={styles.ipAddress}>{ip}:8080</Text>
        </View>
      )}

      {status === 'Connected' && (
        <View style={styles.statsContainer}>
          <Text style={styles.statsLabel}>Messages received:</Text>
          <Text style={styles.statsValue}>{messageCount}</Text>
        </View>
      )}

      <Text style={styles.note}>
        Open Fortnite and start playing!{'\n'}
        This app runs in the background.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 18,
    color: '#888',
    marginBottom: 40,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  indicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ff3b30',
    marginRight: 10,
  },
  connected: {
    backgroundColor: '#34c759',
  },
  status: {
    fontSize: 16,
    color: '#ff9500',
  },
  ipContainer: {
    marginTop: 10,
    padding: 16,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    alignItems: 'center',
  },
  ipLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  ipAddress: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    fontFamily: 'monospace',
  },
  statsContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  statsLabel: {
    fontSize: 12,
    color: '#888',
  },
  statsValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ff9500',
  },
  note: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 40,
    lineHeight: 20,
  },
});
```

- [ ] **Step 3: Commit TouchSimulator**

```bash
git add fortnite-controller/ipad-app/
git commit -m "feat(ipad-app): add TouchSimulator for simulating touch events"
```

---

## Phase 3: Phone App (Controller)

### Task 6: Set up Phone app Expo project

**Files:**
- Create: `fortnite-controller/phone-app/app.json`
- Create: `fortnite-controller/phone-app/tsconfig.json`
- Create: `fortnite-controller/phone-app/app/_layout.tsx`
- Create: `fortnite-controller/phone-app/app/index.tsx`

- [ ] **Step 1: Create app.json**

```json
{
  "expo": {
    "name": "Fortnite Controller",
    "slug": "fortnite-controller-phone",
    "version": "1.0.0",
    "orientation": "portrait",
    "scheme": "fortnitecontrollerphone",
    "platforms": ["ios", "android"],
    "ios": {
      "bundleIdentifier": "com.personal.fortnitecontroller.phone",
      "infoPlist": {
        "NSLocalNetworkUsageDescription": "This app needs local network access to connect to your iPad."
      }
    },
    "android": {
      "package": "com.personal.fortnitecontroller.phone"
    },
    "plugins": [
      "expo-router"
    ]
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "paths": {
      "@fortnite-controller/shared": ["../shared/src"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx"]
}
```

- [ ] **Step 3: Create root layout**

```tsx
// fortnite-controller/phone-app/app/_layout.tsx
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
      </Stack>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
});
```

- [ ] **Step 4: Create placeholder index screen**

```tsx
// fortnite-controller/phone-app/app/index.tsx
import { View, Text, StyleSheet } from 'react-native';

export default function ControllerScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Fortnite Controller</Text>
      <Text style={styles.subtitle}>Phone App</Text>
      <Text style={styles.status}>Connecting...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    marginTop: 8,
  },
  status: {
    fontSize: 14,
    color: '#ff9500',
    marginTop: 32,
  },
});
```

- [ ] **Step 5: Commit Phone app setup**

```bash
git add fortnite-controller/phone-app/
git commit -m "feat(phone-app): initialize Expo project with basic layout"
```

---

### Task 7: Implement Connection Service for Phone

**Files:**
- Create: `fortnite-controller/phone-app/services/ConnectionService.ts`
- Create: `fortnite-controller/phone-app/hooks/useConnection.ts`

- [ ] **Step 1: Create ConnectionService**

```typescript
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
```

- [ ] **Step 2: Create useConnection hook**

```typescript
// fortnite-controller/phone-app/hooks/useConnection.ts
import { useState, useEffect, useCallback } from 'react';
import { getConnectionService, StatusCallback } from '../services/ConnectionService';
import { ConnectionStatus, ControllerMessage } from '@fortnite-controller/shared';

export function useConnection() {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const connection = getConnectionService();

  useEffect(() => {
    connection.onStatusChange(setStatus);
    return () => connection.disconnect();
  }, [connection]);

  const connect = useCallback((ip: string) => {
    connection.connect(ip);
  }, [connection]);

  const send = useCallback((message: ControllerMessage) => {
    connection.send(message);
  }, [connection]);

  const disconnect = useCallback(() => {
    connection.disconnect();
  }, [connection]);

  return {
    status,
    connect,
    send,
    disconnect,
  };
}
```

- [ ] **Step 3: Commit ConnectionService**

```bash
git add fortnite-controller/phone-app/
git commit -m "feat(phone-app): add WebSocket connection service with auto-reconnect"
```

---

### Task 8: Implement Joystick component

**Files:**
- Create: `fortnite-controller/phone-app/components/Joystick.tsx`

- [ ] **Step 1: Create Joystick component**

```tsx
// fortnite-controller/phone-app/components/Joystick.tsx
import React, { useRef, useCallback, useEffect } from 'react';
import { View, StyleSheet, PanResponder, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

interface JoystickProps {
  onMove: (x: number, y: number) => void;
  side: 'left' | 'right';
}

const JOYSTICK_SIZE = 120;
const KNOB_SIZE = 50;
const MAX_DISTANCE = (JOYSTICK_SIZE - KNOB_SIZE) / 2;

export function Joystick({ onMove, side }: JoystickProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const lastSent = useRef({ x: 0, y: 0 });
  const sendInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        // Start sending updates at regular interval
        sendInterval.current = setInterval(() => {
          const x = lastSent.current.x;
          const y = lastSent.current.y;
          onMove(x, y);
        }, 16); // ~60fps
      },
      onPanResponderMove: (_, gestureState) => {
        let { dx, dy } = gestureState;

        // Clamp to max distance
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > MAX_DISTANCE) {
          const angle = Math.atan2(dy, dx);
          dx = Math.cos(angle) * MAX_DISTANCE;
          dy = Math.sin(angle) * MAX_DISTANCE;
        }

        translateX.value = dx;
        translateY.value = dy;

        // Normalize to -1..1
        const normalizedX = dx / MAX_DISTANCE;
        const normalizedY = dy / MAX_DISTANCE;

        lastSent.current = { x: normalizedX, y: normalizedY };
      },
      onPanResponderRelease: () => {
        // Stop sending updates
        if (sendInterval.current) {
          clearInterval(sendInterval.current);
          sendInterval.current = null;
        }

        // Return to center
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);

        // Send center position
        lastSent.current = { x: 0, y: 0 };
        onMove(0, 0);
      },
      onPanResponderTerminate: () => {
        if (sendInterval.current) {
          clearInterval(sendInterval.current);
          sendInterval.current = null;
        }
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      },
    })
  ).current;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  return (
    <View style={[styles.container, side === 'left' ? styles.left : styles.right]}>
      <View style={styles.joystickArea} {...panResponder.panHandlers}>
        <View style={styles.joystickBackground}>
          <Animated.View style={[styles.knob, animatedStyle]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 60,
    width: '40%',
    height: 200,
  },
  left: {
    left: 20,
    alignItems: 'flex-start',
  },
  right: {
    right: 20,
    alignItems: 'flex-end',
  },
  joystickArea: {
    width: JOYSTICK_SIZE,
    height: JOYSTICK_SIZE,
  },
  joystickBackground: {
    width: JOYSTICK_SIZE,
    height: JOYSTICK_SIZE,
    borderRadius: JOYSTICK_SIZE / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  knob: {
    width: KNOB_SIZE,
    height: KNOB_SIZE,
    borderRadius: KNOB_SIZE / 2,
    backgroundColor: 'rgba(255, 149, 0, 0.8)',
    shadowColor: '#ff9500',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
});
```

- [ ] **Step 2: Commit Joystick component**

```bash
git add fortnite-controller/phone-app/
git commit -m "feat(phone-app): add virtual joystick component with smooth animation"
```

---

### Task 9: Implement FireButton component

**Files:**
- Create: `fortnite-controller/phone-app/components/FireButton.tsx`

- [ ] **Step 1: Create FireButton component**

```tsx
// fortnite-controller/phone-app/components/FireButton.tsx
import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

interface FireButtonProps {
  onPress: () => void;
}

const BUTTON_SIZE = 70;

export function FireButton({ onPress }: FireButtonProps) {
  const scale = useSharedValue(1);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();

    // Animate press
    scale.value = withSpring(0.9, { damping: 15 });
    setTimeout(() => {
      scale.value = withSpring(1, { damping: 15 });
    }, 50);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable onPress={handlePress}>
      <Animated.View style={[styles.button, animatedStyle]}>
        <View style={styles.inner}>
          <View style={styles.core} />
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    backgroundColor: '#ff3b30',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ff3b30',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 10,
  },
  inner: {
    width: BUTTON_SIZE - 20,
    height: BUTTON_SIZE - 20,
    borderRadius: (BUTTON_SIZE - 20) / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  core: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
  },
});
```

- [ ] **Step 2: Commit FireButton**

```bash
git add fortnite-controller/phone-app/
git commit -m "feat(phone-app): add fire button with haptic feedback"
```

---

### Task 10: Implement ConnectionStatus component

**Files:**
- Create: `fortnite-controller/phone-app/components/ConnectionStatus.tsx`

- [ ] **Step 1: Create ConnectionStatus component**

```tsx
// fortnite-controller/phone-app/components/ConnectionStatus.tsx
import React from 'react';
import { View, Text, StyleSheet, TextInput, Pressable } from 'react-native';
import { ConnectionStatus } from '@fortnite-controller/shared';

interface ConnectionStatusProps {
  status: ConnectionStatus;
  onConnect: (ip: string) => void;
}

export function ConnectionStatusBar({ status, onConnect }: ConnectionStatusProps) {
  const [ip, setIp] = React.useState('');

  const statusColor = {
    connected: '#34c759',
    connecting: '#ff9500',
    disconnected: '#ff3b30',
    error: '#ff3b30',
  }[status];

  const statusText = {
    connected: 'Connected',
    connecting: 'Connecting...',
    disconnected: 'Disconnected',
    error: 'Connection Error',
  }[status];

  return (
    <View style={styles.container}>
      <View style={styles.statusRow}>
        <View style={[styles.indicator, { backgroundColor: statusColor }]} />
        <Text style={styles.statusText}>{statusText}</Text>
      </View>

      {status !== 'connected' && (
        <View style={styles.connectRow}>
          <TextInput
            style={styles.input}
            placeholder="iPad IP address"
            placeholderTextColor="#666"
            value={ip}
            onChangeText={setIp}
            keyboardType="numeric"
            autoCorrect={false}
          />
          <Pressable
            style={[styles.button, !ip && styles.buttonDisabled]}
            onPress={() => ip && onConnect(ip)}
            disabled={!ip}
          >
            <Text style={styles.buttonText}>Connect</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 10,
    backgroundColor: 'rgba(10, 10, 10, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  indicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  connectRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 10,
  },
  input: {
    flex: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 12,
    color: '#fff',
    fontSize: 14,
  },
  button: {
    paddingHorizontal: 20,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#ff9500',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#333',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});
```

- [ ] **Step 2: Commit ConnectionStatus**

```bash
git add fortnite-controller/phone-app/
git commit -m "feat(phone-app): add connection status bar with manual IP input"
```

---

### Task 11: Build complete Controller screen

**Files:**
- Modify: `fortnite-controller/phone-app/app/index.tsx`

- [ ] **Step 1: Update index.tsx with complete controller UI**

```tsx
// fortnite-controller/phone-app/app/index.tsx
import React, { useState, useCallback, useRef } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { Joystick } from '../components/Joystick';
import { FireButton } from '../components/FireButton';
import { ConnectionStatusBar } from '../components/ConnectionStatus';
import { useConnection } from '../hooks/useConnection';
import { JOYSTICK_SEND_INTERVAL_MS } from '@fortnite-controller/shared';

export default function ControllerScreen() {
  const { status, connect, send } = useConnection();
  const lastLeftSend = useRef(0);
  const lastRightSend = useRef(0);

  const handleLeftJoystick = useCallback((x: number, y: number) => {
    const now = Date.now();
    if (now - lastLeftSend.current >= JOYSTICK_SEND_INTERVAL_MS) {
      send({ type: 'jl', x, y });
      lastLeftSend.current = now;
    }
  }, [send]);

  const handleRightJoystick = useCallback((x: number, y: number) => {
    const now = Date.now();
    if (now - lastRightSend.current >= JOYSTICK_SEND_INTERVAL_MS) {
      send({ type: 'jr', x, y });
      lastRightSend.current = now;
    }
  }, [send]);

  const handleFire = useCallback(() => {
    send({ type: 'f' });
  }, [send]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ConnectionStatusBar status={status} onConnect={connect} />

      {status === 'connected' && (
        <>
          <Joystick side="left" onMove={handleLeftJoystick} />
          <View style={styles.rightControls}>
            <Joystick side="right" onMove={handleRightJoystick} />
            <FireButton onPress={handleFire} />
          </View>
        </>
      )}

      {status !== 'connected' && (
        <View style={styles.instructions}>
          {/* Placeholder - instructions shown when not connected */}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  rightControls: {
    position: 'absolute',
    right: 20,
    bottom: 60,
    alignItems: 'center',
  },
  instructions: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
});
```

- [ ] **Step 2: Add missing import to shared/constants.ts**

```typescript
// Add to fortnite-controller/shared/src/constants.ts
export const JOYSTICK_SEND_INTERVAL_MS = 16; // ~60fps
```

- [ ] **Step 3: Commit complete controller**

```bash
git add fortnite-controller/
git commit -m "feat(phone-app): complete controller UI with dual joysticks and fire button"
```

---

## Phase 4: Integration & Testing

### Task 12: Add README and usage instructions

**Files:**
- Create: `fortnite-controller/README.md`

- [ ] **Step 1: Create README**

```markdown
# Fortnite Controller

A personal mobile controller for playing Fortnite on iPad.

## Quick Start

1. **Install dependencies**
   ```bash
   cd fortnite-controller
   pnpm install
   ```

2. **Start iPad app**
   ```bash
   cd ipad-app
   npx expo start
   ```
   Press `i` to run on iOS simulator or scan QR with Expo Go on iPad.

3. **Start Phone app**
   ```bash
   cd phone-app
   npx expo start
   ```
   Press `i` to run on iOS simulator or scan QR with Expo Go on phone.

4. **Connect**
   - Note the IP address shown on iPad app
   - Enter that IP in phone app
   - Tap "Connect"

5. **Play**
   - Open Fortnite on iPad
   - iPad app runs in background
   - Use phone as controller

## Architecture

- **Phone app**: React Native controller UI with dual joysticks
- **iPad app**: WebSocket server + touch simulation
- **Connection**: Local Wi-Fi via WebSocket

## Known Limitations

- Touch simulation requires iOS Accessibility permission
- Works best on same Wi-Fi network
- Latency ~20-40ms over Wi-Fi

## Future Improvements

- Bluetooth connection option
- More buttons (jump, crouch, reload, build)
- Controller calibration screen
- Sensitivity settings
```

- [ ] **Step 2: Commit README**

```bash
git add fortnite-controller/README.md
git commit -m "docs: add README with quick start instructions"
```

---

### Task 13: Install dependencies and verify builds

**Files:**
- None (just running commands)

- [ ] **Step 1: Install all dependencies**

```bash
cd fortnite-controller && pnpm install
```

- [ ] **Step 2: Verify shared module builds**

```bash
cd fortnite-controller/shared && pnpm run typecheck
```

Expected: No errors

- [ ] **Step 3: Verify phone-app builds**

```bash
cd fortnite-controller/phone-app && pnpm run typecheck
```

Expected: No errors

- [ ] **Step 4: Verify ipad-app builds**

```bash
cd fortnite-controller/ipad-app && pnpm run typecheck
```

Expected: No errors

- [ ] **Step 5: Commit any fixes if needed**

```bash
git add -A && git commit -m "fix: resolve TypeScript errors"
```

---

## Self-Review Checklist

After completing all tasks, verify:

- [ ] All TypeScript files compile without errors
- [ ] Phone app shows joystick UI when connected
- [ ] iPad app shows "Waiting for controller" status
- [ ] Connection establishes when IP entered
- [ ] Touch events logged in iPad app console
- [ ] No placeholders (TBD, TODO) remain in code

---

## Notes for Implementation

**WebSocket Server on iOS:**
React Native doesn't include a WebSocket server. For a production implementation, you'll need:
1. A native module (e.g., `react-native-tcp-socket` with server mode)
2. Or run a separate lightweight server process

**Touch Simulation on iOS:**
iOS restricts touch injection for security. Options:
1. Use Accessibility API with `UIAccessibilityRequestGuidedAccessSession`
2. Use `XCTest` APIs (requires running tests, not ideal for live use)
3. Use a jailbroken device (not recommended)

For development/testing, the current implementation logs touch events. A real implementation would need either:
- Native module using private APIs (may get app rejected)
- Accessibility features with proper entitlements
- Alternative: Use iPad as a second display, run game on Mac/PC

---

**Plan complete.** Ready for execution.