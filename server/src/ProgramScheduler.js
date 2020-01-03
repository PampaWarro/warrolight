const _ = require("lodash");
const ColorUtils = require("./light-programs/utils/ColorUtils");
const audioEmitter = require("./audioEmitter");

module.exports = class ProgramScheduler {

  constructor(program) {
    this.program = program;
    this.timeInMs = 0;
    this.startTime = null;
    this.nextTickTimeout = null;
  }

  start(config, draw) {
    this.timeInMs = 0;
    this.startTime = Date.now();
    this.config = config;
    this.draw = draw;

    this.program.init();

    const frame = () => {
      this.timeInMs = Date.now() - this.startTime;

      // TODO: find a way to remove this
      this.program.timeInMs = this.timeInMs;

      let start = Date.now();

      this.program.drawFrame(
        colorsArray => draw(_.map(colorsArray, col =>
          ColorUtils.dim(col, this.config.globalBrightness))),
        audioEmitter,
      );

      let drawingTimeMs = Date.now() - start;
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

    this.nextTickTimeout = setTimeout(frame, 1);
  }

  stop() {
    clearTimeout(this.nextTickTimeout);
  }

  restart() {
    this.stop();
    this.program.init();
    this.start(this.config, this.draw);
  }

  get config() {
      return this.program.config;
  }

  set config(config) {
    this.updateConfig(config);
  }

  updateConfig(config) {
    this.program.updateConfig(config);
  }

}
