const _ = require("lodash")

const LightProgram = require("./../base-programs/LightProgram");
const ColorUtils = require("./../utils/ColorUtils");
const {loadGradient} = require("../utils/gradients");

module.exports = class RadialSun extends LightProgram {

  init() {
    this.baseHue = Math.random();
  }

  drawFrame(draw, audio) {
    if (!audio.ready) {
      return;
    }
    audio = audio.currentFrame;
    const colors = new Array(this.numberOfLeds);
    const elapsed = this.timeInMs / 1000;

    const vol = audio[this.config.soundMetric] || Number.EPSILON;
    this.extraTime = (this.extraTime || 0) + vol * 5;
    let power = this.config.power;
    if (this.config.animatePower) {
      power = 3 + 3 * Math.cos((Math.PI * elapsed) / 10);
    }

    for (let i = 0; i < this.numberOfLeds; i++) {
      let geometry = this.geometry;

      const dx = 0 * (geometry.x[i] - geometry.width / 2 - this.config.centerX);
      const dy = geometry.y[i] - geometry.height + this.config.centerY; // 18 is the offset

      const distance = Math.max(
        0,
        1 - Math.sqrt(dx * dx + dy * dy) / (this.config.escala * vol)
      );

      const v = distance;

      const gradient = loadGradient(this.config.colorMap);
      const energy = Math.pow(v, power);

      if(gradient) {
        const [r, g, b, a] = gradient.colorAt(1 - energy);
        colors[i] = [energy*r,energy*g,energy*b,1]
      } else {
        colors[i] = ColorUtils.HSVtoRGB(
            (this.baseHue + this.extraTime / 5000) % 1,
            this.config.saturation,
            energy
        );
      }
    }
    draw(colors);
  }

  static presets() {
    return {
      fromBottom: {
        escala: 70,
        centerY: -20,
        soundMetric: "bassPeakDecay",
        power: 2
      },
      fromTop: {
        escala: 70,
        centerY: 62,
        soundMetric: "bassPeakDecay",
        power: 2
      },
      bassCenter: {
        escala: 70,
        centerY: 35.4,
        power: 10,
        soundMetric: "bassFastPeakDecay"
      },
      fromBottomAnimatedPower: {
        escala: 70,
        centerY: -20,
        soundMetric: "bassPeakDecay",
        power: 2,
        animatePower: true
      }
    };
  }

  // Override and extend config Schema
  static configSchema() {
    let res = super.configSchema();
    res.escala = { type: Number, min: 1, max: 200, step: 1, default: 70 };
    res.centerY = { type: Number, min: -40, max: 80, step: 0.1, default: 0 };
    res.centerX = { type: Number, min: -50, max: 50, step: 0.1, default: 0 };
    res.power = { type: Number, min: 0, max: 10, step: 0.1, default: 3 };
    res.saturation = { type: Number, min: 0, max: 1, step: 0.01, default: 1 };
    res.soundMetric = {
      type: String,
      values: [
        "fastPeakDecay",
        "bassFastPeakDecay",
        "midFastPeakDecay",
        "highFastPeakDecay"
      ],
      default: "fastPeakDecay"
    };
    res.animatePower = { type: Boolean, default: false };
    res.colorMap =  {
      type: 'gradient',
      default: '',
    };
    return res;
  }
};
