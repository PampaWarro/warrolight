const _ = require("lodash");
module.exports = function getShapes() {
  const allOfIt = _.range(0, 300);
  const left = _.range(150, 300);
  const right = _.range(0, 150);
  const top = _.range(67, 233);
  const tip = _.range(149, 152);
  const bottomLeft = _.range(233, 300);
  const bottomRight = _.range(0, 67);
  const bottom = _.flatten([bottomRight, bottomLeft]);
  const base = _.flatten([_.range(0, 34), _.range(266, 300)]);
  return {
    allOfIt,
    left,
    right,
    top,
    tip,
    bottomLeft,
    bottomRight,
    bottom,
    base,
  };
};
