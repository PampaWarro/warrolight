const _ = require('lodash');

const LightProgram = require('./../base-programs/LightProgram');
const ColorUtils = require("../utils/ColorUtils");

module.exports = class DynamicMask extends LightProgram {
  init() {
    this.mask = this.getProgramInstanceFromParam(this.config.mask);
    this.maskLeds = new Array(this.numberOfLeds);
    this.positive = this.getProgramInstanceFromParam(this.config.positive);
    this.positiveLeds = new Array(this.numberOfLeds);
    this.negative = this.getProgramInstanceFromParam(this.config.negative);
    this.negativeLeds = new Array(this.numberOfLeds);
  }

  getProgramInstanceFromParam({programName, config}) {
    const p = this.lightController.instanciateProgram(programName);
    p.init();
    return p;
  }

  drawFrame(leds, context) {
    const allProgramLedPairs = [
      [ this.mask, this.maskLeds ],
      [ this.positive, this.positiveLeds ],
      [ this.negative, this.negativeLeds ],
    ];
    for (const [program, programLeds] of allProgramLedPairs) {
      program.timeInMs = context.timeInMs;
      programLeds.fill([ 0, 0, 0 ]);
      program.drawFrame(programLeds, context);
    }
    for (let i = 0; i < leds.length; i++) {
      const mask = this.maskLeds[i];
      const positive = this.positiveLeds[i];
      const negative = this.negativeLeds[i];
      if (this.config.colorMask) {
        const led = leds[i] = [ 0, 0, 0 ];
        for (let i = 0; i < 3; i++) {
          led[i] =
              mask[i] * positive[i] / 255 + (255 - mask[i]) * negative[i] / 255;
        }
      } else {
        leds[i] = ColorUtils.mix(negative, positive,
                                 ColorUtils.luminance(...mask) / 255);
      }
    }
    return;
  }

  updateConfig(newConfig) {
    for (const subprogram of ["mask", "positive", "negative"]) {
      const oldProgramConfig = this.config[subprogram];
      const newProgramConfig = newConfig[subprogram];
      if (subprogram in this &&
          oldProgramConfig.programName === newProgramConfig.programName) {
        // Same program, just update config.
        const instance = this[subprogram];
        instance.updateConfig(
            Object.assign(instance.config, newProgramConfig.config || {}));
      } else {
        this[subprogram] = this.getProgramInstanceFromParam(newProgramConfig);
      }
    }
    super.updateConfig(newConfig)
  }

  static configSchema() {
    return Object.assign(super.configSchema(), {
      mask : {type : 'program', default : {programName : 'randomShapes'}},
      positive : {type : 'program', default : {programName : 'noise'}},
      negative : {type : 'program', default : {programName : 'stars'}},
      colorMask : {type : Boolean, default : true},
    });
  }
};
