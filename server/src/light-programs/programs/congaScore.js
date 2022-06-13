const LightProgram = require("./../base-programs/LightProgram");
const ColorUtils = require("./../utils/ColorUtils");
const _ = require("lodash");
const GlobalGame = require('../conga-utils/GlobalGame');

module.exports = class CongaShooting extends LightProgram {
  drawFrame(leds, context) {
    const player = this.config.playerNumber;
    const n = this.numberOfLeds;
    let max = GlobalGame.game.max();
    let m = n - (n % max);
    let score = GlobalGame.game.score[player] / max;

    leds.forEach((v, i) => {
      if(this.config.reverse) {
        i = n-i+1;
      }
      if(i / n < score) {
        leds[i] = ColorUtils.HSVtoRGB(this.config.colorHue + player/2, this.config.colorSat, 1);
      } else {
        if(i % (m/max) === 0)
          leds[i] = [10,10,10];
        else
          leds[i] = [0,0,0];
      }
    })
  }

  static presets() {
    return {};
  }

  // Override and extend config Schema
  static configSchema() {
    let res = super.configSchema();
    res.playerNumber = { type: String, values: ['0', '1'], default: '0' };
    res.colorHue = {type: Number, min: 0, max: 1, step: 0.01, default: 0};
    res.colorSat = {type: Number, min: 0, max: 1, step: 0.01, default: 0.75};
    res.reverse = { type: Boolean, default: true };
    return res;
  }
};
