const { Stripe } = require("../../src/geometry");

// A:
//        a3
//     /      \
//  a2          a4
//  /            \
// a1            a5
//  \            /
//  a0---------a6

const a0 = [-1.078, 0.000, 0.000];
const a1 = [-1.524, 0.000, 1.078];
const a2 = [-1.078, 0.000, 2.155];
const a3 = [0.000, 0.000, 2.602];
const a4 = [1.078, 0.000, 2.155];
const a5 = [1.524, 0.000, 1.078];
const a6 = [1.078, 0.000, 0.000];
const A = [a0, a1, a2, a3, a4, a5, a6].reverse();

// B:
//    b3---b4
//   /       \
//  b2       b5
//  |         |
//  b1       b6
//   \       /
//    b0---b7

const b0 = [-0.914, 0.000, 0.000];
const b1 = [-1.408, 0.000, 0.494];
const b2 = [-1.408, 0.000, 1.661];
const b3 = [-0.538, 0.000, 2.486];
const b4 = [0.538, 0.000, 2.486];
const b5 = [1.408, 0.000, 1.661];
const b6 = [1.408, 0.000, 0.494];
const b7 = [0.914, 0.000, 0.000];
const B = [b0, b1, b2, b3, b4, b5, b6, b7]

const ribs = [
  // 1:
  {
    radius: 13,
    leds: 280,
    excess: 20,
  },
  // 2:
  {
    radius: 14,
    leds: 290,
    excess: 10,
  },
  // 3:
  {
    radius: 15,
    leds: 300,
    excess: 0,
  },
  // 4:
  {
    radius: 16,
    leds: 300,
    excess: 0,
  },
  // 5:
  {
    radius: 17,
    leds: 300,
    excess: 0,
  },
  // 6:
  {
    radius: 16,
    leds: 300,
    excess: 0,
  },
  // 7:
  {
    radius: 15,
    leds: 300,
    excess: 0,
  },
  // 8:
  {
    radius: 14,
    leds: 290,
    excess: 10,
  },
  // 9:
  {
    radius: 13,
    leds: 280,
    excess: 20,
  },
  // 10:
  {
    radius: 12,
    leds: 270,
    excess: 30,
  },
  // 11:
  {
    radius: 11,
    leds: 260,
    excess: 40,
  },
  // 12:
  {
    radius: 10,
    leds: 140,
    excess: 10,
  },
  // 13:
  {
    radius: 9,
    leds: 130,
    excess: 20,
  },
  // 14:
  {
    radius: 8,
    leds: 90,
    excess: 10,
  },
  // 15:
  {
    radius: 7,
    leds: 80,
    excess: 20,
  },
  // 16:
  {
    radius: 6,
    leds: 70,
    excess: 30,
  },
]

const D = 5;

const PIXEL_DENSITY = 2;

const stripes = [];

function multiPointStrip(points, totalPixels, pixelRatio) {
  function dist(p0, p1) {
    return Math.sqrt(Math.pow(p1[0] - p0[0], 2) + Math.pow(p1[1] - p0[1], 2) +
      Math.pow(p1[2] - p0[2], 2));
  }
  if (points.length < 2) {
    throw `points.length needs to be at least 2`;
  }
  let totalLength = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    totalLength += dist(p0, p1);
  }
  const segments = [];
  let usedPixels = 0;
  let roundError = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const length = dist(p0, p1);
    const fPixels = (length + roundError) * totalPixels / totalLength;
    const pixels = i < points.length - 2 ? Math.max(1, Math.round(fPixels))
      : totalPixels - usedPixels;
    roundError = fPixels - pixels;
    usedPixels += pixels;
    segments.push(Stripe.fromXZUpwardY(p0, p1, pixels, pixelRatio));
  }
  if (usedPixels != totalPixels) {
    throw `usedPixels(${usedPixels}) != totalPixels(${totalPixels})`;
  }
  return segments;
}

for (let i = 0; i < ribs.length; i++) {
  const r = ribs[i];
  const prototype = i % 2 == 0 ? A : B;
  const points = prototype.map(([x, z, y]) => [r.radius * x, i * D, r.radius * y]);
  stripes.push(...multiPointStrip(points, r.leds, PIXEL_DENSITY));
  if (r.excess > 0) {
    stripes.push(Stripe.fromXZUpwardY(points[points.length - 1], points[0], r.excess, PIXEL_DENSITY));
  }
}

module.exports = stripes;
