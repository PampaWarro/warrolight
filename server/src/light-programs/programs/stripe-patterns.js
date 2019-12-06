const SoundBasedFunction = require("./../base-programs/SoundBasedFunction");
const ColorUtils = require("./../utils/ColorUtils");
const _ = require("lodash");

module.exports = class StripePattern extends SoundBasedFunction {
  constructor(config, leds) {
    super(config, leds);

    this.time = 0;
  }

  pickRandomColor() {
    this.randomColor = ColorUtils.HSVtoRGB(
      Math.random(),
      Math.random() * 0.3 + 0.7,
      Math.random() * 0.8 + 0.2
    );
  }

  rebuildPattern(audio) {
    if (!this.pattern) {
      this.pattern = _.map(
        _.range(0, this.config.patternLength),
        x => this.randomColor
      );
    }

    let blockSize = 5;

    // this.pattern = _.map(this.pattern, color => ColorUtils.dim(color, 0.97));

    let pSize = this.pattern.length;
    let mixRatio = this.config.mixRatio * 2 * (audio.bassRms || 0);
    for (let i = 0; i < 6; i++) {
      let randomPosition = Math.floor(Math.random() * (pSize - blockSize));
      for (let j = 0; j < blockSize; j++) {
        let pos = (randomPosition + j) % pSize;
        this.pattern[pos] = ColorUtils.mix(
          this.pattern[pos],
          this.randomColor,
          mixRatio
        );
      }
    }

    let black = [0, 0, 0];
    for (let i = 0; i < 6; i++) {
      let randomPosition = Math.floor(Math.random() * pSize);
      for (let j = 0; j < blockSize; j++) {
        let pos = (randomPosition + j) % pSize;
        this.pattern[pos] = ColorUtils.mix(
          this.pattern[pos],
          black,
          mixRatio * 4
        );
      }
    }
  }

  start(config, draw) {
    this.pickRandomColor();
    this.rebuildPattern();
    super.start(config, draw);
  }

  drawFrame(draw, audio) {
    this.time += this.config.speed;
    const newColors = new Array(this.numberOfLeds);

    this.rebuildPattern(audio);
    if (Math.random() < 1 / 20) {
      this.pickRandomColor();
    }

    for (let i = 0; i < this.numberOfLeds; i++) {
      newColors[i] = this.pattern[
        (i + Math.floor(this.time)) % this.pattern.length
      ];
    }
    draw(newColors);
  }

  static presets() {
    return {
      default: { speed: 0.25, brillo: 0.4 },
      slowMarks: { speed: 3, sameColorLeds: 5 }
    };
  }

  // Override and extend config Schema
  static configSchema() {
    let config = super.configSchema();
    config.speed = { type: Number, min: 0, max: 20, step: 0.1, default: 0.25 };
    config.patternLength = { type: Number, min: 1, max: 100, default: 50 };
    config.brillo = { type: Number, min: 0, max: 1, step: 0.01, default: 0.3 };
    config.mixRatio = {
      type: Number,
      min: 0,
      max: 1,
      step: 0.01,
      default: 0.02
    };
    return config;
  }
};
