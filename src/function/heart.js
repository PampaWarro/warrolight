import {ColorUtils} from "../utils/ColorUtils";
import {TimeTickedFunction} from "./TimeTickedFunction";

export class Func extends TimeTickedFunction {
  constructor(config, leds) {
    super(config, leds);

    this.colors = new Array(this.numberOfLeds)
    this.bright = new Array(this.numberOfLeds)
    this.currentBright = new Array(this.numberOfLeds)

    for (let i = 0; i < this.numberOfLeds; i++) {
      const index = this.mappingOrder(i)
      if (index > 540) {
        this.bright[i] = 0
        this.colors[i] = 0
      } else {
        this.colors[i] = 0;
        this.bright[i] = 1;
      }
      this.currentBright[i] = this.bright[i]
    }
    this.time = 0;
  }

  mappingOrder(index) {
    if (index < 30) {
      return index + 570
    }
    if (index <= 150 && index >= 30) {
      return 150 - index
    }
    if (index >= 300 && index < 450) {
      return 450 - index + 300 - 30
    }
    if (index >= 450 && index < 480) {
      return 570
    }
    if (index >= 450) {
      return index - 60
    }
    return index - 30
  }

  drawFrame(draw, done) {
    this.time += this.config.speed;
    const decay = this.config.decay
    const chance = this.config.chance
    const newColors = new Array(this.numberOfLeds)
    let bright = this.currentBright[0] * decay
    if (this.time % 300 === 0) {
      bright = 1
    }
    if (this.time % 300 === 60) {
      bright = 1
    }

    for (let i = 0; i < this.numberOfLeds; i++) {
      const index = this.mappingOrder(i)
      const color = this.colors[i]
      this.currentBright[i] = bright
      newColors[i] = ColorUtils.HSVtoHex(
        color,
        1,
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
    config.decay = {type: Number, min: 0.8, max: 0.99999, step: 0.001, default: 0.95};
    config.chance = {type: Number, min: 0.90, max: 0.99, step: 0.001, default: 0.95};
    config.brillo = {type: Number, min: 0, max: 1, step: 0.01, default: 0.3};
    return config;
  }
}