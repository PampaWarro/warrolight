const { Stripe } = require("../../src/geometry");


// Palo (17 palos)
//
// b1 b2 ... b17
//  |  |      |
//  |  |      |
//  |  |      |
// a1 a2 ... a17

const N = 17;
const LEDS_PER_STRIP = 150;
const PIXEL_RATIO = 2;
const HEIGHT = 2.5;
const RADIUS = 7;
const DISTANCE = .5;
const ANGLE_INCREMENT = DISTANCE / RADIUS;

const scale = x => 40 * x;

const stripes = [];
const vertices = [];
let angle = - ((N - 1) / 2) * ANGLE_INCREMENT;
for (let i = 0; i < N; i++) {
  const x = Math.sin(angle) * RADIUS;
  const z = -Math.cos(angle) * RADIUS;
  const a = [x, 0, z];
  const b = [x, -HEIGHT, z];
  stripes.push(Stripe.line(a.map(scale), b.map(scale), LEDS_PER_STRIP, PIXEL_RATIO));
  vertices.push(LEDS_PER_STRIP * i);
  vertices.push(LEDS_PER_STRIP * i + 149);
  angle += ANGLE_INCREMENT;
}

module.exports = {
  stripes,
  vertices,
};
