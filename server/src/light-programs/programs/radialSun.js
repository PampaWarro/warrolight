const _ = require("lodash")

const LightProgram = require("./../base-programs/LightProgram");
const ColorUtils = require("./../utils/ColorUtils");
const {loadGradient} = require("../utils/gradients");

module.exports = class RadialSun extends LightProgram {

  init() {
    this.baseHue = Math.random();
    this.relativeBottom = _.min(this.geometry.y);
    this.relativeTop = _.max(this.geometry.y);
    this.globalBottom = 0;
    this.globalTop = this.geometry.height;
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

    let height, baselineY;
    if(this.config.relative) {
      height = this.relativeTop - this.relativeBottom;
      baselineY = this.config.fromTop ? this.relativeBottom : this.relativeTop;
    } else {
      height = this.geometry.height;
      baselineY = this.config.fromTop ? this.globalBottom : this.globalTop;
    }

    for (let i = 0; i < this.numberOfLeds; i++) {
      let geometry = this.geometry;


      let distance = 0;

      if(this.config.radialDistance) {
        const dx = geometry.x[i] - geometry.width/2 + this.config.centerX;
        const dy = geometry.y[i] - baselineY + this.config.centerY; // 18 is the offset

        distance = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy) / (height * this.config.escala * vol));
      } else {
        const dx = 0 * (geometry.x[i] - geometry.width / 2 - this.config.centerX);
        const dy = geometry.y[i] - baselineY + this.config.centerY; // 18 is the offset

        distance = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy) / (height * this.config.escala * vol));
      }

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
      fromBottom: {centerY: -20, soundMetric: "bassPeakDecay", power: 2},
      fromTop: {centerY: 62, soundMetric: "bassPeakDecay", power: 2},
      bassCenter: {centerY: 35.4, power: 10, soundMetric: "bassFastPeakDecay"},
      fromBottomAnimatedPower: {centerY: -20, soundMetric: "bassPeakDecay", power: 2, animatePower: true}
    };
  }

  // Override and extend config Schema
  static configSchema() {
    let res = super.configSchema();
    res.escala = { type: Number, min: 0.001, max: 10, step: 0.01, default: 1.5 };
    res.centerY = { type: Number, min: -40, max: 80, step: 0.1, default: 0 };
    res.centerX = { type: Number, min: -50, max: 50, step: 0.1, default: 0 };
    res.power = { type: Number, min: 0, max: 10, step: 0.1, default: 3 };
    res.saturation = { type: Number, min: 0, max: 1, step: 0.01, default: 1 };
    res.soundMetric = {type: 'soundMetric', default: "fastPeakDecay"};
    res.animatePower = { type: Boolean, default: false };
    res.radialDistance = { type: Boolean, default: false };
    res.relative = { type: Boolean, default: false };
    res.fromTop = { type: Boolean, default: false };
    res.colorMap =  {
      type: 'gradient',
      default: '',
    };
    return res;
  }
};
