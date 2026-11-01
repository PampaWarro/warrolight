const LightProgram = require("./../base-programs/LightProgram");
const ColorUtils = require("./../utils/ColorUtils");
const {loadGradient} = require("../utils/gradients");
const depthLayers = require("../utils/depthLayers");

const clamp01 = x => Math.min(1, Math.max(0, x));

// Cometas que entran desde el público, pasan por adentro de los dos arcos y se
// estrellan contra la W, y después rebotan y vuelven a salir. Cada cometa es una
// luz que ilumina lo que tiene cerca: cuando cruza un arco, como lo atraviesa por
// el medio, el arco entero se prende a su alrededor. Cuando pega en la W sale una
// onda desde el centro. Vuelan por el eje del túnel (subiendo y bajando un poco),
// así que todo es simétrico.
module.exports = class CometTunnel extends LightProgram {
  init() {
    const g = this.geometry;
    this.layers = depthLayers(g);
    const front = this.layers.count - 1;
    let top = Infinity, halfWidth = 0;
    for (let i = 0; i < this.numberOfLeds; i++) {
      if (this.layers.layerOf[i] !== front) continue;
      top = Math.min(top, g.y[i]);
      halfWidth = Math.max(halfWidth, this.layers.side[i]);
    }
    this.axisY = top + halfWidth;
    this.comets = [];
    this.impacts = [];
    this.lastTime = null;
    this.untilNext = 0;
    this.hue = Math.random();
  }

  launch() {
    const g = this.geometry;
    this.comets.push({
      z: g.depth + 30,
      vz: -this.config.speed * (0.7 + Math.random() * 0.6),
      wobble: Math.random() * 10,
      height: (Math.random() - 0.5) * 0.6 * this.axisY,
      hue: this.hue,
      trail: [],
      bounced: false,
    });
    this.hue = (this.hue + this.config.hueStep) % 1;
  }

  drawFrame(leds, context) {
    const audio = (context.audio && context.audio.currentFrame) || {};
    const dt = this.lastTime === null ? 1 / 60 : Math.min(0.1, (this.timeInMs - this.lastTime) / 1000);
    this.lastTime = this.timeInMs;
    const g = this.geometry;
    const vol = Math.min(1, (audio[this.config.soundMetric] || 0) * this.config.multiplier);

    this.untilNext -= dt * (1 + vol * this.config.music * 3);
    if (this.untilNext <= 0) {
      this.launch();
      this.untilNext = -Math.log(1 - Math.random()) / this.config.cometsPerSecond;
    }

    for (const c of this.comets) {
      c.z += c.vz * dt * (1 + vol * this.config.music);
      c.wobble += dt;
      c.y = this.axisY + c.height * Math.sin(c.wobble * 1.7);
      if (!c.bounced && c.z <= 0) {
        // Rebota en la W y vuelve, un poco más lento.
        c.bounced = true;
        c.z = 0;
        c.vz = -c.vz * this.config.bounce;
        this.impacts.push({y: c.y, age: 0, hue: c.hue});
      }
      c.trail.unshift({z: c.z, y: c.y});
      if (c.trail.length > this.config.trailFrames) c.trail.pop();
    }
    this.comets = this.comets.filter(c => !(c.bounced && c.z > g.depth + 40)).slice(-20);
    for (const im of this.impacts) im.age += dt;
    this.impacts = this.impacts.filter(im => im.age < 1.5);

    const reach = this.config.reach;
    const sat = this.config.saturation;
    const gradient = loadGradient(this.config.colorMap);
    // Con un gradiente, cada cometa toma su color de ahí en vez del arcoíris.
    const colorOf = (hue, s) => gradient ? (gradient.colorAt(hue) || [0, 0, 0]) : ColorUtils.HSVtoRGB(hue, s, 1);

    for (let i = 0; i < this.numberOfLeds; i++) {
      const side = this.layers.side[i], y = g.y[i], z = g.z[i];
      let r = 0, gg = 0, b = 0;

      for (const c of this.comets) {
        // La luz del cometa y de su estela, que cae con la distancia.
        let light = 0;
        for (let k = 0; k < c.trail.length; k += 2) {
          const p = c.trail[k];
          const d2 = side * side + (y - p.y) * (y - p.y) + (z - p.z) * (z - p.z);
          const fade = 1 - k / c.trail.length;
          light = Math.max(light, fade * fade / (1 + d2 / (reach * reach)));
        }
        light = Math.pow(light, 1.3);
        if (light < 0.01) continue;
        const [cr, cg, cb] = colorOf(c.hue, sat * (1 - 0.5 * light));
        r += cr * light; gg += cg * light; b += cb * light;
      }

      if (z < 1) {
        for (const im of this.impacts) {
          // Onda que sale del punto de impacto en la W.
          const dist = Math.hypot(side, y - im.y);
          const radius = im.age * this.config.impactSpeed;
          const ring = Math.exp(-Math.pow((dist - radius) / 3, 2)) * (1 - im.age / 1.5);
          const [cr, cg, cb] = colorOf(im.hue, sat);
          r += cr * ring; gg += cg * ring; b += cb * ring;
        }
      }

      leds[i] = [Math.min(255, r), Math.min(255, gg), Math.min(255, b)];
    }
  }

  static presets() {
    return {
      default: {},
      lluviaDeCometas: {cometsPerSecond: 2, speed: 90, reach: 12, trailFrames: 12},
      bolaDeFuego: {cometsPerSecond: 0.25, speed: 30, reach: 24, trailFrames: 40, saturation: 0.8},
      pingPong: {bounce: 1, cometsPerSecond: 0.6, speed: 60, reach: 18},
      blanco: {saturation: 0, hueStep: 0},
      calabazas: {colorMap: "#ff4d00,#ff9a00,#8a00ff,#39ff14", hueStep: 0.29, reach: 18},
    };
  }

  static configSchema() {
    let res = super.configSchema();
    res.soundMetric = {type: 'soundMetric', default: "bassPeakDecay"};
    res.multiplier = {type: Number, min: 0, max: 3, step: 0.01, default: 1};
    res.music = {type: Number, min: 0, max: 2, step: 0.01, default: 0.6};
    res.cometsPerSecond = {type: Number, min: 0.05, max: 5, step: 0.05, default: 0.6};
    // Unidades de profundidad por segundo.
    res.speed = {type: Number, min: 5, max: 200, step: 1, default: 55};
    res.bounce = {type: Number, min: 0, max: 1.2, step: 0.01, default: 0.6};
    // Hasta dónde ilumina cada cometa.
    res.reach = {type: Number, min: 2, max: 40, step: 0.5, default: 16};
    res.trailFrames = {type: Number, min: 1, max: 60, step: 1, default: 20};
    res.impactSpeed = {type: Number, min: 5, max: 120, step: 1, default: 40};
    res.hueStep = {type: Number, min: 0, max: 0.5, step: 0.01, default: 0.17};
    res.saturation = {type: Number, min: 0, max: 1, step: 0.01, default: 1};
    res.colorMap = {type: "gradient", default: ""};
    return res;
  }
};
