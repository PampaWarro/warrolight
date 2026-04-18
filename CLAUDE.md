# Warrolight

LED light show system for live DJ sets and Burning Man art installations. A central computer runs light programs synchronized to music, streams RGB pixel data to LED strip controllers (Teensy, ESP32, Arduino) connected via Ethernet, Serial, or ESP-NOW wireless mesh.

## Architecture

```
Audio Input → FFT/Metrics → Light Programs (60fps loop)
                                    ↓
Web UI (React) ←WebSocket→ Server (Node.js) → DeviceMultiplexer
                                                    ↓
                                 ┌──────────────────┼──────────────────┐
                             Ethernet/UDP        Serial          ESP-NOW/WiFi
                                 ↓                  ↓                  ↓
                           Main structure      Direct LEDs      Wireless sticks
                           (Teensy+ETH)                         (ESP32 mesh)
```

Four components:
- **server/** — Node.js backend: program scheduler, device drivers, WebSocket API (port 8080)
- **web/** — React+TypeScript control panel: program selection, parameter tuning, 3D LED visualizer
- **audio/** — Real-time audio input (native rtaudio or Python fallback), FFT, frequency band metrics
- **arduino/** — Firmware for LED controllers (Teensy 4.1, ESP32, Arduino) receiving RGB frames

## Commands

```bash
# Install dependencies (run in each directory)
cd server && yarn
cd web && yarn
cd audio && yarn

# Run everything via tmux
./tmux-session.sh

# Or run individually
cd server && yarn start          # starts server with default setup (configured in package.json warroLight.setup)
cd web && yarn start             # starts React dev server on :3000

# Code quality
cd server && yarn lint           # ESLint
cd server && yarn prettier       # Prettier on server JS files
cd web && yarn prettier          # Prettier on web TS/TSX files
```

The server setup is selected via `package.json` field `warroLight.setup` (currently `"palo"`), which maps to a file in `server/setups/` (e.g., `palo.json`). You can also pass the setup filename directly: `node src/index.js conga.json`.

Light program code can be edited while the server is running — clicking "Restart" in the web UI clears the require cache and reloads the program module without restarting the server.

## Key Concepts

### Setups (`server/setups/`)
Each installation (conga, joya, palo, fuego, circo) has a JSON config defining:
- **geometry** — 3D coordinates of every LED (`setups/geometries/`)
- **shapeMapping** — named regions within the geometry (`setups/shape-mappings/`)
- **outputDevices** — device type, address, port, encoding
- **lightsToDevicesMapping** — which LED index ranges go to which device

### Light Programs (`server/src/light-programs/programs/`)
~63 programs that produce per-frame LED colors. Each extends `LightProgram`:
```js
class MyProgram extends LightProgram {
  init() { /* one-time setup */ }
  drawFrame(leds, context) { /* set leds[i] = [r, g, b] each frame */ }
  static configSchema() { /* define tunable parameters */ }
}
```
Programs access audio data via `context.audio` (e.g., `bassMax`, `fastPeakDecay`, `fft[]`).

To add a new program:
1. Create `server/src/light-programs/programs/my-program.js`
2. Add the program name to `programNames` array in `server/src/LightController.js`

### Devices (`server/src/devices/`)
Drivers for streaming RGB data to hardware: `serial`, `udp`, `udp-chunked`, `udp-wled`, `artnet` (angio), `falcon`. Each setup config specifies which driver and encoding to use.

### Communication Protocols
- **Serial** — USB, request-response with `XXX`/`YEAH` handshake
- **UDP / UDP Chunked** — Ethernet, fire-and-forget with sequence numbers. Chunked splits large frames into 300-LED packets (most common protocol)
- **ESP-NOW** — Wireless for sticks/palos. Gateway receives UDP from server, rebroadcasts to clients over ESP-NOW
- **ArtNet / Falcon** — Professional DMX-over-Ethernet controllers
- **WLED** — Off-the-shelf WLED-compatible devices

See `docs/hardware-and-protocols.md` for full details, `arduino/Protocol.md` for wire format, `server/SPEC.md` for the WebSocket API.

### Audio Metrics
Real-time FFT splits audio into bass/mid/high bands. Each band provides: `max`, `avg`, `rms`, `peakDecay`, `fastPeakDecay`. Global metrics: `max`, `rms`, `slowRms`, `peakDecay`, `fastPeakDecay`. Raw `fft[]` array available for frequency-domain programs.

## Documentation

Detailed guides in `docs/`:
- `docs/introduction.md` — technical overview of the full system
- `docs/light-programs.md` — program catalog, base classes, how to write new programs
- `docs/geometries-and-setups.md` — how to define LED layouts and configure installations
- `docs/hardware-and-protocols.md` — device drivers, hardware catalog, deployment checklists, protocol details
- `docs/live-shows.md` — show composition, presets, the web mixer, music sync, real examples

## Project Layout

```
server/
  src/
    index.js                          # entry point — loads setup, starts audio + server
    server.js                         # WebSocket server (:8080)
    LightController.js                # program registry, preset management
    ProgramScheduler.js               # 60fps game loop driving drawFrame()
    DeviceMultiplexer.js              # maps logical LEDs → physical devices
    LightsService.js                  # WebSocket event handlers
    light-programs/
      base-programs/                  # LightProgram, FX base classes
      programs/                       # all light programs
      utils/                          # ColorUtils, layers, drawables
    devices/                          # serial, udp, artnet, falcon drivers
  setups/
    geometries/                       # 3D LED coordinate definitions
    shape-mappings/                   # named regions
    program-presets/                   # saved parameter presets
    *.json                            # setup configs (conga, joya, palo, etc.)

web/
  src/
    App.tsx                           # main React component
    LightsSimulator.tsx               # 3D LED visualizer (Three.js)
    api.tsx                           # WebSocket client
    ProgramList.tsx / ProgramConfig.tsx

audio/
  input.js                           # audio input abstraction
  rtaudioInput.js                    # native C++ audio input
  pythonFallbackInput.js             # Python subprocess fallback

audio/
  input.js                           # audio input abstraction
  rtaudioInput.js                    # native C++ audio input
  pythonFallbackInput.js             # Python subprocess fallback

arduino/
  teensy-eth/                        # Teensy 4.1 + Ethernet (OctoWS2811)
  esp32-eth/                         # ESP32 + Ethernet PHY
  espnow-client/                     # ESP-NOW wireless receiver
  espnow-gw-eth/                     # ESP-NOW gateway
  joyabikes/, warreables/, jajalamp/ # standalone peripheral projects
  fire-client/, fire-sender/         # RF24 flame puffer remote
  libraries/                         # FastLED, RF24, WarroUDP, ESPNOWPixels

docs/                                # detailed technical documentation
```
