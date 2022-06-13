const LightProgram = require("./../base-programs/LightProgram");
const ColorUtils = require("./../utils/ColorUtils");

module.exports = class MusicVolumeBars extends LightProgram {

  init() {
    this.volPromedio = 0;
    this.lastVolume = new Array(this.numberOfLeds + 1).fill([0, 0, 0]);
    this.time = 0;
    this.maxVolume = 0;
  }

  drawFrame(leds, context) {
    let audio = context.audio;
    audio = audio.currentFrame || {};
    this.time += this.config.speed;

    // let vol = audio.averageRelativeVolume * this.config.multiplier * 1.5;
    // this.volPromedio = (vol+2*this.volPromedio)/3
    this.volPromedio = audio[this.config.soundMetric]

    for (let i = 0; i < this.numberOfLeds; i++) {
      let newColor = [0, 0, 0];
      if (
        i < this.numberOfLeds * this.volPromedio &&
        (Math.ceil(i / 3) * 3) % Math.round(this.numberOfLeds / 10)
      ) {
        let tone = 0.35;
        if (i / this.numberOfLeds > 0.5) {
          tone = 0.25;
        }
        if (i / this.numberOfLeds > 0.7) {
          tone = 0;
        }
        newColor = ColorUtils.HSVtoRGB(
          tone,
          1,
          Math.min(1, audio[this.config.soundMetric] * audio[this.config.soundMetric])
        );
      }
      this.lastVolume[i] = newColor;
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
    res.soundMetric = {type: 'soundMetric', default: "fastPeakDecay"};
    return res;
  }
};
