const { Stripe } = require("../../src/geometry");

/**
 * Geometry for the warro: 7 stripes
 *
 *      (0, 0) *     *-----*     * (WIDTH, 0)
 *              \     \   /     /
 *               \     \ /     /
 *                \     * (HALF_WIDTH, HALF_HEIGHT)
 *                 \   / \   /
 *                  \ /   \ /
 *                   *     *
 *        (PORTION, HEIGHT)    (2*PORTION, HEIGHT)
 */
const scale = 0.1;

const PORTION = 200 * scale;
const WIDTH = 3 * PORTION;
const TRIANGLE_BASE = 2*PORTION;
const SM_TRIANGLE_BASE = PORTION/2;
const HEIGHT = Math.sqrt(4 * PORTION * PORTION - PORTION * PORTION);
const HALF_HEIGHT = HEIGHT / 2;
const HALF_WIDTH = WIDTH / 2;

/**
 * Amount of leds on each part
 */
const LEDS_LONG = 60;
const HALF_LEDS = LEDS_LONG / 2;

// El orden de los segmentos es clave. Replica cómo vamos a conectar las luces y el orden natural de esos 600 leds

// module.exports = [
//   // Led 1
//   Stripe.old2d(WIDTH+4*PORTION, HEIGHT - HEIGHT, 4 * PORTION, HEIGHT - 0, LEDS_LONG),
//   Stripe.old2d(4*PORTION, HEIGHT, PORTION, 2*HEIGHT+PORTION, LEDS_LONG),
//   Stripe.old2d(PORTION, 2*HEIGHT+PORTION, 0, 4*HEIGHT+PORTION, LEDS_LONG),
//
//   // Led 2
//   Stripe.old2d(WIDTH+4*PORTION, HEIGHT - HEIGHT, 2*WIDTH+4*PORTION, HEIGHT - 0, LEDS_LONG - 1),
//   Stripe.old2d(2*WIDTH+4*PORTION, HEIGHT, 2*WIDTH+7*PORTION, 2*HEIGHT+PORTION, LEDS_LONG),
//   Stripe.old2d(2*WIDTH+7*PORTION, 2*HEIGHT+PORTION, 2*WIDTH+8*PORTION, 4*HEIGHT+PORTION, LEDS_LONG),
//
//  // Center
//   Stripe.old2d(WIDTH+4*PORTION+TRIANGLE_BASE, -TRIANGLE_BASE, WIDTH+4*PORTION, 0, LEDS_LONG),
//   Stripe.old2d(WIDTH+4*PORTION-TRIANGLE_BASE, -TRIANGLE_BASE, WIDTH+4*PORTION, 0, LEDS_LONG),
//   Stripe.old2d(WIDTH+4*PORTION-TRIANGLE_BASE, -TRIANGLE_BASE, WIDTH+4*PORTION+TRIANGLE_BASE, -TRIANGLE_BASE, LEDS_LONG),
//   Stripe.old2d(WIDTH+4*PORTION+TRIANGLE_BASE, TRIANGLE_BASE, WIDTH+4*PORTION, 0, LEDS_LONG - 1),
//   Stripe.old2d(WIDTH+4*PORTION-TRIANGLE_BASE, TRIANGLE_BASE, WIDTH+4*PORTION, 0, LEDS_LONG),
//   Stripe.old2d(WIDTH+4*PORTION-TRIANGLE_BASE, TRIANGLE_BASE, WIDTH+4*PORTION+TRIANGLE_BASE, TRIANGLE_BASE, LEDS_LONG),
//
// // Man head
//   //Stripe.old2d(WIDTH+4*PORTION+SM_TRIANGLE_BASE, -TRIANGLE_BASE+SM_TRIANGLE_BASE, WIDTH+4*PORTION-SM_TRIANGLE_BASE, -SM_TRIANGLE_BASE, LEDS_LONG - 1),
//   //Stripe.old2d(WIDTH+4*PORTION-SM_TRIANGLE_BASE, -TRIANGLE_BASE, WIDTH+4*PORTION, 0, LEDS_LONG - 1),
//   //Stripe.old2d(WIDTH+4*PORTION-SM_TRIANGLE_BASE, -TRIANGLE_BASE, WIDTH+4*PORTION+TRIANGLE_BASE, -TRIANGLE_BASE, LEDS_LONG - 1),
// ];

//
const headSideLeds = 20;
const domeStickLeds = (600 - headSideLeds * 3) / 12;

/**
 * Handmade planar projection based on figma drawing (extracted from gross real 3d shape)
 * We define half of the dots, and then mirror them on the X axis
 *
 *                         f *-------* f2
 *                            \     /
 *                             \ d /
 *                       c *-----*-----* c2
 *                        /    /  \     \
 *                       /    /    \     \
 *                     /    e*------* e2  \
 *                  b *                    * b2
 *                   /                      \
 *                  /                        \
 *               a *                          * a2
 *
 */

let [a,b,c,d,e,f] = ([[0,0], [76,-133],[198,-222], [350,-253], [272,-118], [272,-388]]).map(([x,y]) => [x*scale, y*scale]);
let [hc, htl, htr] = ([[350,-310], [318,-360],[((2*350 - 318)),-360]]).map(([x,y]) => [x*scale, y*scale]);
// Mirror versions of all except (d) which is in the middle
let [a2,b2,c2,e2,f2] = [a,b,c,e,f].map(([x,y]) => [(2*d[0] - x), y]);

module.exports = [
  // Left and bottom triangle
  Stripe.old2d(... a, ... b, domeStickLeds),
  Stripe.old2d(... b, ... c, domeStickLeds),
  Stripe.old2d(... c, ... d, domeStickLeds),
  Stripe.old2d(... d, ... f2, domeStickLeds),
  Stripe.old2d(... f2, ... f, domeStickLeds),
  Stripe.old2d(... f, ... d, domeStickLeds),

  // The head
  Stripe.old2d(... hc, ... htl, headSideLeds),
  Stripe.old2d(... htl, ... htr, headSideLeds),
  Stripe.old2d(... htr, ... hc, headSideLeds),

  // Right and top triangle
  Stripe.old2d(... d, ... e2, domeStickLeds),
  Stripe.old2d(... e2, ... e, domeStickLeds),
  Stripe.old2d(... e, ... d, domeStickLeds),
  Stripe.old2d(... d, ... c2, domeStickLeds),
  Stripe.old2d(... c2, ... b2, domeStickLeds),
  Stripe.old2d(... b2, ... a2, domeStickLeds),


  // Man head
    //Stripe.old2d(WIDTH+4*PORTION+SM_TRIANGLE_BASE, -TRIANGLE_BASE+SM_TRIANGLE_BASE, WIDTH+4*PORTION-SM_TRIANGLE_BASE, -SM_TRIANGLE_BASE, LEDS_LONG - 1),
    //Stripe.old2d(WIDTH+4*PORTION-SM_TRIANGLE_BASE, -TRIANGLE_BASE, WIDTH+4*PORTION, 0, LEDS_LONG - 1),
    //Stripe.old2d(WIDTH+4*PORTION-SM_TRIANGLE_BASE, -TRIANGLE_BASE, WIDTH+4*PORTION+TRIANGLE_BASE, -TRIANGLE_BASE, LEDS_LONG - 1),
];
