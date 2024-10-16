const { Dmx, PROTOCOL_VERSION } = require('@rtf-dm/artnet-packets');
const _ = require('lodash');

class Encoder {
  constructor() {
    this.buf = null
  }

  encode(lights) {
    this.buf = []
    this.writeHeader(lights);

    for (let i = 0; i < lights.length; i++) {
      this.writePixel(i, lights[i][0], lights[i][1], lights[i][2]);
    }

    return this.buf;
  }

  write(data) {
    this.buf.push(...data);
  }
}


class PosRGBEncoder extends Encoder {
  writeHeader(lights) {
    this.write([1, lights.length])
  }

  writePixel(pos, r, g, b) {
    this.write([pos, r, g, b])
  }
}

class PosVGAEncoder extends Encoder {
  writeHeader(lights) {
    this.write([2, lights.length])
  }

  writePixel(pos, r, g, b) {
    this.write([pos, rgbToVga(r, g, b)])
  }
}

class VGAEncoder extends Encoder {
  writeHeader(lights) {
    this.write([3]);
  }

  writePixel(pos, r, g, b) {
    this.write([r, g, b])
  }
}

class RGBChunkedEncoder extends Encoder {
  constructor(maxChunkSize) {
    super();
    this.maxChunkSize = maxChunkSize;
  }

  encode(lights) {
    let chunkCount = Math.ceil(lights.length / this.maxChunkSize);
    let chunks = [];

    for(let c= 0; c < chunkCount;c++) {
      let buf = [4];

      for (let i = c*this.maxChunkSize; i < Math.min(lights.length, (c+1)*this.maxChunkSize); i++) {
        buf.push(lights[i][0], lights[i][1], lights[i][2]);
      }

      chunks.push(buf);
    }

    return chunks;
  }

  writePixel(pos, r, g, b) {
    this.write([r, g, b])
  }
}


class RGBEncoder extends Encoder {
  constructor(debugMode = false) {
    super();
    this.debugMode = debugMode;
  }
  writeHeader(lights) {
    this.write([this.debugMode ? 6 : 4]);
  }

  writePixel(pos, r, g, b) {
    this.write([r, g, b])
  }
}

class WLEDRGBEncoder extends RGBEncoder {
  writeHeader(lights) {
    // See https://kno.wled.ge/interfaces/udp-realtime/
    // 2 =	DRGB	Max 490 leds (TODO: Consider using 4 = DNRGB	for multi packets with 489/packet)
    // 2 = seconds until WLED returns to normal functioning
    this.write([2, 2]);
  }
}

class WLEDDNRGBEncoder extends Encoder {
  constructor() {
    super();
    this.maxChunkSize = 489;
  }

  encode(lights) {
    let chunkCount = Math.ceil(lights.length / this.maxChunkSize);
    let chunks = [];

    for (let c = 0; c < chunkCount; c++) {
      // See https://kno.wled.ge/interfaces/udp-realtime/
      const startIndex = c * this.maxChunkSize;
      const buf = [
        4, // DNRGB.
        2, // seconds until WLED returns to normal functioning.
        (startIndex >> 8) & 0xFF,  // Start index high byte.
        startIndex & 0xFF,  // Start index low byte.
      ];

      for (let i = startIndex; i < Math.min(lights.length, (c + 1) * this.maxChunkSize); i++) {
        buf.push(lights[i][0], lights[i][1], lights[i][2]);
      }

      chunks.push(buf);
    }

    return chunks;
  }

  writePixel(pos, r, g, b) {
    this.write([r, g, b])
  }
}

class RGB565Encoder extends Encoder {
  writeHeader(lights) {
    this.write([5]);
  }

  writePixel(pos, r, g, b) {
    this.write(rgbToRgb565(r, g, b))
  }
}

class ArtNetEncoder extends Encoder {
  constructor(mapping) {
    super();
    this.mapping = mapping;
    this.sequence = 0;
  }


  encode(lights) {
    let packets = [];
    for (let { offset, length, universe } of this.mapping) {
      let chunk = lights.slice(offset, offset + length);
      if (chunk.length == 0) continue;
      let dmxData = new Array(chunk.length * 3);
      for (let i = 0; i < chunk.length; i++) {
        dmxData[i * 3 + 0] = chunk[i][0];
        dmxData[i * 3 + 1] = chunk[i][1];
        dmxData[i * 3 + 2] = chunk[i][2];
      }
      let packet = new Dmx({
        protoVersion: PROTOCOL_VERSION,
        net: 0,
        length: dmxData.length,
        subNet: universe,
        sequence: this.sequence,
        physical: 0,
        dmxData: dmxData,
      })
      this.sequence = (this.sequence + 1) % 256;
      packets.push(packet.encode())
    }
    return packets;
  }

  writePixel(pos, r, g, b) {
    this.write([r, g, b])
  }
}

function rgbToVga(r, g, b) {
    return (r & 0xe0) + ((g & 0xe0) >> 3) + ((b & 0xc0) >> 6);
}

const rgbToRgb565 = (r, g, b) => {
  let b5 = (b >> 3) & 0x001f;
  let g6 = ((g >> 2) & 0x003f) << 5;
  let r5 = ((r >> 3) & 0x001f) << 11;

  let bytes = r5 | g6 | b5;
  return [bytes >> 8, bytes & 0xff];
};

module.exports = {
  PosRGBEncoder,
  PosVGAEncoder,
  RGBEncoder,
  VGAEncoder,
  RGB565Encoder,
  WLEDRGBEncoder,
  RGBChunkedEncoder,
  WLEDDNRGBEncoder,
  ArtNetEncoder,
}
