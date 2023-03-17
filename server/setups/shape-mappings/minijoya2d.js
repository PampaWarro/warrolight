const _ = require("lodash");
module.exports = function getShapes() {
  // TODO fix this.
  const allOfIt = _.range(0, 300);
  const left = _.flatten([
    _.range(0, 36),
    _.range(185, 300),
  ]);
  const right = _.range(35, 186);
  const topLeft = _.range(185, 269);
  const topRight = _.range(102, 186);
  const top = _.flatten([topRight, topLeft]);
  const tip = _.range(184, 187);
  const leftTip = _.range(267, 270);
  const rightTip = _.range(101, 104);
  const bottomLeftTip = [299, 0, 1];
  const bottomRightTip = _.range(69, 72);
  const tips = _.flatten([
    tip,
    leftTip,
    rightTip,
    bottomLeftTip,
    bottomRightTip,
  ]);
  const bottomLeft = _.flatten([
    _.range(268, 300),
    _.range(0, 36),
  ]);
  const bottomRight = _.range(35, 103);
  const bottom = _.flatten([bottomRight, bottomLeft]);
  const base = _.range(0, 71);
  const bottomLeftNoBase = _.flatten([_.range(268, 300), [0]]);
  const bottomRightNoBase = _.range(70, 103);
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
