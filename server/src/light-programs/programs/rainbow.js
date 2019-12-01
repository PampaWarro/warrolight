const TimeTickedFunction = require("./../base-programs/TimeTickedFunction");
const ColorUtils = require("./../utils/ColorUtils");

module.exports = class Rainbow extends TimeTickedFunction {
  constructor(config, leds) {
    super(config, leds);

    this.colorSet = [
      "#ff0000",
      "#ff7700",
      "#ffff00",
      "#00ff00",
      "#0099ff",
      "#0000ff",
      "#5500CC",
      "#ffffff"
    ];

    this.time = 0;
  }

  drawFrame(draw) {
    this.time += this.config.speed;
    const newColors = new Array(this.numberOfLeds);

    for (let i = 0; i < this.numberOfLeds; i++) {
      let colIndex =
        Math.floor((this.time + i) / this.config.sameColorLeds) %
        this.colorSet.length;

      let col = ColorUtils.hexToRgb(this.colorSet[colIndex]);
      if (colIndex === 6) newColors[i] = col;
      else newColors[i] = ColorUtils.dim(col, this.config.brillo);
    }
    draw(newColors);
  }

  static presets() {
    return {
      slowMarks: { speed: 3, sameColorLeds: 5, brillo: 0 },
      fastMarks: { speed: 4, sameColorLeds: 20, brillo: 0.3 },
      purpleDots: { speed: 2, sameColorLeds: 7, brillo: 0 }
    };
  }

  // Override and extend config Schema
  static configSchema() {
    let config = super.configSchema();
    config.speed = { type: Number, min: 0, max: 20, default: 1 };
    config.sameColorLeds = { type: Number, min: 1, max: 100, default: 13 };
    config.brillo = { type: Number, min: 0, max: 1, step: 0.01, default: 0.3 };
    return config;
  }
};
