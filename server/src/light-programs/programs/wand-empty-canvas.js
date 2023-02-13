const LightProgram = require("./../base-programs/LightProgram");
const ColorUtils = require("../utils/ColorUtils");

module.exports = class WandEmptyCanvas extends LightProgram {

  init() {
    this.ledsToPaint = new Array(this.numberOfLeds).fill([0, 0, 0]);
    this.time = 0;
    super.init();
  }

  tap(data){
    if (data.clear){
      this.ledsToPaint = new Array(this.numberOfLeds).fill([0, 0, 0]);
      return;
    }
    if (data.move){
      this.config.move = true;
    }
    this.ledsToPaint[data.position] = data.color;
  }
  // Override base class
  drawFrame(leds, context) {
    this.time++;
    // En HSV blanco es (0,0,1)

    for (let i = 0; i < leds.length; i++) {
      leds[i] = [0, 0, 0];
    }

    this.ledsToPaint.forEach(([r, g, b], j) => {
      leds[j] = [r, g, b];
    });

    if (this.config.move && (Math.floor((this.time*2)*this.config.moveSpeed) % 2 == 0)) {
      let first = this.ledsToPaint.shift();
      this.ledsToPaint.push(first);
    }

  }

  // Override and extend config Schema
  static configSchema() {
    let res = super.configSchema();
    res.brillo = { type: Number, min: 0, max: 1, step: 0.01, default: 1 };
    res.move = { type: Boolean, default: false };
    res.moveSpeed = { type: Number, min: 0, step: 0.01, max: 1, default: 0.2 };
    return res;
  }
};
