const SoundBasedFunction = require("./../base-programs/SoundBasedFunction");
const ColorUtils = require("./../utils/ColorUtils");

function findBounds(values) {
  let min = null;
  let max = null;
  values.forEach(value => {
    if (min == null || value < min) {
      min = value;
    }
    if (max == null || value > max) {
      max = value;
    }
  });
  return {
    min: min,
    max: max,
    center: Math.round(min + max / 2),
    scale: max - min
  };
}

module.exports = class Circles extends SoundBasedFunction {
  constructor(config, leds) {
    super(config, leds);

    const geometry = this.position || this.geometry;
    this.xBounds = findBounds(geometry.x);
    this.yBounds = findBounds(geometry.y);
  }

  drawFrame(draw, audio) {
    const colors = new Array(this.numberOfLeds);
    const geometry = this.position || this.geometry;

    const centerChannel = audio.currentAudioFrame.center;
    if (!centerChannel) {
      return;
    }
    const normalizedBass =
      centerChannel.filteredBands.bass.movingStats.rms.slow.normalizedValue;
    const centerX =
      this.xBounds.center +
      0.25 *
        this.xBounds.scale *
        Math.cos((this.timeInMs * this.config.velocidad) / 700);
    const centerY =
      this.yBounds.center +
      0.25 *
        this.yBounds.scale *
        Math.sin((this.timeInMs * this.config.velocidad) / 800);
    const maxScale = Math.max(this.xBounds.scale, this.yBounds.scale);

    for (let i = 0; i < this.numberOfLeds; i++) {
      const x = geometry.x[i];
      const y = geometry.y[i];
      const rx = x - centerX;
      const ry = y - centerY;
      const r = Math.sqrt(Math.pow(rx, 2) + Math.pow(ry, 2));
      const normalizedR = (2 * r) / maxScale;
      const theta = Math.acos(rx / r);
      const radiusFactor =
        0.2 * Math.sin(this.timeInMs / 1000) +
        0.2 * this.config.escala +
        0.2 * centerChannel.filteredBands.bass.rms;
      const h = (r * 0.1 + (this.timeInMs * this.config.velocidad) / 10000) % 1;
      const s = 1 / (1 + normalizedR);
      const v =
        (0.01 + 0.99 * Math.pow(normalizedBass, 8)) *
        Math.pow(Math.sin(r * radiusFactor + theta), 10); ///Math.pow(r, 1);
      const color = ColorUtils.HSVtoRGB(h, s, v);
      colors[i] = color;
    }

    draw(colors);
  }

  static presets() {
    return {
      default: { velocidad: 0.6, escala: 1 },
      slow: { velocidad: 0.1, escala: 1 }
    };
  }

  // Override and extend config Schema
  static configSchema() {
    let res = super.configSchema();
    res.escala = { type: Number, min: 0.01, max: 5, step: 0.01, default: 1 };
    res.velocidad = { type: Number, min: 0, max: 3, step: 0.01, default: 0.6 };
    return res;
  }
};
