exports.Stripe = class Stripe {
  constructor([x1, y1, z1], [x2, y2, z2], numberOfLeds) {
    this.leds = numberOfLeds;
    this.x = [];
    this.y = [];
    this.z = [];

    for (let i = 0; i < numberOfLeds; i++) {
      this.x[i] = ((x2 - x1) * i) / this.leds + x1;
      this.y[i] = ((y2 - y1) * i) / this.leds + y1;
      this.z[i] = ((z2 - z1) * i) / this.leds + z1;
    }
  }
  // Convenience for old 2d constructor.
  static old2d(x1, y1, x2, y2, numberOfLeds) {
    return new Stripe([x1, y1, 0], [x2, y2, 0], numberOfLeds);
  }
  // Convenience for CAD software that displays xzy and y points upward.
  static fromXZUpwardY([x1, z1, y1], [x2, z2, y2], numberOfLeds) {
    return new Stripe([x1, -y1, z1], [x2, -y2, z2], numberOfLeds);
  }
};

exports.Geometry = class Geometry {
  constructor(stripes) {
    const marginX = 0;
    const marginY = 0;
    const marginZ = 0;

    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

    for (let stripe of stripes) {
      for (let i = 0; i < stripe.leds; i++) {
        if (stripe.x[i] < minX) {
          minX = stripe.x[i];
        }
        if (stripe.y[i] < minY) {
          minY = stripe.y[i];
        }
        if (stripe.y[i] < minZ) {
          minZ = stripe.z[i];
        }
        if (stripe.x[i] > maxX) {
          maxX = stripe.x[i];
        }
        if (stripe.y[i] > maxY) {
          maxY = stripe.y[i];
        }
        if (stripe.z[i] > maxZ) {
          maxZ = stripe.z[i];
        }
      }
    }

    this.width = maxX - minX;
    this.height = maxY - minY;
    this.depth = maxZ - minZ;

    const xScale = (this.width - 2 * marginX) / (maxX - minX);
    const yScale = (this.height - 2 * marginY) / (maxY - minY);
    const zScale = (this.depth - 2 * marginZ) / Math.max(maxZ - minZ, 1);
    const xBase = marginX;
    const yBase = marginY;
    const zBase = marginZ;

    this.x = [];
    this.y = [];
    this.z = [];

    let count = 0;
    for (let i = 0; i < stripes.length; i++) {
      const stripe = stripes[i];
      const stripeLength = stripe.leds;

      for (let j = 0; j < stripeLength; j++) {
        this.x[count + j] = (stripe.x[j] - minX) * xScale + xBase;
        this.y[count + j] = (stripe.y[j] - minY) * yScale + yBase;
        this.z[count + j] = (stripe.z[j] - minZ) * zScale + zBase;
      }
      count += stripeLength;
    }
    this.leds = count;
  }
};
