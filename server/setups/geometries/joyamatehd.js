const { Stripe } = require("../../src/geometry");
const joya = require("./joyahd");
const mate = require("./matehd");

const OFFSET = 40;

const stripes = [];
for (const stripe of joya.stripes) {
  const newStripe = stripe.clone();
  newStripe.x = newStripe.x.map(x => x - OFFSET);
  stripes.push(newStripe);
}
for (const stripe of mate.stripes) {
  const newStripe = stripe.clone();
  newStripe.x = newStripe.x.map(x => x + OFFSET);
  stripes.push(newStripe);
}

module.exports = {
  stripes,
  vertices: joya.vertices.concat(mate.vertices),
}
