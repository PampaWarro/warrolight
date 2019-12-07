const _ = require("lodash");
const LightProgram = require("./LightProgram");
const ColorUtils = require("../utils/ColorUtils");

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

module.exports = function createMultiProgram(
  programSchedule,
  random = false,
  crossFade = 20000
) {
  return class MultiProgram extends LightProgram {
    constructor(config, leds, shapeMapping) {
      super(config, leds, shapeMapping);

      // Shallow copy of schedule
      this.programSchedule = []
        .concat(programSchedule)
        .map(item => _.extend({}, item));

      // instantiate each program
      _.each(
        this.programSchedule,
        scheduleItem =>
          (scheduleItem.programInstance = new scheduleItem.program(
            this.config,
            this.leds,
            this.shapeMapping
          ))
      );
    }

    init() {
      for (let scheduleItem of this.programSchedule) {
        scheduleItem.programInstance.init();
      }

      this.position = 0;
      this.nextStartChange = null;
      this.previous = null;
      this.current = null;
    }

    drawFrame(draw, audio) {
      // init
      if (this.current === null) {
        let scheduleItem = this.programSchedule[this.position];
        this.current = scheduleItem.programInstance;
        this.nextStartChange = Date.now() + scheduleItem.duration;
      }

      if (this.previous) {
        let previousColors, currentColors;

        // TODO: remove this forwarding somehow
        this.previous.timeInMs = this.timeInMs;
        this.previous.frameNumber = this.frameNumber;
        this.current.timeInMs = this.timeInMs;
        this.current.frameNumber = this.frameNumber;

        this.previous.drawFrame((colors) => previousColors = colors, audio);
        this.current.drawFrame((colors) => currentColors = colors, audio);

        let alpha = clamp(
          (Date.now() - this.crossFadeStart)
           / (this.crossFadeFinish - this.crossFadeStart), 0, 1);

        let colors = new Array(currentColors.length);
        for (let i = 0; i < currentColors.length; i++) {
          colors[i] = ColorUtils.mix(previousColors[i], currentColors[i], alpha);
        }

        draw(colors)
      } else {
        // TODO: remove this forwarding somehow
        this.current.timeInMs = this.timeInMs;
        this.current.frameNumber = this.frameNumber;

        this.current.drawFrame(draw, audio);
      }

      if (this.crossFadeFinish && Date.now() >= this.crossFadeFinish) {
        this.crossFadeStart = null;
        this.crossFadeFinish = null;
        this.previous = null;
      }

      if (Date.now() >= this.nextStartChange) {
        // start crossfade
        this.crossFadeStart = Date.now();
        this.crossFadeFinish = Date.now() + crossFade;
        this.previous = this.current;

        if (random) {
          this.position = Math.floor(
            Math.random() * this.programSchedule.length
          ) % this.programSchedule.length;
        } else {
          this.position = (this.position + 1) % this.programSchedule.length;
        }

        let scheduleItem = this.programSchedule[this.position]
        this.current = scheduleItem.programInstance;
        this.nextStartChange = Date.now() + scheduleItem.duration;
      }
    }

    static configSchema() {
      let schema = {};
      _.each(programSchedule, ({ program }) => {
        schema = _.extend(schema, program.configSchema());
      });
      return schema;
    }
  };
};
