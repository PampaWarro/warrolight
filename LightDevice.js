require('colors')

console.log("Hola".red)

const _ = require('lodash')
const now = require('performance-now')

const {DEBUG, INFO, WARNING, ERROR} = {
  DEBUG: 1,
  INFO: 2,
  WARNING: 3,
  ERROR: 4
}

const arrayFromRGB = rgb => {
  if (!rgb) {
    return //console.warn("Valor de RGB nulo: ", rgb);
  }
  const red = parseInt(rgb.substr(1, 2), 16)
  const blue = parseInt(rgb.substr(3, 2), 16)
  const green = parseInt(rgb.substr(5, 2), 16)
  return [red, blue, green]
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

    setInterval(() => this.logDeviceState(), 1000)
  }

  updateState(state) {
    this.deviceState = state;
    this.logDeviceState();
  }

  logDeviceState(){
    if(this.deviceState === this.STATE_RUNNING) {
      if (now() - this.lastPrint > 1000) {
        const FPS = (this.framesCount * 1000 / (now() - this.lastPrint)).toFixed(1)
        this.framesCount = 0
        this.lastFps = FPS;
        this.lastPrint = now()
        this.logInfo(`[${this.deviceId}] FPS: ${FPS}`.green)
      }
    } else {
      let msg = `[${this.deviceId}] ${this.deviceState}`;
      if (this.deviceState === this.STATE_CONNECTING) {
        msg = msg.yellow;
      } else if (this.deviceState === this.STATE_ERROR) {
        msg = msg.red;
      } if (this.deviceState === this.STATE_OFF) {
        msg = msg.gray;
      }
      this.logInfo(msg)
    }
  }

  setState(rgbArray) {
    // Initialize everything black
    const newState = _.map(_.range(this.numberOfLights), () => arrayFromRGB("#000000"))

    for (let i = 0; i < this.numberOfLights; i++) {
      newState[i] = arrayFromRGB(rgbArray[i % rgbArray.length])
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
      console.log(new Date(), this.deviceId, message.cyan)
    }
  }

  logInfo(message) {
    if (this.verbosity <= INFO) {
      console.log(new Date(), this.deviceId, message)
    }
  }

  logWarning(message) {
    if (this.verbosity <= WARNING) {
      console.log(new Date(), this.deviceId, message.yellow)
    }
  }

  logError(message) {
    if (this.verbosity <= ERROR) {
      console.log(new Date(), this.deviceId, message.red)
    }
  }
}
