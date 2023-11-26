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

const tp1 = [-1, 0, 4].map(scale);
const tp2 = [-1, 4, 4].map(scale);
const tp3 = [-2, 0, 8].map(scale);
const tp4 = [-2, 4, 8].map(scale);
const tp5 = [5, 0, 4].map(scale);
const tp6 = [5, 4, 4].map(scale);
const tp7 = [6, 0, 8].map(scale);
const tp8 = [6, 4, 8].map(scale);

const HIGH_DENSITY = 1;

module.exports = [
  Stripe.old2d(...p1, ...p0, 300, HIGH_DENSITY),
  Stripe.old2d(...p3, ...p2, 300, HIGH_DENSITY),
  Stripe.old2d(...p5, ...p4, 300, HIGH_DENSITY),
  Stripe.old2d(...p7, ...p6, 300, HIGH_DENSITY),
  Stripe.line(tp1, tp2, 150, HIGH_DENSITY),
  Stripe.line(tp3, tp4, 150, HIGH_DENSITY),
  Stripe.line(tp5, tp6, 150, HIGH_DENSITY),
  Stripe.line(tp7, tp8, 150, HIGH_DENSITY),
];
