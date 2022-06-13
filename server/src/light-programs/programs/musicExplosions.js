const LightProgram = require("./../base-programs/LightProgram");
const ColorUtils = require("./../utils/ColorUtils");
const {loadGradient} = require("../utils/gradients");

module.exports = class MusicExplosions extends LightProgram {
  init() {
    this.lastVolume = new Array(this.numberOfLeds + 1).fill([0, 0, 0]);
    this.time = 0;
    this.maxVolume = 0;

    this.explosions = [];
    this.color = Math.random();
  }

  addExplosion(vol) {
    let location = Math.floor(Math.random() * this.numberOfLeds);
    let centerX = this.geometry.x[location];
    let centerY = this.geometry.y[location];

    let energy = (vol * this.config.energy) ** this.config.power;
    this.explosions.push({
      centerX,
      centerY,
      age: 1,
      energy,
      initialEnergy: energy,
      radius: energy,
    })
  }

  // Override parent method
  drawFrame(leds, context) {
    let audio = context.audio;
    audio = audio.currentFrame || {};
    this.time += this.config.speed;

    let vol = (audio[this.config.soundMetric] || 0) * this.config.multiplier;

    // Como las luces tenues son MUY fuertes igual, a partir de cierto valor "las bajamos"
    if (vol < this.config.cutThreshold) {
      vol = 0;
      this.needingReshuffle = true;
      this.maxVolume = 0;
    } else {
      if (this.needingReshuffle || !this.explosions.length || (this.config.allowMultiple && vol > this.maxVolume)) {
        this.maxVolume = vol;
        // vol = (vol - this.config.cutThreshold) / (1 - this.config.cutThreshold);
        this.addExplosion(vol);
        this.needingReshuffle = false;
        // this.assignLights();
      } else {
        this.explosions[this.explosions.length-1].energy += vol;
      }
    }

    const gradient = loadGradient(this.config.colorMap);

    for (let i = 0; i < this.numberOfLeds; i++) {
      let e = 0;
      const x = this.geometry.x[i];
      const y = this.geometry.y[i]; // 18 is the offset

      for (const {centerX, centerY, energy, radius} of this.explosions) {
        let d = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
        if (d < radius) {
          e += energy / d;
        }
      }

      e = Math.min(e, 1);
      if(gradient) {
        this.lastVolume[i] = gradient.colorAt(1 - Math.min(1, e));
      } else {
        if (this.config.blackAndWhite) {
          this.lastVolume[i] = ColorUtils.HSVtoRGB(0, 0, Math.min(e, 1));
        } else {
          this.lastVolume[i] = ColorUtils.HSVtoRGB(this.color+e/3, 1 - e**1.5, e);
        }
      }
    }

    for (const exp of this.explosions) {
      exp.radius += exp.initialEnergy/(exp.age/10)*this.config.blastSpeed;
      exp.energy = exp.energy / Math.max(exp.radius**this.config.depowering, 1.1);
      exp.age++;
    }

    this.explosions = this.explosions.filter(exp => exp.energy > 0.01);

    leds.forEach((v, i) => {
      leds[i] = this.lastVolume[i];
    });
  }

  static presets() {
    return {};
  }

  // Override and extend config Schema
  static configSchema() {
    let res = super.configSchema();
    res.power = {type: Number, min: 0, max: 10, step: 0.1, default: 1};
    res.energy = {type: Number, min: 0, max: 10, step: 0.1, default: 1};
    res.depowering = {type: Number, min: 0, max: 2, step: 0.01, default: 0.5};
    res.blastSpeed = {type: Number, min: 0, max: 2, step: 0.01, default: 1};

    res.multiplier = {type: Number, min: 0, max: 2, step: 0.01, default: 1};
    res.cutThreshold = {type: Number, min: 0, max: 1, step: 0.01, default: 0.45};
    res.soundMetric = {type: 'soundMetric', default: "bassFastPeakDecay"};
    res.colorMap =  {
      type: 'gradient',
      default: '',
    };
    res.blackAndWhite = { type: Boolean, default: false };
    res.allowMultiple = { type: Boolean, default: false };
    return res;
  }
};
