const SoundBasedFunction = require("./../base-programs/SoundBasedFunction");
const ColorUtils = require("./../utils/ColorUtils");
const _ = require("lodash");

module.exports = class Rays extends SoundBasedFunction {
  constructor(config, leds) {
    super(config, leds);
    this.time = 0;
    this.rays = [];
    this.stars = [];
  }

  start(config, draw) {
    super.start(config, draw);
    this.stars = [...Array(this.numberOfLeds)].map(() => [0, 0, 0]);
    this.rays = _.map(_.range(0, this.config.numberOfParticles), () =>
      this.createRay()
    );
  }

  updateRay(ray) {
    let speed = ray.speed * this.config.globalSpeed * ray.direction;
    if (this.config.useSoundSpeed) {
      // let vol = Math.max(0.1, this.averageRelativeVolume - 0.2);
      speed *= (this.bassFastPeakDecay || 0) * 3;
    }
    ray.pos += speed;
  }

  createRay() {
    return {
      pos: Math.floor(Math.random() * this.numberOfLeds),
      speed: Math.random() * 2 + 0.2,
      color: Math.random(),
      saturation: Math.random(),
      direction: this.config.singleDirection
        ? 1
        : Math.sign(Math.random() - 0.5)
    };
  }

  drawFrame(draw) {
    // let decay = this.config.decay;
    this.time++;
    let decay = this.config.decay;

    for (let i = 0; i < this.numberOfLeds; i++) {
      let [r, g, b] = this.stars[i];
      // Dimm all the lights
      [r, g, b] = [r * decay, g * decay, b * decay];

      this.stars[i] = [Math.floor(r), Math.floor(g), Math.floor(b)];
    }

    let sat = this.config.colorSaturationRange;
    let hueOff = this.config.colorHueOffset;
    let hue = this.config.colorHueAmplitude;

    _.each(this.rays, ray => {
      let from = ray.pos;
      this.updateRay(ray);
      let to = ray.pos;

      if (to < from) {
        let toto = to;
        to = from;
        from = toto;
      }

      let energy = (1 / (to - from || 1)) * this.config.brillo;
      let fromLoop = Math.ceil(from) - 1;
      let toLoop = Math.floor(to) + 1;
      for (let i = fromLoop; i < toLoop; i++) {
        let pos = i;
        let [r2, g2, b2] = ColorUtils.HSVtoRGB(
          hueOff + ray.color * hue,
          ray.saturation * sat + 1 - sat,
          1
        );

        let low = energy;
        if (i === fromLoop) {
          low = (Math.ceil(from) - from) * energy;
        } else if (i + 1 === toLoop) {
          low = (to - Math.floor(to)) * energy;
        }

        pos = pos % this.numberOfLeds;
        pos = pos >= 0 ? pos : pos + this.numberOfLeds;
        let [r, g, b] = this.stars[pos];
        [r, g, b] = [
          Math.min(255, r + low * r2),
          Math.min(255, g + low * g2),
          Math.min(255, b + low * b2)
        ];
        this.stars[pos] = [r, g, b];
      }
    });

    draw(this.stars);
  }

  static presets() {
    return {
      normal: {},
      normalSound: {
        globalSpeed: 3,
        useSoundSpeed: true,
        singleDirection: true
      },
      rainbowSmoke: {
        decay: 0.9,
        globalSpeed: 2,
        colorSaturationRange: 0,
        numberOfParticles: 15,
        colorHueAmplitude: 1
      },
      colorSmoke: {
        brillo: 0.5,
        decay: 0.9,
        globalSpeed: 5,
        colorSaturationRange: 0.3,
        numberOfParticles: 30,
        colorHueAmplitude: 1
      },
      crazyDots: {
        decay: 0.2,
        brillo: 1,
        globalSpeed: 4,
        colorSaturationRange: 0,
        numberOfParticles: 40,
        colorHueAmplitude: 1
      },
      longTraces: {
        decay: 0.99,
        brillo: 0.4,
        globalSpeed: 8,
        colorSaturationRange: 0.4,
        numberOfParticles: 10,
        colorHueAmplitude: 1
      },
      slowBlue: {
        decay: 0.92,
        brillo: 0.4,
        globalSpeed: 1,
        colorSaturationRange: 0.4,
        numberOfParticles: 15,
        colorHueAmplitude: 0.1,
        colorHueOffset: 0.57
      },
      fireFast: {
        brillo: 0.5,
        decay: 0.8,
        globalSpeed: 3,
        colorSaturationRange: 0.07,
        numberOfParticles: 90,
        colorHueAmplitude: 0.12,
        colorHueOffset: 0.98,
        singleDirection: true
      },
      fireFastSound: {
        brillo: 0.6,
        decay: 0.8,
        globalSpeed: 3,
        colorSaturationRange: 0.07,
        numberOfParticles: 90,
        colorHueAmplitude: 0.12,
        colorHueOffset: 0.98,
        singleDirection: true,
        useSoundSpeed: true
      },
      fireSlow: {
        brillo: 0.1,
        decay: 0.95,
        globalSpeed: 0.25,
        colorSaturationRange: 0.07,
        numberOfParticles: 50,
        colorHueAmplitude: 0.12,
        colorHueOffset: 0.98
      },
      fireSlowSingle: {
        brillo: 0.1,
        decay: 0.95,
        globalSpeed: 0.25,
        colorSaturationRange: 0.07,
        numberOfParticles: 50,
        colorHueAmplitude: 0.12,
        colorHueOffset: 0.98,
        singleDirection: true
      }
    };
  }

  static configSchema() {
    let config = super.configSchema();
    config.decay = { type: Number, min: 0, max: 1, step: 0.005, default: 0.8 };
    config.globalSpeed = {
      type: Number,
      min: 0,
      max: 7,
      step: 0.005,
      default: 1
    };
    config.brillo = { type: Number, min: 0, max: 1, step: 0.01, default: 1 };
    config.numberOfParticles = {
      type: Number,
      min: 1,
      max: 150,
      step: 1,
      default: 15
    };
    config.colorHueAmplitude = {
      type: Number,
      min: 0,
      max: 1,
      step: 0.01,
      default: 1
    };
    config.colorHueOffset = {
      type: Number,
      min: 0,
      max: 1,
      step: 0.01,
      default: 0.05
    };
    config.colorSaturationRange = {
      type: Number,
      min: 0,
      max: 1,
      step: 0.01,
      default: 0.2
    };
    config.singleDirection = { type: Boolean, default: false };
    config.useSoundSpeed = { type: Boolean, default: false };
    return config;
  }
};
