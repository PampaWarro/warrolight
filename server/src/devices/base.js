require("colors");
const _ = require("lodash");
const now = require("performance-now");
const logger = require("pino")(require('pino-pretty')());

const { DEBUG, INFO, WARNING, ERROR } = {
  DEBUG: 1,
  INFO: 2,
  WARNING: 3,
  ERROR: 4
};

exports.LightDevice = class LightDevice {
  constructor(numberOfLights, deviceId) {
    this.state = new Array(numberOfLights).fill([0, 0, 0]);
    this.numberOfLights = numberOfLights;

    this.deviceId = deviceId;

    this.freshData = false;
    this.waitingResponse = true;

    this.STATUS_OFF = "off";
    this.STATUS_CONNECTING = "connecting";
    this.STATUS_WAITING = "waiting";
    this.STATUS_RUNNING = "running";
    this.STATUS_ERROR = "error";

    this.status = this.STATUS_OFF;

    this.lastPrint = 0;
    this.framesCount = 0;

    setInterval(() => this.logDeviceState(), 1000);
  }

  updateStatus(status) {
    this.status = status;
  }

  logDeviceState() {
    if (this.status !== this.STATUS_RUNNING) {
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
    for (let i = 0; i < this.numberOfLights; i++) {
      this.state[i] = rgbArray[i % rgbArray.length];
    }
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
