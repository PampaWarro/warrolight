const LightProgram = require("./../base-programs/LightProgram");
const _ = require("lodash");

module.exports = class GarbageCollector extends LightProgram {
  start(config, draw) {
    super.start(config, draw);

    try {
      if (global.gc) {
        global.gc();
      }
    } catch (e) {
      console.log("`node --expose-gc index.js`");
    }
  }

  drawFrame(draw) {
    const colors = new Array(this.numberOfLeds).map(() => [0, 0, 10])

    draw(colors);
  }
};
