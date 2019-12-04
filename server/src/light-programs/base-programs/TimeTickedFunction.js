const ColorUtils = require("./../utils/ColorUtils");
const _ = require("lodash");

module.exports = class TimeTickedFunction {
  constructor(config, leds) {
    this.config = config;
    this.leds = leds;
    this.numberOfLeds = leds.numberOfLeds;
    this.geometry = leds.geometry;
    this.position = leds.position;
  }

  // Override in subclasses
  drawFrame(draw) {
    throw new Error("Child classes should override drawFrame");
  }

  start(config, draw) {
    // TODO: creating new fields outside contructor prevents class optimization
    this.config = config;
    this.timeInMs = 0;
    this.frameNumber = 0;
    this.startTime = new Date();

    const frame = () => {
      let start = new Date();
      this.timeInMs = new Date() - this.startTime;
      this.frameNumber++;

      this.step(draw);

      let drawingTimeMs = new Date() - start;
      let remainingTime = 1000 / this.config.fps - drawingTimeMs;

      if (drawingTimeMs > 20) {
        console.log(
          `Time tick took: ${drawingTimeMs}ms (${remainingTime}ms remaining)`
        );
      }
      // Schedule next frame for the remaing time considering how long it took to do the drawing
      // We wait at least 10ms in order to throttle CPU to give room for IO, serial and other critical stuff
      this.nextTickTimeout = setTimeout(frame, Math.max(10, remainingTime));
    };

    setTimeout(frame, 1);
  }

  step(draw) {
    this.drawFrame(
      colorsArray =>
        draw(
          _.map(colorsArray, col =>
            ColorUtils.dim(col, this.config.globalBrightness)
          )
        ),
    );
  }

  stop() {
    clearTimeout(this.nextTickTimeout);
  }

  static configSchema() {
    // Child classes should call super.configSchema and extend this object
    return {
      globalBrightness: {
        type: Number,
        min: 0,
        max: 1,
        step: 0.01,
        default: 1
      },
      fps: { type: Number, min: 2, max: 60, default: 60 }
    };
  }
};
