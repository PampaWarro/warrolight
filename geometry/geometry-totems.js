const Stripe = require('./Stripe')

// El orden de los segmentos es clave. Replica cómo vamos a conectar las luces y el orden natural de esos 600 leds
0
module.exports = [
  // Led 1
  new Stripe(0, 100, 50, 0,  150),
  new Stripe(150,100,100, 0, 150),
]
