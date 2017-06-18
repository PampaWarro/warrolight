import {ColorUtils} from "../utils/ColorUtils";

export class TimeTickedFunction {
  constructor(config, leds) {
    this.config = config;
    this.leds = leds;
    this.numberOfLeds = leds.numberOfLeds;
    this.geometry = leds.geometry;
    this.position = leds.position;
  }

  // Override in subclasses
  drawFrame(draw, done){
    throw new Error("Child classes should override drawFrame");
  }

  start(config, draw, done) {
    this.config = config;
    this.timeInMs = 0;
    this.startTime = new Date();

    const frame =() => {
      this.interval = setTimeout(frame, (1000 / 60));
      this.timeInMs = new Date() - this.startTime;
      this.drawFrame(colorsArray => draw(_.map(colorsArray, col => ColorUtils.dim(col, this.config.globalBrightness))), done);
    }

    this.interval = setTimeout(frame, (1000 / 60));

    done()
  }

  stop() {
    clearInterval(this.interval)
  }

  static configSchema(){
    // Child classes should call super.configSchema and extend this object
    return {
      globalBrightness: {type: Number, min: 0, max: 1, step: 0.01, default: 1},
      // frequencyInHertz: {type: Number, min: 1, max: 300, default: 60},
    }
  }
}