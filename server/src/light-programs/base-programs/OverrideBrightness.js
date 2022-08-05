module.exports = function overrideBrightness(Program, brightness) {
  if (typeof brightness === 'number') {
    // Brightness can be a constant or a function.
    const value = brightness;
    brightness = () => value;
  }
  return class OverrideBrightness extends Program {
    init() {
      this.startTimeInMs = null;
      super.init();
    }
    drawFrame(leds, context) {
      super.drawFrame(leds, context);
      if (this.startTimeInMs === null) {
        this.startTimeInMs = context.timeInMs;
      }
      const value = brightness.call(this, context);
      leds.forEach(led => led.forEach((x, i) => led[i] = x * value));
    }
  };
};
