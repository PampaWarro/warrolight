# Warrolight Technical Introduction

Warrolight is a real-time LED light show system built for the Art Car Pampa Warro at Fuego Austral (Argentina's regional Burning Man). It drives thousands of LEDs synchronized to music during live DJ sets, with a web-based control panel for mixing light programs on the fly.

## How it works

The system follows a render-loop architecture similar to a game engine, but instead of drawing pixels to a screen, it pushes RGB color data to physical LED strips at 60 frames per second.

```
                        ┌──────────────────────────────────────┐
                        │            Web Interface             │
                        │   Program selection, parameter       │
                        │   tuning, 3D preview, presets        │
                        │          localhost:3000               │
                        └──────────────┬───────────────────────┘
                                       │ WebSocket (:8080)
                                       │ JSON [type, data]
┌───────────┐          ┌───────────────▼───────────────────────┐
│   Audio   │          │              Server                   │
│   Input   │──FFT────▶│                                       │
│  (rtaudio │  bass/   │  ┌─────────────────────────────────┐  │
│  or Python)  mid/    │  │  ProgramScheduler (60fps loop)  │  │
│           │  high    │  │  calls drawFrame() on active    │  │
└───────────┘  metrics │  │  program each tick              │  │
                       │  └──────────────┬──────────────────┘  │
                       │                 │ leds[i] = [r, g, b] │
                       │  ┌──────────────▼──────────────────┐  │
                       │  │      DeviceMultiplexer          │  │
                       │  │  maps logical LED indices to    │  │
                       │  │  physical device + offset       │  │
                       │  └──────────────┬──────────────────┘  │
                       └─────────────────┼─────────────────────┘
                                         │
              ┌──────────────────────────┼──────────────────────────┐
              │                          │                          │
     ┌────────▼────────┐       ┌────────▼────────┐       ┌────────▼────────┐
     │   Ethernet/UDP  │       │     Serial      │       │    ESP-NOW      │
     │  Teensy / ESP32 │       │  Arduino / USB  │       │   Gateway →     │
     │  wired to main  │       │  direct connect │       │   wireless      │
     │   structure     │       │                 │       │   sticks        │
     └─────────────────┘       └─────────────────┘       └─────────────────┘
```

### The render loop

Every frame (~16ms at 60fps), the `ProgramScheduler` does the following:

1. Clears the LED buffer to black
2. Calls `drawFrame(leds, context)` on the active light program
3. The program writes `[r, g, b]` values into the `leds` array
4. The `DeviceMultiplexer` slices the array and sends each segment to the corresponding physical device over its transport protocol

The `context` object passed to each frame includes:
- `context.audio` — real-time audio metrics (bass/mid/high levels, peak decay, FFT array)
- `context.timeInMs` — elapsed time since the program started
- `context.nowPlaying` — currently playing track metadata

### Light programs

A light program is a class that produces colors for every LED each frame. Programs range from simple (solid color, rainbow) to complex (audio-reactive particle systems, frequency visualizers, cellular automata).

```js
class MyProgram extends LightProgram {
  init() {
    // Called once when the program starts
  }

  drawFrame(leds, context) {
    // Called every frame at 60fps
    // Write colors: leds[i] = [r, g, b]
    const intensity = context.audio.bassMax;
    for (let i = 0; i < leds.length; i++) {
      leds[i] = [intensity * 255, 0, 0];
    }
  }

  static configSchema() {
    // Define parameters exposed as sliders in the web UI
    return { speed: { type: "number", min: 0, max: 10, default: 1 } };
  }
}
```

Programs are registered by name in `server/src/LightController.js`. The `LightController` manages which program is active, its configuration, and saved presets.

Composite programs like `PROGRAM_Transition` assign different sub-programs to different regions of the geometry (e.g., the top of the W gets one effect, the sides get another), allowing layered compositions during a live set.

### Geometry and setups

Each physical installation has a different LED layout. A **setup** defines the full configuration for an installation:

- **Geometry** (`server/setups/geometries/`) — defines the 3D position of every LED. The geometry is built from `Stripe` objects, each representing a physical LED strip with a start point, end point, and LED count. This is what the web visualizer renders and what geometric programs (radial, polar, etc.) use for spatial effects.

- **Shape mapping** (`server/setups/shape-mappings/`) — assigns names to regions of the geometry (e.g., "top", "leftWing", "rightWing"). Programs can target specific shapes for per-region effects.

- **Device mapping** — maps ranges of logical LED indices to physical devices and their offsets. This handles the fact that LED strips may be wired in reverse, start at different offsets on a controller, or span multiple devices.

Example setups include `conga` (tetrahedral art car), `joya` (multi-dome structure), `palo` (stick arrays), and `fuego` (the main Pampa Warro art car).

### Audio pipeline

The system captures audio in real-time from the DJ's mixer output:

1. **Capture** — native `rtaudio` C++ bindings grab PCM samples from the sound card (with a Python/PyAudio fallback)
2. **Processing** — FFT analysis splits the signal into frequency bands (bass: 0-250Hz, mid: 250Hz-4kHz, high: 4kHz+)
3. **Metrics** — for each band and globally, the system computes: peak, RMS, average, and two decay rates (slow and fast). These smooth out the raw signal so programs can react to beats and buildups naturally
4. **Delivery** — the `audioEmitter` broadcasts metrics every frame, available to programs as `context.audio`

This is what makes the lights "dance" — a bass-reactive program might pulse red on `context.audio.bassFastPeakDecay`, while a frequency visualizer maps the `fft[]` array across the LED strip.

### Device communication

The server supports multiple transport protocols for pushing RGB data to LED controllers:

**Wired:**
- **Serial** (USB) — handshake (`XXX` / `YEAH`), then streaming frames with encoding byte + pixel data + acknowledgment. Supports multiple encodings (RGB, VGA, RGB565) trading off quality for bandwidth.
- **Ethernet/UDP** — devices broadcast `YEAH` for discovery, server streams `[sequence][RGB data]` packets. Used for high-bandwidth wired connections (Teensy 4.1 with Ethernet).
- **ArtNet** — industry-standard DMX-over-Ethernet for professional lighting equipment.

**Wireless:**
- **ESP-NOW** — Espressif's peer-to-peer WiFi protocol (no router). A gateway ESP32 with Ethernet receives frames from the server and rebroadcasts to multiple wireless clients (the "palos" / sticks). Each client is assigned an index and filters broadcast packets. The gateway sends hostname beacons for discovery, and clients fall back to a built-in animation on connection timeout.

The `DeviceMultiplexer` abstracts all of this — programs just write to a flat `leds[]` array and the multiplexer handles slicing, encoding, and delivery. For wire-level details see `arduino/Protocol.md`, for hardware specifics see `docs/hardware-and-protocols.md`.

### Web interface

The React web application serves as the live mixing console:

- **Program selector** — browse and switch between ~63 light programs
- **Parameter controls** — real-time sliders for each program's configurable parameters (speed, color, intensity, audio sensitivity, etc.)
- **Presets** — save and recall parameter combinations for quick access during a live show
- **3D visualizer** — renders the LED geometry with live color data using Three.js, so the operator can preview the light show without looking at the physical installation
- **Microphone monitor** — real-time visualization of audio input metrics
- **Device status** — connection state and FPS of each physical device

The UI communicates with the server via WebSocket using a JSON protocol (`[type, data]` messages, documented in `server/SPEC.md`). When the visualizer is active, it receives base64-encoded RGB frames at 60fps.

## Physical installations

Warrolight has been deployed in several art installations:

- **Pampa Warro Art Car** — the original W-shaped structure with LED strips forming a large "W" in the air, driven by Teensy 4.1 over Ethernet, plus wireless sticks (palos) via ESP-NOW
- **Conga** — a tetrahedral art car with 1290 LEDs
- **Joya** — a multi-dome jewel-like structure
- **Circo** — a 4-palo (stick) setup
- **Warreables / Joya Bikes / Jajalamp** — smaller wearable and bike-mounted installations

Each installation uses the same server and web interface — only the setup configuration changes.
