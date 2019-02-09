const SoundBasedFunction = require("./../base-programs/SoundBasedFunction");
const ColorUtils = require("./../utils/ColorUtils");
const _ = require('lodash');

function findBounds(values) {
  let min = null;
  let max = null;
  values.forEach(value => {
    if (min == null || value < min) {
      min = value;
    }
    if (max == null || value > max) {
      max = value
    }
  });
  return {
    min: min,
    max: max,
    center: Math.round(min + max / 2),
    scale: max - min,
  }
}

module.exports = class Func extends SoundBasedFunction {
  constructor(config, leds) {
    super(config, leds);

    const self = this;
    const geometry = this.position || this.geometry;
    this.xBounds = findBounds(geometry.x);
    this.yBounds = findBounds(geometry.y);
  }

  drawFrame(draw, done) {
    const colors = new Array(this.numberOfLeds)
    const geometry = this.position || this.geometry;

    const centerChannel = this.currentAudioFrame.center;
    if (!centerChannel) {
      done();
    }
    const vol = this.averageRelativeVolumeSmoothed;
    const centerX = (
      this.xBounds.center +
      .25 * this.xBounds.scale *
        Math.cos(this.timeInMs * this.config.velocidad / 700)
    );
    const centerY = (
      this.yBounds.center +
      .25 * this.yBounds.scale *
        Math.sin(this.timeInMs * this.config.velocidad / 800)
    );

    for (let i = 0; i < this.numberOfLeds; i++) {
      const x = geometry.x[i];
      const y = geometry.y[i];
      const rx = x - centerX;
      const ry = y - centerY;
      const r = Math.sqrt(Math.pow(rx, 2) + Math.pow(ry, 2));
      const theta = Math.acos(rx / r);
      const radiusFactor = (
        .2 * Math.sin(this.timeInMs / 1000) +
        .2 * this.config.escala +
        10 * centerChannel.filteredBands.bass.rms
      );
      const h = 
        (r*.1 + this.timeInMs * this.config.velocidad / 10000) % 1;
      const s = Math.min(0.1 + 1000*centerChannel.filteredBands.high.rms, 1);
      const v = Math.pow(Math.sin(r * radiusFactor + theta), 10)/Math.pow(r, 1);
      const color = ColorUtils.HSVtoRGB(h, s, v);
      colors[i] = color;
    }

    draw(colors)
    done();
  }

  static presets() {
    return {
      "default": {velocidad: 0.4, whiteBorder: true},
      "gold": {velocidad: 0.1, whiteBorder: false, escala: 0.5, color: 0.42}
    }
  }

  // Override and extend config Schema
  static configSchema() {
    let res = super.configSchema();
    res.escala = {type: Number, min: 0.01, max: 5, step: 0.01, default: 1}
    res.color = {type: Number, min: 0, max: 1, step: 0.01, default: 0}
    res.velocidad = {type: Number, min: -3, max: 3, step: 0.01, default: 0.6}
    res.whiteBorder = {type: Boolean, default: false}
    return res;
  }
}
