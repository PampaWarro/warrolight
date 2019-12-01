exports.Stripe = class Stripe {
  constructor(x1, y1, x2, y2, numberOfLeds) {
    this.leds = numberOfLeds;
    this.x = [];
    this.y = [];

    for (let i = 0; i < numberOfLeds; i++) {
      this.x[i] = ((x2 - x1) * i) / this.leds + x1;
      this.y[i] = ((y2 - y1) * i) / this.leds + y1;
    }
  }
};
