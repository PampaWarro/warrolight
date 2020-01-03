const _ = require("lodash");
const SoundListener = require("./SoundListener");
const audioEmitter = require("./audioEmitter");

function lightsToByteString(ledsColorArray) {
  let bytes = _.flatten(ledsColorArray);
  return Buffer.from(bytes).toString("base64");
}

module.exports = class LightsService {
  constructor(controller, send) {
    this.controller = controller;
    this.micConfig = {sendingMicData : true, metric : "Rms"};
    this.send = send;
    this.simulating = false;

    const soundListener = new SoundListener(audioEmitter, this.micConfig);
    soundListener.start(lastVolumes => send("micSample", lastVolumes));

    this.sendLightsSample = this.sendLightsSample.bind(this);

    controller.on("lights", this.sendLightsSample);

    controller.onDeviceStatus(devicesStatus =>
                                  this.send("devicesStatus", devicesStatus));
  }

  connect() {
    console.log("[ON] Remote control connnected".green);

    const controller = this.controller;

    this.send("completeState", {
      programs : controller.getProgramsSchema(),
      currentProgramName : controller.currentProgramName,
      currentConfig : controller.getCurrentConfig(),
      micConfig : this.micConfig
    });
  }

  sendLightsSample(lights) {
    if (this.simulating) {
      let encodedColors = lightsToByteString(lights);
      this.send("lightsSample", encodedColors);
    }
  }

  broadcastStateChange() {
    const controller = this.controller;
    this.send("stateChange", {
      currentProgramName : controller.currentProgramName,
      currentConfig : controller.getCurrentConfig(),
      micConfig : this.micConfig
    });
  }

  setMicConfig(newMicConfig) {
    if (newMicConfig.sendingMicData === true) {
      console.log("[ON] Web client receiving MIC data".green);
    } else if (newMicConfig.sendingMicData === false) {
      console.log("[OFF] Web client stopped receiving MIC data".gray);
    }

    Object.assign(this.micConfig, newMicConfig);

    this.broadcastStateChange();
  }

  setPreset(presetName) {
    const controller = this.controller;
    const presets = controller.getCurrentPresets();

    if (!presets[presetName]) {
      console.warn(`Selected preset ${presetName} not found.`)
      return;
    }

    controller.currentProgram.updateConfig(
        _.extend(controller.getConfig(), presets[presetName]));

    this.broadcastStateChange();
  }

  setCurrentProgram(programKey) {
    this.controller.setCurrentProgram(programKey);
    this.broadcastStateChange();
  }

  updateConfigParam(config) {
    const controller = this.controller;
    controller.currentProgram.updateConfig(config);

    this.send("stateChange", {
      currentProgramName : controller.currentProgramName,
      currentConfig : controller.getCurrentConfig(),
      micConfig : this.micConfig
    });
  }

  startSamplingLights() {
    console.log("[ON] Web client sampling lights data".green);
    this.simulating = true;
    this.send("layout", {geometry : this.controller.geometry});
  }

  stopSamplingLights() {
    console.log("[OFF] Web client stopped sampling lights".gray);
    this.simulating = false;
  }

  restartProgram() { this.controller.restart(); }

  disconnect() {
    console.log("[OFF] Remote control DISCONNNECTED".gray);
    this.controller.off("lights", this.sendLightsSample);
  }
};
