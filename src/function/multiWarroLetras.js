// import {Func} from "./rainbow";
const _ = require('lodash')
import {createMultiProgram} from "./MultiPrograms";
import {programsByShape} from "./Transformations";

const Rainbow = require("./rainbow").Func;
const MusicFlow = require("./musicFlow").Func;
const Stars = require("./stars").Func;

// las formas que se pueden usar están definidas en Transformation
const schedule = [
  // {duration: 3000, program: programsByShape({char_w: Rainbow})},
  {duration: 3000, program: programsByShape({char_a: [Stars, Stars.presets().muchasFast]})},
  {duration: 3000, program: programsByShape({char_r: Rainbow})},
  {duration: 3000, program: programsByShape({char_r: [Stars, Stars.presets().muchasFast]})},
  {duration: 3000, program: programsByShape({char_o: Rainbow})},
]

export const Func = createMultiProgram(schedule)