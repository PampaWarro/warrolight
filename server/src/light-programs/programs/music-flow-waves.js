const LightProgram = require("./../base-programs/LightProgram");
const ColorUtils = require("./../utils/ColorUtils");
const _ = require("lodash");
const {loadGradient} = require("../utils/gradients");

module.exports = class MusicFlowWaves extends LightProgram {
  init() {
    this.realTime = Math.round(Math.random()*20000); // Ensure initial random hue
    this.lastCreation = new Date();
    this.lastVolume = new Array(1000).fill([0, 0, 0]);
  }

  drawFrame(leds, context) {
    let audio = context.audio;
    if (!audio.ready) {
      return;
    }

    audio = audio.currentFrame;

    this.realTime += 1;

    let vol = audio[this.config.soundMetric] * this.config.multiplier;

    // Como las luces tenues son MUY fuertes igual, a partir de cierto valor "las bajamos"
    if (vol < this.config.cutThreshold) {
      vol = vol / 5;
    } else {
      vol = (vol - this.config.cutThreshold) * (1 / (1 - this.config.cutThreshold));
    }

    let [hueVol, satVol] = ColorUtils.RGBtoHSV(audio.midFastPeakDecay, audio.highFastPeakDecay, audio.bassFastPeakDecay);

    let intensity = Math.min((vol * vol) / 3, 1);

    let newVal = ColorUtils.HSVtoRGB(((hueVol % 1)/2 + this.realTime / 20000) % 1, satVol**0.5, intensity);

    if (this.config.colorMap) {
      const gradient = loadGradient(this.config.colorMap);
      newVal= gradient.colorAt(1 - intensity);
    }

    let speed = Math.ceil(intensity*1)
    this.lastVolume.splice(0, speed);

    this.lastVolume.push(... _.range(0,speed+1).fill([... newVal]));

    let geometry = this.geometry;

    for (let i = 0; i < this.numberOfLeds; i++) {
      let [r, g, b] = [0, 0, 0];

      let z = geometry.z[i] - geometry.depth / 2 - this.config.waveCenterZ;
      let y = geometry.y[i] - (geometry.height - 18) / 2 + this.config.waveCenterY;
      let x = geometry.x[i] - geometry.width / 2 - this.config.waveCenterX;

      let d = Math.max(0, Math.sqrt(x * x + y * y + z * z) - this.config.initialDistance)/this.config.waveSpeed*5;

      let colA = this.lastVolume[this.lastVolume.length - 1 - Math.floor(d)] || [0, 0, 0];
      let colB = this.lastVolume[this.lastVolume.length - 1 - Math.ceil(d)] || [0, 0, 0];
      let col = ColorUtils.mix(colA, colB, d % 1)
      leds[i] = ColorUtils.dim(col, this.config.brilloWave);
    }

    if(this.config.waveDecay) {
      let dimRatio = 1 - (this.config.waveDecay) / (this.config.fps);

      let skipFrames = Math.ceil(1 / (255 - dimRatio * 255));
      console.log("SKIP FRAMES", skipFrames)
      if (this.realTime % skipFrames === 0) {
        for (let i = 0; i < this.lastVolume.length; i++) {
          this.lastVolume[i] = ColorUtils.dim(this.lastVolume[i], dimRatio);
        }
      }
    }
  }

  getDebugHelpers() {
    let {waveCenterX, waveCenterY, waveCenterZ, initialDistance} = this.config;

    // Helpers coordinates are already centered
    let y =  waveCenterY + 9;
    let x = waveCenterX;
    let z = waveCenterZ;

    return [
      {type: 'sphere', x, y, z, r: initialDistance},
      {type: 'sphere', x, y, z, r: 1}
    ];
  }

  static presets() {
    return {
      default: {waveCenterY: 0},
      abajoFast: {waveCenterY: -17.3, waveSpeed: 3, waveWidth: 3},
    };
  }

  static configSchema() {
    let config = super.configSchema();

    config.multiplier = { type: Number, min: 0, max: 4, step: 0.01, default: 1 };
    config.cutThreshold = {type: Number, min: 0, max: 1, step: 0.01, default: 0.4};

    config.initialDistance = {type: Number, min: 0, max: 200, step: 0.1, default: 0};
    config.brilloWave = {type: Number, min: 0, max: 3, step: 0.01, default: 0.5};
    config.waveCenterY = {type: Number, min: -200, max: 200, step: 1, default: 0};
    config.waveCenterX = {type: Number, min: -200, max: 200, step: 1, default: 0};
    config.waveCenterZ = { type: Number, min: -200, max: 200, step: 1, default: 0 };
    config.waveSpeed = {type: Number, min: 0.1, max: 10, step: 0.1, default: 1};
    config.waveDecay = {type: Number, min: 0, max: 5, step: 0.01, default: 0};
    config.haciaAfuera = {type: Boolean, default: true};
    config.soundMetric = {type: 'soundMetric', default: "fastPeakDecay"};
    config.colorMap = { type: "gradient", default: "" };
    // config.colorHueOffset = {type: Number, min: 0, max: 1, step: 0.01, default: 0}

    // config.musicWeight = {type: Number, min: 0, max: 5, step: 0.1, default: 1}
    // config.numberOfParticles = {type: Number, min: 1, max: 600, step: 1, default: 50}
    // config.toneColor  = {type: Number, min: 0, max: 1, step: 0.01, default: 0.5}
    return config;
  }
};
