const LightProgram = require("./../base-programs/LightProgram");
const ColorUtils = require("./../utils/ColorUtils");
const _ = require('lodash');

const {loadGradient} = require("../utils/gradients");

module.exports = class Mix extends LightProgram {
  init() {
    let {a, b} = this.config;

    this.subprograms = [
      this.getProgramInstanceFromParam(a),
      this.getProgramInstanceFromParam(b)
    ]
  }

  getProgramInstanceFromParam({programName, config}) {
    let p = this.lightController.instanciateProgram(programName);
    p.updateConfig({...p.config, ...config})
    p.init();
    return p;
  }

  drawFrame(draw, audio) {
    const combinedColors = new Array(this.numberOfLeds);

    this.extraTime = (this.extraTime || 0) + Math.random() * 10;

    for (const prog of this.subprograms) {
      // Done by ProgramScheduler, has to be replicated here
      prog.timeInMs = this.timeInMs;
      let globalBrightness = prog.config.globalBrightness || 0;
      prog.drawFrame((colors) => {
        for (let i = 0; i < this.numberOfLeds; i++) {
          let [r, g, b, a] = combinedColors[i] || [0, 0, 0, 0];
          const [r2, g2, b2, a2] = colors[i];
          r += (r2 || 0)*globalBrightness;
          g += (g2 || 0)*globalBrightness;
          b += (b2 || 0)*globalBrightness;
          a += a2 || 0;
          combinedColors[i] = [r, g, b, a];
        }
      }, audio)
    }
    draw(combinedColors);
  }

  updateConfig(newConfig) {
    // Override LightProgram version to decide when a program init needs to be called
    if (this.subprograms) {
      let updated = [newConfig.a, newConfig.b];
      let oldConfigs = [this.config.a, this.config.b]

      this.subprograms = _.map(updated, (newProgDef, i) => {
        let oldProgDef = oldConfigs[i];

        let subprogram = null;

        if (oldProgDef && oldProgDef.programName === newProgDef.programName) {
          subprogram = this.subprograms[i]
          subprogram.updateConfig({ ... subprogram.config, ... newProgDef.config })
        } else {
          subprogram = this.getProgramInstanceFromParam(newProgDef)
        }

        if(oldProgDef.presetName !== newProgDef.presetName) {
          const presets = this.lightController.getProgramPresets(newProgDef.programName);
          const defaults = {}
          newProgDef.config = presets[newProgDef.presetName];
          subprogram.updateConfig({ ... defaults, ... subprogram.config, ... presets[newProgDef.presetName] })
        }

        return subprogram
      })
    }

    super.updateConfig(newConfig)
  }

  static presets() {
    return {
      radialStars: {
        a: {programName: 'stars'},
        b: {
          programName: 'radial', config: {
            velocidad: 20
          }
        }
      },
    };
  }

  // Override and extend config Schema
  static configSchema() {
    let res = super.configSchema();

    res.a = {type: 'program', default: {programName: 'all-off'}};
    res.b = {type: 'program', default: {programName: 'all-off'}};

    return res;
  }
};
