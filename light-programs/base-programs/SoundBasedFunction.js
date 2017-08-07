const ColorUtils = require("./../utils/ColorUtils");
const TimeTickedFunction = require("./TimeTickedFunction");
const _ = require('lodash');
const soundEmitter = require("../../sound-broadcast")

module.exports = class SoundBasedFunction extends TimeTickedFunction{
  constructor(config, leds) {
    super(config, leds);
  }

  start(config, draw, done){
    this.averageVolume = 0;
    this.averageRelativeVolume = 0;
    this.averageVolumeSmoothed = 0;
    this.averageVolumeSmoothedSlow = 0;
    this.medianVolume15 = _.map(_.range(15), () => 0)
    this.medianVolume = 0
    this.maxVolume = 0;
    let self = this;

    // Fake sound wave with random
    let lastRandom = 0;
    let realSound = 0;

    var fakingSoundInterval = 0;

    function startFakeSound(){
      console.log("Faking sound.")
      fakingSoundInterval = setInterval(() => {
        realSound = Math.pow(Math.random(), 2)*0.2+realSound*0.7;
      }, 25)
    }

    // After 1sec without mic sound, fake wave
    let fakeSoundTimeout = setTimeout(startFakeSound, 1000)

    soundEmitter.on('sound', (volume) => {
      realSound = volume;
      clearTimeout(fakeSoundTimeout)
      clearInterval(fakingSoundInterval)
      fakeSoundTimeout = setTimeout(startFakeSound, 1000)
    })



    function getAverageVolume(array, from=0, to=null) {
      return realSound;
    }

    let lastTime = new Date();

    self.processInterval = setTimeout(function computeSoundStats() {
      // calculate average
      self.averageVolume = getAverageVolume();
      self.averageVolumeSmoothed = (self.averageVolume + 2 * self.averageVolumeSmoothed) / 3
      self.averageVolumeSmoothedSlow = (self.averageVolume + 20 * self.averageVolumeSmoothedSlow) / 21

      // Plot
      // self.plotEnergyHistogram(self);

      self.medianVolume15.push(self.averageVolume)
      self.medianVolume15 = self.medianVolume15.slice(1)
      self.medianVolume = _.sortBy(self.medianVolume15)[7]

      // self.bassesAverageVolume = getAverageVolume(array, 32);
      self.maxVolume = Math.max(self.maxVolume, self.averageVolume);
      self.averageRelativeVolume = self.averageVolume / (self.maxVolume || 1)
      self.averageRelativeVolumeSmoothed = self.averageVolumeSmoothed / (self.maxVolume || 1)

      // console.log("Last audio: " + (new Date() - lastTime) + "ms "+self.averageVolume)
      self.processInterval = setTimeout(computeSoundStats, 1000/config.fps);
      lastTime = new Date();
    }, 1000/config.fps);

    super.start(config, draw, done)
  }

  stop() {
    super.stop();
    clearInterval(this.processInterval)
  }

  // Override and extend config Schema
  static configSchema(){
    let config = super.configSchema();
    // config.soundSamplingFreq = {type: Number, min: 1, max: 100, step: 1, default: 16};
    // config.maxFreq = {type: Number, min: 1, max: 512, step: 1, default: 512};
    // config.minFreq = {type: Number, min: 0, max: 512, step: 1, default: 0};
    // config.showHistogram = {type: Boolean, default: true};
    return config;
  }
}