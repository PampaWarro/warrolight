const dgram = require('dgram');
const debounce = require('lodash/debounce');
const Leap = require("leapjs");

const HOST = '127.0.0.1'
const PORT = 12222

const client = dgram.createSocket('udp4');

function buildUDPPacket(frame) {
  if (frame.hands.length === 0) {
    return null;
  }

  const values = [0, 0]

  for (let hand of frame.hands) {
    if (hand.type === "left") {
      values[0] = hand.palmPosition[1]; // y coordinate
    } else {
      values[1] = hand.palmPosition[1]; // y coordinate
    }
  }


  const buf = Buffer.alloc(4 + 4 * values.length)
  buf.write("LEAP")

  let off = 4
  for (let value of values) {
    off = buf.writeInt32LE(value, off);
  }

  return buf;
}

function sendFrame(frame) {
  const pkt = buildUDPPacket(frame)
  if (!pkt) {
    return;
  }

  client.send(pkt, 0, pkt.length, PORT, HOST, function(err) {
    if (err) {
      console.log("error sending: " + err)
    }
  });
}

Leap.loop(debounce(sendFrame, 10));
