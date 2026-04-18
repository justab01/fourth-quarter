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