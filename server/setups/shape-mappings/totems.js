const _ = require("lodash");
const geometry = require("../geometries/totems.js");

const stripes = geometry.stripes;
let ledCount = 0;
const totemCount = 6;
const totemSize = 300;
for (let i = 0; i < stripes.length; i++) {
  ledCount += stripes[i].leds;
}
const shapes = {};

shapes.all = shapes.allOfIt = _.range(0, ledCount);

const totems = []
const oddTotems = [];
const evenTotems = [];
let offset = 0;
for (let i = 0; i < totemCount; i++) {
  const totem = _.range(offset, offset + totemSize);
  shapes[`totem${i + 1}`] = totem;
  totems.push(totem);
  (i % 2 === 0 ? oddTotems : evenTotems).push(totem);
  offset += totemSize;
}
shapes["odd-totems"] = _.flatten(oddTotems);
shapes["even-totems"] = _.flatten(evenTotems);
shapes.vertices = geometry.vertices;

module.exports = function getShapes() {
  return shapes;
};

