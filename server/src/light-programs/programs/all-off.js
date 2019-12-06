const LightProgram = require("./../base-programs/LightProgram");

module.exports = class AllOff extends LightProgram {
  // Override base class
  drawFrame(draw) {
    let colors = new Array(this.numberOfLeds).fill([0, 0, 0]); // Array del tamaño de las luces
    draw(colors);
  }
};
