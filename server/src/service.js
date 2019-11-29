const { Buffer } = require('buffer');
const _ = require('lodash');

function lightsToByteString(ledsColorArray) {
    let bytes = _.flatten(ledsColorArray);
    return Buffer.from(bytes).toString('base64');
}

exports.MicConfig = class MicConfig {
    constructor(config) {
      this.config = config;
    }

    update(newConfig) {
      Object.assign(this.config, newConfig);
    }

    isSendingMicData() {
      return this.config.isSendingMicData;
    }

    getMetric() {
      return this.config.metric;
    }
}

exports.SoundSource = class SoundSource {
    constructor(soundEmitter, micConfig) {
        this.soundEmitter = soundEmitter;
        this.micConfig = micConfig;
    }

    listen(cb) {
        let micConfig = this.micConfig;
        let lastVolumes = [];
        let lastRawVolumes = [];

        const flushVolume = _.throttle(() => {
            if (micConfig.isSendingMicData()) {
                cb(lastVolumes)
            }
            lastVolumes = [];
        }, 100)

        let avg = 1;
        let last = new Date();

        this.soundEmitter.on('processedaudioframe', (frame) => {
            let timeSinceLastFrame = new Date() - last;
            if (timeSinceLastFrame > 50) {
                // console.log(`SOUND DROPPING FRAMES: Last processedaudioframe frame: ${timeSinceLastFrame}ms ago`.red)
            }
            last = new Date()

            let {center: {filteredBands, movingStats: {rms: {slow: {normalizedValue}}}}} = frame;
            // lastRawVolumes.push({... _.mapValues(filteredBands, b => b.movingStats.rms.slow.normalizedValue), all: normalizedValue});
            // lastRawVolumes.push({... _.mapValues(filteredBands, (b,name) => frame.center.summary[name+'Rms']), all: normalizedValue});
            lastRawVolumes.push({... _.mapValues(filteredBands, (b,name) =>
                frame.center.summary[name+micConfig.getMetric()]), all: normalizedValue});

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
    }
}

exports.Service = class Service {

    constructor(lightProgram, deviceMultiplexer, micConfig, emit) {
        this.lightProgram = lightProgram;
        this.deviceMultiplexer = deviceMultiplexer;
        this.micConfig = micConfig;
        this.emit = emit
        this.simulating = false;
    }

    connect() {
        console.log("[ON] Remote control connnected".green)

        const lightProgram = this.lightProgram;

        this.emit('completeState', {
            programs: lightProgram.getProgramsSchema(),
            currentProgramName: lightProgram.currentProgramName,
            currentConfig: lightProgram.getCurrentConfig(),
            micConfig: this.micConfig.config
        })
    
        lightProgram.onLights(this.lightsCallback)
    
        this.deviceMultiplexer.onDeviceStatus(devicesStatus =>
            this.emit('devicesStatus', devicesStatus))
    }

    lightsCallback = (lights) => {
        if (this.simulating) {
          let encodedColors = lightsToByteString(lights);
          this.emit('lightsSample', encodedColors)
        }
    }

    broadcastStateChange() {
        const lightProgram = this.lightProgram;
        this.emit('stateChange', {
          currentProgramName: lightProgram.currentProgramName,
          currentConfig: lightProgram.getCurrentConfig(),
          micConfig: this.micConfig.config
        })
      }

    setMicDataConfig(newMicConfig) {
        if (newMicConfig.sendingMicData === true) {
          console.log('[ON] Web client receiving MIC data'.green)
        } else if (newMicConfig.sendingMicData === false) {
          console.log('[OFF] Web client stopped receiving MIC data'.gray)
        }
  
        this.micConfig.update(newMicConfig);
  
        this.broadcastStateChange();
      }

    setPreset(presetName) {
        const lightProgram = this.lightProgram;
        const presets = lightProgram.getCurrentPresets();

        if (presets[presetName]){
          lightProgram.currentProgram.config = _.extend(
              lightProgram.getConfig(), presets[presetName]);

          this.broadcastStateChange();
        }
      }
  
    setCurrentProgram(programKey) {
      this.lightProgram.setCurrentProgram(programKey)
      this.broadcastStateChange();
    }

    updateConfigParam(config) {
        const lightProgram = this.lightProgram
        lightProgram.currentProgram.config = config;
  
        this.emit('stateChange', {
          currentProgramName: lightProgram.currentProgramName,
          currentConfig: lightProgram.getCurrentConfig(),
          micConfig: this.micConfig.config
        })
      }

    startSamplingLights() {
      console.log('[ON] Web client sampling lights data'.green)
      this.simulating = true;
      this.emit('layout', this.lightProgram.layout)
    }

    stopSamplingLights() {
      console.log('[OFF] Web client stopped sampling lights'.gray)
      this.simulating = false;
    }

    restartProgram() {
      this.lightProgram.restart();
    }

    disconnect() {
        console.log("[OFF] Remote control DISCONNNECTED".gray)
        this.lightProgram.removeOnLights(this.lightsCallback)
    }
}
