const _ = require("lodash");
const SoundListener = require("./SoundListener");
const audioEmitter = require("./audioEmitter");
const {getGradientsByNameCss} = require('./light-programs/utils/gradients')

function lightsToByteString(ledsColorArray) {
  // Note: this function is in a hot code path. If you're tempted to change this
  // (e.g. simplify using _.flatten), run some profiling to make sure there
  // isn't a CPU time or memory allocation regression.
  const buffer = Buffer.allocUnsafe(ledsColorArray.length * 3);
  for (let i = 0; i < ledsColorArray.length; i++) {
    const offset = i * 3;
    const led = ledsColorArray[i];
    buffer[offset] = led[0];
    buffer[offset + 1] = led[1];
    buffer[offset + 2] = led[2];
  }
  return buffer.toString("base64");
}

let lightServicesCounter = 0;

module.exports = class LightsService {
  constructor(controller, send, broadcast) {
    this.controller = controller;
    this.micConfig = {sendingMicData: false, metric: "rms", input: ''};
    this.broadcast = broadcast;
    this.send = send;
    this.simulating = false;
    this.id = `${lightServicesCounter++}`;
    this.soundListener = new SoundListener(audioEmitter, this.micConfig);
    this.soundListener.start(lastVolumes => {
      if (this.micConfig.sendingMicData) {
        this.send("micSample", lastVolumes);
      }
    });

    this.sendLightsSample = this.sendLightsSample.bind(this);

    this.sendDeviceStatus =  devicesStatus => this.send("devicesStatus", devicesStatus);

    controller.on("lights", this.sendLightsSample);
    controller.on('deviceStatus', this.sendDeviceStatus);
  }

  connect() {
    console.log(`[ON] Remote control ${this.id} connnected`.green);

    const controller = this.controller;

    this.send("completeState", {
      programs: controller.getProgramsSchema(),
      currentProgramName: controller.currentProgramName,
      currentConfig: controller.getCurrentConfig(),
      globalConfig: {
        gradientsLibrary: getGradientsByNameCss(),
        shapes: _.keys(controller.shapeMapping())
      },
      micConfig: this.micConfig
    });
  }

  sendLightsSample(lights) {
    if (this.simulating) {
      this.send("lightsSample", lightsToByteString(lights));
    }
  }

  broadcastStateChange(completeState = false) {
    if(completeState) {
      this.send("completeState", {
        programs: this.controller.getProgramsSchema(),
        currentProgramName: this.controller.currentProgramName,
        currentConfig: this.controller.getCurrentConfig(),
        globalConfig: {
          gradientsLibrary: getGradientsByNameCss(),
          shapes: _.keys(this.controller.shapeMapping())
        },
        micConfig: this.micConfig
      });
    } else {
      this.broadcast("stateChange", {
        currentProgramName: this.controller.currentProgramName,
        currentConfig: this.controller.getCurrentConfig(),
        micConfig: this.micConfig
      });
    }
  }



  setMicConfig(newMicConfig) {
    if (newMicConfig.sendingMicData === true) {
      console.log(`[ON] Web client ${this.id} receiving MIC data`.green);
    } else if (newMicConfig.sendingMicData === false) {
      console.log(`[OFF] Web client ${this.id} stopped receiving MIC data`.gray);
    }

    Object.assign(this.micConfig, newMicConfig);

    this.send("stateChange", {
      currentProgramName: this.controller.currentProgramName,
      currentConfig: this.controller.getCurrentConfig(),
      micConfig: this.micConfig
    });
  }

  setPreset(presetName) {
    this.controller.setPreset(presetName);
    this.broadcastStateChange();
  }

  savePreset({programName, presetName, currentConfig}) {
    this.controller.savePreset(programName, presetName, currentConfig);
    this.setPreset(presetName)
    this.broadcastStateChange(true);
    console.log("Saved new preset", programName, presetName, currentConfig)
  }

  deletePreset({programName, presetName}) {
    this.controller.deletePreset(programName, presetName);
    this.broadcastStateChange(true);
    console.log("Deleted preset", programName, presetName)
  }

  setCurrentProgram(programKey) {
    this.controller.setCurrentProgram(programKey);
    this.broadcastStateChange();
  }

  tap() {
    this.controller.tap(this.id);
  }

  updateConfigParam(config) {
    this.controller.updateConfigOverride(config);

    this.broadcast("stateChange", {
      currentProgramName: this.controller.currentProgramName,
      currentConfig: this.controller.getCurrentConfig(),
      micConfig: this.micConfig
    });
  }

  startSamplingLights() {
    console.log(`[ON] Web client ${this.id} sampling lights data`.green);
    this.simulating = true;
    this.send("layout", {geometry: this.controller.geometry});
  }

  stopSamplingLights() {
    console.log(`[OFF] Web client ${this.id} stopped sampling lights`.gray);
    this.simulating = false;
  }

  restartProgram() {
    this.controller.restart();
  }

  disconnect() {
    console.log(`[OFF] Remote control ${this.id} DISCONNNECTED`.gray);
    this.controller.off("lights", this.sendLightsSample);
    this.controller.off('deviceStatus', this.sendDeviceStatus);
    this.soundListener.stop();
  }
};
