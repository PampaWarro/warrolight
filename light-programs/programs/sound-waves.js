const SoundBasedFunction = require("./../base-programs/SoundBasedFunction");
const ColorUtils = require("./../utils/ColorUtils");
const _ = require("lodash");

module.exports = class SoundWaves extends SoundBasedFunction {
  constructor(config, leds) {
    super(config, leds);
    this.time = 0;
    let self = this;
    this.lastCreation = new Date();
    this.dots = []

    this.createDot = () => {
      let relativeVolume = self.averageRelativeVolume
      //console.log(`Nuevo dot intensidad ${Math.round(relativeVolume * 100)}% (of ${self.dots.length}) vol real ${Math.round(100 * self.averageVolume)}`)
      return {
        centerX: this.config.centerX,
        centerY: this.config.centerY,
        speed: relativeVolume * relativeVolume + 0.05,
        // speed: 0.1,
        intensity: relativeVolume,
        distance: self.config.initialDistance,
        color: relativeVolume,
        saturation: 0.9,
        update: function () {
          this.distance += (self.config.haciaAfuera ? 1 : -1) * this.speed * self.config.speed
          this.intensity = this.intensity * (3 + Math.sqrt(relativeVolume)) / 4
        }
      }
    }

  }

  drawFrame(draw, done) {
    let timeSinceLastCreation = new Date() - this.lastCreation;
    if ((timeSinceLastCreation > 100 && this.averageRelativeVolume > 0.3) || (timeSinceLastCreation > 500 && this.averageRelativeVolume > 0.1)) {
      this.dots.push(this.createDot())
      this.lastCreation = new Date();

      this.dots = _.filter(this.dots, d => d.intensity > 0.001);

      if (this.dots.length > 30) {
        this.dots.shift();
        // console.log("SoundWaves: making space", this.dots.length)
      }
    }

    let geometry = this.position || this.geometry;

    const colors = _.map(new Array(this.numberOfLeds), c => [0,0,0])
    for (let i = 0; i < this.numberOfLeds; i++) {
      let [r, g, b] = [0, 0, 0]
      _.each(this.dots, dot => {
        let y = geometry.y[i] - geometry.height / 2 + dot.centerY;
        let x = geometry.x[i] - geometry.width / 2 - dot.centerX;
        let d = Math.sqrt(x * x + y * y)

        let distance = Math.abs(dot.distance - d);
        let maxDis = this.config.waveWidth;
        if (distance < maxDis) {
          let [r2, g2, b2] = ColorUtils.HSVtoRGB(dot.color, dot.saturation, (1 - distance / maxDis) * dot.intensity * 1)
          r = r + r2;
          g = g + g2;
          b = b + b2;
        }
      })
      colors[i] = ColorUtils.dim([r, g, b], this.config.brillo)
    }

    _.each(this.dots, dot => dot.update());

    draw(colors)
  }

  static presets() {
    return {
      "hexagono": {initialDistance: 19.8, haciaAfuera: false, speed: 0.6, waveWidth: 2},
      "default": {},
      "deLasPuntas": {speed: 1, waveWidth: 2, initialDistance: 40, haciaAfuera: false, brillo: 0.5},
      "centroLento": {speed: 0.1},
      "centroLentoDark": {speed: 0.1, brillo: 0.25},
      "centroFast": {speed: 2},
      "centroBrightFast": {speed: 0.7, brillo: 2, waveWidth: 2},
      "abajoFast": {centerY: -17.3, speed: 2},
      "xInvertida": {initialDistance: 15, haciaAfuera: false},
      "deArribaAbajo": {initialDistance: 40, centerY: -17, haciaAfuera: false, speed: 2}
    }
  }

  static configSchema() {
    let config = super.configSchema();

    config.brillo = {type: Number, min: 0, max: 3, step: 0.01, default: 1}
    config.initialDistance = {type: Number, min: 0, max: 40, step: 0.1, default: 0}
    config.centerY =  {type: Number, min: -20, max: 20, step: 1, default: 0}
    config.centerX =  {type: Number, min: -20, max: 20, step: 1, default: 0}
    config.waveWidth = {type: Number, min: 0, max: 10, step: 0.1, default: 2.5}
    config.speed = {type: Number, min: 0.1, max: 10, step: 0.1, default: 1}
    config.haciaAfuera = {type: Boolean, default: true}

    // config.musicWeight = {type: Number, min: 0, max: 5, step: 0.1, default: 1}
    // config.numberOfParticles = {type: Number, min: 1, max: 600, step: 1, default: 50}
    // config.toneColor  = {type: Number, min: 0, max: 1, step: 0.01, default: 0.5}
    return config;
  }
}