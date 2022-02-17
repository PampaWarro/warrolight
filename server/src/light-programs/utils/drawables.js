const ColorUtils = require("./ColorUtils");
const {loadGradient} = require("./gradients");

class Drawable {
  colorAtIndex(index, geometry) {}
}

class GradientColorize extends Drawable {
  constructor(options) {
    options = options || {};
    super(options);
    this.drawable = options.drawable;
    this.value = options.value || "alphaluminance";
    this.gradient = options.gradient;
    this.preserveAlpha = !!options.preserveAlpha;
    this.invert = !!options.invert;
  }
  set gradient(gradient) {
    if (!gradient) {
      return;
    }
    this._gradient = loadGradient(gradient);
  }
  set value(value) {
    if (value == "alpha") {
      this.getValue = this._getAlpha;
    } else if (value == "luminance") {
      this.getValue = color => ColorUtils.luminance(...color) / 255;
    } else if (value == "alphaluminance") {
      this.getValue = color => {
        return (this._getAlpha(color) * ColorUtils.luminance(...color)) / 255;
      };
    } else {
      this.getValue = value;
    }
  }
  _getAlpha([r, g, b, a]) {
    if (a == null) {
      return 1;
    }
    return a;
  }
  colorAtIndex(index, geometry) {
    const color = this.drawable.colorAtIndex(index, geometry);
    let value = this.getValue(color);
    if (this.invert) {
      value = 1 - value;
    }
    const [r, g, b, a] = this._gradient.colorAt(value);
    const newColor = [r, g, b, this.preserveAlpha ? color[3] : a];
    return newColor;
  }
}

class SingleLed extends Drawable {
  constructor(options) {
    options = options || {};
    super(options);
    this.color = options.color || [255, 255, 255, 1];
    this.ledIndex = options.ledIndex || 0;
  }
  colorAtIndex(index, geometry) {
    const currentIndex = Math.round(
      ColorUtils.mod(this.ledIndex, geometry.leds)
    );
    if (index == currentIndex) {
      return this.color;
    }
  }
}

class SolidColor extends Drawable {
  constructor(options) {
    super(options);
    this.color = options.color || [255, 255, 255, 1];
  }
  colorAtIndex(index, geometry) {
    return this.color;
  }
}

class RandomPixels extends Drawable {
  constructor(options) {
    options = options || {};
    super(options);
    this.color = options.color || [255, 255, 255, 1];
    this.threshold = options.threshold === undefined ? 0 : options.threshold;
    this.randomAlpha =
      options.randomAlpha === undefined ? false : options.randomAlpha;
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

class XYZDrawable extends Drawable {
  colorAtIndex(index, geometry) {
    const x = geometry.x[index];
    const y = geometry.y[index];
    const z = geometry.z[index];
    return this.colorAtXYZ(x, y, z);
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
    this.saturation = options.saturation || 1;
    this.value = options.value || 1;
  }
  colorAtXY(x, y) {
    const h = ColorUtils.mod(
      Math.abs(
        this.xOffset + this.xFactor * x + this.yOffset + this.yFactor * y
      ),
      1
    );
    return ColorUtils.HSVtoRGB(h, this.saturation, this.value);
  }
}

class Line extends XYDrawable {
  constructor(options) {
    options = options || {};
    super(options);
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
    super(options);
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
    super(options);
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
    const d = ColorUtils.mod(
      this.offset + this.radiusWarp(radius),
      this.period
    );
    if (Math.abs(d - this.period) < this.width) {
      return this.borderColor;
    }
    return this.backgroundColor;
  }
}

class Grid extends XYDrawable {
  constructor(options) {
    options = options || {};
    super(options);
    this.color = options.borderColor || [255, 255, 255, 1];
    this.backgroundColor = options.backgroundColor || [0, 0, 0, 0];
    this.width = options.width || 1;
    this.xyPeriod = options.period || [10, 10];
    this.xyOffset = options.xyOffset || [0, 0];
    this.xyWarp = options.xyWarp || ((x, y) => [x, y]);
  }
  colorAtXY(x, y) {
    [x, y] = this.xyWarp(x, y);
    x += this.xyOffset[0];
    y += this.xyOffset[1];
    [x, y] = [
      ColorUtils.mod(x, this.xyPeriod[0]),
      ColorUtils.mod(y, this.xyPeriod[1])
    ];
    if (
      Math.abs(ColorUtils.mod(x, this.xyPeriod[0])) < this.width ||
      Math.abs(ColorUtils.mod(y, this.xyPeriod[1])) < this.width
    ) {
      return this.color;
    }
    return this.backgroundColor;
  }
}

class PolarDrawable extends XYDrawable {
  constructor(options) {
    options = options || {};
    super(options);
    this.center = options.center || [0, 0];
    this.angleOffset = options.angleOffset || 0;
  }
  colorAtXY(x, y) {
    const [centerX, centerY] = this.center;
    const [dX, dY] = [x - centerX, y - centerY];
    const radius = Math.sqrt(Math.pow(dX, 2) + Math.pow(dY, 2));
    const angle = Math.acos(dX / radius);
    return this.colorAtPolar(
      radius,
      ColorUtils.mod(angle + this.angleOffset, Math.PI)
    );
  }
}

class PolarColors extends PolarDrawable {
  constructor(options) {
    options = options || {};
    super(options);
    this.cycleCount = options.cycleCount || 1;
    this.saturation = options.saturation || 1;
    this.value = options.value || 1;
  }
  colorAtPolar(radius, angle) {
    const h = ColorUtils.mod((angle * this.cycleCount) / Math.PI, 1);
    return ColorUtils.HSVtoRGB(h, this.saturation, this.value);
  }
}

class RadiusCosineBrightness extends PolarDrawable {
  constructor(options) {
    options = options || {};
    super(options);
    this.color = options.color || [255, 255, 255, 1];
    this.radiusOffset = options.radiusOffset || 0;
    this.scale = options.scale || 1;
    this.radiusWarp = options.radiusWarp || (x => x);
  }
  colorAtPolar(radius, angle) {
    radius = this.radiusWarp(this.scale * (radius + this.radiusOffset));
    const v = 0.02 + 0.98 * (Math.cos(radius / Math.PI)**2);
    return ColorUtils.clamp(
      v * this.color[0],
      v * this.color[1],
      v * this.color[2]
    );
  }
}

class GradientSolidSphere extends XYZDrawable {
  constructor(options) {
    options = options || {};
    super(options);
    this.radius = options.radius != null? options.radius : 1;
    this.center = options.center || [0, 0, 0];
    this.gradient = options.gradient || "tas01";
  }
  get gradient() {
    return this._gradient;
  }
  set gradient(gradient) {
    if (!gradient) {
      return;
    }
    this._gradient = gradient.colorAt? gradient : loadGradient(gradient);
  }
  colorAtXYZ(x, y, z) {
    const dx = x - this.center[0];
    const dy = y - this.center[1];
    const dz = z - this.center[2];
    const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (d > this.radius) {
      return [0, 0, 0, 0];
    }
    const gradientPos = d / this.radius;
    const color = this.gradient.colorAt(gradientPos);
    return color;
  }
}

module.exports = {
  Drawable,
  GradientColorize,
  GradientSolidSphere,
  SingleLed,
  SolidColor,
  RandomPixels,
  XYHue,
  Line,
  Circle,
  InfiniteCircles,
  PolarColors,
  RadiusCosineBrightness,
  Grid
};
