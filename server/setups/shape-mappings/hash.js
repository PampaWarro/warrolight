const _ = require("lodash");
module.exports = function getShapes() {
  const all = _.range(0, 600);
  const s1 = _.range(0, 150);
  const s2 = _.range(150, 300);
  const s3 = _.range(300, 450);
  const s4 = _.range(450, 600);
  const s1in = _.range(50, 100);
  const s2in = _.range(200, 250);
  const s3in = _.range(350, 400);
  const s4in = _.range(500, 550);
  const in_ = _.flatten([s1in, s2in, s3in, s4in]);
  const s1out = _.flatten([_.range(0, 50), _.range(100, 150)]);
  const s2out = _.flatten([_.range(150, 200), _.range(250, 300)]);
  const s3out = _.flatten([_.range(300, 350), _.range(400, 450)]);
  const s4out = _.flatten([_.range(450, 500), _.range(550, 600)]);
  const out = _.flatten([s1out, s2out, s3out, s4out]);
  return {
    all,
    allOfIt: all,
    s1, s2, s3, s4,
    s1in, s2in, s3in, s4in,
    "in": in_,
    s1out, s2out, s3out, s4out,
    out,
  };
};
