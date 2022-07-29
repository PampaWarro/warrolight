const {Stripe} = require("../../src/geometry");

function dist(p0, p1) {
  return Math.sqrt(Math.pow(p1[0] - p0[0], 2) + Math.pow(p1[1] - p0[1], 2) +
                   Math.pow(p1[2] - p0[2], 2));
}

function multiPointStrip(points, totalPixels) {
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
    segments.push(Stripe.fromXZUpwardY(p0, p1, pixels));
  }
  return segments;
}

// Strips go from bottom to top, exterior first and interior second.
//
// +-----------+ L1 (ext) + L2 (int)
//  \         /
//   +-------+   L3 (ext) + L4 (int)
//  /         \
//  +---------+  L5 (ext) + L6 (int)
//  \         /
//   +-------+   L7 (ext) + L8 (int)
//    \     /
//     +---+     L9 (ext+int)

const L1 = [
  [.91, .84, 2.5],
  [1.25, 0, 2.5],
  [.89, -.89, 2.5],
  [0, -1.25, 2.5],
  [-.89, -.89, 2.5],
  [-1.25, 0, 2.5],
  [-1.07, .44, 2.5],
];
const L2 = [
  [1.19, .05, 2.5],
  [.85, .85, 2.5],
  [0, 1.2, 2.5],
  [-.85, .85, 2.5],
  [-1.2, 0, 2.5],
  [-.85, -.85, 2.5],
  [-.19, -1.14, 2.5],
].reverse();
const L3 = [
  [.05, .83, 1.8],
  [.6, .6, 1.8],
  [.85, 0, 1.8],
  [.6, -.6, 1.8],
  [0, -.85, 1.8],
  [-.6, -.6, 1.8],
  [-.85, 0, 1.8],
  [-.6, .6, 1.8],
  [0, .85, 1.8],
];
const L4 = [
  [0, .81, 1.8],
  [-.57, .57, 1.8],
  [-.81, 0, 1.8],
  [-.57, -.57, 1.8],
  [0, -.81, 1.8],
  [.57, -.57, 1.8],
  [.81, 0, 1.8],
  [.57, .57, 1.8],
  [.05, .79, 1.8],
].reverse();
const L5 = [
  [.37, .89, 1],
  [.74, .74, 1],
  [1.05, 0, 1],
  [.74, -.74, 1],
  [0, -1.05, 1],
  [-.74, -.74, 1],
  [-1.05, 0, 1],
  [-.8, .59, 1],
];
const L6 = [
  [.96, -.14, 1],
  [1.02, 0, 1],
  [.72, .72, 1],
  [0, 1.02, 1],
  [-.72, .72, 1],
  [-1.02, 0, 1],
  [-.72, -.72, 1],
  [0, -1.02, 1],
  [.62, -.76, 1],
].reverse();
const L7 = [
  [.1, .85, .5],
  [.63, .63, .5],
  [.89, 0, .5],
  [.63, -.63, .5],
  [0, -.89, .5],
  [-.63, -.63, .5],
  [-.89, 0, .5],
  [-.63, .63, .5],
  [-.1, .85, .5],
];
const L8 = [
  [.81, -.09, .5],
  [.85, 0, .5],
  [.6, .6, .5],
  [0, .85, .5],
  [-.6, .6, .5],
  [-.85, 0, .5],
  [-.6, -.6, .5],
  [0, -.85, .5],
  [.6, -.6, .5],
  [.79, -.14, .5],
].reverse();
const L9 = [
  [ 0, .52, 0 ],
  [ .37, .37, 0 ],
  [ .52, 0, 0 ],
  [ .37, -.37, 0 ],
  [ 0, -.52, 0 ],
  [ -.37, -.37, 0 ],
  [ -.52, 0, 0 ],
  [ -.48, .02, 0 ],
  [ -.34, .34, 0 ],
  [ 0, .49, 0 ],
  [ .34, .34, 0 ],
  [ .49, 0, 0 ],
  [ .34, -.34, 0 ],
  [ 0, -.49, 0 ],
  [ -.34, -.34, 0 ],
  [ -.46, -.06, 0 ],
];
const stripes = [];
const scale = vec => vec.map(x => 20 * x);
[L1, L2, L3, L4, L5, L6, L7, L8, L9]
    .map(strip => strip.map(scale))
    .forEach(strip => stripes.push(...multiPointStrip(strip, 300)));

module.exports = stripes;
