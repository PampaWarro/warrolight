import {TimeTickedFunction} from "./TimeTickedFunction";
import {ColorUtils} from "../utils/ColorUtils";

export class Func extends TimeTickedFunction{
  drawFrame(draw, done) {
    const colors = new Array(this.numberOfLeds)
    const elapsed = (this.timeInMs) / 6 % 255;

    for (let i = 0; i < this.numberOfLeds; i++) {
        if (i < 30) {
          colors[i] = '#000000'
        } else if (i >= 450 && i <= 480) {
            colors[i] = '#000000'
        } else {
          const height = this.geometry.y[i] * 255 / 100
          colors[i] = ColorUtils.HSVtoHex(
            (height + elapsed) / 255,
            0.8,
            0.3
          )
        }
    }
    draw(colors)
  }
}
