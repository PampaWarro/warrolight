const LightProgram = require("./../base-programs/LightProgram");
const ColorUtils = require("./../utils/ColorUtils");
const depthLayers = require("../utils/depthLayers");

const clamp01 = x => Math.min(1, Math.max(0, x));
const smoothstep = (a, b, x) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

// Eco espectral. La primera capa es un ecualizador: del centro hacia afuera van
// los graves, los medios y los agudos, y cada banda sube desde el piso según su
// volumen. Las otras capas repiten lo mismo con retardo y cada vez más tenue,
// como un eco, así que el sonido se ve viajar en profundidad y los tres
// juntos forman un espectrograma en 3D.
module.exports = class DepthEcho extends LightProgram {
  init() {
    this.layers = depthLayers(this.geometry);
    // El ancho de cada capa, para repartir las bandas en toda su mitad.
    this.maxSide = new Array(this.layers.count).fill(1);
    for (let i = 0; i < this.numberOfLeds; i++) {
      const l = this.layers.layerOf[i];
      this.maxSide[l] = Math.max(this.maxSide[l], this.layers.side[i]);
    }
    this.history = [];
    this.lastTime = null;
    this.hue = Math.random();
  }

  // El sonido de hace `lag` segundos.
  sample(lag) {
    const target = this.timeInMs - lag * 1000;
    for (let k = this.history.length - 1; k >= 0; k--) {
      if (this.history[k].t <= target) return this.history[k];
    }
    return this.history[0];
  }

  drawFrame(leds, context) {
    const audio = (context.audio && context.audio.currentFrame) || {};
    this.lastTime = this.timeInMs;
    const g = this.geometry;
    const m = this.config.multiplier;
    const metric = this.config.metric;

    this.history.push({
      t: this.timeInMs,
      bass: clamp01((audio[`bass${metric}`] || 0) * m),
      mid: clamp01((audio[`mid${metric}`] || 0) * m),
      high: clamp01((audio[`high${metric}`] || 0) * m),
    });
    const lastLayer = Math.max(this.layers.count - 1, 1);
    const maxLag = lastLayer * this.config.echoDelay + 0.5;
    while (this.history.length > 2 && this.history[1].t < this.timeInMs - maxLag * 1000) this.history.shift();
    this.hue = (this.hue + this.config.hueSpeed / 1000) % 1;

    const samples = [];
    for (let l = 0; l < this.layers.count; l++) {
      const order = this.config.fromW ? l : lastLayer - l;
      samples[l] = {sound: this.sample(order * this.config.echoDelay), order};
    }

    for (let i = 0; i < this.numberOfLeds; i++) {
      const l = this.layers.layerOf[i];
      const {sound, order} = samples[l];
      const f = this.layers.side[i] / this.maxSide[l];
      const bass = Math.max(0, 1 - 2 * f), high = Math.max(0, 2 * f - 1), mid = 1 - bass - high;
      const level = bass * sound.bass + mid * sound.mid + high * sound.high;

      const rise = this.layers.rise[i];
      const bar = 1 - smoothstep(level - 0.08, level, rise);
      const peak = Math.exp(-Math.pow((rise - level) / 0.04, 2)) * (level > 0.05 ? 1 : 0);
      const fade = Math.pow(this.config.echoFade, order);
      const v = clamp01(bar * 0.7 + peak) * fade;

      // Graves rojos, medios verdes, agudos violetas, con un corrimiento por capa.
      const hue = (this.hue + f * this.config.hueSpread + order * this.config.layerHueShift) % 1;
      leds[i] = ColorUtils.HSVtoRGB(hue, 1 - peak * 0.7, v);
    }
  }

  static presets() {
    return {
      default: {},
      ecoLargo: {echoDelay: 0.6, echoFade: 0.85},
      delPublicoALaW: {fromW: false},
      ecoCorto: {echoDelay: 0.08, echoFade: 0.95, metric: "FastPeakDecay"},
      monocromo: {hueSpread: 0.1, layerHueShift: 0, hueSpeed: 0.2},
    };
  }

  static configSchema() {
    let res = super.configSchema();
    res.metric = {type: String, values: ["PeakDecay", "FastPeakDecay", "Rms", "FastRms"], default: "PeakDecay"};
    res.multiplier = {type: Number, min: 0, max: 3, step: 0.01, default: 1};
    // Segundos de retardo entre una capa y la siguiente.
    res.echoDelay = {type: Number, min: 0, max: 2, step: 0.01, default: 0.25};
    res.echoFade = {type: Number, min: 0.2, max: 1, step: 0.01, default: 0.85};
    res.fromW = {type: Boolean, default: true};
    res.hueSpread = {type: Number, min: 0, max: 1, step: 0.01, default: 0.75};
    res.layerHueShift = {type: Number, min: 0, max: 0.5, step: 0.01, default: 0.05};
    res.hueSpeed = {type: Number, min: 0, max: 10, step: 0.01, default: 0.1};
    return res;
  }
};
