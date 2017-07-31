// import {Func} from "./rainbow";
const _ = require('lodash')

module.exports = function createMultiProgram(programSchedule, random = false) {
  return class {
    constructor(config, leds) {
      // Shallow copy of schedule
      this.programSchedule = [].concat(programSchedule).map(item => _.extend({}, item))
      this.nextPosition = 0;
      this.config = config;
      _.each(this.programSchedule, scheduleItem => scheduleItem.programInstance = new scheduleItem.program(config, leds))
    }

    playNextProgram(config, draw, done) {
      if (this.current) {
        this.current.programInstance.stop();
      }
      this.current = this.programSchedule[this.nextPosition]
      this.current.programInstance.start(config, draw, done)

      this.nextTimeout = setTimeout(() => this.playNextProgram(config, draw, done), this.current.duration);

      if(random){
        this.nextPosition = Math.floor(Math.random()*this.programSchedule.length) % this.programSchedule.length;
      } else {
        this.nextPosition = (this.nextPosition + 1) % this.programSchedule.length;
      }
    }

    updateConfig(key, value) {
      var program = this.current.programInstance;
      if (program.config && program.config[key] && program.config[key] !== value) {
        program.config[key] = value
        if(program.updateConfig){
          program.updateConfig(key, value)
        }
      }
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