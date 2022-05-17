const { Stripe } = require("../../src/geometry");
const joya = require("./joyahd");
const mate = require("./matehd");

const OFFSET = 35;

const stripes = [];
for (const stripe of joya) {
  const newStripe = stripe.clone();
  newStripe.x = newStripe.x.map(x => x - OFFSET);
  stripes.push(newStripe);
}
for (const stripe of mate) {
  const newStripe = stripe.clone();
  newStripe.x = newStripe.x.map(x => x + OFFSET);
  stripes.push(newStripe);
}

module.exports = stripes;
