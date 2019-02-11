const _ = require('lodash');
const fs = require('fs');
const express = require('express');
const { Buffer } = require('buffer');

require('./volume-broadcaster')
let soundBroadcast = require("./sound-broadcast");

const app = express();

const http = require('http').createServer(app);

// // HTTPS
// const privateKey  = fs.readFileSync('sslcert/server.key', 'utf8');
// const certificate = fs.readFileSync('sslcert/server.crt', 'utf8');
// const credentials = {key: privateKey, cert: certificate};
// const httpsServer = require('https').createServer(credentials, app);

const lightsToByteString = (ledsColorArray) => {
  let bytes = _.flatten(ledsColorArray);
  return Buffer.from(bytes).toString('base64');
}

exports.createRemoteControl = function(lightProgram, deviceMultiplexer) {
  app.use(express.static('public'))

  app.get('/', function (req, res) {
    res.send("DALE NENE")
  })

  // httpServer.listen(8080);
  // httpsServer.listen(8443);

  http.listen(3001, '0.0.0.0', function () {
    console.log("Warro lights server running on port 3001")
    console.log("Remote control in: http://localhost:3001/warro.html")
  })

  // httpsServer.listen(3443, '0.0.0.0', function () {
  //   console.log("Warro lights HTTPS server running on port 3443")
  // })

  const io = require('socket.io').listen(http);

  let lastVolumes = [];
  let lastRawVolumes = [];
  let lastBands = [];

  let sendingMicData = true;
  let flushVolume = _.throttle(() => {
    if(sendingMicData) {
      io.volatile.emit('micSample', lastVolumes)
    }
    lastVolumes = [];
  }, 100)

  let avg = 3;
  let last = new Date();
  soundBroadcast.on('processedaudioframe', (frame) => {
    let timeSinceLastFrame = new Date() - last;
    if(timeSinceLastFrame > 50) {
      console.log(`SOUND DROPPING FRAMES: Last processedaudioframe frame: ${timeSinceLastFrame}ms ago`.red)
    }
    last = new Date()

    let {center: {filteredBands, movingStats: {rms: {slow: {normalizedValue}}}}} = frame;
    lastRawVolumes.push({... _.mapValues(filteredBands, b => b.movingStats.rms.slow.normalizedValue), all: normalizedValue});

    if(lastRawVolumes.length >= avg) {
      let avgLastVolumes = {
        bass: _.sum(_.map(lastRawVolumes, 'bass'))/avg,
        mid: _.sum(_.map(lastRawVolumes, 'mid'))/avg,
        high: _.sum(_.map(lastRawVolumes, 'high'))/avg,
        all: _.sum(_.map(lastRawVolumes, 'all'))/avg
      }

      lastVolumes.push(avgLastVolumes);
      flushVolume();

      lastRawVolumes.shift();
    }
  })

  io.on('connection', (socket) => {
    let simulating = false;

    let broadcastStateChange = (includeSelf) => {
      let state = {
        currentProgramName: lightProgram.currentProgramName,
        currentConfig: lightProgram.getCurrentConfig(),
        sendingMicData
      };

      if(includeSelf) {
        socket.emit('stateChange', state)
      } else {
        io.emit('stateChange', state)
      }
    }

    socket.emit('completeState', {
      programs: lightProgram.getProgramsSchema(),
      currentProgramName: lightProgram.currentProgramName,
      currentConfig: lightProgram.getCurrentConfig(),
      sendingMicData
    })

    socket.on('startSendingMicData', (ack) => {
      console.log('[ON] Web client receiving MIC data'.green)
      sendingMicData = true
      broadcastStateChange(true);
    })

    socket.on('stopSendingMicData', (ack) => {
      console.log('[OFF] Web client stopped receiving mic data'.gray)
      sendingMicData = false
      broadcastStateChange(true);
    })

    socket.on('startSamplingLights', (ack) => {
      console.log('[ON] Web client sampling lights data'.green)
      simulating = true
      ack(lightProgram.layout)
    })

    socket.on('stopSamplingLights', () => {
      console.log('[OFF] Web client stopped sampling lights'.gray)
      simulating = false;
    })

    socket.on('restartProgram', () => lightProgram.restart())

    let lightsCbk = lights => {
      if(simulating) {
          let encodedColors = lightsToByteString(lights);
          socket.volatile.emit('lightsSample', encodedColors)
      }
    }

    console.log("[ON] Remote control connnected".green)
    lightProgram.onLights(lightsCbk)

    // socket.on('reconnect', function () {
    // });

    deviceMultiplexer.onDeviceStatus(devicesStatus => socket.emit('devicesStatus', devicesStatus))

    socket.on('updateConfigParam', (config) => {
      lightProgram.currentProgram.config = config;

      socket.broadcast.emit('stateChange', {
        currentProgramName: lightProgram.currentProgramName,
        currentConfig: lightProgram.getCurrentConfig(),
        sendingMicData
      })
    })

    socket.on('disconnect', function () {
        console.log("[OFF] Remote control DISCONNNECTED".gray)
        lightProgram.removeOnLights(lightsCbk)
    });

    // socket.on('SV', (value) => {
    //   // it is sent as integer 0-10000 to reduce size
    //   soundEmitter.emit('sound', value/10000)
    // })

    socket.on('setPreset', (presetName) => {
      let presets = lightProgram.getCurrentPresets();
      if(presets[presetName]){
        lightProgram.currentProgram.config = _.extend(lightProgram.getConfig(), presets[presetName]);
        broadcastStateChange();
      }
    })

    socket.on('setCurrentProgram', (programKey) => {
      lightProgram.setCurrentProgram(programKey)
      broadcastStateChange();
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


