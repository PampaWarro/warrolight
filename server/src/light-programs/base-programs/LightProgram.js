module.exports = class LightProgram {
  constructor(config, geometry, shapeMapping, lightController) {
    this.config = config;
    this.geometry = geometry;
    this.shapeMapping = shapeMapping;
    this.numberOfLeds = geometry.leds;
    this.lightController = lightController;
  }

  init() {}

  // Override in subclasses
  drawFrame(leds, context) {
    throw new Error("Child classes should override drawFrame");
  }

  updateConfig(config) {
    this.config = config;
  }

  toString() {
    return this.constructor.name;
  }

  static configSchema() {
    // Child classes should call super.configSchema and extend this object
    return {
      globalBrightness: {
        type: Number,
        min: 0,
        max: 1,
        step: 0.01,
        default: 1
      },
      fps: { type: Number, min: 2, max: 120, default: 60 },
      tags: {type: 'tags', options: ['bright', 'dark']}
    };
  }
};
