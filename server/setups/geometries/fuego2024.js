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
 *   (PORTION, HEIGHT)     (2*PORTION, HEIGHT)
 */
const scale = 0.1;

const PORTION = 200 * scale;
const WIDTH = 3 * PORTION;
const HEIGHT = Math.sqrt(4 * PORTION * PORTION - PORTION * PORTION);
const HALF_HEIGHT = HEIGHT / 2;
const HALF_WIDTH = WIDTH / 2;

const TOTEM_Y = HEIGHT + 180 * scale;
const TOTEM_HEIGHT = scale * Math.sqrt(500 * 500 - 250 * 250);
const TOTEM_WIDTH = 1.25 * PORTION;
const DISTANCE_TOTEMS = PORTION;

/**
 * Amount of leds on each part
 */
const LEDS_LONG = 120;
const HALF_LEDS = LEDS_LONG / 2;

// El orden de los segmentos es clave. Replica cómo vamos a conectar las luces y el orden natural de esos 600 leds

let HIGH_DENSITY = 2;
module.exports = [
  // Led 1
  Stripe.old2d(HALF_WIDTH, HEIGHT, PORTION, HEIGHT, HALF_LEDS / 2 * 2, HIGH_DENSITY),
  Stripe.old2d(PORTION, HEIGHT - 0, 0, HEIGHT - HEIGHT, LEDS_LONG * 2, HIGH_DENSITY),

  // Led 2
  Stripe.old2d(PORTION, HEIGHT - 0, 2 * PORTION, 0, LEDS_LONG * 2, HIGH_DENSITY),
  Stripe.old2d(2 * PORTION, 0, HALF_WIDTH, HEIGHT - HEIGHT, HALF_LEDS / 2 * 2, HIGH_DENSITY),

  // Led 3
  Stripe.old2d(2 * PORTION, HEIGHT - 0, PORTION, 0, LEDS_LONG * 2, HIGH_DENSITY),
  Stripe.old2d(PORTION, 0, HALF_WIDTH, HEIGHT - HEIGHT, HALF_LEDS / 2 * 2, HIGH_DENSITY),

  //  Led 4
  Stripe.old2d(HALF_WIDTH, HEIGHT, 2 * PORTION, HEIGHT, HALF_LEDS / 2 * 2, HIGH_DENSITY),
  Stripe.old2d(2 * PORTION, HEIGHT - 0, WIDTH, HEIGHT - HEIGHT, LEDS_LONG * 2, HIGH_DENSITY),

  // Left totems
  Stripe.old2d(-DISTANCE_TOTEMS, TOTEM_Y, -DISTANCE_TOTEMS - TOTEM_WIDTH, TOTEM_Y - TOTEM_HEIGHT, 300, HIGH_DENSITY),
  Stripe.old2d(0, TOTEM_Y, -TOTEM_WIDTH, TOTEM_Y - TOTEM_HEIGHT, 300, HIGH_DENSITY),

  // Right totems
  Stripe.old2d(WIDTH, TOTEM_Y, WIDTH + TOTEM_WIDTH, TOTEM_Y - TOTEM_HEIGHT, 300, HIGH_DENSITY),
  Stripe.old2d(WIDTH + DISTANCE_TOTEMS, TOTEM_Y, WIDTH + DISTANCE_TOTEMS + TOTEM_WIDTH, TOTEM_Y - TOTEM_HEIGHT, 300, HIGH_DENSITY),

  // 5th left totem
  Stripe.old2d(-DISTANCE_TOTEMS*2, TOTEM_Y, -DISTANCE_TOTEMS*2 - TOTEM_WIDTH, TOTEM_Y - TOTEM_HEIGHT, 300, HIGH_DENSITY),

  // 6th right totem
  Stripe.old2d(WIDTH + 2*DISTANCE_TOTEMS, TOTEM_Y, WIDTH + 2*DISTANCE_TOTEMS + TOTEM_WIDTH, TOTEM_Y - TOTEM_HEIGHT, 300, HIGH_DENSITY)
];
