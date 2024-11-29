const _ = require("lodash");
const { Stripe } = require("../../src/geometry");

const stripes = [];
const vertices = [];
let offset = 0;
const SCALE = 20;
const TOTEM_VECTORS = [
  [0.6, -1.04, 0],
  [-0.6, -1.04, 0],
];

const TOTEM_DISTANCE = 5 * SCALE;
const TOTEM_ANGLE = 60;
const TOTEM_RADIANS = Math.PI * TOTEM_ANGLE / 180;
const TOTEM_H = 5 * SCALE * Math.cos(TOTEM_RADIANS);
const TOTEM_V = 5 * SCALE * Math.sin(TOTEM_RADIANS);
for (const v of TOTEM_VECTORS) {
  const norm = Math.sqrt(
    Math.pow(v[0], 2) +
    Math.pow(v[1], 2) +
    Math.pow(v[2], 2)
  );
  const unit = v.map(x => x / norm);
  const start = v.map(x => x * TOTEM_DISTANCE / norm);
  const end = [
    start[0] + TOTEM_H * unit[0],
    start[1] + TOTEM_H * unit[1],
    start[2] + TOTEM_V,
  ]
  stripes.push(
    Stripe.fromXZUpwardY(
      end,
      start,
      300
    )
  );
  vertices.push(offset);
  vertices.push(offset + 300 - 1);
  offset += 300;
}

const WARRO_VECTORS = [
  [[1,-4,0], [-1,-6.46,0], [0,-6.46,0], 240, 60],
  [[-1,-4,0], [1,-6.46,0], [0,-6.46,0], 240, 60],
  [[-1,-4,0], [-2.5,-6.46,0], [-2.5,-6.46,0], 240, 60],
  [[1,-4,0], [2.5,-6.46,0], [2.5,-6.46,0], 240, 60],
  // [[-2, -4, 0], [-4, -7, 0]],
  // [[2, -4, 0], [4, -7, 0]],
].map(arr => [
  arr[0].map(x => x * SCALE),
  arr[1].map(x => x * SCALE),
  arr[2].map(x => x * SCALE),
  arr[3],
  arr[4]
]);

for (const v of WARRO_VECTORS) {
  const stripe = Stripe.elbow(v[0], v[1], v[2], 240, 60);
  stripes.push(stripe);
  vertices.push(offset);
  vertices.push(offset + 300 - 1);
  offset += 300;
}

module.exports = {
  stripes,
  vertices,
}
