import {ColorUtils} from "../utils/ColorUtils";
import {SoundBasedFunction} from "./SoundBasedFunction";
var _ = require("lodash");

export class Func extends SoundBasedFunction {
  constructor(config, leds) {
    super(config, leds);
    this.time = 0;
    let self = this;
    this.lastVolume = 0;
    this.lastCreation = new Date();
    this.dots = []

    this.createDot = () => {
      let relativeVolume = Math.min(1, self.averageVolume / self.maxVolume);
      //console.log(`Nuevo dot intensidad ${Math.round(relativeVolume * 100)}% (of ${self.dots.length}) vol real ${Math.round(100 * self.averageVolume)}`)
      return {
        centerX: this.config.centerX,
        centerY: this.config.centerY,
        speed: Math.pow(relativeVolume, 2) * 1 + 0.05,
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
    if ((timeSinceLastCreation > 25 && this.averageVolume > 0.05) || (timeSinceLastCreation > 500 && this.averageVolume > 0.02)) {
      this.dots.push(this.createDot())
      this.lastCreation = new Date();

      this.dots = _.filter(this.dots, d => d.intensity > 0.0001);

      if (this.dots.length > 150) {
        this.dots.shift();
        console.log("SoundWaves: making space")
      }
    }

    let geometry = this.position || this.geometry;

    const colors = _.map(new Array(this.numberOfLeds), c => "#000000")
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
      colors[i] = ColorUtils.rgbToHex(r * this.config.brillo, g * this.config.brillo, b * this.config.brillo)
    }

    _.each(this.dots, dot => dot.update());

    draw(colors)
  }

  static presets() {
    return {
      // "constanteLento": {musicWeight: 0, speedWeight: 0.1, numberOfParticles: 70, toneColor: 0.5},
      // "constanteLentoUnidirecional": {musicWeight: 0, speedWeight: 0.3, numberOfParticles: 90, toneColor: 0.55, doble: false},
      // "constanteRapidoPocas": {musicWeight: 0, speedWeight: 2, numberOfParticles: 10, toneColor: 0.3},
      // "musicModerado": {musicWeight: 1, speedWeight: 0, numberOfParticles: 150, toneColor: 0.5},
      // "musicMediaSlow": {musicWeight: 2, speedWeight: 0.05, numberOfParticles: 150, toneColor: 0.5, doble: false, brillo: 1},
      // "musicQuilombo": {musicWeight: 1, speedWeight: 1, numberOfParticles: 70, toneColor: 0.7}
    }
  }

  static configSchema() {
    let config = super.configSchema();
    config.brillo = {type: Number, min: 0, max: 1, step: 0.01, default: 1}
    config.initialDistance = {type: Number, min: 0, max: 40, step: 0.1, default: 0}
    config.centerY =  {type: Number, min: -20, max: 20, step: 1, default: 0}
    config.centerX =  {type: Number, min: -20, max: 20, step: 1, default: 0}
    config.waveWidth = {type: Number, min: 0, max: 10, step: 0.1, default: 2}
    // config.musicWeight = {type: Number, min: 0, max: 5, step: 0.1, default: 1}
    config.speed = {type: Number, min: 0.1, max: 10, step: 0.1, default: 1}
    // config.numberOfParticles = {type: Number, min: 1, max: 600, step: 1, default: 50}
    config.haciaAfuera = {type: Boolean, default: true}
    // config.toneColor  = {type: Number, min: 0, max: 1, step: 0.01, default: 0.5}
    return config;
  }
}