const _ = require('lodash')
const SerialPort = require('serialport')
const now = require('performance-now')

const {DEBUG, INFO, WARNING, ERROR} = {
  DEBUG: 1,
  INFO: 2,
  WARNING: 3,
  ERROR: 4
}

const notEqual = (a, b) => {
  return a[0] !== b[0] || a[1] !== b[1] || a[2] !== b[2]
}

const ENCODING_POS_RGB = 1;
const ENCODING_POS_VGA = 2;
const ENCODING_VGA = 3;
const ENCODING_RGB = 4;

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

let reconnectTime = 1000;

module.exports = class Device {

  constructor(numberOfLights, devicePort, verbosity) {
    this.state = _.range(0, numberOfLights)
    this.numberOfLights = numberOfLights
    this.verbosity = verbosity || DEBUG
    this.devicePort = devicePort
    this.encoding = ENCODING_RGB

    this.setupCommunication()

    this.freshData = false;
    this.waitingResponse = true;
    this.dataBuffer = []

    this.lastPrint = 0;
    this.framesCount = 0;
  }

  logFPS(){
    if(now() - this.lastPrint > 1000) {
      const FPS = (this.framesCount*1000 / (now() - this.lastPrint)).toFixed(1)
      this.framesCount = 0
      this.lastPrint = now()
      this.logDebug(this.devicePort + ' - received pingback. FPS: ' + FPS)
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
    if(data){
      data = data.replace(/[^\w]+/gi, "")

      if(data === 'YEAH'){
        this.logInfo("Reconnected")
      } else if (data !== 'OK') {
        this.logInfo(`UNEXPECTED MSG'${data}'`)
      }
    } else {
      this.logInfo(`No data received`)
    }

    clearTimeout(this.reconnectTimeout);

    this.reconnectTimeout = setTimeout(() => {
      this.sendInitialKick()
    }, reconnectTime)

    this.logFPS()
    this.framesCount++
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
    if(this.port) {
      this.port.write(Buffer.from(this.dataBuffer))
    }
    this.dataBuffer = [];
  }

  sendInitialKick(){
    if(this.port) {
      this.port.write('XXX', (err) => {
          if(err){
            this.handleError(err)
          } else {
            this.logInfo('Initial kick of data sent')
          }
        }
      )

      clearTimeout(this.reconnectTimeout);

      this.reconnectTimeout = setTimeout(() => {
        this.sendInitialKick()
      }, reconnectTime)
    }
  }

  setupCommunication() {
    // const setRetry = function() { setTimeout(tryOpenPort, 2000) };

    const tryOpenPort = () => {
      try {
        this.port = new SerialPort(this.devicePort, {
          baudRate: 1152000 / 2,
          parser: SerialPort.parsers.readline("\n")
        })

        this.port.on('open', () => {
          this.logInfo('Port open. Data rate: ' + this.port.options.baudRate);
          setTimeout(this.sendInitialKick.bind(this), 100)
        })

        this.port.on('error', this.handleError.bind(this))
        this.port.on('data', this.handleData.bind(this))
        this.port.on('drain', this.handleDrain.bind(this))
        this.port.on('close', this.handleClose.bind(this))
        this.port.on('disconnect', this.handleClose.bind(this))
      } catch (err) {
        this.logInfo("Error retrying to open port. ", err)
        setTimeout(() => this.setupCommunication(), 2000);
      }
    };
    if(!this.port) {
      tryOpenPort();
    }
  }
// open errors will be emitted as an error event
  handleError(err) {
    if(this.port) {
      this.logError('Error: ' + err.message)
      var oldPort = this.port;
      // To prevent reentrancy with handlers
      this.port = null;
      oldPort.close();
      setTimeout(() => this.setupCommunication(), 2000);
    }
  }

  handleClose(err) {
    if(this.port) {
      this.logInfo('Port closed.')
      this.port = null;
      setTimeout(() => this.setupCommunication(), 2000);
    }
  }

  handleDrain(err) {
    this.logInfo('Port drained.')
  }

  logDebug(message) {
    if (this.verbosity <= DEBUG) {
      message = (typeof message === 'function') ? message() : message
      console.log(new Date(), this.devicePort, message)
    }
  }

  logInfo(message) {
    if (this.verbosity <= INFO) {
      console.log(new Date(), this.devicePort, message)
    }
  }

  logWarning(message) {
    if (this.verbosity <= WARNING) {
      console.log(new Date(), this.devicePort, message)
    }
  }

  logError(message) {
    if (this.verbosity <= ERROR) {
      console.log(new Date(), this.devicePort, message)
    }
  }
}
