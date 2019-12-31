const programsByShape = require("../base-programs/ProgramsByShape");
const createMultiProgram = require("../base-programs/MultiPrograms");

const AllWhite = require("./all-white");

let seg = 1000;

module.exports = createMultiProgram(
  [
    // {
    //   duration: 2 * seg,
    //   program: programsByShape({ trianguloBottom: AllWhite })
    // },
    // { duration: 2 * seg, program: programsByShape({ trianguloTop: AllWhite }) },
    // { duration: 2 * seg, program: programsByShape({ V1: AllWhite }) },
    // { duration: 2 * seg, program: programsByShape({ V2: AllWhite }) }
    { duration: 2 * seg, program: programsByShape({ topLeft: AllWhite }) },
    { duration: 2 * seg, program: programsByShape({ topRight: AllWhite }) },
    { duration: 2 * seg, program: programsByShape({ bottomLeft: AllWhite }) },
    { duration: 2 * seg, program: programsByShape({ bottomRight: AllWhite }) },
  ],
  false,
  0
);
