var SerialPort = require('serialport');
var Buffer = require("buffer").Buffer;
var _ = require("underscore");

var port = new SerialPort('COM3', {
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

const encoding = ENCODING_VGA;

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
  if (encoding == ENCODING_POS_RGB) {
    write([pos, r, g, b])
  } else if (encoding == ENCODING_POS_VGA) {
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

let colors = [
  [255, 0, 0],
  [255, 127, 0],
  [255, 255, 0],
  [0, 0, 255],
  [0, 255, 0],
  [0, 0, 255],
  [75, 0, 130],
  [143, 0, 255],
];
// Violetas
// colors = [[230,230,250],
//   [216,191,216],
//   [221,160,221],
//   [238,130,238],
//   [218,112,214],
//   [255,0,255],
//   [255,0,255],
//   [186,85,211],
//   [147,112,219],
//   [138,43,226],
//   [148,0,211],
//   [153,50,204],
//   [139,0,139],
//   [75,0,130],
//   [128,0,128]
// ];

let getColor = i => colors[i % colors.length];
let state = _.range(0, 150);

let c = 0;
function sendNextFrame() {
  let totalLedsChanged = 150;
  initEncoding(totalLedsChanged);
  c += 1;

  for (let i = 0; i < totalLedsChanged; i++) {
    // let pos = Math.round(((i+c) % 150)/150*255);
    // let rand = Math.random() * pos;
    let rel = Math.floor(i+c)%11;
    let colIndex = Math.ceil((i+c)/11);
    if(rel == -20) {
      writePixel(i, 255, 255, 255);
    } else if(rel == 50) {
      writePixel(i, 0, 0, 0);
    } else {
      let dim = 2;
      writePixel(i, getColor(colIndex)[0]/dim, getColor(colIndex)[1]/dim, getColor(colIndex)[2]/dim);
    }
  }

  // _.each(state)

  flush();
}





// open errors will be emitted as an error event
port.on('error', function(err) {
  console.log('Error: ', err.message);
});
let lastReceived = new Date();
port.on('data', function(data) {
  console.log('Received. FPS: ' + Math.round((1000/(new Date() - lastReceived))));
  lastReceived = new Date();
  sendNextFrame();
});

port.on('drain', function(data) {
  console.log('Drain called');
});

port.on('close', function(data) {
  console.log('port closed.');
});

