const _ = require("lodash");

/**
 * Three nested equilateral triangles:
 *
 *  - Inner (T1): 3 sides, each with T1_LEDS
 *  - Middle (T2): 3 sides, each with T2_LEDS
 *  - Outer (T3): 3 sides, each with T3_LEDS
 *
 *    innermost   = 1.00 m side
 *    middle      = 1.66 m side
 *    outermost   = 2.30 m side
 *
 * Index layout (for example):
 *
 *  T1_side1: 0             ... T1_LEDS-1
 *  T1_side2: T1_LEDS       ... (2*T1_LEDS)-1
 *  T1_side3: 2*T1_LEDS     ... (3*T1_LEDS)-1
 *
 *  T2_side1: 3*T1_LEDS     ... 3*T1_LEDS + (T2_LEDS)-1
 *  T2_side2: ^ next chunk
 *  T2_side3: ^ next chunk
 *
 *  T3_side1, T3_side2, T3_side3, etc.
 *
 * So you end up with a continuous index range from 0..(totalLEDs-1).
 */

module.exports = function getShapes() {
  // Choose how many LEDs on each side of each triangle
  const T1_LEDS = 30; // innermost triangle
  const T2_LEDS = 50; // middle triangle
  const T3_LEDS = 70; // outermost triangle

  // Compute total
  const T1Total = 3 * T1_LEDS; // 3 sides
  const T2Total = 3 * T2_LEDS;
  const T3Total = 3 * T3_LEDS;
  const totalLEDs = T1Total + T2Total + T3Total;

  // --- Define index ranges for T1 (inner) sides ---
  const T1_side1 = _.range(0, T1_LEDS);
  const T1_side2 = _.range(T1_LEDS, 2 * T1_LEDS);
  const T1_side3 = _.range(2 * T1_LEDS, 3 * T1_LEDS);

  // --- Define index ranges for T2 (middle) sides ---
  const T2_start = T1Total;
  const T2_side1 = _.range(T2_start, T2_start + T2_LEDS);
  const T2_side2 = _.range(T2_start + T2_LEDS, T2_start + 2*T2_LEDS);
  const T2_side3 = _.range(T2_start + 2*T2_LEDS, T2_start + 3*T2_LEDS);

  // --- Define index ranges for T3 (outer) sides ---
  const T3_start = T1Total + T2Total;
  const T3_side1 = _.range(T3_start, T3_start + T3_LEDS);
  const T3_side2 = _.range(T3_start + T3_LEDS, T3_start + 2*T3_LEDS);
  const T3_side3 = _.range(T3_start + 2*T3_LEDS, T3_start + 3*T3_LEDS);

  // Now create some combined "shapes" referencing those ranges:
  const innerTriangle   = _.flatten([T1_side1, T1_side2, T1_side3]);
  const middleTriangle  = _.flatten([T2_side1, T2_side2, T2_side3]);
  const outerTriangle   = _.flatten([T3_side1, T3_side2, T3_side3]);
  const allOfIt         = _.range(0, totalLEDs);

  return {
    // All possible LEDs
    allOfIt,

    // Inner triangle, broken down by side or whole
    T1_side1,
    T1_side2,
    T1_side3,
    innerTriangle,

    // Middle triangle
    T2_side1,
    T2_side2,
    T2_side3,
    middleTriangle,

    // Outer triangle
    T3_side1,
    T3_side2,
    T3_side3,
    outerTriangle,
  };
};
