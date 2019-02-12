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

const blendFunctions = {
  normal: (base, blend) => blend,
  add: (base, blend) => ColorUtils.clamp(
    base[0] + blend[0],
    base[1] + blend[1],
    base[2] + blend[2],
    base[3] + blend[3],
  ),
  difference: (base, blend) => ColorUtils.clamp(
    Math.abs(base[0] - blend[0]),
    Math.abs(base[1] - blend[1]),
    Math.abs(base[2] - blend[2]),
    base[3] + blend[3],
  ),
  subtract: (base, blend) => ColorUtils.clamp(
    base[0] - blend[0],
    base[1] - blend[1],
    base[2] - blend[2],
    base[3] + blend[3],
  ),
  multiply: (base, blend) => ColorUtils.clamp(
    base[0] * blend[0] / 255,
    base[1] * blend[1] / 255,
    base[2] * blend[2] / 255,
    base[3] + blend[3],
  ),
}

class Layer {
  constructor(options) {
    options = options || {};
    this.name = options.name || '';
    this.alpha = (options.alpha === undefined)? 1 : options.alpha;
    this.blendMode = options.blendMode || 'normal';
    this.debug = !!options.debug;
    this.enabled = (options.enabled === undefined)? true : options.enabled;
  }
  set blendMode(blendMode) {
    this.blendFunction = blendFunctions[blendMode];
    if (!this.blendFunction) {
      throw `Blend function '${blendMode}' not found.`;
    }
  }
  applyAtIndex(index, geometry, base) {
    if (!this.enabled) {
      return base;
    }
    const blend = this.colorAtIndex(index, geometry);
    if (!blend) {
      return base;
    }
    const blendResult = this.blendFunction(base, blend);
    const alpha = this.alpha * blendResult[3];
    const mix = ColorUtils.mix(base, blendResult, alpha);
    if (this.debug) {
      console.log('blend', base, blend, blendResult, alpha, mix);
    }
    return mix;
  }
}

class DrawableLayer extends Layer {
  constructor(options) {
    options = options || {};
    super(options);
    this.drawable = options.drawable;
  }
  colorAtIndex(index, geometry) {
    return this.drawable.colorAtIndex(index, geometry);
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
  colorAtIndex(index, geometry) {
    let color = [0, 0, 0, 0];
    this.layers.forEach(layer => {
      color = layer.applyAtIndex(index, geometry, color);
    });
    return color;
  }
}

module.exports = class Func extends SoundBasedFunction {
  constructor(config, leds) {
    super(config, leds);

    const self = this;
    const geometry = this.position || this.geometry;
    this.xBounds = findBounds(geometry.x);
    this.yBounds = findBounds(geometry.y);
    this.backgroundXYHue = new XYHue({
      xFactor: 0.01,
      yFactor: 0.01,
      value: .7,
    });
    this.bassLine = new Line({
      center: [this.xBounds.center, this.yBounds.center],
    });
    this.rotor = new Line({
      center: [this.xBounds.center, this.yBounds.max],
      width: 1,
    });
    this.bassCircle = new Circle({
      center: [this.xBounds.center, this.yBounds.max],
      width: 5,
    });
    this.rainDots = new InfiniteCircles({
      center: [this.xBounds.center, this.yBounds.min],
      width: .5,
      period: 20,
      radiusWarp: radius => .01 * Math.pow(radius, 2),
    });
    this.highPixels = new RandomPixels({randomAlpha: true});
    this.fillCircle = new Circle({
      center: [this.xBounds.center, this.yBounds.center],
      fillColor: [0, 0, 0, 0],
      width: 100,
    });
    this.rootLayer = new CompositeLayer({
      layers: [
        new CompositeLayer({
          layers: [
            new DrawableLayer({
              drawable: this.backgroundXYHue,
            }),
            new CompositeLayer({
              layers: [
                this.bassLineLayer = new DrawableLayer({
                  drawable: this.bassLine,
                  blendMode: 'add',
                }),
                this.bassCircleLayer = new DrawableLayer({
                  drawable: this.bassCircle,
                  blendMode: 'add',
                }),
              ],
              blendMode: 'multiply',
              alpha: 0.99,
            }),
          ],
        }),
        this.highPixelsLayer = new DrawableLayer({
          drawable: this.highPixels,
          blendMode: 'normal',
        }),
        this.rotorLayer = new DrawableLayer({
          drawable: this.rotor,
          blendMode: 'normal',
        }),
        this.rainDotsLayer = new DrawableLayer({
          drawable: this.rainDots,
          blendMode: 'normal',
          alpha: 0.3,
        }),
        this.fillCircleLayer = new DrawableLayer({
          drawable: this.fillCircle,
          blendMode: 'normal',
          alpha: 0.1,
        }),
      ],
    });
  }

  updateShapes() {
    this.bassCircleLayer.enabled = this.config.bassCircle;
    this.bassLineLayer.enabled = this.config.bassLine;
    this.fillCircleLayer.enabled = this.config.fillCircle;
    this.highPixelsLayer.alpha = this.config.highLayerAlpha;
    this.rotorLayer.alpha = this.config.rotorAlpha;
    this.rainDotsLayer.alpha = this.config.rainDotsAlpha;
    const centerChannel = this.currentAudioFrame.center;
    if (!centerChannel) {
      return;
    }
    const audioSummary = centerChannel.summary;
    const highNoBass = audioSummary.highRmsNoBass;
    const normalizedBass = audioSummary.bassPeakDecay;
    this.backgroundXYHue.xOffset = .01 * this.xBounds.scale * Math.cos(
      Math.PI * this.timeInMs / 5000
    );
    this.backgroundXYHue.yOffset = .01 * this.yBounds.scale * Math.cos(
      Math.PI * this.timeInMs / 3000
    );
    this.bassLine.center[1] = this.yBounds.center + Math.cos(
      Math.PI * this.timeInMs / 5000) * this.yBounds.scale  / 2;
    this.bassLine.width = 2 * normalizedBass;
    this.rotor.angle = Math.cos(Math.PI * this.timeInMs/5000) * ((Math.PI * this.timeInMs / 500) % Math.PI);
    this.bassCircle.radius = 10 + 50 * Math.pow(normalizedBass, 2);
    this.rainDots.offset = -this.timeInMs/50;
    this.rainDots.center[0] = this.xBounds.center + Math.cos(
      Math.PI * this.timeInMs / 7000) * this.xBounds.scale / 3;
    this.highPixels.threshold = 1 - .1*highNoBass;
    this.fillCircle.radius = 300 * (3000 - (this.timeInMs%3000))/3000;
  }

  drawFrame(draw, done) {
    const that = this;
    this.updateShapes();

    const colors = new Array(this.numberOfLeds);
    colors.fill([0, 0, 0, 1]);
    colors.forEach((baseColor, i) => {
      const color = this.rootLayer.applyAtIndex(i, that.geometry, baseColor);
      colors[i] = color.splice(0, 3);
    });

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
    res.bassCircle = {type: Boolean, default: true}
    res.bassLine = {type: Boolean, default: true}
    res.fillCircle = {type: Boolean, default: false}
    res.highLayerAlpha = {type: Number, default: 0, min:0, max:1, step:0.01}
    res.rotorAlpha = {type: Number, default: 0, min:0, max:1, step:0.01}
    res.rainDotsAlpha = {type: Number, default: 0, min:0, max:1, step:0.01}
    return res;
  }
}
