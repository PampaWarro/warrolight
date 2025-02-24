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

  touch(data) {
    if (typeof data.angleLeft !== 'undefined' && typeof data.angleRight !== 'undefined') {
      // Double mode: use left and right angles and intensities.
      this.touchData = {
        angleLeft: data.angleLeft,
        angleRight: data.angleRight,
        intensityLeft: (typeof data.intensityLeft !== 'undefined') ? data.intensityLeft : 1,
        intensityRight: (typeof data.intensityRight !== 'undefined') ? data.intensityRight : 1
      };
    } else {
      // Single mode: use a single angle and intensity.
      this.touchData = {
        angle: data.angle,
        intensity: data.intensity
      };
    }
  }

  updateConfig(config) {
    this.config = config;
  }

  toString() {
    return this.constructor.name;
  }

  getDebugHelpers() {
    return [];
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
      tags: {type: 'tags', options: [
        // Overall brightness.
        'bright', 'dark',
        // Works fine without music?
        'music-required', 'music-optional',
        // Intensity level.
        'intensity-low', 'intensity-mid', 'intensity-high',
        // Depends on shape mapping?
        'shape-specific', 'shape-agnostic',
      ]}
    };
  }

  static extractDefaults() {
    let configSchema = this.configSchema();
    let config = {};
    for (let paramName in configSchema) {
      if (configSchema[paramName].default !== undefined) {
        config[paramName] = configSchema[paramName].default;
      }
    }
    return config;
  }
};
