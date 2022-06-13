module.exports = function animateParamProgram(
  Program,
  parameter,
  frequency,
  change
) {
  return class AnimateParam extends Program {
    drawFrame(leds, context) {
      this.count = (this.count || 0) + 1;
      if (this.count % frequency == 0) {
        this.config[parameter] = change.apply(this, [this.config[parameter]]);
      }
      super.drawFrame(leds, context);
    }
  };
};
