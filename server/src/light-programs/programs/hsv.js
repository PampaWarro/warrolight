const LightProgram = require("./../base-programs/LightProgram");
const ColorUtils = require("./../utils/ColorUtils");

// Flat color set using HSV.
module.exports = class HSV extends LightProgram {
  drawFrame(leds, context) {
    let color = ColorUtils.HSVtoRGB(this.config.h, this.config.s, this.config.v);
    for (let i = 0; i < leds.length; i++) {
      leds[i] = color.slice();
    }
  }

  static configSchema() {
    let res = super.configSchema();
    res.h = { type: Number, min: 0, max: 1, step: 0.01, default: 0 };
    res.s = { type: Number, min: 0, max: 1, step: 0.01, default: 0 };
    res.v = { type: Number, min: 0, max: 1, step: 0.01, default: 1 };
    return res;
  }

  static presets() {
    return {
      white: {
        h: 0,
        s: 0,
        v: 1,
      },
      red: {
        h: 0,
        s: 1,
        v: 1,
      },
      green: {
        h: 1 / 3,
        s: 1,
        v: 1,
      },
      blue: {
        h: 2 / 3,
        s: 1,
        v: 1,
      },
    };
  }
};
