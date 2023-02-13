const _ = require("lodash");
const LightProgram = require("./LightProgram");

module.exports = function mixTappablePrograms(...programs) {
  return class TappableMixProgram extends LightProgram {
    constructor(config, geometry, shapeMapping) {
      super(config, geometry);
      // Shallow copy of schedule
      this.programs = [];

      _.each(programs, scheduleItem => {
        if (!_.isArray(scheduleItem)) {
          scheduleItem = [scheduleItem, {}, 1];
        }
        let [Program, specificConfig, alpha] = scheduleItem;

        this.programs.push({
          programInstance: new Program(config, geometry, shapeMapping),
          customConfig: specificConfig,
          alpha: alpha || 1,
          leds: new Array(this.numberOfLeds).fill([0, 0, 0]),
        });
      });
    }

    init() {
      this.past = null;
      this.programs.forEach(p => p.programInstance.init());
    }

    tap(data){
      this.programs.forEach((p, i) => {
        if (typeof p.programInstance.tap === "function"){
          console.log('tappable mix tap')
          p.programInstance.tap(data);
        }
      })
    }

    mix(frames, output) {
      // TODO: clamp / divide final values?
      frames[0].forEach((c, i) => {
        let [r, g, b] = c;
        for (let j = 1; j < frames.length; j++) {
          r += frames[j][i][0];
          g += frames[j][i][1];
          b += frames[j][i][2];
        }
        output[i] = [r, g, b];
      });
    }

    drawFrame(leds, context) {
      let frames = [];
      _.each(this.programs, (p, i) => {
        // TODO: remove this forwarding somehow
        p.programInstance.timeInMs = this.timeInMs;

        p.leds.fill([0, 0, 0]);
        p.programInstance.drawFrame(p.leds, context);
        frames.push(p.leds);
      });

      this.mix(frames, leds);
    }

    updateConfig(config) {
      this.config = config;
      for (let item of this.programs) {
        item.programInstance.updateConfig(config);
      }
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
