const { Stripe } = require("../../src/geometry");

const LEDS_LONG = 150;

module.exports = [
  // Led 1
  new Stripe(0, 60, 50, 0, 80),
  new Stripe(50, 0, 90, 57, 75),

  // // Led 2
  new Stripe(0, 60, 50, 90, 42),
  new Stripe(50, 90, 100, 60, 40),
  new Stripe(90, 57, 100, 60, 10),
];
