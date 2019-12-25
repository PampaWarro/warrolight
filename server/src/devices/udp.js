const dgram = require("dgram");
const now = require("performance-now");
const logger = require("pino")({ prettyPrint: true });

const { LightDevice } = require("./base");
const { RGBEncoder } = require("./encodings");

let reconnectTime = 3000;

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
        this.updateState(this.STATE_RUNNING);
      } else if (data.startsWith("PERF")) {
        let perfCount = parseInt(data.substring(4) || 0);
        this.lastFps = perfCount;
        // console.log("Perf ", perfCount)
        //logger.info(`ACK`)
      } else {
        logger.info(`UNEXPECTED MSG'${data}'`);
      }
    } else {
      logger.info(`No data received`);
    }

    clearTimeout(this.reconnectTimeout);

    this.reconnectTimeout = setTimeout(() => {
      this.connected = false;
      this.updateState(this.STATE_CONNECTING);
      logger.info(`no data`);
    }, reconnectTime);
  }

  // Override parent
  logDeviceState() {
    if (this.deviceState === this.STATE_RUNNING) {
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
      (err, bytes) => {
        if (err) {
          this.handleError(err);
        }
      }
    );
  }

  setupCommunication() {
    this.udpSocket = dgram.createSocket("udp4");

    this.udpSocket.on("error", err => {
      this.udpSocket.close();
      this.updateState(this.STATE_ERROR);
      logger.error("Error: " + err.message);
      // Create socket again
      setTimeout(() => this.setupCommunication(), 500);
    });

    this.udpSocket.on("listening", () => {
      const address = this.udpSocket.address();
      this.updateState(this.STATE_CONNECTING);
      console.log(
        "UDP Server listening on " + address.address + ":" + address.port
      );
    });

    this.udpSocket.on("message", (message, remote) => {
      // console.log(message.toString(), remote.address)
      if (remote.address === this.expectedIp) {
        this.remotePort = remote.port;
        this.remoteAddress = remote.address;

        if (!this.connected) {
          console.log(`Connected to ${this.remoteAddress}:${this.remotePort}`);
          this.connected = true;
          this.updateState(this.STATE_RUNNING);
        }

        this.handleArduinoData(message.toString());
      }
    });

    setInterval(() => {
      // Es UDP, no esperamos respuesta
      if (this.connected) {
        this.sendNextFrame();
      }
    }, 16);

    this.udpSocket.on("error", err => {
      this.handleError(err);
    });
    this.udpSocket.on("close", () => {
      this.handleError("socket closed. Falta manejarlo");
    });

    this.udpSocket.bind(this.udpPort);
  }
  // open errors will be emitted as an error event
  handleError(err) {
    if (this.port) {
      this.updateState(this.STATE_ERROR);
      logger.error("Error: " + err.message);

      // setTimeout(() => this.setupCommunication(), 2000);
    }
  }
};
