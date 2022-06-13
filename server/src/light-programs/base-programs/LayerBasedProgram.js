const LightProgram = require("./LightProgram.js");
const { DrawableLayer, CompositeLayer } = require("../utils/layers");

// TODO: consider moving this to the Geometry object itself
function findBounds(values) {
  let min = null;
  let max = null;
  values.forEach(value => {
    if (min == null || value < min) {
      min = value;
    }
    if (max == null || value > max) {
      max = value;
    }
  });
  return {
    min: min,
    max: max,
    center: Math.round(min + max / 2),
    scale: max - min
  };
}

module.exports = class LayerBasedProgram extends LightProgram {
  constructor(config, geometry) {
    super(config, geometry);
    this.xBounds = findBounds(this.geometry.x);
    this.yBounds = findBounds(this.geometry.y);
    this.zBounds = findBounds(this.geometry.z);
  }

  init() {
    this.drawables = this.getDrawables(this.config);
    this.layers = {};
    this.rootLayer = this.buildLayer(
      this.getLayers(this.drawables),
      this.layers
    );
  }

  buildLayer(layerSpec, layersByName) {
    const name = layerSpec.name;
    let layer = null;
    if (layerSpec.drawable) {
      layer = new DrawableLayer(layerSpec);
    } else if (layerSpec.layers) {
      const subLayers = layerSpec.layers;
      layerSpec.layers = subLayers.map(subLayer =>
        this.buildLayer(subLayer, layersByName)
      );
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
    console.warn("Unimplemented getDrawables()");
    return {};
  }

  getLayers() {
    console.warn("Unimplemented getLayers()");
    return {};
  }

  updateState() {
    console.warn("Unimplemented updateState()");
  }

  drawFrame(leds, context) {
    this.updateState(context.audio);
    leds.fill([0, 0, 0, 1]);
    if (!this.rootLayer) {
      console.error("Missing rootLayer.");
    }
    leds.forEach((baseColor, i) => {
      const color = this.rootLayer.applyAtIndex(i, this.geometry, baseColor);
      color.length = 3;
      leds[i] = color;
    });
  }
};
