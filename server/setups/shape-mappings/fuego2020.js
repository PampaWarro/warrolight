const _ = require("lodash");

module.exports = function getShapes() {
  // no mapping, needed to import presets in PROGRAM_Main
  const all = _.range(0,1200)

  const inv = arr => [].concat(arr).reverse();

  const quiebre_abajo = 30;
  const quiebre_abajo_left = quiebre_abajo + 3;
  const quiebre_abajo_right = quiebre_abajo + 3;

  const centroOffsetLeft = 4;
  const centroOffsetRight = 3;

  const comienzoTira1 = 0 + 4;
  const comienzoTira2 = 150 + 5;
  const comienzoTira3 = 300 + 4;
  const comienzoTira4 = 450 - 0;

  const quiebre_arriba = 30;
  const quiebre_arriba_left = quiebre_arriba;
  const quiebre_arriba_right = quiebre_arriba;

  const pataLeft = _.range(quiebre_abajo_left, 150);
  const pataRight = _.range(450 + quiebre_abajo_right, 600);

  const basePataLeft = _.range(comienzoTira1, quiebre_abajo_left);
  const basePataRight = _.range(comienzoTira4, 450 + quiebre_abajo_right);

  const trianguloBottomLeft = _.range(comienzoTira2, 210 + centroOffsetLeft);
  const trianguloBottomRight = _.range(comienzoTira3, 360 + centroOffsetRight);
  const trianguloBottomBottom = inv(basePataLeft).concat(basePataRight);
  const trianguloBottom = _.flatten([
    basePataRight,
    trianguloBottomRight,
    inv(trianguloBottomLeft),
    inv(basePataLeft)
  ]);

  const trianguloTopLeft = _.range(
    360 + centroOffsetRight,
    450 - quiebre_arriba_right
  );
  const trianguloTopRight = _.range(
    210 + centroOffsetLeft,
    300 - quiebre_arriba_left
  );
  const trianguloTopTop = _.range(300 - quiebre_arriba_left, 300).concat(
    inv(_.range(450 - quiebre_arriba_right, 450))
  );
  const trianguloTop = _.flatten([
    trianguloTopLeft,
    inv(trianguloTopTop),
    inv(trianguloTopRight)
  ]);

  // Una permutación random de todas las luces. PSYCHO MIND FUCK
  const shuffle = _.shuffle(_.range(0, 1200));

  const mini_w = _.flatten([
    _.range(quiebre_abajo, 150),
    inv(_.range(450 + quiebre_abajo, 600)),
    _.range(300, 360),
    inv(_.range(150, 210))
  ]);

  // Totems
  const totemL1 = _.range(600, 750);
  const totemL2 = _.range(750, 900);
  const totemR1 = _.range(900, 1050);
  const totemR2 = _.range(1050, 1200);

  const totems = _.flatten([totemL1, totemL2, totemR1, totemR2]);

  const totemsExt = _.flatten([totemL1, totemR2]);
  const totemsInt = _.flatten([totemL2, totemR1]);

  // La W warra
  const Warro = _.flatten([
    inv(pataLeft),
    _.range(comienzoTira2, 300),
    inv(_.range(comienzoTira3, 450)),
    pataRight,
    totems
  ]);
  const WarroOnly = _.flatten([
    inv(pataLeft),
    _.range(comienzoTira2, 300),
    inv(_.range(comienzoTira3, 450)),
    pataRight
  ]);

  const allOfIt = _.range(comienzoTira1, 1200);

  // Las V V
  const V1L = pataLeft;
  let V1R = _.range(comienzoTira2, 300 - quiebre_arriba_left);
  const V2R = pataRight;
  let V2L = _.range(comienzoTira3, 450 - quiebre_arriba_right);

  const V1 = inv(V1L).concat(V1R);
  const V2 = inv(V2L).concat(V2R);

  // Reloj de arena
  const reloj = _.flatten([
    basePataLeft,
    _.range(150, 300),
    inv(_.range(300, 450)),
    inv(basePataRight)
  ]);

  // Una permutación random de pedazos de a 20 luces
  const shuffleBase = [...Warro];
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
  const trianguloBottomShuffle = _.shuffle(trianguloBottom);

  // Numeros y letras
  const X = inv(V1R).concat(V2L);

  const wings = _.flatten([totemL1, totemL2, V1L, V2R, totemR1, totemR2]);

  const wingsRight = _.flatten([V1R, V2R, totemR1, totemR2]);
  const wingsLeft = _.flatten([totemL1, totemL2, V1L, V2L]);
  const wingsX = _.flatten([totemL1, totemL2, X, totemR1, totemR2]);

  return {
    Warro,
    WarroOnly,
    allOfIt,
    all,
    mini_w,
    pataLeft,
    pataRight,
    reloj,
    shuffle,
    shuffleSegments10,
    shuffleSegments20,
    shuffleSegments5,
    totemL1,
    totemL2,
    totemR1,
    totemR2,
    totems,
    totemsExt,
    totemsInt,
    trianguloBottom,
    trianguloBottomBottom,
    trianguloBottomLeft,
    trianguloBottomRight,
    trianguloBottomShuffle,
    trianguloTop,
    trianguloTopLeft,
    trianguloTopRight,
    trianguloTopTop,
    V1,
    V1L,
    V1R,
    V2,
    V2L,
    V2R,
    X,
    wings,
    wingsLeft,
    wingsRight,
    wingsX,
  };
};
