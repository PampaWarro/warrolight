const ColorUtils = require("../utils/ColorUtils");

function fadeColors([r, g, b]) {
  let [h, s, v] = ColorUtils.RGBtoHSV(r, g, b);

  v = v * Math.pow(1 - Math.min(h, 1 - h), 3);

  return [r, Math.ceil(g / 10), Math.ceil(b / 10)];
}

module.exports = function recolorProgram(Program) {
  return class RecolorProgram extends Program {
    start(config, draw) {
      let changedDraw = colors => {
        colors = colors.map(fadeColors);
        draw(colors);
      };
      super.start(config, changedDraw);
    }
  };
};
