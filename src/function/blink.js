import {TimeTickedFunction} from "./TimeTickedFunction";

export class Func extends TimeTickedFunction{
  constructor(config, leds) {
    super(config, leds);
    this.on = true;
    this.time = new Date().getTime();
  }

  // Override base class
  drawFrame(draw, done) {
    const elapsed = new Date().getTime() - this.time
    let colors = [... Array(this.numberOfLeds)]; // Array del tamaño de las luces
    if (this.on) {
      draw(colors.map(() => "#306B95"));
    } else {
      draw(colors.map(() => "#000000"));
    }
    if ((this.on && elapsed > this.config.step) || (!this.on && elapsed > this.config.returnStep)) {
      this.on = !this.on;
      this.time = new Date().getTime()
    }
  }

  static presets() {
    return {
      twicePerSecond: {step: 200, returnStep: 300}
    }
  }

  // Override and extend config Schema
  static configSchema() {
    let config = super.configSchema();
    config.step = {type: Number, min: 1, max: 1001, step: 1, default: 200};
    config.returnStep = {type: Number, min: 1, max: 1000, step: 1, default: 400};
    return config;
  }
}