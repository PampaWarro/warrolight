const _ = require("lodash");
const {createNoise3D} = require("simplex-noise");
const LightProgram = require("./../base-programs/LightProgram");
const depthLayers = require("../utils/depthLayers");

const clamp01 = x => Math.min(1, Math.max(0, x));
const smoothstep = (a, b, x) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const follow = (current, target, dt, attack, release) => {
  const tau = target > current ? attack : release;
  return current + (target - current) * (1 - Math.exp(-dt / tau));
};

// Del negro al blanco pasando por rojo, naranja y amarillo, como el calor.
const HEAT = [
  [0, [0, 0, 0]],
  [0.2, [90, 0, 0]],
  [0.45, [230, 30, 0]],
  [0.7, [255, 120, 0]],
  [0.9, [255, 210, 40]],
  [1, [255, 245, 200]],
];
function heatColor(h) {
  h = clamp01(h);
  for (let k = 1; k < HEAT.length; k++) {
    const [h1, c1] = HEAT[k];
    if (h <= h1) {
      const [h0, c0] = HEAT[k - 1];
      const t = (h - h0) / (h1 - h0);
      return [c0[0] + (c1[0] - c0[0]) * t, c0[1] + (c1[1] - c0[1]) * t, c0[2] + (c1[2] - c0[2]) * t];
    }
  }
  return HEAT[HEAT.length - 1][1];
}

