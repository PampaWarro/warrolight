const LightProgram = require("./../base-programs/LightProgram");
const ColorUtils = require("./../utils/ColorUtils");

module.exports = class WaterFlood extends LightProgram {

  init() {
    this.volumes = [];
    this.volumeSum = 0;
    this.waterLevel = 0.5;
  }

  drawFrame(draw, audio) {
    const colors = new Array(this.numberOfLeds);
    const geometry = this.geometry;

    let vol = audio.bassPeakDecay;

    for (let i = 0; i < this.numberOfLeds; i++) {
      let posY = 1 - geometry.y[i] / geometry.height;
      let volumeHeight = Math.max(0, vol * vol);
      let whiteBorderWidth = 0.95;

      if (
        this.config.whiteBorder &&
        posY < volumeHeight &&
        posY > volumeHeight * whiteBorderWidth
      ) {
        colors[i] = [100, 100, 100];
      } else if (posY < volumeHeight) {
        let timeY = Math.sin(
          geometry.y[i] * this.config.escala +
            (this.timeInMs * this.config.velocidad) / 50
        );
        let timeX = Math.sin(
          geometry.x[i] * this.config.escala +
            (this.timeInMs * this.config.velocidad) / 20
        );
        colors[i] = ColorUtils.HSVtoRGB(
          this.config.color + 0.6 + (timeX * 0.05 + 0.025),
          1,
          Math.max(0, timeY + 0.7)
        );
      } else {
        colors[i] = [0, 0, 0];
      }
    }

    draw(colors);
  }

  static presets() {
    return {
      default: { velocidad: 0.4, whiteBorder: true },
      gold: { velocidad: 0.1, whiteBorder: false, escala: 0.5, color: 0.42 }
    };
  }

  // Override and extend config Schema
  static configSchema() {
    let res = super.configSchema();
    res.escala = { type: Number, min: 0.01, max: 5, step: 0.01, default: 1 };
    res.color = { type: Number, min: 0, max: 1, step: 0.01, default: 0 };
    res.velocidad = { type: Number, min: -3, max: 3, step: 0.01, default: 0.6 };
    res.whiteBorder = { type: Boolean, default: false };
    return res;
  }
};
