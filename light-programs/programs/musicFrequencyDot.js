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

    this.maxCentroid = 140;
    this.minCentroid = 139;

    super.start(config, draw, done)
  }

  // Override parent method
  drawFrame(draw, done){
    if(this.lastFrame && this.lastFrame.filteredBands) {
      let {bassRms, bassPeakDecay, bassMax, midRms, midPeakDecay, midMax, highRms, highPeakDecay, highMax} = this.lastFrame.summary;
      //let total = bassMax+midMax+highMax;

      let power = this.config.power; // To create contrast
      let bass = Math.pow(bassPeakDecay, power)//*(bassMax/total);
      let r = Math.round(255 * bass * this.config.multiplier);

      let mid = Math.pow(midPeakDecay, power)//*(midMax/total);
      let g = Math.round(255 * mid  * this.config.multiplier);

      let high = Math.pow(highPeakDecay, power)//*(highMax/total);
      let b = Math.round(255 * high * this.config.multiplier);


      let width = Math.round((this.numberOfLeds / this.config.numberOfOnLeds));

      for (let i = 0; i < this.numberOfLeds; i += 1) {
        // let rms = this.lastFrame.movingStats.rms.slow.normalizedValue;
        let rms = this.lastFrame.summary.bassPeakDecay;
        let explosionLength = Math.ceil(Math.pow(rms , power) * width / 3)

        let offsettedPosition = i%this.lastVolume.length;
        if(this.config.move) {
          offsettedPosition  = (i+this.frameNumber)%this.lastVolume.length;
        }

        if (Math.abs(((i) % width - width/2)) < explosionLength) {
          this.lastVolume[offsettedPosition] = [r, g, b];
        } else {
          this.lastVolume[offsettedPosition] = [0, 0, 0];
        }
      }
    }

    draw(this.lastVolume);
    done();
  }

  static presets(){
    return {
      "symetry8Move": {move: true, numberOfOnLeds: 8},
      "symetry8Slow": {move: false, numberOfOnLeds: 8},
      "leds24": {move: false, numberOfOnLeds: 24}
    }
  }

  // Override and extend config Schema
  static configSchema(){
    let res = super.configSchema();
    res.multiplier = {type: Number, min: 0, max: 2, step: 0.01, default: 1};
    res.move = {type: Boolean, default: false};
    res.power = {type: Number, min: 1, max: 20, step: 1, default: 3};
    res.numberOfOnLeds = {type: Number, min: 1, max: 100, step: 1, default: 40};
    res.cutThreshold = {type: Number, min: 0, max: 1, step: 0.01, default: 0.45};
    return res;
  }
}
