const LightProgram = require("./../base-programs/LightProgram");
const ColorUtils = require("./../utils/ColorUtils");
const _ = require('lodash');

module.exports = class MusicFrequencyDot extends LightProgram {

  init() {
    this.lastVolume = new Array(this.numberOfLeds).fill([0, 0, 0]);
    this.time = 0;
    this.maxVolume = 0;
    this.hueOffset = Math.random();
    this.frameNumber = 0; // TODO: frameNumber is an antipattern, use time-dependent variables
    this.densityInvariantLength = _.sumBy(this.geometry.density, v => 1/v);
  }

  drawFrame(leds, context) {
    let audio = context.audio;
    if (audio.ready) {
      let [,mic,,metric] = (this.config.soundMetric || 'bassPeakDecay') .match(/(\w+_)?(bass|mid|high)?(.+)/);

      metric = _.upperFirst(metric);
      mic = mic || '';

      let bassValue = audio.currentFrame[`${mic}bass${metric}`]
      let midValue = audio.currentFrame[`${mic}mid${metric}`]
      let highValue = audio.currentFrame[`${mic}high${metric}`]

      let power = this.config.power; // To create contrast
      let bass = Math.pow(bassValue, power); //*(bassMax/total);
      let r = Math.round(255 * bass * this.config.multiplier);

      let mid = Math.pow(midValue, power); //*(midMax/total);
      let g = Math.round(255 * mid * this.config.multiplier);

      let high = Math.pow(highValue, power); //*(highMax/total);
      let b = Math.round(255 * high * this.config.multiplier);

      let [h, s, br] = ColorUtils.RGBtoHSV(r, g, b);
      h = (h + this.hueOffset) % 1;
      if(this.config.blackAndWhite) {
        [r, g, b] = ColorUtils.HSVtoRGB(h, 0, br);
      } else {
        [r, g, b] = ColorUtils.HSVtoRGB(h,s**0.5, br);
      }


      let intensity = audio.currentFrame[this.config.soundMetric || 'bassPeakDecay'];

      let densityInvariantLength = 0;
      for (let i = 0; i < this.numberOfLeds; i += 1) {
        let j = i;
        if (this.config.move) {
          j = (j + this.frameNumber) % this.lastVolume.length;
        }

        let width = Math.round(this.densityInvariantLength / (this.config.numberOfOnLeds));

        let explosionLength = Math.ceil((Math.pow(intensity, power) * width) / 3);


        if (Math.abs(((densityInvariantLength % width) - width / 2)) < explosionLength) {
          this.lastVolume[j] = [r, g, b];
        } else {
          this.lastVolume[j] = [0, 0, 0];
        }
        densityInvariantLength += 1/this.geometry.density[j];
      }
    }

    this.frameNumber++;

    leds.forEach((v, i) => {
      leds[i] = this.lastVolume[i];
    });
  }

  static presets() {
    return {
      symetry8Move: { move: true, numberOfOnLeds: 8, power: 2, multiplier: 1 },
      symetry8Slow: { move: false, numberOfOnLeds: 8, power: 2, multiplier: 1 },
      symetry8SlowRed: { move: false, numberOfOnLeds: 16, power: 3 },
      leds24: { move: false, numberOfOnLeds: 24 },
      leds20HighPower: { move: true, numberOfOnLeds: 20, power: 4 }
    };
  }

  // Override and extend config Schema
  static configSchema() {
    let res = super.configSchema();
    res.multiplier = { type: Number, min: 0, max: 2, step: 0.01, default: 1 };
    res.move = { type: Boolean, default: false };
    res.blackAndWhite = { type: Boolean, default: false };
    res.soundMetric = {type: 'soundMetric', default: "bassFastPeakDecay"};
    res.power = { type: Number, min: 1, max: 20, step: 0.1, default: 2 };
    res.numberOfOnLeds = {type: Number, min: 1, max: 100, step: 1, default: 40};
    res.cutThreshold = {type: Number, min: 0, max: 1, step: 0.01, default: 0.45};
    return res;
  }
};
