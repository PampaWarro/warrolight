# Joya Badge

JoyaBikes 2023 lights (`../joyabikes`) on the Faceted Badge Rev D: an ESP-07S
driving 13 WS2812B-V6 LEDs on GPIO4, with a web remote and a MODE button.

What is different from `joyabikes`:

- **Badge mapping.** The badge is a 2D gem, not a strip. Every one of the twelve
  animations has a version driven by the LED positions from the KiCad file
  (`src/effects.cpp`), next to the original strip version. The remote switches
  between the two.
- **Remote.** Each badge is a WiFi access point called `Joya Badge XXXX` (the last
  two bytes of its MAC). Join it and open http://joya.local/ (phones usually pop
  it up on their own; http://192.168.4.1/ also works): effect, palette,
  brightness, speed, auto cycle, power, mapping. Any change is broadcast over
  ESP-NOW, so every badge in range follows.
- **MODE button** (SW3, GPIO5): press = next effect (auto cycle off), hold for
  0.8 s = auto cycle on.
- Clock sync with the `joya-totems-gw` gateway and the streamed pixel frames work
  as in `joyabikes`. Speed scales a virtual clock derived from the synced one, so
  the badges stay in step at any speed.

`prototype/joya-badge-lights.html` is the browser simulation of all twelve
animations on the real layout, both mappings side by side, with the same remote.

## Build and flash

```
pio run
```

Flash through J3 (six pads on the back, top to bottom: 5V, RST, BOOT, RX, TX, GND)
with a 3.3 V USB-serial cable. Power the badge from its own battery or USB-C, never
from the cable's 5 V. Hold BOOT, tap RESET, release BOOT, then:

```
esptool.py --chip esp8266 --port /dev/cu.usbserial-0001 --baud 460800 \
  --before no_reset --after no_reset --connect-attempts 0 \
  write_flash --flash_mode dio --flash_freq 40m --flash_size 4MB \
  0x0 .pio/build/badge/firmware.bin
```

Tap RESET when it says "Hash of data verified". Serial monitor at 9600 baud prints
the MAC, the WiFi name, the state on every change and the battery voltage every 5 s.

## Hardware notes

- Power switch SW4: ON is slid away from the USB-C. The red LED only means the
  charger is running; it does not mean the ESP is on.
- Battery sense: BAT, 1M, A0, 220k, GND. `kBatteryVoltsPerCount` in `main.cpp`.
- Brightness defaults to 32 like the stock firmware; the remote goes to 255 and
  FastLED's 250 mA limiter still has the last word.
- LED chain D1..D13 is a raster scan: 1, 2, 3, 4, 3 per row on a 9 mm diamond
  lattice. The rim is D1, D3, D6, D10, D13, D12, D11, D7, D4, D2 clockwise; D5, D8,
  D9 are the inner three.
