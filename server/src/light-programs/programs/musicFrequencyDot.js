const LightProgram = require("./../base-programs/LightProgram");
const ColorUtils = require("./../utils/ColorUtils");

module.exports = class MusicFrequencyDot extends LightProgram {

  init() {
    this.lastVolume = new Array(this.numberOfLeds + 1).fill([0, 0, 0]);
    this.time = 0;
    this.maxVolume = 0;
    this.hueOffset = Math.random();
    this.frameNumber = 0; // TODO: frameNumber is an antipattern, use time-dependent variables
  }

  drawFrame(draw, audio) {
    if (audio.ready) {
      let {
        bassRms,
        bassPeakDecay,
        bassMax,
        midRms,
        midPeakDecay,
        midMax,
        highRms,
        highPeakDecay,
        highMax
      } = audio.currentFrame;
      //let total = bassMax+midMax+highMax;

      let power = this.config.power; // To create contrast
      let bass = Math.pow(bassPeakDecay, power); //*(bassMax/total);
      let r = Math.round(255 * bass * this.config.multiplier);

      let mid = Math.pow(midPeakDecay, power); //*(midMax/total);
      let g = Math.round(255 * mid * this.config.multiplier);

      let high = Math.pow(highPeakDecay, power); //*(highMax/total);
      let b = Math.round(255 * high * this.config.multiplier);

      let [h, s, br] = ColorUtils.RGBtoHSV(r, g, b);
      h = (h + this.hueOffset) % 1;
      [r, g, b] = ColorUtils.HSVtoRGB(h, Math.sqrt(s), br);

      let width = Math.round(this.numberOfLeds / this.config.numberOfOnLeds);

      for (let i = 0; i < this.numberOfLeds; i += 1) {
        let rms = bassPeakDecay;
        let explosionLength = Math.ceil((Math.pow(rms, power) * width) / 3);

        let offsettedPosition = i % this.lastVolume.length;
        if (this.config.move) {
          offsettedPosition = (i + this.frameNumber) % this.lastVolume.length;
        }

        if (Math.abs((i % width) - width / 2) < explosionLength) {
          this.lastVolume[offsettedPosition] = [r, g, b];
        } else {
          this.lastVolume[offsettedPosition] = [0, 0, 0];
        }
      }
    }

    this.frameNumber++;

    draw(this.lastVolume);
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
    res.power = { type: Number, min: 1, max: 20, step: 1, default: 2 };
    res.numberOfOnLeds = {type: Number, min: 1, max: 100, step: 1, default: 40};
    res.cutThreshold = {type: Number, min: 0, max: 1, step: 0.01, default: 0.45};
    return res;
  }
};
