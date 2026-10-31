const _ = require("lodash");
const {createNoise3D} = require("simplex-noise");
const LightProgram = require("./../base-programs/LightProgram");

const YELLOW = [255, 185, 0];
const ORANGE = [255, 60, 0];
const RED = [235, 0, 0];
const DARK_RED = [70, 0, 2];
const SNOW = [255, 235, 215];
const STEEL = [255, 250, 235];

const mix = (a, b, t) => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];
const clamp01 = x => Math.min(1, Math.max(0, x));
const smoothstep = (a, b, x) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
// Suavizado exponencial con distintos tiempos de subida y bajada.
const follow = (current, target, dt, attack, release) => {
  const tau = target > current ? attack : release;
  return current + (target - current) * (1 - Math.exp(-dt / tau));
};

// Inspirado en Kill Bill. No hay escenas fijas: todo son capas continuas que
// se mezclan según la música y una marea lenta al azar.
//
//  - La Novia: un campo cálido amarillo/naranja que deriva por el espacio 3D,
//    con manchas más brillantes que pasan de un arco al otro.
//  - Sangre: una simulación de fluido sobre la geometría. Cada led conoce a sus
//    vecinos y la sangre corre hacia los que están más abajo, más rápido
//    cuanto más empinado: baja por los postes de los arcos, se demora en la
//    punta y se reparte para los dos lados. De las partes planas (la barra de
//    arriba de la W, la punta de los arcos) se desprenden gotas que caen libres
//    y salpican lo que haya abajo, como la X y la base de la W.
//  - Katana: de vez en cuando un tajo atraviesa todas las capas en
//    profundidad, del público hacia la W, y deja la herida sangrando.
//  - Nieve: cuando la música está tranquila cae nieve, como en el jardín de
//    O-Ren.
module.exports = class KillBill extends LightProgram {
  init() {
    this.noise = createNoise3D();
    this.seed = Math.random() * 1000;
    this.blood = new Float32Array(this.numberOfLeds);
    // Lo que todavía tiene que brotar de cada herida.
    this.wounds = new Float32Array(this.numberOfLeds);
    this.snowGlow = new Float32Array(this.numberOfLeds);
    this.nextBlood = new Float32Array(this.numberOfLeds);
    this.buildNeighbors();

    this.rage = 0;
    this.calm = 1;
    this.lastTime = null;
    this.needsBeat = true;
    this.slashes = [];
    this.drops = [];
    this.nextSlashAt = 1 + Math.random() * 3;

    const g = this.geometry;
    this.zs = _.uniq(g.z.slice(0, this.numberOfLeds).map(Math.round));
    this.snow = _.range(this.config.snowflakes).map(() => this.newFlake(true));
  }

  // Vecinos por proximidad: los leds de la misma tira y los de las uniones
  // (las puntas de los arcos, los vértices de la W).
  buildNeighbors() {
    const g = this.geometry;
    const n = this.numberOfLeds;
    const dist = (i, j) => Math.hypot(g.x[i] - g.x[j], g.y[i] - g.y[j], g.z[i] - g.z[j]);

    const nearest = new Float32Array(n).fill(Infinity);
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const d = dist(i, j);
        if (d > 0 && d < nearest[i]) nearest[i] = d;
        if (d > 0 && d < nearest[j]) nearest[j] = d;
      }
    }
    const spacing = _.sortBy([...nearest].filter(isFinite))[Math.floor(n / 2)] || 1;
    const radius = spacing * 2.5;
    this.spacing = spacing;

    this.down = [];
    this.around = [];
    this.slope = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const down = [];
      const around = [];
      for (let j = 0; j < n; j++) {
        if (i === j) continue;
        const d = dist(i, j);
        if (d > radius) continue;
        around.push(j);
        // y crece hacia abajo.
        const drop = g.y[j] - g.y[i];
        if (drop > spacing * 0.02) down.push([j, drop / d]);
      }
      const total = _.sumBy(down, 1) || 1;
      this.slope[i] = _.max(down.map(([, s]) => s)) || 0;
      this.down.push(down.map(([j, s]) => [j, s / total]));
      this.around.push(around);
    }
  }

  newFlake(anywhere) {
    const g = this.geometry;
    return {
      x: Math.random() * g.width,
      y: anywhere ? Math.random() * g.height : -2,
      z: _.sample(this.zs) || 0,
      speed: 1.5 + Math.random() * 3,
      phase: Math.random() * 10,
    };
  }

  // La sangre no aparece de golpe: la herida mana durante unos 300ms.
  bleed(i, amount) {
    this.wounds[i] = Math.min(3, this.wounds[i] + amount);
  }

  ooze(dt) {
    const k = 1 - Math.exp(-dt / 0.3);
    for (let i = 0; i < this.numberOfLeds; i++) {
      const w = this.wounds[i];
      if (w < 0.0005) continue;
      this.wounds[i] = w * (1 - k);
      this.blood[i] = Math.min(3, this.blood[i] + w * k);
    }
  }

  addSlash() {
    const g = this.geometry;
    const angle = (Math.random() - 0.5) * Math.PI * 0.8;
    this.slashes.push({
      cx: g.width * (0.2 + Math.random() * 0.6),
      cy: g.height * (0.15 + Math.random() * 0.5),
      nx: -Math.sin(angle),
      ny: Math.cos(angle),
      // Viaja desde adelante (z máximo) hacia la W.
      z: g.depth + 10,
      speed: Math.max(g.depth, 20) * (0.6 + Math.random() * 0.6),
      bend: (Math.random() - 0.5) * 0.03,
    });
  }

  flowBlood(dt) {
    const n = this.numberOfLeds;
    const g = this.geometry;
    const flow = 1 - Math.exp(-dt * this.config.flowSpeed);
    const spread = 1 - Math.exp(-dt * 3);
    const dry = Math.exp(-dt / this.config.bloodSeconds);
    const next = this.nextBlood;
    next.fill(0);
    for (let i = 0; i < n; i++) {
      const b = this.blood[i];
      if (b < 0.0005) continue;
      let left = b;

      // Corre hacia abajo, más rápido cuanto más empinado.
      const down = this.down[i];
      if (down.length) {
        const moving = b * flow * (0.15 + 0.85 * this.slope[i]);
        for (const [j, w] of down) next[j] += moving * w;
        left -= moving;
      }

      // En lo plano se desprenden gotas.
      if (this.slope[i] < 0.35 && left > 0.15 && Math.random() < dt * this.config.drips * left) {
        const amount = left * 0.5;
        left -= amount;
        this.drops.push({x: g.x[i], y: g.y[i], z: g.z[i], vy: 0, amount, from: g.y[i]});
      }

      // Un poco de difusión, para que se desparrame.
      const around = this.around[i];
      if (around.length) {
        const share = left * spread * 0.2;
        for (const j of around) next[j] += share / around.length;
        left -= share;
      }
      next[i] += left;
    }
    for (let i = 0; i < n; i++) this.blood[i] = next[i] * dry;
  }

  moveDrops(dt) {
    const g = this.geometry;
    const reach = this.spacing * 2;
    for (const drop of this.drops) {
      drop.vy += 60 * dt;
      drop.y += drop.vy * dt;
      if (drop.y - drop.from < this.spacing * 4) continue;
      // Salpica el primer led que encuentra en su capa.
      for (let i = 0; i < this.numberOfLeds; i++) {
        if (Math.abs(g.z[i] - drop.z) > reach) continue;
        if (Math.abs(g.x[i] - drop.x) < reach && Math.abs(g.y[i] - drop.y) < reach) {
          this.bleed(i, drop.amount);
          for (const j of this.around[i]) this.bleed(j, drop.amount * 0.3);
          drop.amount = 0;
          break;
        }
      }
    }
    this.drops = this.drops.filter(d => d.amount > 0 && d.y < g.height + 5);
  }

  drawFrame(leds, context) {
    const audio = (context.audio && context.audio.currentFrame) || {};
    const dt = this.lastTime === null ? 1 / 60 : Math.min(0.1, (this.timeInMs - this.lastTime) / 1000);
    this.lastTime = this.timeInMs;
    const time = this.timeInMs / 1000;
    const g = this.geometry;
    const noise = this.noise;

    const bass = (audio[this.config.soundMetric] || 0) * this.config.multiplier;
    const vol = (audio.fastPeakDecay || 0) * this.config.multiplier;
    this.rage = follow(this.rage, clamp01(bass), dt, 0.4, 4);
    this.calm = follow(this.calm, 1 - clamp01(vol * 1.5), dt, 3, 1.5);
    // Cuánta sangre hay depende de la música y de una marea lenta al azar.
    const tide = 0.5 + 0.5 * noise(time * 0.025, this.seed, 0);
    const bloodiness = clamp01(this.rage * 0.7 + tide * 0.5 - 0.1);

    // Golpes: brota sangre en algún lugar, más arriba es más probable.
    if (bass < this.config.cutThreshold) {
      this.needsBeat = true;
    } else if (this.needsBeat) {
      this.needsBeat = false;
      const wounds = 1 + Math.floor(Math.random() * 3 * bloodiness);
      for (let k = 0; k < wounds; k++) {
        const i = _.minBy(_.times(3, () => _.random(this.numberOfLeds - 1)), i => g.y[i]);
        this.bleed(i, (0.6 + Math.random()) * bass * this.config.bleeding);
      }
    }
    // Y siempre gotea algo, aunque no haya música.
    if (Math.random() < dt * (0.3 + 3 * bloodiness)) {
      this.bleed(_.random(this.numberOfLeds - 1), Math.random() * 0.5 * this.config.bleeding);
    }

    // Tajos de katana: raros, a tiempos al azar, más seguidos con la música.
    this.nextSlashAt -= dt * (0.4 + 2 * this.rage);
    if (this.nextSlashAt <= 0 && (bass > this.config.cutThreshold || Math.random() < dt * 0.15)) {
      this.addSlash();
      this.nextSlashAt = this.config.slashEvery * (0.5 + Math.random());
    }

    this.ooze(dt);
    this.flowBlood(dt);
    this.moveDrops(dt);

    const blade = new Float32Array(this.numberOfLeds);
    const bladeWidth = this.spacing * 4;
    for (const s of this.slashes) {
      s.z -= s.speed * dt;
      for (let i = 0; i < this.numberOfLeds; i++) {
        const dz = (g.z[i] - s.z) / 8;
        if (dz * dz > 9) continue;
        const dx = g.x[i] - s.cx;
        const dy = g.y[i] - s.cy;
        const along = dx * s.ny - dy * s.nx;
        const across = (dx * s.nx + dy * s.ny + s.bend * along * along) / bladeWidth;
        const v = Math.exp(-across * across - dz * dz);
        if (v > 0.02) {
          blade[i] = Math.max(blade[i], v);
          // El corte sangra: más al centro del tajo, menos en los extremos.
          this.bleed(i, v * dt * 20 * this.config.bleeding * Math.exp(-Math.abs(along) / g.width));
        }
      }
    }
    this.slashes = this.slashes.filter(s => s.z > -30);

    for (const f of this.snow) {
      f.y += f.speed * dt;
      f.x += Math.sin(time * 0.7 + f.phase) * dt * 2;
      if (f.y > g.height + 2) Object.assign(f, this.newFlake(false));
    }

    // Manchas más brillantes de amarillo que deambulan en 3D.
    const size = Math.max(g.width, g.height);
    const orbs = _.range(2).map(k => {
      const s = this.seed + k * 37.1;
      return {
        x: g.width * (0.5 + 0.6 * noise(time * 0.06, s, 2)),
        y: g.height * (0.5 + 0.6 * noise(time * 0.05, s, 3)),
        z: g.depth * (0.5 + 0.7 * noise(time * 0.04, s, 4)),
        r: size * (0.25 + 0.15 * noise(time * 0.05, s, 1)),
      };
    });
    const warmth = this.config.yellow * (1 - 0.55 * bloodiness);
    const snow = this.config.snow * smoothstep(0.45, 0.9, this.calm);
    const snowFade = Math.exp(-dt / 0.6);
    const scaleXY = 3 / size;
    const scaleZ = 1.5 / Math.max(g.depth, 1);

    for (let i = 0; i < this.numberOfLeds; i++) {
      const x = g.x[i], y = g.y[i], z = g.z[i];

      // La Novia: un campo cálido que deriva, con huecos negros.
      const field = noise(x * scaleXY + time * 0.04, y * scaleXY - time * 0.07, z * scaleZ + time * 0.03);
      let warm = smoothstep(-0.25, 0.6, field);
      for (const o of orbs) {
        const d = Math.hypot(x - o.x, y - o.y, (z - o.z) * 0.4) / o.r;
        if (d < 1) warm += Math.pow(1 - d, 2) * 1.2;
      }
      const hue = smoothstep(-0.4, 0.5, noise(x * scaleXY * 0.5, y * scaleXY * 0.5 + this.seed, time * 0.05));
      const intensity = Math.min(1, warm) * warmth;
      let color = mix([0, 0, 0], mix(ORANGE, YELLOW, clamp01(hue * 0.7 + (warm - 0.5) * 0.8)), intensity);

      // Los copos brillan al pasar por una tira y se apagan despacio.
      let flake = this.snowGlow[i] * snowFade;
      if (snow > 0.01) {
        for (const f of this.snow) {
          if (Math.abs(z - f.z) > 2) continue;
          const d = Math.hypot(x - f.x, y - f.y) / (this.spacing * 6);
          if (d < 1) flake = Math.max(flake, (1 - d) * (1 - d) * snow);
        }
      }
      this.snowGlow[i] = flake;
      if (flake > 0.005) color = mix(color, SNOW, Math.min(1, flake));

      // Sangre: roja cuando es fresca y abundante, bordó cuando se seca.
      const b = this.blood[i];
      if (b > 0.005) {
        const shade = mix(DARK_RED, RED, smoothstep(0.05, 0.9, b));
        const shimmer = 0.8 + 0.2 * noise(x * 0.4, y * 0.4 - time * 3, z * 0.1);
        color = mix(color, [shade[0] * shimmer, shade[1], shade[2]], smoothstep(0, 0.2, b));
      }

      if (blade[i] > 0.01) {
        color = mix(color, STEEL, blade[i]);
      }

      leds[i] = [Math.min(255, color[0]), Math.min(255, color[1]), Math.min(255, color[2])];
    }
  }

  static presets() {
    return {
      default: {},
      masacre: {bleeding: 2.5, bloodSeconds: 12, slashEvery: 2, yellow: 0.6, drips: 6},
      novia: {bleeding: 0.5, slashEvery: 8, yellow: 1, snow: 0.6},
      jardinDeNieve: {bleeding: 0.7, snow: 1, yellow: 0.45, slashEvery: 10, snowflakes: 150},
    };
  }

  static configSchema() {
    let res = super.configSchema();
    res.soundMetric = {type: 'soundMetric', default: "bassFastPeakDecay"};
    res.multiplier = {type: Number, min: 0, max: 3, step: 0.01, default: 1};
    res.cutThreshold = {type: Number, min: 0, max: 1, step: 0.01, default: 0.45};
    res.bleeding = {type: Number, min: 0, max: 5, step: 0.01, default: 1.6};
    res.flowSpeed = {type: Number, min: 0.5, max: 60, step: 0.5, default: 25};
    res.drips = {type: Number, min: 0, max: 20, step: 0.1, default: 3};
    res.bloodSeconds = {type: Number, min: 0.5, max: 30, step: 0.1, default: 6};
    // Segundos promedio entre tajos.
    res.slashEvery = {type: Number, min: 0.5, max: 30, step: 0.1, default: 4};
    res.yellow = {type: Number, min: 0, max: 1, step: 0.01, default: 0.85};
    res.snow = {type: Number, min: 0, max: 1, step: 0.01, default: 0.8};
    res.snowflakes = {type: Number, min: 0, max: 300, step: 1, default: 100};
    return res;
  }
};
