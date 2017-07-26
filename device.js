const _ = require('lodash')
const SerialPort = require('serialport')
const now = require('performance-now')
const { DEBUG, INFO, WARNING, ERROR } = require('./log')

const notEqual = (a, b) => {
  return a[0] !== b[0] || a[1] !== b[1] || a[2] !== b[2]
}

const {
  ENCODING_RGB,
  ENCODING_VGA,
  ENCODING_POS_RGB,
  ENCODING_POS_VGA,
  arrayFromRGB,
  rgbToVga
} = require('./colorEncoding')

module.exports = class Device {

  constructor(numberOfLights, devicePort, verbosity) {
    this.state = _.range(0, numberOfLights)
    this.numberOfLights = numberOfLights
    this.verbosity = verbosity || DEBUG
    this.devicePort = devicePort
    this.encoding = ENCODING_RGB

    this.port = new SerialPort(devicePort, {
      baudRate: 1152000 / 2,
      parser: SerialPort.parsers.readline("\n")
    })

    this.setupCommunication()
    this.freshData = false;
    this.waitingResponse = true;
    this.dataBuffer = []

    this.getFPS = () => {
      const FPS = (1000/(now() - this.lastReceived)).toFixed(1)
      return this.devicePort + ' - received pingback. FPS: ' + FPS
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
    if(this.freshData && !this.waitingResponse) {
      this.initEncoding()

      let dim = 1
      for (let i = 0; i < this.numberOfLights; i++) {
        this.writePixel(i,
          this.state[i][0] / dim,
          this.state[i][1] / dim,
          this.state[i][2] / dim
        )
      }
      this.freshData = false;
      this.waitingResponse = true;
      this.flush()
    }
  }

  handleData(data) {
    this.logDebug(this.getFPS)
    this.lastReceived = now()
    this.waitingResponse = false;
    this.sendNextFrame()
  }


  initEncoding() {
    this.write([this.encoding]);
    if (this.needsHeaderWithNumberOfLights()) {
      this.write([this.numberOfLights]);
    }
  }

  needsHeaderWithNumberOfLights () {
    return this.encoding === ENCODING_POS_RGB
        || this.encoding === ENCODING_POS_VGA
  }

  writePixel(pos, r, g, b) {
    switch (this.encoding) {
      case ENCODING_RGB:
        return this.write([r, g, b])
      case ENCODING_VGA:
        return this.write([rgbToVga(r, g, b)])
      case ENCODING_POS_RGB:
        return this.write([pos, r, g, b])
      case ENCODING_POS_VGA:
        return this.write([pos, rgbToVga(r, g, b)])
      default:
        this.logError('Invalid encoding!')
        return
    }
  }

  write(data) {
    this.dataBuffer = this.dataBuffer.concat(data);
  }

  flush() {
    this.port.write(Buffer.from(this.dataBuffer))
    this.dataBuffer = [];
  }

  sendInitialKick(){
    this.port.write(
      Buffer.from([1, 2, 255, 0, 255]), () => {
        this.logInfo('Initial kick of data sent')
      }
    )
  }

  setupCommunication() {

    this.lastReceived = now();

    this.port.on('open', () => {
      this.logInfo('Port open. Data rate: ' + this.port.options.baudRate);
      setTimeout(this.sendInitialKick.bind(this), 2000)
    })

    this.port.on('error', this.handleError.bind(this))
    this.port.on('data', this.handleData.bind(this))
    this.port.on('drain', this.handleData.bind(this))
    this.port.on('close', this.handleClose.bind(this))
  }
// open errors will be emitted as an error event
  handleError(err) {
    this.logError('Error: ' + err.message)
  }

  handleClose(err) {
    this.logInfo('Port closed.')

    const setRetry = function() { setTimeout(retry, 2000) }
    var retry = () => {
      console.log('retrying...', this.devicePort)
      try {
      this.port = new SerialPort(this.devicePort, {
        baudRate: 1152000 / 2,
        parser: SerialPort.parsers.readline("\n")
      })
      } catch (e) {
        setRetry()
      }

      this.setupCommunication()
    }
    setRetry()
  }

  handleDrain(err) {
    this.logInfo('Port drained.')
  }

  logDebug(message) {
    if (this.verbosity <= DEBUG) {
      message = (typeof message === 'function') ? message() : message
      console.log(this.devicePort, message)
    }
  }

  logInfo(message) {
    if (this.verbosity <= INFO) {
      console.log(this.devicePort, message)
    }
  }

  logWarning(message) {
    if (this.verbosity <= WARNING) {
      console.log(this.devicePort, message)
    }
  }

  logError(message) {
    if (this.verbosity <= ERROR) {
      console.log(this.devicePort, message)
    }
  }
}
