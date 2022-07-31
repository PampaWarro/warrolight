const _ = require("lodash");
const { Stripe } = require("../../src/geometry");

// Single rib points.
//
// p2
//    \
//     \
//      \
//       \
//        \
//         \
//          \
//           \
//            \
//             \
//              p1
//             /
//            /
//           /
//          /
//         p0

function makeRib(p0, p1, p2) {
  return [
    Stripe.fromXZUpwardY(p0, p1, 80),
    Stripe.fromXZUpwardY(p1, p2, 178),
  ];
}

// El orden de los segmentos es clave. Replica cómo vamos a conectar las luces y
// el orden natural de los leds.

// Rib order (top view):
//
//    (back)
//    R1--R2
//   /      \
//  /        \
// R0        R3
//  \        /
//   \      /
//    R5--R4
//   (front)

const R0 = [
  [-1.2, 0, 0],
  [-2.19, 0, 0.88],
  [-0.14, 0, 3],
];
const R1 = [
  [-0.6, 1.04, 0],
  [-1.09, 1.9, 0.88],
  [-0.07, 0.13, 3],
];
const R2 = [
  [0.6, 1.04, 0],
  [1.09, 1.9, 0.88],
  [0.07, 0.13, 3],
];
const R3 = R0.map(([x, z, y]) => [-x, -z, y]);
const R4 = R1.map(([x, z, y ]) => [-x, -z, y]);
const R5 = R2.map(([x, z, y ]) => [-x, -z, y]);
const scale = vec => vec.map(x => 20 * x);
const allRibs = [R0, R1, R2, R3, R4, R5];
for (rib of allRibs) {
  for (let i = 0; i < rib.length; i++) {
    rib[i] = scale(rib[i]);
  }
}
const stripes = [];
allRibs.forEach(rib => stripes.push(...makeRib(...rib)));

// Horizontal.
stripes.push(
    Stripe.fromXZUpwardY(R0[1], R1[1], 145),
    Stripe.fromXZUpwardY(R1[1], R2[1], 145),
    Stripe.fromXZUpwardY(R2[1], R3[1], 145),
    Stripe.fromXZUpwardY(R3[1], R4[1], 145),
    Stripe.fromXZUpwardY(R4[1], R5[1], 145),
    Stripe.fromXZUpwardY(R5[1], R0[1], 145)
);

module.exports = {
  stripes,
  vertices: _.flatten(allRibs).map(([x, y, z]) => [x, -z, -y]),
}
