const LightProgram = require("./../base-programs/LightProgram");
const ColorUtils = require("./../utils/ColorUtils");
const {loadGradient} = require("../utils/gradients");

const clamp01 = x => Math.min(1, Math.max(0, x));

// Un tomógrafo: planos de luz paralelos que atraviesan el volumen de la W y los
// arcos. El ángulo de los planos va girando de a poco: cuando están parados
// cortan capa por capa (la luz salta de la W al primer arco y al segundo),
// cuando están acostados son líneas horizontales que suben en todas las capas a
// la vez, y en el medio son cortes diagonales que suben mientras avanzan hacia
// el público. El plano sólo gira alrededor del eje horizontal, así que el corte
// es siempre simétrico.
module.exports = class SlicePlanes extends LightProgram {
  init() {
    this.phase = 0;
    this.angle = this.config.angle;
    this.hue = Math.random();
  }

  drawFrame(leds, context) {
    const audio = (context.audio && context.audio.currentFrame) || {};
    const vol = Math.min(1, (audio[this.config.soundMetric] || 0) * this.config.multiplier);
    const g = this.geometry;
    const time = this.timeInMs / 1000;

    this.phase += (this.config.speed + vol * this.config.musicSpeed) / 60;
    this.hue = (this.hue + this.config.hueSpeed / 1000) % 1;
    // El ángulo se mece alrededor del configurado.
    const angle = (this.config.angle + this.config.swing * Math.sin(time * this.config.swingSpeed)) * Math.PI / 180;
    const ny = Math.sin(angle), nz = Math.cos(angle);

    const gradient = loadGradient(this.config.colorMap);
    const height = Math.max(g.height, 1), depth = Math.max(g.depth, 1);
    const spacing = this.config.spacing;
    const thickness = this.config.thickness * (1 + vol * this.config.musicThickness);

    for (let i = 0; i < this.numberOfLeds; i++) {
      // Coordenadas normalizadas, para que la profundidad y la altura pesen igual.
      const up = 1 - g.y[i] / height;
      const front = g.z[i] / depth;
      const p = (up * ny + front * nz) / spacing - this.phase;
      const plane = Math.floor(p);
      const offset = p - plane - 0.5;
      const v = Math.exp(-(offset * offset) / (thickness * thickness));
      const level = this.config.minBrightness + (1 - this.config.minBrightness) * v;

      if (gradient) {
        const [r, gg, b] = gradient.colorAt(clamp01(((plane * 0.37) % 1 + 1) % 1)) || [0, 0, 0];
        leds[i] = [r * level, gg * level, b * level];
      } else {
        const hue = ((this.hue + plane * this.config.hueStep) % 1 + 1) % 1;
        leds[i] = ColorUtils.HSVtoRGB(hue, this.config.saturation * (1 - 0.6 * v * v), level);
      }
    }
  }

  static presets() {
    return {
      default: {},
      capaPorCapa: {angle: 0, swing: 0, spacing: 1.2, thickness: 0.12, speed: 0.5},
      horizontes: {angle: 90, swing: 10, spacing: 0.5, speed: 0.3},
      diagonalLoca: {angle: 45, swing: 80, swingSpeed: 0.4, spacing: 0.35, thickness: 0.08},
      escaner: {spacing: 2, thickness: 0.05, speed: 0.25, musicSpeed: 0.5, saturation: 0.3, hueStep: 0},
    };
  }

  static configSchema() {
    let res = super.configSchema();
    res.soundMetric = {type: 'soundMetric', default: "bassPeakDecay"};
    res.multiplier = {type: Number, min: 0, max: 3, step: 0.01, default: 1};
    // 0: planos parados que avanzan en profundidad. 90: planos acostados que suben.
    res.angle = {type: Number, min: -90, max: 90, step: 1, default: 35};
    res.swing = {type: Number, min: 0, max: 90, step: 1, default: 35};
    res.swingSpeed = {type: Number, min: 0, max: 2, step: 0.01, default: 0.15};
    res.speed = {type: Number, min: -3, max: 3, step: 0.01, default: 0.35};
    res.musicSpeed = {type: Number, min: -5, max: 5, step: 0.01, default: 0.8};
    // Distancia entre planos, en fracciones de la geometría.
    res.spacing = {type: Number, min: 0.1, max: 3, step: 0.01, default: 0.6};
    res.thickness = {type: Number, min: 0.02, max: 0.5, step: 0.01, default: 0.15};
    res.musicThickness = {type: Number, min: 0, max: 3, step: 0.01, default: 0.8};
    res.minBrightness = {type: Number, min: 0, max: 0.5, step: 0.01, default: 0.03};
    res.hueStep = {type: Number, min: 0, max: 0.5, step: 0.01, default: 0.13};
    res.hueSpeed = {type: Number, min: 0, max: 10, step: 0.01, default: 0.4};
    res.saturation = {type: Number, min: 0, max: 1, step: 0.01, default: 1};
    res.colorMap = {type: "gradient", default: ""};
    return res;
  }
};
