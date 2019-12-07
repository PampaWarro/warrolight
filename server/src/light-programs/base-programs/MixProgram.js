const _ = require("lodash");

module.exports = function mixPrograms(...programs) {
  return class MixProgram {
    constructor(config, leds, shapeMapping) {
      // Shallow copy of schedule
      this.programs = [];
      this.config = config;
      this.past = null;

      _.each(programs, scheduleItem => {
        if (!_.isArray(scheduleItem)) {
          scheduleItem = [scheduleItem, {}, 1];
        }
        let [Program, specificConfig, alpha] = scheduleItem;

        this.programs.push({
          programInstance: new Program(config, leds, shapeMapping),
          customConfig: specificConfig,
          alpha: alpha || 1
        });
      });
    }

    mix(frames) {
      // TODO: clamp / divide final values?
      return _.map(frames[0], (c, i) => {
        let [r, g, b] = c;
        for (let j = 1; j < frames.length; j++) {
          r += frames[j][i][0];
          g += frames[j][i][1];
          b += frames[j][i][2];
        }
        return [r, g, b];
      });
    }

    drawFrame(draw, audio) {
      let frames = [];
      _.each(this.programs, (p, i) => {
        // TODO: remove this forwarding somehow
        p.programInstance.timeInMs = this.timeInMs;
        p.programInstance.frameNumber = this.frameNumber;

        p.programInstance.drawFrame(
          colors => frames[i] = colors,
          audio
        )
      });

      draw(this.mix(frames));
    }

    static configSchema() {
      let schema = {};
      _.each(programs, program => {
        if (_.isArray(program)) program = program[0];

        schema = _.extend(schema, program.configSchema());
      });
      return schema;
    }
  };
};
