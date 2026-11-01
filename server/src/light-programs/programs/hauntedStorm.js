const _ = require("lodash");
const {createNoise3D} = require("simplex-noise");
const LightProgram = require("./../base-programs/LightProgram");
const depthLayers = require("../utils/depthLayers");

const clamp01 = x => Math.min(1, Math.max(0, x));
const smoothstep = (a, b, x) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

const FOG_DARK = [20, 0, 35];
const FOG = [120, 0, 170];
const WITCHLIGHT = [70, 255, 30];
const BOLT = [230, 200, 255];

// Tormenta embrujada. Una niebla violeta viene desde atrás de la W y pasa por
// los arcos hacia el público, con vetas de luz verde de bruja. Cada tanto (y con
// los golpes de bajo) cae un rayo: baja desde lo alto de una capa por las dos
// mitades a la vez, y el relámpago rebota capa por capa, con retardo, como un
// trueno que viaja en profundidad.
module.exports = class HauntedStorm extends LightProgram {
  init() {
    const g = this.geometry;
    this.noise = createNoise3D();
    this.layers = depthLayers(g);
    this.ax = this.layers.side;
    this.flash = new Array(this.layers.count).fill(0);
    this.strikes = [];
    this.lastTime = null;
    this.untilNext = 2;
    this.lastBass = 0;
  }

  strike() {
    const count = this.layers.count;
    const origin = _.random(0, count - 1);
    const delay = this.config.thunderDelay;
    for (let l = 0; l < count; l++) {
      this.strikes.push({
        layer: l,
        // El rayo cae en una capa y el resplandor llega después a las otras.
        wait: Math.abs(l - origin) * delay,
        age: 0,
        main: l === origin,
        reach: l === origin ? 0.2 + Math.random() * 0.8 : 0,
        seed: Math.random() * 100,
        pulses: 1 + _.random(0, 2),
      });
    }
  }

  drawFrame(leds, context) {
    const audio = (context.audio && context.audio.currentFrame) || {};
    const dt = this.lastTime === null ? 1 / 60 : Math.min(0.1, (this.timeInMs - this.lastTime) / 1000);
    this.lastTime = this.timeInMs;
    const time = this.timeInMs / 1000;
    const g = this.geometry;
    const depth = Math.max(g.depth, 1);

    const bass = audio[this.config.soundMetric] || 0;
    const beat = bass > 0.7 && bass - this.lastBass > 0.3;
    this.lastBass = bass;

    this.untilNext -= dt;
    if (this.untilNext <= 0 || (beat && Math.random() < this.config.beatStrikes)) {
      this.strike();
      this.untilNext = -Math.log(1 - Math.random()) / this.config.strikesPerSecond;
    }

    this.flash.fill(0);
    const bolts = [];
    for (const s of this.strikes) {
      if (s.wait > 0) {
        s.wait -= dt;
        continue;
      }
      s.age += dt;
      // Parpadea un par de veces y se apaga.
      const pulse = Math.max(0, Math.cos(s.age * Math.PI * 2 * 7)) * Math.exp(-s.age * 5) * (s.age < s.pulses * 0.14 ? 1 : 0.3);
      this.flash[s.layer] = Math.max(this.flash[s.layer], pulse * (s.main ? 1 : 0.5));
      if (s.main) bolts.push({s, pulse});
    }
    this.strikes = this.strikes.filter(s => s.wait > 0 || s.age < 0.8);

    const fogSpeed = this.config.fogSpeed;
    for (let i = 0; i < this.numberOfLeds; i++) {
      const ax = this.ax[i], y = g.y[i], z = g.z[i];
      const l = this.layers.layerOf[i];
      const rise = this.layers.rise[i];

      // La niebla avanza en z hacia el público: la misma nube pasa por la W,
      // después por el primer arco y después por el segundo.
      const n = this.noise(ax * 0.06, y * 0.05 + time * 0.05, z * 0.025 - time * fogSpeed);
      const fog = smoothstep(-0.5, 0.9, n) * this.config.fog;
      const front = z / depth;
      let r = FOG_DARK[0] + (FOG[0] - FOG_DARK[0]) * fog;
      let gg = FOG_DARK[1] + (FOG[1] - FOG_DARK[1]) * fog;
      let b = FOG_DARK[2] + (FOG[2] - FOG_DARK[2]) * fog;
      const dim = 0.55 + 0.45 * front;
      r *= dim; gg *= dim; b *= dim;

      // Vetas de luz de bruja.
      const vein = this.noise(ax * 0.12 + 30, y * 0.08, z * 0.04 - time * fogSpeed * 1.5);
      const witch = smoothstep(0.7, 0.85, vein) * (1 - smoothstep(0.85, 1, vein) * 0.5) * this.config.witchlight;
      r += WITCHLIGHT[0] * witch; gg += WITCHLIGHT[1] * witch; b += WITCHLIGHT[2] * witch;

      // El resplandor ilumina toda la capa.
      const f = this.flash[l];
      r += BOLT[0] * f * 0.6; gg += BOLT[1] * f * 0.6; b += BOLT[2] * f * 0.6;

      // El rayo: baja desde arriba por las dos mitades hasta donde llega, con
      // ramitas que se prenden al azar.
      for (const {s, pulse} of bolts) {
        if (s.layer !== l) continue;
        const grown = smoothstep(0, 0.06, s.age);
        const tip = 1 - s.reach * grown;
        if (rise < tip) continue;
        const branch = this.noise(ax * 0.4, rise * 12, s.seed);
        const v = pulse * (0.5 + 0.5 * smoothstep(0, 0.5, branch)) * smoothstep(tip, tip + 0.05, rise);
        r += 255 * v; gg += 255 * v; b += 255 * v;
      }

      leds[i] = [Math.min(255, r), Math.min(255, gg), Math.min(255, b)];
    }
  }

  static presets() {
    return {
      default: {},
      diluvio: {strikesPerSecond: 0.6, beatStrikes: 0.7, fogSpeed: 0.6},
      nieblaQuieta: {strikesPerSecond: 0.05, beatStrikes: 0, fogSpeed: 0.08, witchlight: 1},
      truenoLento: {thunderDelay: 0.5, strikesPerSecond: 0.15},
    };
  }

  static configSchema() {
    let res = super.configSchema();
    res.soundMetric = {type: 'soundMetric', default: "bassPeakDecay"};
    res.strikesPerSecond = {type: Number, min: 0.01, max: 3, step: 0.01, default: 0.2};
    // Probabilidad de que un golpe fuerte de bajo traiga un rayo.
    res.beatStrikes = {type: Number, min: 0, max: 1, step: 0.01, default: 0.1};
    // Segundos que tarda el resplandor en pasar de una capa a la siguiente.
    res.thunderDelay = {type: Number, min: 0, max: 1, step: 0.01, default: 0.15};
    res.fogSpeed = {type: Number, min: 0, max: 2, step: 0.01, default: 0.25};
    res.fog = {type: Number, min: 0, max: 1, step: 0.01, default: 0.8};
    res.witchlight = {type: Number, min: 0, max: 1, step: 0.01, default: 0.6};
    return res;
  }
};
