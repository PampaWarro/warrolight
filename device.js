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
} = require('./colorDef')

export default class Device {

  constructor(numberOfLights, devicePort, verbosity) {
    this.state          = _.range(0, numberOfLights)
    this.prevState      = _.range(0, numberOfLights)

    this.verbosity = verbosity || DEBUG
    this.devicePort = devicePort
    this.encoding = ENCODING_RGB

    this.port = new SerialPort(devicePort, {
      baudRate: 1152000,
      parser: SerialPort.parsers.readline("\n")
    })

    this.setupCommunication()

    this.dataBuffer = []
  }

  setState(rgbArray) {
    const newState = _.range(numberOfLights)
    for (let i = 0; i < numberOfLights; i++) {
      newState[i] = arrayFromRGB(rgbArray[i])
    }
    this.state = newState
  }

  sendNextFrame() {
    let totalLedsChanged = 0;
    for (let i = 0; i < this.numberOfLights; i++) {
      if (notEqual(this.state[i], this.prevState[i])) {
        totalLedsChanged++
      }
    }
    // initEncoding(totalLedsChanged);
    this.initEncoding()

    let dim = 1
    for (let i = 0; i < 150; i++) {
      this.writePixel(i,
        this.state[i][0]/dim,
        this.state[i][1]/dim,
        this.state[i][2]/dim
      )
    }
    this.prevState = this.state
    this.flush()
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

    this.port.on('open', function() {
      this.logInfo('Port open. Data rate: ' + this.port.options.baudRate);
      setTimeout(this.sendInitialKick.bind(this), 2000)
    })

    this.port.on('error', this.handleError.bind(this))
    this.port.on('data', this.handleData.bind(this))
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
  }

  handleDrain(err) {
    this.logInfo('Port drained.')
  }

  getFPS = () => {
    const FPS = (1000/(now() - this.lastReceived)).toFixed(1)
    return this.devicePort + ' - received pingback. FPS: ' + FPS
  }

  handleData(data) {
    this.logDebug(this.getFPS)
    this.lastReceived = now()
    this.sendNextFrame()
  }

  logDebug(message) {
    if (this.verbosity <= DEBUG) {
      message = typeof message === function ? message() : message
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
