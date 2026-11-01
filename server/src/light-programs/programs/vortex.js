const LightProgram = require("./../base-programs/LightProgram");
const ColorUtils = require("./../utils/ColorUtils");
const {loadGradient} = require("../utils/gradients");

// A spiral tunnel: stripes rotate around the axis that goes through the center
// of the arches (from the W to the public), twisting with the depth. The angle
// is mirrored on the vertical axis, so both halves of each arch (and of the W)
// are always symmetric.
module.exports = class Vortex extends LightProgram {
  init() {
    this.phase = 0;
    this.hue = Math.random();
  }

  drawFrame(leds, context) {
    const audio = (context.audio && context.audio.currentFrame) || {};
    const vol = Math.min(1, (audio[this.config.soundMetric] || 0) * this.config.multiplier);

    this.phase += (this.config.speed + vol * this.config.musicSpeed) / 60;
    this.hue = (this.hue + this.config.hueSpeed / 1000) % 1;

    const gradient = loadGradient(this.config.colorMap);
    const geometry = this.geometry;
    const centerX = geometry.width / 2;
    // The axis is on the floor (y grows downwards).
    const floorY = geometry.height;
    const depth = Math.max(geometry.depth, 1);

    for (let i = 0; i < this.numberOfLeds; i++) {
      const dx = geometry.x[i] - centerX;
      const dy = floorY - geometry.y[i];
      // 0 at the top, 1 at the floor, the same on both sides.
      const angle = Math.abs(Math.atan2(dx, dy)) / (Math.PI / 2);
      const z = geometry.z[i] / depth;

      const stripe = (angle * this.config.arms + z * this.config.twist - this.phase) % 1;
      const p = stripe < 0 ? stripe + 1 : stripe;
      const shape = Math.pow(Math.sin(Math.PI * p), this.config.sharpness);
      const v = shape * (this.config.minBrightness + (1 - this.config.minBrightness) * vol);

      if (gradient) {
        const [r, g, b] = gradient.colorAt(p) || [0, 0, 0];
        leds[i] = [r * v, g * v, b * v];
      } else {
        const hue = (this.hue + angle * this.config.hueSpread + z * 0.15) % 1;
        leds[i] = ColorUtils.HSVtoRGB(hue, this.config.saturation, v);
      }
    }
  }

  static presets() {
    return {
      default: {},
      hipnotico: {arms: 1, twist: 2, speed: 0.15, musicSpeed: 0.5, sharpness: 2, minBrightness: 1},
      rapido: {arms: 3, twist: 0.5, speed: 0.6, musicSpeed: 3, sharpness: 8},
      alReves: {speed: -0.3, musicSpeed: -1.5},
    };
  }

  static configSchema() {
    let res = super.configSchema();
    res.soundMetric = {type: 'soundMetric', default: "bassPeakDecay"};
    res.multiplier = {type: Number, min: 0, max: 3, step: 0.01, default: 1};
    res.speed = {type: Number, min: -5, max: 5, step: 0.01, default: 0.3};
    res.musicSpeed = {type: Number, min: -10, max: 10, step: 0.01, default: 1.5};
    res.arms = {type: Number, min: 0.5, max: 8, step: 0.5, default: 2};
    // Turns of the spiral from the back to the front.
    res.twist = {type: Number, min: -4, max: 4, step: 0.05, default: 1};
    res.sharpness = {type: Number, min: 1, max: 20, step: 0.1, default: 4};
    res.minBrightness = {type: Number, min: 0, max: 1, step: 0.01, default: 0.35};
    res.hueSpread = {type: Number, min: 0, max: 1, step: 0.01, default: 0.2};
    res.hueSpeed = {type: Number, min: 0, max: 10, step: 0.01, default: 0.5};
    res.saturation = {type: Number, min: 0, max: 1, step: 0.01, default: 1};
    res.colorMap = {type: "gradient", default: ""};
    return res;
  }
};
