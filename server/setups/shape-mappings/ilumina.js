const _ = require("lodash");
const geometry = require("../geometries/ilumina.js");

const shapes = {};

const stripes = geometry.stripes;
let ledCount = 0;
for (let i = 0; i < stripes.length; i++) {
  shapes[`spiral${i + 1}`] = _.range(ledCount, stripes[i].leds);
  ledCount += stripes[i].leds;
}

shapes.all = shapes.allOfIt = _.range(0, ledCount);

module.exports = function getShapes() {
  return shapes;
};
