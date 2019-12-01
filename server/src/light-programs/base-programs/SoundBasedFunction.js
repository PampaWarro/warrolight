const TimeTickedFunction = require("./TimeTickedFunction");
const _ = require("lodash");
const soundEmitter = require("../../soundEmitter");

// Fake sound wave with random
let realSound = 0;

let lastFrameData = {
  centroid: 0,
  rms: 0,
  spectralBands: { bass: { energy: 0 } },
  filteredBands: { bass: { energy: 0, rms: 25 } },
  movingStats: { rms: { slow: { value: 0, normalizedValue: 0 } } },
  spectralCentroid: { bin: 100 }
};

let currentAudioFrame = lastFrameData;

let fakingSoundInterval = 0;
let t = 0;
function startFakeSound() {
  console.log("Faking sound.");
  fakingSoundInterval = setInterval(() => {
    // Magic formula to simulate song audio volume change?
    realSound = Math.min(
      1,
      Math.max(
        0,
        Math.pow(Math.random(), 2) * 0.2 +
          realSound * 0.7 +
          Math.sin(t * 7) / 10 +
          Math.sin(t / 3) / 10
      )
    );
    t += 25 / 1000;

    lastFrameData = { rms: realSound, centroid: 50 };
  }, 25);
}

// After 1sec without mic sound, fake wave
let fakeSoundTimeout = setTimeout(startFakeSound, 1000);

let absolutefft = _.range(0, 512).map(() => 0);
let maxabsolutefft = _.range(0, 512).map(() => 0);

let medianVolume11 = _.map(_.range(11), () => 0);
let averageVolume = 0;
let averageRelativeVolume = 0;
let averageVolumeSmoothed = 0;
let averageVolumeSmoothedSlow = 0;
let averageRelativeVolumeSmoothed = 0;
let medianVolume = 0;
let maxVolume = 0;
let audioReady = false;

soundEmitter.on("processedaudioframe", frame => {
  let { center: lastFrame } = frame;
  realSound = frame.center.rms;
  realSound = lastFrame.rms;

  clearTimeout(fakeSoundTimeout);
  clearInterval(fakingSoundInterval);
  fakeSoundTimeout = setTimeout(startFakeSound, 1000);

  currentAudioFrame = frame;
  audioReady = true;
  lastFrameData = lastFrame;

  _.each(
    maxabsolutefft,
    (v, i) =>
      (maxabsolutefft[i] = Math.max(
        maxabsolutefft[i] * 0.99,
        lastFrame.absolutefft[i]
      ))
  );
  _.each(
    absolutefft,
    (v, i) =>
      (absolutefft[i] = absolutefft[i] * 0.5 + 0.5 * lastFrame.absolutefft[i])
  );

  averageVolume = realSound;
  averageVolumeSmoothed = (averageVolume + 2 * averageVolumeSmoothed) / 3;
  averageVolumeSmoothedSlow =
    (averageVolume + 20 * averageVolumeSmoothedSlow) / 21;

  medianVolume11.push(averageRelativeVolume);
  medianVolume11 = medianVolume11.slice(1);
  medianVolume = _.sortBy(medianVolume11)[5];

  maxVolume = (Math.max(maxVolume, averageVolume) * 500 + averageVolume) / 501;
  averageRelativeVolume = averageVolume / (maxVolume || 1);
  averageRelativeVolumeSmoothed = averageVolumeSmoothed / (maxVolume || 1);
});

module.exports = class SoundBasedFunction extends TimeTickedFunction {
  constructor(config, leds) {
    super(config, leds);
  }

  start(config, draw) {
    this.soundEmitter = soundEmitter;
    this.audioReady = audioReady;
    this.currentAudioFrame = currentAudioFrame;
    this.averageVolume = averageVolume;
    this.averageRelativeVolume = averageRelativeVolume;
    this.averageVolumeSmoothed = averageVolumeSmoothed;
    this.averageVolumeSmoothedSlow = averageVolumeSmoothedSlow;
    this.medianVolume11 = medianVolume11;
    this.medianVolume = medianVolume;
    let self = this;

    self.processInterval = setTimeout(function updateValues() {
      // calculate average
      self.audioReady = audioReady;
      self.currentAudioFrame = currentAudioFrame;
      self.averageVolume = averageVolume;
      self.averageVolumeSmoothed = averageVolumeSmoothed;
      self.averageVolumeSmoothedSlow = averageVolumeSmoothedSlow;

      self.maxVolume = maxVolume;
      self.averageRelativeVolume = averageRelativeVolume;
      self.averageRelativeVolumeSmoothed = averageRelativeVolumeSmoothed;

      self.medianVolume11 = medianVolume11;
      self.medianVolume = medianVolume;

      self.centroid = lastFrameData.centroid;
      self.lastFrame = lastFrameData;
      self.absolutefft = absolutefft;
      self.maxabsolutefft = maxabsolutefft;

      _.each(
        _.get(currentAudioFrame, "center.summary"),
        (val, key) => (self[key] = val)
      );

      self.processInterval = setTimeout(updateValues, 1000 / self.config.fps);
    }, 1000 / self.config.fps);

    super.start(config, draw);
  }

  stop() {
    clearTimeout(this.processInterval);
    super.stop();
  }

  // Override and extend config Schema
  static configSchema() {
    let config = super.configSchema();
    return config;
  }
};
