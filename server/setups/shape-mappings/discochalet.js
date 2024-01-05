const _ = require("lodash");
module.exports = function getShapes() {
  const all = _.range(0, 1200);
  const cl = _.range(0, 300);
  const cr = _.range(300, 600);
  const c = _.flatten([cl, cr]);
  const lr = _.range(600, 750);
  const ll = _.range(750, 900);
  const l = _.flatten([lr, ll]);
  const rl = _.range(900, 1050);
  const rr = _.range(1050, 1200);
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
