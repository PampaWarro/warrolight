const _ = require("lodash");
const geometry = require("../geometries/matehd.js");

const stripes = geometry.stripes;
let ledCount = 0;
for (let i = 0; i < stripes.length; i++) {
  ledCount += stripes[i].leds;
}
const shapes = {};
shapes.all = shapes.allOfIt = _.range(0, ledCount);

const ringSizes = [600, 600, 600, 600, 300];
let offset = 0;
const rings = [];
const odd = [];
const even = [];
const oddExt = [];
const oddInt = [];
const evenExt = [];
const evenInt = [];
const allInt = [];
const allExt = [];
for (let i = 0; i < ringSizes.length; i++) {
  const ringSize = ringSizes[i];
  const ring = _.range(offset, offset + ringSize);
  shapes[`ring${i + 1}`] = ring;
  rings.push(ring);
  (i % 2 === 0 ? odd : even).push(ring);
  const ext = _.range(offset, offset + ringSize / 2);
  shapes[`ring${i + 1}-ext`] = ext;
  allExt.push(ext);
  (i % 2 === 0 ? oddExt : evenExt).push(ext);
  const int_ = _.range(offset + ringSize / 2, offset + ringSize);
  shapes[`ring${i + 1}-int`] = int_;
  (i % 2 === 0 ? oddInt : evenInt).push(int_);
  allInt.push(int_);
  offset += ringSize;
}
shapes.odd = _.flatten(odd);
shapes.even = _.flatten(even);
shapes["odd-int"] = _.flatten(oddInt);
shapes["odd-ext"] = _.flatten(oddExt);
shapes.ext = _.flatten(allExt);
shapes.int = _.flatten(allInt);
for (let i = 0; i < ringSizes.length; i++) {
  for (let j = i + 1; j < ringSizes.length; j++) {
    if (i === 0 && j === ringSizes.length - 1) continue;
    shapes[`ring${i + 1}-${j + 1}`] = _.flatten(
      _.range(i, j + 1).map((i) => rings[i])
    );
    shapes[`ring${i + 1}-${j + 1}-ext`] = _.flatten(
      _.range(i, j + 1).map((i) => allExt[i])
    );
    shapes[`ring${i + 1}-${j + 1}-int`] = _.flatten(
      _.range(i, j + 1).map((i) => allInt[i])
    );
  }
}

shapes.vertices = geometry.vertices;

module.exports = function getShapes() {
  return shapes;
};
