const LightProgram = require("./../base-programs/LightProgram");

module.exports = class AllOff extends LightProgram {
  // Override base class
  drawFrame(leds, context) {
    for (let i = 0; i < leds.length; i++) {
      leds[i] = [0, 0, 0];
    }
  }
};
