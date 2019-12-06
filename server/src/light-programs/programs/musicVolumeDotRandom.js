const TimeTickedFunction = require("./../base-programs/TimeTickedFunction");
const ColorUtils = require("./../utils/ColorUtils");

module.exports = class musicVolumeDotRandom extends TimeTickedFunction {
  constructor(config, leds) {
    super(config, leds);
  }

  start(config, draw) {
    this.lastVolume = new Array(this.numberOfLeds + 1)
      .join("0")
      .split("")
      .map(() => [0, 0, 0]);
    this.time = 0;
    this.maxVolume = 0;

    this.onLeds = new Array(this.numberOfLeds).fill(false);
    this.assignLights();
    super.start(config, draw);
  }

  assignLights() {
    let p = this.config.numberOfOnLeds / this.numberOfLeds;
    for (let i = 0; i < this.onLeds.length; i++) {
      this.onLeds[i] = Math.random() < p;
    }
    this.needingReshuffle = false;
  }

  // Override parent method
  drawFrame(draw, audio) {
    this.time += this.config.speed;

    let vol = (audio[this.config.soundMetric] || 0) * this.config.multiplier;

    // Como las luces tenues son MUY fuertes igual, a partir de cierto valor "las bajamos"
    if (vol < this.config.cutThreshold) {
      vol = 0;
      this.needingReshuffle = true;
    } else {
      if (this.needingReshuffle) {
        this.assignLights();
      }

      vol = (vol - this.config.cutThreshold) / (1 - this.config.cutThreshold);
    }

    let newVal = ColorUtils.HSVtoRGB(0, 0, Math.min(vol * vol, 1));

    for (let i = 0; i < this.numberOfLeds; i++) {
      if (this.onLeds[i]) {
        this.lastVolume[i] = newVal;
      } else {
        this.lastVolume[i] = [0, 0, 0];
      }
    }

    draw(this.lastVolume);
  }

  static presets() {
    return {};
  }

  // Override and extend config Schema
  static configSchema() {
    let res = super.configSchema();
    res.multiplier = { type: Number, min: 0, max: 2, step: 0.01, default: 1 };
    res.numberOfOnLeds = {
      type: Number,
      min: 1,
      max: 100,
      step: 1,
      default: 40
    };
    res.cutThreshold = {
      type: Number,
      min: 0,
      max: 1,
      step: 0.01,
      default: 0.45
    };
    res.soundMetric = {
      type: String,
      values: [
        "fastPeakDecay",
        "bassFastPeakDecay",
        "midFastPeakDecay",
        "highFastPeakDecay"
      ],
      default: "bassFastPeakDecay"
    };
    return res;
  }
};
