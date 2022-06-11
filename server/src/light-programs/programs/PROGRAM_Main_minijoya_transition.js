const _ = require("lodash");
const createMultiProgram = require("../base-programs/MultiPrograms");
const programsByShape = require("../base-programs/ProgramsByShape");

const Radial = require("./radial");

const baseTime = 0.1 * 1000;

const schedule = [
  {
    duration: 30 * baseTime,
    program: programsByShape({ all: [Radial, { velocidad: 0.4 }] })
  }
];

// las formas que se pueden usar están definidas en Transformation

module.exports = programsByShape({
  allOfIt: createMultiProgram(schedule, true)
});
