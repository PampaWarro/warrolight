const SoundBasedFunction = require("./../base-programs/SoundBasedFunction");
const _ = require("lodash");

module.exports = class Func extends SoundBasedFunction {
  start(config, draw, done) {
    super.start(config, draw, done);

    try {
      if (global.gc) {
        global.gc();
      }
    } catch (e) {
      console.log("`node --expose-gc index.js`");
    }
  }

  drawFrame(draw, done) {
    const colors = new Array(this.numberOfLeds).map(() => [0, 0, 10])

    draw(colors);
    done();
  }
};
