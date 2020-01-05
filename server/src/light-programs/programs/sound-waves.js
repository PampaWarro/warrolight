const LightProgram = require("./../base-programs/LightProgram");
const ColorUtils = require("./../utils/ColorUtils");
const _ = require("lodash");

class Dot {
  constructor(config, relativeVolume) {
    //console.log(`Nuevo dot intensidad ${Math.round(relativeVolume * 100)}% (of ${self.dots.length}) vol real ${Math.round(100 * self.audio.averageVolume)}`)
    this.waveCenterX = config.waveCenterX;
    this.waveCenterY = config.waveCenterY;
    this.speed = relativeVolume * relativeVolume + 0.05;
    // this.speed = 0.1;
    this.intensity = relativeVolume;
    this.distance = config.initialDistance;
    this.color = relativeVolume;
    this.saturation = 0.95;
  }
}

module.exports = class SoundWaves extends LightProgram {

  init() {
    this.time = 0;
    this.lastCreation = new Date();
    this.dots = [];
  }

  updateWave(wave) {
    wave.distance +=
      (this.config.haciaAfuera ? 1 : -1) * wave.speed * this.config.waveSpeed;
    wave.intensity = (wave.intensity * (3 + Math.sqrt(wave.intensity))) / 4;
  }

  drawFrame(draw, audio) {
    if (!audio.ready) {
      return;
    }
    audio = audio.currentFrame;
    let timeSinceLastCreation = new Date() - this.lastCreation;
    if (
      (timeSinceLastCreation > 50 && audio.peakDecay > 0.3) ||
      (timeSinceLastCreation > 350 && audio.peakDecay > 0.1)
    ) {
      this.dots.push(new Dot(this.config, audio.peakDecay));
      this.lastCreation = new Date();

      this.dots = _.filter(
        this.dots,
        d =>
          d.intensity > 0.001 &&
          d.distance < 150 &&
          d.distance > -this.config.waveWidth
      );

      if (this.dots.length > 45) {
        this.dots.shift();
        // console.log("SoundWaves: making space", this.dots.length)
      }
    }

    let geometry = this.geometry;

    const colors = _.map(new Array(this.numberOfLeds), c => [0, 0, 0]);
    for (let i = 0; i < this.numberOfLeds; i++) {
      let [r, g, b] = [0, 0, 0];
      _.each(this.dots, dot => {
        let y = geometry.y[i] - (geometry.height - 18) / 2 + dot.waveCenterY;
        let x = geometry.x[i] - geometry.width / 2 - dot.waveCenterX;
        let d = Math.sqrt(x * x + y * y);

        let distance = Math.abs(dot.distance - d);
        let maxDis = this.config.waveWidth;
        if (distance < maxDis) {
          let [r2, g2, b2] = ColorUtils.HSVtoRGB(
            dot.color,
            dot.saturation,
            1 *
              Math.pow(1 - distance / maxDis, this.config.wavePower) *
              dot.intensity *
              1
          );
          r = r + r2;
          g = g + g2;
          b = b + b2;
        }
      });
      colors[i] = ColorUtils.dim([r, g, b], this.config.brilloWave);
    }

    _.each(this.dots, dot => this.updateWave(dot));

    draw(colors);
  }

  static presets() {
    return {
      hexagono: {
        initialDistance: 69,
        haciaAfuera: false,
        waveSpeed: 1,
        waveWidth: 2
      },
      default: { waveCenterY: 0 },
      deLasPuntas: {
        waveSpeed: 1,
        waveWidth: 2,
        initialDistance: 40,
        haciaAfuera: false,
        brilloWave: 0.5
      },
      centroLento: { waveSpeed: 0.1 },
      centroLentoDark: { waveSpeed: 0.1, brilloWave: 0.25 },
      centroFast: { waveSpeed: 3 },
      centroDots: { waveSpeed: 2, waveWidth: 0.5 },
      centroBrightFast: {
        waveSpeed: 0.7,
        brilloWave: 2,
        waveWidth: 1,
        waveCenterY: -17.3
      },
      abajoFast: { waveCenterY: -17.3, waveSpeed: 3, waveWidth: 3 },
      xInvertida: { initialDistance: 15, haciaAfuera: false },
      deArribaAbajo: {
        initialDistance: 67,
        waveCenterY: -40,
        haciaAfuera: false,
        waveSpeed: 2
      }
    };
  }

  static configSchema() {
    let config = super.configSchema();

    config.brilloWave = {
      type: Number,
      min: 0,
      max: 3,
      step: 0.01,
      default: 0.5
    };
    config.initialDistance = {
      type: Number,
      min: 0,
      max: 100,
      step: 0.1,
      default: 0
    };
    config.waveCenterY = {
      type: Number,
      min: -40,
      max: 40,
      step: 1,
      default: 0
    };
    config.waveCenterX = {
      type: Number,
      min: -60,
      max: 60,
      step: 1,
      default: 0
    };
    config.waveWidth = {
      type: Number,
      min: 0,
      max: 10,
      step: 0.1,
      default: 2.5
    };
    config.waveSpeed = {
      type: Number,
      min: 0.1,
      max: 10,
      step: 0.1,
      default: 1
    };
    config.haciaAfuera = { type: Boolean, default: true };
    config.wavePower = {
      type: Number,
      min: 0.5,
      max: 10,
      step: 0.5,
      default: 1.2
    };
    // config.colorHueOffset = {type: Number, min: 0, max: 1, step: 0.01, default: 0}

    // config.musicWeight = {type: Number, min: 0, max: 5, step: 0.1, default: 1}
    // config.numberOfParticles = {type: Number, min: 1, max: 600, step: 1, default: 50}
    // config.toneColor  = {type: Number, min: 0, max: 1, step: 0.01, default: 0.5}
    return config;
  }
};
