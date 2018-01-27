// import {Func} from "./rainbow";
const _ = require('lodash')

module.exports = function getShapes(mapping) {
  const inv = arr => [].concat(arr).reverse()

  const offset = -7
  const pataLeft = _.range(113 + offset, 143 + offset)
  const pataRight = _.range(7 + offset, 37 + offset)

  const basePataLeft =  _.range(0 + offset, 7 + offset);
  const basePataRight =  _.range(143 + offset, 150 + offset);

  const trianguloBottomLeft = _.range(97 + offset, 112 + offset);
  const trianguloBottomRight = _.range(37 + offset, 52 + offset);
  const trianguloBottomBottom = inv(basePataLeft).concat(basePataRight);
  const trianguloBottom = _.flatten([basePataRight, trianguloBottomRight, inv(trianguloBottomLeft), inv(basePataLeft)])

  const trianguloTopLeft = _.range(52 + offset, 67 + offset);
  const trianguloTopRight = _.range(82 + offset, 97 + offset);
  const trianguloTopTop = _.range(68 + offset, 82 + offset);
  const trianguloTop = _.flatten([trianguloTopLeft, inv(trianguloTopTop), inv(trianguloTopRight)])

  // Una permutación random de todas las luces. PSYCHO MIND FUCK
  const shuffle = _.shuffle(_.range(0,150))

  // Una permutación random de pedazos de a 20 luces
  const shuffleSegments5 = _.flatten(_.shuffle(_.map(_.range(0,120), i => _.range(i*5, (i+1)*5))))
  const shuffleSegments10 = _.flatten(_.shuffle(_.map(_.range(0,60), i => _.range(i*10, (i+1)*10))))
  const shuffleSegments20 = _.flatten(_.shuffle(_.map(_.range(0,30), i => _.range(i*20, (i+1)*20))))
  const trianguloBottomShuffle = _.shuffle(trianguloBottom)

  // La W warra
  const Warro = _.range(8 + offset,143 + offset)

  // Las V V
  const V1L = pataLeft;
  let V1R = _.range(82 + offset,112 + offset);
  const V2R = pataRight;
  let V2L = _.range(38 + offset,67 + offset);

  const V1 = inv(V1L).concat(V1R)
  const V2 = inv(V2L).concat(V2R)

  const X = inv(V1R).concat(V2L)

  // Reloj de arena
  const reloj = _.range(38, 112)

  const allOfIt = _.range(7 + offset, 143 + offset)

  return {
    pataLeft, pataRight,
    trianguloBottom, trianguloTop, trianguloBottomLeft, trianguloBottomRight, trianguloTopRight, trianguloTopLeft,
    trianguloBottomBottom, trianguloTopTop,
    Warro, reloj, V1, V2, V1L, V1R, V2L, V2R, X,
    shuffle, shuffleSegments10, shuffleSegments20, shuffleSegments5, trianguloBottomShuffle,
    allOfIt
  };
}


