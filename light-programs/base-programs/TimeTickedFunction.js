const ColorUtils = require("./../utils/ColorUtils");
const _ = require('lodash')

module.exports = class TimeTickedFunction {
  constructor(config, leds) {
    this.config = config;
    this.leds = leds;
    this.numberOfLeds = leds.numberOfLeds;
    this.geometry = leds.geometry;
    this.position = leds.position;
  }

  // Override in subclasses
  drawFrame(draw, done){
    throw new Error("Child classes should override drawFrame");
  }

  start(config, draw, done) {
    this.config = config;
    this.timeInMs = 0;
    this.startTime = new Date();

    const frame =() => {
      this.nextTickTimeout = setTimeout(frame, (1000 / this.config.fps));
      this.timeInMs = new Date() - this.startTime;
      this.drawFrame(colorsArray => draw(_.map(colorsArray, col => ColorUtils.dim(col, this.config.globalBrightness))), done);
    }

    this.nextTickTimeout = setTimeout(frame, (1000 / this.config.fps));

    done()
  }

  stop() {
    clearTimeout(this.nextTickTimeout)
  }

  static configSchema(){
    // Child classes should call super.configSchema and extend this object
    return {
      globalBrightness: {type: Number, min: 0, max: 1, step: 0.01, default: 1},
      fps: {type: Number, min: 1, max: 60, default: 30},
    }
  }
}