const { Buffer } = require("buffer");
const _ = require("lodash");

function lightsToByteString(ledsColorArray) {
  let bytes = _.flatten(ledsColorArray);
  return Buffer.from(bytes).toString("base64");
}

module.exports = class LightsService {
  constructor(controller, deviceMultiplexer, micConfig, send) {
    this.controller = controller;
    this.deviceMultiplexer = deviceMultiplexer;
    this.micConfig = micConfig;
    this.send = send;
    this.simulating = false;
  }

  connect() {
    console.log("[ON] Remote control connnected".green);

    const controller = this.controller;

    this.send("completeState", {
      programs: controller.getProgramsSchema(),
      currentProgramName: controller.currentProgramName,
      currentConfig: controller.getCurrentConfig(),
      micConfig: this.micConfig.config
    });

    controller.onLights(this.lightsCallback);

    // TODO: this supports a single listener only, probably rename it to setDeviceStatusListener
    // or rework it to support multiple listeners
    this.deviceMultiplexer.onDeviceStatus(devicesStatus =>
      this.send("devicesStatus", devicesStatus)
    );
  }

  lightsCallback = lights => {
    if (this.simulating) {
      let encodedColors = lightsToByteString(lights);
      this.send("lightsSample", encodedColors);
    }
  };

  broadcastStateChange() {
    const controller = this.controller;
    this.send("stateChange", {
      currentProgramName: controller.currentProgramName,
      currentConfig: controller.getCurrentConfig(),
      micConfig: this.micConfig.config
    });
  }

  setMicDataConfig(newMicConfig) {
    if (newMicConfig.sendingMicData === true) {
      console.log("[ON] Web client receiving MIC data".green);
    } else if (newMicConfig.sendingMicData === false) {
      console.log("[OFF] Web client stopped receiving MIC data".gray);
    }

    this.micConfig.update(newMicConfig);

    this.broadcastStateChange();
  }

  setPreset(presetName) {
    const controller = this.controller;
    const presets = controller.getCurrentPresets();

    if (!presets[presetName]) {
      console.warn(`Selected preset ${presetName} not found.`)
      return;
    }

    controller.currentProgram.config = _.extend(
      controller.getConfig(),
      presets[presetName]
    );

    this.broadcastStateChange();
  }

  setCurrentProgram(programKey) {
    this.controller.setCurrentProgram(programKey);
    this.broadcastStateChange();
  }

  updateConfigParam(config) {
    const controller = this.controller;
    controller.currentProgram.config = config;

    this.send("stateChange", {
      currentProgramName: controller.currentProgramName,
      currentConfig: controller.getCurrentConfig(),
      micConfig: this.micConfig.config
    });
  }

  startSamplingLights() {
    console.log("[ON] Web client sampling lights data".green);
    this.simulating = true;
    this.send("layout", this.controller.layout);
  }

  stopSamplingLights() {
    console.log("[OFF] Web client stopped sampling lights".gray);
    this.simulating = false;
  }

  restartProgram() {
    this.controller.restart();
  }

  disconnect() {
    console.log("[OFF] Remote control DISCONNNECTED".gray);
    this.controller.removeOnLights(this.lightsCallback);
  }
};
