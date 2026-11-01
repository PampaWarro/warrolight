const LightProgram = require("./../base-programs/LightProgram");
const ColorUtils = require("./../utils/ColorUtils");
const depthLayers = require("../utils/depthLayers");

// Each depth layer is a frequency band: the bass in the back (the W), the
// highs in front (the arch closest to the public). Each layer fills up from
// the floor like a VU meter, symmetrically on both halves of the arches.
module.exports = class DepthBands extends LightProgram {
  init() {
    this.layers = depthLayers(this.geometry);
    this.levels = new Array(this.layers.count).fill(0);
    this.hue = Math.random();
  }

  metricFor(layer) {
    const metrics = [
      this.config.backMetric,
      this.config.middleMetric,
      this.config.frontMetric,
    ];
    if (this.layers.count === 1) return metrics[0];
    // Spread the 3 metrics across however many layers there are.
    const index = Math.round((layer * 2) / (this.layers.count - 1));
    return metrics[index];
  }

  drawFrame(leds, context) {
    const audio = (context.audio && context.audio.currentFrame) || {};
    this.hue = (this.hue + this.config.hueSpeed / 1000) % 1;

    for (let l = 0; l < this.layers.count; l++) {
      const target = Math.min(1, (audio[this.metricFor(l)] || 0) * this.config.multiplier);
      // Fast attack, slow decay.
      const decay = this.config.decay;
      this.levels[l] = Math.max(target, this.levels[l] * decay);
    }

    for (let i = 0; i < this.numberOfLeds; i++) {
      const l = this.layers.layerOf[i];
      const level = this.levels[l];
      const rise = this.layers.rise[i];

      let v = 0;
      if (rise <= level) {
        v = 0.25 + 0.75 * Math.pow(rise / Math.max(level, 0.001), 2);
      } else if (rise < level + this.config.edge) {
        v = 1 - (rise - level) / this.config.edge;
      }
      v *= Math.max(level, this.config.minBrightness);

      const hue = (this.hue + l * this.config.layerHueOffset + rise * this.config.riseHue) % 1;
      leds[i] = ColorUtils.HSVtoRGB(hue, this.config.saturation, Math.min(1, v));
    }
  }

  static presets() {
    return {
      graves_atras: {},
      graves_adelante: {backMetric: "highFastPeakDecay", frontMetric: "bassFastPeakDecay"},
      fuego: {layerHueOffset: 0.04, riseHue: 0.12, hueSpeed: 0, saturation: 1, decay: 0.85},
      blancoYColor: {saturation: 0.4, layerHueOffset: 0.5, decay: 0.95},
    };
  }

  static configSchema() {
    let res = super.configSchema();
    res.backMetric = {type: 'soundMetric', default: "bassFastPeakDecay"};
    res.middleMetric = {type: 'soundMetric', default: "midFastPeakDecay"};
    res.frontMetric = {type: 'soundMetric', default: "highFastPeakDecay"};
    res.multiplier = {type: Number, min: 0, max: 3, step: 0.01, default: 1.1};
    res.decay = {type: Number, min: 0, max: 0.99, step: 0.01, default: 0.9};
    res.edge = {type: Number, min: 0.01, max: 0.5, step: 0.01, default: 0.08};
    res.minBrightness = {type: Number, min: 0, max: 1, step: 0.01, default: 0.3};
    res.layerHueOffset = {type: Number, min: 0, max: 1, step: 0.01, default: 0.33};
    res.riseHue = {type: Number, min: 0, max: 1, step: 0.01, default: 0.05};
    res.hueSpeed = {type: Number, min: 0, max: 10, step: 0.01, default: 0.5};
    res.saturation = {type: Number, min: 0, max: 1, step: 0.01, default: 0.9};
    return res;
  }
};
