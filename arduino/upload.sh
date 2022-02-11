#!/bin/bash
# Upload a sketch to the Arduino connected via USB to this computer.

set -e

if [ $# == 0 ]; then
  >&2 echo "usage: $0 <sketch> [<port> [NANO]]"
  exit 1
fi

sketch=$1
port=$2 || $(arduino-cli board list | grep "arduino:avr" | awk '{ print $1 }')
fqbn=arduino:avr:uno

if [ "$3" == "NANO" ]; then
  echo "Uploading to Arduino NANO"
  fqbn=arduino:avr:nano:cpu=atmega328
fi

if [ "$3" == "NANOOLD" ]; then
  echo "Uploading to Arduino NANO atmega328old"
  fqbn=arduino:avr:nano:cpu=atmega328old
fi

if [ "$3" == "LOLIN_D32" ]; then
  echo "Uploading to ESP32 lolin"
  fqbn=esp32:esp32:d32_pro
fi


if [ "$3" == "MEGA" ]; then
  echo "Uploading to Arduino MEGA"
  fqbn=arduino:avr:mega
fi

if [ "$port" == "" ]; then
  >&2 echo "No Arduino board connected."
  >&2 echo "Connect one and check with the 'arduino-cli board list' command. Current output:"
  echo ""
  arduino-cli board list
  exit 1
fi

export ARDUINO_SKETCHBOOK_DIR=.

echo "Found Arduino connected at port $port"

printf "Uploading $sketch to board... "

arduino-cli compile --upload --port "$port" --fqbn "$fqbn" "$sketch"

echo "Done!"
