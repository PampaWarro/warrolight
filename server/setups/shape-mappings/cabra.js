const _ = require("lodash");

const stringCount = 4;
const pixelsPerString = 300;
const vCross1 = 87;
const vCross2 = 147;
const hCross1 = 33;
const hCross2 = 86;

module.exports = function getShapes() {
  const allOfIt = _.range(0, stringCount * pixelsPerString);
  const strings = [];
  for (let i = 0; i < stringCount; i++) {
    strings.push(_.range(pixelsPerString * i, pixelsPerString * i + pixelsPerString));
  }
  const eyes = _.flatten([
    _.range(0 * pixelsPerString + vCross1, 0 * pixelsPerString + vCross2),
    _.range(2 * pixelsPerString, 2 * pixelsPerString + hCross2).reverse(),
    _.range(1 * pixelsPerString + vCross1, 1 * pixelsPerString + vCross2),
    _.range(3 * pixelsPerString, 3 * pixelsPerString + hCross2).reverse(),
  ])
  const leftEye = _.flatten([
    _.range(0 * pixelsPerString + vCross1, 0 * pixelsPerString + vCross2),
    _.range(2 * pixelsPerString + hCross1, 2 * pixelsPerString + hCross2).reverse(),
    _.range(3 * pixelsPerString, 3 * pixelsPerString + hCross1).reverse(),
  ])
  const rightEye = _.flatten([
    _.range(1 * pixelsPerString + vCross1, 1 * pixelsPerString + vCross2),
    _.range(3 * pixelsPerString + hCross1, 3 * pixelsPerString + hCross2).reverse(),
    _.range(2 * pixelsPerString, 2 * pixelsPerString + hCross1).reverse(),
  ])
  leftVHorn = _.range(0 * pixelsPerString + vCross2, 0 * pixelsPerString + pixelsPerString);
  leftHHorn = _.range(2 * pixelsPerString + hCross2, 2 * pixelsPerString + pixelsPerString);
  leftHorns = _.flatten([leftVHorn, leftHHorn.slice().reverse()]);
  rightVHorn = _.range(1 * pixelsPerString + vCross2, 1 * pixelsPerString + pixelsPerString);
  rightHHorn = _.range(3 * pixelsPerString + hCross2, 3 * pixelsPerString + pixelsPerString);
  rightHorns = _.flatten([rightVHorn, rightHHorn.slice().reverse()]);
  horns = _.flatten([leftHorns, rightHorns]);
  v = _.flatten([strings[0], strings[1].slice().reverse()]);
  h = _.flatten([strings[2], strings[3].slice().reverse()]);
  hv = _.flatten([strings[2].slice(hCross1), strings[3].slice(hCross1).reverse()]);
  u = _.flatten([
    leftVHorn.reverse(),
    _.range(2 * pixelsPerString + hCross1, 2 * pixelsPerString + hCross2).reverse(),
    _.range(3 * pixelsPerString + hCross1, 3 * pixelsPerString + hCross2),
    rightVHorn,
  ]);
  bottomVShort = _.flatten([
    _.range(0 * pixelsPerString, 0 * pixelsPerString + vCross1),
    _.range(1 * pixelsPerString, 1 * pixelsPerString + vCross1),
  ]);
  bottomVLong = _.flatten([
    _.range(0 * pixelsPerString, 0 * pixelsPerString + vCross2),
    _.range(1 * pixelsPerString, 1 * pixelsPerString + vCross2),
  ]);
  return {
    all: allOfIt,
    allOfIt,
    s0: strings[0],
    s1: strings[1],
    s2: strings[2],
    s3: strings[3],
    v,
    h,
    hv,
    u,
    bottomVShort,
    bottomVLong,
    eyes,
    leftEye,
    rightEye,
    horns,
    leftVHorn,
    leftHHorn,
    leftHorns,
    rightVHorn,
    rightHHorn,
    rightHorns,
  };
};
