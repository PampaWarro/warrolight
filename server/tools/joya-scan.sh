#!/bin/bash
# Records what is on the lights network for 5 minutes, into ~/joya-scan.log:
# every controller announcing itself (joya-listen.js), and every device that
# answers on 192.168.0.x with its hardware address (Teensy = 04:e9:e5).
# Start it, switch the Wi-Fi to joyalights for a minute, switch back, read the log.
log=~/joya-scan.log
: > "$log"
node "$(dirname "$0")/joya-listen.js" >> "$log" 2>&1 &
listener=$!
for round in $(seq 1 60); do
  wifi=$(ipconfig getifaddr en1)
  echo "== $(date +%T) wifi $wifi ethernet $(ipconfig getifaddr en0)" >> "$log"
  case "$wifi" in
    192.168.0.*)
      pings=()
      for i in $(seq 1 254); do
        ping -c 1 -t 1 "192.168.0.$i" > /dev/null 2>&1 &
        pings+=($!)
      done
      wait "${pings[@]}"
      arp -an | grep "(192.168.0." | grep -v incomplete >> "$log"
      ;;
  esac
  sleep 5
done
kill "$listener"
