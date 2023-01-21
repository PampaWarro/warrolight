const _ = require("lodash");
const { Stripe } = require("../../src/geometry");

const HEIGHT = 80;
const R = .15 * HEIGHT;
const Y_SCALE = 11 / HEIGHT;
const LEDS_PER_SPIRAL = 300;

function spiral(y0, y1, theta0, theta1, ledCount) {
  const points = [];
  for (let i = 0; i < ledCount; i++) {
    const y = y0 + (i * (y1 - y0)) / ledCount;
    const theta = theta0 + (i * (theta1 - theta0)) / ledCount;
    const r = R + Math.pow(Y_SCALE * y, 2);
    points.push([r * Math.sin(theta), y, r * Math.cos(theta)]);
  }
  return points;
}

const stripes = [];
for (let i = 0; i < 6; i++) {
  const startTheta = i * ((2 * Math.PI) / 6);
  stripes.push(
    new Stripe(
      spiral(
        -HEIGHT / 2,
        HEIGHT / 2,
        startTheta,
        startTheta + 2 * Math.PI,
        LEDS_PER_SPIRAL
      )
    )
  );
  stripes.push(
    new Stripe(
      spiral(
        HEIGHT / 2,
        -HEIGHT / 2,
        startTheta,
        startTheta + 2 * Math.PI,
        LEDS_PER_SPIRAL
      )
    )
  );
}
const vertices = [];

module.exports = {
  stripes,
  vertices,
};
