const { Stripe } = require("../../src/geometry");
const joya = require("./joyahd");
const mate = require("./matehd");

const OFFSET = 40;

const stripes = [];
let joyaSize = 0;
for (const stripe of joya.stripes) {
  const newStripe = stripe.clone();
  newStripe.x = newStripe.x.map(x => x - OFFSET);
  stripes.push(newStripe);
  joyaSize += stripe.leds;
}
for (const stripe of mate.stripes) {
  const newStripe = stripe.clone();
  newStripe.x = newStripe.x.map(x => x + OFFSET);
  stripes.push(newStripe);
}
const vertices = [...joya.vertices, ...mate.vertices.map(i => joyaSize + i)];

module.exports = {
  stripes,
  vertices,
}
