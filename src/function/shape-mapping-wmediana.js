// import {Func} from "./rainbow";
const _ = require('lodash')

export function getShapes(mapping) {
  const inv = arr => [].concat(arr).reverse()
  const portion = 90

  const comienzoTira1 = 0 + 39
  const comienzoTira2 = 150 + 40
  const comienzoTira3 = 300 + 37
  const comienzoTira4 = 450 + 34

  const quiebre_abajo = 22;
  const quiebre_abajo_left = comienzoTira1 + quiebre_abajo + -1;
  const quiebre_abajo_right = comienzoTira4 + quiebre_abajo + 4;

  const centroOffsetLeft = 0;
  const centroOffsetRight = 0;


  const quiebre_arriba = 22;
  const quiebre_arriba_left = quiebre_arriba;
  const quiebre_arriba_right = quiebre_arriba

  const pataLeft = _.range(quiebre_abajo_left, 150)
  const pataRight = _.range(quiebre_abajo_right, 600)

  const basePataLeft =  _.range(comienzoTira1, quiebre_abajo_left);
  const basePataRight =  _.range(comienzoTira4, quiebre_abajo_right);

  const trianguloBottomLeft = _.range(comienzoTira2, comienzoTira2 + portion/2 + centroOffsetLeft);
  const trianguloBottomRight = _.range(comienzoTira3, comienzoTira3 + portion/2 + centroOffsetRight);
  const trianguloBottomBottom = inv(basePataLeft).concat(basePataRight);
  const trianguloBottom = _.flatten([basePataRight, trianguloBottomRight, inv(trianguloBottomLeft), inv(basePataLeft)])

  const trianguloTopLeft = _.range(comienzoTira3 + portion/2 + centroOffsetRight, 450-quiebre_arriba_right);
  const trianguloTopRight = _.range(comienzoTira2 + portion/2 + centroOffsetLeft, 300-quiebre_arriba_left);
  const trianguloTopTop = _.range(300-quiebre_arriba_left, 300).concat(inv(_.range(450-quiebre_arriba_right, 450)));
  const trianguloTop = _.flatten([trianguloTopLeft, inv(trianguloTopTop), inv(trianguloTopRight)])

  // Una permutación random de todas las luces. PSYCHO MIND FUCK
  const shuffle = _.shuffle(_.range(0,600))

  // Una permutación random de pedazos de a 20 luces
  const shuffleSegments5 = _.flatten(_.shuffle(_.map(_.range(0,120), i => _.range(i*5, (i+1)*5))))
  const shuffleSegments10 = _.flatten(_.shuffle(_.map(_.range(0,60), i => _.range(i*10, (i+1)*10))))
  const shuffleSegments20 = _.flatten(_.shuffle(_.map(_.range(0,30), i => _.range(i*20, (i+1)*20))))
  const trianguloBottomShuffle = _.shuffle(trianguloBottom)

  // La W warra
  const Warro = _.flatten([inv(pataLeft), _.range(comienzoTira2,300), inv(_.range(comienzoTira3, 450)), pataRight])

  // Las V V
  const V1L = pataLeft;
  let V1R = _.range(comienzoTira2,300-quiebre_arriba_left);
  const V2R = pataRight;
  let V2L = _.range(comienzoTira3,450-quiebre_arriba_right);

  const V1 = inv(V1L).concat(V1R)
  const V2 = inv(V2L).concat(V2R)

  // Reloj de arena
  const reloj = _.flatten([basePataLeft, _.range(comienzoTira2, 300), inv(_.range(comienzoTira3, 450)), inv(basePataRight)])

  const allOfIt = _.flatten([_.range(comienzoTira1, 150),_.range(comienzoTira2, 300),_.range(comienzoTira3, 450),_.range(comienzoTira4, 600)])

  // Numeros y letras
  const char_1 = _.range(150, 300)
  const char_2 = _.flatten([inv(trianguloBottomBottom), trianguloBottomLeft, trianguloTopRight, trianguloTopTop])
  const char_3 = _.flatten([trianguloBottomBottom, trianguloBottomRight, trianguloTopRight, trianguloTopTop])

  const char_a = _.flatten([trianguloBottom, trianguloTopRight, trianguloTopTop, inv(_.range(450-quiebre_arriba-10,450-quiebre_arriba))])
  const char_o = _.flatten([reloj.slice(0,90-20), reloj.slice(90+20,270-20), reloj.slice(270+20,360)]) // El reloj sin el centro
  const char_r = _.flatten([trianguloBottomLeft, trianguloTop, inv(trianguloBottomRight)])
  const char_w = Warro


  return {
    pataLeft, pataRight,
    trianguloBottom, trianguloTop, trianguloBottomLeft, trianguloBottomRight, trianguloTopRight, trianguloTopLeft,
    trianguloBottomBottom, trianguloTopTop,
    Warro, reloj, V1, V2, V1L, V1R, V2L, V2R,
    shuffle, shuffleSegments10, shuffleSegments20, shuffleSegments5, trianguloBottomShuffle,
    char_1, char_2, char_3, char_a, char_o, char_r, char_w,
    allOfIt
  };
}


