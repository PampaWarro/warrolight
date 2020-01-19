const { Stripe } = require("../../src/geometry");

// Single rib points.
//
// p2
// |  \
// p3  \
//   \  \
//    \  \
//    p4  \
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

function makeRib(p0, p1, p2, p3, p4) {
  return [
    Stripe.fromXZUpwardY(p0, p1, 40),
    Stripe.fromXZUpwardY(p1, p2, 89),
    Stripe.fromXZUpwardY(p2, p3, 6),
    Stripe.fromXZUpwardY(p3, p4, 15)
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

R0 = [
  [-1.2, 0, 0],
  [-2.19, 0, 0.88],
  [-0.14, 0, 3],
  [-0.14, 0, 2.8],
  [-0.49, 0, 2.44]
];
R1 = [
  [-0.6, 1.04, 0],
  [-1.09, 1.9, 0.88],
  [-0.07, 0.13, 3],
  [-0.07, 0.13, 2.8],
  [-0.25, 0.43, 2.44]
];
R2 = [
  [0.6, 1.04, 0],
  [1.09, 1.9, 0.88],
  [0.07, 0.13, 3],
  [0.07, 0.13, 2.8],
  [0.25, 0.43, 2.44]
];
R3 = R0.map(([x, z, y]) => [-x, -z, y]);
R4 = R1.map(([x, z, y]) => [-x, -z, y]);
R5 = R2.map(([x, z, y]) => [-x, -z, y]);
const scale = 20;
const stripes = [];
[R0, R1, R2, R3, R4, R5]
  .map(rib => rib.map(vec => vec.map(x => scale * x)))
  .forEach(rib => stripes.push(...makeRib(...rib)));

module.exports = stripes;
