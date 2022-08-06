const _ = require("lodash");
const LightProgram = require("./../base-programs/LightProgram");

module.exports = class RandomShapes extends LightProgram {
  init() {
    this.shapes = Object.values(this.shapeMapping());
    this.mask = {};
  };

  drawFrame(colors, context) {
    this.maybePickNewShapes(context);
    for (let i = 0; i < this.numberOfLeds; i++) {
      colors[i] = this.mask[i]? [255, 255, 255] : [0, 0, 0];
    }
  }

  maybePickNewShapes(context) {
    const timeInMs = context.timeInMs;
    const timeSinceLastPick = timeInMs - this.lastPickTime;
    if (!this.lastPickTime || timeSinceLastPick >= this.config.timeout) {
      this.pickNewShapes(context);
      return;
    }
    if (!this.config.soundTrigger) {
      return;
    }
    const frame = context.audio.currentFrame;
    const soundValue = frame[this.config.soundMetric];
    if (soundValue < this.config.soundTriggerThreshold) {
      return;
    }
    if (timeSinceLastPick < this.config.soundTriggerTimeout) {
      return;
    }
    this.pickNewShapes(context);
  }

  pickNewShapes(context) {
    this.lastPickTime = context.timeInMs;
    this.mask = {};
    const threshold = this.config.fillAmount * this.numberOfLeds;
    for (const shape of _.shuffle(this.shapes)) {
      if (shape.length < this.config.minShapeSize) {
        continue;
      }
      const currentMaskSize = Object.keys(this.mask).length;
      if (currentMaskSize >= threshold) {
        break;
      }
      if (currentMaskSize + shape.length > threshold) {
        continue;
      }
      for (const i of shape) {
        this.mask[i] = true;
      }
    }
  }

  static configSchema() {
    return Object.assign(super.configSchema(), {
      minShapeSize : {
        type : Number,
        min : 0,
        max : 1000,
        step : 1,
        default : 110,
      },
      fillAmount : {
        type : Number,
        min : 0,
        max : 1,
        step : 0.01,
        default : 0.5,
      },
      timeout : {
        type : Number,
        min : 0,
        max : 1000 * 60,
        step : 10,
        default : 1000,
      },
      soundTrigger : {type : Boolean, default : true},
      soundTriggerThreshold : {
        type : Number,
        min : 0,
        max : 1,
        step : .1,
        default : .3,
      },
      soundTriggerTimeout : {
        type : Number,
        min : 0,
        max : 1000 * 2,
        step : 10,
        default : 500,
      },
      soundMetric : {type : 'soundMetric', default : 'fastPeakDecay'},
    });
  }
};
