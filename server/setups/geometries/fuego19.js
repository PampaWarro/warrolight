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

module.exports = [
  // Led 1
  new Stripe(HALF_WIDTH, HEIGHT, PORTION, HEIGHT, HALF_LEDS / 2),
  new Stripe(PORTION, HEIGHT - 0, 0, HEIGHT - HEIGHT, LEDS_LONG),

  // Led 2
  new Stripe(PORTION, HEIGHT - 0, 2 * PORTION, 0, LEDS_LONG),
  new Stripe(2 * PORTION, 0, HALF_WIDTH, HEIGHT - HEIGHT, HALF_LEDS / 2),

  // Led 3
  new Stripe(2 * PORTION, HEIGHT - 0, PORTION, 0, LEDS_LONG),
  new Stripe(PORTION, 0, HALF_WIDTH, HEIGHT - HEIGHT, HALF_LEDS / 2),

  //  Led 4
  new Stripe(HALF_WIDTH, HEIGHT, 2 * PORTION, HEIGHT, HALF_LEDS / 2),
  new Stripe(2 * PORTION, HEIGHT - 0, WIDTH, HEIGHT - HEIGHT, LEDS_LONG),

  // Left totems
  new Stripe(
    -DISTANCE_TOTEMS,
    TOTEM_Y,
    -DISTANCE_TOTEMS - TOTEM_WIDTH,
    TOTEM_Y - TOTEM_HEIGHT,
    150
  ),
  new Stripe(0, TOTEM_Y, -TOTEM_WIDTH, TOTEM_Y - TOTEM_HEIGHT, 150),

  // Right totems
  new Stripe(WIDTH, TOTEM_Y, WIDTH + TOTEM_WIDTH, TOTEM_Y - TOTEM_HEIGHT, 150),
  new Stripe(
    WIDTH + DISTANCE_TOTEMS,
    TOTEM_Y,
    WIDTH + DISTANCE_TOTEMS + TOTEM_WIDTH,
    TOTEM_Y - TOTEM_HEIGHT,
    150
  )
];
