const _ = require('lodash')

import {programsByShape} from "./Transformations";

const Rainbow = require("./components/rainbow-horizontal").Func;

// las formas que se pueden usar están definidas en Transformation
const mapping = {
  "Warro": [Rainbow, { spearLength: 100}],
}

export const Func = programsByShape(mapping)
