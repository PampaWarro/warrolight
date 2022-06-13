const LightProgram = require("./../base-programs/LightProgram");
const ColorUtils = require("./../utils/ColorUtils");

module.exports = class AllWhite extends LightProgram {
  // Override base class
  drawFrame(leds, context) {
    // En HSV blanco es (0,0,1)
    let tonoDeBlanco = ColorUtils.HSVtoRGB(0, 0, this.config.brillo);
    leds.fill(tonoDeBlanco);
  }

  // Override and extend config Schema
  static configSchema() {
    let res = super.configSchema();
    res.brillo = { type: Number, min: 0, max: 1, step: 0.01, default: 0.5 };
    return res;
  }
};
