const dns = require('dns');
const dgram = require("dgram");
const now = require("performance-now");
const logger = require("pino")(require('pino-pretty')());
const fetch = import('node-fetch');

const { LightDevice } = require("./base");
const { WLEDRGBEncoder } = require("./encodings");

module.exports = class LightDeviceUDPWLED extends LightDevice {
  constructor({ numberOfLights, ip, name, udpPort }) {
    super(numberOfLights, "WLED " + (name || ip));

    this.expectedIp = ip;
    this.name = name;
    if (name && !ip) {
      dns.lookup(name, (err, address) => {
        if (err) {
          logger.info(`failed to resolve ${name}`);
        } else {
          logger.info(`resolved ${name} to ${address}`);
          this.expectedIp = address;
        }
      });
    }
    this.remotePort = udpPort;
    this.remoteAddress = ip;
    // this.udpPort = udpPort;

    this.encoder = new WLEDRGBEncoder();

    this.freshData = false;
    this.connected = true;

    this.packageCount = 0;

    this.updateStatus(this.STATUS_CONNECTING);
    this.setupCommunication();
  }

  async fetchDeviceInfo() {
    try {
      let res = await (await fetch(`http://${this.expectedIp}/json/info`, {timeout: 2000})).json()
      this.updateStatus(this.STATUS_RUNNING);
      this.connected = true;
      this.lastFps = res.leds.fps;
    } catch(err) {
      this.updateStatus(this.STATUS_ERROR);
    }
    setTimeout(() => this.fetchDeviceInfo(), 1000);
  }

  sendNextFrame() {
    if (this.connected && this.freshData) {
      const data = this.encoder.encode(this.state)
      // data.unshift(this.packageCount % 256)

      this.freshData = false;
      // this.packageCount++;
      this.flush(data);
    }
  }

  // handleArduinoData(data) {
  //   if (data) {
  //     data = data.replace(/[^\w]+/gi, "");
  //
  //     if (data.startsWith("YEAH")) {
  //       logger.info("Reconnected");
  //       this.updateStatus(this.STATUS_RUNNING);
  //     } else if (data.startsWith("PERF")) {
  //       let perfCount = parseInt(data.substring(4) || 0);
  //       this.lastFps = perfCount;
  //       // logger.info("Perf ", perfCount)
  //       // logger.info(`ACK`)
  //     } else {
  //       logger.info(`UNEXPECTED MSG'${data}'`);
  //     }
  //   } else {
  //     logger.info(`No data received`);
  //   }
  //
  //   clearTimeout(this.reconnectTimeout);
  //
  //   this.reconnectTimeout = setTimeout(() => {
  //     this.connected = false;
  //     this.updateStatus(this.STATUS_CONNECTING);
  //     logger.info(`no data`);
  //   }, RECONNECT_TIME);
  // }

  // Override parent
  logDeviceState() {
    if (this.status === this.STATUS_RUNNING) {
      if (now() - this.lastPrint > 250) {
        logger.info(`FPS: ${this.lastFps}`.green);
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

    // this.udpSocket.on("listening", this.handleListening.bind(this));
    // this.udpSocket.on("message", this.handleMessage.bind(this));
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

  // handleListening() {
  //   const address = this.udpSocket.address();
  //   this.updateStatus(this.STATUS_CONNECTING);
  //   logger.info(
  //     "UDP Server listening on " + address.address + ":" + address.port
  //   );
  // }

  // handleMessage(message, remote) {
  //   // logger.info(message.toString(), remote.address)
  //   if (message.toString().startsWith("YEAH") &&
  //       !message.toString().endsWith(this.name)) {
  //     logger.warn("UDP message came from %s, expected %s",
  //                 message.toString().substr(4), this.name);
  //     return;
  //   } else if (this.expectedIp && remote.address !== this.expectedIp) {
  //     logger.warn("UDP message came from %s, expected %s", remote.address,
  //                 this.expectedIp);
  //     return;
  //   }
  //
  //   this.remotePort = remote.port;
  //   this.remoteAddress = remote.address;
  //
  //   if (!this.connected) {
  //     logger.info(`Connected to ${this.remoteAddress}:${this.remotePort}`);
  //     this.connected = true;
  //     this.updateStatus(this.STATUS_RUNNING);
  //   }
  //
  //   this.handleArduinoData(message.toString());
  // }

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
//
//
// var client = dgram.createSocket('udp4');
// const _ = require('lodash')
// let i = 0;
// let send = () => {
//   i = (i+1) % 120;
//   let payload = Buffer.from([
//     2, 5,
//     100, 50, 50,
//     ... _.flatten(new Array(i*1).fill([0,0,0])),
//     // 0, 0, 50,
//     // 0, 255, Math.floor(Math.random()*255),
//     255, 0, 255,
//     255, 0, 255,
//     255, 0, 255,
//     255, 0, 255,
//   ]);
//   client.send(payload, 0, payload.length, 21666, '192.168.0.255');
// }
//
// setTimeout(send, 20);
