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

//
// const sndpeek = require('sndpeek');
// sndpeek.startListening();
// sndpeek.on('data', function({centroid, flux, rms, mffc, ...other}) {
//   realSound = rms;
//   clearTimeout(fakeSoundTimeout)
//   clearInterval(fakingSoundInterval)
//   fakeSoundTimeout = setTimeout(startFakeSound, 1000)
// })

let averageVolume = 0;
let averageRelativeVolume = 0;
let averageVolumeSmoothed = 0;
let averageVolumeSmoothedSlow = 0;
let averageRelativeVolumeSmoothed = 0;
let medianVolume15 = _.map(_.range(15), () => 0)
let medianVolume = 0
let lastTime = new Date();
let maxVolume = 0;
let processInterval = setTimeout(function computeSoundStats() {
  // calculate average
  averageVolume = realSound;
  averageVolumeSmoothed = (averageVolume + 2 * averageVolumeSmoothed) / 3
  averageVolumeSmoothedSlow = (averageVolume + 20 * averageVolumeSmoothedSlow) / 21

  // Plot
  // self.plotEnergyHistogram(self);


  // self.bassesAverageVolume = getAverageVolume(array, 32);
  maxVolume = (Math.max(maxVolume, averageVolume)*300+averageVolume)/301;
  averageRelativeVolume = averageVolume / (maxVolume || 1)
  averageRelativeVolumeSmoothed = averageVolumeSmoothed / (maxVolume || 1)

  medianVolume15.push(averageRelativeVolume)
  medianVolume15 = medianVolume15.slice(1)
  medianVolume = _.sortBy(medianVolume15)[7]

  soundEmitter.emit('volume', {level: averageRelativeVolume, max: maxVolume})

  // console.log("Last audio: " + (new Date() - lastTime) + "ms "+self.averageVolume)
  processInterval = setTimeout(computeSoundStats, 1000/60);
  lastTime = new Date();
}, 1000/60);


module.exports = class SoundBasedFunction extends TimeTickedFunction{
  constructor(config, leds) {
    super(config, leds);
  }

  start(config, draw, done){
    this.averageVolume = averageVolume;
    this.averageRelativeVolume = averageRelativeVolume;
    this.averageVolumeSmoothed = averageVolumeSmoothed;
    this.averageVolumeSmoothedSlow = averageVolumeSmoothedSlow;
    this.medianVolume15 = medianVolume15
    this.medianVolume = medianVolume
    let self = this;

    self.processInterval = setTimeout(function updateValues() {
      // calculate average
      self.averageVolume = averageVolume
      self.averageVolumeSmoothed = averageVolumeSmoothed
      self.averageVolumeSmoothedSlow = averageVolumeSmoothedSlow

      self.maxVolume = maxVolume
      self.averageRelativeVolume = averageRelativeVolume
      self.averageRelativeVolumeSmoothed = averageRelativeVolumeSmoothed

      self.medianVolume15 = medianVolume15
      self.medianVolume = medianVolume

      self.processInterval = setTimeout(updateValues, 1000/self.config.fps);
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