const LightProgram = require("./../base-programs/LightProgram");
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

module.exports = class Circles extends LightProgram {
  constructor(config, geometry) {
    super(config, geometry);

    this.xBounds = findBounds(geometry.x);
    this.yBounds = findBounds(geometry.y);
    this.zBounds = findBounds(geometry.z);

    this.STATIC_VALUE = 0.001;
    this.normalizedAudio = this.STATIC_VALUE;
  }

  tap() {
    this.normalizedAudio = 0.9;
  }

  drawFrame(colors, context) {
    const normalizedAudio = this.normalizedAudio;
    if(this.normalizedAudio > this.STATIC_VALUE) {
      this.normalizedAudio -= 0.05;
    } else {
      this.normalizedAudio = this.STATIC_VALUE;
    }
    
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
    const centerZ =
      this.zBounds.center +
      0.25 *
        this.zBounds.scale *
        Math.sin((this.timeInMs * this.config.velocidad) / 900);
    const maxScale =
        Math.max(this.xBounds.scale, this.yBounds.scale, this.zBounds.scale);

    for (let i = 0; i < this.numberOfLeds; i++) {
      const x = this.geometry.x[i];
      const y = this.geometry.y[i];
      const z = this.geometry.z[i];
      const rx = x - centerX;
      const ry = y - centerY;
      const rz = z - centerZ;
      const r = Math.sqrt(Math.pow(rx, 2) + Math.pow(ry, 2), + Math.pow(z, 2));
      const normalizedR = (2 * r) / maxScale;
      const radiusFactor =
        0.2 * Math.sin(this.timeInMs / 1000) +
        0.2 * this.config.escala +
        0.2 * normalizedAudio;
      const h = (r * 0.1 + (this.timeInMs * this.config.velocidad) / 10000) % 1;
      const s = 1 / (1 + normalizedR);
      const v =
        (0.01 + 0.99 * Math.pow(normalizedAudio, 8)) *
        Math.pow(Math.sin(r * radiusFactor), 10);
      const color = ColorUtils.HSVtoRGB(h, s, v);
      colors[i] = color;
    }
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
    res.soundMetric = {type: 'soundMetric', default: "bassPeakDecay"};
    return res;
  }
};
