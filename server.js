const _ = require('lodash');
const express = require('express');

const http = require('http');

const express = express();
const server = http.createServer(express);

const io = require('socket.io').listen(server);
const now = require('performance-now');

const path = require('path');


express.get('/', function (req, res) {
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
        multiplexer.setState(_.range(0,multiplexer.numberOfLights).map(i => '#990066'))
      }
    }
  })
});

server.listen(3001, '0.0.0.0')
