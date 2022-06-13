const LightProgram = require("./../base-programs/LightProgram");

module.exports = class AllOff extends LightProgram {
  // Override base class
  drawFrame(leds, context) {
    leds.fill([0, 0, 0]);
  }
};
