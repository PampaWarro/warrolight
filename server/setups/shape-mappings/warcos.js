const _ = require("lodash");
const geometry = require("../geometries/warcos.js");

// Same shapes as wgrande, plus the two arches.
module.exports = function getShapes() {
  const inv = arr => [].concat(arr).reverse();

  const {
    LEDS_PER_STRIP,
    LEDS_LONG,
    LEDS_BAR,
    TOTEM_LEDS,
    HALF_TOTEM_LEDS,
    POST_LEDS
  } = geometry;
  const half = LEDS_LONG / 2;
  const halfBar = LEDS_BAR / 2;

  // Strip 1: left leg (top to foot), bottom bar (left to right), right leg
  // (foot to top).
  const tira1 = _.range(0, LEDS_PER_STRIP);
  const bottomBar = tira1.slice(LEDS_LONG, LEDS_LONG + LEDS_BAR);
  // Strip 2: diagonal (left foot to top right), top bar (right to left),
  // diagonal (top left to right foot).
  const tira2 = _.range(LEDS_PER_STRIP, 2 * LEDS_PER_STRIP);
  const diagonalUp = tira2.slice(0, LEDS_LONG);
  const topBar = tira2.slice(LEDS_LONG, LEDS_LONG + LEDS_BAR);
  const diagonalDown = tira2.slice(LEDS_LONG + LEDS_BAR);
  const wSize = 2 * LEDS_PER_STRIP;

  // Legs go from the foot to the top.
  const pataLeft = inv(tira1.slice(0, LEDS_LONG));
  const pataRight = tira1.slice(LEDS_LONG + LEDS_BAR);

  // Bases go from the center to the foot.
  const basePataLeft = inv(bottomBar.slice(0, halfBar));
  const basePataRight = bottomBar.slice(halfBar);

  // Bottom triangle sides go from the foot to the center.
  const trianguloBottomLeft = diagonalUp.slice(0, half);
  const trianguloBottomRight = inv(diagonalDown.slice(half));
  const trianguloBottomBottom = inv(basePataLeft).concat(basePataRight);
  const trianguloBottom = _.flatten([
    basePataRight,
    trianguloBottomRight,
    inv(trianguloBottomLeft),
    inv(basePataLeft)
  ]);

  // Top triangle sides go from the center to the top.
  const trianguloTopLeft = inv(diagonalDown.slice(0, half));
  const trianguloTopRight = diagonalUp.slice(half);
  // From the top right corner to the top left corner.
  const trianguloTopTop = topBar;
  const trianguloTop = _.flatten([
    trianguloTopLeft,
    inv(trianguloTopTop),
    inv(trianguloTopRight)
  ]);

  // La W warra
  const Warro = _.flatten([inv(pataLeft), tira2, pataRight]);

  // Las V V
  const V1L = pataLeft;
  const V1R = diagonalUp;
  const V2R = pataRight;
  const V2L = inv(diagonalDown);

  const V1 = inv(V1L).concat(V1R);
  const V2 = inv(V2L).concat(V2R);

  // Reloj de arena
  const reloj = _.flatten([basePataLeft, tira2, inv(basePataRight)]);

  const w = _.range(0, wSize);

  // Una permutación random de todas las luces de la W. PSYCHO MIND FUCK
  const shuffle = _.shuffle(w);
  const shuffleSegments = n => _.flatten(_.shuffle(_.chunk(w, n)));
  const shuffleSegments5 = shuffleSegments(5);
  const shuffleSegments10 = shuffleSegments(10);
  const shuffleSegments20 = shuffleSegments(20);
  const trianguloBottomShuffle = _.shuffle(trianguloBottom);

  // Arcos: una tira cada uno, del piso izquierdo al piso derecho. Las mitades
  // van siempre del piso hacia arriba, para que los programas sean simétricos.
  const arcos = {};
  for (let i = 0; i < 2; i++) {
    const arco = _.range(
      wSize + i * TOTEM_LEDS,
      wSize + (i + 1) * TOTEM_LEDS
    );
    const left = arco.slice(0, HALF_TOTEM_LEDS);
    const right = inv(arco.slice(HALF_TOTEM_LEDS));
    const n = i + 1;
    arcos[`arco${n}`] = arco;
    arcos[`arco${n}Left`] = left;
    arcos[`arco${n}Right`] = right;
    arcos[`arco${n}Postes`] = left
      .slice(0, POST_LEDS)
      .concat(right.slice(0, POST_LEDS));
    arcos[`arco${n}Curva`] = arco.slice(POST_LEDS, TOTEM_LEDS - POST_LEDS);
  }
  // Ambos arcos juntos, cada uno del piso izquierdo al piso derecho.
  arcos.arcos = arcos.arco1.concat(arcos.arco2);
  arcos.arcosLeft = arcos.arco1Left.concat(arcos.arco2Left);
  arcos.arcosRight = arcos.arco1Right.concat(arcos.arco2Right);

  const allOfIt = _.range(0, wSize + 2 * TOTEM_LEDS);

  return {
    pataLeft,
    pataRight,
    trianguloBottom,
    trianguloTop,
    trianguloBottomLeft,
    trianguloBottomRight,
    trianguloTopRight,
    trianguloTopLeft,
    trianguloBottomBottom,
    trianguloTopTop,
    Warro,
    reloj,
    V1,
    V2,
    V1L,
    V1R,
    V2L,
    V2R,
    w,
    shuffle,
    shuffleSegments10,
    shuffleSegments20,
    shuffleSegments5,
    trianguloBottomShuffle,
    ...arcos,
    vertices: geometry.vertices,
    all: allOfIt,
    allOfIt
  };
};
