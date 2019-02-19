const ColorUtils = require("./ColorUtils");

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
    if (!this.layers) {
      throw `Need a list of child layers, got ${this.layers}.`;
    }
  }
  colorAtIndex(index, geometry) {
    let color = [0, 0, 0, 0];
    this.layers.forEach(layer => {
      if (layer.alpha > 0) {
        color = layer.applyAtIndex(index, geometry, color);
      }
    });
    return color;
  }
}

module.exports = {
  Layer,
  DrawableLayer,
  CompositeLayer,
};
