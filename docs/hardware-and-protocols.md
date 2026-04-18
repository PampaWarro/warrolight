# Hardware and Protocols

This guide covers the physical hardware used in Warrolight installations, the communication protocols between the server and LED controllers, and practical setup information.

For wire-level protocol details, see `arduino/Protocol.md`. For the WebSocket API between server and web UI, see `server/SPEC.md`.

## Central computer

The server runs on a standard computer connected to the DJ's audio output. Tested platforms:

- **Mac Mini** — the current standard for live shows. Compact, reliable, runs both server and web UI
- **Mac laptop** — used for development and smaller shows
- **Windows** — partially supported. The native `rtaudio` audio input may not compile; falls back to a Python/PyAudio subprocess which requires additional setup

The server is a Node.js application with no GPU requirements. The main constraint is a stable network connection to the LED controllers.

## Device types

The server supports six device drivers for streaming RGB data to LED controllers. Each has different trade-offs in bandwidth, latency, and hardware requirements.

### Serial (USB)

The original protocol, still used for simple setups and testing.

| Property | Value |
|---|---|
| Driver | `serial` |
| Baud rate | 500,000 (configurable) |
| Encoding | RGB (3 bytes/LED) |
| Max LEDs | ~10,000/frame at 60fps (serial buffer limited) |
| Latency | Low (request-response) |
| Hardware | Any Arduino/Teensy via USB |

**How it works:** Server sends frame, waits for `OK` acknowledgment before sending the next. Handshake: `XXX` → `YEAH`. Auto-reconnects on 3-second timeout.

**When to use:** Direct USB connections, single-strip testing, simple setups.

### UDP

Basic single-packet UDP for moderate LED counts.

| Property | Value |
|---|---|
| Driver | `udp` |
| Port | Configurable (commonly 2222, 4444, 8888) |
| Encoding | RGB (3 bytes/LED) |
| Max LEDs | ~490/packet (1500 byte MTU) |
| Latency | Very low (fire-and-forget) |
| Hardware | ESP32 or Teensy with Ethernet |

**How it works:** Device broadcasts `YEAH` every second for discovery. Server sends `[sequence, encoding, RGB data]`. No acknowledgment — sequence numbers detect loss. DNS hostname resolution supported.

**When to use:** Small to medium wired setups where a single UDP packet fits.

### UDP Chunked

Splits large frames across multiple UDP packets. The most commonly used protocol — 16 out of 23 setups use it.

| Property | Value |
|---|---|
| Driver | `udp-chunked` |
| Port | Configurable |
| Chunk size | 300 LEDs default (configurable) |
| Encoding | RGB (3 bytes/LED) per chunk |
| Max LEDs | No hard limit (multiple packets) |
| Latency | Low |
| Hardware | ESP32 or Teensy with Ethernet |

**How it works:** Same discovery as UDP. Frames are split into chunks of 300 LEDs, each sent as a separate packet: `[sequence, chunk_index, encoding, RGB data]`. The receiver reassembles chunks and renders when the last chunk arrives.

**When to use:** Most wired installations. The default choice for Ethernet-connected devices.

**Important:** ESP32 UDP has a 1500-byte MTU. Packets larger than this silently fail to arrive — this is why chunking exists.

### UDP WLED

Standard WLED protocol for off-the-shelf WLED-compatible controllers.

| Property | Value |
|---|---|
| Driver | `udp-wled` |
| Port | 21324 (WLED default) |
| Encoding | DNRGB (WLED native) |
| Max LEDs | 489/packet (auto-chunks for more) |
| Latency | Low |
| Hardware | Any WLED-compatible controller |

**How it works:** Sends DNRGB-encoded packets directly to the WLED device. Status polled via HTTP `/json/info`. No discovery handshake — assumes the device is always available.

**When to use:** When using commercial WLED controllers instead of custom firmware.

### ArtNet (Angio)

Industry-standard DMX-over-Ethernet for professional lighting equipment.

| Property | Value |
|---|---|
| Driver | `angio` |
| Port | 6454 (ArtNet standard) |
| Encoding | DMX (170 LEDs per universe) |
| Max LEDs | ~43,000 (256 universes) |
| Latency | Low |
| Hardware | Angio controllers with WebSocket + ArtNet |

**How it works:** WebSocket connection (port 81) for configuration and status. Server queries the device for its universe/channel mapping, then sends ArtNet DMX packets over UDP. Each universe carries 512 bytes (170 RGB LEDs).

**When to use:** Professional lighting setups, high LED counts, integration with DMX ecosystems.

### Falcon

Protocol for Falcon F16V5 and similar controllers.

| Property | Value |
|---|---|
| Driver | `falcon` |
| Port | 6454 (ArtNet) |
| Encoding | DMX via ArtNet |
| Max LEDs | Controller-dependent |
| Latency | Low |
| Hardware | Falcon F16V5 controllers |

