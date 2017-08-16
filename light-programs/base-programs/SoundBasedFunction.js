const ColorUtils = require("./../utils/ColorUtils");
const TimeTickedFunction = require("./TimeTickedFunction");
const _ = require('lodash');
const soundEmitter = require("../../sound-broadcast")

// Fake sound wave with random
let lastRandom = 0;
let realSound = 0;
let fakingSoundInterval = 0;
let t = 0;
function startFakeSound(){
  console.log("Faking sound.")
  fakingSoundInterval = setInterval(() => {
    // Magic formula to simulate song audio volume change?
    realSound = Math.min(1, Math.max(0, Math.pow(Math.random(), 2)*0.2+realSound*0.7+Math.sin(t*7)/10+Math.sin(t/3)/10));
    t += (25/1000)
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


      // self.bassesAverageVolume = getAverageVolume(array, 32);
      self.maxVolume = Math.max(self.maxVolume, self.averageVolume);
      self.averageRelativeVolume = self.averageVolume / (self.maxVolume || 1)
      self.averageRelativeVolumeSmoothed = self.averageVolumeSmoothed / (self.maxVolume || 1)

      self.medianVolume15.push(self.averageRelativeVolume)
      self.medianVolume15 = self.medianVolume15.slice(1)
      self.medianVolume = _.sortBy(self.medianVolume15)[7]

      soundEmitter.emit('volume', {level: self.averageRelativeVolume, max: self.maxVolume})

      // console.log("Last audio: " + (new Date() - lastTime) + "ms "+self.averageVolume)
      self.processInterval = setTimeout(computeSoundStats, 1000/self.config.fps);
      lastTime = new Date();
    }, 1000/self.config.fps);

    super.start(config, draw, done)
  }

  stop() {
    clearTimeout(this.processInterval)
    super.stop();
  }

  // Override and extend config Schema
  static configSchema(){
    let config = super.configSchema();
    return config;
  }
}