const _ = require("lodash");
const {createNoise3D} = require("simplex-noise");
const LightProgram = require("./../base-programs/LightProgram");
const depthLayers = require("../utils/depthLayers");

const clamp01 = x => Math.min(1, Math.max(0, x));
const smoothstep = (a, b, x) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

const EYE_COLORS = [
  [255, 190, 0], // gato
  [255, 20, 0], // demonio
  [90, 255, 0], // bruja
  [170, 0, 255], // espectro
  [255, 90, 0], // calabaza
];

// Ojos en la oscuridad. En el negro se abren pares de ojos que miran, parpadean
// y se cierran. Como cada ojo vive en coordenadas espejadas, siempre aparecen de
// a pares simétricos en las dos mitades de un arco o de la W. Algunos son
// acechadores: cuando se cierran, vuelven a abrirse en la capa de adelante, más
// grandes, acercándose al público... y al llegar al último arco, susto.
module.exports = class EyesInTheDark extends LightProgram {
  init() {
    const g = this.geometry;
    this.noise = createNoise3D();
    this.layers = depthLayers(g);
    this.ax = this.layers.side;
    this.ledsByLayer = _.range(this.layers.count).map(l =>
      _.range(this.numberOfLeds).filter(i => this.layers.layerOf[i] === l && this.ax[i] > 2 && this.ax[i] < g.width * 0.3)
    );
    this.eyes = [];
    this.scare = 0;
    this.scareColor = EYE_COLORS[0];
    this.lastTime = null;
    this.untilNext = 0.5;
    this.lastBass = 0;
  }

  // Abre un par de ojos en la capa `layer`, cerca de `near` si se da.
  open(layer, near, color, stalker) {
    const candidates = this.ledsByLayer[layer];
    if (!candidates.length) return;
    let i;
    if (near) {
      i = _.minBy(_.sampleSize(candidates, 40), j =>
        Math.abs(this.layers.rise[j] - near.rise) * 3 + Math.abs(this.ax[j] - near.ax) / this.geometry.width + Math.random() * 0.2
      );
    } else {
      i = _.sample(candidates);
    }
    const lastLayer = Math.max(this.layers.count - 1, 1);
    this.eyes.push({
      layer,
      ax: this.ax[i],
      y: this.geometry.y[i],
      rise: this.layers.rise[i],
      z: this.geometry.z[i],
      color: color || _.sample(EYE_COLORS),
      size: this.config.size * (0.7 + 0.8 * layer / lastLayer),
      age: 0,
      life: 2 + Math.random() * 4,
      nextBlink: 0.8 + Math.random() * 2,
      blink: 0,
      stalker: stalker === undefined ? Math.random() < this.config.stalkers : stalker,
      lookPhase: Math.random() * 10,
    });
  }

  drawFrame(leds, context) {
    const audio = (context.audio && context.audio.currentFrame) || {};
    const dt = this.lastTime === null ? 1 / 60 : Math.min(0.1, (this.timeInMs - this.lastTime) / 1000);
    this.lastTime = this.timeInMs;
    const time = this.timeInMs / 1000;
    const g = this.geometry;

    const bass = audio[this.config.soundMetric] || 0;
    const flare = clamp01(bass * this.config.music);
    const beat = bass > 0.6 && bass - this.lastBass > 0.25;
    this.lastBass = bass;

    this.untilNext -= dt * (1 + flare);
    if (this.untilNext <= 0 && this.eyes.length < this.config.maxEyes) {
      // Los nuevos aparecen más bien atrás, para que los acechadores tengan camino.
      const layer = Math.random() < 0.6 ? 0 : _.random(0, this.layers.count - 1);
      this.open(layer);
      this.untilNext = -Math.log(1 - Math.random()) / this.config.eyesPerSecond;
    }

    const lastLayer = this.layers.count - 1;
    const survivors = [];
    for (const e of this.eyes) {
      e.age += dt;
      e.nextBlink -= dt;
      if (e.nextBlink <= 0 || (beat && Math.random() < 0.3)) {
        e.blink = 0.18;
        e.nextBlink = 1 + Math.random() * 3;
      }
      e.blink = Math.max(0, e.blink - dt);
      if (e.age < e.life + 0.6) {
        survivors.push(e);
      } else if (e.stalker) {
        if (e.layer < lastLayer) {
          this.open(e.layer + 1, e, e.color, true);
        } else {
          this.scare = 1;
          this.scareColor = e.color;
        }
      }
    }
    this.eyes = survivors;
    this.scare = Math.max(0, this.scare - dt * 1.5);

    for (let i = 0; i < this.numberOfLeds; i++) {
      const ax = this.ax[i], y = g.y[i], z = g.z[i];
      const l = this.layers.layerOf[i];

      // Oscuridad que respira, apenas violeta.
      const dark = this.config.ambient * (0.5 + 0.5 * this.noise(ax * 0.03, y * 0.03, time * 0.1 + l));
      let r = 25 * dark, gg = 0, b = 45 * dark;

      for (const e of this.eyes) {
        if (e.layer !== l) continue;
        const openness = smoothstep(0, 0.5, e.age) * (1 - smoothstep(e.life, e.life + 0.6, e.age)) * (e.blink > 0 ? 0.05 : 1);
        if (openness <= 0) continue;
        // Miran para los costados de a poco.
        const look = Math.sin(time * 0.7 + e.lookPhase) * e.size * 0.3;
        const dx = (ax - e.ax - look) / (e.size * 1.4);
        const dy = (y - e.y) / (e.size * (0.25 + 0.55 * openness));
        const d2 = dx * dx + dy * dy;
        if (d2 > 9) continue;
        const v = openness * Math.exp(-d2) * (0.7 + 0.5 * flare);
        const core = smoothstep(0.55, 1, v);
        r += v * (e.color[0] + (255 - e.color[0]) * core * 0.6);
        gg += v * (e.color[1] + (255 - e.color[1]) * core * 0.4);
        b += v * (e.color[2] + (255 - e.color[2]) * core * 0.3);
      }

      // El susto: el último arco se prende entero del color de los ojos.
      if (this.scare > 0 && l === lastLayer) {
        const s = this.scare * this.scare * (0.6 + 0.4 * Math.sin(time * 60));
        r += this.scareColor[0] * s;
        gg += this.scareColor[1] * s;
        b += this.scareColor[2] * s;
      }

      leds[i] = [Math.min(255, r), Math.min(255, gg), Math.min(255, b)];
    }
  }

  static presets() {
    return {
      default: {},
      muchosOjos: {eyesPerSecond: 2, maxEyes: 14, stalkers: 0.1},
      teSiguen: {eyesPerSecond: 0.4, maxEyes: 3, stalkers: 1, size: 1.6},
      silencio: {music: 0, ambient: 0, eyesPerSecond: 0.5},
    };
  }

  static configSchema() {
    let res = super.configSchema();
    res.soundMetric = {type: 'soundMetric', default: "bassPeakDecay"};
    res.music = {type: Number, min: 0, max: 2, step: 0.01, default: 0.8};
    res.eyesPerSecond = {type: Number, min: 0.05, max: 6, step: 0.05, default: 0.9};
    res.maxEyes = {type: Number, min: 1, max: 30, step: 1, default: 8};
    // Probabilidad de que un par de ojos se vaya acercando capa por capa.
    res.stalkers = {type: Number, min: 0, max: 1, step: 0.01, default: 0.3};
    res.size = {type: Number, min: 0.4, max: 5, step: 0.05, default: 1.2};
    res.ambient = {type: Number, min: 0, max: 1, step: 0.01, default: 0.4};
    return res;
  }
};
