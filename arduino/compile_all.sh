#!/bin/bash
# Compile every sketch in the arduino/ directory. Useful for quickly making
# sure we did not break the build. Soon to be integrated in CI.

RED=$(tput setaf 1)
GREEN=$(tput setaf 2)
RESET=$(tput sgr0)

die () { >&2 echo "error: $1"; exit 1; }

command -v arduino-cli > /dev/null || die "arduino-cli not installed."

export ARDUINO_SKETCHBOOK_DIR=.

code=0

for sketch in */; do
  if [ "$sketch" == "libraries/" ]; then
    continue
  fi

  echo "${GREEN}Compiling sketch in $sketch${RESET}"

  arduino-cli compile --fqbn arduino:avr:uno "$sketch"
  if [ $? -ne 0 ]; then
    code=1
  fi
done

if [ $code -ne 0 ]; then
  echo "${RED}Failed to compile some programs :(${RESET}"
  exit $code
fi
