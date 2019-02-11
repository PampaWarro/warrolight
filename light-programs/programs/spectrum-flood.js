const SoundBasedFunction = require("./../base-programs/SoundBasedFunction");
const ColorUtils = require("./../utils/ColorUtils");
const _ = require('lodash');

module.exports = class Func extends SoundBasedFunction {
  constructor(config, leds) {
    super(config, leds);

    const self = this;
    const geometry = this.position || this.geometry;
    this.minX = null;
    this.maxX = null;
    geometry.x.forEach(x => {
      if (self.minX == null || x < self.minX) {
        self.minX = x;
      }
      if (self.maxX == null || x > self.maxX) {
        self.maxX = x;
      }
    });
    this.centerX = (this.minX + this.maxX) / 2;
    this.width = this.maxX - this.minX;
  }

  drawFrame(draw, done) {
    const colors = new Array(this.numberOfLeds)
    const geometry = this.position || this.geometry;

    const spectrum = this.currentAudioFrame.center.absolutefft;
    const spectrumNorm = this.currentAudioFrame.center.movingStats.fftPeak.slow.max;
    if (!spectrum) {
      done();
    }
    const vol = this.averageRelativeVolumeSmoothed;

    for (let i = 0; i < this.numberOfLeds; i++) {
      const distanceFromCenter =
        2 * Math.abs(geometry.x[i] - this.centerX) / this.width;
      let posY = 1 - (geometry.y[i] / geometry.height);
      // let volumeHeight = Math.max(0, (vol+0.1)*(vol+0.1));
      let oldHeight = Math.max(0, (vol+0.1)*(vol+0.1));
      const spectrumValue = spectrum[
        Math.floor(Math.sqrt(distanceFromCenter) * spectrum.length/2)] / spectrumNorm;
      let volumeHeight = 1*Math.sqrt(spectrumValue);
      let whiteBorderWidth = 0.95
      //console.log(vol, oldHeight);

      if (this.config.whiteBorder && (posY < volumeHeight) && (posY > (volumeHeight*whiteBorderWidth))) {
        colors[i] = [100,100,100]
      } else if (posY < volumeHeight) {
        let timeY = Math.sin(geometry.y[i] * this.config.escala + this.timeInMs * this.config.velocidad / 50);
        let timeX = Math.sin(geometry.x[i] * this.config.escala + this.timeInMs * this.config.velocidad / 20);
        colors[i] = ColorUtils.HSVtoRGB(this.config.color + 0.6 + (timeX * 0.05 + 0.025), 1, Math.max(0, timeY+0.7));
      } else {
        colors[i] = [0,0,0];
      }
    }

    draw(colors)
    done();
  }

  static presets() {
    return {
      "default": {velocidad: 0.4, whiteBorder: true},
      "gold": {velocidad: 0.1, whiteBorder: false, escala: 0.5, color: 0.42}
    }
  }

  // Override and extend config Schema
  static configSchema() {
    let res = super.configSchema();
    res.escala = {type: Number, min: 0.01, max: 5, step: 0.01, default: 1}
    res.color = {type: Number, min: 0, max: 1, step: 0.01, default: 0}
    res.velocidad = {type: Number, min: -3, max: 3, step: 0.01, default: 0.6}
    res.whiteBorder = {type: Boolean, default: false}
    return res;
  }
}
