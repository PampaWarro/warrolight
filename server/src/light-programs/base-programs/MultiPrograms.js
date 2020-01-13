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
    constructor(config, geometry, shapeMapping) {
      super(config, geometry, shapeMapping);

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
            this.geometry,
            this.shapeMapping
          ))
      );

      this.previous = null;
      this.current = null;
      this.nextStartChange = null;
    }

    init() {
      for (let scheduleItem of this.programSchedule) {
        scheduleItem.programInstance.init();
      }

      this.position = this.position || 0; // So that in case of restart it continues where it was left
      this.nextStartChange = null;
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
        this.current.timeInMs = this.timeInMs;

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

        this.current.drawFrame(draw, audio);
      }

      if (this.crossFadeFinish && Date.now() >= this.crossFadeFinish) {
        this.crossFadeStart = null;
        this.crossFadeFinish = null;
        this.previous = null;
      }

      if (Date.now() >= this.nextStartChange) {
        this.startNextProgram();
      }
    }

    startNextProgram() {
      // start crossfade of random duration between 0 and [crossFade]ms
      const randomCrossFadeDuration = crossFade * Math.random();
      this.crossFadeStart = Date.now();
      this.crossFadeFinish = Date.now() + randomCrossFadeDuration;

      if (random) {
        this.position = Math.floor(Math.random() * this.programSchedule.length) % this.programSchedule.length;
      } else {
        this.position = (this.position + 1) % this.programSchedule.length;
      }

      const {programInstance, duration} = this.programSchedule[this.position]
      this.previous = this.current;
      this.current = programInstance;
      this.nextStartChange = Date.now() + duration;
    }

    updateConfig(config) {
      this.config = config;
      for (let item of this.programSchedule) {
        item.programInstance.updateConfig(config);
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
