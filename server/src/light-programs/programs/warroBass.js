const LayerBasedProgram = require("../base-programs/LayerBasedProgram");
const programsByShape = require("../base-programs/ProgramsByShape");
const { PolarColors } = require("../utils/drawables");

function audioFill(options) {
  options = options || {};
  const getAudioEnergy = options.getAudioEnergy;
  const cycleMs = options.cycleMs || 5000;
  class AudioFill extends LayerBasedProgram {
    getDrawables() {
      return {
        fill: new PolarColors({
          value: 1
        })
      };
    }
    getLayers(drawables) {
      return {
        name: "fill",
        drawable: drawables.fill
      };
    }
    updateState(audio) {
      // Audio independent stuff.
      this.drawables.fill.angleOffset =
        Math.cos((Math.PI * this.timeInMs) / cycleMs) *
        (((10 * Math.PI * this.timeInMs) / cycleMs) % Math.PI);
      this.drawables.fill.center = [
        this.xBounds.center +
          0.35 *
            this.xBounds.scale *
            Math.cos((Math.PI * this.timeInMs) / 7000),
        this.yBounds.center +
          0.35 * this.yBounds.scale * Math.cos((Math.PI * this.timeInMs) / 8000)
      ];
      // Audio dependent stuff.
      if (!audio.ready) {
        return;
      }
      const energy = getAudioEnergy(audio.currentFrame);
      this.layers.fill.alpha = energy;
    }

    static presets() {
      return {
        default: {}
      };
    }
  }
  return AudioFill;
}

const BassFill = audioFill({
  getAudioEnergy: c => Math.pow(c.bassPeakDecay, 4),
  cycleMs: 5000
});
const MidFill = audioFill({
  getAudioEnergy: c => Math.pow(c.midPeakDecay, 4),
  cycleMs: 11000
});
const HighFill = audioFill({
  getAudioEnergy: c => Math.pow(c.highPeakDecay, 6),
  cycleMs: 9000
});

module.exports = programsByShape({
  WarroOnly: [BassFill],
  totemL1: [HighFill],
  totemR2: [HighFill],
  totemL2: [MidFill],
  totemR1: [MidFill]
});
