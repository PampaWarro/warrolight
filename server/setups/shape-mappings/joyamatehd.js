const _ = require("lodash");
const pieces = (() => {
  const pieces = {};
  let offset = 0;
  Object.entries({
    joya: require("./joyahd.js")(),
    mate: require("./matehd.js")(),
  }).forEach(([name, shapes]) => {
    const piece = {
      shapes: shapes,
      size: shapes.all.length,
      offset: offset,
    }
    pieces[name] = piece;
    offset += piece.size;
  });
  return pieces;
})();
const shapes = {};
let size = 0;
Object.entries(pieces).forEach(([name, piece]) => {
  shapes[name] = piece.shapes.all.map(i => i + piece.offset);
  Object.entries(piece.shapes).forEach(([shapeName, shape]) => {
    if (shapeName === "all" || shapeName === "allOfIt") return;
    if (shapeName in shapes) {
      throw `duplicate shape name: '${shapeName}'`;
    }
    shapes[shapeName] = shape.map(i => i + piece.offset);
  });
  size += piece.size;
});
shapes.all = shapes.allOfIt = _.range(0, size);

module.exports = function getShapes() {
  return shapes;
}
