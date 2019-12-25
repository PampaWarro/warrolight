require("colors");
const _ = require("lodash");
const now = require("performance-now");
const logger = require("pino")({ prettyPrint: true });

const { DEBUG, INFO, WARNING, ERROR } = {
  DEBUG: 1,
  INFO: 2,
  WARNING: 3,
  ERROR: 4
};

exports.rgbToVga = function rgbToVga(r, g, b) {
  return (r & 0xe0) + ((g & 0xe0) >> 3) + ((b & 0xc0) >> 6);
};

exports.LightDevice = class LightDevice {
  constructor(numberOfLights, deviceId) {
    this.state = _.range(0, numberOfLights);
    this.numberOfLights = numberOfLights;

    this.deviceId = deviceId;

    this.freshData = false;
    this.waitingResponse = true;

    this.STATE_OFF = "off";
    this.STATE_CONNECTING = "connecting";
    this.STATE_RUNNING = "running";
    this.STATE_ERROR = "error";

    this.deviceState = this.STATE_OFF;

    this.lastPrint = 0;
    this.framesCount = 0;

    setInterval(() => this.logDeviceState(), 250);
  }

  updateState(state) {
    this.deviceState = state;
  }

  logDeviceState() {
    if (this.deviceState !== this.STATE_RUNNING) {
      return;
    }

    const FPS = (
      (this.framesCount * 1000) /
      (now() - this.lastPrint)
    ).toFixed(1);

    this.framesCount = 0;
    this.lastFps = FPS;
    this.lastPrint = now();
    logger.info(`FPS: ${FPS}`);
  }

  setLights(rgbArray) {
    // Initialize everything black
    const newState = _.map(_.range(this.numberOfLights), () => [0, 0, 0]);

    for (let i = 0; i < this.numberOfLights; i++) {
      newState[i] = rgbArray[i % rgbArray.length];
    }
    this.state = newState;
    this.freshData = true;
    this.sendNextFrame();
  }

  sendNextFrame() {
    throw new Error("Not implemented");
  }

  setupCommunication() {
    throw new Error("Must be implemented by subclasses");
  }
};
