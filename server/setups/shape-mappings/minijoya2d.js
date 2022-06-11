const _ = require("lodash");
module.exports = function getShapes() {
  const allOfIt = _.range(0, 300);
  const left = _.range(150, 300);
  const right = _.range(0, 150);
  const topLeft = _.range(150, 233);
  const topRight = _.range(67, 150);
  const top = _.flatten([topRight, topLeft]);
  const tip = _.range(149, 152);
  const leftTip = _.range(232, 235);
  const rightTip = _.range(66, 69);
  const bottomLeftTip = _.range(265, 268);
  const bottomRightTip = _.range(35, 38);
  const tips = _.flatten([
    tip,
    leftTip,
    rightTip,
    bottomLeftTip,
    bottomRightTip,
  ]);
  const bottomLeft = _.range(233, 300);
  const bottomRight = _.range(0, 67);
  const bottom = _.flatten([bottomRight, bottomLeft]);
  const base = _.flatten([_.range(0, 36), _.range(266, 300)]);
  const bottomLeftNoBase = _.range(233, 266);
  const bottomRightNoBase = _.range(36, 67);
  const bottomNoBase = _.flatten([bottomRightNoBase, bottomLeftNoBase]);
  // Permutaciones
  const shuffleBase = [...allOfIt];
  const shuffleSegments5 = _.flatten(
    _.shuffle(
      _.map(_.range(0, shuffleBase.length / 5), i =>
        shuffleBase.slice(i * 5, (i + 1) * 5)
      )
    )
  );
  const shuffleSegments10 = _.flatten(
    _.shuffle(
      _.map(_.range(0, shuffleBase.length / 10), i =>
        shuffleBase.slice(i * 10, (i + 1) * 10)
      )
    )
  );
  const shuffleSegments20 = _.flatten(
    _.shuffle(
      _.map(_.range(0, shuffleBase.length / 20), i =>
        shuffleBase.slice(i * 20, (i + 1) * 20)
      )
    )
  );
  return {
    all: allOfIt,
    allOfIt,
    left,
    right,
    topLeft,
    topRight,
    top,
    tip,
    leftTip,
    rightTip,
    bottomLeftTip,
    bottomRightTip,
    tips,
    bottomLeft,
    bottomRight,
    bottom,
    base,
    bottomLeftNoBase,
    bottomRightNoBase,
    bottomNoBase,
    shuffleSegments5,
    shuffleSegments10,
    shuffleSegments20,
  };
};
