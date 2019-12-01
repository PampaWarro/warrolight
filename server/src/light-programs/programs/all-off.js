const TimeTickedFunction = require("./../base-programs/TimeTickedFunction");

module.exports = class AllOff extends TimeTickedFunction {
  // Override base class
  drawFrame(draw, done) {
    let colors = [...Array(this.numberOfLeds)]; // Array del tamaño de las luces
    draw(colors.map(() => [0, 0, 0]));
  }
};
