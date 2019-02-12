const ColorUtils = require("./ColorUtils");

class Drawable {
  colorAtIndex(index, geometry) {
  }
}

class SolidColor extends Drawable {
  constructor(options) {
    super();
    this.color = options.color || [255, 255, 255, 1];
  }
  colorAtIndex(index, geometry) {
    return this.color;
  }
}

class RandomPixels extends Drawable {
  constructor(options) {
    options = options || {};
    super();
    this.color = options.color || [255, 255, 255, 1];
    this.threshold = (options.threshold === undefined)? 0 : options.threshold;
    this.randomAlpha = (
      options.randomAlpha === undefined)? false : options.randomAlpha;
  }
  colorAtIndex(index, geometry) {
    if (Math.random() > this.threshold) {
      if (this.randomAlpha) {
        const color = this.color.slice();
        color[3] = Math.random();
        return color;
      } else {
        return this.color;
      }
    }
  }
}

class XYDrawable extends Drawable {
  colorAtIndex(index, geometry) {
    const x = geometry.x[index];
    const y = geometry.y[index];
    return this.colorAtXY(x, y);
  }
}

class XYHue extends XYDrawable {
  constructor(options) {
    options = options || {};
    super(options);
    this.xFactor = options.xFactor || 1;
    this.xOffset = options.xOffset || 0;
    this.yFactor = options.yFactor || 1;
    this.yOffset = options.yOffset || 0;
    this.saturation  = options.saturation || 1;
    this.value  = options.value || 1;
  }
  colorAtXY(x, y) {
    const h = Math.abs(
      this.xOffset + this.xFactor * x +
      this.yOffset + this.yFactor * y) % 360;
    return ColorUtils.HSVtoRGB(h, this.saturation, this.value);
  }
}

class Line extends XYDrawable {
  constructor(options) {
    options = options || {};
    super();
    this.center = options.center || [0, 0];
    this.color = options.color || [255, 255, 255, 1];
    this.backgroundColor = options.backgroundColor || [0, 0, 0, 0];
    this.width = options.width || 1;
    this.angle = options.angle || 0;
  }
  set angle(angle) {
    this.baseVector = [Math.sin(angle), Math.cos(angle)];
  }
  colorAtXY(x, y) {
    const [centerX, centerY] = this.center;
    const [dX, dY] = [x - centerX, y - centerY];
    const d = dX * this.baseVector[0] + dY * this.baseVector[1];
    if (Math.abs(d) < this.width / 2) {
      return this.color;
    }
    return this.backgroundColor;
  }
}

class Circle extends XYDrawable {
  constructor(options) {
    options = options || {};
    super();
    this.center = options.center || [0, 0];
    this.borderColor = options.borderColor || [255, 255, 255, 1];
    this.fillColor = options.fillColor || [255, 255, 255, 1];
    this.backgroundColor = options.backgroundColor || [0, 0, 0, 1];
    this.width = options.width || 1;
    this.radius = options.radius || 1;
  }
  colorAtXY(x, y) {
    const [centerX, centerY] = this.center;
    const [dX, dY] = [x - centerX, y - centerY];
    const d = Math.sqrt(Math.pow(dX, 2) + Math.pow(dY, 2));
    if (Math.abs(d - this.radius) < this.width / 2) {
      return this.borderColor;
    } else if (d < this.radius) {
      return this.fillColor;
    }
    return this.backgroundColor;
  }
}

class InfiniteCircles extends XYDrawable {
  constructor(options) {
    options = options || {};
    super();
    this.center = options.center || [0, 0];
    this.borderColor = options.borderColor || [255, 255, 255, 1];
    this.backgroundColor = options.backgroundColor || [0, 0, 0, 0];
    this.width = options.width || 1;
    this.period = options.period || 10;
    this.offset = options.offset || 0;
    this.radiusWarp = options.radiusWarp || (radius => radius);
  }
  colorAtXY(x, y) {
    const [centerX, centerY] = this.center;
    const [dX, dY] = [x - centerX, y - centerY];
    const radius = Math.sqrt(Math.pow(dX, 2) + Math.pow(dY, 2));
    const d = Math.abs(this.offset + this.radiusWarp(radius)) % this.period;
    if (Math.abs(d - this.period) < this.width) {
      return this.borderColor;
    }
    return this.backgroundColor;
  }
}

module.exports = {
  Drawable,
  SolidColor,
  RandomPixels,
  XYDrawable,
  XYHue,
  Line,
  Circle,
  InfiniteCircles,
};
