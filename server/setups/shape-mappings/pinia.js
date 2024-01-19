const _ = require("lodash");

module.exports = function getShapes() {
  const all = _.range(0, 3900);
  return {
    allOfIt: all,
    all,
  };
};
