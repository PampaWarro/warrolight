const _ = require("lodash");
module.exports = function getShapes() {
  const all = _.range(0, 1800);
  const hash = _.range(0, 1200);
  const s1 = _.range(0, 300);
  const s2 = _.range(300, 600);
  const s3 = _.range(600, 900);
  const s4 = _.range(900, 1200);
  const s1in = _.range(100, 200);
  const s2in = _.range(400, 500);
  const s3in = _.range(700, 800);
  const s4in = _.range(1000, 1100);
  const in_ = _.flatten([s1in, s2in, s3in, s4in]);
  const s1out = _.flatten([_.range(0, 100), _.range(200, 300)]);
  const s2out = _.flatten([_.range(300, 400), _.range(500, 600)]);
  const s3out = _.flatten([_.range(600, 700), _.range(800, 900)]);
  const s4out = _.flatten([_.range(900, 1000), _.range(1100, 1200)]);
  const out = _.flatten([s1out, s2out, s3out, s4out]);
  const totems = _.range(1200, 1800);
  const t1 = _.range(1200, 1350);
  const t2 = _.range(1350, 1500);
  const t3 = _.range(1500, 1650);
  const t4 = _.range(1650, 1800);
  return {
    all,
    allOfIt: all,
    hash,
    s1, s2, s3, s4,
    s1in, s2in, s3in, s4in,
    "in": in_,
    s1out, s2out, s3out, s4out,
    out,
    totems, t1, t2, t3, t4,
  };
};
