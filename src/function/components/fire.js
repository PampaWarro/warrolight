import {ColorUtils} from "../../utils/ColorUtils";
import {TimeTickedFunction} from "../TimeTickedFunction";

export class Func extends TimeTickedFunction {
  constructor(config, leds) {
    super(config, leds);

    this.colors = new Array(this.numberOfLeds)
    this.bright = new Array(this.numberOfLeds)
    this.currentBright = new Array(this.numberOfLeds)

    for (let i = 0; i < this.numberOfLeds; i++) {
      this.colors[i] = 0.18 - (this.position.y[i] / 200)
      const height = this.position.y[i] / 20
      this.bright[i] = height * height + 0.1
      this.currentBright[i] = this.bright[i]
    }
    this.time = 0;
  }

  drawFrame(draw, done) {
    this.time += this.config.speed;
    const decay = this.config.decay
    const chance = this.config.chance
    const newColors = new Array(this.numberOfLeds)

    for (let i = 0; i < this.numberOfLeds; i++) {
      const color = this.colors[i]
      let bright = this.currentBright[i] * decay
      if (Math.random() > chance) {
        bright = 1
      }
      this.currentBright[i] = bright
      newColors[i] = ColorUtils.HSVtoHex(
        color,
        color > 0.13 ? 1 - color * 2 : 1,
        this.config.brillo * this.bright[i] * bright,
      )
    }
    draw(newColors);
    done()
  }

  static presets() {
    return {
      fastMarks: {speed: 3, sameColorLeds: 5},
    }
  }

  // Override and extend config Schema
  static configSchema() {
    let config = super.configSchema();
    config.speed = {type: Number, min: 5, max: 20, default: 4};
    config.decay = {type: Number, min: 0.98, max: 0.99999, step: 0.001, default: 0.985};
    config.chance = {type: Number, min: 0.90, max: 0.99, step: 0.001, default: 0.95};
    config.brillo = {type: Number, min: 0, max: 1, step: 0.01, default: 0.3};
    return config;
  }
}