const LightProgram = require("./../base-programs/LightProgram");
const ColorUtils = require("./../utils/ColorUtils");

module.exports = class Waveform2 extends LightProgram {
  init() {
    this.minX = Math.min(...this.geometry.x);
    this.maxX = Math.max(...this.geometry.x);
    this.minY = Math.min(...this.geometry.y);
    this.maxY = Math.max(...this.geometry.y);
    this.width = this.maxX - this.minX;
    this.height = this.maxY - this.minY;
  }
  drawFrame(leds, context) {
    const audio = context.audio;
    const frame = audio.currentFrame;
    if (!frame) {
      return;
    }

    const samples = frame.samples;
    const color = ColorUtils.HSVtoRGB(0, 0, frame.fastPeakDecay);

    for (let i = 0; i < this.numberOfLeds; i++) {
      const scaledX = (this.geometry.x[i] - this.minX) / this.width;
      const scaledY = 2 * (this.geometry.y[i] - this.minY) / this.height - 1 + this.config.offset;
      const scaledSample = this.config.scale * samples[Math.round(scaledX * (samples.length - 1))];
      const distance = Math.abs(scaledY - scaledSample);
      leds[i] = distance < this.config.width ? color : [0, 0, 0];
    }
  }

  // Override and extend config Schema
  static configSchema() {
    return Object.assign(super.configSchema(), {
      width: { type: Number, min: 0, max: 0.1, step: 0.001, default: 0.01 },
      scale: { type: Number, min: 0, max: 10, step: 0.01, default: 1 },
      offset: { type: Number, min: -1, max: 1, step: 0.01, default: 0 },
    });
  }
};
