import {ColorUtils} from "../utils/ColorUtils";
import {SoundBasedFunction} from "./SoundBasedFunction";

export class Func extends SoundBasedFunction {
  constructor(config, leds) {
    super(config, leds);

    this.volumes = []
    this.volumeSum = 0
  }

  // Override super method
  analyzeRawAudioData(array) {
    // get all the frequency amplitudes
    let sum = 0
    for (let i = 0; i < array.length; i++) {
      sum += array[i]
    }
    sum /= array.length
    this.volumes.push(sum)
    if (this.volumes.length > this.config.ease) {
      this.volumes.shift()
    }
    this.volumeSum = this.volumes.reduce((prev, next) => prev + next) / this.volumes.length
  }

  drawFrame(draw, done) {
    const newColors = new Array(this.numberOfLeds)

    for(let i = 0; i < this.numberOfLeds; i++) {
      newColors[i] = (20 - this.position.y[i]) > this.volumeSum
        ? ColorUtils.HSVtoHex(
          0,
          0,
          0
        )
        : ColorUtils.HSVtoHex(
          this.position.y[i] / 50,
          1,
          this.config.brillo
        )
    }
    draw(newColors)
  }

  // Override and extend config Schema
  static configSchema(){
    let res = super.configSchema();
    res.ease = {type: Number, min: 0, max: 30, step: 1, default: 10}
    return res;
  }
}