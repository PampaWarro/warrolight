// import {Func} from "./rainbow";
const _ = require('lodash')

import {programsByShape} from "./Transformations";

const Rainbow = require("./rainbow").Func;
const MusicFlow = require("./musicFlow").Func;
const Stars = require("./stars").Func;

// las formas que se pueden usar están definidas en Transformation
const mapping = {
  "trianguloTop": Stars,
  "trianguloBottom": Rainbow,
  "pataRight": MusicFlow,
  "pataLeft": MusicFlow
}

export const Func = programsByShape(mapping)