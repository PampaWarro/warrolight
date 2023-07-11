const dns = require('dns');
const dgram = require("dgram");
const now = require("performance-now");
const logger = require("pino")(require('pino-pretty')());
const fetch = require('node-fetch');

const { LightDevice } = require("./base");
const { WLEDDNRGBEncoder } = require("./encodings");

module.exports = class LightDeviceUDPWLED extends LightDevice {
  constructor({ numberOfLights, ip, name, udpPort }) {
    super(numberOfLights, "WLED " + (name || ip));

    this.remoteAddress = ip;
    this.name = name;
    if (name && !ip) {
      dns.lookup(name, (err, address) => {
        if (err) {
          logger.info(`failed to resolve ${name}`);
        } else {
          logger.info(`resolved ${name} to ${address}`);
          this.remoteAddress = address;
        }
      });
    }
    // 21324 is the default WLED port
    this.remotePort = udpPort || 21324;
    this.remoteAddress = ip;

    this.encoder = new WLEDDNRGBEncoder();

    this.freshData = false;
    this.connected = true;

    this.packageCount = 0;

    this.updateStatus(this.STATUS_CONNECTING);
    this.setupCommunication();
  }

  async fetchDeviceInfo() {
    try {
      let res = await (await fetch(`http://${this.remoteAddress}/json/info`, {timeout: 2000})).json()
      this.updateStatus(this.STATUS_RUNNING);
      this.connected = true;
      this.wledName = res.name;
      this.lastFps = res.leds.fps;
    } catch(err) {
      this.updateStatus(this.STATUS_ERROR);
    }
    setTimeout(() => this.fetchDeviceInfo(), 2000);
  }

  sendNextFrame() {
    if (this.connected && this.freshData) {
      for (let chunk of this.encoder.encode(this.state)) {
        this.flush(chunk);
        this.packageCount++;
      }

      this.freshData = false;
    }
  }

  // Override parent
  logDeviceState() {
    if (this.status === this.STATUS_RUNNING) {
      if (now() - this.lastPrint > 250) {
        logger.info(`FPS: ${this.lastFps} (${this.wledName || '-'})`.green);
        this.lastPrint = now();
      }
    }
  }

  name() {
    return this.name || this.ip;
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
    this.udpSocket.on("error", this.handleError.bind(this));
    this.udpSocket.on("close", this.handleClose.bind(this));

    this.udpSocket.bind(this.udpPort);

    setInterval(() => {
      // Es UDP, no esperamos respuesta
      if (this.connected) {
        this.sendNextFrame();
      }
    }, 16);

    this.fetchDeviceInfo();
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
