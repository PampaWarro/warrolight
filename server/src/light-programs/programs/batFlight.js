const {createNoise3D} = require("simplex-noise");
const LightProgram = require("./../base-programs/LightProgram");
const depthLayers = require("../utils/depthLayers");

const clamp01 = x => Math.min(1, Math.max(0, x));
const smoothstep = (a, b, x) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

const MOON = [255, 200, 90];
const SKY = [255, 80, 0];
const DUSK = [90, 0, 40];

// Murciélagos contra la luna llena. La W es la luna: la luz naranja sale de
// atrás y se va apagando hacia los arcos de adelante. Los murciélagos son
// siluetas negras que aletean y vuelan desde la W hacia el público, haciéndose
// más grandes en cada arco. Viven en coordenadas espejadas, así que vuelan de a
// pares simétricos (o solos por el medio). Con el bajo sale una bandada.
module.exports = class BatFlight extends LightProgram {
  init() {
    const g = this.geometry;
    this.noise = createNoise3D();
    this.layers = depthLayers(g);
    this.ax = this.layers.side;
    this.bats = [];
    this.lastTime = null;
    this.untilNext = 0;
    this.lastBass = 0;
  }

  spawn() {
    const g = this.geometry;
    this.bats.push({
      // A veces por el medio: un solo murciélago grande en vez de un par.
      ax: Math.random() < 0.3 ? 0 : Math.random() * g.width * 0.4,
      y: g.height * (0.1 + Math.random() * 0.6),
      z: -15,
      vz: this.config.speed * (0.6 + Math.random() * 0.8),
      vax: (Math.random() - 0.5) * 8,
      flap: Math.random() * Math.PI * 2,
      flapSpeed: 9 + Math.random() * 6,
    });
  }

  drawFrame(leds, context) {
    const audio = (context.audio && context.audio.currentFrame) || {};
    const dt = this.lastTime === null ? 1 / 60 : Math.min(0.1, (this.timeInMs - this.lastTime) / 1000);
    this.lastTime = this.timeInMs;
    const time = this.timeInMs / 1000;
    const g = this.geometry;
    const depth = Math.max(g.depth, 1);

    const bass = audio[this.config.soundMetric] || 0;
    if (this.config.flockOnBeat && bass > 0.6 && bass - this.lastBass > 0.25) {
      for (let k = 0; k < 3 + Math.random() * 3; k++) this.spawn();
    }
    this.lastBass = bass;

    this.untilNext -= dt;
    if (this.untilNext <= 0) {
      this.spawn();
      this.untilNext = -Math.log(1 - Math.random()) / this.config.batsPerSecond;
    }
    for (const b of this.bats) {
      b.z += b.vz * dt;
      b.flap += b.flapSpeed * dt;
      // Vuelo errático: cambian de rumbo todo el tiempo.
      b.vax += (Math.random() - 0.5) * 40 * dt;
      b.vax *= Math.exp(-dt);
      b.ax = Math.abs(b.ax + b.vax * dt);
      b.y += (Math.sin(b.flap) * 6 + (Math.random() - 0.5) * 20) * dt;
      b.y = Math.min(g.height, Math.max(0, b.y));
    }
    this.bats = this.bats.filter(b => b.z < g.depth + 20).slice(-this.config.maxBats);

    const zSpread = this.config.zSpread;
    const moonY = g.height * 0.3;

    for (let i = 0; i < this.numberOfLeds; i++) {
      const ax = this.ax[i], y = g.y[i], z = g.z[i];
      const front = z / depth;

      // La luz de la luna: fuerte en la W, cerca del centro arriba, y se apaga
      // hacia adelante y hacia el piso.
      const moonDist = Math.hypot(ax, y - moonY) / g.height;
      const moon = Math.exp(-moonDist * moonDist * 3) * (1 - front * 0.7);
      const floor = smoothstep(0.4, 1, y / g.height);
      const haze = 0.7 + 0.3 * this.noise(ax * 0.04, y * 0.04, time * 0.15 + z * 0.01);
      let color = mix(SKY, DUSK, clamp01(front * 0.6 + floor * 0.5));
      color = mix(color, MOON, clamp01(moon));
      let light = this.config.brightness * haze * (0.35 + 0.65 * Math.max(moon, 1 - front * 0.6));

      let shadow = 0;
      for (const b of this.bats) {
        const dz = (z - b.z) / zSpread;
        if (dz * dz > 6) continue;
        const size = this.config.size * (0.6 + 1.2 * clamp01(b.z / depth));
        const dx = (ax - b.ax) / size;
        const dy = (y - b.y) / size;
        const adx = Math.abs(dx);
        if (adx > 3.5 || Math.abs(dy) > 3) continue;
        // Las alas suben y bajan con el aleteo y se afinan hacia la punta.
        const wingY = -Math.sin(b.flap) * adx * 0.6 + adx * adx * 0.08;
        const thickness = 0.55 * (1 - adx / 3.5) + 0.1;
        const wing = adx < 3.5 ? Math.exp(-Math.pow((dy - wingY) / thickness, 2)) : 0;
        const body = Math.exp(-(dx * dx * 4 + dy * dy * 1.2));
        shadow = Math.max(shadow, Math.max(wing, body) * Math.exp(-dz * dz));
      }

      const v = light * (1 - Math.min(1, shadow * 1.3));
      leds[i] = [color[0] * v, color[1] * v, color[2] * v];
    }
  }

  static presets() {
    return {
      default: {},
      bandada: {batsPerSecond: 3, maxBats: 30, size: 2.5, speed: 30},
      vampiro: {batsPerSecond: 0.2, maxBats: 2, size: 7, speed: 10},
      lunaTranquila: {batsPerSecond: 0.4, flockOnBeat: false, speed: 12},
    };
  }

  static configSchema() {
    let res = super.configSchema();
    res.soundMetric = {type: 'soundMetric', default: "bassPeakDecay"};
    res.flockOnBeat = {type: Boolean, default: true};
    res.batsPerSecond = {type: Number, min: 0.05, max: 10, step: 0.05, default: 1};
    res.maxBats = {type: Number, min: 1, max: 50, step: 1, default: 15};
    res.speed = {type: Number, min: 2, max: 80, step: 0.5, default: 20};
    res.size = {type: Number, min: 1, max: 12, step: 0.1, default: 4};
    res.zSpread = {type: Number, min: 2, max: 40, step: 0.5, default: 10};
    res.brightness = {type: Number, min: 0.1, max: 1, step: 0.01, default: 0.85};
    return res;
  }
};
