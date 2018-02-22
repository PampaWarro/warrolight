const _ = require('lodash');

const fs = require('fs');
// const privateKey  = fs.readFileSync('sslcert/server.key', 'utf8');
// const certificate = fs.readFileSync('sslcert/server.crt', 'utf8');
// const credentials = {key: privateKey, cert: certificate};

const express = require('express');
const app = express();

const http = require('http').createServer(app);
// const httpsServer = require('https').createServer(credentials, app);

require('./volume-broadcaster')

exports.createRemoteControl = function(lightProgram, deviceMultiplexer) {
  app.use(express.static('public'))

  app.get('/', function (req, res) {
    res.send("DALE NENE")
  })

  // httpServer.listen(8080);
  // httpsServer.listen(8443);

  http.listen(3001, '0.0.0.0', function () {
    console.log("Warro lights server running on port 3001")
  })

  // httpsServer.listen(3443, '0.0.0.0', function () {
  //   console.log("Warro lights HTTPS server running on port 3443")
  // })

  const io = require('socket.io').listen(http);

  require("./sound-broadcast").on('volume', _.throttle((volData) => {
    io.volatile.emit('micSample', volData)
  }, 100))

  io.on('connection', (socket) => {
    let simulating = false;

    socket.emit('completeState', {
      programs: lightProgram.getProgramsSchema(),
      currentProgramName: lightProgram.currentProgramName,
      currentConfig: lightProgram.getCurrentConfig()
    })

    socket.on('startSamplingLights', (ack) => {
      simulating = true
      console.log('Client requested startSamplingLights')
      ack(lightProgram.layout)
    })
    socket.on('stopSamplingLights', () => simulating = false)

    socket.on('restartProgram', () => lightProgram.restart())

    let lightsCbk = lights => {
        if(simulating) {
            socket.volatile.emit('lightsSample', lights)
        }
    }

    lightProgram.onLights(lightsCbk)

    deviceMultiplexer.onDeviceStatus(devicesStatus => socket.emit('devicesStatus', devicesStatus))

    socket.on('updateConfigParam', (config) => {
      lightProgram.currentProgram.config = config;

      socket.broadcast.emit('stateChange', {
        currentProgramName: lightProgram.currentProgramName,
        currentConfig: lightProgram.getCurrentConfig()
      })
    })

    socket.on('disconnect', function () {
        lightProgram.removeOnLights(lightsCbk)
    });

    // socket.on('SV', (value) => {
    //   // it is sent as integer 0-10000 to reduce size
    //   soundEmitter.emit('sound', value/10000)
    // })

    socket.on('setPreset', (presetName) => {
      let presets = lightProgram.getCurrentPresets();
      if(presets[presetName]){
        lightProgram.currentProgram.config = _.extend(lightProgram.getCurrentConfig(), presets[presetName]);

        io.emit('stateChange', {
          currentProgramName: lightProgram.currentProgramName,
          currentConfig: lightProgram.getCurrentConfig()
        })
      }
    })

    socket.on('setCurrentProgram', (programKey) => {
      lightProgram.setCurrentProgram(programKey)

      io.emit('stateChange', {
        currentProgramName: lightProgram.currentProgramName,
        currentConfig: lightProgram.getCurrentConfig()
      })
      /*if (data.action === 'leds') {
        if (multiplexer && !djActionRunning) {
          multiplexer.setState(data.payload)
        }
      } else if (data.action === "dj-action") {
        console.log(`DJ ACTION ${data.payload}`)
        djActionRunning = true;
        setTimeout(() => djActionRunning = false, 1000);
        if (multiplexer) {
          multiplexer.setState(_.range(0, multiplexer.numberOfLights).map(i => '#990066'))
        }
      }*/
    })
  });
}


