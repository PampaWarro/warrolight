const LayerBasedProgram = require("../base-programs/LayerBasedProgram");
const {
  Line,
  Circle,
  InfiniteCircles,
  RandomPixels,
  PolarColors,
  RadiusCosineBrightness
} = require("../utils/drawables");

module.exports = class Shapes extends LayerBasedProgram {
  getDrawables() {
    return {
      backgroundColors: new PolarColors({
        center: [this.xBounds.center, this.yBounds.max],
        value: 0.7
      }),
      backgroundMask: new RadiusCosineBrightness({
        center: [this.xBounds.center, this.yBounds.max],
        saturation: 0,
        scale: 1
      }),
      bassLine: new Line({
        center: [this.xBounds.center, this.yBounds.center]
      }),
      rotor: new Line({
        center: [this.xBounds.center, this.yBounds.max],
        width: 2
      }),
      bassCircle: new Circle({
        center: [this.xBounds.center, this.yBounds.max],
        width: 5
      }),
      rainDots: new InfiniteCircles({
        center: [this.xBounds.center, this.yBounds.min],
        width: 0.5,
        period: 20,
        radiusWarp: radius => 0.01 * Math.pow(radius, 2)
      }),
      highPixels: new RandomPixels({ randomAlpha: true }),
      fillCircle: new Circle({
        center: [this.xBounds.center, this.yBounds.center],
        fillColor: [0, 0, 0, 0],
        width: 80
      })
    };
  }

  getLayers(drawables) {
    return {
      layers: [
        {
          layers: [
            {
              drawable: drawables.backgroundColors
            },
            {
              name: "backgroundMask",
              drawable: drawables.backgroundMask,
              blendMode: "multiply"
            },
            {
              layers: [
                {
                  name: "bassLine",
                  drawable: drawables.bassLine,
                  blendMode: "add"
                },
                {
                  name: "bassCircle",
                  drawable: drawables.bassCircle,
                  blendMode: "add"
                }
              ],
              blendMode: "multiply",
              alpha: 1
            }
          ]
        },
        {
          name: "highPixels",
          drawable: drawables.highPixels,
          blendMode: "normal"
        },
        {
          name: "rotor",
          drawable: drawables.rotor,
          blendMode: "normal"
        },
        {
          name: "rainDots",
          drawable: drawables.rainDots,
          blendMode: "normal"
        },
        {
          name: "fillCircle",
          drawable: drawables.fillCircle,
          blendMode: "normal",
          alpha: 0.1
        }
      ]
    };
  }

  updateState(audio) {
    const { layers, drawables, config } = this;

    // Audio independent stuff.
    layers.bassCircle.enabled = config.bassCircle;
    layers.bassLine.enabled = config.bassLine;
    layers.fillCircle.enabled = config.fillCircle;
    layers.highPixels.alpha = config.highLayerAlpha;
    layers.rotor.alpha = config.rotorAlpha;
    layers.rainDots.alpha = config.rainDotsAlpha;

    drawables.bassLine.angle = (-Math.PI * this.timeInMs) / 7000;
    drawables.rotor.angle = Math.cos((Math.PI * this.timeInMs) / 5000) * (((Math.PI * this.timeInMs) / 500) % Math.PI);
    drawables.rainDots.offset = -this.timeInMs / 50;
    drawables.rainDots.center[0] = this.xBounds.center + (Math.cos((Math.PI * this.timeInMs) / 7000) * this.xBounds.scale) / 3;
    drawables.fillCircle.radius = (300 * (3000 - (this.timeInMs % 5000))) / 5000;
    drawables.backgroundColors.angleOffset = (Math.PI * this.timeInMs) / 5000;
    drawables.backgroundMask.radiusOffset = Math.round(this.timeInMs / 1000);
    drawables.backgroundMask.center = [
      this.xBounds.center +
        0.35 * this.xBounds.scale * Math.cos((Math.PI * this.timeInMs) / 7000),
      this.yBounds.center +
        0.35 * this.yBounds.scale * Math.cos((Math.PI * this.timeInMs) / 8000)
    ];
    drawables.backgroundMask.scale =
      1 + 0.2 * Math.cos((Math.PI * this.timeInMs) / 10000);

    // Audio dependent stuff.
    if (!audio.ready) {
      return;
    }
    const audioSummary = audio.currentFrame;
    const highNoBass = audioSummary.highRmsNoBass;
    const normalizedBass = audioSummary.bassPeakDecay;
    drawables.bassCircle.radius =
      10 + this.config.bassCircleSensitivity * Math.pow(normalizedBass, 2);
    drawables.bassLine.width =
      this.config.bassLineSensitivity * normalizedBass;
    drawables.highPixels.threshold = 1 - 0.1 * highNoBass;
  }

  static presets() {
    return {
      default: {
        bassCircle: true,
        bassCircleSensitivity: 50,
        bassLine: false,
        bassLineSensitivity: 0,
        fillCircle: false,
        highLayerAlpha: 0.2,
        rotorAlpha: 0,
        rainDotsAlpha: 0
      },
      bassLine: {
        bassCircle: false,
        bassCircleSensitivity: 50,
        bassLine: true,
        bassLineSensitivity: 50,
        fillCircle: false,
        highLayerAlpha: 0.2,
        rotorAlpha: 0,
        rainDotsAlpha: 0
      },
      bassCircle: {
        bassCircle: true,
        bassCircleSensitivity: 85,
        bassLine: false,
        bassLineSensitivity: 50,
        fillCircle: false,
        highLayerAlpha: 0,
        rotorAlpha: 0,
        rainDotsAlpha: 0
      },
      rotor: {
        bassCircle: true,
        bassCircleSensitivity: 42,
        bassLine: false,
        bassLineSensitivity: 0,
        fillCircle: false,
        highLayerAlpha: 0.1,
        rotorAlpha: 0.5,
        rainDotsAlpha: 0
      },
      rain: {
        bassCircle: true,
        bassCircleSensitivity: 42,
        bassLine: false,
        bassLineSensitivity: 0,
        fillCircle: false,
        highLayerAlpha: 0.1,
        rotorAlpha: 0,
        rainDotsAlpha: 0.3
      },
      todo: {
        bassCircle: true,
        bassCircleSensitivity: 50,
        bassLine: true,
        bassLineSensitivity: 15,
        fillCircle: true,
        highLayerAlpha: 0.25,
        rotorAlpha: 0.17,
        rainDotsAlpha: 0.3
      },
      randomPlusFill: {
        bassCircle: false,
        bassCircleSensitivity: 50,
        bassLine: false,
        bassLineSensitivity: 15,
        fillCircle: true,
        highLayerAlpha: 0.5,
        rotorAlpha: 0,
        rainDotsAlpha: 0
      }
    };
  }

  // Override and extend config Schema
  static configSchema() {
    let res = super.configSchema();
    res.bassCircle = { type: Boolean, default: true };
    res.bassCircleSensitivity = {
      type: Number,
      default: 50,
      min: 0,
      max: 100,
      step: 0.1
    };
    res.bassLine = { type: Boolean, default: false };
    res.bassLineSensitivity = {
      type: Number,
      default: 0,
      min: 0,
      max: 50,
      step: 0.1
    };
    res.fillCircle = { type: Boolean, default: false };
    res.highLayerAlpha = {
      type: Number,
      default: 0.2,
      min: 0,
      max: 1,
      step: 0.01
    };
    res.rotorAlpha = { type: Number, default: 0, min: 0, max: 1, step: 0.01 };
    res.rainDotsAlpha = {
      type: Number,
      default: 0,
      min: 0,
      max: 1,
      step: 0.01
    };
    return res;
  }
};
