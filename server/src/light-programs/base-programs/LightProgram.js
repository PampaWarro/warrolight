module.exports = class LightProgram {
  constructor(config, leds) {
    this.config = config;
    this.leds = leds;
    this.numberOfLeds = leds.numberOfLeds;
    this.geometry = leds.geometry;
    this.position = leds.position;
  }

  // Override in subclasses
  drawFrame(draw, audio) {
    throw new Error("Child classes should override drawFrame");
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
