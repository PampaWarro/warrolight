const LightProgram = require("./../base-programs/LightProgram");
const ColorUtils = require("./../utils/ColorUtils");

module.exports = class ColorSpear extends LightProgram {

  init() {
    this.time = 0;
  }

  drawFrame(leds) {
    this.time += this.config.speed;
    const punta = this.time;

    for (let i = 0; i < this.numberOfLeds; i++) {
      leds[i] = [0, 0, 0];
    }
    const colorTime = this.config.colorTime * 1000;
    for (let i = 0; i < this.config.spearLength; i++) {
      leds[(punta + i) % this.numberOfLeds] = ColorUtils.HSVtoRGB(
        ((this.time + i * this.config.colorVariety) % colorTime) / colorTime,
        1,
        this.config.brillo
      );
    }
  }

  static presets() {
    return {
      fastMarks: { speed: 3, sameColorLeds: 5 }
    };
  }

  // Override and extend config Schema
  static configSchema() {
    let config = super.configSchema();
    config.speed = { type: Number, min: 1, max: 20, default: 4 };
    config.brillo = { type: Number, min: 0, max: 1, step: 0.01, default: 0.3 };
    config.colorTime = { type: Number, min: 0, max: 10, step: 0.1, default: 1 };
    config.spearLength = {
      type: Number,
      min: 30,
      max: 540,
      step: 1,
      default: 180
    };
    config.colorVariety = {
      type: Number,
      min: 1,
      max: 10,
      step: 1,
      default: 2
    };
    return config;
  }
};
