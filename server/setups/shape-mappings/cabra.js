const _ = require("lodash");

const stringCount = 4;
const pixelsPerString = 300;
const vCross1 = 85;
const vCross2 = 146;
const hCross1 = 29;
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
  const leftVHorn = _.range(0 * pixelsPerString + vCross2, 0 * pixelsPerString + pixelsPerString);
  const leftHHorn = _.range(2 * pixelsPerString + hCross2, 2 * pixelsPerString + pixelsPerString);
  const leftHorns = _.flatten([leftVHorn, leftHHorn.slice().reverse()]);
  const rightVHorn = _.range(1 * pixelsPerString + vCross2, 1 * pixelsPerString + pixelsPerString);
  const rightHHorn = _.range(3 * pixelsPerString + hCross2, 3 * pixelsPerString + pixelsPerString);
  const rightHorns = _.flatten([rightVHorn, rightHHorn.slice().reverse()]);
  const horns = _.flatten([leftHorns, rightHorns]);
  const v = _.flatten([strings[0], strings[1].slice().reverse()]);
  const h = _.flatten([strings[2], strings[3].slice().reverse()]);
  const hv = _.flatten([strings[2].slice(hCross1), strings[3].slice(hCross1).reverse()]);
  const u = _.flatten([
    leftVHorn.reverse(),
    _.range(2 * pixelsPerString + hCross1, 2 * pixelsPerString + hCross2).reverse(),
    _.range(3 * pixelsPerString + hCross1, 3 * pixelsPerString + hCross2),
    rightVHorn,
  ]);
  const bottomVShort = _.flatten([
    _.range(0 * pixelsPerString, 0 * pixelsPerString + vCross1),
    _.range(1 * pixelsPerString, 1 * pixelsPerString + vCross1),
  ]);
  const bottomVLong = _.flatten([
    _.range(0 * pixelsPerString, 0 * pixelsPerString + vCross2),
    _.range(1 * pixelsPerString, 1 * pixelsPerString + vCross2),
  ]);
  const notEyes = _.flatten([bottomVShort, horns]);
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
    notEyes,
  };
};
