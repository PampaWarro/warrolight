import {ColorUtils} from "../utils/ColorUtils";
import {TimeTickedFunction} from "./TimeTickedFunction";

export class Func extends TimeTickedFunction {
    constructor(config) {
      super(config);

      this.colorSet = [
        '#ff0000', '#ff7700', '#ffff00', '#00ff00', '#0099ff', '#0000ff', '#5500CC', '#ffffff'
      ];

      this.time = 0;
    }

    drawFrame(config, draw, done){
      this.time += config.speed;
      const newColors = new Array(config.numberOfLeds)

      for (let i = 0; i < config.numberOfLeds; i++) {
        let colIndex = Math.floor(((this.time + i) / config.sameColorLeds)) % this.colorSet.length;

        let col = this.colorSet[colIndex];
        if (col == "#5500CC")
          newColors[i] = col;
        else
          newColors[i] = ColorUtils.dim(col, config.intensityDim);

      }
      draw(newColors);
      done()
    }
}

export const config = {
    speed: {type: Number, min: 1, max: 20, default: 1},
    sameColorLeds: {type: Number, min: 1, max: 100, default: 13},
    intensityDim: {type: Number, min: 0, max: 1, step: 0.01, default: 0.3},
    frequencyInHertz: {type: Number, min: 1, max: 300, default: 70}
}