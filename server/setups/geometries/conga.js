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

module.exports = [
  // Led 1
  Stripe.old2d(WIDTH+4*PORTION, HEIGHT - HEIGHT, 4 * PORTION, HEIGHT - 0, LEDS_LONG),
  Stripe.old2d(4*PORTION, HEIGHT, PORTION, 2*HEIGHT+PORTION, LEDS_LONG),
  Stripe.old2d(PORTION, 2*HEIGHT+PORTION, 0, 4*HEIGHT+PORTION, LEDS_LONG),

  // Led 2
  Stripe.old2d(WIDTH+4*PORTION, HEIGHT - HEIGHT, 2*WIDTH+4*PORTION, HEIGHT - 0, LEDS_LONG - 1),
  Stripe.old2d(2*WIDTH+4*PORTION, HEIGHT, 2*WIDTH+7*PORTION, 2*HEIGHT+PORTION, LEDS_LONG),
  Stripe.old2d(2*WIDTH+7*PORTION, 2*HEIGHT+PORTION, 2*WIDTH+8*PORTION, 4*HEIGHT+PORTION, LEDS_LONG),

 // Center
  Stripe.old2d(WIDTH+4*PORTION+TRIANGLE_BASE, -TRIANGLE_BASE, WIDTH+4*PORTION, 0, LEDS_LONG),
  Stripe.old2d(WIDTH+4*PORTION-TRIANGLE_BASE, -TRIANGLE_BASE, WIDTH+4*PORTION, 0, LEDS_LONG),
  Stripe.old2d(WIDTH+4*PORTION-TRIANGLE_BASE, -TRIANGLE_BASE, WIDTH+4*PORTION+TRIANGLE_BASE, -TRIANGLE_BASE, LEDS_LONG),
  Stripe.old2d(WIDTH+4*PORTION+TRIANGLE_BASE, TRIANGLE_BASE, WIDTH+4*PORTION, 0, LEDS_LONG - 1),
  Stripe.old2d(WIDTH+4*PORTION-TRIANGLE_BASE, TRIANGLE_BASE, WIDTH+4*PORTION, 0, LEDS_LONG),
  Stripe.old2d(WIDTH+4*PORTION-TRIANGLE_BASE, TRIANGLE_BASE, WIDTH+4*PORTION+TRIANGLE_BASE, TRIANGLE_BASE, LEDS_LONG),

// Man head
  //Stripe.old2d(WIDTH+4*PORTION+SM_TRIANGLE_BASE, -TRIANGLE_BASE+SM_TRIANGLE_BASE, WIDTH+4*PORTION-SM_TRIANGLE_BASE, -SM_TRIANGLE_BASE, LEDS_LONG - 1),
  //Stripe.old2d(WIDTH+4*PORTION-SM_TRIANGLE_BASE, -TRIANGLE_BASE, WIDTH+4*PORTION, 0, LEDS_LONG - 1),
  //Stripe.old2d(WIDTH+4*PORTION-SM_TRIANGLE_BASE, -TRIANGLE_BASE, WIDTH+4*PORTION+TRIANGLE_BASE, -TRIANGLE_BASE, LEDS_LONG - 1),

];