**How it works:** HTTP POST to `/api` to query port configuration (LED counts, universe assignments). Then sends ArtNet packets like the Angio driver. One-time configuration at startup — no ongoing status polling.

**When to use:** Falcon hardware controllers. Currently used in the Palo setup for the wired sticks.

## Wireless: ESP-NOW

ESP-NOW is Espressif's peer-to-peer WiFi protocol used for the wireless sticks (palos/totems). No router or access point needed.

### Architecture

```
Server ──UDP Chunked──→ Gateway (ESP32 + Ethernet)
                              │
                         ESP-NOW broadcast
                              │
                    ┌─────────┼─────────┐
                    ↓         ↓         ↓
                Client 0  Client 1  Client 2  ...
                (stick)   (stick)   (stick)
```

- **Gateway** (`espnow-gw-eth`): ESP32 with Ethernet PHY. Receives full frames from the server via UDP chunked, rebroadcasts over ESP-NOW
- **Clients** (`espnow-client`): ESP32 or ESP8266 with a WS2812B LED strip. Each assigned a client index at compile time

### Packet format

ESP-NOW max payload: 250 bytes → 4-byte header + 82 LEDs per packet.

```
[0] 'W'     — magic header
[1] seq     — frame sequence number
[2] client  — target client index
[3] offset  — packet index within frame
[4+] RGB    — 3 bytes per LED, up to 82 LEDs
```

All clients receive all packets (broadcast) but filter by their client index.

### Discovery

Gateway broadcasts `BEACON<hostname>` every 250ms. Clients lock onto the gateway matching their configured `GATEWAY_HOSTNAME` by MAC address.

### Fallback

If a client loses connection for 1 second, or receives all-black frames for 10 seconds, it shows a built-in blue breathing animation.

### Typical configurations

| Setup | Clients | LEDs/client | Channel | Notes |
|---|---|---|---|---|
| joya-totems | 6 | 300 | 7 | Joya sculpture totems |
| warro-totems | 6 | 300 | 2 | Main Warro totems |
| discochalet | 4 | 300 | 7 | Disco Chalet sticks |
| palo | 4 | 300 | 7 | Palo wireless sticks, 1800mA limit |

## Hardware catalog

### LED controllers

| Board | Connection | LED library | Typical use |
|---|---|---|---|
| Teensy 4.1 | Ethernet (QNEthernet) | OctoWS2811 (8 parallel strips) | High-density wired: Joya, Mate |
| ESP32 (MH-ET LIVE MiniKit) | Ethernet (LAN8720 PHY) | FastLED (up to 4 pins) | Medium wired: Joya, Hash, Cabra |
| ESP32 (EVB/generic) | WiFi (ESP-NOW) | — | ESP-NOW gateway |
| ESP32 | WiFi (ESP-NOW) | FastLED | ESP-NOW client (wireless sticks) |
| ESP8266 (D1 Mini) | WiFi (ESP-NOW) | FastLED | ESP-NOW client (smaller sticks, bikes) |
| Arduino (various) | Serial (USB) | FastLED | Legacy/testing |
| WLED controller | WiFi/Ethernet | Built-in | Off-the-shelf, no custom firmware |
| Falcon F16V5 | Ethernet (ArtNet) | Built-in | Professional, high channel count |

### ESP32 Ethernet wiring (LAN8720)

The MH-ET LIVE MiniKit uses an onboard LAN8720 Ethernet PHY:
- PHY Address: 0
- MDC Pin: 23
- MDIO Pin: 18
- Clock: GPIO17 (internal)

## Deployment checklist

A typical installation requires:

### Wired-only setup (simplest)
- [ ] Computer (Mac Mini or laptop) running the server
- [ ] Ethernet cable to LED controller (Teensy or ESP32 with Ethernet)
- [ ] LED strips (WS2812B) connected to controller data pins
- [ ] 5V power supply for LED strips
- [ ] Audio cable from DJ mixer to computer input

### Wired + wireless setup (e.g., main structure + sticks)
- [ ] Computer (Mac Mini or laptop)
- [ ] WiFi router (for web UI access from phone/tablet)
- [ ] Ethernet switch (if multiple wired controllers)
- [ ] Wired LED controller (Teensy/ESP32 with Ethernet, or Falcon) for main structure
- [ ] USB ESP-NOW gateway (ESP32 with Ethernet, receives UDP from server)
- [ ] ESP-NOW client boards (one per wireless stick), with 3D-printed enclosures
- [ ] LED strips + 5V power for each stick
- [ ] Audio cable from DJ mixer to computer input

### Audio setup
The server captures audio via:
1. **rtaudio** (native C++ bindings) — works on macOS and Linux. Preferred.
2. **Python fallback** (PyAudio subprocess) — used when rtaudio fails to compile. Requires `pipenv install` in the `audio/` directory.

