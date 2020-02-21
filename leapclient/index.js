const dgram = require('dgram');
const Leap = require("leapjs");

const HOST = '127.0.0.1'
const PORT = '12222'

const client = dgram.createSocket('udp4');

function buildUDPPacket(frame) {
  if (frame.hands.length === 0) {
    return null;
  }

  const buf = Buffer.from("LEAP")
  buf.write("LEAP")
  // palm position y
  buf.writeIntLE(frame.hands[0].palmPosition[1], 0, 4)

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

Leap.loop(sendFrame);
