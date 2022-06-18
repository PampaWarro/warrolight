const _ = require("lodash");
const geometry = require("../geometries/joyahd.js");

let ledCount = 0;
for (let i = 0; i < geometry.length; i++) {
  ledCount += geometry[i].leds;
}
const shapes = {};

shapes.all = shapes.allOfIt = _.range(0, ledCount);

let globalOffset = 0;
const ribSize = 300;
const ribCount = 6;
const ribs = [];
const oddRibs = [];
const evenRibs = [];
for (let i = 0; i < ribCount; i++) {
  const offset = globalOffset + i * ribSize;
  const rib = _.range(offset, offset + ribSize);
  shapes[`rib${i + 1}`] = rib;
  ribs.push(rib);
  ((i % 2 === 0)? oddRibs : evenRibs).push(rib);
}
shapes.ribs = _.flatten(ribs);
shapes.oddRibs = _.flatten(oddRibs);
shapes.evenRibs = _.flatten(evenRibs);
globalOffset += shapes.ribs.length;

const hSegmentSize = 150;
const hSegmentCount = 6;
const horizontal = [];
const oddHorizontal = [];
const evenHorizontal = [];
for (let i = 0; i < hSegmentCount; i++) {
  const offset = globalOffset + i * hSegmentSize;
  const hSegment = _.range(offset, offset + hSegmentSize);
  shapes[`horizontal${i + 1}`] = hSegment;
  horizontal.push(hSegment);
  ((i % 2 === 0)? oddHorizontal : evenHorizontal).push(hSegment);
}
shapes.horizontal = _.flatten(horizontal);
shapes.oddHorizontal = _.flatten(oddHorizontal);
shapes.evenHorizontal = _.flatten(evenHorizontal);
globalOffset += shapes.horizontal.length;

module.exports = function getShapes() {
  return shapes;
};
