# Joya Uruguay 2026

What runs the jewel and the totems this year, and what broke on the way.

## What runs

- **Show computer:** the Mac mini (user `joya`), repo in `~/Documents/projects/warrolight`, branch `joya-uruguay`. It starts by itself at login (`tmux-session.sh`); the server reads its setup from `server/package.json`, set to `joya-uruguay`.
- **Network:** the Mac mini runs the show over the **joyalights Wi-Fi** (no internet). Its Ethernet cable stays **unplugged** (see below).
- **Rib Teensy (`joya-r`, port 8888):** 8 outputs × 258 LEDs. Outputs 1 to 6 are the ribs, 7 and 8 the totems (their first 258 of 300 LEDs). Firmware: `arduino/teensy-eth`, env `joya-r`, from commit f19d826.
- **Horizontals Teensy (`joya-h`, port 8887):** 3 outputs × 285 LEDs. Still on its 2023 firmware, untouched.

## Keep the Mac mini's Ethernet unplugged

Its Ethernet port has a fixed address, 192.168.0.100 (mask 255.255.0.0). The joyalights router seems to hand out addresses starting at 192.168.0.100, so one Teensy ends up with .100 too (the rib Teensy on 24-Nov, the horizontals one on 25-Nov). With the cable in, the Mac mini keeps every frame for .100 to itself: that Teensy's box shows connected in WarroLight, its lights stay in security mode, and the server log fills with `UNEXPECTED MSG` lines (its own frames). To use that port again, set it to DHCP first.

## Firmware fix (f19d826)

The server stops sending to a controller after 3 s without hearing from it. Before 24593fd (2023), WarroUDP broadcast `YEAH` every second, plus `PERF` while frames arrived; that refactor dropped both, so a Teensy flashed from this tree went dark 3 s after connecting. `teensy-eth` now sends them again.

## Reflashing the rib Teensy

USB cable from the rib Teensy to the Mac mini, then in `arduino/teensy-eth`: `pio run -e joya-r -t upload`. If the Teensy Loader window doesn't program it by itself, press its Program button, then Reboot. Without the physical button: `stty -f /dev/cu.usbmodem129095701 134` puts the Teensy in program mode. The loader's log is under Help, Verbose Info.

## Don't use

- `joya-uruguay-300` (300 LEDs per output, chunked UDP): the Teensy loop reads one packet per frame and its network chip holds 5 packets, so the 8 chunks of each frame never arrive whole. Plain 300 per output would need a reflash and makes frames 5 network fragments, the same as now.

## Diagnostics

`server/tools/joya-scan.sh` records for 5 minutes, into `~/joya-scan.log`, every controller announcing itself on the WarroLight ports (`YEAH` = waiting, `PERF` = getting frames) and every device on 192.168.0.x. Start it, switch the Wi-Fi to joyalights for a minute, switch back, read the log. `server/tools/joya-listen.js` is just the listener part.
