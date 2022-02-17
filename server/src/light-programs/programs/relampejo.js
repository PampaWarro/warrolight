const LightProgram = require("./../base-programs/LightProgram");
const ColorUtils = require("./../utils/ColorUtils");

module.exports = class Stars extends LightProgram {

  init() {
    this.stars = new Array(this.numberOfLeds).fill([0, 0, 0]);
    this.flashes = [];
    this.time = 0;
  }

  addFlash() {
    let pos = Math.floor(Math.random() * this.numberOfLeds);
    let retina = this.geometry.density[pos];
    let size = this.numberOfLeds * this.config.lightingSize * retina;
    this.flashes.push({
      location:  pos,
      size: Math.ceil(Math.random()*size*0.7+size*0.3),
      flashes: Math.ceil(1+Math.random()*this.config.lightingDuration),
      color: Math.random(),
      sat: 0.75+Math.random()/4
    })
  }

  drawFrame(draw, audio) {
    this.time++;
    let vol = ((audio.currentFrame || {})[this.config.soundMetric] || 0)
    if (vol < this.config.cutThreshold) {
      vol = 0;
    }
    if(this.config.ignoreSound) {
      vol = 1;
    }

    this.stars = new Array(this.numberOfLeds).fill([0, 0, 0]);

    for(const f of this.flashes) {
      for (let i = f.location; i < f.location+f.size; i++) {
        let loc = i % this.numberOfLeds;
        let [r, g, b] = this.stars[loc];

        let range = (i-f.location)/(f.size);

        let segmentDecay = this.config.decay ? range*range : 1;
        let [r2,g2,b2] = ColorUtils.HSVtoRGB(f.color+ range/5,this.config.blackAndWhite ? 0 : f.sat,segmentDecay*vol);

        if(f.flashes < 3 || Math.floor(f.flashes/this.config.blinkSpeed) % 2 !== 0) {
          [r, g, b] = [r + r2, g + g2, b + b2];
        }

        this.stars[loc] = [r, g, b];
      }
      f.flashes--;
    }

    this.flashes = this.flashes.filter(f => f.flashes > 0);

    for(let i = 0; i< (this.config.flashes - this.flashes.length);i++) {
      if (this.config.ignoreSound) {
        if(Math.random() < this.config.refillChance) {
          this.addFlash();
        }
      } else {
        if(Math.random() < vol) {
          this.addFlash();
        }
      }
    }

    draw(this.stars.map(([r, g, b]) => ColorUtils.dim([r, g, b], this.config.brillo)));
  }

  static presets() {
    return {};
  }

  static configSchema() {
    let config = super.configSchema();
    config.brillo = { type: Number, min: 0, max: 1, step: 0.01, default: 1 };
    config.flashes = {type: Number, min: 1, max: 50, step: 1, default: 2};
    config.lightingSize = {type: Number, min: 0.001, max: 1, step: 0.001, default: 0.15};
    config.lightingDuration = {type: Number, min: 1, max: 100, step: 1, default: 15};
    config.blinkSpeed = {type: Number, min: 1, max: 20, step: 1, default: 6};
    config.refillChance = {type: Number, min: 0.001, max: 1, step: 0.001, default: 0.2};
    config.cutThreshold = {type: Number, min: 0, max: 1, step: 0.01, default: 0.45};
    config.soundMetric = {type: 'soundMetric', default: "bassFastPeakDecay"};
    config.blackAndWhite = { type: Boolean, default: false };
    config.decay = { type: Boolean, default: true };
    config.ignoreSound = { type: Boolean, default: true };
    // config.starsColor = {type: Number, min: 0, max: 1, step: 0.01, default: 0};
    return config;
  }
};
