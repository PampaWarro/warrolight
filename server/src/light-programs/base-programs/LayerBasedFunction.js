SoundBasedFunction = require('./SoundBasedFunction.js');
const {DrawableLayer, CompositeLayer} = require('../utils/layers');

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
    this.drawables = this.getDrawables(config);
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
