import {TimeTickedFunction} from "./TimeTickedFunction";

export class Func extends TimeTickedFunction{
  constructor(config, leds) {
    super(config, leds);
    this.on = true;
  }

  // Override base class
  drawFrame(draw, done) {
    let colors = [... Array(this.numberOfLeds)]; // Array del tamaño de las luces
    if (this.on) {
      draw(colors.map(() => "#306B95"));
    } else {
      draw(colors.map(() => "#000000"));
    }
    this.on = !this.on;
  }
}