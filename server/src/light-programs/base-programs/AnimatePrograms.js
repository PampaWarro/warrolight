// import {Func} from "./rainbow";
const _ = require('lodash')

module.exports = function animateParamProgram(Program, parameter, frequency, change) {
  return class Func extends Program {
    drawFrame(draw, done) {
      this.count = (this.count || 0) + 1;
      if (this.count % frequency == 0) {
        this.config[parameter] = change.apply(this, [this.config[parameter]])
      }
      super.drawFrame(draw, done)
    }
  }
}