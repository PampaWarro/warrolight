const _ = require("lodash");
const geometry = require("../geometries/palo.js");

const stripes = geometry.stripes;
let ledCount = 0;
for (let i = 0; i < stripes.length; i++) {
  ledCount += stripes[i].leds;
}
const shapes = {};

shapes.all = shapes.allOfIt = _.range(0, ledCount);
module.exports = function getShapes() {
  return shapes;
};
