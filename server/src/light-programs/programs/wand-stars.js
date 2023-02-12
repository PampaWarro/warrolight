const LightProgram = require("./../base-programs/LightProgram");
const ColorUtils = require("./../utils/ColorUtils");
const {random} = require("lodash");

module.exports = class WandStars extends LightProgram {

  init() {
    this.stars = new Array(this.numberOfLeds).fill([0, 0, 0]);
    this.time = 0;
    this.forcedStars = [];
  }

  createStarColors(){
    return ColorUtils.HSVtoRGB(
        this.config.starsColor + Math.random() / 5,
        Math.random(),
        Math.random() * 0.5 + 0.5
    );
  }

  tap(data){
    // main star
    this.forcedStars.push({position: data.position, ttl: this.config.forcedTTL});

    // add rippled stars left and right
    for (let i = 1 ; i < this.config.ripple ; i++){
      let rippleStarLeft = data.position - i;
      let rippleStarRight = data.position + i;
      rippleStarLeft = rippleStarLeft <= 0 ? 0 : rippleStarLeft;
      rippleStarRight = rippleStarRight >= this.numberOfLeds ? (this.numberOfLeds-1) : rippleStarRight;

      let rightTTL = random(this.config.forcedTTL - this.config.forcedTTL/10, this.config.forcedTTL + this.config.forcedTTL/10);
      let leftTTL = random(this.config.forcedTTL - this.config.forcedTTL/10, this.config.forcedTTL + this.config.forcedTTL/10);
      this.forcedStars.push({position: rippleStarLeft, ttl: rightTTL});
      this.forcedStars.push({position: rippleStarRight, ttl: leftTTL});
    }
  }

  drawFrame(leds) {
    let decay = this.config.decay;
    let probability = this.config.probability / 1000;
    this.time++;

    // decreased forced stars' ttl
    for (let k = 0 ; k < this.forcedStars.length ; k++){
      let ttl = this.forcedStars[k].ttl--;
      if (ttl < 0){
        this.forcedStars.pop(k);
      }
    }


    for (let i = 0; i < this.numberOfLeds; i++) {
      let isForced = false;
      let [r, g, b] = this.stars[i];

      for (let j = 0 ; j < this.forcedStars.length && !isForced ; j++){
        isForced = this.forcedStars[j].position === i ? true : false;
      }

      let [r2, g2, b2] = this.createStarColors();
      // Create new stars
      if (isForced || Math.random() < probability) {
        [r, g, b] = [r + r2, g + g2, b + b2];
      }

      // Dimm all the lights, but the forced ones
      [r, g, b] = [r * decay, g * decay, b * decay];

      this.stars[i] = [r, g, b];
    }
    if (this.config.move && (Math.floor((this.time*2)*this.config.moveSpeed) % 2 == 0)) {
      let first = this.stars.shift();
      this.stars.push(first);
    }
    this.stars.forEach(([r, g, b], i) => {
      leds[i] = ColorUtils.dim([r, g, b], this.config.brillo);
    });
  }

  static presets() {
    return {
      pocasSlow: { decay: 0.97, probability: 0.3 },
      pocasFast: { decay: 0.88, probability: 20 },
      slowBlue: {
        decay: 0.97,
        probability: 0.003,
        starsColor: 0.58,
        brillo: 0.05
      },
      muchasFast: { decay: 0.88, probability: 50 },
      muchasSlow: { decay: 0.95, probability: 60 },
      pocasMoving: { decay: 0.97, probability: 2, move: true, brillo: 1 }
    };
  }

  static configSchema() {
    let config = super.configSchema();
    config.decay = { type: Number, min: 0, max: 1, step: 0.005, default: 0.9 };
    config.brillo = { type: Number, min: 0, max: 1, step: 0.01, default: 1 };
    config.ripple = { type: Number, min: 0, max: 50, step: 1, default: 5 };
    config.forcedTTL = { type: Number, min: 0, max: 100, step: 1, default: 10 };;
    config.probability = {type: Number, min: 0, max: 10, step: 0.1, default: 1};
    config.move = { type: Boolean, default: false };
    config.moveSpeed = { type: Number, min: 0, step: 0.01, max: 1, default: 0.2 };
    config.starsColor = {type: Number, min: 0, max: 1, step: 0.01, default: 0};
    return config;
  }
};
