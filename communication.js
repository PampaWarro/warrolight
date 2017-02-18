const _ = require('lodash');
const express = require('express');

const http = require('http');
const app = express();
const server = http.createServer(app);
const io = require('socket.io').listen(server);
const now = require('performance-now');

const path = require('path');

const Device = require('./device')
const Multiplexer = require('./multiplexer')

var device1, device2, device3, device4
var multiplexer

device1 = new Device(300, 'COM4')
device2 = new Device(300, 'COM5')


setTimeout(() => {
  multiplexer = new Multiplexer(600, [device1, device2], (index) => {
    if(index < 300) {
      return [0, index]
    } else {
      if(index < 450)
        return [1, index - 300 + 150]
      else
        return [1, index - 300 - 150]
    }
  })
}, 2000)

let djActionRunning = false;
io.on('connection', (socket) => {
  socket.on('message', (data) => {
    if (data.action === 'leds') {
      if (multiplexer && !djActionRunning) {
        multiplexer.setState(data.payload)
      }
    } else if (data.action === "dj-action"){
      console.log(`DJ ACTION ${data.payload}`)
      djActionRunning = true;
      setTimeout(() => djActionRunning = false, 1000);
      if (multiplexer) {
        multiplexer.setState(_.range(0,600).map(i => '#990066'))
      }
    }
  })
});

server.listen(3000, '0.0.0.0')
