const { Stripe } = require("../../src/geometry");

// Mini joya 2d:
//
//        p3
//      /    \
//    /        \
// p4            p2
//   \          /
//    p5--p0--p1

const p0 = [0, 0];
const p1 = [.57, 0];
const p2 = [.97, -.34];
const p3 = [0, -1.36];
const p4 = [-.97, -.34];
const p5 = [-.57, 0];

const HIGH_DENSITY = 1;

module.exports = [
  Stripe.old2d(...p0, ...p1, 34, HIGH_DENSITY),
  Stripe.old2d(...p1, ...p2, 33, HIGH_DENSITY),
  Stripe.old2d(...p2, ...p3, 83, HIGH_DENSITY),
  Stripe.old2d(...p3, ...p4, 83, HIGH_DENSITY),
  Stripe.old2d(...p4, ...p5, 33, HIGH_DENSITY),
  Stripe.old2d(...p5, ...p0, 34, HIGH_DENSITY),
];
