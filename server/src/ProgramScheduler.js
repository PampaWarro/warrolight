const _ = require("lodash");
const ColorUtils = require("./light-programs/utils/ColorUtils");
const audioEmitter = require("./audioEmitter");
const nowPlaying = require("./nowPlaying");

let lastFlushTime = new Date().valueOf();

const Loop = require('accurate-game-loop');

module.exports = class ProgramScheduler {

  constructor(program, config, leds, ledsUpdatedCallback) {
    this.config = config;
    this.program = program;
    this.leds = leds;
    this.ledsUpdatedCallback = ledsUpdatedCallback;
    this.timeInMs = 0;
    this.startTime = null;
  }

  start() {
    this.timeInMs = 0;
    this.startTime = Date.now();

    this.program.init();

    const frame = () => {
      this.timeInMs = Date.now() - this.startTime;

      // TODO: find a way to remove this
      this.program.timeInMs = this.timeInMs;

      let startFrameTime = Date.now();
      this.leds.fill([0, 0, 0]);
      this.program.drawFrame(this.leds, {
        timeInMs: this.timeInMs,
        audio: audioEmitter,
        nowPlaying: nowPlaying.currentStatus(),
      });

      const endFrameTime = Date.now();
      let drawingTimeMs = endFrameTime - startFrameTime;
      let frameLength = Math.round(1000 / this.config.fps);
      let remainingTime = frameLength - (endFrameTime - lastFlushTime);

      if (drawingTimeMs > 10) {
        // console.log(`Time tick took: ${drawingTimeMs}ms (${remainingTime}ms remaining)`);
      }
      const now = Date.now().valueOf();
      if (Math.abs(now - lastFlushTime - frameLength) > 3) {
        // console.log(`${now - lastFlushTime}ms (render ${drawingTimeMs}ms, scheduled ${remainingTime}, took ${now - endFrameTime})`);
      }

      lastFlushTime = now;
      if (this.config.globalBrightness != 1) {
        this.leds.forEach((col, i) => {
          this.leds[i] = ColorUtils.dim(col, this.config.globalBrightness);
        });
      }
      this.ledsUpdatedCallback(this.leds);

      // Needed to change fps config in realtime without start/stop
      if(this.config.fps !== this.loop._times) {
        this.loop.stop();
        this.loop = new Loop(frame, this.config.fps);
        this.loop.start();
      }
    };

    this.loop = new Loop(frame, this.config.fps);
    this.loop.start();
  }

  stop() {
    this.loop.stop();
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
    if (this.program) {
      this.program.updateConfig(config);
    }
  }

  getDebugHelpers() {
    if (this.program) {
      return this.program.getDebugHelpers();
    }
  }
  touch(data) {
    this.program.touch(data);
  }
}
