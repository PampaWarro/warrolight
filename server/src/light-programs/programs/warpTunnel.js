const LightProgram = require("./../base-programs/LightProgram");
const ColorUtils = require("./../utils/ColorUtils");
const depthLayers = require("../utils/depthLayers");

const clamp01 = x => Math.min(1, Math.max(0, x));

// Hiperespacio. Los arcos son la boca de un túnel y por adentro pasan estrellas
// a toda velocidad, desde atrás de la W hacia el público. Cada estrella tiene un
// ángulo alrededor del eje del túnel: cuando cruza una capa prende las luces de
// ese ángulo con una estela hacia atrás, así que se la ve pasar primero por la
// W, después por el primer arco y después por el segundo. El ángulo es espejado,
// así que las estrellas pasan de a pares simétricos. La música mete el turbo.
module.exports = class WarpTunnel extends LightProgram {
  init() {
    const g = this.geometry;
    this.layers = depthLayers(g);
    // El eje del túnel pasa por el centro de los semicírculos de los arcos.
    const front = this.layers.count - 1;
    let top = Infinity, halfWidth = 0;
    for (let i = 0; i < this.numberOfLeds; i++) {
      if (this.layers.layerOf[i] !== front) continue;
      top = Math.min(top, g.y[i]);
      halfWidth = Math.max(halfWidth, this.layers.side[i]);
    }
    const axisY = top + halfWidth;
    // 0 arriba, 1 abajo, igual en las dos mitades.
    this.angle = g.y.map((y, i) => Math.atan2(this.layers.side[i], axisY - y) / Math.PI);
    this.stars = [];
    for (let k = 0; k < this.config.stars; k++) this.stars.push(this.newStar(Math.random()));
    this.lastTime = null;
    this.speedBoost = 0;
  }

  newStar(progress = 0) {
    const g = this.geometry;
    const span = g.depth + 2 * this.config.trail;
    return {
      angle: Math.random(),
      z: -this.config.trail + progress * span,
      speed: 0.6 + Math.random() * 0.8,
      hue: Math.random(),
      size: 0.6 + Math.random() * 0.8,
    };
  }

  drawFrame(leds, context) {
    const audio = (context.audio && context.audio.currentFrame) || {};
    const dt = this.lastTime === null ? 1 / 60 : Math.min(0.1, (this.timeInMs - this.lastTime) / 1000);
    this.lastTime = this.timeInMs;
    const g = this.geometry;

    const vol = Math.min(1, (audio[this.config.soundMetric] || 0) * this.config.multiplier);
    this.speedBoost += (vol - this.speedBoost) * (1 - Math.exp(-dt / 0.1));
    const speed = this.config.speed * (1 + this.speedBoost * this.config.musicSpeed);

    while (this.stars.length < this.config.stars) this.stars.push(this.newStar());
    this.stars.length = Math.min(this.stars.length, this.config.stars);
    for (let k = 0; k < this.stars.length; k++) {
      const s = this.stars[k];
      s.z += s.speed * speed * dt;
      if (s.z > g.depth + this.config.trail) this.stars[k] = this.newStar();
    }

    const width = this.config.angularWidth;
    const trail = this.config.trail * (1 + this.speedBoost);
    const baseHue = this.config.hue;

    for (let i = 0; i < this.numberOfLeds; i++) {
      const a = this.angle[i], z = g.z[i];
      let r = 0, gg = 0, b = 0;
      for (const s of this.stars) {
        const da = (a - s.angle) / (width * s.size);
        if (da * da > 6) continue;
        const dz = s.z - z;
        // Adelante de la estrella, nada; atrás, la estela.
        if (dz < -2 || dz > trail) continue;
        const along = dz < 0 ? 1 + dz / 2 : 1 - dz / trail;
        const v = Math.exp(-da * da) * along * along;
        const hue = (baseHue + s.hue * this.config.hueSpread) % 1;
        const [cr, cg, cb] = ColorUtils.HSVtoRGB(hue, this.config.saturation * clamp01(dz / (trail * 0.3)), 1);
        r += cr * v; gg += cg * v; b += cb * v;
      }
      leds[i] = [Math.min(255, r), Math.min(255, gg), Math.min(255, b)];
    }
  }

  static presets() {
    return {
      default: {},
      turbo: {speed: 120, musicSpeed: 3, stars: 50, trail: 40},
      crucero: {speed: 25, musicSpeed: 0.5, stars: 20, trail: 15, saturation: 0.2},
      arcoiris: {hueSpread: 1, saturation: 1, stars: 40},
      fuego: {hue: 0.0, hueSpread: 0.12, saturation: 1},
    };
  }

  static configSchema() {
    let res = super.configSchema();
    res.soundMetric = {type: 'soundMetric', default: "bassPeakDecay"};
    res.multiplier = {type: Number, min: 0, max: 3, step: 0.01, default: 1};
    res.stars = {type: Number, min: 1, max: 100, step: 1, default: 30};
    // Unidades de profundidad por segundo.
    res.speed = {type: Number, min: 1, max: 300, step: 1, default: 50};
    res.musicSpeed = {type: Number, min: 0, max: 6, step: 0.05, default: 2};
    res.trail = {type: Number, min: 2, max: 80, step: 0.5, default: 25};
    // Ancho de cada estrella, en fracciones de media vuelta.
    res.angularWidth = {type: Number, min: 0.005, max: 0.2, step: 0.005, default: 0.03};
    res.hue = {type: Number, min: 0, max: 1, step: 0.01, default: 0.6};
    res.hueSpread = {type: Number, min: 0, max: 1, step: 0.01, default: 0.25};
    res.saturation = {type: Number, min: 0, max: 1, step: 0.01, default: 0.7};
    return res;
  }
};
