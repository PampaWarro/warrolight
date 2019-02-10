const SoundBasedFunction = require("./../base-programs/SoundBasedFunction");
const ColorUtils = require("./../utils/ColorUtils");
const _ = require('lodash');

function findBounds(values) {
  let min = null;
  let max = null;
  values.forEach(value => {
    if (min == null || value < min) {
      min = value;
    }
    if (max == null || value > max) {
      max = value
    }
  });
  return {
    min: min,
    max: max,
    center: Math.round(min + max / 2),
    scale: max - min,
  }
}

class Drawable {
  draw(colors, geometry) {
  }
}

class SolidColor extends Drawable {
  constructor(options) {
    super();
    this.color = options.color || [255, 255, 255];
  }
  draw(colors, geometry) {
    for (let i = 0; i < colors.length; i++) {
      colors[i] = this.color;
    }
  }
}

class RandomPixels extends Drawable {
  constructor(options) {
    options = options || {};
    super();
    this.color = options.color || [255, 255, 255];
    this.threshold = (options.threshold === undefined)? 0 : options.threshold;
  }
  draw(colors, geometry) {
    for (let i = 0; i < colors.length; i++) {
      if (Math.random() > this.threshold) {
        colors[i] = this.color;
      }
    }
  }
}

class XYBasedDrawable extends Drawable {
  colorAt(x, y) {
    return null;
  }
  draw(colors, geometry) {
    for (let i = 0; i < colors.length; i++) {
      const x = geometry.x[i];
      const y = geometry.y[i];
      colors[i] = this.colorAt(x, y);
    }
  }
}

class XYHue extends XYBasedDrawable {
  constructor(options) {
    super();
    options = options || {};
    this.xFactor = options.xFactor || 1;
    this.xOffset = options.xOffset || 0;
    this.yFactor = options.yFactor || 1;
    this.yOffset = options.yOffset || 0;
  }
  colorAt(x, y) {
    const h = (
      this.xOffset + this.xFactor * x +
      this.yOffset + this.yFactor * y) % 360;
    return ColorUtils.HSVtoRGB(h, 1, .5);
  }
}

class Line extends XYBasedDrawable {
  constructor(options) {
    options = options || {};
    super();
    this.center = options.center || [0, 0];
    this.color = options.color || [255, 255, 255];
    this.backgroundColor = options.backgroundColor || [0, 0, 0];
    this.width = options.width || 1;
    this.angle = options.angle || 0;
  }
  set angle(angle) {
    this.baseVector = [Math.sin(angle), Math.cos(angle)];
  }
  colorAt(x, y) {
    const [centerX, centerY] = this.center;
    const [dX, dY] = [x - centerX, y - centerY];
    const d = dX * this.baseVector[0] + dY * this.baseVector[1];
    if (Math.abs(d) < this.width / 2) {
      return this.color;
    }
    return this.backgroundColor;
  }
}

