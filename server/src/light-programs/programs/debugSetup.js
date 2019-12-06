const LightProgram = require("./../base-programs/LightProgram");
const ColorUtils = require("./../utils/ColorUtils");

module.exports = class DebugSetup extends LightProgram {
  // Override base class
  drawFrame(draw) {
    let colors = [...Array(this.numberOfLeds)]; // Array del tamaño de las luces

    draw(
      colors.map((v, i) => {
        let s = 1;
        return ColorUtils.HSVtoRGB(
          (Math.floor(i / 150) / 4) * s,
          0.9 * s,
          Math.max(1 - s, this.config.brillo)
        );
      })
    );
  }

  // Override and extend config Schema
  static configSchema() {
    let res = super.configSchema();
    res.brillo = { type: Number, min: 0, max: 1, step: 0.01, default: 0.5 };
    return res;
  }
};
