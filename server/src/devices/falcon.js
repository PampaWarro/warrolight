const dns = require('dns');
const dgram = require("dgram");
const now = require("performance-now");
const logger = require("pino")(require('pino-pretty')());
const fetch = require('node-fetch');

const { LightDevice } = require("./base");
const { ArtNetEncoder } = require("./encodings");
const { Sync, ARTNET_PORT, PROTOCOL_VERSION } = require('@rtf-dm/artnet-packets');

const MAX_RGB_PER_UNIVERSE = Math.floor(512 / 3);

module.exports = class DeviceFalcon extends LightDevice {
  constructor({ numberOfLights, ip, name }) {
    super(numberOfLights, "Falcon " + (name || ip));

    this.remoteAddress = ip;
    this.name = name;
    if (name && !ip) {
      this.lookupByName();
    }
    this.remotePort = ARTNET_PORT;

    this.freshData = false;
    this.connected = false;

    this.updateStatus(this.STATUS_CONNECTING);
    this.setupCommunication();
  }

  lookupByName() {
    dns.lookup(this.name, (err, address) => {
      if (err) {
        logger.info(`failed to resolve ${this.name}`);
        setTimeout(() => this.lookupByName(), 500);
      } else {
        logger.info(`resolved ${this.name} to ${address}`);
        this.remoteAddress = address;
        this.fetchArtNetConfig();
      }
    });
  }

  async fetchArtNetConfig() {
    try {
      let res = await (await fetch(`http://${this.remoteAddress}/api`, {
        method: 'POST',
        body: JSON.stringify({ "T": "Q", "M": "SP", "B": 0, "E": 0, "I": 0, "P": {} }),
        timeout: 2000,
      })).json();
      this.setupEncoder(res.P.A);
      this.updateStatus(this.STATUS_RUNNING);
      this.connected = true;
      // TODO: Figure out FPS API if any.
      // this.lastFps = res.leds.fps;
    } catch (err) {
      logger.error(`fetchArtNetConfig error: ${err}`);
      this.updateStatus(this.STATUS_ERROR);
    }
  }

  setupEncoder(ports) {
    const encoderMapping = [];
    let offset = 0;
    for (let port of ports) {
      const lights = port.n;
      if (lights === 0) {
        continue;
      }
      const name = port.nm;
      const startUniverse = port.u;
      const startChannel = port.sc;  // Must be 0!
      let universe = startUniverse;
      for (let portOffset = 0; portOffset < lights; portOffset += MAX_RGB_PER_UNIVERSE) {
        encoderMapping.push({
          offset: offset + portOffset,
          length: Math.min(MAX_RGB_PER_UNIVERSE, lights - portOffset),
          universe: universe - 1,
        });
        ++universe;
      }
      offset += lights;
    }
    logger.info(`${this.name} ArtNet mapping: ${JSON.stringify(encoderMapping)} `);
    this.encoder = new ArtNetEncoder(encoderMapping);
  }

  sendNextFrame() {
    if (this.connected && this.freshData && this.encoder) {
      for (let packet of this.encoder.encode(this.state)) {
        this.flush(packet);
      }
      this.flush(new Sync({ protoVersion: PROTOCOL_VERSION }).encode());
      this.freshData = false;
    }
  }

  // Override parent
  logDeviceState() {
    if (this.status === this.STATUS_RUNNING) {
      if (now() - this.lastPrint > 1000) {
        logger.info(`FPS: ${this.lastFps} (${this.name || '-'})`.green);
        this.lastPrint = now();
      }
    }
  }

  name() {
    return this.name || this.ip;
  }

  flush(data) {
    if (!this.connected) {
      return;
    }
    let payload = Buffer.from(data);
    try {
      this.udpSocket.send(
        payload,
        0,
        payload.length,
        this.remotePort,
        this.remoteAddress,
        (err) => {
          if (err) {
            logger.error(`UDP send error: ${err} `);
            this.handleError(err);
          }
        }
      );
    } catch (e) {
      this.handleError(e);
    }
  }

  setupCommunication() {
    logger.info(`Opening new UDP socket for ${this.name}.`);
    this.udpSocket = dgram.createSocket({ type: 'udp4', reuseAddr: true });
    this.udpSocket.on("error", this.handleError.bind(this));
    this.udpSocket.on("close", this.handleClose.bind(this));
    this.udpSocket.on('message', (msg, rinfo) => {
      console.log(`Falcon UDP server for ${this.name} got: ${msg} from ${rinfo.address}:${rinfo.port} `);
    });

    setInterval(() => {
      // Es UDP, no esperamos respuesta
      if (this.connected) {
        this.sendNextFrame();
      }
    }, 16);
  }

  handleClose() {
    this.handleError("socket closed. Falta manejarlo");
  }

  // open errors will be emitted as an error event
  handleError(err) {
    // try {
    //   if (this.udpSocket) {
    //     this.udpSocket.close();
    //   }
    // } catch (e) {
    //   logger.error(`UDP close error: ${ e } `);
    // }
    // this.udpSocket = null;
    this.connected = false;
    this.updateStatus(this.STATUS_ERROR);
    logger.error(`Error: ${err.message} `);
    // Create socket again
    // setTimeout(() => this.setupCommunication(), 500);
  }
};
