const { Stripe } = require("../../src/geometry");

// Hash
//
//   7   1
// 5   X   3
//   X   X
// 0   X   6
//   2   4

const scale = x => 40 * x;

const p0 = [0, 1].map(scale);
const p1 = [3, 4].map(scale);
const p2 = [1, 0].map(scale);
const p3 = [4, 3].map(scale);
const p4 = [3, 0].map(scale);
const p5 = [0, 3].map(scale);
const p6 = [4, 1].map(scale);
const p7 = [1, 4].map(scale);

const HIGH_DENSITY = 1;

module.exports = [
  Stripe.old2d(...p0, ...p1, 150, HIGH_DENSITY),
  Stripe.old2d(...p2, ...p3, 150, HIGH_DENSITY),
  Stripe.old2d(...p4, ...p5, 150, HIGH_DENSITY),
  Stripe.old2d(...p6, ...p7, 150, HIGH_DENSITY),
];
