const TimeTickedFunction = require("./../base-programs/TimeTickedFunction");
const ColorUtils = require("./../utils/ColorUtils");
const _ = require("lodash");

module.exports = class Lineal extends TimeTickedFunction {
  drawFrame(draw, done) {
    const colors = new Array(this.numberOfLeds);
    const elapsed = this.timeInMs / 1000;

    this.extraTime = (this.extraTime || 0) + Math.random() * 10;

    for (let i = 0; i < this.numberOfLeds; i++) {
      let geometry = this.position || this.geometry;

      let d = geometry.y[i] - geometry.height + this.config.centerY;
      if (this.config.horizontal) {
        d = geometry.x[i] - geometry.width / 2 - this.config.centerX;
      }

      const distance = (Math.abs(d) * 255) / (300 * this.config.escala);

      const v = Math.max(
        0,
        Math.sin(distance + elapsed * this.config.velocidad)
      );
      colors[i] = ColorUtils.HSVtoRGB(
        (distance / 50 + this.extraTime / 1000) % 1,
        1,
        Math.pow(v, this.config.power)
      );
    }
    draw(colors);
  }

  static presets() {
    return {
      large: { velocidad: 7, escala: 13 },
      largeUp: { velocidad: -7, escala: 13 },
      smallSlow: { velocidad: -7, escala: 2 },
      smallFast: { velocidad: 14, escala: 2 },
      horizontal: { velocidad: -10, escala: 18, horizontal: true },
      horizontal2: { velocidad: -16, escala: 8, horizontal: true }
    };
  }

  // Override and extend config Schema
  static configSchema() {
    let res = super.configSchema();
    res.escala = { type: Number, min: 0.1, max: 100, step: 0.1, default: 2.5 };
    res.velocidad = {
      type: Number,
      min: -50,
      max: 50,
      step: 0.1,
      default: -15
    };
    res.centerY = { type: Number, min: -20, max: 40, step: 0.1, default: 0 };
    res.centerX = { type: Number, min: -80, max: 80, step: 0.1, default: -80 };
    res.power = { type: Number, min: 0, max: 30, step: 0.1, default: 10 };
    res.horizontal = { type: Boolean, default: false };
    return res;
  }
};
