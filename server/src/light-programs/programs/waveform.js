const LightProgram = require("./../base-programs/LightProgram");
const ColorUtils = require("./../utils/ColorUtils");
const {
  TimedMultiGradient,
  loadGradient,
  allGradients
} = require("../utils/gradients");

module.exports = class Waveform extends LightProgram {
  constructor(config, geometry) {
    super(config, geometry);
    this.timedMultiGradient = new TimedMultiGradient(allGradients());
    this.max = 0;
  }

  drawFrame(leds, context) {
    const audio = context.audio;

    const frame = audio.currentFrame;
    if (!frame) {
      return;
    }
    this.timedMultiGradient.currentTime = this.timeInMs / 1000;
    const samples = frame.samples;
    const absSamples = samples.map(Math.abs);
    this.max = Math.max(this.max, ...absSamples);
    const gradient = this.config.colorMap
      ? loadGradient(this.config.colorMap)
      : this.timedMultiGradient;

    for (let i = 0; i < this.numberOfLeds; i++) {
      const index = Math.floor((samples.length * i) / this.numberOfLeds);
      const sample = samples[index];
      const absSample = absSamples[index];
      const gradientPos = 0.5 * (sample / this.max) + 0.5;
      const brightness = absSample / this.max;
      // BUG: gradient.colorAt() sometimes returns undefined.
      const color = gradient.colorAt(gradientPos);
      if (!color) {
        console.error(`gradient.colorAt(${gradientPos}) returned undefined`);
        continue;
      }
      leds[i] = color.map(x => Math.floor(x * brightness));
    }
  }

  static presets() {
    return {
      default: {},
      slow: {}
    };
  }

  // Override and extend config Schema
  static configSchema() {
    let config = super.configSchema();
    config.colorMap = { type: "gradient", default: "" };
    return config;
  }
};
