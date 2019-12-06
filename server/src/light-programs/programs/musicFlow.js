const LightProgram = require("./../base-programs/LightProgram");
const ColorUtils = require("./../utils/ColorUtils");

module.exports = class MusicFlow extends LightProgram {
  constructor(config, leds) {
    super(config, leds);
  }

  start(config, draw) {
    this.lastVolume = new Array(this.numberOfLeds + 1).fill([0, 0, 0]);
    this.time = 0;
    this.realTime = 0;
    this.maxVolume = 0;

    super.start(config, draw);
  }

  // Override parent method
  drawFrame(draw, audio) {
    this.time += this.config.speed;
    this.realTime += 1;

    let vol = audio.rms * this.config.multiplier;

    // Como las luces tenues son MUY fuertes igual, a partir de cierto valor "las bajamos"
    if (vol < this.config.cutThreshold) {
      vol = vol / 5;
    } else {
      vol =
        (vol - this.config.cutThreshold) * (1 / (1 - this.config.cutThreshold));
    }

    let [hueVol] = ColorUtils.RGBtoHSV(
      audio.midFastPeakDecay,
      audio.highFastPeakDecay,
      audio.bassFastPeakDecay
    );
    let newVal = ColorUtils.HSVtoRGB(
      (hueVol + this.realTime / 2000) % 1,
      1,
      Math.min((vol * vol) / 3, 1)
    );
    // let newVal = ColorUtils.HSVtoRGB((hueVol)%1, 1, Math.min(vol*vol/3, 1));

    for (let i = 0; i < this.config.speed; i++) {
      if (this.config.doble) {
        if (this.config.haciaAfuera) {
          this.lastVolume.splice(this.numberOfLeds - 1, 1);
          this.lastVolume.splice(0, 1);
          this.lastVolume.splice(this.lastVolume.length / 2, 0, newVal);
          this.lastVolume.splice(this.lastVolume.length / 2, 0, newVal);
        } else {
          this.lastVolume.splice(Math.floor(this.numberOfLeds / 2 - 1), 2);
          this.lastVolume.unshift(newVal);
          this.lastVolume.push(newVal);
        }
      } else {
        this.lastVolume.splice(this.numberOfLeds - 1, 1);
        this.lastVolume.unshift(newVal);
      }
    }

    draw(this.lastVolume);
  }

  static presets() {
    return {
      slowDoble: { multiplier: 1, speed: 1, doble: true },
      mediumDoble: {
        multiplier: 1.3,
        cutThreshold: 0.6,
        speed: 3,
        doble: true
      },
      fastSimple: { speed: 7, doble: false },
      default: { doble: false, haciaAfuera: false, speed: 3 },
      fastDobleDesdePuntas: { speed: 7, doble: true, haciaAfuera: false },
      fastDobleDesdeCentro: { speed: 5, doble: true, haciaAfuera: true }
    };
  }

  // Override and extend config Schema
  static configSchema() {
    let res = super.configSchema();
    res.multiplier = { type: Number, min: 0, max: 2, step: 0.01, default: 1 };
    res.speed = { type: Number, min: 1, max: 30, step: 1, default: 3 };
    res.cutThreshold = {
      type: Number,
      min: 0,
      max: 1,
      step: 0.01,
      default: 0.4
    };
    res.doble = { type: Boolean, default: true };
    res.haciaAfuera = { type: Boolean, default: false };
    return res;
  }
};
