const LightProgram = require("./../base-programs/LightProgram");

const clamp01 = x => Math.min(1, Math.max(0, x));
const smoothstep = (a, b, x) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

// Todo blanco, suave: aparecen puntos de luz en lugares al azar y de cada uno
// salen ondas muy sutiles, como gotas cayendo en agua quieta. Las ondas se
// expanden en 3D, así que de a poco llegan también a los otros arcos y a la W.
module.exports = class WhiteRipples extends LightProgram {
  init() {
    this.drops = [];
    this.lastTime = null;
    this.untilNextDrop = Math.random() / this.config.dropsPerSecond;
  }

  addDrop() {
    const g = this.geometry;
    const i = Math.floor(Math.random() * this.numberOfLeds);
    this.drops.push({
      x: g.x[i],
      y: g.y[i],
      z: g.z[i],
      age: 0,
      strength: 0.6 + Math.random() * 0.4,
      speed: this.config.rippleSpeed * (0.8 + Math.random() * 0.4),
    });
  }

  drawFrame(leds, context) {
    const audio = (context.audio && context.audio.currentFrame) || {};
    const dt = this.lastTime === null ? 1 / 60 : Math.min(0.1, (this.timeInMs - this.lastTime) / 1000);
    this.lastTime = this.timeInMs;
    const g = this.geometry;

    // Llegan gotas al azar; la música, si se quiere, las hace más frecuentes.
    const music = (audio[this.config.soundMetric] || 0) * this.config.music;
    this.untilNextDrop -= dt * (1 + music * 3);
    if (this.untilNextDrop <= 0) {
      this.addDrop();
      // Intervalos exponenciales: lluvia natural, sin ritmo fijo.
      this.untilNextDrop = -Math.log(1 - Math.random()) / this.config.dropsPerSecond;
    }

    const life = this.config.rippleSeconds;
    for (const d of this.drops) d.age += dt;
    this.drops = this.drops.filter(d => d.age < life);

    const width = this.config.rippleWidth;
    const rings = this.config.rings;
    const ringGap = this.config.ringGap;
    const zScale = this.config.depthScale;
    const base = this.config.base;
    const max = this.config.brightness;
    const warmth = this.config.warmth;

    for (let i = 0; i < this.numberOfLeds; i++) {
      const x = g.x[i], y = g.y[i], z = g.z[i];
      let light = 0;

      for (const d of this.drops) {
        const dz = (z - d.z) * zScale;
        const dist = Math.hypot(x - d.x, y - d.y, dz);
        // En las otras capas la onda llega más tenue.
        const far = 1 / (1 + Math.abs(dz) * 0.06);
        const fadeOut = 1 - smoothstep(life * 0.4, life, d.age);

        // El punto: aparece suave y se apaga más lento.
        const dot = smoothstep(0, 0.8, d.age) * (1 - smoothstep(0.8, 3, d.age));
        light += dot * Math.exp(-(dist * dist) / (width * width * 1.5)) * d.strength;

        // Las ondas: anillos que salen del punto y se van desvaneciendo.
        for (let k = 0; k < rings; k++) {
          const t = d.age - 0.6 - k * ringGap;
          if (t <= 0) continue;
          const radius = t * d.speed;
          const offset = (dist - radius) / width;
          if (offset * offset > 9) continue;
          const birth = smoothstep(0, 0.5, t);
          const amplitude = d.strength * birth * fadeOut * 0.45 / (1 + radius * 0.08) / (1 + k * 0.6);
          light += amplitude * far * Math.exp(-offset * offset);
        }
      }

      // Saturación suave: muchas ondas juntas no queman.
      const v = base + (max - base) * (1 - Math.exp(-light * 1.4));
      const c = 255 * v;
      leds[i] = [c, c * (1 - 0.06 * warmth), c * (1 - 0.18 * warmth)];
    }
  }

  static presets() {
    return {
      default: {},
      lluviaFina: {dropsPerSecond: 2, rippleWidth: 0.8, rings: 2, brightness: 0.45},
      gotasGrandes: {dropsPerSecond: 0.3, rippleSpeed: 7, rippleSeconds: 9, rippleWidth: 2, rings: 4},
      soloEnSuCapa: {depthScale: 3},
      calido: {warmth: 1, base: 0.04},
      conMusica: {music: 1},
    };
  }

  static configSchema() {
    let res = super.configSchema();
    res.dropsPerSecond = {type: Number, min: 0.05, max: 10, step: 0.05, default: 0.7};
    // Velocidad de las ondas, en unidades de la geometría por segundo.
    res.rippleSpeed = {type: Number, min: 0.5, max: 40, step: 0.1, default: 5};
    res.rippleSeconds = {type: Number, min: 1, max: 20, step: 0.1, default: 7};
    res.rippleWidth = {type: Number, min: 0.2, max: 8, step: 0.1, default: 1.3};
    res.rings = {type: Number, min: 1, max: 6, step: 1, default: 3};
    res.ringGap = {type: Number, min: 0.1, max: 3, step: 0.05, default: 0.7};
    // Cuánto le cuesta a la onda viajar en profundidad: más alto, más se queda
    // en su capa.
    res.depthScale = {type: Number, min: 0, max: 10, step: 0.05, default: 0.25};
    res.base = {type: Number, min: 0, max: 0.3, step: 0.005, default: 0.02};
    res.brightness = {type: Number, min: 0.05, max: 1, step: 0.01, default: 0.6};
    res.warmth = {type: Number, min: 0, max: 1, step: 0.01, default: 0.3};
    res.soundMetric = {type: 'soundMetric', default: "fastPeakDecay"};
    res.music = {type: Number, min: 0, max: 2, step: 0.01, default: 0};
    return res;
  }
};
