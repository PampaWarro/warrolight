const SerialPort = require('serialport');
const _ = require('lodash');
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const path = require('path')

const webpack = require('webpack')
const config = require('./webpack.config');

const compiler = webpack(config);

app.use(require('webpack-dev-middleware')(compiler, {
    noInfo: true,
    progress: true,
    quiet: true,
    stats: {
        colors: true
    }
}));

app.use(require('webpack-hot-middleware')(compiler));

app.get('*', function (req, res) {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
})

const arrayFromRGB = rgb => {
  const red = parseInt(rgb.substr(1, 2), 16)
  const blue = parseInt(rgb.substr(3, 2), 16)
  const green = parseInt(rgb.substr(5, 2), 16)
  return [red, blue, green]
}

let state = _.range(0, 150);
let prevState = state;

io.on('message', (ctx, data) => {
  if (data.action === 'data') {
    const newState = _.range(150)
    for (let i = 0; i < data.payload.length; i++) {
      newState[i] = arrayFromRGB(data.payload[i])
    }
    state = newState
  }
})

app.listen(3000)


const port = new SerialPort('COM3', {
  baudRate: 1152000,
  parser: SerialPort.parsers.readline("\n")
});

port.on('open', function() {
  console.log('port open. Data rate: ' + port.options.baudRate);

  setTimeout(function(){
    //port.write(Buffer.from([1,5,255,10,10]), ()=>console.log("write"));
    port.write(Buffer.from([1,2,255,0,255]), ()=>console.log("Kick of data"));
  }, 2000);
});


const ENCODING_POS_RGB = 1;
const ENCODING_POS_VGA = 2;
const ENCODING_VGA = 3;

let encoding = ENCODING_POS_RGB;

function rgbToVga(r, g, b) { return (r & 0xE0) + ((g & 0xE0) >> 3) + ((b & 0xC0) >> 6)}

let dataBuffer = [];
function write(data){
  dataBuffer = dataBuffer.concat(data);
}
function flush(){
  port.write(Buffer.from(dataBuffer));
  dataBuffer = [];
}

function writePixel(pos, r, g, b) {
  if (encoding === ENCODING_POS_RGB) {
    write([pos, r, g, b])
  } else if (encoding === ENCODING_POS_VGA) {
    write([pos, rgbToVga(r, g, b)])
  } else if (encoding == ENCODING_VGA) {
    write([rgbToVga(r, g, b)])
  }
}

function initEncoding(total) {
  write([encoding]);
  if (encoding == ENCODING_POS_RGB || encoding == ENCODING_POS_VGA) {
    write([total]);
  }
}

const notEqual = (a, b) => {
  return a[0] !== b[0] || a[1] !== b[1] || a[2] !== b[2]
}

function sendNextFrame() {
  let totalLedsChanged = 0;
  for (let i = 0; i < 150; i++) {
    if (notEqual(state[i], prevState[i])) {
      totalLedsChanged++
    }
  }
  // initEncoding(totalLedsChanged);
  initEncoding(150);
  let dim = 1
  for (let i = 0; i < 150; i++) {
    // if (notEqual(state[i], prevState[i])) {
      writePixel(i, state[i][0]/dim, state[i][1]/dim, state[i][2]/dim);
    // }
  }
  prevState = state
  flush();
}

// open errors will be emitted as an error event
port.on('error', function(err) {
  console.log('Error: ', err.message);
});

let lastReceived = new Date().getTime();
port.on('data', function(data) {
  console.log('Received. FPS: ' + Math.round((1000/(new Date().getTime() - lastReceived))));
  lastReceived = new Date().getTime();
  sendNextFrame();
});

port.on('drain', function(data) {
  console.log('Drain called');
});

port.on('close', function(data) {
  console.log('port closed.');
});
