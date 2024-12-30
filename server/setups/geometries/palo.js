const { Stripe } = require("../../src/geometry");


// Palo (17 palos)
//
// b1 b2 ... b17
//  |  |      |
//  |  |      |
//  |  |      |
// a1 a2 ... a17

const N = 16;
const LEDS_PER_STRIP = 300;
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
  const x1 = Math.sin(angle) * RADIUS;
  const z1 = -Math.cos(angle) * RADIUS;
  const a = [x1, 0, z1];
  const b = [x1, -HEIGHT, z1];
  const x2 = Math.sin(angle) * (RADIUS + HEIGHT / 100);
  const z2 = -Math.cos(angle) * (RADIUS + HEIGHT / 100);
  const c = [x2, 0, z2];
  const d = [x2, -HEIGHT, z2];
  stripes.push(Stripe.line(a.map(scale), b.map(scale), Math.ceil(LEDS_PER_STRIP / 2), PIXEL_RATIO));
  stripes.push(Stripe.line(d.map(scale), c.map(scale), Math.floor(LEDS_PER_STRIP / 2), PIXEL_RATIO));
  vertices.push(LEDS_PER_STRIP * i);
  vertices.push(LEDS_PER_STRIP * i + Math.ceil(LEDS_PER_STRIP / 2) - 1);
  vertices.push(LEDS_PER_STRIP * i + Math.ceil(LEDS_PER_STRIP / 2));
  vertices.push(LEDS_PER_STRIP * i + LEDS_PER_STRIP - 1);
  angle += ANGLE_INCREMENT;
}

module.exports = {
  stripes,
  vertices,
};
