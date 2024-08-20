const ColorUtils = require("./../utils/ColorUtils");
const LightProgram = require("./LightProgram.js");
const _ = require("lodash");

module.exports = function makeOverrideColorProgram(WrappedProgram) {
  return class OverrideColorProgram extends WrappedProgram {
    constructor(config, geometry, shapeMapping, lightController) {
      super(config, geometry, shapeMapping, lightController);
    }

    drawFrame(leds, context) {
      super.drawFrame(leds, context);
      this.processFrame(leds, context);
    }

    processFrame(leds, context) {
      if (this.config.overrideColor === 0) {
        return;
      }
      const oh = this.config.overrideHue;
      const os = this.config.overrideSat;
      for (let i = 0; i < leds.length; i++) {
        const color = leds[i];
        const hsv = ColorUtils.RGBtoHSV(...ColorUtils.clamp(...color));
        const newHSV = [oh, os, hsv[2], hsv[3]];
        hsv[0] = oh;
        hsv[1] *= os;
        const newColor = ColorUtils.HSVtoRGB(...newHSV);
        leds[i] = ColorUtils.mix(color, newColor, this.config.overrideColor);
      }
    }

    updateConfig(config) {
      super.updateConfig(config);
    }

    toString() { return `OverrideColor(${super.toString()})`; }

    static presets() {
      return WrappedProgram.presets ? WrappedProgram.presets() : {};
    }

    static configSchema() {
      return Object.assign(super.configSchema(), {
        overrideColor: { type: Number, min: 0, max: 1, step: 0.01, default: 0 },
        overrideHue: { type: Number, min: 0, max: 1, step: 0.01, default: 0 },
        overrideSat: { type: Number, min: 0, max: 1, step: 0.01, default: 0 },
      });
    }
  }
}
