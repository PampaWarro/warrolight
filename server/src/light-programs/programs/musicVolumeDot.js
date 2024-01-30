const LightProgram = require("./../base-programs/LightProgram");
const ColorUtils = require("./../utils/ColorUtils");
const _ = require("lodash");
const {loadGradient} = require("../utils/gradients");

module.exports = class MusicVolumeDot extends LightProgram {

  init() {
    this.lastVolume = new Array(this.numberOfLeds + 1).fill([0, 0, 0]);
    this.time = 0;
    this.maxVolume = 0;
    this.densityInvariantLength = _.sumBy(this.geometry.density, v => 1/v);
  }

  drawFrame(leds, context) {
    let audio = context.audio;
    audio = audio.currentFrame || {};
    this.time += this.config.speed;

    let vol = (audio[this.config.soundMetric] || 0) * this.config.multiplier;

    // Como las luces tenues son MUY fuertes igual, a partir de cierto valor "las bajamos"
    if (vol < this.config.cutThreshold) {
      vol = 0;
    } else {
      vol = (vol - this.config.cutThreshold) / (1 - this.config.cutThreshold);
    }

    let intensity = Math.min(vol * vol, 1);

    let newVal;
    if (this.config.colorMap) {
      const gradient = loadGradient(this.config.colorMap);
      newVal = gradient.colorAt(1-intensity);
    } else {
      newVal = ColorUtils.HSVtoRGB(0, 0, intensity);
    }

    let densityInvariantPos = 0;
    for (let i = 0; i < this.numberOfLeds; i++) {
      if (densityInvariantPos % Math.round(this.densityInvariantLength / this.config.numberOfOnLeds) === 0) {
        this.lastVolume[i] = newVal;
      } else {
        this.lastVolume[i] = [0, 0, 0];
      }
      densityInvariantPos += 1/this.geometry.density[i];
    }

    leds.forEach((v, i) => {
      leds[i] = this.lastVolume[i];
    });
  }

  static presets() {
    return {};
  }

  // Override and extend config Schema
  static configSchema() {
    let res = super.configSchema();
    res.multiplier = { type: Number, min: 0, max: 2, step: 0.01, default: 1 };
    res.numberOfOnLeds = {type: Number, min: 1, max: 200, step: 1, default: 40};
    res.cutThreshold = {type: Number, min: 0, max: 1, step: 0.01, default: 0.45};
    res.soundMetric = {type: 'soundMetric', default: "bassFastPeakDecay"};
    res.colorMap = { type: "gradient", default: "" };
    return res;
  }
};
