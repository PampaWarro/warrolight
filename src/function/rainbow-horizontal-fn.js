import {ColorUtils} from "../utils/ColorUtils";
import {TimeTickedFunction} from "./TimeTickedFunction";

export class Func extends TimeTickedFunction {
  constructor(config, leds) {
    super(config, leds);

    this.time = 0;
  }

  drawFrame(draw, done) {
    this.time += this.config.speed;
    const elapsed = this.time;
    const newColors = new Array(this.numberOfLeds)
    const sameColorLeds = this.config.sameColorLeds * 10

    for (let i = 0; i < this.numberOfLeds; i++) {
      newColors[i] = ColorUtils.HSVtoRGB(
        (this.position.x[i] - elapsed % sameColorLeds + sameColorLeds) / sameColorLeds,
        1,
        this.config.brillo
      )
    }
    draw(newColors);
  }

  static presets() {
    return {
      fastMarks: {speed: 3, sameColorLeds: 5},
    }
  }

  // Override and extend config Schema
  static configSchema() {
    let config = super.configSchema();
    config.speed = {type: Number, min: 1, max: 20, default: 1};
    config.sameColorLeds = {type: Number, min: 1, max: 100, default: 30};
    config.brillo = {type: Number, min: 0, max: 1, step: 0.01, default: 0.3};
    return config;
  }
}