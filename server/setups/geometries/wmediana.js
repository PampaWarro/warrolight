const { Stripe } = require("../../src/geometry");

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

const PORTION = 200 * scale;
const WIDTH = 3 * PORTION;
const HEIGHT = Math.sqrt(4 * PORTION * PORTION - PORTION * PORTION);
const HALF_HEIGHT = HEIGHT / 2;
const HALF_WIDTH = WIDTH / 2;

/**
 * Amount of leds on each part
 */
const LEDS_LONG = 90;
const HALF_LEDS = 45;
const QUART_LEDS = 23;

// El orden de los segmentos es clave. Replica cómo vamos a conectar las luces y el orden natural de esos 600 leds
const hideX = 0;
const hideY = 34.6;

export default [
  // Led 1
  Stripe.old2d(hideX, hideY, hideX, hideY, 39),
  Stripe.old2d(HALF_WIDTH, HEIGHT, PORTION, HEIGHT, 21),
  Stripe.old2d(PORTION, HEIGHT - 0, 0, HEIGHT - HEIGHT, LEDS_LONG),

  // Led 2
  Stripe.old2d(hideX, hideY, hideX, hideY, 39),
  Stripe.old2d(PORTION, HEIGHT - 0, 2 * PORTION, 0, LEDS_LONG),
  Stripe.old2d(2 * PORTION, 0, HALF_WIDTH, HEIGHT - HEIGHT, QUART_LEDS - 2),

  // Led 3
  Stripe.old2d(hideX, hideY, hideX, hideY, 37),
  Stripe.old2d(2 * PORTION, HEIGHT - 0, PORTION, 0, LEDS_LONG - 1),
  Stripe.old2d(PORTION, 0, HALF_WIDTH, HEIGHT - HEIGHT, QUART_LEDS + 1),

  //  Led 4
  Stripe.old2d(hideX, hideY, hideX, hideY, 34),
  Stripe.old2d(HALF_WIDTH - 1, HEIGHT, 2 * PORTION, HEIGHT, QUART_LEDS + 3),
  Stripe.old2d(2 * PORTION, HEIGHT - 0, WIDTH, HEIGHT - HEIGHT, LEDS_LONG)
];
