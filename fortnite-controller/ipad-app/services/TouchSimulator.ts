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