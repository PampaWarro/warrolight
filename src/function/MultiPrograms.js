// import {Func} from "./rainbow";
const _ = require('lodash')

export function createMultiProgram(programSchedule) {
  return class {
    constructor(config, leds) {
      // Shallow copy of schedule
      this.programSchedule = [].concat(programSchedule).map(item => _.extend({}, item))
      this.nextPosition = 0;
      _.each(this.programSchedule, scheduleItem => scheduleItem.programInstance = new scheduleItem.program(config, leds))
    }

    playNextProgram(config, draw, done) {
      if (this.current) {
        this.current.programInstance.stop();
      }
      this.current = this.programSchedule[this.nextPosition]
      this.current.programInstance.start(config, draw, done)

      this.nextTimeout = setTimeout(() => this.playNextProgram(config, draw, done), this.current.duration);

      this.nextPosition = (this.nextPosition + 1) % this.programSchedule.length;
    }

    start(config, draw, done) {
      this.playNextProgram(config, draw, done);
    }

    stop() {
      if (this.current) {
        this.current.programInstance.stop();
        this.current = null;
      }

      if (this.nextTimeout) {
        clearTimeout(this.nextTimeout);
        this.nextTimeout = null;
      }
    }

    static configSchema() {
      let schema = {};
      _.each(programSchedule, ({program}) => {
        schema = _.extend(schema, program.configSchema())
      });
      return schema;
    }
  }
}