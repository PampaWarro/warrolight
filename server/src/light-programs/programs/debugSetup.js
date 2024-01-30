const LightProgram = require("./../base-programs/LightProgram");
const ColorUtils = require("./../utils/ColorUtils");

const colors = [
  [[255,0,0],false], // 1) red
  [[255,255,0],true], // 4) yellow
  [[0,255,0],false], // 2) green
  [[0,0,255],true], // 3) blue

  [[230,65,0],true], // orange
  [[70,100,0],false], // yelowish

  [[20,150,30],true], // cyan
  [[0,50,100],false], // turqouise

  [[200,0,50],false], // redish
  [[60,0,200],true], // purple
];

module.exports = class DebugSetup extends LightProgram {
  // Override base class
  drawFrame(leds) {
    leds.forEach((v, i) => {
      let s = 1
      let scale = 300;

      let strip = Math.floor(i / scale);
      let stripOffset = i % scale;

      let [stripColor, dashed] = colors[strip % colors.length];

      if (dashed && Math.floor(stripOffset/(15 - stripOffset/300*10)) % 2 === 1) {
        leds[i] = [5, 5, 5, 255];
      } else {
        leds[i] = ColorUtils.mix(stripColor, [0,0,0,0], 1 - Math.min(1, this.config.brillo) * (300 - stripOffset) / 300);
      }
    });
  }

  // Override and extend config Schema
  static configSchema() {
    let res = super.configSchema();
    res.brillo = { type: Number, min: 0, max: 1, step: 0.01, default: 0.5 };
    return res;
  }
};
