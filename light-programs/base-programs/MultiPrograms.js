// import {Func} from "./rainbow";
const _ = require('lodash')
const ColorUtils = require('../utils/ColorUtils')

let CROSSFADE_TIME_MS = 20000;

module.exports = function createMultiProgram(programSchedule, random = false, crossFade = 20000) {
  return class  {
    constructor(config, leds, mapping) {
      // Shallow copy of schedule
      this.programSchedule = [].concat(programSchedule).map(item => _.extend({}, item))
      this.nextPosition = 0;
      this.config = config;
      this.past = null;
      _.each(this.programSchedule, scheduleItem => scheduleItem.programInstance = new scheduleItem.program(config, leds, mapping))
      this.drawSubprogram = _.throttle(this.drawSubprogram, 16)
    }

    drawSubprogram() {
      if(this.current && this.current.lastFrame) {
        let lastFrame = this.current.lastFrame;

        if(this.past && this.past.lastFrame) {
          let t = this.past.fadeStartTime;

          let c = 1 - Math.min(1, ((new Date() - t)/ crossFade));
          lastFrame = _.map(lastFrame, (f,i) => ColorUtils.mix(f, this.past.lastFrame[i], c))
        }
        this.currentDrawFunc(lastFrame)
      }
    }

    playNextProgram(config) {
      if (this.past) {
        this.past.programInstance.stop();
        this.past = null;
      }

      // Put current program as past, for transition cross-fade
      if (this.current) {
        this.past = this.current;
        this.past.fadeStartTime = new Date();

        // PICK A RANDOM CROSSFADE TIME
        CROSSFADE_TIME_MS = Math.random()*crossFade;
        setTimeout(() => {
          if(this.past) {
            this.past.programInstance.stop();
            this.past = null;
          }
        }, CROSSFADE_TIME_MS)
      }

      let nextProgram = this.programSchedule[this.nextPosition];
      this.current = nextProgram
      this.current.programInstance.start(config, (colors) => {
        nextProgram.lastFrame = colors
        this.drawSubprogram()
      }, () => {})
      this.nextTimeout = setTimeout(() => this.playNextProgram(config), this.current.duration);

      if(random){
        this.nextPosition = Math.floor(Math.random()*this.programSchedule.length) % this.programSchedule.length;
      } else {
        this.nextPosition = (this.nextPosition + 1) % this.programSchedule.length;
      }
    }

    updateConfig(key, value) {
      let program = this.current.programInstance;
      if (program.config && program.config[key] && program.config[key] !== value) {
        program.config[key] = value
        if(program.updateConfig){
          program.updateConfig(key, value)
        }
      }
    }


    start(config, draw, done) {
      this.currentDrawFunc = draw;
      this.playNextProgram(config);
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