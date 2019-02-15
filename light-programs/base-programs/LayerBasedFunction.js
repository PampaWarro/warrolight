SoundBasedFunction = require('./SoundBasedFunction.js');
const ColorUtils = require("./../utils/ColorUtils");

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
      if (layer.alpha > 0) {
        color = layer.applyAtIndex(index, geometry, color);
      }
    });
    return color;
  }
}

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

module.exports = class LayerBasedFunction extends SoundBasedFunction {
  constructor(config, leds) {
    super(config, leds);
    this.geometry = this.position || this.geometry;
    this.xBounds = findBounds(this.geometry.x);
    this.yBounds = findBounds(this.geometry.y);
    this.drawables = this.getDrawables();
    this.layers = {};
    this.rootLayer = this.buildLayer(
      this.getLayers(this.drawables), this.layers);
  }

  buildLayer(layerSpec, layersByName) {
    const that = this;
    const name = layerSpec.name;
    var layer = null;
    if (layerSpec.drawable) {
      layer = new DrawableLayer(layerSpec);
    } else if (layerSpec.layers) {
      const subLayers = layerSpec.layers;
      layerSpec.layers = subLayers.map(
        subLayer => that.buildLayer(subLayer, layersByName));
      layer = new CompositeLayer(layerSpec);
    } else {
      console.error(`Unable to build layer from spec ${layerSpec}`);
    }
    if (name && layer) {
      layersByName[name] = layer;
    }
    return layer;
  }

  getDrawables() {
    console.warn('Unimplemented getDrawables()');
    return {};
  }

  getLayers() {
    console.warn('Unimplemented getLayers()');
    return {};
  }

  updateState() {
    console.warn('Unimplemented updateState()');
  }

  drawFrame(draw, done) {
    const that = this;
    this.updateState();
    const colors = new Array(this.numberOfLeds);
    colors.fill([0, 0, 0, 1]);
    if (!this.rootLayer) {
      console.error('Missing rootLayer.');
    }
    colors.forEach((baseColor, i) => {
      const color = this.rootLayer.applyAtIndex(i, that.geometry, baseColor);
      colors[i] = color.splice(0, 3);
    });
    draw(colors)
    done();
  }
}
