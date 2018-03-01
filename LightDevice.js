require('colors')
const _ = require('lodash')
const now = require('performance-now')

const {DEBUG, INFO, WARNING, ERROR} = {
  DEBUG: 1,
  INFO: 2,
  WARNING: 3,
  ERROR: 4
}

const rgbToVga = (r, g, b) => {
  return (r & 0xE0) + ((g & 0xE0) >> 3) + ((b & 0xC0) >> 6)
}

let reconnectTime = 3000;

module.exports = class LightDevice {
  constructor(numberOfLights, deviceId) {
    this.state = _.range(0, numberOfLights)
    this.numberOfLights = numberOfLights

    this.deviceId = deviceId;

    this.verbosity = DEBUG;

    this.freshData = false;
    this.waitingResponse = true;

    this.STATE_OFF = "off"
    this.STATE_CONNECTING = "connecting"
    this.STATE_RUNNING = "running"
    this.STATE_ERROR = "error"

    this.deviceState = this.STATE_OFF

    this.lastPrint = 0;
    this.framesCount = 0;

    setInterval(() => this.logDeviceState(), 250)
  }

  updateState(state) {
    this.deviceState = state;
    this.logDeviceState();
  }

  logDeviceState() {
    if (this.deviceState === this.STATE_RUNNING) {
      if (now() - this.lastPrint > 250) {
        const FPS = (this.framesCount * 1000 / (now() - this.lastPrint)).toFixed(1)
        this.framesCount = 0
        this.lastFps = FPS;
        this.lastPrint = now()
        this.logInfo(`FPS: ${FPS}`.green)
      }
    } else {

    }
  }

  setState(rgbArray) {
    // Initialize everything black
    const newState = _.map(_.range(this.numberOfLights), () => [0,0,0])

    for (let i = 0; i < this.numberOfLights; i++) {
      newState[i] = rgbArray[i % rgbArray.length]
    }
    this.state = newState
    this.freshData = true;
    this.sendNextFrame();
  }

  sendNextFrame() {
    throw new Error("Not implemented")
  }

  setupCommunication() {
    throw new Error("Must be implemented by subclasses")
  }

  logDebug(message) {
    if (this.verbosity <= DEBUG) {
      message = (typeof message === 'function') ? message() : message
      this.logInfo(message)
    }
  }

  logInfo(message) {
    if (this.verbosity <= INFO) {
      this.lastStateMsg = message;
    }
  }

  logWarning(message) {
    if (this.verbosity <= WARNING) {
      this.logInfo(message)
      // console.log(new Date(), this.deviceId, message.yellow)
    }
  }

  logError(message) {
    if (this.verbosity <= ERROR) {
      this.logInfo(message)
      // console.log(new Date(), this.deviceId, message.red)
    }
  }
}
