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
    this.time += this.config.speed;

    // let vol = this.averageRelativeVolume*this.config.multiplier;
    let vol = this.lastFrame.spectralBands.bass.energy/100*this.config.multiplier;

    // Como las luces tenues son MUY fuertes igual, a partir de cierto valor "las bajamos"
    if(vol < this.config.cutThreshold){
      vol = 0;
    } else {
      vol = (vol - this.config.cutThreshold) / (1-this.config.cutThreshold)
    }

    // let centroidHue = (this.lastFrame.spectralCentroid.bin - this.minCentroid) / (this.maxCentroid - this.minCentroid);
    // this.maxCentroid = Math.max(this.lastFrame.spectralCentroid.bin, this.maxCentroid)
    // this.minCentroid = Math.min(this.lastFrame.spectralCentroid.bin, this.minCentroid)
    if(this.lastFrame.filteredBands) {
      let bass = this.lastFrame.filteredBands.bass.movingStats.rms.normalizedValue;
      let r = Math.round(255 * bass * bass * 0.5);
      let mid = this.lastFrame.filteredBands.mid.movingStats.rms.normalizedValue;
      let g = Math.round(255 * mid * mid * 4);
      let high = this.lastFrame.filteredBands.high.movingStats.rms.normalizedValue;
      let b = Math.round(255 * high * high * 4);


      let width = Math.round((this.numberOfLeds / this.config.numberOfOnLeds));

      for (let i = 0; i < this.numberOfLeds; i += 1) {
        let rms = this.lastFrame.movingStats.rms.normalizedValue;
        let explosion = Math.ceil(this.config.multiplier * rms * rms * rms * width / 3)
        if (Math.abs((i % width - width/2)) < explosion) {
          this.lastVolume[i] = [r, g, b];
        } else {
          this.lastVolume[i] = [0, 0, 0];
        }

        // if (i % width === 0) {
        //   this.lastVolume[i] = [r, 0, 0];
        // } else if (i % width === Math.floor(width/3)) {
        //   this.lastVolume[i + Math.floor(width/3)] = [0, g, 0];
        // } else if (i % width === Math.floor(2*width/3)) {
        //   this.lastVolume[i + 2 * Math.floor(width/3)] = [0, 0, b];
        // } else {
        //   this.lastVolume[i] = [0, 0, 0];
        // }

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