const { Stripe } = require("../../src/geometry");

/**
 * Geometry: 3 nested equilateral triangles, all pointing UP
 *
 * Triangles have side lengths:
 *   1.00 (smallest), 1.66 (middle), 2.30 (largest)
 *
 * LEDs per side:
 *   T1 = 60, T2 = 100, T3 = 184
 */

const T1_LEDS = 60;   // innermost
const T2_LEDS = 100;  // middle
const T3_LEDS = 141;  // outer


function makeEquilateralTriangleUp(side) {
  const h = (Math.sqrt(3) / 2) * side;    // height of the triangle

  const offsetY = 0*SCALE;
  const apex     = [0, -2*h/3+offsetY];

  const baseLeft = [-side/2, h/3+offsetY];
  const baseRight= [ side/2, h/3+offsetY];

  return [baseLeft, apex, baseRight];
}

// Build each of the 3 triangles:
const SCALE = 25;
const T1 = makeEquilateralTriangleUp(1.00*SCALE);  // smallest
const T2 = makeEquilateralTriangleUp(1.66*SCALE);  // middle
const T3 = makeEquilateralTriangleUp(2.30*SCALE);  // largest

// Helper to turn three points + LED count into three stripes:
function buildTriangleStripes(points, ledCount) {
  // points = [p1, p2, p3]
  // returns 3 stripes: (p1->p2), (p2->p3), (p3->p1)
  return [
    Stripe.old2d(...points[0], ...points[1], ledCount),
    Stripe.old2d(...points[1], ...points[2], ledCount),
    Stripe.old2d(...points[2], ...points[0], ledCount),
  ];
}

// Create stripes for each triangle:
const stripesT1 = buildTriangleStripes(T1, T1_LEDS);   // 60 per side
const stripesT2 = buildTriangleStripes(T2, T2_LEDS);   // 100 per side
const stripesT3 = buildTriangleStripes(T3, T3_LEDS);   // 184 per side

console.log(stripesT1);
// Export all 9 stripes (3 per triangle):
module.exports = [
  ...stripesT3, // Grande primero
  ...stripesT2,
  ...stripesT1,
];

// 141 triangulo grande
