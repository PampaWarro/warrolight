const LayerBasedFunction = require("../base-programs/LayerBasedFunction");
const {
  Line,
  Circle,
  InfiniteCircles,
  RandomPixels,
  PolarColors,
  RadiusCosineBrightness,
} = require('../utils/drawables');

module.exports = class Func extends LayerBasedFunction {
  getDrawables() {
    return {
      backgroundColors: new PolarColors({
        center: [this.xBounds.center, this.yBounds.max],
        value: .7,
      }),
      backgroundMask: new RadiusCosineBrightness({
        center: [this.xBounds.center, this.yBounds.max],
        saturation: 0,
        scale: 1,
      }),
      bassLine: new Line({
        center: [this.xBounds.center, this.yBounds.center],
      }),
      rotor: new Line({
        center: [this.xBounds.center, this.yBounds.max],
        width: 2,
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
        width: 80,
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
              name: 'backgroundMask',
              drawable: drawables.backgroundMask,
              blendMode: 'multiply',
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
              alpha: 1,
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
    this.drawables.bassLine.angle = -Math.PI * this.timeInMs/7000;
    this.drawables.rotor.angle = Math.cos(Math.PI * this.timeInMs/5000) * ((Math.PI * this.timeInMs / 500) % Math.PI);
    this.drawables.rainDots.offset = -this.timeInMs/50;
    this.drawables.rainDots.center[0] = this.xBounds.center + Math.cos(
      Math.PI * this.timeInMs / 7000) * this.xBounds.scale / 3;
    this.drawables.fillCircle.radius = 300 * (3000 - (this.timeInMs%5000))/5000;
    this.drawables.backgroundColors.angleOffset = Math.PI * this.timeInMs / 5000;
    this.drawables.backgroundMask.radiusOffset = Math.round(this.timeInMs / 1000);
    this.drawables.backgroundMask.center = [
      this.xBounds.center + .35 * this.xBounds.scale * Math.cos(
        Math.PI * this.timeInMs / 7000
      ),
      this.yBounds.center + .35 * this.yBounds.scale * Math.cos(
        Math.PI * this.timeInMs / 8000
      ),
    ];
    this.drawables.backgroundMask.scale = 
      1 + .2 * Math.cos(Math.PI * this.timeInMs / 10000);


    // Audio dependent stuff.
    if (!this.audioReady) {
      return;
    }
    const centerChannel = this.currentAudioFrame.center;
    const audioSummary = centerChannel.summary;
    const highNoBass = audioSummary.highRmsNoBass;
    const normalizedBass = audioSummary.bassPeakDecay;
    this.drawables.bassCircle.radius =
      10 + this.config.bassCircleSensitivity * Math.pow(normalizedBass, 2);
    this.drawables.bassLine.width =
      this.config.bassLineSensitivity * normalizedBass;
    this.drawables.highPixels.threshold = 1 - .1*highNoBass;
  }

  static presets() {
    return {
      "default": {
        bassCircle: true,
        bassCircleSensitivity: 50,
        bassLine: false,
        bassLineSensitivity: 0,
        fillCircle: false,
        highLayerAlpha: .2,
        rotorAlpha: 0,
        rainDotsAlpha: 0,
      },
      "bassLine": {
        bassCircle: false,
        bassCircleSensitivity: 50,
        bassLine: true,
        bassLineSensitivity: 50,
        fillCircle: false,
        highLayerAlpha: .2,
        rotorAlpha: 0,
        rainDotsAlpha: 0,
      },
      "rotor": {
        bassCircle: true,
        bassCircleSensitivity: 42,
        bassLine: false,
        bassLineSensitivity: 0,
        fillCircle: false,
        highLayerAlpha: .1,
        rotorAlpha: .5,
        rainDotsAlpha: 0,
      },
      "rain": {
        bassCircle: true,
        bassCircleSensitivity: 42,
        bassLine: false,
        bassLineSensitivity: 0,
        fillCircle: false,
        highLayerAlpha: .1,
        rotorAlpha: 0,
        rainDotsAlpha: .3,
      },
      "todo": {
        bassCircle: true,
        bassCircleSensitivity: 50,
        bassLine: true,
        bassLineSensitivity: 15,
        fillCircle: true,
        highLayerAlpha: .25,
        rotorAlpha: .17,
        rainDotsAlpha: .3,
      },
      "randomPlusFill": {
        bassCircle: false,
        bassCircleSensitivity: 50,
        bassLine: false,
        bassLineSensitivity: 15,
        fillCircle: true,
        highLayerAlpha: .5,
        rotorAlpha: 0,
        rainDotsAlpha: 0,
      },
    }
  }

  // Override and extend config Schema
  static configSchema() {
    let res = super.configSchema();
    res.bassCircle = {type: Boolean, default: true}
    res.bassCircleSensitivity = {
      type: Number, default: 50, min:0, max:100, step:.1}
    res.bassLine = {type: Boolean, default: false}
    res.bassLineSensitivity = {type: Number, default: 0, min:0, max:50, step:.1}
    res.fillCircle = {type: Boolean, default: false}
    res.highLayerAlpha = {type: Number, default: .2, min:0, max:1, step:0.01}
    res.rotorAlpha = {type: Number, default: 0, min:0, max:1, step:0.01}
    res.rainDotsAlpha = {type: Number, default: 0, min:0, max:1, step:0.01}
    return res;
  }
}
