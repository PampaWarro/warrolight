const _ = require("lodash");
const ColorUtils = require("../utils/ColorUtils");

const restrictColor = ([r, g, b]) => {
  let [h, s, v] = ColorUtils.RGBtoHSV(r, g, b);

  // Clamp colors
  if (h > 0.5) {
    h = h / 30;
  } else {
    h = 1 - h / 30;
  }

  return ColorUtils.HSVtoRGB(h - 0.02, 1, Math.sqrt(v));
  // return [Math.floor((r+g+b)/3),0,0];
};

const fadeColors = ([r, g, b]) => {
  let [h, s, v] = ColorUtils.RGBtoHSV(r, g, b);

  v = v * Math.pow(1 - Math.min(h, 1 - h), 3);

  return [r, Math.ceil(g / 10), Math.ceil(b / 10)];
};

module.exports = function recolorProgram(Program) {
  return class RecolorProgram extends Program {
    start(config, draw, done) {
      let changedDraw = colors => {
        colors = colors.map(fadeColors);
        draw(colors);
      };
      super.start(config, changedDraw, done);
    }
  };
};
