const _ = require('lodash')

import {programsByShape} from "./Transformations";

const Spear = require("./components/color-spear").Func;

// las formas que se pueden usar están definidas en Transformation
const mapping = {
  "reloj": [Spear, { spearLength: 100}],
}

export const Func = programsByShape(mapping)
