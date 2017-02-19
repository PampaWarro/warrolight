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
    const elapsed = this.time;
    const newColors = new Array(this.numberOfLeds)

    for (let i = 0; i < this.numberOfLeds; i++) {
      if (this.config.degrade) {
        const index = this.mappingOrder(i)
        if (index > 540) {
          newColors[i] = ColorUtils.HSVtoHex(0, 0, 0)
        } else {
          newColors[i] = ColorUtils.HSVtoHex(
            (index - elapsed % 1000 + 1000) / 1000,
            1,
            this.config.brillo
          )
        }
      } else {
        let colIndex = Math.floor(((this.time + i) / this.config.sameColorLeds)) % this.colorSet.length;

        let col = this.colorSet[colIndex];
        if (col == "#5500CC")
          newColors[i] = col;
        else
          newColors[i] = ColorUtils.dim(col, this.config.brillo);
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
    config.speed = {type: Number, min: 1, max: 20, default: 1};
    config.sameColorLeds = {type: Number, min: 1, max: 100, default: 70};
    config.brillo = {type: Number, min: 0, max: 1, step: 0.01, default: 0.3};
    config.degrade = {type: Boolean, default: true}
    return config;
  }
}