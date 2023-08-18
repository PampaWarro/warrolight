const joya = require("./joyahd");
const totems = require("./totems");

const stripes = [];
let joyaSize = 0;
for (const stripe of joya.stripes) {
  stripes.push(stripe);
  joyaSize += stripe.leds;
}
for (const stripe of totems.stripes) {
  stripes.push(stripe);
}
const vertices = [...joya.vertices, ...totems.vertices.map(i => joyaSize + i)];

module.exports = {
  stripes,
  vertices,
}
