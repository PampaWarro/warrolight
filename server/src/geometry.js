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
  constructor(stripes, width, height, marginX, marginY) {
    marginX = parseInt(marginX) || 0;
    marginY = parseInt(marginY) || 0;

    this.stripes = stripes;

    const minX = getFromStripe(this.stripes, Math.min, Infinity, "x");
    const maxX = getFromStripe(this.stripes, Math.max, -Infinity, "x");
    const minY = getFromStripe(this.stripes, Math.min, Infinity, "y");
    const maxY = getFromStripe(this.stripes, Math.max, -Infinity, "y");

    this.width = width ? parseInt(width, 10) : maxX - minX;
    this.height = height ? parseInt(height, 10) : maxY - minY;

    const xScale = (this.width - 2 * marginX) / (maxX - minX);
    const yScale = (this.height - 2 * marginY) / (maxY - minY);
    const xBase = marginX;
    const yBase = marginY;

    this.x = [];
    this.y = [];
    const stripeCount = this.stripes.length;
    let count = 0;
    for (let i = 0; i < stripeCount; i++) {
      const stripe = this.stripes[i];
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

function getFromStripe(stripes, func, defaultValue, propName) {
  return stripes.reduce((prop, stripe) => {
    return func(
      prop,
      stripe[propName].reduce(
        (prop2, coordinate) => func(prop2, coordinate),
        defaultValue
      )
    );
  }, defaultValue);
}
