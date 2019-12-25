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
    this.buf = this.buf.concat(data);
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


class RGBEncoder extends Encoder {
  writeHeader(lights) {
    this.write([4]);
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
  RGB565Encoder
}
