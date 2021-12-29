const SerialPort = require("serialport");
const logger = require("pino")({ prettyPrint: true });

const { LightDevice } = require("./base");
const { RGBEncoder } = require("./encodings");

const RECONNECT_TIME = 3000;

module.exports = class LightDeviceSerial extends LightDevice {
  constructor({ numberOfLights, devicePortWindows, devicePortUnix, baudRate }) {
    const port = /^win/.test(process.platform)
      ? devicePortWindows
      : devicePortUnix;

    super(numberOfLights, port);

    this.devicePort = port;
    this.encoder = new RGBEncoder();
    this.baudRate = baudRate || 500000;

    this.protocolRetries = 0;

    this.freshData = false;
    this.waitingResponse = true;

    this.setupCommunication();
  }

  sendNextFrame() {
    if (this.freshData && !this.waitingResponse) {
      const data = this.encoder.encode(this.state)
      this.freshData = false;
      this.waitingResponse = true;
      this.flush(data);
    }
  }

  handleArduinoData(data) {
    if (data) {
      data = data.toString().replace(/[^\w]+/gi, "");
      if (data === "YEAH") {
        logger.info("Reconnected");
        this.updateStatus(this.STATUS_RUNNING);
      } else if (data === "OK") {
        //logger.info(`ACK`);
      } else if (data === "RECONNECT") {
        logger.info("RECONNECT request")
        this.sendInitialKick();
        return;
      } else if (data === "ARDUINOSTART") {
        logger.info("ARDUINOSTART");
        return;
      } else if (data === "FAILED_RF_WRITE") {
        logger.error(`Hardware failure. Restart serial port.`);
        clearTimeout(this.reconnectTimeout);
        this.restartSerialConnection();
        return;
      } else {
        logger.info(`UNEXPECTED MSG'${data}'`);
        return;
      }
    } else {
      logger.info(`No data received`);
    }

    clearTimeout(this.reconnectTimeout);

    this.reconnectTimeout = setTimeout(() => {
      this.sendInitialKick();
    }, RECONNECT_TIME);

    this.framesCount++;
    this.waitingResponse = false;
    this.sendNextFrame();
  }

  flush(data) {
    if (this.port) {
      this.port.write(Buffer.from(data));
    }
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
        // logger.info("No initial connection. Retrying")
        if (this.protocolRetries > 2) {
          this.restartSerialConnection();
          this.protocolRetries = 0;
        } else {
          this.sendInitialKick();
        }
      }, RECONNECT_TIME);
    }
  }

  restartSerialConnection() {
    logger.info("Restarting serial connection to restart arduino.");
    if (this.port) {
      this.port.close();
    }
    setTimeout(() => this.setupCommunication(), 1500);
  }

  setupCommunication() {
    this.updateStatus(this.STATUS_CONNECTING);

    this.port = new SerialPort(this.devicePort, {
      baudRate: this.baudRate
    });

    this.port.on("open", this.handleOpen.bind(this));
    this.port.on("error", this.handleError.bind(this));
    this.port.on("drain", this.handleDrain.bind(this));
    this.port.on("close", this.handleClose.bind(this));
    this.port.on("disconnect", this.handleClose.bind(this));

    const parser = new SerialPort.parsers.Readline({ delimiter: "\n" });
    parser.on("data", this.handleArduinoData.bind(this));

    this.port.pipe(parser);
  }

  handleOpen() {
    this.updateStatus(this.STATUS_CONNECTING);
    logger.info("Port open. Data rate: " + this.port.settings.baudRate);
    setTimeout(this.sendInitialKick.bind(this), 2000);
  }

  // open errors will be emitted as an error event
  handleError(err) {
    if (this.port) {
      this.updateStatus(this.STATUS_ERROR);
      // logger.error("Error: " + err.message);

      const oldPort = this.port;
      // To prevent reentrancy with handlers
      this.port = null;
      oldPort.close();
      setTimeout(() => this.setupCommunication(), 2000);
    }
  }

  handleClose(err) {
    if (this.port) {
      this.updateStatus(this.STATUS_ERROR);
      logger.error("Port closed.");
      this.port = null;
      setTimeout(() => this.setupCommunication(), 2000);
    }
  }

  handleDrain(err) {
    logger.warn("Port drained.");
  }
};
