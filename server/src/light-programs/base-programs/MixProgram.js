const _ = require("lodash");

module.exports = function mixPrograms(...programs) {
  return class MixProgram {
    constructor(config, leds, shapeMapping) {
      // Shallow copy of schedule
      this.programs = [];
      this.config = config;
      this.frames = [];
      this.past = null;

      _.each(programs, scheduleItem => {
        if (!_.isArray(scheduleItem)) {
          scheduleItem = [scheduleItem, {}, 1];
        }
        let [program, specificConfig, alpha] = scheduleItem;

        this.programs.push({
          programInstance: new program(config, leds, shapeMapping),
          customConfig: specificConfig,
          alpha: alpha || 1
        });
      });

      this.drawSubprogram = _.throttle(this.drawSubprogram, 16);
    }

    drawSubprogram() {
      if (this.frames.length) {
        let mixedColors = _.map(this.frames[0], (c, i) => {
          let [r, g, b] = c;
          for (let j = 1; j < this.frames.length; j++) {
            r += this.frames[j][i][0];
            g += this.frames[j][i][1];
            b += this.frames[j][i][2];
          }
          return [r, g, b];
        });

        this.currentDrawFunc(mixedColors);
      }
    }

    updateConfig(key, value) {
      _.each(this.programs, p => {
        const program = p.programInstance;
        if (
          program.config &&
          program.config[key] &&
          program.config[key] !== value
        ) {
          program.config[key] = value;
          if (program.updateConfig) {
            program.updateConfig(key, value);
          }
        }
      });
    }

    start(config, draw) {
      this.currentDrawFunc = draw;

      _.each(this.programs, (p, i) =>
        p.programInstance.start(
          { ...config, ...p.customConfig },
          colors => {
            this.frames[i] = colors;
            this.drawSubprogram();
          },
          () => true
        )
      );
    }

    stop() {
      _.each(this.programs, p => p.programInstance.stop());
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
