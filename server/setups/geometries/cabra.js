const { Stripe } = require("../../src/geometry");

// Cabeza de cabra
//
//
// A  B   C  D
//  \ |   | /
//   \|   |/
//    X   X
//    |\ /|
//    | X |
//    |/ \|
//    E   F
//     \ /
//      G

const scale = x => 20 * x;

const A = [-3.32, -4.73].map(scale);
const B = [-1.38, -4.81].map(scale);
const C = [1.38, -4.81].map(scale);
const D = [3.32, -4.73].map(scale);
const E = [-.4, -1.38].map(scale);
const F = [.4, -1.38].map(scale);
const G = [0, 0].map(scale);

const HIGH_DENSITY = 2;

module.exports = [
  Stripe.old2d(...G, ...B, 300, HIGH_DENSITY),
  Stripe.old2d(...G, ...C, 300, HIGH_DENSITY),
  Stripe.old2d(...F, ...A, 300, HIGH_DENSITY),
  Stripe.old2d(...E, ...D, 300, HIGH_DENSITY),
];
