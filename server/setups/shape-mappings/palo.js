const _ = require("lodash");
const geometry = require("../geometries/palo.js");

const stripes = geometry.stripes;
let ledCount = 0;
for (let i = 0; i < stripes.length; i++) {
  const stripe = stripes[i];
  ledCount += stripe.leds;
}

const shapes = {};
shapes.all = shapes.allOfIt = _.range(0, ledCount);

shapes.left = _.range(0, Math.floor(ledCount / 4));
shapes.center = _.range(Math.floor(ledCount / 4), Math.floor(3 * ledCount / 4));
shapes.right = _.range(Math.floor(3 * ledCount / 4), ledCount);
shapes.sides = [...shapes.left, ...shapes.right];

let offset = 0;
for (let i = 0; i < stripes.length / 2; i++) {
  const front = stripes[2 * i];
  const back = stripes[2 * i + 1];
  shapes[`palo-${i + 1}`] = _.range(offset, offset + front.leds + back.leds);
  shapes[`palo-${i + 1}-front`] = _.range(offset, offset + front.leds);
  shapes[`palo-${i + 1}-back`] = _.range(offset + front.leds, offset + front.leds + back.leds);
  offset += front.leds + back.leds;
}

module.exports = function getShapes() {
  return shapes;
};
