const TimeTickedFunction = require("./TimeTickedFunction");
const _ = require("lodash");
const soundEmitter = require("../../soundEmitter");

let audio = {
  lastFrame: {
    centroid: 0,
    rms: 0,
    spectralBands: { bass: { energy: 0 } },
    filteredBands: { bass: { energy: 0, rms: 25 } },
    movingStats: { rms: { slow: { value: 0, normalizedValue: 0 } } },
    spectralCentroid: { bin: 100 }
  }
}

audio.currentAudioFrame = audio.lastFrame;

audio.absolutefft = _.range(0, 512).map(() => 0);
audio.maxabsolutefft = _.range(0, 512).map(() => 0);
audio.medianVolume11 = _.map(_.range(11), () => 0);
audio.averageVolume = 0;
audio.averageRelativeVolume = 0;
audio.averageVolumeSmoothed = 0;
audio.averageVolumeSmoothedSlow = 0;
audio.averageRelativeVolumeSmoothed = 0;
audio.medianVolume = 0;
audio.maxVolume = 0;
audio.audioReady = false;

soundEmitter.on("processedaudioframe", frame => {
  let { center: lastFrame } = frame;
  let realSound = frame.center.rms;
  // realSound = lastFrame.rms;

  audio.currentAudioFrame = frame;
  audio.audioReady = true;
  audio.lastFrame = lastFrame;

  _.each(
    audio.maxabsolutefft,
    (v, i) =>
      (audio.maxabsolutefft[i] = Math.max(
        audio.maxabsolutefft[i] * 0.99,
        lastFrame.absolutefft[i]
      ))
  );
  _.each(
    audio.absolutefft,
    (v, i) =>
      (audio.absolutefft[i] = audio.absolutefft[i] * 0.5 + 0.5 * lastFrame.absolutefft[i])
  );

  audio.averageVolume = realSound;
  audio.averageVolumeSmoothed = (audio.averageVolume + 2 * audio.averageVolumeSmoothed) / 3;
  audio.averageVolumeSmoothedSlow =
    (audio.averageVolume + 20 * audio.averageVolumeSmoothedSlow) / 21;

  audio.medianVolume11.push(audio.averageRelativeVolume);
  audio.medianVolume11 = audio.medianVolume11.slice(1);
  audio.medianVolume = _.sortBy(audio.medianVolume11)[5];

  audio.maxVolume = (Math.max(audio.maxVolume, audio.averageVolume) * 500 + audio.averageVolume) / 501;
  audio.averageRelativeVolume = audio.averageVolume / (audio.maxVolume || 1);
  audio.averageRelativeVolumeSmoothed = audio.averageVolumeSmoothed / (audio.maxVolume || 1);
});

module.exports = class SoundBasedFunction extends TimeTickedFunction {
  constructor(config, leds) {
    super(config, leds);
  }

  start(config, draw) {
    this.audio = audio;
    let self = this;

    self.processInterval = setTimeout(function updateValues() {
      self.audio = audio;
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
