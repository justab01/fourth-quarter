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