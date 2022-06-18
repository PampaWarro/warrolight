const _ = require("lodash");
const geometry = require("../geometries/matehd.js");

let ledCount = 0;
for (let i = 0; i < geometry.length; i++) {
  ledCount += geometry[i].leds;
}
const shapes = {};
shapes.all = shapes.allOfIt = _.range(0, ledCount);

const ringSizes = [300, 600, 600, 600, 600];
let offset = 0;
const oddRings = [];
const evenRings = [];
for (let i = 0; i < ringSizes.length; i++) {
  const ringSize = ringSizes[i];
  const ring = _.range(offset, offset + ringSize);
  shapes[`ring${i + 1}`] = ring;
  ((i % 2 === 0)? oddRings : evenRings).push(ring);
  offset += ringSize;
}
shapes.oddRings = _.flatten(oddRings);
shapes.evenRings = _.flatten(evenRings);

module.exports = function getShapes() {
  return shapes;
}
