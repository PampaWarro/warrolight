module.exports = function animateParamProgram(
  Program,
  parameter,
  frequency,
  change
) {
  return class AnimateParam extends Program {
    init() {
      this.startTimeInMs = null;
      super.init();
    }
    drawFrame(leds, context) {
      if (this.startTimeInMs === null) {
        this.startTimeInMs = context.timeInMs;
      }
      this.count = (this.count || 0) + 1;
      if (this.count % frequency == 0) {
        this.config[parameter] = change.call(this, this.config[parameter], context);
      }
      super.drawFrame(leds, context);
    }
  };
};
