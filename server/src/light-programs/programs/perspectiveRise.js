const LightProgram = require("./../base-programs/LightProgram");
const ColorUtils = require("./../utils/ColorUtils");
const {loadGradient} = require("../utils/gradients");
const depthLayers = require("../utils/depthLayers");

// Pulses that climb from the floor to the top of every layer, both halves at
// the same time, with a delay between layers so that they look like they go
// through the arches (towards the public or towards the W). The music speeds
// them up and makes them brighter.
module.exports = class PerspectiveRise extends LightProgram {
  init() {
    this.layers = depthLayers(this.geometry);
    this.phase = 0;
    this.hue = Math.random();
  }

  drawFrame(leds, context) {
    const audio = (context.audio && context.audio.currentFrame) || {};
    const vol = Math.min(1, (audio[this.config.soundMetric] || 0) * this.config.multiplier);

    this.phase += (this.config.speed + vol * this.config.musicSpeed) / 60;
    this.hue = (this.hue + this.config.hueSpeed / 1000) % 1;

    const gradient = loadGradient(this.config.colorMap);
    const lastLayer = Math.max(this.layers.count - 1, 1);

    for (let i = 0; i < this.numberOfLeds; i++) {
      const l = this.layers.layerOf[i];
      const order = this.config.towardsPublic ? l : lastLayer - l;
      const rise = this.layers.rise[i];

      let p = (rise * this.config.pulses - this.phase + order * this.config.layerDelay) % 1;
      if (p < 0) p += 1;
      // Sharp head (at the top of the pulse) and a tail towards the floor.
      const shape = Math.pow(p, this.config.tail);
      const v = shape * (this.config.minBrightness + (1 - this.config.minBrightness) * vol);

      if (gradient) {
        const [r, g, b] = gradient.colorAt(1 - shape) || [0, 0, 0];
        leds[i] = [r * v, g * v, b * v];
      } else {
        const hue = (this.hue + order * this.config.layerHueOffset + p * 0.1) % 1;
        leds[i] = ColorUtils.HSVtoRGB(hue, this.config.saturation, v);
      }
    }
  }

  static presets() {
    return {
      default: {},
      haciaLaW: {towardsPublic: false},
      muchosPulsos: {pulses: 3, tail: 6, speed: 0.6, musicSpeed: 3},
      lentoSinMusica: {speed: 0.25, musicSpeed: 0, minBrightness: 1, tail: 2, saturation: 0.7},
      cascada: {layerDelay: 0.33, pulses: 1, tail: 8, speed: 0.8},
    };
  }

  static configSchema() {
    let res = super.configSchema();
    res.soundMetric = {type: 'soundMetric', default: "bassPeakDecay"};
    res.multiplier = {type: Number, min: 0, max: 3, step: 0.01, default: 1};
    // Pulses per second without music.
    res.speed = {type: Number, min: 0, max: 5, step: 0.01, default: 0.4};
    res.musicSpeed = {type: Number, min: 0, max: 10, step: 0.01, default: 2};
    res.pulses = {type: Number, min: 0.25, max: 8, step: 0.25, default: 1.5};
    res.tail = {type: Number, min: 1, max: 20, step: 0.1, default: 4};
    // Fraction of a pulse between consecutive layers.
    res.layerDelay = {type: Number, min: -1, max: 1, step: 0.01, default: 0.2};
    res.towardsPublic = {type: Boolean, default: true};
    res.minBrightness = {type: Number, min: 0, max: 1, step: 0.01, default: 0.3};
    res.layerHueOffset = {type: Number, min: 0, max: 1, step: 0.01, default: 0.08};
    res.hueSpeed = {type: Number, min: 0, max: 10, step: 0.01, default: 0.3};
    res.saturation = {type: Number, min: 0, max: 1, step: 0.01, default: 1};
    res.colorMap = {type: "gradient", default: ""};
    return res;
  }
};
