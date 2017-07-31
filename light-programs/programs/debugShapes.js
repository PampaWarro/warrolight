// import {Func} from "./rainbow";
const _ = require('lodash')
const TimeTickedFunction = require("./../base-programs/TimeTickedFunction");

const programsByShape = require("../base-programs/Transformations");
const createMultiProgram = require("../base-programs/MultiPrograms");

const AllWhite = require("./all-white");
const AllOff = require("./all-off");

let seg = 1000;

module.exports = createMultiProgram([
  {duration: 2*seg, program: programsByShape({trianguloBottom: AllWhite})},
  {duration: 2*seg, program: programsByShape({trianguloTop: AllWhite})},
  {duration: 2*seg, program: programsByShape({V1: AllWhite})},
  {duration: 2*seg, program: programsByShape({V2: AllWhite})},
], false)