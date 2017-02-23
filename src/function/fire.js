// import {Func} from "./rainbow";
const _ = require('lodash')

import {programsByShape} from "./Transformations";

const Fire = require("./components/fire").Func;

// las formas que se pueden usar están definidas en Transformation
const mapping = {
  "Warro": Fire,
}

export const Func = programsByShape(mapping)
