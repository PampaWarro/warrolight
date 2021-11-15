const _ = require("lodash");
module.exports = function getShapes() {
  const allOfIt = _.range(0, 720);
  const fullLinePlayer1 = _.range(0, 179);
  const fullLinePlayer2 = _.range(180, 358);

  const topRightSide = _.range(359, 419);
  const topLeftSide = _.range(420, 480);
  const highestSide = _.range(480, 539);
  const topTriangle = _.flatten([
    topRightSide,
    topLeftSide,
    highestSide
  ]);

  const bottomRightSide = _.range(540, 600);
  const bottomLeftSide = _.range(600, 660);
  const lowestSide = _.range(660, 720);
  const bottomTriangle = _.flatten([
    bottomRightSide,
    bottomLeftSide,
    lowestSide
  ]);

  const arrowPlayer1 = _.flatten([fullLinePlayer1, topLeftSide, bottomLeftSide]);
  const arrowPlayer2 = _.flatten([fullLinePlayer2, topRightSide, bottomRightSide]);

  const sandClock = _.flatten([topTriangle, bottomTriangle]);
  const man = _.flatten([topRightSide, topLeftSide, bottomRightSide, bottomLeftSide]);

  return {
    allOfIt,
    fullLinePlayer1,
    fullLinePlayer2,
    arrowPlayer1,
    arrowPlayer2,
    topRightSide, 
    topLeftSide,
    highestSide,
    topTriangle,
    bottomLeftSide,
    bottomRightSide,
    lowestSide,
    bottomTriangle,
    sandClock,
    man 
  };
}
