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