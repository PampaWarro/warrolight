const _ = require("lodash");

module.exports = function createMultiProgram(
  programSchedule,
  random = false,
  crossFade = 20000
) {
  return class MultiProgram {
    constructor(config, leds, shapeMapping) {
      // Shallow copy of schedule
      this.programSchedule = []
        .concat(programSchedule)
        .map(item => _.extend({}, item));
      this.nextPosition = 0;
      this.nextStartChange = null;
      this.config = config;
      this.past = null;
      this.current = null;

      // instantiate each program
      _.each(
        this.programSchedule,
        scheduleItem =>
          (scheduleItem.programInstance = new scheduleItem.program(
            config,
            leds,
            shapeMapping
          ))
      );
    }

    drawFrame(draw, audio) {
      // init
      if (this.current === null) {
        let scheduleItem = this.programSchedule[this.nextPosition];
        this.current = scheduleItem.programInstance;
        this.nextStartChange = Date.now() + scheduleItem.duration;
      }

      // draw
      this.current.drawFrame(draw, audio);

      // TODO: implement crossfade
      if (Date.now() >= this.nextStartChange) {
        if (random) {
          this.nextPosition = Math.floor(
            Math.random() * this.programSchedule.length
          ) % this.programSchedule.length;
        } else {
          this.nextPosition = this.nextPosition + 1 % this.programSchedule.length;
        }

        let scheduleItem = this.programSchedule[this.nextPosition]
        this.current = scheduleItem.programInstance;
        this.nextStartChange = Date.now() + scheduleItem.duration;
      }
    }

    // getConfig(programClass, globalConfig) {
    //   let config = _.clone(this.defaultConfig);
    //
    //   if(!configSchema) {
    //     configSchema = this.programs[this.currentProgramName].configSchema;
    //   }
    //
    //   for (let paramName in configSchema) {
    //     if (config[paramName] === undefined && configSchema[paramName].default !== undefined) {
    //       config[paramName] = configSchema[paramName].default;
    //     }
    //   }
    //   return config
    // }

    // updateConfig(key, value) {
    //   let program = this.current.programInstance;
    //   if (
    //     program.config &&
    //     program.config[key] &&
    //     program.config[key] !== value
    //   ) {
    //     program.config[key] = value;
    //     if (program.updateConfig) {
    //       program.updateConfig(key, value);
    //     }
    //   }
    // }

    static configSchema() {
      let schema = {};
      _.each(programSchedule, ({ program }) => {
        schema = _.extend(schema, program.configSchema());
      });
      return schema;
    }
  };
};
