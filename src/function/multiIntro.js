// import {Func} from "./rainbow";
const _ = require('lodash')
import {createMultiProgram} from "./MultiPrograms";
import {programsByShape} from "./Transformations";

const Rainbow = require("./rainbow").Func;
const MusicFlow = require("./musicFlow").Func;
const Stars = require("./stars").Func;

// las formas que se pueden usar están definidas en Transformation
const schedule = [
  {duration: 2000, program: programsByShape({reloj: [Rainbow, Rainbow.presets().fastMarks]})},
  {duration: 2000, program: programsByShape({char_3: [Stars, Stars.presets().muchasSlow]})},
  {duration: 5000, program: programsByShape({char_2: Rainbow})},
  {duration: 5000, program: programsByShape({char_1: Rainbow})},
  {duration: 2000, program: programsByShape({Warro: [Stars, Stars.presets().muchasFast]})},
  {duration: 2000, program: programsByShape({V1: Rainbow})},
  {duration: 2000, program: programsByShape({V2: Rainbow})},
  {duration: 20000, program: programsByShape({
    V1: [MusicFlow, MusicFlow.presets().fastDobleDesdeCentro],
    V2: [MusicFlow, MusicFlow.presets().fastDobleDesdePuntas],
  })},
]

export const Func = createMultiProgram(schedule)