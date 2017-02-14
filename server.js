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

app.get('*', function (req, res) {
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

const device1 = new Device(150, 'COM3')
const device2 = new Device(150, 'COM4')
const device3 = new Device(150, 'COM5')

const multiplexer = new Multiplexer(450, [device1, device2, device3], (index) => {
  if(index < 150) {
    return [0, index]
  } else if(index < 300){
    return [1, index - 150]
  } else {
    return [2, index - 300]
  }
})

io.on('connection', (socket) => {
  socket.on('message', (data) => {
    if (data.action === 'data') {
      multiplexer.setState(data.payload)
    }
  })
});

server.listen(3000)
