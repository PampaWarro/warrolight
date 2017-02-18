const _ = require('lodash');
const express = require('express');

const http = require('http');
const app = express();
const server = http.createServer(app);
const io = require('socket.io').listen(server);
const now = require('performance-now');

const path = require('path');
const webpack = require('webpack');
const config = require('./webpack.config');

const compiler = webpack(config);

const Device = require('./device')
const Multiplexer = require('./multiplexer')

app.use(require('webpack-dev-middleware')(compiler, {
  noInfo: true,
  publicPath: "/"
}));
app.use(require('webpack-hot-middleware')(compiler));

app.get('*', function (req, res, next) {
  var filename = path.join(compiler.outputPath,'index.html');
  compiler.outputFileSystem.readFile(filename, function(err, result){
    if (err) {
      return next(err);
    }
    res.set('content-type','text/html');
    res.send(result);
    res.end();
  });
})

var device1, device2, device3, device4
var multiplexer

setTimeout(() => {
  device1 = new Device(150, '/dev/ttyACM0')
}, 1000)
setTimeout(() => {
  device2 = new Device(150, '/dev/ttyACM1')
}, 2000)
setTimeout(() => {
  device3 = new Device(150, '/dev/ttyACM2')
}, 3000)
setTimeout(() => {
  device4 = new Device(150, '/dev/ttyACM3')
}, 4000)

setTimeout(() => {
  multiplexer = new Multiplexer(600, [device1, device2, device3, device4], (index) => {
    if(index < 150) {
      return [0, index]
    } else if(index < 300){
      return [1, index - 150]
    } else if (index < 450) {
      return [2, index - 300]
    } else {
      return [3, index - 450]
    }
  })
}, 5000)


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

server.listen(3000)
