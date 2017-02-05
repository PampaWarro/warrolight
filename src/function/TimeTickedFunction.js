import {ColorUtils} from "../utils/ColorUtils";

export class TimeTickedFunction {
  constructor(config) {
    this.config = config;
  }

  // Override in subclasses
  drawFrame(draw, done){
    throw new Error("Child classes should override drawFrame");
  }

  start(config, draw, done) {
    this.config = config;
    const frame =() => {
      this.interval = setTimeout(frame, (1000 / config.frequencyInHertz));
      this.drawFrame(draw, done);
    }

    this.interval = setTimeout(frame, (1000 / config.frequencyInHertz));

    done()
  }

  stop() {
    clearInterval(this.interval)
  }

  static configSchema(){
    // Child classes should call super.configSchema and extend this object
    return {
      frequencyInHertz: {type: Number, min: 1, max: 300, default: 70}
    }
  }
}