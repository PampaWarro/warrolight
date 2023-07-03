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
  return {
    stripes : [
      Stripe.fromXZUpwardY(p0, p1, 78),
      Stripe.fromXZUpwardY(p1, p2, 180),
    ],
    vertices : [ 0, 78, 78 + 180 - 1 ],
  };
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
const SCALE = 20;
const scale = vec => vec.map(x => SCALE * x);
const allRibs = [R0, R1, R2, R3, R4, R5];
for (rib of allRibs) {
  for (let i = 0; i < rib.length; i++) {
    rib[i] = scale(rib[i]);
  }
}
const stripes = [];
const vertices = [];
let offset = 0;
for (const rib of allRibs) {
  const {stripes: ribStripes, vertices: ribVertices} = makeRib(...rib);
  stripes.push(...ribStripes);
  vertices.push(...ribVertices.map(x => x + offset));
  offset += ribVertices[ribVertices.length - 1] + 1;
}

// Horizontal.
const hSegmentLength = 142.5;
for (let i = 0; i < allRibs.length; i++) {
  const thisSegmentLength =
    (i % 2) == 0 ? Math.floor(hSegmentLength) : Math.ceil(hSegmentLength);
  stripes.push(
    Stripe.fromXZUpwardY(
      allRibs[i][1],
      allRibs[(i + 1) % allRibs.length][1],
      thisSegmentLength
    )
  );
  vertices.push(offset);
  vertices.push(offset + thisSegmentLength - 1);
  offset += thisSegmentLength;
}

// Totems
const TOTEM_DISTANCE = 5 * SCALE;
const TOTEM_ANGLE = 55;
const TOTEM_RADIANS = Math.PI * TOTEM_ANGLE / 180;
const TOTEM_H = 5 * SCALE * Math.cos(TOTEM_RADIANS);
const TOTEM_V = 5 * SCALE * Math.sin(TOTEM_RADIANS);
for (const rib of allRibs) {
  const norm = Math.sqrt(
    Math.pow(rib[0][0], 2) +
    Math.pow(rib[0][1], 2) +
    Math.pow(rib[0][2], 2)
  );
  const unit = rib[0].map(x => x / norm);
  const start = rib[0].map(x => x * TOTEM_DISTANCE / norm);
  const end = [
    start[0] + TOTEM_H * unit[0],
    start[1] + TOTEM_H * unit[1],
    start[2] + TOTEM_V,
  ]
  stripes.push(
    Stripe.fromXZUpwardY(
      start,
      end,
      300
    )
  );
  vertices.push(offset);
  vertices.push(offset + 300 - 1);
  offset += 300;
}

module.exports = {
  stripes,
  vertices,
}
