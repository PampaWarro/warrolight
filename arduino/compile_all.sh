#!/bin/bash

set -e

die () {  echo "error: $1"; exit 1; }

command -v arduino-cli > /dev/null || die "arduino-cli not installed."

for sketch in */ ; do
  arduino-cli compile --fqbn arduino:avr:uno "$sketch"
done
