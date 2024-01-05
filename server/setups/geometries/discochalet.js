const { Stripe } = require("../../src/geometry");

// Disco Chalet
//
//                 c1
//                /  \
//               /    \
//      l1      /      \      r1
//     /  \    /        \    /  \
//    /    \ c0          c2 /    \
//   /      \              /      \
// l0        l2          r0        r2

const scale = x => 20 * x;

const c0 = [0.853, 3.651, 1.219].map(scale);
const c1 = [3.353, 3.651, 5.549].map(scale);
const c2 = [5.853, 3.651, 1.219].map(scale);

const l0 = [0.093, 0.000, 0.161].map(scale);
const l1 = [1.346, 0.000, 2.324].map(scale);
const l2 = [2.599, 0.000, 0.161].map(scale);

const r0 = [4.106, 0.000, 0.161].map(scale);
const r1 = [5.359, 0.000, 2.324].map(scale);
const r2 = [6.612, 0.000, 0.161].map(scale);

module.exports = [
  Stripe.fromXZUpwardY(c1, c0, 300),
  Stripe.fromXZUpwardY(c1, c2, 300),
  Stripe.fromXZUpwardY(l2, l1, 150),
  Stripe.fromXZUpwardY(l1, l0, 150),
  Stripe.fromXZUpwardY(r0, r1, 150),
  Stripe.fromXZUpwardY(r1, r2, 150),
];
