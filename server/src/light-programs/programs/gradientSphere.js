const LayerBasedProgram = require("../base-programs/LayerBasedProgram");
const {
  GradientSolidSphere,
} = require("../utils/drawables");
const {
  TimedMultiGradient,
  allGradients,
} = require("../utils/gradients");

module.exports = class GradientSphere extends LayerBasedProgram {
  init() {
    this.timedMultiGradient = new TimedMultiGradient(allGradients());
    super.init();
  }

  getDrawables() {
    return {
      sphere : new GradientSolidSphere({
      }),
    };
  }

  getLayers(drawables) {
    return {
      layers : [ {
        name : "sphere",
        drawable : drawables.sphere,
        blendMode : "normal",
        alpha : 1,
      } ]
    };
  }

  updateState(audio) {
    const {
      layers,
      drawables,
      config,
      timeInMs,
      xBounds,
      yBounds,
      zBounds,
    } = this;

    // Audio independent stuff.
    const time = timeInMs / 1000;
    this.timedMultiGradient.currentTime = time;
    drawables.sphere.gradient = this.config.gradient || this.timedMultiGradient;
    drawables.sphere.center = [
      xBounds.center + .5 * xBounds.scale * Math.cos(.1 * Math.PI * time),
      yBounds.center + .5 * yBounds.scale * Math.cos(.2 * Math.PI * time),
      zBounds.center + .5 * zBounds.scale * Math.cos(.3 * Math.PI * time),
    ];

    // Audio dependent stuff.
    if (!audio.ready) {
      return;
    }
    const audioSummary = audio.currentFrame;
    const normalizedBass = audioSummary.bassPeakDecay;
    const dims = [this.xBounds.scale, this.yBounds.scale, this.zBounds.scale];
    dims.sort();
    const scale = dims[1];
    drawables.sphere.radius =
        scale * (config.minRadius + config.sensitivity * normalizedBass);
    layers.sphere.alpha = .2 + .5*normalizedBass;
  }

  static presets() { return {}; }

  // Override and extend config Schema
  static configSchema() {
    let res = super.configSchema();
    res.sensitivity =
        {type : Number, min : 0, max : 2, step : 0.01, default : .4};
    res.minRadius =
        {type : Number, min : 0, max : 10, step : 0.01, default : .35};
    res.gradient = {type : "gradient", default : ""};
    return res;
  }
};
