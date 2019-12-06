const createMultiProgram = require("../base-programs/MultiPrograms");
const programsByShape = require("../base-programs/ProgramsByShape");
const LightProgram = require("../base-programs/LightProgram");
const ColorUtils = require("../utils/ColorUtils");

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

module.exports = createMultiProgram(schedule, false, 0);
