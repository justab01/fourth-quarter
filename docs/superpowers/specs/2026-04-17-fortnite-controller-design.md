# Fortnite Controller - Design Specification

**Date:** 2026-04-17
**Project:** Personal mobile controller for playing Fortnite on iPad

## Overview

A simplified virtual controller system consisting of two apps:
1. **Phone App** - Virtual controller with dual joysticks and fire button
2. **iPad App** - Receiver that simulates touch events on Fortnite

Both apps communicate over local Wi-Fi with sub-30ms latency.

## Architecture

```
┌─────────────────┐         Wi-Fi/WebSocket        ┌─────────────────┐
│     PHONE       │ ◄─────────────────────────────► │      IPAD       │
│                 │                                  │                 │
│  ┌───────────┐  │         Low latency             │   ┌─────────┐  │
│  │   Left    │  │         < 30ms                   │   │Fortnite │  │
│  │  Joystick │  │                                  │   │  Game   │  │
│  └───────────┘  │                                  │   └─────────┘  │
│  ┌───────────┐  │                                  │   ┌─────────┐  │
│  │   Right   │  │                                  │   │Receiver │  │
│  │  Joystick │  │                                  │   │  App    │  │
│  │  + Fire   │  │                                  │   └─────────┘  │
│  └───────────┘  │                                  │                 │
└─────────────────┘                                  └─────────────────┘
```

## Components

### Phone App (Controller)

**UI Layout:**
- Full-screen controller interface
- Left side: Virtual joystick (movement) - 40% screen width
- Right side: Virtual joystick (camera/aim) + fire button overlay - 40% screen width
- Top bar: Connection status indicator (green = connected, red = disconnected)
- Center: IP address display for manual connection if auto-discovery fails

**Joystick Behavior:**
- Touch position maps to relative (x, y) values from -1 to 1
- Center position = (0, 0)
- Smooth interpolation to prevent jittery movement
- Touch events sent at 60fps max rate

**Fire Button:**
- Overlay on right joystick
- Tap to fire, no hold behavior for this simplified version
- Haptic feedback on press

**Connection:**
- Auto-discovers iPad via mDNS/Bonjour on local network
- Falls back to manual IP entry if discovery fails
- Shows connection status at all times
- Auto-reconnects on disconnect

### iPad App (Receiver)

**Core Functionality:**
- Runs in background while Fortnite is active
- Receives controller inputs over WebSocket
- Simulates touch events using iOS Accessibility APIs
- One-time permission request for Accessibility

**Touch Simulation:**
- Maps left joystick to movement joystick area on Fortnite (left third of screen)
- Maps right joystick to camera control area (right third of screen)
- Fire button simulates tap in fire button region (right side, bottom area)

**Visual Feedback:**
- Minimal UI - just connection status
- Shows "Connected to [Phone Name]" when active
- Displays incoming input visualization (optional debug overlay)

### Connection Layer

**Protocol:**
- WebSocket over local Wi-Fi (port 8080)
- Binary message format for efficiency

**Message Types:**
```
JOYSTICK_LEFT:  { type: 'jl', x: number, y: number }
JOYSTICK_RIGHT: { type: 'jr', x: number, y: number }
FIRE:           { type: 'f' }
HEARTBEAT:      { type: 'h', timestamp: number }
```

**Discovery:**
- mDNS/Bonjour service advertising "_fortnitecontroller._tcp"
- Phone scans for this service on local network
- Automatic pairing when found

**Reconnection:**
- Heartbeat every 500ms
- If no response for 2 seconds, attempt reconnect
- Exponential backoff on repeated failures

## Tech Stack

- **Framework:** React Native with Expo
- **Language:** TypeScript
- **Network Discovery:** `react-native-mdns` or custom Bonjour implementation
- **Communication:** WebSocket (built into React Native)
- **Touch Simulation:** iOS Accessibility API via `react-native-accessibility`
- **Haptics:** Expo Haptics

## File Structure

```
fortnite-controller/
├── phone-app/
│   ├── app/
│   │   ├── _layout.tsx
│   │   └── index.tsx          # Controller screen
│   ├── components/
│   │   ├── Joystick.tsx       # Virtual joystick component
│   │   ├── FireButton.tsx     # Fire button overlay
│   │   └── ConnectionStatus.tsx
│   ├── services/
│   │   └── ConnectionService.ts
│   ├── package.json
│   └── app.json
├── ipad-app/
│   ├── app/
│   │   ├── _layout.tsx
│   │   └── index.tsx          # Receiver screen
│   ├── services/
│   │   ├── WebSocketServer.ts
│   │   └── TouchSimulator.ts  # Accessibility-based touch
│   ├── package.json
│   └── app.json
└── shared/
    ├── types.ts               # Message types
    └── constants.ts           # Port, intervals, etc.
```

## Touch Mapping

**iPad Screen Regions (Portrait orientation assumed):**

| Control | Screen Region | Coordinates |
|---------|---------------|-------------|
| Movement Joystick | Left third, bottom half | x: 0-33%, y: 50-100% |
| Camera Joystick | Right third, bottom half | x: 67-100%, y: 50-100% |
| Fire Button | Right side, lower area | x: 80-95%, y: 60-80% |

**Note:** Fortnite uses dynamic touch regions. User may need to calibrate regions in settings. Future version could include a calibration screen.

## User Flow

1. **First Time Setup:**
   - Install phone app on phone
   - Install iPad app on iPad
   - Open iPad app, grant Accessibility permission when prompted
   - Note the displayed IP address

2. **Playing:**
   - Ensure both devices on same Wi-Fi
   - Open iPad app, note "Waiting for connection"
   - Open phone app, it auto-discovers iPad
   - Connection status turns green
   - Open Fortnite on iPad (iPad app runs in background)
   - Use phone as controller

3. **Calibration (if needed):**
   - If controls feel off, use Settings to adjust touch regions
   - Simple drag handles to resize active areas

## Success Criteria

- Connection establishes within 5 seconds
- Input latency under 30ms (perceived as instant)
- No dropped inputs during normal gameplay
- Battery usage reasonable (phone app < 5% per hour)

## Future Enhancements (Not in v1)

- Additional buttons (jump, crouch, reload, inventory, build)
- Controller layout customization
- Sensitivity settings
- Vibration feedback for in-game events
- Bluetooth connection option
- Landscape mode support

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| iOS blocks Accessibility for touch simulation | Research `IOHIDEvent` or alternative APIs during implementation |
| Wi-Fi latency too high | Optimize message format, reduce send frequency, test with UDP fallback |
| Fortnite updates change touch regions | Build calibration settings, version detection |
| Apple rejects App Store submission | Distribute via TestFlight (personal use) or sideload |

## Implementation Notes

- Start with WebSocket implementation first, add mDNS discovery after core functionality works
- Test touch simulation with a simple target app before integrating with Fortnite
- Consider using `expo-dev-client` for native module access needed for Accessibility API