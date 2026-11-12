const LightProgram = require("./../base-programs/LightProgram");
const ColorUtils = require("./../utils/ColorUtils");
const {loadGradient} = require("../utils/gradients");
const depthLayers = require("../utils/depthLayers");

// Each beat sends a wave of light through the depth of the geometry: from the
// W to the arch in front (towards the public) or the other way around. The
// louder the beat, the higher the wave reaches from the floor.
module.exports = class DepthWaves extends LightProgram {
  init() {
    this.layers = depthLayers(this.geometry);
    this.waves = [];
    this.hue = Math.random();
    this.lastTime = null;
    this.needsBeat = true;
  }

  addWave(vol) {
    const depth = Math.max(this.geometry.depth, 1);
    const width = this.config.waveWidth * depth;
    this.waves.push({
      z: this.config.towardsPublic ? -width : depth + width,
      energy: Math.min(1, vol),
      hue: this.hue,
    });
    this.hue = (this.hue + this.config.hueStep) % 1;
  }

  drawFrame(leds, context) {
    const audio = (context.audio && context.audio.currentFrame) || {};
    const dt = this.lastTime === null ? 0 : (this.timeInMs - this.lastTime) / 1000;
    this.lastTime = this.timeInMs;

    const vol = (audio[this.config.soundMetric] || 0) * this.config.multiplier;
    if (vol < this.config.cutThreshold) {
      this.needsBeat = true;
    } else if (this.needsBeat) {
      this.needsBeat = false;
      this.addWave(vol);
    }

    const depth = Math.max(this.geometry.depth, 1);
    const width = this.config.waveWidth * depth;
    const direction = this.config.towardsPublic ? 1 : -1;
    for (const wave of this.waves) {
      wave.z += direction * this.config.speed * depth * dt;
    }
    this.waves = this.waves.filter(w => w.z > -2 * width && w.z < depth + 2 * width);

    const gradient = loadGradient(this.config.colorMap);

    for (let i = 0; i < this.numberOfLeds; i++) {
      const z = this.geometry.z[i];
      const rise = this.layers.rise[i];
      let r = 0, g = 0, b = 0;

      for (const wave of this.waves) {
        const d = (z - wave.z) / width;
        let e = Math.exp(-d * d) * wave.energy;
        if (this.config.fillFromFloor) {
          // Soft edge on top of the lit part.
          e *= Math.min(1, Math.max(0, (wave.energy - rise) * 8 + 1));
        }
        if (e < 0.005) continue;

        const [wr, wg, wb] = gradient
          ? gradient.colorAt(1 - e) || [0, 0, 0]
          : ColorUtils.HSVtoRGB(wave.hue, this.config.saturation, 1);
        r += wr * e;
        g += wg * e;
        b += wb * e;
      }

      leds[i] = [Math.min(255, r), Math.min(255, g), Math.min(255, b)];
    }
  }

  static presets() {
    return {
      haciaElPublico: {towardsPublic: true},
      haciaLaW: {towardsPublic: false},
      rapidasFinas: {speed: 2.5, waveWidth: 0.08, soundMetric: "bassFastPeakDecay", hueStep: 0.05},
      lentasDesdeElPiso: {speed: 0.6, waveWidth: 0.25, fillFromFloor: true, soundMetric: "bassPeakDecay"},
      agudos: {soundMetric: "highFastPeakDecay", speed: 2, waveWidth: 0.1, saturation: 0.3, cutThreshold: 0.5},
    };
  }

  static configSchema() {
    let res = super.configSchema();
    res.soundMetric = {type: 'soundMetric', default: "bassFastPeakDecay"};
    res.multiplier = {type: Number, min: 0, max: 3, step: 0.01, default: 1};
    res.cutThreshold = {type: Number, min: 0, max: 1, step: 0.01, default: 0.4};
    // Depth per second, as a fraction of the total depth.
    res.speed = {type: Number, min: 0.05, max: 5, step: 0.01, default: 1.2};
    res.waveWidth = {type: Number, min: 0.02, max: 1, step: 0.01, default: 0.15};
    res.towardsPublic = {type: Boolean, default: true};
    res.fillFromFloor = {type: Boolean, default: false};
    res.hueStep = {type: Number, min: 0, max: 1, step: 0.01, default: 0.13};
    res.saturation = {type: Number, min: 0, max: 1, step: 0.01, default: 1};
    res.colorMap = {type: "gradient", default: ""};
    return res;
  }
};
