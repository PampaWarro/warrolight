import {TimeTickedFunction} from "./TimeTickedFunction";
import {ColorUtils} from "../utils/ColorUtils";

export class Func extends TimeTickedFunction{
  drawFrame(draw, done) {
    const colors = new Array(this.numberOfLeds)
    const elapsed = (this.timeInMs) / 2 % 255;

    for (let i = 0; i < this.numberOfLeds; i++) {
      const height = this.geometry.y[i] * 255 / 100
      colors[i] = ColorUtils.rgbToHex((height + elapsed) % 255, 100, 100)
    }
    draw(colors)
  }
}
