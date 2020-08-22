const tumult = require("tumult");
const LightProgram = require("./../base-programs/LightProgram");
const ColorUtils = require("../utils/ColorUtils");
const {
  TimedMultiGradient,
  loadGradient,
  allGradients
} = require("../utils/gradients");

function rescale(value) {
  return 0.5 + 0.5 * Math.sin(value);
}

// A simple program based on Simplex noise to generate
// a random cloud of colors.
module.exports = class Noise extends LightProgram {
  constructor(config, geometry) {
    super(config, geometry);
    this.timedMultiGradient = new TimedMultiGradient(allGradients());
  }

  init() {
    this.time = 0;
    this.noise = new tumult[this.config.noise]();
  }

  drawFrame(draw) {
    this.timedMultiGradient.currentTime = this.timeInMs / 1000;
    this.time += this.config.speed;

    const gradient = this.config.colorMap
      ? loadGradient(this.config.colorMap)
      : this.timedMultiGradient;

    const noise = this.noise;
    const { x, y } = this.geometry;
    const t = this.time / 1000;

    var colors = new Array(this.numberOfLeds);
    for (let i = 0; i < colors.length; i++) {
      const v = rescale(
        this.config.colorScale * noise.gen(x[i] / 32 + t, y[i] / 32 + t)
      );
      const brightness = rescale(
        this.config.brightnessScale *
          noise.gen(x[i] / 32 + t + 100, y[i] / 32 + t)
      );
      colors[i] = gradient.colorAt(v).map(x => Math.floor(x * brightness));
    }
    draw(colors);
  }

  updateConfig(config) {
    super.updateConfig(config);
    this.noise = new tumult[this.config.noise]();
  }

  static configSchema() {
    let config = super.configSchema();
    config.speed = { type: Number, min: 1, max: 30, default: 5, step: 0.01 };
    config.colorScale = {
      type: Number,
      min: 0.01,
      max: 30,
      default: 5,
      step: 0.01
    };
    config.brightnessScale = {
      type: Number,
      min: 0,
      max: 30,
      default: 5,
      step: 0.01
    };
    config.noise = {
      type: String,
      values: ["Simplex2", "Perlin2"],
      default: "Simplex2"
    };
    config.colorMap = { type: "gradient", default: "" };
    return config;
  }
};
