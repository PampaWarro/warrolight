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

  drawFrame(draw, audio) {
    const colors = new Array(this.numberOfLeds);

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
      colors[i] = gradient
        .colorAt(gradientPos)
        .map(x => Math.floor(x * brightness));
    }

    draw(colors);
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
