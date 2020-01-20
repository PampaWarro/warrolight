const _ = require("lodash");

const LightProgram = require("./../base-programs/LightProgram");
const ColorUtils = require("./../utils/ColorUtils");
const {loadGradient} = require("../utils/gradients");

module.exports = class Radial extends LightProgram {
  drawFrame(draw) {
    const colors = new Array(this.numberOfLeds);
    const elapsed = this.timeInMs / 1000;

    this.extraTime = (this.extraTime || 0) + Math.random() * 10;

    for (let i = 0; i < this.numberOfLeds; i++) {
      let geometry = this.geometry;

      const dx = geometry.x[i] - geometry.width / 2 - this.config.centerX;
      const dy = geometry.y[i] - geometry.height + this.config.centerY + 18; // 18 is the offset

      const distance =
        (Math.sqrt(dx * dx + dy * dy) * 255) / (300 * this.config.escala);

      const v = Math.pow(
        Math.max(0, Math.sin(distance + elapsed * this.config.velocidad)),
        this.config.power
      );


      if (this.config.colorMap) {
        const gradient = loadGradient(this.config.colorMap);
        const [r, g, b, a] = gradient.colorAt(1 - v);
        colors[i] = [r, g, b];
      } else {
        colors[i] = ColorUtils.HSVtoRGB(
          (distance / 5 + this.extraTime / 1000) % 1,
          1,
          v
        );
      }
    }
    draw(colors);
  }

  // Override and extend config Schema
  static configSchema() {
    let res = super.configSchema();
    res.escala = { type: Number, min: 0.1, max: 100, step: 0.1, default: 5 };
    res.velocidad = { type: Number, min: -50, max: 50, step: 0.1, default: -5 };
    res.centerY = { type: Number, min: -20, max: 40, step: 0.1, default: 0 };
    res.centerX = { type: Number, min: -50, max: 50, step: 0.1, default: 0 };
    res.power = { type: Number, min: 0, max: 10, step: 0.1, default: 1 };
    res.colorMap = { type: "gradient", default: "" };

    return res;
  }
};
