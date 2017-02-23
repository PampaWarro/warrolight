const _ = require('lodash')

import {programsByShape} from "./Transformations";

const Rainbow = require("./rainbow-horizontal-fn").Func;

// las formas que se pueden usar están definidas en Transformation
const mapping = {
  "Warro": Rainbow,
}

export const Func = programsByShape(mapping)
