const dns = require('dns');
const dgram = require("dgram");
const now = require("performance-now");
const logger = require("pino")(require('pino-pretty')());
const fetch = require('node-fetch');
const ReconnectingWebSocket = require("reconnecting-websocket");

const { LightDevice } = require("./base");
const { ArtNetEncoder } = require("./encodings");
const { Sync, ARTNET_PORT, PROTOCOL_VERSION } = require('@rtf-dm/artnet-packets');

module.exports = class DeviceAngio extends LightDevice {
  constructor({ numberOfLights, lightsPerChannel, ip, name }) {
    super(numberOfLights, "Angio " + (name || ip));

    this.lightsPerChannel = lightsPerChannel;
    this.remoteAddress = ip;
    this.name = name;
    if (name && !ip) {
      this.lookupByName();
    }
    this.remotePort = ARTNET_PORT;

    this.freshData = false;
    this.connected = false;

    this.packageCount = 0;

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
        this.setupStatusWebsocket(address);
      }
    });
  }

  setupStatusWebsocket(ip) {
    if (this.statusWS) {
      return;
    }
    let url = `ws://${ip}:81/`;
    logger.info(`Opening websocket with url: ${url}`);
    this.statusWS = new ReconnectingWebSocket(url);
    this.statusWS.addEventListener("open", () => {
      this.flush(new Sync({ protoVersion: PROTOCOL_VERSION }).encode());
    })
    this.statusWS.addEventListener("message", (event) => {
      let { key, data, result } = JSON.parse(event.data);
      if (!result) {
        logger.error(`failed ws request: ${event.data}`);
        return;
      }
      if (this.statusTimeout) {
        clearTimeout(this.statusTimeout);
        this.statusTimeout = null;
      }
      this.updateStatus(this.STATUS_RUNNING);
      this.connected = true;
      switch (key) {
        case "state": {
          this.lastFps = data.fps;
          break;
        }
        case "artnet": {
          this.setupEncoder(data.universes);
          break;
        }
        default: {
          logger.error(`unexpected key: ${key}`);
          break;
        }
      }
    });
    this.statusWS.addEventListener("error", (e) => {
      this.handleError(e);
    });
  }

  setupEncoder(universes) {
    let channelMapping = [];
    for (let [universe, offset, length, channel] of universes) {
      if (!channelMapping[channel]) {
        channelMapping[channel] = [];
      }
      channelMapping[channel].push({ offset, length, universe });
    }
    for (let mapping of channelMapping) {
      mapping.sort((a, b) => a.offset - b.offset);
      let lastOffset = mapping[mapping.length - 1];
      let maxLights = lastOffset.offset + lastOffset.length;
      if (this.lightsPerChannel > maxLights) {
        this.error(`lightsPerChannel is larger than supported by ${this.name}`);
      }
    }
    logger.info(`${this.name} ArtNet universes: ${JSON.stringify(channelMapping)}`);
    let encoderMapping = [];
    for (let channel = 0; channel < channelMapping.length; channel++) {
      let offset = channel * this.lightsPerChannel;
      let mappings = channelMapping[channel];
      for (let mapping of mappings) {
        if (mapping.offset > this.lightsPerChannel) {
          break;
        }
        encoderMapping.push({
          offset: offset + mapping.offset,
          length: Math.min(mapping.length, this.lightsPerChannel - mapping.offset),
          universe: mapping.universe,
        })
      }
    }
    logger.info(`${this.name} ArtNet mapping: ${JSON.stringify(encoderMapping)}`);
    this.encoder = new ArtNetEncoder(encoderMapping);
  }

  fetchDeviceInfo() {
    if (this.statusWS) {
      this.statusWS.send('{"cmd":"get","key":"state"}');
      if (!this.encoder) {
        this.statusWS.send('{"cmd":"get","key":"artnet"}');
      }
      if (this.statusTimeout) {
        clearTimeout(this.statusTimeout);
      }
      this.statusTimeout = setTimeout(() => {
        this.updateStatus(this.STATUS_ERROR);
        this.connected = false;
        logger.error(`${this.name} status ws timeout`);
      }, 2000);
    }
    setTimeout(() => this.fetchDeviceInfo(), 2000);
  }

  sendNextFrame() {
    if (this.connected && this.freshData && this.encoder) {
      for (let packet of this.encoder.encode(this.state)) {
        this.flush(packet);
        this.packageCount++;
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
      console.log(`Angio UDP server for ${this.name} got: ${msg} from ${rinfo.address}:${rinfo.port}`);
    });

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
    // try {
    //   if (this.udpSocket) {
    //     this.udpSocket.close();
    //   }
    // } catch (e) {
    //   logger.error(`UDP close error: ${e}`);
    // }
    // this.udpSocket = null;
    this.connected = false;
    this.updateStatus(this.STATUS_ERROR);
    logger.error(`Error: ${err.message}`);
    // Create socket again
    // setTimeout(() => this.setupCommunication(), 500);
  }
};
