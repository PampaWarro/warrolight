const ColorUtils = require("./../utils/ColorUtils");
const LightProgram = require("./LightProgram.js");
const _ = require("lodash");

function makeBaseFXProgram(WrappedProgram) {
  return class BaseFXProgram extends WrappedProgram {
    drawFrame(draw, audio) {
      let frame = null;
      WrappedProgram.prototype.drawFrame.call(this, colors => frame = colors,
                                              audio);
      this.processFrame(frame, audio);
      draw(frame);
    }
  }
}

function makeDelay(WrappedProgram) {
  return class DelayProgram extends makeBaseFXProgram(WrappedProgram) {
    constructor(config, geometry, shapeMapping, lightController) {
      super(config, geometry, shapeMapping, lightController);
      this.pastFrames = [];
    }

    processFrame(frame, audio) {
      if (super.processFrame) super.processFrame(frame, audio);
      let ms = this.config.FXDelayMs;
      let dry = this.config.FXDelayDry;
      let wet = this.config.FXDelayWet;
      if (wet === 0) {
        return;
      }
      let feedback = this.config.FXDelayFeedback;

      let savedFrame = _.clone(frame);
      this.pastFrames.push([this.timeInMs, savedFrame]);

      let pastFrame = null;
      while (this.pastFrames.length > 0) {
        let [t, f] = this.pastFrames[0];
        if ((this.timeInMs - t) > ms) {
          this.pastFrames.shift();
          continue;
        }
        pastFrame = f;
        break;
      }


      if (!pastFrame) {
        return;
      }
      for (let i = 0; i < frame.length; i++) {
        let currentColor = _.map(frame[i], x=> x * dry);
        let pastColor = _.map(pastFrame[i], x => x * wet);
        frame[i] = ColorUtils.max(currentColor, pastColor);
      }

      if (feedback > 0) {
        for (let i = 0; i < frame.length; i++) {
          savedFrame[i] = ColorUtils.mix(savedFrame[i], frame[i], feedback);
        }
      }
    }

    static configSchema() {
      let config = super.configSchema();
      config.FXDelayMs = {type: Number, min: 0, max: 3000, step: 1, default: 1000};
      config.FXDelayDry = {type: Number, min: 0, max: 1, step: 0.005, default: 1};
      config.FXDelayWet = {type: Number, min: 0, max: 1, step: 0.005, default: 0};
      config.FXDelayFeedback = {type: Number, min: 0, max: 1, step: 0.005, default: 0};
      return config;
    }
  }
}

function makeSlowFade(WrappedProgram) {
  let Base = makeBaseFXProgram(WrappedProgram);
  return class SmoothProgram extends Base {
    constructor(config, geometry, shapeMapping, lightController) {
      super(config, geometry, shapeMapping, lightController);
      this.lastFrame = null;
    }

    processFrame(frame, audio) {
      if (super.processFrame) super.processFrame(frame, audio);
      let alpha = this.config.FXSlowFadeAlpha;
      if (this.lastFrame && alpha > 0) {
        for (let i = 0; i < frame.length; i++) {
          let oldColor = this.lastFrame[i];
          let color = frame[i];
          if (Math.max(...color) < Math.max(...oldColor)) {
            // Less bright, slow fade.
            frame[i] = ColorUtils.mix(color, oldColor, alpha);
          }
        }
      }
      this.lastFrame = _.clone(frame);
    }

    static configSchema() {
      let config = super.configSchema();
      config.FXSlowFadeAlpha = {type: Number, min: 0, max: 1, step: 0.005, default: 0};
      return config;
    }
  }
}

// Wraps a program with all the available FX.
function makeFXProgram(WrappedProgram) {
  return makeSlowFade(makeDelay(WrappedProgram))
}

module.exports = {
  makeFXProgram,
  makeDelay,
};
