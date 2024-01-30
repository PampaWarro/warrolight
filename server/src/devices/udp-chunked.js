const dns = require('dns');
const dgram = require("dgram");
const now = require("performance-now");
const logger = require("pino")(require('pino-pretty')());

const { LightDevice } = require("./base");
const { RGBChunkedEncoder} = require("./encodings");

const RECONNECT_TIME = 3000;

module.exports = class LightDeviceUDPChunked extends LightDevice {
  constructor({ numberOfLights, ip, name, udpPort, chunkSize }) {
    super(numberOfLights, "E " + (name || ip));

    this.expectedIp = ip;
    this.name = name;
    if (name && !ip) {
      this.lookupByName();
    }
    this.udpPort = udpPort;

    this.encoder = new RGBChunkedEncoder(chunkSize || 300);

    this.freshData = false;
    this.connected = false;

    this.packageCount = 0;

    this.setupCommunication();
  }

  lookupByName() {
    dns.lookup(this.name, (err, address) => {
      if (err) {
        logger.info(`failed to resolve ${this.name}`);
        setTimeout(() => this.lookupByName(), 500);
      } else {
        logger.info(`resolved ${this.name} to ${address}`);
        this.expectedIp = address;
      }
    });
  }

  sendNextFrame() {
    if (this.connected && this.freshData) {
      let chunks = this.encoder.encode(this.state);

      for(let c = 0;c < chunks.length;c++) {
        const data = [this.packageCount % 256, c, ... chunks[c]]
        this.flush(data);
        this.packageCount++;
      }

      this.freshData = false;
    }
  }

  handleArduinoData(data) {
    if (data) {
      data = data.trim();

      if (data.startsWith("YEAH")) {
        let [,leds, datapin1, datapin2] = data.match(/YEAH leds=(\w+) datapin1=(\w+) datapin2=(\w+)/) || [];
        this.metadata = {leds, datapin1, datapin2};

        logger.info("Reconnected "+JSON.stringify(this.metadata));
        this.updateStatus(this.STATUS_WAITING);
      } else if (data.startsWith("PERF")) {
        data = data.replace(/[^\w]+/gi, "");
        this.lastFps = parseInt(data.substring(4) || 0);
        this.updateStatus(this.STATUS_RUNNING);
      } else {
        logger.info(`UNEXPECTED MSG'${data}'`);
      }
    } else {
      logger.info(`No data received`);
    }

    clearTimeout(this.reconnectTimeout);

    this.reconnectTimeout = setTimeout(() => {
      this.connected = false;
      this.metadata = {};
      this.lastFps = null;
      this.updateStatus(this.STATUS_CONNECTING);
      logger.info(`no data`);
    }, RECONNECT_TIME);
  }

  // Override parent
  logDeviceState() {
    if (this.status === this.STATUS_RUNNING) {
      if (now() - this.lastPrint > 10000) {
        logger.info(`FPS: ${this.lastFps}`.green);
        this.lastPrint = now();
      }
    }
  }

  name() {
    return this.name || this.ip;
  }

  flush(data) {
    if (!this.udpSocket) {
      return;
    }
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
    this.udpSocket = dgram.createSocket({type: "udp4", reuseAddr: true});

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
    if (!this.expectedIp) {
      logger.warn(`Expected IP uknown, ignoring message: ${message.toString()}`);
      return;
    }
    if (remote.address !== this.expectedIp) {
      logger.warn("UDP message came from %s, expected %s", remote.address,
                  this.expectedIp);
      this.lookupByName();
      return;
    }

    this.remotePort = remote.port;
    this.remoteAddress = remote.address;

    if (!this.connected) {
      logger.info(`Connected to ${this.remoteAddress}:${this.remotePort}`);
      this.connected = true;
      this.updateStatus(this.STATUS_WAITING);
    }

    this.handleArduinoData(message.toString());
  }

  handleClose() {
    this.handleError("socket closed. Falta manejarlo");
  }

  // open errors will be emitted as an error event
  handleError(err) {
    if (this.udpSocket) {
      try {
        this.udpSocket.disconnect();
      } catch (e) {
        logger.error("UDP disconnect error:", + err);
      }
      try {
        this.udpSocket.close();
      } catch (e) {
        logger.error("UDP close error:", + err);
      }
      this.udpSocket = null;
    }
    this.updateStatus(this.STATUS_ERROR);
    logger.error("UDP error: " + err);
    // Create socket again
    setTimeout(() => this.setupCommunication(), 500);
  }
};
