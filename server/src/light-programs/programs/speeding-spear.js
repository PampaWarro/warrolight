const ColorSpear = require("./color-spear");

module.exports = class SpeedingSpear extends ColorSpear {
  drawFrame(leds) {
    this.count = (this.count || 0) + 1;
    if (this.count % 180 == 0) {
      this.config.speed += 1;
      this.config.speed = Math.min(20, this.config.speed);
    }
    super.drawFrame(leds);
  }
};
