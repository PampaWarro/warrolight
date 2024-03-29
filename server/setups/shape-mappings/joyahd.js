const _ = require("lodash");
const geometry = require("../geometries/joyahd.js");

const stripes = geometry.stripes;
let ledCount = 0;
for (let i = 0; i < stripes.length; i++) {
  ledCount += stripes[i].leds;
}
const shapes = {};

shapes.all = shapes.allOfIt = _.range(0, ledCount);

let offset = 0;
const ribSize = 258;
const ribHIntersection = 78;
const ribCount = 6;
const ribs = [];
const oddRibs = [];
const evenRibs = [];
const mirrorRibs = _.range(ribCount / 2).map(() => []);
for (let i = 0; i < ribCount; i++) {
  const rib = _.range(offset, offset + ribSize);
  shapes[`rib${i + 1}`] = rib;
  ribs.push(rib);
  (i % 2 === 0 ? oddRibs : evenRibs).push(rib);
  mirrorRibs[i % mirrorRibs.length].push(rib);
  offset += ribSize;
}
shapes.ribs = _.flatten(ribs);
shapes["odd-ribs"] = _.flatten(oddRibs);
shapes["even-ribs"] = _.flatten(evenRibs);
for (let i = 0; i < mirrorRibs.length; i++) {
  shapes[`mirror-ribs${i + 1}`] = _.flatten(mirrorRibs[i]);
}

const hSegmentLength = 142.5;
const hSegmentCount = 6;
const horizontal = [];
const oddHorizontal = [];
const evenHorizontal = [];
const mirrorHorizontal = _.range(ribCount / 2).map(() => []);
for (let i = 0; i < hSegmentCount; i++) {
  const thisSegmentLength =
    (i % 2) == 0 ? Math.floor(hSegmentLength) : Math.ceil(hSegmentLength);
  const hSegment = _.range(offset, offset + thisSegmentLength);
  shapes[`horizontal${i + 1}`] = hSegment;
  horizontal.push(hSegment);
  (i % 2 === 0 ? oddHorizontal : evenHorizontal).push(hSegment);
  mirrorHorizontal[i % mirrorHorizontal.length].push(hSegment);
  offset += thisSegmentLength;
}
shapes.horizontal = _.flatten(horizontal);
shapes["odd-horizontal"] = _.flatten(oddHorizontal);
shapes["even-horizontal"] = _.flatten(evenHorizontal);
for (let i = 0; i < mirrorHorizontal.length; i++) {
  shapes[`mirror-horizontal${i + 1}`] = _.flatten(mirrorHorizontal[i]);
}

const hShapes = [];
const oddHShapes = [];
const evenHShapes = [];
const mirrorHShapes = _.range(ribCount / 2).map(() => []);
for (let i = 0; i < ribCount; i++) {
  const rib0 = ribs[i];
  const rib1 = ribs[(i + 1) % ribCount];
  const h = horizontal[i];
  const hShape = _.flatten([rib0, rib1, h]);
  shapes[`hshape${i + 1}`] = hShape;
  (i % 2 === 0 ? oddHShapes : evenHShapes).push(hShape);
  mirrorHShapes[i % mirrorHShapes.length].push(hShape);
}
shapes["odd-hshapes"] = _.flatten(oddHShapes);
shapes["even-hshapes"] = _.flatten(evenHShapes);
for (let i = 0; i < mirrorHShapes.length; i++) {
  shapes[`mirror-hshapes${i + 1}`] = _.flatten(mirrorHShapes[i]);
}

const oddTriangles = [];
const evenTriangles = [];
const mirrorTriangles = _.range(ribCount / 2).map(() => []);
for (let i = 0; i < ribCount; i++) {
  const rib0 = ribs[i];
  const rib1 = ribs[(i + 1) % ribCount];
  const h = horizontal[i];
  const triangle = _.flatten([
    rib0.slice(ribHIntersection),
    rib1.slice(ribHIntersection),
    h
  ]);
  shapes[`triangle${i + 1}`] = triangle;
  (i % 2 === 0 ? oddTriangles : evenTriangles).push(triangle);
  mirrorTriangles[i % mirrorTriangles.length].push(triangle);
}
shapes["odd-triangles"] = _.flatten(oddTriangles);
shapes["even-triangles"] = _.flatten(evenTriangles);
for (let i = 0; i < mirrorTriangles.length; i++) {
  shapes[`mirror-triangles${i + 1}`] = _.flatten(mirrorTriangles[i]);
}

const ribTops = ribs.map(rib => rib.slice(ribHIntersection));
shapes["top"] = _.flatten(ribTops);
shapes["top-h"] = [..._.flatten(horizontal), ..._.flatten(ribTops)];
const ribBottoms = ribs.map(rib => rib.slice(0, ribHIntersection));
shapes["bottom"] = _.flatten(ribBottoms);
shapes["bottom-h"] = [..._.flatten(horizontal), ..._.flatten(ribBottoms)];

shapes.vertices = geometry.vertices;

module.exports = function getShapes() {
  return shapes;
};
