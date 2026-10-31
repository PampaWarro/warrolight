const {createNoise3D} = require("simplex-noise");
const LightProgram = require("./../base-programs/LightProgram");
const ColorUtils = require("./../utils/ColorUtils");
const depthLayers = require("../utils/depthLayers");

const clamp01 = x => Math.min(1, Math.max(0, x));
const smoothstep = (a, b, x) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

// Foco de cámara. Como una cámara de cine que cambia el foco de un plano a otro:
// la capa enfocada (la W o uno de los arcos) muestra una textura nítida, de
// bordes duros, brillante y saturada; las capas fuera de foco se ven borrosas,
// más tenues y lavadas, como un bokeh. El foco se va paseando entre las capas,
// y con un golpe de bajo puede saltar de golpe.
module.exports = class RackFocus extends LightProgram {
  init() {
    this.noise = createNoise3D();
    this.layers = depthLayers(this.geometry);
    this.focus = this.layers.z[0];
    this.focusVelocity = 0;
    this.target = this.focus;
    this.untilNext = this.config.focusSeconds;
    this.lastTime = null;
    this.lastBass = 0;
    this.hue = Math.random();
  }

  pickTarget() {
    const zs = this.layers.z.filter(z => Math.abs(z - this.target) > 1);
    this.target = zs.length ? zs[Math.floor(Math.random() * zs.length)] : this.target;
  }

  drawFrame(leds, context) {
    const audio = (context.audio && context.audio.currentFrame) || {};
    const dt = this.lastTime === null ? 1 / 60 : Math.min(0.1, (this.timeInMs - this.lastTime) / 1000);
    this.lastTime = this.timeInMs;
    const time = this.timeInMs / 1000;
    const g = this.geometry;
    const depth = Math.max(g.depth, 1);

    const bass = audio[this.config.soundMetric] || 0;
    const beat = bass > 0.6 && bass - this.lastBass > 0.25;
    this.lastBass = bass;

    this.untilNext -= dt;
    if (this.untilNext <= 0 || (beat && Math.random() < this.config.beatJumps)) {
      this.pickTarget();
      this.untilNext = this.config.focusSeconds * (0.6 + Math.random() * 0.8);
    }
    // Resorte críticamente amortiguado: el foco llega suave, sin rebotar.
    const w = 2 * Math.PI / Math.max(this.config.glideSeconds, 0.05);
    this.focusVelocity += (w * w * (this.target - this.focus) - 2 * w * this.focusVelocity) * dt;
    this.focus += this.focusVelocity * dt;
    this.hue = (this.hue + this.config.hueSpeed / 1000) % 1;

    const scale = this.config.scale;
    const flow = time * this.config.speed;

    for (let i = 0; i < this.numberOfLeds; i++) {
      const side = this.layers.side[i], y = g.y[i], z = g.z[i];
      // 0 en foco, 1 bien desenfocado.
      const blur = clamp01(Math.abs(z - this.focus) / (depth * this.config.depthOfField));
      // Al desenfocar, la textura pierde detalle y los bordes se ablandan.
      const s = scale * (1 - 0.6 * blur);
      const n = this.noise(side * s, y * s - flow, z * 0.01 + flow * 0.3) * 0.5 + 0.5;
      const edge = 0.03 + 0.45 * blur;
      const pattern = smoothstep(0.55 - edge, 0.55 + edge, n);

      const v = pattern * (1 - this.config.blurDim * blur) + 0.05 * (1 - blur) * (1 + bass);
      const hue = (this.hue + n * this.config.hueSpread + this.layers.layerOf[i] * 0.07) % 1;
      leds[i] = ColorUtils.HSVtoRGB(hue, this.config.saturation * (1 - 0.6 * blur), clamp01(v));
    }
  }

  static presets() {
    return {
      default: {},
      lento: {focusSeconds: 10, glideSeconds: 4, speed: 0.2},
      nervioso: {focusSeconds: 2, glideSeconds: 0.5, beatJumps: 0.5, speed: 1.2},
      detalle: {scale: 0.35, depthOfField: 0.25, blurDim: 0.85},
      pastel: {saturation: 0.45, hueSpread: 0.5},
    };
  }

  static configSchema() {
    let res = super.configSchema();
    res.soundMetric = {type: 'soundMetric', default: "bassPeakDecay"};
    res.focusSeconds = {type: Number, min: 0.5, max: 30, step: 0.1, default: 5};
    res.glideSeconds = {type: Number, min: 0.1, max: 10, step: 0.05, default: 1.8};
    // Probabilidad de que un golpe de bajo haga saltar el foco.
    res.beatJumps = {type: Number, min: 0, max: 1, step: 0.01, default: 0.1};
    // Qué tan rápido se desenfoca al alejarse del foco (fracción de la profundidad).
    res.depthOfField = {type: Number, min: 0.05, max: 1.5, step: 0.01, default: 0.45};
    res.blurDim = {type: Number, min: 0, max: 1, step: 0.01, default: 0.6};
    res.scale = {type: Number, min: 0.02, max: 1, step: 0.01, default: 0.15};
    res.speed = {type: Number, min: 0, max: 3, step: 0.01, default: 0.5};
    res.hueSpread = {type: Number, min: 0, max: 1, step: 0.01, default: 0.25};
    res.hueSpeed = {type: Number, min: 0, max: 10, step: 0.01, default: 0.5};
    res.saturation = {type: Number, min: 0, max: 1, step: 0.01, default: 1};
    return res;
  }
};
