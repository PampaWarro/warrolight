const _ = require('lodash');
const WebSocket = require('ws');
const { Buffer } = require('buffer');
const { EventEmitter } = require('events');

require('./volume-broadcaster')
let soundBroadcast = require("./sound-broadcast");

const lightsToByteString = (ledsColorArray) => {
  let bytes = _.flatten(ledsColorArray);
  return Buffer.from(bytes).toString('base64');
}

const sound = new EventEmitter()

exports.createRemoteControl = function(lightProgram, deviceMultiplexer) {
  const wss = new WebSocket.Server({ port: 8080 });

  let lastVolumes = [];
  let lastRawVolumes = [];
  let lastBands = [];

  let micConfig = {
    sendingMicData: true,
    metric: "Rms"
  }

  let flushVolume = _.throttle(() => {
    if(micConfig.sendingMicData) {
      sound.emit('micSample', lastVolumes)
    }
    lastVolumes = [];
  }, 100)

  let avg = 1;
  let last = new Date();
  soundBroadcast.on('processedaudioframe', (frame) => {
    let timeSinceLastFrame = new Date() - last;
    if(timeSinceLastFrame > 50) {
      // console.log(`SOUND DROPPING FRAMES: Last processedaudioframe frame: ${timeSinceLastFrame}ms ago`.red)
    }
    last = new Date()

    let {center: {filteredBands, movingStats: {rms: {slow: {normalizedValue}}}}} = frame;
    // lastRawVolumes.push({... _.mapValues(filteredBands, b => b.movingStats.rms.slow.normalizedValue), all: normalizedValue});
    // lastRawVolumes.push({... _.mapValues(filteredBands, (b,name) => frame.center.summary[name+'Rms']), all: normalizedValue});
    lastRawVolumes.push({... _.mapValues(filteredBands, (b,name) => frame.center.summary[name+micConfig.metric]), all: normalizedValue});

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

  wss.on('connection', (ws) => {
    const socket = new EventEmitter()

    ws.setMaxListeners(100)

    ws.on('message', function(message) {
      console.log("received message")
      const data = JSON.parse(message)
      socket.emit(data.type, data.payload)
    })

    ws.emit = function(type, payload) {
      ws.send(JSON.stringify({type: type, payload: payload}))
    }

    sound.on('micSample', function(lastVolumes) {
      ws.emit('micSample', lastVolumes)
    })

    let simulating = false;

    let broadcastStateChange = (includeSelf) => {
      let state = {
        currentProgramName: lightProgram.currentProgramName,
        currentConfig: lightProgram.getCurrentConfig(),
        micConfig
      };

      if(includeSelf) {
        ws.emit('stateChange', state)
      } else {
        ws.emit('stateChange', state)
      }
    }

    ws.emit('completeState', {
      programs: lightProgram.getProgramsSchema(),
      currentProgramName: lightProgram.currentProgramName,
      currentConfig: lightProgram.getCurrentConfig(),
      micConfig
    })

    socket.on('setMicDataConfig', (newMicConfig) => {
      if(newMicConfig.sendingMicData === true) {
        console.log('[ON] Web client receiving MIC data'.green)
      } else if(newMicConfig.sendingMicData === false) {
        console.log('[OFF] Web client stopped receiving MIC data'.gray)
      }

      micConfig = {... micConfig, ... newMicConfig};

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
          socket.emit('lightsSample', encodedColors)
      }
    }

    console.log("[ON] Remote control connnected".green)
    lightProgram.onLights(lightsCbk)

    deviceMultiplexer.onDeviceStatus(devicesStatus => socket.emit('devicesStatus', devicesStatus))

    socket.on('updateConfigParam', (config) => {
      lightProgram.currentProgram.config = config;

      socket.broadcast.emit('stateChange', {
        currentProgramName: lightProgram.currentProgramName,
        currentConfig: lightProgram.getCurrentConfig(),
        micConfig
      })
    })

    socket.on('disconnect', function () {
        console.log("[OFF] Remote control DISCONNNECTED".gray)
        lightProgram.removeOnLights(lightsCbk)
    });

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


