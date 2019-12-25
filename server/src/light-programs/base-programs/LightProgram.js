module.exports = class LightProgram {
  constructor(config, geometry, shapeMapping) {
    this.config = config;
    this.geometry = geometry;
    this.shapeMapping = shapeMapping;
    this.numberOfLeds = geometry.leds;
  }

  init() {}

  // Override in subclasses
  drawFrame(draw, audio) {
    throw new Error("Child classes should override drawFrame");
  }

  updateConfig(config) {
    this.config = config;
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
      fps: { type: Number, min: 2, max: 60, default: 60 }
    };
  }
};
