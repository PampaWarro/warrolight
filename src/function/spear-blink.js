// import {Func} from "./rainbow";
const _ = require('lodash')
import {createMultiProgram} from "./MultiPrograms";
import {programsByShape} from "./Transformations";

const Rainbow = require("./rainbow").Func;
const MusicFlow = require("./musicFlow").Func;
const Stars = require("./stars").Func;
const Spear = require("./white-spear").Func;
const AllWhite = require("./all-white").Func;
const Blink = require("./blink").Func;

// las formas que se pueden usar están definidas en Transformation
const schedule = [
  {duration: 4000, program: programsByShape({allOfIt: Spear }) },
  {duration: 1000, program: programsByShape({mini_w: [Blink, Blink.presets.twicePerSecond] }) }
]

export const Func = createMultiProgram(schedule)