On Raspberry Pi, compile rtaudio with: `CFLAGS="-mfloat-abi=hard -mfpu=neon" yarn`

## Other artifacts

Beyond the main LED installations, the repo contains firmware for several standalone or peripheral projects.

### JoyaBikes (`arduino/joyabikes/`)

LED-equipped bikes for the Joya installation. Each bike runs 300 WS2812B LEDs on an ESP8266 D1 Mini, connected to the Joya gateway via ESP-NOW (channel 7).

When receiving frames from the gateway, the bikes display synchronized colors with the main Joya sculpture. When disconnected, they cycle through 12 built-in animations (sine chase, plasma, noise, sinelon, etc.) with 39 color palettes, switching every ~60 seconds. Time is synchronized across all bikes via gateway broadcast.

### Warreables (`arduino/warreables/`)

Wearable light accessories with 150 WS2812B LEDs on an Arduino with an nRF24L01+ radio module. These use the older RF24 protocol (not ESP-NOW) — they receive 32-byte packets containing 10 LEDs each over 2.4GHz radio (channel 81 or 103, 2Mbps).

Falls back to local animations if radio signal is lost for more than 3 seconds. Supports both RGB and RGB565 encoding.

### Fire controller (`arduino/fire-client/`, `arduino/fire-sender/`)

A wireless RF24 remote control for pneumatic CO2 flame puffers — not LEDs. Two Arduinos communicate over RF24 (channel 50, 250Kbps):

- **Sender** — 5 push buttons trigger different fire patterns:
  - Continuous left/right puffer
  - "Metralleta" (machine gun) burst modes with different on/off timing (90ms/520ms, 100ms/200ms)
  - Alternating left/right bursts
- **Client** — receives 3-byte packets `[counter, poof1, poof2]` and drives two relay outputs controlling the puffer solenoids. Safety auto-shutoff after 50ms prevents overheating.

### JaJaLamp (`arduino/jajalamp/`)

An interactive wearable lamp with 12 WS2812B LEDs and a TMC2209 stepper motor, running on an ESP32. Connected via ESP-NOW (channel 7, gateway: `hash-totems-gw`).

The stepper motor velocity is controlled by the blue channel value of the last LED — the light program on the server can drive both the lamp colors and its physical rotation. Falls back to local animations when disconnected, same animation set as JoyaBikes.

### WChica RF bridge (`arduino/wchica-rf/`, `arduino/wchica-rf-client/`)

A Serial-to-RF24 bridge for the small W (W chica). The gateway receives LED data from the server via serial (1Mbaud) and retransmits over two RF24 channels (72 and 103) to remote client boards with 150-LED strips. This was the original wireless approach before ESP-NOW replaced it.

## Protocol evolution

The protocols evolved as the project grew:

1. **Serial** (2019) — the original, by Federico Bond. Simple USB connection for a single W-shape
2. **UDP** (2019) — added for Ethernet-connected devices, enabling longer cable runs
3. **UDP WLED** (2021) — added by jsilveira to support off-the-shelf WLED controllers
4. **UDP Chunked** (2022) — added by Javier to handle large LED counts that exceed the 1500-byte MTU. Became the standard for most setups
5. **ArtNet/Angio** (2024) — added by Martin Blech for professional lighting equipment
6. **Falcon** (2024) — added by Martin Blech for Falcon F16V5 controllers used in the Palo setup

ESP-NOW wireless support was developed in parallel in the Arduino firmware, not as a server-side device type — the server sees the ESP-NOW gateway as a regular UDP chunked device.

## Setup JSON device configuration

Each device in a setup JSON has a `type` and `params`:

```json
{
  "outputDevices": {
    "main": {
      "type": "udp-chunked",
      "params": {
        "numberOfLights": 1200,
        "name": "my-device.local",
        "udpPort": 8888,
        "chunkSize": 300
      }
    }
  }
}
```

### Parameters by device type

| Type | Required params | Optional params |
|---|---|---|
| `serial` | `numberOfLights` | `devicePortWindows`, `devicePortUnix`, `baudRate` (default 500000), `debugMode` |
| `udp` | `numberOfLights`, `udpPort` | `ip`, `name` (DNS hostname) |
| `udp-chunked` | `numberOfLights`, `udpPort` | `ip`, `name`, `chunkSize` (default 300) |
| `udp-wled` | `numberOfLights` | `ip`, `name`, `udpPort` (default 21324) |
| `angio` | `numberOfLights`, `lightsPerChannel` | `ip`, `name` |
| `falcon` | `numberOfLights` | `ip`, `name` |

For network devices, provide either `ip` (static) or `name` (DNS/mDNS hostname like `my-device.local`). The server resolves hostnames at startup.
