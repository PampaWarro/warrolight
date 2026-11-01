const {createNoise3D} = require("simplex-noise");
const LightProgram = require("./../base-programs/LightProgram");
const depthLayers = require("../utils/depthLayers");

const clamp01 = x => Math.min(1, Math.max(0, x));
const smoothstep = (a, b, x) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

const ECTOPLASM = [150, 255, 170];
const FOG = [40, 0, 70];

// Fantasmas que salen de la W y cruzan los arcos hacia el público, flotando y
// ondulando. Viven en coordenadas espejadas (distancia al eje central), así que
// cada fantasma aparece de a pares, simétrico en las dos mitades. A medida que se
// acercan se agrandan, y entre capa y capa se funden de una a la otra. Dejan una
// estela de ectoplasma; con un golpe fuerte de bajo hacen "¡BU!".
module.exports = class GhostParade extends LightProgram {
  init() {
    const g = this.geometry;
    this.noise = createNoise3D();
    this.layers = depthLayers(g);
    this.ax = this.layers.side;
    this.trail = new Float32Array(this.numberOfLeds);
    this.ghosts = [];
    this.lastTime = null;
    this.untilNext = 0;
    this.boo = 0;
    this.lastBass = 0;
  }

  spawn() {
    const g = this.geometry;
    const forward = Math.random() > this.config.reverseChance;
    this.ghosts.push({
      ax: Math.random() * g.width * 0.45,
      y: g.height * (0.15 + Math.random() * 0.7),
      z: forward ? -10 : g.depth + 10,
      vz: (forward ? 1 : -1) * this.config.speed * (0.6 + Math.random() * 0.8),
      phase: Math.random() * 10,
      wobble: 0.5 + Math.random(),
      strength: 0.6 + Math.random() * 0.4,
    });
  }

  drawFrame(leds, context) {
    const audio = (context.audio && context.audio.currentFrame) || {};
    const dt = this.lastTime === null ? 1 / 60 : Math.min(0.1, (this.timeInMs - this.lastTime) / 1000);
    this.lastTime = this.timeInMs;
    const time = this.timeInMs / 1000;
    const g = this.geometry;

    const bass = audio[this.config.soundMetric] || 0;
    if (bass > 0.6 && bass - this.lastBass > 0.25) this.boo = 1;
    this.lastBass = bass;
    this.boo = Math.max(0, this.boo - dt * 2.5);

    this.untilNext -= dt;
    if (this.untilNext <= 0 && this.ghosts.length < this.config.maxGhosts) {
      this.spawn();
      this.untilNext = -Math.log(1 - Math.random()) / this.config.ghostsPerSecond;
    }

    for (const gh of this.ghosts) {
      gh.z += gh.vz * dt * (1 + this.boo);
      gh.phase += dt;
      gh.ax = Math.max(0, gh.ax + Math.sin(gh.phase * gh.wobble * 1.3) * dt * 4);
      gh.y += Math.cos(gh.phase * gh.wobble) * dt * 3;
    }
    this.ghosts = this.ghosts.filter(gh => gh.z > -20 && gh.z < g.depth + 20);

    const depth = Math.max(g.depth, 1);
    const zSpread = this.config.zSpread;
    const trailDecay = Math.exp(-dt / this.config.trailSeconds);
    const size0 = this.config.size;

    for (let i = 0; i < this.numberOfLeds; i++) {
      const ax = this.ax[i], y = g.y[i], z = g.z[i];
      let light = 0;
      for (const gh of this.ghosts) {
        const dz = (z - gh.z) / zSpread;
        if (dz * dz > 9) continue;
        // Más cerca del público, más grande.
        const size = size0 * (0.7 + 0.8 * clamp01(gh.z / depth)) * (1 + this.boo * 0.6);
        // Cabeza redonda y cola que cuelga hacia abajo y ondula.
        const dx = ax - gh.ax - Math.sin(gh.phase * 3 + (y - gh.y) * 0.3) * 1.2;
        const dy = y - gh.y;
        const stretch = dy > 0 ? 2.2 : 1;
        const d2 = (dx * dx + (dy / stretch) * (dy / stretch)) / (size * size);
        light += gh.strength * Math.exp(-d2 - dz * dz);
      }
      this.trail[i] = Math.max(this.trail[i] * trailDecay, light * 0.6);

      const fog = this.config.fog * (0.4 + 0.6 * smoothstep(-0.3, 0.8, this.noise(ax * 0.05, g.y[i] * 0.05 - time * 0.1, z * 0.02 + time * 0.05)));
      const ghost = clamp01(light * (1 + this.boo));
      const trail = clamp01(this.trail[i]) * 0.5;
      const glow = Math.max(ghost, trail);
      // El centro del fantasma es casi blanco; la estela es verde.
      const white = smoothstep(0.6, 1, ghost);
      const r = FOG[0] * fog + glow * (ECTOPLASM[0] + (255 - ECTOPLASM[0]) * white);
      const gg = FOG[1] * fog + glow * ECTOPLASM[1];
      const b = FOG[2] * fog + glow * (ECTOPLASM[2] + (255 - ECTOPLASM[2]) * white);
      leds[i] = [Math.min(255, r), Math.min(255, gg), Math.min(255, b)];
    }
  }

  static presets() {
    return {
      default: {},
      procesion: {ghostsPerSecond: 1.5, maxGhosts: 12, speed: 18, size: 3},
      fantasmon: {ghostsPerSecond: 0.15, maxGhosts: 2, speed: 8, size: 9, trailSeconds: 3},
      vanYVienen: {reverseChance: 0.5},
      sinNiebla: {fog: 0, trailSeconds: 2},
    };
  }

  static configSchema() {
    let res = super.configSchema();
    res.soundMetric = {type: 'soundMetric', default: "bassPeakDecay"};
    res.ghostsPerSecond = {type: Number, min: 0.05, max: 5, step: 0.05, default: 0.5};
    res.maxGhosts = {type: Number, min: 1, max: 20, step: 1, default: 6};
    // Unidades de profundidad por segundo.
    res.speed = {type: Number, min: 1, max: 60, step: 0.5, default: 12};
    res.size = {type: Number, min: 1, max: 15, step: 0.1, default: 5};
    // Qué tan lejos en profundidad se ve un fantasma: más alto, más se funden las capas.
    res.zSpread = {type: Number, min: 2, max: 40, step: 0.5, default: 14};
    res.trailSeconds = {type: Number, min: 0.1, max: 5, step: 0.05, default: 1.2};
    res.reverseChance = {type: Number, min: 0, max: 1, step: 0.01, default: 0.15};
    res.fog = {type: Number, min: 0, max: 1, step: 0.01, default: 0.6};
    return res;
  }
};
