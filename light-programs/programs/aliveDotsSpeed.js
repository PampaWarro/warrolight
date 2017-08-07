const SoundBasedFunction = require("./../base-programs/SoundBasedFunction");
const ColorUtils = require("./../utils/ColorUtils");
const _ = require('lodash');

module.exports = class Func extends SoundBasedFunction {
  constructor(config, leds) {
    super(config, leds);
    this.time = 0;
    let self = this;

    this.createDot = () => {
      return {
        pos: Math.floor(Math.random()*this.numberOfLeds),
        speed: 1,
        intensity: Math.random(),
        val: 0.1,
        color: Math.random()/3,
        saturation: Math.random()*0.3+0.7,
        direction: Math.sign(Math.random()-0.5),
        update: function() {
          if(this.val < this.intensity){
            this.val += 0.05
          }
          let vol = self.medianVolume * 5;
          this.pos = this.pos + (vol * vol * 2) * self.config.speedWeight * this.speed

          this.pos = this.pos % self.numberOfLeds
          // this.intensity = vol
          if(this.pos < 0){
            this.pos = self.numberOfLeds + this.pos
          }
        }
      }
    }

    this.dots = _.map(_.range(this.config.numberOfParticles), i => this.createDot())
  }

  drawFrame(draw, done) {
    // let decay = this.config.decay;
    this.time++
    this.stars = [... Array(this.numberOfLeds)].map(() => [0, 0, 0]);

    _.each(this.dots, dot => {
      let roundPos = Math.floor(dot.pos)
      let roundPosNext = (roundPos+1)%this.numberOfLeds
      let [r2, g2, b2] = ColorUtils.HSVtoRGB(dot.color + this.config.toneColor, dot.saturation, dot.val);

      let [r,g,b] = this.stars[roundPos];
      let [ru,gu,bu] = this.stars[roundPosNext];

      dot.update();

      let high = dot.pos - roundPos;
      let low = 1 - high;

      [r, g, b] = [Math.min(255, r + low*r2), Math.min(255, g + low*g2), Math.min(255, b + low*b2)];
      [ru, gu, bu] = [Math.min(255, ru + high * r2), Math.min(255, gu + high * g2), Math.min(255, bu + high * b2)];

      this.stars[roundPos] = [r, g, b];
      this.stars[roundPosNext] = [ru, gu, bu];
    })

    draw(this.stars.map(([r,g,b]) => ColorUtils.dim(ColorUtils.rgbToHex(r, g, b), this.config.brillo)));
  }

  static presets(){
    return {
      "normal": {brillo: 1, speedWeight: 1, numberOfParticles: 50, toneColor: 0.7}
    }
  }

  static configSchema() {
    let config = super.configSchema();
    config.brillo = {type: Number, min: 0, max: 1, step: 0.01, default: 1}
    config.speedWeight = {type: Number, min: 0, max: 5, step: 0.1, default: 1}
    config.numberOfParticles = {type: Number, min: 1, max: 600, step: 1, default: 30}
    config.toneColor  = {type: Number, min: 0, max: 1, step: 0.01, default: 0.5}
    return config;
  }
}