const SoundBasedFunction = require("./../base-programs/SoundBasedFunction");
const ColorUtils = require("./../utils/ColorUtils");
const _ = require("lodash");

class Dot {
  constructor(numberOfLeds) {
    this.numberOfLeds = numberOfLeds;
    this.pos = Math.floor(Math.random() * numberOfLeds);
    this.speed = 1;
    this.intensity = Math.random();
    this.val = 0.1;
    this.color = Math.random() / 3;
    this.saturation = Math.random() * 0.3 + 0.7;
    this.direction = Math.sign(Math.random() - 0.5);
  }

  update(speedWeight, vol) {
    if (this.val < this.intensity) {
      this.val += 0.05;
    }

    this.pos =
      this.pos + vol * vol * 4 * speedWeight * this.speed;

    this.pos = this.pos % this.numberOfLeds;

    if (this.pos < 0) {
      this.pos = this.numberOfLeds + this.pos;
    }
  }
}

module.exports = class AliveDotsSpeed extends SoundBasedFunction {
  constructor(config, leds) {
    super(config, leds);
    this.time = 0;

    this.dots = [];
    for (let i = 0; i < this.config.numberOfParticles; i++) {
      this.dots.push(new Dot(this.numberOfLeds));
    }
  }

  drawFrame(draw) {
    // let decay = this.config.decay;
    this.time++;
    this.stars = [...Array(this.numberOfLeds)].map(() => [0, 0, 0]);

    for (let dot of this.dots) {
      let roundPos = Math.floor(dot.pos);
      let roundPosNext = (roundPos + 1) % this.numberOfLeds;
      let [r2, g2, b2] = ColorUtils.HSVtoRGB(
        dot.color + this.config.toneColor,
        dot.saturation,
        dot.val
      );

      let [r, g, b] = this.stars[roundPos];
      let [ru, gu, bu] = this.stars[roundPosNext];

      dot.update(this.config.speedWeight, this.audio.medianVolume);

      let high = dot.pos - roundPos;
      let low = 1 - high;

      [r, g, b] = ColorUtils.clamp(r + low * r2, g + low * g2, b + low * b2);
      [ru, gu, bu] = ColorUtils.clamp(
        ru + high * r2,
        gu + high * g2,
        bu + high * b2
      );

      this.stars[roundPos] = [r, g, b];
      this.stars[roundPosNext] = [ru, gu, bu];
    }

    draw(
      this.stars.map(([r, g, b]) =>
        ColorUtils.dim([r, g, b], this.config.brillo)
      )
    );
  }

  static presets() {
    return {
      normal: {
        brillo: 1,
        speedWeight: 1,
        numberOfParticles: 50,
        toneColor: 0.7
      }
    };
  }

  static configSchema() {
    let config = super.configSchema();
    config.brillo = { type: Number, min: 0, max: 1, step: 0.01, default: 1 };
    config.speedWeight = {
      type: Number,
      min: 0,
      max: 5,
      step: 0.1,
      default: 1
    };
    config.numberOfParticles = {
      type: Number,
      min: 1,
      max: 600,
      step: 1,
      default: 30
    };
    config.toneColor = {
      type: Number,
      min: 0,
      max: 1,
      step: 0.01,
      default: 0.5
    };
    return config;
  }
};
