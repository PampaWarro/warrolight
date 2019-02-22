const LayerBasedFunction = require("../base-programs/LayerBasedFunction");
const {
  InfiniteCircles,
  PolarColors,
} = require('../utils/drawables');

module.exports = class Func extends LayerBasedFunction {
  getDrawables() {
    return {
      backgroundColors: new PolarColors({
        center: [this.xBounds.center, this.yBounds.center],
        value: .7,
      }),
      infiniteCircles: new InfiniteCircles({
        center: [this.xBounds.center, this.yBounds.min],
        width: 3,
        period: 20,
        radiusWarp: radius => .01 * Math.pow(radius, 2),
      }),
    }
  }

  getLayers(drawables) {
    return {
      layers: [
        {
          drawable: drawables.backgroundColors,
        },
        {
          name: 'infiniteCircles',
          drawable: drawables.infiniteCircles,
          blendMode: 'multiply',
        },
      ],
    };
  }

  updateState() {
    // Audio independent stuff.
    this.drawables.backgroundColors.center = [
      this.xBounds.center + Math.cos(
      Math.PI * this.timeInMs / 7000) * this.xBounds.scale / 3,
      this.yBounds.center + Math.cos(
      Math.PI * this.timeInMs / 10000) * this.yBounds.scale / 3,
    ];
    this.drawables.backgroundColors.angleOffset = Math.PI * this.timeInMs / 5000;
    this.drawables.infiniteCircles.offset = -this.timeInMs/50;
    this.drawables.infiniteCircles.center[0] = this.xBounds.center + Math.cos(
      Math.PI * this.timeInMs / 7000) * this.xBounds.scale / 3;


    // Audio dependent stuff.
    if (!this.audioReady) {
      return;
    }
    const centerChannel = this.currentAudioFrame.center;
    const audioSummary = centerChannel.summary;
    const highNoBass = audioSummary.highRmsNoBass;
    const normalizedBass = audioSummary.bassPeakDecay;
    this.drawables.infiniteCircles.width = .5 + 8 * Math.pow(normalizedBass, 2);
  }

  static presets() {
    return {
    }
  }

  // Override and extend config Schema
  static configSchema() {
    let res = super.configSchema();
    return res;
  }
}
