const Stripe = require("./Stripe");

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
const LEDS_LONG = 30;
const HALF_LEDS = LEDS_LONG / 2;
const LAST_LED = 1;

// El orden de los segmentos es clave. Replica cómo vamos a conectar las luces y el orden natural de esos 600 leds

module.exports = [
  // Led 1
  new Stripe(WIDTH, HEIGHT - HEIGHT, 2 * PORTION, HEIGHT - 0, LEDS_LONG - 1),

  new Stripe(2 * PORTION, HEIGHT - 0, PORTION, HEIGHT - HEIGHT, LEDS_LONG),

  new Stripe(PORTION, HEIGHT - HEIGHT, 2 * PORTION, HEIGHT - HEIGHT, HALF_LEDS),
  new Stripe(2 * PORTION, HEIGHT - HEIGHT, PORTION, HEIGHT - 0, LEDS_LONG),
  new Stripe(PORTION, HEIGHT - 0, 0, HEIGHT - HEIGHT, LEDS_LONG),
  new Stripe(0, 0, 0, 0, 14),
  new Stripe(0, 0, 0, 0, 1)
];
