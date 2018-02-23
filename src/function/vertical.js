import {TimeTickedFunction} from "./TimeTickedFunction";
import {ColorUtils} from "../utils/ColorUtils";

export class Func extends TimeTickedFunction{
  drawFrame(draw, done) {
    const colors = new Array(this.numberOfLeds)
    const elapsed = (this.timeInMs) * this.config.speed / 20 % 255;

    for (let i = 0; i < this.numberOfLeds; i++) {
        if (i < 30) {
          colors[i] = [0,0,0]
        } else if (i >= 450 && i <= 480) {
            colors[i] = [0,0,0]
        } else {
          const height = this.geometry.y[i] * 255 / 100
          colors[i] = ColorUtils.HSVtoRGB(
            (height + elapsed) / 255,
            0.8,
            this.config.brillo
          )
        }
    }
    draw(colors)
  }

  // Override and extend config Schema
  static configSchema() {
    let config = super.configSchema();
    config.speed = {type: Number, min: 1, max: 20, default: 1};
    config.brillo = {type: Number, min: 0, max: 1, step: 0.01, default: 0.3};
    return config;
  }
}
