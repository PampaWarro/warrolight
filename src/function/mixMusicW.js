// import {Func} from "./rainbow";
const _ = require('lodash')

import {programsByShape} from "./Transformations";

const MusicFlow = require("./musicFlow").Func;
const MusicFreq = require("./musicFreqs").Func;
const Stars = require("./stars").Func;

// las formas que se pueden usar están definidas en Transformation
const mapping = {
  // "Warro": MusicFreq,
  // "shuffleSegments20": MusicFlow,
  // "shuffle": MusicFlow,
  "reloj": [MusicFlow, {multiplier: 1.3, haciaAfuera: false, speed: 8}],
  "pataRight": MusicFreq,
  "pataLeft": MusicFreq
}

export const Func = programsByShape(mapping)