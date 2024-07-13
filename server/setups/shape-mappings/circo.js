const _ = require("lodash");
module.exports = function getShapes() {
  const all = _.range(0, 600);
  const cl = _.range(150, 300);
  const cr = _.range(300, 450);
  const c = _.flatten([cl, cr]);
  const lr = _.range(0, 75);
  const ll = _.range(75, 150);
  const l = _.flatten([lr, ll]);
  const rl = _.range(450, 525);
  const rr = _.range(525, 600);
  const r = _.flatten([rl, rr]);
  const lnr = _.flatten([l, r]);
  return {
    all,
    allOfIt: all,
    c, cl, cr,
    l, ll, lr,
    r, rl, rr,
    lnr,
  };
};
