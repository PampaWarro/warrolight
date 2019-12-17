#!/bin/bash
# Upload a sketch to the Arduino connected via USB to this computer.

set -e

if [ $# -ne 1 ]; then
  >2& echo "usage: $0 <sketch>"
  exit 1
fi

sketch=$1
port=$(arduino-cli board list | grep "arduino:avr" | awk '{ print $1 }')

if [ "$port" == "" ]; then
  >2& echo "No Arduino board connected."
  >2& echo "Connect one and check with the arduino-cli board list command"
  exit 1
fi

echo "Found Arduino connected at port $port"

printf "Uploading $sketch to board... "

arduino-cli upload --port "$port" --fqbn arduino:avr:uno "$sketch"

echo "Done!"
