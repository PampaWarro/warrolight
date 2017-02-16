import { default as Stripe } from './stripe'

/**
 * Geometry for the warro: 7 stripes
 *
 * (0, HEIGHT) *     *-----*     * (WIDTH, HEIGHT)
 *              \     \   /     /
 *               \     \ /     /
 *                \     * (HALF_WIDTH, HALF_HEIGHT)
 *                 \   / \   /
 *                  \ /   \ /
 *                   *     *
 *        (PORTION, 0)    (2*PORTION, 0)
 */
const scale = 0.1;

const PORTION = 200*scale
const WIDTH = 3*PORTION
const HEIGHT = Math.sqrt(4*PORTION*PORTION - PORTION*PORTION)
const HALF_HEIGHT = HEIGHT/2
const HALF_WIDTH = WIDTH/2

/**
 * Amount of leds on each part
 */
const LEDS_LONG = 120
const HALF_LEDS = LEDS_LONG/2;
const LAST_LED = 1

export default [
  new Stripe(0         , HEIGHT - HEIGHT     , PORTION   , HEIGHT - 0          , LEDS_LONG),
  new Stripe(PORTION   , HEIGHT - 0          , HALF_WIDTH, HEIGHT - HALF_HEIGHT, HALF_LEDS),
  new Stripe(HALF_WIDTH, HEIGHT - HALF_HEIGHT, PORTION   , HEIGHT - HEIGHT     , HALF_LEDS),
  new Stripe(PORTION   , HEIGHT - HEIGHT     , 2*PORTION , HEIGHT - HEIGHT     , HALF_LEDS),
  new Stripe(2*PORTION , HEIGHT - HEIGHT     , HALF_WIDTH, HEIGHT - HALF_HEIGHT, HALF_LEDS),
  new Stripe(HALF_WIDTH, HEIGHT - HALF_HEIGHT, 2*PORTION , HEIGHT - 0          , HALF_LEDS),
  new Stripe(PORTION, HEIGHT, 2*PORTION , HEIGHT, HALF_LEDS),
  new Stripe(2*PORTION , HEIGHT - 0          , WIDTH     , HEIGHT - HEIGHT     , LEDS_LONG),
  // new Stripe(WIDTH     , HEIGHT - HEIGHT     , WIDTH     , HEIGHT - HEIGHT     , LAST_LED),
]
