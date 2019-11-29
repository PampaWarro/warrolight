const TimeTickedFunction = require("./../base-programs/TimeTickedFunction");
const ColorUtils = require("./../utils/ColorUtils");

Leap = require("leapjs");

module.exports = class AllWhite extends TimeTickedFunction {
  start(config, draw, done) {
    this.hand1Center = [0, 0, 0];
    this.hand2Center = [0, 0, 0];

    Leap.loop(frame => {
      if (frame.hands.length > 0)
        this.hand1Center = frame.hands[0].palmPosition;

      if (frame.hands.length > 1)
        this.hand2Center = frame.hands[1].palmPosition;
    });

    super.start(config, draw, done);
  }

  // Override base class
  drawFrame(draw, done) {
    // En HSV blanco es (0,0,1)
    let z1 = this.hand1Center[1];
    let z2 = this.hand1Center[0];
    let scale = 500;
    let brightness = Math.max(0, Math.min(1, (z1 - 50) / scale));
    let hue = Math.abs((z2 / 300) % 1);
    let tonoDeBlanco = ColorUtils.HSVtoRGB(hue, 1, brightness);

    let colors = [...Array(this.numberOfLeds)]; // Array del tamaño de las luces
    draw(colors.map(() => tonoDeBlanco));
  }

  // Override and extend config Schema
  static configSchema() {
    let res = super.configSchema();
    res.brillo = { type: Number, min: 0, max: 1, step: 0.01, default: 0.5 };
    return res;
  }
};
