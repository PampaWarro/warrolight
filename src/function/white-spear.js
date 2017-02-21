import {ColorUtils} from "../utils/ColorUtils";
import {TimeTickedFunction} from "./TimeTickedFunction";

export class Func extends TimeTickedFunction {
  constructor(config, leds) {
    super(config, leds);

    this.colorSet = [
      '#ff0000', '#ff7700', '#ffff00', '#00ff00', '#0099ff', '#0000ff', '#5500CC', '#ffffff'
    ];

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
    const elapsed = this.time % (540 * 2);
    const elapsedCycle = this.time % (540);
    const newColors = new Array(this.numberOfLeds)

    for (let i = 0; i < this.numberOfLeds; i++) {
      const index = this.mappingOrder(i)
      if (index > 540) {
        newColors[i] = ColorUtils.HSVtoHex(0, 0, 0)
      } else {
        const brillo = index < elapsedCycle ? 1 : 0
        const spear = index > elapsedCycle - this.config.spearLength ? 1 : 0
        newColors[i] = ColorUtils.HSVtoHex(
          0,
          0,
          brillo * spear * this.config.brillo,
        )
      }
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
    config.brillo = {type: Number, min: 0, max: 1, step: 0.01, default: 0.3};
    config.spearLength = {type: Number, min: 30, max: 540, step: 1, default: 180};
    return config;
  }
}