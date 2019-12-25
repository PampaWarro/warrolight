const SerialPort = require("serialport");
const logger = require("pino")({ prettyPrint: true });

const { LightDevice } = require("./base");
const { RGBEncoder } = require("./encodings");

let reconnectTime = 3000;

module.exports = class LightDeviceSerial extends LightDevice {
  constructor({ numberOfLights, devicePortWindows, devicePortUnix }) {
    const port = /^win/.test(process.platform)
      ? devicePortWindows
      : devicePortUnix;

    super(numberOfLights, port);

    this.devicePort = port;
    this.encoder = new RGBEncoder();

    this.protocolRetries = 0;

    this.freshData = false;
    this.waitingResponse = true;

    this.setupCommunication();
  }

  sendNextFrame() {
    if (this.freshData && !this.waitingResponse) {
      this.initEncoding();

      for (let i = 0; i < this.numberOfLights; i++) {
        this.writePixel(
          i,
          this.state[i][0],
          this.state[i][1],
          this.state[i][2]
        );
      }
      this.freshData = false;
      this.waitingResponse = true;
      this.flush();
    }
  }

  handleArduinoData(data) {
    if (data) {
      data = data.toString().replace(/[^\w]+/gi, "");

      if (data === "YEAH") {
        logger.info("Reconnected");
        this.updateState(this.STATE_RUNNING);
      } else if (data === "OK") {
        //logger.info(`ACK`);
      } else if (data === "ARDUINOSTART") {
        logger.info("ARDUINOSTART");
        return;
      } else if (data === "FAILED_RF_WRITE") {
        console.log(`Hardware failure. Restart serial port.`);
        clearTimeout(this.reconnectTimeout);
        this.restartSerialConnection();
        return;
      } else {
        logger.info(`UNEXPECTED MSG'${data}'`);
        console.log(`UNEXPECTED MSG'${data}'`);
        return;
      }
    } else {
      logger.info(`No data received`);
    }

    clearTimeout(this.reconnectTimeout);

    this.reconnectTimeout = setTimeout(() => {
      this.sendInitialKick();
    }, reconnectTime);

    this.framesCount++;
    this.waitingResponse = false;
    this.sendNextFrame();
  }

  sendInitialKick() {
    if (this.port) {
      this.port.write("XXX", err => {
        if (err) {
          this.handleError(err);
        } else {
          logger.info("Initial kick of data sent");
        }
      });

      clearTimeout(this.reconnectTimeout);

      this.reconnectTimeout = setTimeout(() => {
        // console.log("No initial connection. Retrying")
        if (this.protocolRetries > 2) {
          this.restartSerialConnection();
          this.protocolRetries = 0;
        } else {
          this.sendInitialKick();
        }
      }, reconnectTime);
    }
  }

  restartSerialConnection() {
    console.log("Restarting serial connection to restart arduino.");
    if (this.port) {
      this.port.close();
    }
    setTimeout(() => this.setupCommunication(), 1500);
  }

  setupCommunication() {
    this.updateState(this.STATE_CONNECTING);
    // const setRetry = function() { setTimeout(tryOpenPort, 2000) };

    const tryOpenPort = () => {
      try {
        this.port = new SerialPort(this.devicePort, {
          baudRate: 1152000 / 2
        });

        this.port.on("open", () => {
          this.updateState(this.STATE_CONNECTING);
          logger.info("Port open. Data rate: " + this.port.settings.baudRate);
          setTimeout(this.sendInitialKick.bind(this), 2000);
        });
        const parser = this.port.pipe(
          new SerialPort.parsers.Readline({ delimiter: "\n" })
        );
        this.port.on("error", this.handleError.bind(this));
        parser.on("data", this.handleArduinoData.bind(this));
        this.port.on("drain", this.handleDrain.bind(this));
        this.port.on("close", this.handleClose.bind(this));
        this.port.on("disconnect", this.handleClose.bind(this));
      } catch (err) {
        this.updateState(this.STATE_ERROR);
        logger.error("Error retrying to open port. ", err);
        setTimeout(() => this.setupCommunication(), 2000);
      }
    };

    if (!this.port) {
      tryOpenPort();
    }
  }
  // open errors will be emitted as an error event
  handleError(err) {
    if (this.port) {
      this.updateState(this.STATE_ERROR);
      logger.error("Error: " + err.message);

      const oldPort = this.port;
      // To prevent reentrancy with handlers
      this.port = null;
      oldPort.close();
      setTimeout(() => this.setupCommunication(), 2000);
    }
  }

  handleClose(err) {
    if (this.port) {
      this.updateState(this.STATE_ERROR);
      logger.error("Port closed.");
      this.port = null;
      setTimeout(() => this.setupCommunication(), 2000);
    }
  }

  handleDrain(err) {
    logger.warn("Port drained.");
  }
};
