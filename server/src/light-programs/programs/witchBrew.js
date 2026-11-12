const _ = require("lodash");
const {createNoise3D} = require("simplex-noise");
const LightProgram = require("./../base-programs/LightProgram");
const depthLayers = require("../utils/depthLayers");

const clamp01 = x => Math.min(1, Math.max(0, x));
const smoothstep = (a, b, x) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

const POTION_DEEP = [10, 70, 0];
const POTION = [60, 255, 0];
const FOAM = [200, 255, 80];
const VAPOR = [110, 0, 160];
const POP = [255, 0, 200];

// El caldero de la bruja. Cada capa (la W y los dos arcos) está llena hasta
// cierta altura de una poción verde tóxica, y el nivel se mece de atrás para
// adelante como si el líquido chapoteara entre los arcos. El bajo la hace hervir.
// De abajo suben burbujas por las tiras, de a pares simétricos, y al llegar a la
// superficie revientan en un chispazo violeta. Arriba flota el vapor.
module.exports = class WitchBrew extends LightProgram {
  init() {
    const g = this.geometry;
    this.noise = createNoise3D();
    this.layers = depthLayers(g);
    this.ax = this.layers.side;
    this.ledsByLayer = _.range(this.layers.count).map(l =>
      _.range(this.numberOfLeds).filter(i => this.layers.layerOf[i] === l)
    );
    this.levels = new Array(this.layers.count).fill(this.config.level);
    this.bubbles = [];
    this.pops = [];
    this.boil = 0;
    this.lastTime = null;
    this.pendingBubbles = 0;
  }

  // Busca la luz de la capa más cercana a la altura y al lado de la burbuja,
  // así la burbuja sube siguiendo las tiras.
  anchor(b) {
    let best = -1, bestCost = Infinity;
    for (const j of this.ledsByLayer[b.layer]) {
      const cost = Math.abs(this.layers.rise[j] - b.rise) * 40 + Math.abs(this.ax[j] - b.ax);
      if (cost < bestCost) {
        bestCost = cost;
        best = j;
      }
    }
    return best;
  }

  drawFrame(leds, context) {
    const audio = (context.audio && context.audio.currentFrame) || {};
    const dt = this.lastTime === null ? 1 / 60 : Math.min(0.1, (this.timeInMs - this.lastTime) / 1000);
    this.lastTime = this.timeInMs;
    const time = this.timeInMs / 1000;
    const g = this.geometry;

    const bass = audio[this.config.soundMetric] || 0;
    this.boil += (clamp01(bass * this.config.music) - this.boil) * (1 - Math.exp(-dt / 0.15));

    // El nivel de cada capa chapotea con un desfasaje: la ola va y viene entre
    // la W y los arcos.
    for (let l = 0; l < this.layers.count; l++) {
      const target = this.config.level
        + this.config.slosh * Math.sin(time * this.config.sloshSpeed - l * 1.3)
        + 0.06 * this.noise(time * 0.3, l, 0)
        + this.boil * 0.12;
      this.levels[l] += (target - this.levels[l]) * (1 - Math.exp(-dt / 0.2));
    }

    this.pendingBubbles += dt * this.config.bubblesPerSecond * (1 + this.boil * 4);
    while (this.pendingBubbles >= 1) {
      this.pendingBubbles -= 1;
      this.bubbles.push({
        layer: _.random(0, this.layers.count - 1),
        rise: 0,
        ax: Math.random() * g.width * 0.5,
        speed: 0.15 + Math.random() * 0.25,
        size: 0.8 + Math.random() * 1.2,
      });
    }
    const survivors = [];
    for (const b of this.bubbles) {
      b.rise += b.speed * dt * (1 + this.boil);
      if (b.rise >= this.levels[b.layer]) {
        if (b.at !== undefined) {
          this.pops.push({layer: b.layer, ax: this.ax[b.at], y: g.y[b.at], age: 0, size: b.size});
        }
        continue;
      }
      b.at = this.anchor(b);
      // Se pega a la tira: la próxima vez busca desde donde quedó.
      b.ax = this.ax[b.at];
      survivors.push(b);
    }
    this.bubbles = survivors.slice(-60);
    for (const p of this.pops) p.age += dt;
    this.pops = this.pops.filter(p => p.age < 0.7);

    for (let i = 0; i < this.numberOfLeds; i++) {
      const ax = this.ax[i], y = g.y[i], z = g.z[i];
      const l = this.layers.layerOf[i];
      const s = this.layers.rise[i] - this.levels[l];
      const n = this.noise(ax * 0.15, y * 0.1 + time * 0.8, z * 0.05 + time * 0.3);

      let r, gg, b;
      if (s < 0) {
        // Poción: oscura en el fondo, brillante cerca de la superficie.
        const near = Math.exp(s * 5);
        const t = clamp01(near * 0.8 + n * 0.25 + this.boil * 0.2);
        r = POTION_DEEP[0] + (POTION[0] - POTION_DEEP[0]) * t;
        gg = POTION_DEEP[1] + (POTION[1] - POTION_DEEP[1]) * t;
        b = POTION_DEEP[2] + (POTION[2] - POTION_DEEP[2]) * t;
        const v = 0.45 + 0.55 * t;
        r *= v; gg *= v; b *= v;
      } else {
        // Vapor violeta que se deshace hacia arriba.
        const vapor = Math.exp(-s * 4) * smoothstep(-0.4, 0.7, n) * this.config.vapor;
        r = VAPOR[0] * vapor;
        gg = VAPOR[1] * vapor;
        b = VAPOR[2] * vapor;
      }
      // Espuma en la superficie.
      const foam = Math.exp(-(s * s) / 0.0012) * (0.6 + 0.4 * n);
      r += FOAM[0] * foam; gg += FOAM[1] * foam; b += FOAM[2] * foam;

      for (const bu of this.bubbles) {
        if (bu.layer !== l || bu.at === undefined) continue;
        const dx = ax - this.ax[bu.at], dy = y - g.y[bu.at];
        const d2 = (dx * dx + dy * dy) / (bu.size * bu.size);
        if (d2 > 6) continue;
        const v = Math.exp(-d2);
        r += FOAM[0] * v; gg += FOAM[1] * v; b += FOAM[2] * v * 0.5;
      }
      for (const p of this.pops) {
        if (p.layer !== l) continue;
        const dist = Math.hypot(ax - p.ax, y - p.y);
        const radius = p.age * 14 * p.size;
        const ring = Math.exp(-Math.pow((dist - radius) / 1.3, 2)) * (1 - p.age / 0.7);
        r += POP[0] * ring; gg += POP[1] * ring; b += POP[2] * ring;
      }

      leds[i] = [Math.min(255, r), Math.min(255, gg), Math.min(255, b)];
    }
  }

  static presets() {
    return {
      default: {},
      hirviendo: {bubblesPerSecond: 25, slosh: 0.15, sloshSpeed: 2.5, music: 1.5},
      calderoQuieto: {bubblesPerSecond: 3, slosh: 0.05, sloshSpeed: 0.6, music: 0.3},
      desborde: {level: 0.75, slosh: 0.2, vapor: 1},
    };
  }

  static configSchema() {
    let res = super.configSchema();
    res.soundMetric = {type: 'soundMetric', default: "bassPeakDecay"};
    res.music = {type: Number, min: 0, max: 2, step: 0.01, default: 1};
    // Altura de la poción, de 0 (piso) a 1 (arriba de todo).
    res.level = {type: Number, min: 0.05, max: 1, step: 0.01, default: 0.45};
    res.slosh = {type: Number, min: 0, max: 0.4, step: 0.005, default: 0.1};
    res.sloshSpeed = {type: Number, min: 0, max: 5, step: 0.05, default: 1.2};
    res.bubblesPerSecond = {type: Number, min: 0, max: 60, step: 0.5, default: 8};
    res.vapor = {type: Number, min: 0, max: 1, step: 0.01, default: 0.6};
    return res;
  }
};
