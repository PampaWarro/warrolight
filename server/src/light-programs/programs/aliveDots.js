const LightProgram = require("./../base-programs/LightProgram");
const ColorUtils = require("./../utils/ColorUtils");
const _ = require("lodash");

class Dot {
  constructor(numberOfLeds) {
    this.pos = Math.floor(Math.random() * numberOfLeds);
    this.speed = Math.random() * 2 + 0.2;
    this.intensity = Math.random();
    this.val = 0.1;
    this.color = Math.random() / 3;
    this.saturation = Math.random() * 0.3 + 0.7;
    this.direction = Math.sign(Math.random() - 0.5);
  }
}

module.exports = class AliveDots extends LightProgram {
  constructor(config, leds) {
    super(config, leds);
    this.time = 0;
    this.lastVolume = 0;
  }

  start(config, draw) {
    super.start(config, draw);
    this.dots = _.map(
      _.range(this.config.numberOfParticles),
      () => new Dot(this.numberOfLeds)
    );
  }

  drawFrame(draw, audio) {
    // let decay = this.config.decay;
    this.time++;
    this.stars = [...Array(this.numberOfLeds)].map(() => [0, 0, 0]);

    _.each(this.dots, dot => {
      let roundPos = Math.floor(dot.pos);
      let roundPosNext = (roundPos + 1) % this.numberOfLeds;
      let [r2, g2, b2] = ColorUtils.HSVtoRGB(
        dot.color + this.config.toneColor,
        dot.saturation,
        dot.val
      );

      let [r, g, b] = this.stars[roundPos];
      let [ru, gu, bu] = this.stars[roundPosNext];

      this.updateDot(dot, audio);

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
    });

    this.lastVolume = audio.bassRms || 0;
    draw(
      this.stars.map(([r, g, b]) =>
        ColorUtils.dim([r, g, b], this.config.brillo)
      )
    );
  }

  updateDot(dot, audio) {
    if (dot.val < dot.intensity) {
      dot.val += 0.05;
    }

    let vol = audio.averageVolume;
    let volDiff = vol - this.lastVolume;
    dot.pos =
      dot.pos +
      dot.speed * (vol * vol) * 100 * this.config.musicWeight * volDiff +
      (this.config.doble ? dot.direction : 1) *
        this.config.speedWeight *
        dot.speed;

    dot.pos = dot.pos % this.numberOfLeds;
    // dot.intensity = vol
    if (dot.pos < 0) {
      dot.pos = this.numberOfLeds + dot.pos;
    }
  }

  static presets() {
    return {
      constanteLento: {
        musicWeight: 0,
        speedWeight: 0.1,
        numberOfParticles: 15,
        toneColor: 0.5
      },
      // "constanteLentoUnidirecional": {musicWeight: 0, speedWeight: 0.3, numberOfParticles: 15, toneColor: 0.55, doble: false},
      constanteRapidoPocas: {
        musicWeight: 0,
        speedWeight: 1,
        numberOfParticles: 10,
        toneColor: 0.3
      },
      musicModerado: {
        musicWeight: 1,
        speedWeight: 0,
        numberOfParticles: 15,
        toneColor: 0.5
      },
      // "musicMediaSlow": {musicWeight: 2, speedWeight: 0.05, numberOfParticles: 15, toneColor: 0.5, doble: false, brillo: 1},
      musicQuilombo: {
        musicWeight: 1,
        speedWeight: 0.5,
        numberOfParticles: 15,
        toneColor: 0.7
      }
    };
  }

  static configSchema() {
    let config = super.configSchema();
    config.brillo = { type: Number, min: 0, max: 1, step: 0.01, default: 1 };
    config.musicWeight = {
      type: Number,
      min: 0,
      max: 5,
      step: 0.1,
      default: 1
    };
    config.speedWeight = {
      type: Number,
      min: 0,
      max: 5,
      step: 0.1,
      default: 0.1
    };
    config.numberOfParticles = {
      type: Number,
      min: 1,
      max: 600,
      step: 1,
      default: 10
    };
    config.doble = { type: Boolean, default: true };
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
