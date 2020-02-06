const _ = require("lodash");

const LightProgram = require("./../base-programs/LightProgram");
const ColorUtils = require("./../utils/ColorUtils");
const {
  TimedMultiGradient,
  loadGradient,
  allGradients,
} = require("../utils/gradients");

module.exports = class Radial3D extends LightProgram {
  timedMultiGradient = new TimedMultiGradient(allGradients());
  drawFrame(draw) {
    const colors = new Array(this.numberOfLeds);
    const elapsed = this.timeInMs / 1000;

    const time = this.timeInMs / 1000;
    this.timedMultiGradient.currentTime = time;
    const gradient = this.config.colorMap ? loadGradient(this.config.colorMap)
      : this.timedMultiGradient;

    for (let i = 0; i < this.numberOfLeds; i++) {
      let geometry = this.geometry;

      const dx = geometry.x[i] - geometry.width / 2 - this.config.centerX;
      const dy = geometry.y[i] - geometry.height + this.config.centerY + 18; // 18 is the offset
      const dz = geometry.z[i] - geometry.depth / 2 - this.config.centerZ;

      const distance =
        (Math.sqrt(dx * dx + dy * dy + dz * dz) * 255) / (300 * this.config.escala);

      const v = Math.pow(
        Math.max(0, Math.sin(distance + elapsed * this.config.velocidad)),
        this.config.power
      );

      const [r, g, b, a] = gradient.colorAt(1 - v);
      colors[i] = [r*v, g*v, b*v];
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
    res.centerZ = { type: Number, min: -50, max: 50, step: 0.1, default: 0 };
    res.power = { type: Number, min: 0, max: 10, step: 0.1, default: 1 };
    res.colorMap = { type: "gradient", default: "" };

    return res;
  }
};
