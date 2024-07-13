const { Stripe } = require("../../src/geometry");


// Circo (4 palos colgando)
//
// a1 a2 a3 a4
//  |  |  |  |
//  |  |  |  |
//  |  |  |  |
// b1 b2 b3 b4

const scale = x => 40 * x;

const a1 = [-.675, 0, 3].map(scale);
const a2 = [-.225, 0, 3].map(scale);
const a3 = [.225, 0, 3].map(scale);
const a4 = [.675, 0, 3].map(scale);
const b1 = [-2.287, .806, 1.267].map(scale);
const b2 = [-.806, 2.287, 1.357].map(scale);
const b3 = [.806, 2.287, 1.357].map(scale);
const b4 = [2.287, .806, 1.267].map(scale);

module.exports = {
  stripes: [
  Stripe.fromXZUpwardY(a1, b1, 150),
  Stripe.fromXZUpwardY(a2, b2, 150),
  Stripe.fromXZUpwardY(a3, b3, 150),
  Stripe.fromXZUpwardY(a4, b4, 150),
  ],
  vertices: [0, 149, 150, 299, 300, 449, 450, 599],
};
