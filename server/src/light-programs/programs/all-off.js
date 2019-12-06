const LightProgram = require("./../base-programs/LightProgram");

module.exports = class AllOff extends LightProgram {
  // Override base class
  drawFrame(draw) {
    let colors = [...Array(this.numberOfLeds)]; // Array del tamaño de las luces
    draw(colors.map(() => [0, 0, 0]));
  }
};
