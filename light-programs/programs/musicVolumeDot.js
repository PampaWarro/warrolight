const SoundBasedFunction = require("./../base-programs/SoundBasedFunction");
const ColorUtils = require("./../utils/ColorUtils");

module.exports = class MusicVolumeDot extends SoundBasedFunction{
  constructor(config, leds) {
    super(config, leds);
  }

  start(config, draw, done){
    this.lastVolume = new Array(this.numberOfLeds+1).join('0').split('').map(() => [0,0,0]);
    this.time = 0;
    this.maxVolume = 0;

    super.start(config, draw, done)
  }

  // Override parent method
  drawFrame(draw, done){
    this.time += this.config.speed;

    // let vol = this.averageRelativeVolume*this.config.multiplier;
    let vol = this.currentAudioFrame.center.summary.bassPeakDecay*this.config.multiplier;

    // Como las luces tenues son MUY fuertes igual, a partir de cierto valor "las bajamos"
    if(vol < this.config.cutThreshold){
      vol = 0;
    } else {
      vol = (vol - this.config.cutThreshold) / (1-this.config.cutThreshold)
    }

    let newVal = ColorUtils.HSVtoRGB(0, 0, Math.min(vol*vol, 1));

    for(let i=0;i<this.numberOfLeds;i++) {
      if(i % Math.round((this.numberOfLeds / this.config.numberOfOnLeds)) === 0){
        this.lastVolume[i] = newVal;
      } else {
        this.lastVolume[i] = [0,0,0];
      }
    }

    draw(this.lastVolume);
    done();
  }

  static presets(){
    return {
    }
  }

  // Override and extend config Schema
  static configSchema(){
    let res = super.configSchema();
    res.multiplier = {type: Number, min: 0, max: 2, step: 0.01, default: 1};
    res.numberOfOnLeds = {type: Number, min: 1, max: 100, step: 1, default: 40};
    res.cutThreshold = {type: Number, min: 0, max: 1, step: 0.01, default: 0.45};
    return res;
  }
}
