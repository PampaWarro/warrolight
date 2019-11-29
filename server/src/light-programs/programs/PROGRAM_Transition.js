const _ = require("lodash");
const createMultiProgram = require("../base-programs/MultiPrograms");
const animateParamProgram = require("../base-programs/AnimatePrograms");
const programsByShape = require("../base-programs/Transformations");
const TimeTickedFunction = require("../base-programs/TimeTickedFunction");

const Rays = require("./rays");

const baseTime = 1 * 1000;

let singleBlueFire = {
  decay: 0.99,
  brillo: 0.15,
  globalSpeed: 1,
  colorSaturationRange: 0.4,
  numberOfParticles: 1,
  colorHueAmplitude: 0.1,
  colorHueOffset: 0.57,
  singleDirection: true
};

const schedule = [
  {
    duration: 5 * 60 * baseTime,
    program: programsByShape({
      trianguloBottom: [
        Rays,
        {
          brillo: 1,
          decay: 0.9,
          globalSpeed: 3,
          colorSaturationRange: 0.07,
          numberOfParticles: 1,
          colorHueAmplitude: 0,
          colorHueOffset: 0.07,
          singleDirection: true
        }
      ],
      totemL1: [Rays, singleBlueFire],
      totemL2: [Rays, singleBlueFire],
      totemR1: [Rays, singleBlueFire],
      totemR2: [Rays, singleBlueFire]
    })
  }
];

class Torch extends TimeTickedFunction {
  // Override base class
  drawFrame(draw, done) {
    // En HSV blanco es (0,0,1)
    let tonoDeBlanco = ColorUtils.HSVtoRGB(0, 0, this.config.brillo);

    let colors = [...Array(this.numberOfLeds)]; // Array del tamaño de las luces
    draw(colors.map(() => tonoDeBlanco));
  }

  // Override and extend config Schema
  static configSchema() {
    let res = super.configSchema();
    res.brillo = { type: Number, min: 0, max: 1, step: 0.01, default: 0.5 };
    return res;
  }
}

module.exports = createMultiProgram(schedule, false, 0);
