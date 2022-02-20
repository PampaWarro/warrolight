const _ = require("lodash");

module.exports = function getShapes() {
  // no mapping, needed to import presets in PROGRAM_Main
  const all = _.range(0,1800)

  const inv = arr => [].concat(arr).reverse();

  const TIRA_HD = 300;

  const SIDE_TRIANGULO = 120;

  const quiebre_abajo = 60;
  const quiebre_abajo_left = quiebre_abajo + 3;
  const quiebre_abajo_right = quiebre_abajo + 3;

  const centroOffsetLeft = 4;
  const centroOffsetRight = 3;

  const comienzoTira1 = 0 + 4;
  const T2 = TIRA_HD*1;
  const comienzoTira2 = T2 + 5;
  const T3 = TIRA_HD*2;
  const comienzoTira3 = T3 + 4;
  const T4 = TIRA_HD*3;
  const comienzoTira4 = T4 - 0;

  const quiebre_arriba = 60;
  const quiebre_arriba_left = quiebre_arriba;
  const quiebre_arriba_right = quiebre_arriba;

  const pataLeft = _.range(quiebre_abajo_left, TIRA_HD);
  let T4_end = TIRA_HD*4;
  const pataRight = _.range(T4 + quiebre_abajo_right, T4_end);

  const basePataLeft = _.range(comienzoTira1, quiebre_abajo_left);
  const basePataRight = _.range(comienzoTira4, T4 + quiebre_abajo_right);

  const trianguloBottomLeft = _.range(comienzoTira2, TIRA_HD+SIDE_TRIANGULO + centroOffsetLeft);
  const trianguloBottomRight = _.range(comienzoTira3, T3+SIDE_TRIANGULO + centroOffsetRight);
  const trianguloBottomBottom = inv(basePataLeft).concat(basePataRight);
  const trianguloBottom = _.flatten([
    basePataRight,
    trianguloBottomRight,
    inv(trianguloBottomLeft),
    inv(basePataLeft)
  ]);

  const trianguloTopLeft = _.range(
    T3+SIDE_TRIANGULO + centroOffsetRight,
    T4 - quiebre_arriba_right
  );
  const trianguloTopRight = _.range(
    TIRA_HD+ SIDE_TRIANGULO + centroOffsetLeft,
    T3 - quiebre_arriba_left
  );
  const trianguloTopTop = _.range(T3 - quiebre_arriba_left, T3).concat(
    inv(_.range(T4 - quiebre_arriba_right, T4))
  );
  const trianguloTop = _.flatten([
    trianguloTopLeft,
    inv(trianguloTopTop),
    inv(trianguloTopRight)
  ]);

  // Una permutación random de todas las luces. PSYCHO MIND FUCK
  const shuffle = _.shuffle(all);

  const mini_w = _.flatten([
    _.range(quiebre_abajo, T2),
    inv(_.range(T4 + quiebre_abajo, T4_end)),
    _.range(T3, T3+SIDE_TRIANGULO),
    inv(_.range(T2, T2+SIDE_TRIANGULO))
  ]);


  // Totems
  const totemL1 = _.range(T4_end, T4_end+150);
  const totemL2 = _.range(T4_end+150, T4_end+150*2);
  const totemR1 = _.range(T4_end+150*2, T4_end+150*3);
  const totemR2 = _.range(T4_end+150*3, T4_end+150*4);

  const totems = _.flatten([totemL1, totemL2, totemR1, totemR2]);

  const totemsExt = _.flatten([totemL1, totemR2]);
  const totemsInt = _.flatten([totemL2, totemR1]);

  // La W warra
  const Warro = _.flatten([
    inv(pataLeft),
    _.range(comienzoTira2, T3),
    inv(_.range(comienzoTira3, T4)),
    pataRight,
    totems
  ]);
  const WarroOnly = _.flatten([
    inv(pataLeft),
    _.range(comienzoTira2, T3),
    inv(_.range(comienzoTira3, T4)),
    pataRight
  ]);

  const allOfIt = _.range(comienzoTira1, 1800); // TODO: revisar

  // Las V V
  const V1L = pataLeft;
  let V1R = _.range(comienzoTira2, T3 - quiebre_arriba_left);
  const V2R = pataRight;
  let V2L = _.range(comienzoTira3, T4 - quiebre_arriba_right);

  const V1 = inv(V1L).concat(V1R);
  const V2 = inv(V2L).concat(V2R);

  // Reloj de arena
  const reloj = _.flatten([
    basePataLeft,
    _.range(T2, T3),
    inv(_.range(T3, T4)),
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

  const arc = _.flatten([
      inv(_.range(quiebre_abajo, T2)),
      _.range(T2, T2+SIDE_TRIANGULO),
      inv(_.range(T3, T3+SIDE_TRIANGULO)),
      _.range(T4 + quiebre_abajo, T4_end)
  ]);

  const right_mini_w = _.flatten([


  ]);
  return {
    Warro,
    WarroOnly,
    allOfIt,
    all,
    mini_w,
    arc,
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
