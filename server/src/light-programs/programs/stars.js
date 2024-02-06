const LightProgram = require("./../base-programs/LightProgram");
const ColorUtils = require("./../utils/ColorUtils");

module.exports = class Stars extends LightProgram {

  init() {
    this.stars = new Array(this.numberOfLeds).fill([0, 0, 0]);
    this.time = 0;
  }

  drawFrame(leds) {
    let decay = this.config.decay;
    this.time++;

    for (let i = 0; i < this.numberOfLeds; i++) {
      let [r, g, b] = this.stars[i];
      // Dimm all the lights
      [r, g, b] = [r * decay, g * decay, b * decay];

      // Create new stars
      if (Math.random() < this.config.probability) {
        let [r2, g2, b2] = ColorUtils.HSVtoRGB(
          this.config.starsColor + Math.random() / 5,
          Math.random(),
          Math.random() * 0.5 + 0.5
        );
        [r, g, b] = [r + r2, g + g2, b + b2];
      }

      this.stars[i] = [r, g, b];
    }
    let everyNFrame = Math.round(Math.max(1, 1/this.config.moveSpeed));
    if (this.config.move && this.time % everyNFrame === 0) {
      for(let i = 0; i < Math.ceil(this.config.moveSpeed);i++) {
        let first = this.stars.shift();
        this.stars.push(first);
      }
    }
    this.stars.forEach(([r, g, b], i) => {
      leds[i] = ColorUtils.dim([r, g, b], this.config.brillo)
    });
  }

  static presets() {
    return {
      pocasSlow: { decay: 0.97, probability: 0.0003 },
      slowBlue: {
        decay: 0.97,
        probability: 0.003,
        starsColor: 0.58,
        brillo: 0.05
      },
      pocasMoving: { decay: 0.97, probability: 0.002, move: true, brillo: 1 }
    };
  }

  static configSchema() {
    let config = super.configSchema();
    config.decay = { type: Number, min: 0, max: 1, step: 0.005, default: 0.9 };
    config.brillo = { type: Number, min: 0, max: 1, step: 0.01, default: 1 };
    config.probability = {type: Number, min: 0, max: 1, step: 0.0001, default: 0.001};
    config.move = { type: Boolean, default: false };
    config.moveSpeed = { type: Number, min: 0, step: 0.1, max: 10, default: 1 };
    config.starsColor = {type: Number, min: 0, max: 1, step: 0.01, default: 0};
    return config;
  }
};
