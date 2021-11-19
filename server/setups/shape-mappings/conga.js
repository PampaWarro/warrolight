const _ = require("lodash");

const headSideLeds = 20;
const n = (600 - headSideLeds * 3) / 12;

/**
 *
 *                         f *-------* f2
 *                            \     /
 *                             \ d /
 *                       c *-----*-----* c2
 *                        /    /  \     \
 *                       /    /    \     \
 *                     /    e*------* e2  \
 *                  b *                    * b2
 *                   /                      \
 *                  /                        \
 *               a *                          * a2
 *
 */


module.exports = function getShapes() {
  // There is D, D2, D3 and D4 because its a point passed 4 times when "drawing" the shapes
  const allOfIt = _.range(0, 600);
  const D = 3*n;
  const F2 = D+n;
  const F = F2+n;
  const D2 = F+n;
  const D3 = D2 + 3*headSideLeds;
  const E2 = D3+n;
  const E = E2+n;
  const D4 = E+n;
  const A2 = 600;

  const headLeft = _.range(D2, D2+headSideLeds);
  const headTop = _.range(D2+headSideLeds, D2+2*headSideLeds);
  const headRight = _.range(D2+2*headSideLeds, D2+3*headSideLeds);
  const head = [... headLeft, ... headTop, ... headRight];

  const fullLinePlayer1 = _.range(0, D);
  const fullLinePlayer2 = _.range(A2-D, A2);

  const topRightSide = _.range(D, F2);
  const highestSide = _.range(F2, F);
  const topLeftSide = _.range(F, D2);
  const topTriangle = _.flatten([
    topRightSide,
    highestSide,
    topLeftSide
  ]);

  const bottomRightSide = _.range(D3, E2);
  const lowestSide = _.range(E2, E);
  const bottomLeftSide = _.range(E, D4);
  const bottomTriangle = _.flatten([
    bottomRightSide,
    lowestSide,
    bottomLeftSide
  ]);

  const arrowPlayer1 = _.flatten([fullLinePlayer1, topLeftSide, bottomLeftSide]);
  const arrowPlayer2 = _.flatten([fullLinePlayer2, topRightSide, bottomRightSide]);

  const sandClock = _.flatten([topTriangle, bottomTriangle]);
  const man = _.flatten([topRightSide, topLeftSide, bottomRightSide, bottomLeftSide, head]);

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
    man,
    head,
    headLeft,
    headTop,
    headRight
  };
}
