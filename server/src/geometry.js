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

exports.Geometry = class Geometry {
  constructor(stripes) {
    const marginX = 0;
    const marginY = 0;

    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    for (let stripe of stripes) {
      for (let i = 0; i < stripe.leds; i++) {
        if (stripe.x[i] < minX) {
          minX = stripe.x[i];
        }
        if (stripe.y[i] < minY) {
          minY = stripe.y[i];
        }
        if (stripe.x[i] > maxX) {
          maxX = stripe.x[i];
        }
        if (stripe.y[i] > maxY) {
          maxY = stripe.y[i];
        }
      }
    }

    this.width = maxX - minX;
    this.height = maxY - minY;

    const xScale = (this.width - 2 * marginX) / (maxX - minX);
    const yScale = (this.height - 2 * marginY) / (maxY - minY);
    const xBase = marginX;
    const yBase = marginY;

    this.x = [];
    this.y = [];

    let count = 0;
    for (let i = 0; i < stripes.length; i++) {
      const stripe = stripes[i];
      const stripeLength = stripe.leds;

      for (let j = 0; j < stripeLength; j++) {
        this.x[count + j] = (stripe.x[j] - minX) * xScale + xBase;
        this.y[count + j] = (stripe.y[j] - minY) * yScale + yBase;
      }
      count += stripeLength;
    }
    this.leds = count;
  }
};
