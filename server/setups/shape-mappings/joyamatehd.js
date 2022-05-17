const _ = require("lodash");
module.exports = function getShapes() {
  const allOfIt = _.range(0, 5400);
  return {
    allOfIt,
  };
}
