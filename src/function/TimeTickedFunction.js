import {ColorUtils} from "../utils/ColorUtils";

export class TimeTickedFunction {
  constructor(config) {
    this.config = config;
  }

  // Override in subclasses
  drawFrame(config, draw, done){
    throw new Error("Child classes should override drawFrame");
  }

  start(config, draw, done) {
    this.config = config;
    const frame =() => {
      this.interval = setTimeout(frame, (1000 / config.frequencyInHertz));
      this.drawFrame(config, draw, done);
    }

    this.interval = setTimeout(frame, (1000 / config.frequencyInHertz));

    done()
  }

  stop() {
    clearInterval(this.interval)
  }
}

export const config = {
  frequencyInHertz: Number
}