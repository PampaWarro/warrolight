const LightProgram = require("./../base-programs/LightProgram");
const ColorUtils = require("./../utils/ColorUtils");

module.exports = class MusicVolumeBars extends LightProgram {
  constructor(config, leds) {
    super(config, leds);
    this.volPromedio = 0;
  }

  start(config, draw) {
    this.lastVolume = new Array(this.numberOfLeds + 1)
      .join("0")
      .split("")
      .map(() => [0, 0, 0]);
    this.time = 0;
    this.maxVolume = 0;

    super.start(config, draw);
  }

  // Override parent method
  drawFrame(draw, audio) {
    this.time += this.config.speed;

    // let vol = audio.averageRelativeVolume * this.config.multiplier * 1.5;
    // this.volPromedio = (vol+2*this.volPromedio)/3
    this.volPromedio = audio.peakDecay;

    for (let i = 0; i < this.numberOfLeds; i++) {
      let newColor = [0, 0, 0];
      if (
        i < this.numberOfLeds * this.volPromedio &&
        (Math.ceil(i / 3) * 3) % Math.round(this.numberOfLeds / 10)
      ) {
        let tone = 0.35;
        if (i / this.numberOfLeds > 0.5) {
          tone = 0.25;
        }
        if (i / this.numberOfLeds > 0.7) {
          tone = 0;
        }
        newColor = ColorUtils.HSVtoRGB(
          tone,
          1,
          Math.min(1, audio.peakDecay * audio.peakDecay)
        );
      }
      this.lastVolume[i] = newColor;
    }

    draw(this.lastVolume);
  }

  static presets() {
    return {};
  }

  // Override and extend config Schema
  static configSchema() {
    let res = super.configSchema();
    res.multiplier = { type: Number, min: 0, max: 2, step: 0.01, default: 1 };
    return res;
  }
};
