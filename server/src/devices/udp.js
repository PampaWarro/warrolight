const dgram = require("dgram");
const now = require("performance-now");
const logger = require("pino")({ prettyPrint: true });

const { LightDevice } = require("./base");
const { RGBEncoder } = require("./encodings");

const RECONNECT_TIME = 3000;

module.exports = class LightDeviceUDP extends LightDevice {
  constructor({ numberOfLights, ip, udpPort }) {
    super(numberOfLights, "E " + ip);

    this.expectedIp = ip;
    this.udpPort = udpPort;

    this.encoder = new RGBEncoder();

    this.freshData = false;
    this.connected = false;

    this.packageCount = 0;

    this.setupCommunication();
  }

  sendNextFrame() {
    if (this.connected && this.freshData) {
      const data = this.encoder.encode(this.state)
      data.unshift(this.packageCount % 256)

      this.freshData = false;
      this.packageCount++;
      this.flush(data);
    }
  }

  handleArduinoData(data) {
    if (data) {
      data = data.replace(/[^\w]+/gi, "");

      if (data === "YEAH") {
        logger.info("Reconnected");
        this.updateStatus(this.STATUS_RUNNING);
      } else if (data.startsWith("PERF")) {
        let perfCount = parseInt(data.substring(4) || 0);
        this.lastFps = perfCount;
        // logger.info("Perf ", perfCount)
        // logger.info(`ACK`)
      } else {
        logger.info(`UNEXPECTED MSG'${data}'`);
      }
    } else {
      logger.info(`No data received`);
    }

    clearTimeout(this.reconnectTimeout);

    this.reconnectTimeout = setTimeout(() => {
      this.connected = false;
      this.updateStatus(this.STATUS_CONNECTING);
      logger.info(`no data`);
    }, RECONNECT_TIME);
  }

  // Override parent
  logDeviceState() {
    if (this.status === this.STATUS_RUNNING) {
      if (now() - this.lastPrint > 250) {
        logger.info(`FPS: ${this.lastFps}`.green);
        this.lastPrint = now();
      }
    }
  }

  flush(data) {
    let payload = Buffer.from(data);
    this.udpSocket.send(
      payload,
      0,
      payload.length,
      this.remotePort,
      this.remoteAddress,
      (err) => {
        if (err) {
          this.handleError(err);
        }
      }
    );
  }

  setupCommunication() {
    this.udpSocket = dgram.createSocket("udp4");

    this.udpSocket.on("listening", this.handleListening.bind(this));
    this.udpSocket.on("message", this.handleMessage.bind(this));
    this.udpSocket.on("error", this.handleError.bind(this));
    this.udpSocket.on("close", this.handleClose.bind(this));

    this.udpSocket.bind(this.udpPort);

    setInterval(() => {
      // Es UDP, no esperamos respuesta
      if (this.connected) {
        this.sendNextFrame();
      }
    }, 16);
  }

  handleListening() {
    const address = this.udpSocket.address();
    this.updateStatus(this.STATUS_CONNECTING);
    logger.info(
      "UDP Server listening on " + address.address + ":" + address.port
    );
  }

  handleMessage(message, remote) {
    // logger.info(message.toString(), remote.address)
    if (remote.address !== this.expectedIp) {
      logger.warn("UDP message came from %s, expected %s", remote.address, this.expectedIp);
      return;
    }

    this.remotePort = remote.port;
    this.remoteAddress = remote.address;

    if (!this.connected) {
      logger.info(`Connected to ${this.remoteAddress}:${this.remotePort}`);
      this.connected = true;
      this.updateStatus(this.STATUS_RUNNING);
    }

    this.handleArduinoData(message.toString());
  }

  handleClose() {
    this.handleError("socket closed. Falta manejarlo");
  }

  // open errors will be emitted as an error event
  handleError(err) {
    this.udpSocket.close();
    this.updateStatus(this.STATUS_ERROR);
    logger.error("Error: " + err.message);
    // Create socket again
    setTimeout(() => this.setupCommunication(), 500);
  }
};
