#!/bin/bash
# Compile every sketch in the arduino/ directory. Useful for quickly making
# sure we did not break the build. Soon to be integrated in CI.

set -e

die () {  echo "error: $1"; exit 1; }

command -v arduino-cli > /dev/null || die "arduino-cli not installed."

for sketch in */ ; do
  arduino-cli compile --fqbn arduino:avr:uno "$sketch"
done
