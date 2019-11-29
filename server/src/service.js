const { Buffer } = require('buffer');
const _ = require('lodash');

function lightsToByteString(ledsColorArray) {
    let bytes = _.flatten(ledsColorArray);
    return Buffer.from(bytes).toString('base64');
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
    
        // TODO: this supports a single listener only, probably rename it to setDeviceStatusListener
        // or rework it to support multiple listeners
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
