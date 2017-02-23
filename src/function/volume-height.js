const _ = require('lodash')

import {programsByShape} from "./Transformations";

const VolumeHeight = require("./volumeHeightFn").Func;

const mapping = {
  "Warro": [VolumeHeight, { ease: 10}],
}

export const Func = programsByShape(mapping)
