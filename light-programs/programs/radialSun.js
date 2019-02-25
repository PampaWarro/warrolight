const SoundBasedFunction = require("./../base-programs/SoundBasedFunction");

const ColorUtils = require("./../utils/ColorUtils");
const _ = require('lodash')

module.exports = class Radial extends SoundBasedFunction{
  drawFrame(draw, done) {
    const colors = new Array(this.numberOfLeds)
    const elapsed = (this.timeInMs) / 1000;

    const vol = this[this.config.soundMetric];
    this.extraTime = (this.extraTime || 0) + vol*5;

    for (let i = 0; i < this.numberOfLeds; i++) {
      let geometry = this.position || this.geometry;

      const dx = 0 * (geometry.x[i] - geometry.width/2 - this.config.centerX);
      const dy = geometry.y[i] - geometry.height  + this.config.centerY; // 18 is the offset

      const distance = Math.max(0, 1 - Math.sqrt(dx*dx + dy*dy) / (this.config.escala*vol));

      const v = distance;
      colors[i] = ColorUtils.HSVtoRGB((this.extraTime/1000) % 1, this.config.saturation, Math.pow(v, this.config.power))
    }
    draw(colors)
  }

  // Override and extend config Schema
  static configSchema(){
    let res = super.configSchema();
    res.escala =  {type: Number, min: 1, max: 100, step: 1, default: 100}
    res.centerY =  {type: Number, min: -20, max: 40, step: 0.1, default: 0}
    res.centerX =  {type: Number, min: -50, max: 50, step: 0.1, default: 0}
    res.power =  {type: Number, min: 0, max: 10, step: 0.1, default: 3}
    res.saturation =  {type: Number, min: 0, max: 1, step: 0.01, default: 1}
    res.soundMetric =  {type: String, values: ['fastPeakDecay', 'bassFastPeakDecay', 'midFastPeakDecay', 'highFastPeakDecay'], default: 'fastPeakDecay'}
    return res;
  }
}
