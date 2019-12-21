#!/bin/bash
# Compile every sketch in the arduino/ directory. Useful for quickly making
# sure we did not break the build. Soon to be integrated in CI.

die () { >&2 echo "error: $1"; exit 1; }

command -v arduino-cli > /dev/null || die "arduino-cli not installed."

export ARDUINO_SKETCHBOOK_DIR=.

arduino-cli lib install "FastLED"
arduino-cli lib install "RF24"
arduino-cli lib install "UIPEthernet"
