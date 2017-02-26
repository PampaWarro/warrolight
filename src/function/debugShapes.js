// import {Func} from "./rainbow";
const _ = require('lodash')

import {programsByShape} from "./Transformations";
import {createMultiProgram} from "./MultiPrograms";

const AllWhite = require("./all-white").Func;

var seg = 1000;


export const Func = createMultiProgram([
  {duration: 2*seg, program: programsByShape({trianguloBottom: AllWhite})},
  {duration: 2*seg, program: programsByShape({trianguloTop: AllWhite})},
], true)