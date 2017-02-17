// import {Func} from "./rainbow";
const _ = require('lodash')

import {programsByShape} from "./Transformations";

const MusicFlow = require("./musicFlow").Func;
const MusicFreq = require("./musicFreqs").Func;
const Stars = require("./stars").Func;

// las formas que se pueden usar están definidas en Transformation
const mapping = {
  // "Warro": MusicFreq,
  // "trianguloBottomBottom": MusicFlow,

  "shuffleSegments20": MusicFlow
  // "shuffle": MusicFlow,
}

export const Func = programsByShape(mapping)