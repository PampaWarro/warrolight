const _ = require('lodash')

import {programsByShape} from "./Transformations";

const Spear = require("./spearFn").Func;

// las formas que se pueden usar están definidas en Transformation
const mapping = {
  "Warro": Spear
}

export const Func = programsByShape(mapping)
