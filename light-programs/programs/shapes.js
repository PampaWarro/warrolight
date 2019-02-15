const LayerBasedFunction = require("../base-programs/LayerBasedFunction");
const {
  XYHue,
  Line,
  Circle,
  InfiniteCircles,
  RandomPixels,
  PolarColors,
} = require('../utils/drawables');

module.exports = class Func extends LayerBasedFunction {
  getDrawables() {
    return {
      backgroundColors: new PolarColors({
        center: [this.xBounds.center, this.yBounds.max],
        value: .7,
      }),
      bassLine: new Line({
        center: [this.xBounds.center, this.yBounds.center],
      }),
      rotor: new Line({
        center: [this.xBounds.center, this.yBounds.max],
        width: 1,
      }),
      bassCircle: new Circle({
        center: [this.xBounds.center, this.yBounds.max],
        width: 5,
      }),
      rainDots: new InfiniteCircles({
        center: [this.xBounds.center, this.yBounds.min],
        width: .5,
        period: 20,
        radiusWarp: radius => .01 * Math.pow(radius, 2),
      }),
      highPixels: new RandomPixels({randomAlpha: true}),
      fillCircle: new Circle({
        center: [this.xBounds.center, this.yBounds.center],
        fillColor: [0, 0, 0, 0],
        width: 100,
      }),
    }
  }

  getLayers(drawables) {
    return {
      layers: [
        {
          layers: [
            {
              drawable: drawables.backgroundColors,
            },
            {
              layers: [
                {
                  name: 'bassLine',
                  drawable: drawables.bassLine,
                  blendMode: 'add',
                },
                {
                  name: 'bassCircle',
                  drawable: drawables.bassCircle,
                  blendMode: 'add',
                },
              ],
              blendMode: 'multiply',
              alpha: 0.99,
            },
          ],
        },
        {
          name: 'highPixels',
          drawable: drawables.highPixels,
          blendMode: 'normal',
        },
        {
          name: 'rotor',
          drawable: drawables.rotor,
          blendMode: 'normal',
        },
        {
          name: 'rainDots',
          drawable: drawables.rainDots,
          blendMode: 'normal',
          alpha: 0.3,
        },
        {
          name: 'fillCircle',
          drawable: drawables.fillCircle,
          blendMode: 'normal',
          alpha: 0.1,
        },
      ],
    };
  }

  updateState() {
    // Audio independent stuff.
    this.layers.bassCircle.enabled = this.config.bassCircle;
    this.layers.bassLine.enabled = this.config.bassLine;
    this.layers.fillCircle.enabled = this.config.fillCircle;
    this.layers.highPixels.alpha = this.config.highLayerAlpha;
    this.layers.rotor.alpha = this.config.rotorAlpha;
    this.layers.rainDots.alpha = this.config.rainDotsAlpha;
    this.drawables.bassLine.center[1] = this.yBounds.center + Math.cos(
      Math.PI * this.timeInMs / 5000) * this.yBounds.scale  / 2;
    this.drawables.rotor.angle = Math.cos(Math.PI * this.timeInMs/5000) * ((Math.PI * this.timeInMs / 500) % Math.PI);
    this.drawables.rainDots.offset = -this.timeInMs/50;
    this.drawables.rainDots.center[0] = this.xBounds.center + Math.cos(
      Math.PI * this.timeInMs / 7000) * this.xBounds.scale / 3;
    this.drawables.fillCircle.radius = 300 * (3000 - (this.timeInMs%3000))/3000;
    this.drawables.backgroundColors.angleOffset = Math.PI * this.timeInMs / 5000;

    // Audio dependent stuff.
    if (!this.audioReady) {
      return;
    }
    const centerChannel = this.currentAudioFrame.center;
    const audioSummary = centerChannel.summary;
    const highNoBass = audioSummary.highRmsNoBass;
    const normalizedBass = audioSummary.bassPeakDecay;
    this.drawables.bassCircle.radius = 10 + 50 * Math.pow(normalizedBass, 2);
    this.drawables.bassLine.width = 2 * normalizedBass;
    this.drawables.highPixels.threshold = 1 - .1*highNoBass;
  }

  static presets() {
    return {
      "default": {velocidad: 0.4, whiteBorder: true},
      "gold": {velocidad: 0.1, whiteBorder: false, escala: 0.5, color: 0.42}
    }
  }

  // Override and extend config Schema
  static configSchema() {
    let res = super.configSchema();
    res.bassCircle = {type: Boolean, default: true}
    res.bassLine = {type: Boolean, default: true}
    res.fillCircle = {type: Boolean, default: false}
    res.highLayerAlpha = {type: Number, default: 0, min:0, max:1, step:0.01}
    res.rotorAlpha = {type: Number, default: 0, min:0, max:1, step:0.01}
    res.rainDotsAlpha = {type: Number, default: 0, min:0, max:1, step:0.01}
    return res;
  }
}
