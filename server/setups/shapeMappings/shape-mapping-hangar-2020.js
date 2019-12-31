const _ = require("lodash");

module.exports = function getShapes() {
  return {
    topLeft: _.range(0, 79),
    topRight: _.range(80, 150).concat(_.reverse(_.range(192 + 41, 192 + 50))),
    bottomLeft: _.range(150, 150 + 42),
    bottomRight: _.range(192, 192 + 41),
    allOfIt: _.range(0, 247)
  };
};
