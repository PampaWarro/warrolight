const _ = require("lodash");
const ColorUtils = require("./light-programs/utils/ColorUtils");
const audioEmitter = require("./audioEmitter");

let lastFlushTime = new Date().valueOf();

const NanoTimer = require('nanotimer');

module.exports = class ProgramScheduler {

  constructor(program, config, newFrameCallback) {
    this.program = program;
    this.config = config;
    this.newFrameCallback = newFrameCallback;
    this.timeInMs = 0;
    this.startTime = null;
    this.nextTickTimeout = null;
  }

  start() {
    this.timeInMs = 0;
    this.startTime = Date.now();
    this.timer = new NanoTimer();

    this.program.init();

    const frame = () => {
      this.timeInMs = Date.now() - this.startTime;

      // TODO: find a way to remove this
      this.program.timeInMs = this.timeInMs;


      let startFrameTime = Date.now();

      const flushFrameData = colorsArray => {
        const endFrameTime = Date.now();
        let drawingTimeMs = endFrameTime - startFrameTime;
        let frameLength = Math.round(1000 / this.config.fps);
        let remainingTime = frameLength - (endFrameTime - lastFlushTime);

        if (drawingTimeMs > 10) {
          // console.log(`Time tick took: ${drawingTimeMs}ms (${remainingTime}ms remaining)`);
        }
        // Schedule next frame for the remaing time considering how long it took to do the drawing
        // We wait at least 3ms in order to throttle CPU to give room for IO, serial and other critical stuff
        this.timer.setTimeout(() => {
          const now = Date.now().valueOf();
          if (Math.abs(now - lastFlushTime - frameLength) > 3) {
            // console.log(`${now - lastFlushTime}ms (render ${drawingTimeMs}ms, scheduled ${remainingTime}, took ${now - endFrameTime})`);
          }

          clearInterval(this.nextTickTimeout);
          lastFlushTime = now;
          this.newFrameCallback(_.map(colorsArray, col => ColorUtils.dim(col, this.config.globalBrightness)));

          frame();
        }, '', remainingTime + 'm');
      };

      this.program.drawFrame(flushFrameData, audioEmitter);
    };

    this.nextTickTimeout = setTimeout(frame, 1);
  }

  stop() {
    this.timer.clearTimeout();
  }

  restart() {
    this.stop();
    this.program.init();
    this.start();
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

// var NanoTimer = require('nanotimer');
// timer = new NanoTimer();
// c = new Date().valueOf();
// var log = () => {
//   let now = new Date().valueOf();
//   let diff = now - c;
//   console.log(diff);
//   c = now;
// };
// timer.setInterval(log,null, '16m')