// Una fogata bajo un cielo de estrellas, mezclando la lógica de fire y de
// stars:
//  - Llamas (fire): cada led tiene un brillo base según su altura y se reaviva
//    al azar para después decaer, lo que da el parpadeo. Encima suben lenguas
//    de fuego. Crecen desde el piso de cada capa, más altas con el bajo.
//  - Chispas (stars): se encienden al azar dentro de las llamas, como las
//    estrellas, pero suben y se van enfriando. Lo que tocan queda encendido y
//    decae como una estrella, así que dejan estela.
//  - Cielo (stars): arriba de las llamas titilan estrellas cálidas.
//
// Con `mixed` en 1 el fuego deja de estar abajo: aparece en focos que se mueven
// por todo el espacio 3D, y las estrellas titilan en lo oscuro entre ellos.
// Los valores intermedios mezclan las dos cosas.
module.exports = class StarFire extends LightProgram {
  init() {
    const g = this.geometry;
    const n = this.numberOfLeds;
    this.noise = createNoise3D();
    this.layers = depthLayers(g);
    this.flicker = new Float32Array(n).fill(0.5);
    this.stars = _.times(n, () => [0, 0, 0]);
    this.sparks = [];
    this.lastTime = null;
    this.flame = this.config.flameHeight;
    this.needsBeat = true;

    // Distancia típica entre leds, para el tamaño de las chispas.
    const sample = _.sampleSize(_.range(n), Math.min(n, 150));
    const nearest = sample.map(i => {
      let best = Infinity;
      for (let j = 0; j < n; j++) {
        if (i === j) continue;
        const d = Math.hypot(g.x[i] - g.x[j], g.y[i] - g.y[j], g.z[i] - g.z[j]);
        if (d > 0 && d < best) best = d;
      }
      return best;
    });
    this.spacing = _.sortBy(nearest)[Math.floor(nearest.length / 2)] || 1;
  }

  addSpark(i, heat) {
    const g = this.geometry;
    this.sparks.push({
      x: g.x[i],
      y: g.y[i],
      z: g.z[i],
      vy: -(4 + Math.random() * 8) * this.config.sparkSpeed,
      vx: (Math.random() - 0.5) * 3,
      heat: heat,
      age: 0,
      life: 1.5 + Math.random() * 2.5,
      phase: Math.random() * 10,
    });
  }

  drawFrame(leds, context) {
    const audio = (context.audio && context.audio.currentFrame) || {};
    const dt = this.lastTime === null ? 1 / 60 : Math.min(0.1, (this.timeInMs - this.lastTime) / 1000);
    this.lastTime = this.timeInMs;
    const time = this.timeInMs / 1000;
    const g = this.geometry;
    const n = this.numberOfLeds;
    const noise = this.noise;

    // Las llamas crecen con el bajo y bajan despacio.
    const bass = (audio[this.config.soundMetric] || 0) * this.config.multiplier;
    const high = (audio[this.config.sparkMetric] || 0) * this.config.multiplier;
    const target = this.config.flameHeight * (1 + this.config.musicFlame * bass);
    this.flame = follow(this.flame, Math.min(0.95, target), dt, 0.25, 1.5);
    const flame = this.flame;

    // Con cada golpe, una ráfaga de chispas.
    let burst = 0;
    if (bass < this.config.cutThreshold) {
      this.needsBeat = true;
    } else if (this.needsBeat) {
      this.needsBeat = false;
      burst = Math.round(this.config.burst * bass);
    }

    // Fire: reavivar al azar y decaer. Se normaliza por tiempo para que no
    // dependa de los fps.
    const decay = Math.pow(this.config.flickerDecay, dt * 60);
    const reignite = this.config.flicker * dt * 60;
    const starDecay = Math.pow(this.config.starDecay, dt * 60);
    const mixed = this.config.mixed;
    const patchScale = 2.5 / Math.max(g.width, g.height, 1);
    const patchDepth = 1.2 / Math.max(g.depth, 1);

    const heat = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const rise = this.layers.rise[i];
      let f = this.flicker[i] * decay;
      if (Math.random() < reignite) f = 0.6 + Math.random() * 0.4;
      this.flicker[i] = f;

      // Lenguas de fuego que suben, más altas en algunos lugares que en otros.
      const tongue = noise(g.x[i] * 0.08, rise * 3 - time * this.config.flameSpeed, g.z[i] * 0.05 + time * 0.2);
      const reach = flame * (0.75 + 0.35 * tongue);
      let body = 1 - smoothstep(reach * 0.35, reach, rise);
      let sky = smoothstep(flame, Math.min(1, flame + 0.25), rise);
      let falloff = 1 - rise * 0.6;

      // Mezclado: focos de fuego que aparecen en cualquier lugar del espacio y
      // suben despacio, con estrellas en lo oscuro entre ellos. Con el bajo los
      // focos crecen.
      if (mixed > 0) {
        const patch = noise(
          g.x[i] * patchScale + time * 0.03,
          g.y[i] * patchScale + time * 0.12 * this.config.flameSpeed,
          g.z[i] * patchDepth - time * 0.02
        ) + tongue * 0.2;
        const threshold = 0.7 - flame;
        body += (smoothstep(threshold, threshold + 0.35, patch) - body) * mixed;
        sky += (1 - smoothstep(threshold - 0.25, threshold + 0.05, patch) - sky) * mixed;
        falloff += (1 - falloff) * mixed;
      }
      heat[i] = body * (0.3 + 0.55 * f) * falloff;

      // Stars: todo lo encendido decae.
      const s = this.stars[i];
      s[0] *= starDecay;
      s[1] *= starDecay;
      s[2] *= starDecay;

      // El cielo: estrellas que titilan donde no hay fuego.
      if (sky > 0 && Math.random() < this.config.skyStars * sky * dt * 60) {
        const warm = Math.random() * 0.25;
        const v = (0.35 + Math.random() * 0.65) * this.config.skyBrightness * 255;
        s[0] += v;
        s[1] += v * (0.85 - warm);
        s[2] += v * (0.6 - warm * 1.6);
      }
    }

    // Chispas que nacen al azar dentro del fuego, como las estrellas. Más con
    // los agudos, y una ráfaga con cada golpe.
    this.pendingSparks = (this.pendingSparks || 0) + dt * this.config.sparks * (0.3 + 1.5 * high);
    const newSparks = Math.floor(this.pendingSparks) + burst;
    this.pendingSparks -= Math.floor(this.pendingSparks);
    for (let k = 0; k < newSparks; k++) {
      for (let tries = 0; tries < 20; tries++) {
        const i = _.random(n - 1);
        if (heat[i] > 0.25) {
          this.addSpark(i, 0.75 + Math.random() * 0.25);
          break;
        }
      }
    }

    // Las chispas suben, se mecen y se enfrían; lo que tocan queda encendido.
    const reach = this.spacing * 2.5;
    for (const sp of this.sparks) {
      sp.age += dt;
      sp.vy *= Math.exp(-dt * 0.4);
      sp.y += sp.vy * dt;
      sp.x += (sp.vx + Math.sin(time * 3 + sp.phase) * 2) * dt;
      const temp = sp.heat * (1 - sp.age / sp.life);
      if (temp <= 0) continue;
      const [r, gg, b] = heatColor(0.35 + temp * 0.65);
      for (let i = 0; i < n; i++) {
        if (Math.abs(g.z[i] - sp.z) > reach) continue;
        const dx = g.x[i] - sp.x;
        const dy = g.y[i] - sp.y;
        if (Math.abs(dx) > reach || Math.abs(dy) > reach) continue;
        const v = (1 - Math.hypot(dx, dy) / reach) * temp * dt * 12;
        if (v <= 0) continue;
        const s = this.stars[i];
        s[0] = Math.min(255, s[0] + r * v);
        s[1] = Math.min(255, s[1] + gg * v);
        s[2] = Math.min(255, s[2] + b * v);
      }
    }
    this.sparks = this.sparks.filter(sp => sp.age < sp.life && sp.y > -10);

    const brightness = this.config.brightness;
    for (let i = 0; i < n; i++) {
      const [r, gg, b] = heatColor(heat[i]);
      const s = this.stars[i];
      leds[i] = [
        Math.min(255, (r + s[0]) * brightness),
        Math.min(255, (gg + s[1]) * brightness),
        Math.min(255, (b + s[2]) * brightness),
      ];
    }
  }

  static presets() {
    return {
      default: {},
      fogataTranquila: {flameHeight: 0.3, musicFlame: 0.5, sparks: 15},
      hoguera: {flameHeight: 0.55, musicFlame: 0.8, sparks: 80, burst: 40, flameSpeed: 1.6},
      cieloEstrellado: {flameHeight: 0.18, sparks: 10, skyStars: 0.008, starDecay: 0.985},
      soloBrasas: {flameHeight: 0.12, musicFlame: 2, sparks: 50, flicker: 0.02},
      mezclado: {mixed: 1},
      incendioEstelar: {mixed: 1, flameHeight: 0.5, sparks: 60, skyStars: 0.006},
      mitadYMitad: {mixed: 0.5},
    };
  }

  static configSchema() {
    let res = super.configSchema();
    res.soundMetric = {type: 'soundMetric', default: "bassPeakDecay"};
    res.sparkMetric = {type: 'soundMetric', default: "highFastPeakDecay"};
    res.multiplier = {type: Number, min: 0, max: 3, step: 0.01, default: 1};
    res.cutThreshold = {type: Number, min: 0, max: 1, step: 0.01, default: 0.5};
    // Altura de las llamas, como fracción de la altura de cada capa.
    res.flameHeight = {type: Number, min: 0, max: 1, step: 0.01, default: 0.4};
    res.musicFlame = {type: Number, min: 0, max: 3, step: 0.01, default: 0.7};
    res.flameSpeed = {type: Number, min: 0, max: 5, step: 0.05, default: 1};
    res.flicker = {type: Number, min: 0, max: 0.2, step: 0.001, default: 0.04};
    res.flickerDecay = {type: Number, min: 0.8, max: 0.999, step: 0.001, default: 0.95};
    // Chispas por segundo.
    res.sparks = {type: Number, min: 0, max: 200, step: 1, default: 30};
    res.burst = {type: Number, min: 0, max: 100, step: 1, default: 15};
    res.sparkSpeed = {type: Number, min: 0.1, max: 4, step: 0.05, default: 1};
    res.skyStars = {type: Number, min: 0, max: 0.02, step: 0.0001, default: 0.004};
    res.skyBrightness = {type: Number, min: 0, max: 1, step: 0.01, default: 0.6};
    res.starDecay = {type: Number, min: 0.8, max: 0.999, step: 0.001, default: 0.975};
    // 0: fuego abajo y estrellas arriba. 1: focos de fuego y estrellas
    // mezclados en todo el espacio.
    res.mixed = {type: Number, min: 0, max: 1, step: 0.01, default: 0};
    res.brightness = {type: Number, min: 0, max: 1, step: 0.01, default: 1};
    return res;
  }
};
