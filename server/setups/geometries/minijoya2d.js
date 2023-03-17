const { Stripe } = require("../../src/geometry");

// Mini joya 2d:
//
//        p3
//      /    \
//    /        \
// p4            p2
//   \          /
//    p0------p1

const scale = x => 20 * x;

const p0 = [-.57, 0].map(scale);
const p1 = [.57, 0].map(scale);
const p2 = [.97, -.34].map(scale);
const p3 = [0, -1.36].map(scale);
const p4 = [-.97, -.34].map(scale);

const HIGH_DENSITY = 1;

module.exports = [
  Stripe.old2d(...p0, ...p1, 70, HIGH_DENSITY),
  Stripe.old2d(...p1, ...p2, 32, HIGH_DENSITY),
  Stripe.old2d(...p2, ...p3, 83, HIGH_DENSITY),
  Stripe.old2d(...p3, ...p4, 83, HIGH_DENSITY),
  Stripe.old2d(...p4, ...p0, 32, HIGH_DENSITY),
];