class Circle extends XYBasedDrawable {
  constructor(options) {
    options = options || {};
    super();
    this.center = options.center || [0, 0];
    this.borderColor = options.borderColor || [255, 255, 255];
    this.fillColor = options.fillColor || [255, 255, 255];
    this.backgroundColor = options.backgroundColor || [0, 0, 0];
    this.width = options.width || 1;
    this.radius = options.radius || 10;
  }
  colorAt(x, y) {
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

const blendFunctions = {
  normal: (base, blend) => blend,
  add: (base, blend) => ColorUtils.clamp(
    base[0] + blend[0],
    base[1] + blend[1],
    base[2] + blend[2],
  ),
  subtract: (base, blend) => ColorUtils.clamp(
    Math.abs(base[0] - blend[0]),
    Math.abs(base[1] - blend[1]),
    Math.abs(base[2] - blend[2]),
  ),
  multiply: (base, blend) => ColorUtils.clamp(
    base[0] * blend[0] / 255,
    base[1] * blend[1] / 255,
    base[2] * blend[2] / 255,
  ),
}

class Layer {
  constructor(options) {
    options = options || {};
    const blendMode = options.blendMode || 'normal';
    this.blendFunction = blendFunctions[blendMode];
    if (!this.blendFunction) {
      throw `Blend function '${blendMode}' not found.`;
    }
  }
  apply(colors, geometry) {
    const newColors = new Array(colors.length);
    newColors.fill([0, 0, 0]);
    this.draw(newColors, geometry);
    for (let i = 0; i < colors.length; i++) {
      const base = colors[i];
      const blend = newColors[i];
      if (!blend) {
        continue;
      }
      colors[i] = this.blendFunction(base, blend);
    }
  }
}

class DrawableLayer extends Layer {
  constructor(options) {
    options = options || {};
    super(options);
    this.drawable = options.drawable;
  }
  draw(colors, geometry) {
    this.drawable.draw(colors, geometry);
  }
}

class CompositeLayer extends Layer {
  constructor(options) {
    options = options || {};
    super(options);
    this.layers = options.layers;
    if (!this.layers || this.layers.length < 1) {
      throw `Need a non-empty list of child layers, got ${this.layers}.`;
    }
  }
  draw(colors, geometry) {
    this.layers.forEach(layer => {
      layer.apply(colors, geometry);
    });
  }
}

module.exports = class Func extends SoundBasedFunction {
  constructor(config, leds) {
    super(config, leds);

    const self = this;
    const geometry = this.position || this.geometry;
    this.xBounds = findBounds(geometry.x);
    this.yBounds = findBounds(geometry.y);
    this.backgroundXYHue = new XYHue();
    this.line1 = new Line({
      center: [this.xBounds.center, this.yBounds.center],
    });
    this.line2 = new Line({
      center: [this.xBounds.center, this.yBounds.max],
      width: 1,
    });
    this.circle = new Circle({
      center: [this.xBounds.center, this.yBounds.max],
      width: 5,
    });
    this.randomPixels = new RandomPixels({threshold: 0.7});
    this.rootLayer = new CompositeLayer({
      layers: [
        new DrawableLayer({
          drawable: this.backgroundXYHue,
        }),
        new CompositeLayer({
          layers: [
            new DrawableLayer({
              drawable: this.line1,
              blendMode: 'add',
            }),
            new DrawableLayer({
              drawable: this.circle,
              blendMode: 'add',
            }),
          ],
          blendMode: 'multiply',
        }),
        new DrawableLayer({
          drawable: this.randomPixels,
          blendMode: 'add',
        }),
        new DrawableLayer({
          drawable: this.line2,
          blendMode: 'add',
        }),
      ],
    });
  }

  updateShapes() {
    const centerChannel = this.currentAudioFrame.center;
    if (!centerChannel) {
      return;
    }
    const normalizedHigh = (centerChannel.filteredBands.
      high.movingStats.rms.normalizedFastAvg);
    const normalizedBass = (centerChannel.filteredBands.
      bass.movingStats.rms.normalizedFastAvg);
    const normalizedBassSlow = (centerChannel.filteredBands.
      bass.movingStats.rms.normalizedAvg);
    this.backgroundXYHue.xFactor = 0.01*Math.cos(Math.PI*normalizedBassSlow);
    this.backgroundXYHue.yFactor = 0.02*Math.cos(Math.PI*normalizedHigh);
    this.backgroundXYHue.xOffset = 10*normalizedBassSlow;
    this.line1.center[1] = this.yBounds.center + Math.cos(
      Math.PI * this.timeInMs / 5000) * this.yBounds.scale  / 2;
    this.line1.width = 5 + 10 * normalizedBass;
    this.line2.angle = Math.cos(Math.PI * this.timeInMs/5000) * ((Math.PI * this.timeInMs / 500) % Math.PI);
    this.circle.radius = 10 + 50 * normalizedBass;
    this.randomPixels.threshold = 1 - .1*normalizedHigh;
    this.randomPixels.color = ColorUtils.HSVtoRGB(0, 0, normalizedHigh);
  }

  drawFrame(draw, done) {
    const that = this;
    this.updateShapes();

    const colors = new Array(this.numberOfLeds);
    colors.fill([0, 0, 0]);
    this.rootLayer.apply(colors, this.geometry);

    draw(colors)
    done();
  }

  static presets() {
    return {
      "default": {velocidad: 0.4, whiteBorder: true},
      "gold": {velocidad: 0.1, whiteBorder: false, escala: 0.5, color: 0.42}
    }
  }

  // Override and extend config Schema
  static configSchema() {
    let res = super.configSchema();
    res.escala = {type: Number, min: 0.01, max: 5, step: 0.01, default: 1}
    res.color = {type: Number, min: 0, max: 1, step: 0.01, default: 0}
    res.velocidad = {type: Number, min: -3, max: 3, step: 0.01, default: 0.6}
    res.whiteBorder = {type: Boolean, default: false}
    return res;
  }
}
