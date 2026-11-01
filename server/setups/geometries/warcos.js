const _ = require("lodash");
const { Stripe } = require("../../src/geometry");

/**
 * W with a 1m base (2m legs), with two half-arch totems in front of it,
 * mirrored left/right. Together the two totems form an arch framing the W
 * (as seen from the front).
 *
 * The W is made of 2 strips of 300 leds:
 *
 *  Strip 1 (outer): starts at the top of the left leg, goes down the left
 *  leg, along the bottom bar and up the right leg.
 *
 *    1 *                 * end
 *       \               /
 *        \             /
 *         *-----------*
 *
 *  Strip 2 (inner): starts at the left foot, goes up to the top right
 *  corner, along the top bar to the left and down to the right foot.
 *
 *         *-----------*
 *          \         /
 *            \     /
 *              \ /
 *              / \
 *            /     \
 *          /         \
 *       2 *           * end
 *
 * Each totem is a full arch made with a single strip of 300 leds that starts
 * at the floor on the left, goes up a vertical post, curves over the top and
 * comes down the post on the right. In the geometry each arch is split in two
 * halves of 150 leds (left: floor to top, right: top to floor) so that shapes
 * can run programs symmetrically on both halves.
 *
 * The W is at z = 0 and each arch is at its own depth in front of it (bigger z
 * is closer to the viewer): arch 1 in front of the W and arch 2 in front of
 * arch 1. y grows downwards, floor at y = 0.
 */

// 1 meter in geometry units (same scale as wgrande).
const M = 20;

// W
const PORTION = 1 * M; // bottom bar, top bar
const WIDTH = 3 * PORTION;
const HEIGHT = Math.sqrt(4 * PORTION * PORTION - PORTION * PORTION);
const LEDS_PER_STRIP = 300;
// Each strip is 2 + 1 + 2 portions long.
const LEDS_LONG = (LEDS_PER_STRIP * 2) / 5;
const LEDS_BAR = LEDS_PER_STRIP / 5;
// Height of the W feet above the floor.
const W_ELEVATION = 0;

// Totems (full arches).
const TOTEM_LEDS = 300;
const HALF_TOTEM_LEDS = TOTEM_LEDS / 2;
const ARC_RADIUS = 1 * M; // also half the width of the arch
const ARCH_1_DISTANCE = 2 * M;
const ARCH_2_DISTANCE = 4 * M;
// Same led density as the W.
const LEDS_PER_UNIT = LEDS_LONG / (2 * PORTION);
const ARC_LEDS = Math.round((Math.PI / 2) * ARC_RADIUS * LEDS_PER_UNIT);
const POST_LEDS = HALF_TOTEM_LEDS - ARC_LEDS;
const POST_HEIGHT = POST_LEDS / LEDS_PER_UNIT;

// Translate W coordinates (x in [0, WIDTH], y in [0, HEIGHT] with feet at
// HEIGHT) so that the W is centered on x = 0 and its feet are W_ELEVATION
// above the floor.
const w = (x, y) => [x - WIDTH / 2, y - HEIGHT - W_ELEVATION, 0];
const wLine = (x1, y1, x2, y2, leds) => Stripe.line(w(x1, y1), w(x2, y2), leds);

// Half arch from the floor to the top center. side = -1 for the left half, 1
// for the right one.
function halfArch(side, z) {
  const points = [];
  const x = side * ARC_RADIUS;
  for (let i = 0; i < POST_LEDS; i++) {
    points.push([x, -(i * POST_HEIGHT) / POST_LEDS, z]);
  }
  for (let i = 0; i < ARC_LEDS; i++) {
    const angle = ((Math.PI / 2) * i) / ARC_LEDS;
    points.push([
      side * ARC_RADIUS * Math.cos(angle),
      -POST_HEIGHT - ARC_RADIUS * Math.sin(angle),
      z,
    ]);
  }
  return new Stripe(points);
}

// Wired from the floor on the left to the floor on the right.
function arch(z) {
  const right = halfArch(1, z);
  const reversed = new Stripe(
    _.zip(right.x, right.y, right.z).reverse()
  );
  return [halfArch(-1, z), reversed];
}

const stripes = [
  // Strip 1: left leg, bottom bar, right leg
  wLine(0, 0, PORTION, HEIGHT, LEDS_LONG),
  wLine(PORTION, HEIGHT, 2 * PORTION, HEIGHT, LEDS_BAR),
  wLine(2 * PORTION, HEIGHT, WIDTH, 0, LEDS_LONG),

  // Strip 2: diagonal up to the right, top bar, diagonal down to the right
  wLine(PORTION, HEIGHT, 2 * PORTION, 0, LEDS_LONG),
  wLine(2 * PORTION, 0, PORTION, 0, LEDS_BAR),
  wLine(PORTION, 0, 2 * PORTION, HEIGHT, LEDS_LONG),

  // Totems
  ...arch(ARCH_1_DISTANCE),
  ...arch(ARCH_2_DISTANCE),
];

const W_LEDS = 2 * LEDS_PER_STRIP;

const vertices = [];
for (let i = 0; i < 2; i++) {
  const offset = i * LEDS_PER_STRIP;
  vertices.push(
    offset,
    offset + LEDS_LONG,
    offset + LEDS_LONG + LEDS_BAR,
    offset + LEDS_PER_STRIP - 1
  );
}
for (let i = 0; i < 2; i++) {
  const offset = W_LEDS + i * TOTEM_LEDS;
  vertices.push(
    offset,
    offset + HALF_TOTEM_LEDS - 1,
    offset + HALF_TOTEM_LEDS,
    offset + TOTEM_LEDS - 1
  );
}

module.exports = {
  stripes,
  vertices,
  LEDS_PER_STRIP,
  LEDS_LONG,
  LEDS_BAR,
  TOTEM_LEDS,
  HALF_TOTEM_LEDS,
  POST_LEDS,
};
