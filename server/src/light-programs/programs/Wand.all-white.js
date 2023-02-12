const LightProgram = require("./../base-programs/LightProgram");
const ColorUtils = require("./../utils/ColorUtils");

module.exports = class AllWhite extends LightProgram {

  init() {
    this.ledsToPaint = [];
    this.currentColor = [0, 0, 0];
    super.init();
  }

  tap(data){
    if (data.clear){
      this.ledsToPaint = [];
      this.currentColor = [0,0,0]
      return;
    }
    this.ledsToPaint.push(data.position);
  }
  // Override base class
  drawFrame(leds, context) {
    // En HSV blanco es (0,0,1)

    let tonoDeBlanco = ColorUtils.HSVtoRGB(0, 0, this.config.brillo);
    for (let i = 0; i < leds.length; i++) {
      leds[i] = tonoDeBlanco.slice();
    }
    for (let j = 0; j < this.ledsToPaint.length ; j++){
      leds[this.ledsToPaint[j]] = this.currentColor;
    }
  }

  // Override and extend config Schema
  static configSchema() {
    let res = super.configSchema();
    res.brillo = { type: Number, min: 0, max: 1, step: 0.01, default: 1 };
    return res;
  }
};
