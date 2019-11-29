const _ = require('lodash');
const WebSocket = require('ws');
const { Buffer } = require('buffer');
const EventEmitter = require('events');
const { startMic } = require('./mic');
const soundEmitter = require('./soundEmitter');

startMic()

function lightsToByteString(ledsColorArray) {
    let bytes = _.flatten(ledsColorArray);
    return Buffer.from(bytes).toString('base64');
}

exports.createRemoteControl = function createRemoteControl(lightProgram, deviceMultiplexer) {
  const wss = new WebSocket.Server({ port: 8080 });

  const sound = new EventEmitter();

  let lastVolumes = [];
  let lastRawVolumes = [];
  let lastBands = [];

  let micConfig = {
      sendingMicData: true,
      metric: "Rms"
  }

  let flushVolume = _.throttle(() => {
      if (micConfig.sendingMicData) {
          sound.emit('micSample', lastVolumes)
      }
      lastVolumes = [];
  }, 100)

  let avg = 1;
  let last = new Date();

  soundEmitter.on('processedaudioframe', (frame) => {
      let timeSinceLastFrame = new Date() - last;
      if(timeSinceLastFrame > 50) {
          // console.log(`SOUND DROPPING FRAMES: Last processedaudioframe frame: ${timeSinceLastFrame}ms ago`.red)
      }
      last = new Date()

      let {center: {filteredBands, movingStats: {rms: {slow: {normalizedValue}}}}} = frame;
      // lastRawVolumes.push({... _.mapValues(filteredBands, b => b.movingStats.rms.slow.normalizedValue), all: normalizedValue});
      // lastRawVolumes.push({... _.mapValues(filteredBands, (b,name) => frame.center.summary[name+'Rms']), all: normalizedValue});
      lastRawVolumes.push({... _.mapValues(filteredBands, (b,name) =>
          frame.center.summary[name+micConfig.metric]), all: normalizedValue});

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

  wss.on('connection', function connection(ws) {

    function emit(type, payload) {
      ws.send(JSON.stringify({ type, payload }))
    }

    sound.on('micSample', (lastVolumes) => {
      emit('micSample', lastVolumes)
    })

    ws.on('message', function incoming(message) {
      const { type, payload } = JSON.parse(message)

      switch (type) {
        case 'setMicDataConfig':
          onSetMicDataConfig(payload)
          return
        case 'startSamplingLights':
          onStartSamplingLights(payload)
          return
        case 'stopSamplingLights':
          onStopSamplingLights(payload)
          return
        case 'restartProgram':
          onRestartProgram(payload)
          return
        case 'updateConfigParam':
          onUpdateConfigParam(payload)
          return
        case 'setPreset':
          onSetPreset(payload)
          return
        case 'setCurrentProgram':
          onSetCurrentProgram(payload)
          return
      }
    });

    let simulating = false;

    function broadcastStateChange() {
      emit('stateChange', {
        currentProgramName: lightProgram.currentProgramName,
        currentConfig: lightProgram.getCurrentConfig(),
        micConfig
      })
    }

    emit('completeState', {
      programs: lightProgram.getProgramsSchema(),
      currentProgramName: lightProgram.currentProgramName,
      currentConfig: lightProgram.getCurrentConfig(),
      micConfig
    })

    function onSetMicDataConfig(newMicConfig) {
      if(newMicConfig.sendingMicData === true) {
        console.log('[ON] Web client receiving MIC data'.green)
      } else if(newMicConfig.sendingMicData === false) {
        console.log('[OFF] Web client stopped receiving MIC data'.gray)
      }

      micConfig = {... micConfig, ... newMicConfig};

      broadcastStateChange(true);
    }

    function onStartSamplingLights() {
      console.log('[ON] Web client sampling lights data'.green)
      simulating = true
      emit('layout', lightProgram.layout)
    }

    function onStopSamplingLights() {
      console.log('[OFF] Web client stopped sampling lights'.gray)
      simulating = false;
    }

    function onRestartProgram() {
      lightProgram.restart();
    }

    function lightsCbk(lights) {
      if (simulating) {
          let encodedColors = lightsToByteString(lights);
          emit('lightsSample', encodedColors)
      }
    }

    console.log("[ON] Remote control connnected".green)
    lightProgram.onLights(lightsCbk)

    deviceMultiplexer.onDeviceStatus(devicesStatus => emit('devicesStatus', devicesStatus))

    function onUpdateConfigParam(config) {
      lightProgram.currentProgram.config = config;

      emit('stateChange', {
        currentProgramName: lightProgram.currentProgramName,
        currentConfig: lightProgram.getCurrentConfig(),
        micConfig
      })
    }

    ws.on('disconnect', function () {
        console.log("[OFF] Remote control DISCONNNECTED".gray)
        lightProgram.removeOnLights(lightsCbk)
    });

    function onSetPreset(presetName) {
      let presets = lightProgram.getCurrentPresets();
      if (presets[presetName]){
        lightProgram.currentProgram.config = _.extend(lightProgram.getConfig(), presets[presetName]);
        broadcastStateChange();
      }
    }

    function onSetCurrentProgram(programKey) {
      lightProgram.setCurrentProgram(programKey)
      broadcastStateChange();
    }

  });
}
