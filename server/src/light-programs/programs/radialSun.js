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

  drawFrame(leds, context) {
    let audio = context.audio;
    if (!audio.ready) {
      return;
    }

    audio = audio.currentFrame;
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

      let dy = geometry.y[i] - baselineY + this.config.centerY; // 18 is the offset
      let dx = geometry.x[i] - geometry.width/2 + this.config.centerX;

      if(this.config.radialDistance) {
        distance = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy) / (height * this.config.escala * vol));
      } else {
        dx = 0;
        distance = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy) / (height * this.config.escala * vol));
      }

      const v = distance;

      const gradient = loadGradient(this.config.colorMap);
      const energy = Math.pow(v, power);

      if(gradient) {
        // TODO: fix bug where gradient can sometimes return undefined.
        const color = gradient.colorAt(1 - energy);
        const [r, g, b, a] = color ? color : [0, 0, 0, 1];
        leds[i] = [energy*r,energy*g,energy*b,1]
      } else {
        leds[i] = ColorUtils.HSVtoRGB(
            (this.baseHue + this.extraTime / 5000) % 1,
            this.config.saturation,
            energy
        );
      }
    }
  }

  getDebugHelpers() {
    let {centerX, centerY, relative, radialDistance, fromTop, escala} = this.config;

    let baseline = (fromTop ? 1 : -1) * this.geometry.height / 2;
    let h = (relative ? this.relativeTop - this.relativeBottom : this.geometry.height)*escala;

    let y = centerY + baseline;
    let x = - centerX;
    if(radialDistance) {
      return [
        {type: 'sphere', x, y, z: 0, r: h},
        {type: 'sphere', x, y, z: 0, r: 1}
      ];
    } else {
      return [
        // {type: 'box', x: centerX, y: 0, z: -baseline, secondary: true, w: this.geometry.width, h: this.geometry.depth, d: this.geometry.height},
        {type: 'rectangle', x, y: y + h, z: 0, w: this.geometry.width, h: this.geometry.depth, secondary: true},
        {type: 'plane', x, y, z: 0, w: this.geometry.width, h: this.geometry.depth},
        {type: 'rectangle', x, y: y - h, z: 0, w: this.geometry.width, h: this.geometry.depth, secondary: true},
      ];
    }
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
    res.centerY = { type: Number, min: -100, max: 100, step: 0.1, default: 0, id: 'center' };
    res.centerX = { type: Number, min: -100, max: 100, step: 0.1, default: 0, id: 'center' };
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
