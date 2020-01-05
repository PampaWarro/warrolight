const LayerBasedProgram = require("../base-programs/LayerBasedProgram");
const { Grid } = require("../utils/drawables");

module.exports = class Bombs extends LayerBasedProgram {

  init() {
    this.warpK = 1;
    this.bassWarpCenter = [this.xBounds.center, this.yBounds.center];
  }

  getDrawables() {
    return {
      grid: new Grid({ xyWarp: this.bassXYWarp.bind(this) })
    };
  }
  getLayers(drawables) {
    return {
      layers: [
        {
          name: "grid",
          drawable: drawables.grid,
          blendMode: "normal"
        }
      ]
    };
  }
  bassXYWarp(x, y) {
    const [dx, dy] = [x - this.bassWarpCenter[0], y - this.bassWarpCenter[1]];
    const d = Math.sqrt(dx * dx + dy * dy);

    const warp = this.warpK / (Math.pow(d, this.warpPow) || 1);
    return [x + warp * dx, y + warp * dy];
  }

  updateState(audio) {
    // Audio independent stuff.
    this.bassWarpCenter = [
      this.xBounds.center +
        0.35 * this.xBounds.scale * Math.cos((Math.PI * this.timeInMs) / 7000),
      this.yBounds.center +
        0.35 * this.yBounds.scale * Math.cos((Math.PI * this.timeInMs) / 8000)
    ];
    this.drawables.grid.width =
      2 + 1.9 * Math.cos((Math.PI * this.timeInMs) / 7000);
    const period = 30 + 20 * Math.cos((Math.PI * this.timeInMs) / 11000);
    this.drawables.grid.xyOffset = [
      period * Math.cos((Math.PI * this.timeInMs) / 9000),
      period * Math.cos((Math.PI * this.timeInMs) / 6000)
    ];
    this.drawables.grid.xyPeriod = [period, period];
    // Audio dependent stuff.
    if (!audio.ready) {
      return;
    }
    const bass = audio.currentFrame.bassRms;
    this.warpK = bass * 100 * Math.cos((Math.PI * this.timeInMs) / 10000);
    this.warpPow = 1.5 + 0.5 * Math.cos((Math.PI * this.timeInMs) / 4000);
    this.layers.grid.alpha = 0.3 + 0.7 * bass * bass;
  }

  static presets() {
    return {
      default: {}
    };
  }
};
