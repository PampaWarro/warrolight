import {ColorUtils} from "../utils/ColorUtils";
import {SoundBasedFunction} from "./SoundBasedFunction";
import {TimeTickedFunction} from "./TimeTickedFunction";

export class Func extends SoundBasedFunction {
  constructor(config, leds) {
    super(config, leds);

    this.volumes = []
    this.volumeSum = 0

    this.waterLevel = 0.5;
  }

  drawFrame(draw, done) {
    const colors = new Array(this.numberOfLeds)
    const geometry = this.position || this.geometry;

    let vol = this.averageVolume * 0.9 + 0.1;
    vol = 0.3
    for (let i = 0; i < this.numberOfLeds; i++) {
      let posY = 1 - (geometry.y[i] / geometry.height);
      let volumeHeight = Math.max(0, this.averageVolume * 8 - 0.1);
      let whiteBorderWidth = 0.95

      if (this.config.whiteBorder && (posY < volumeHeight) && (posY > (volumeHeight*whiteBorderWidth))) {
        colors[i] = "#ffffff";
      } else if (posY < volumeHeight) {
        let timeY = Math.sin(geometry.y[i] * this.config.escala + this.timeInMs * this.config.velocidad / 50);
        let timeX = Math.sin(geometry.x[i] * this.config.escala + this.timeInMs * this.config.velocidad / 20);
        colors[i] = ColorUtils.HSVtoHex(this.config.color + 0.6 + (timeX * 0.05 + 0.025), 1, timeY * vol + vol);
      } else {
        colors[i] = "#000000";
      }
    }

    draw(colors)
    done();
  }

  // Override and extend config Schema
  static configSchema() {
    let res = super.configSchema();
    res.escala = {type: Number, min: 0.01, max: 5, step: 0.01, default: 0.3}
    res.color = {type: Number, min: 0, max: 1, step: 0.01, default: 0}
    res.velocidad = {type: Number, min: -3, max: 3, step: 0.01, default: 0.4}
    res.whiteBorder = {type: Boolean, default: false}
    return res;
  }
}