const TimeTickedFunction = require("./TimeTickedFunction");
const _ = require("lodash");
const soundEmitter = require("../../soundEmitter");

let audio = {
  lastFrameData: {
    centroid: 0,
    rms: 0,
    spectralBands: { bass: { energy: 0 } },
    filteredBands: { bass: { energy: 0, rms: 25 } },
    movingStats: { rms: { slow: { value: 0, normalizedValue: 0 } } },
    spectralCentroid: { bin: 100 }
  }
}

audio.currentAudioFrame = audio.lastFrameData;

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
  audio.lastFrameData = lastFrame;

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
    this.audioReady = audio.audioReady;
    this.currentAudioFrame = audio.currentAudioFrame;
    this.averageVolume = audio.averageVolume;
    this.averageRelativeVolume = audio.averageRelativeVolume;
    this.averageVolumeSmoothed = audio.averageVolumeSmoothed;
    this.averageVolumeSmoothedSlow = audio.averageVolumeSmoothedSlow;
    this.medianVolume11 = audio.medianVolume11;
    this.medianVolume = audio.medianVolume;
    let self = this;

    self.processInterval = setTimeout(function updateValues() {
      // calculate average
      self.audioReady = audio.audioReady;
      self.currentAudioFrame = audio.currentAudioFrame;
      self.averageVolume = audio.averageVolume;
      self.averageVolumeSmoothed = audio.averageVolumeSmoothed;
      self.averageVolumeSmoothedSlow = audio.averageVolumeSmoothedSlow;

      self.maxVolume = audio.maxVolume;
      self.averageRelativeVolume = audio.averageRelativeVolume;
      self.averageRelativeVolumeSmoothed = audio.averageRelativeVolumeSmoothed;

      self.medianVolume11 = audio.medianVolume11;
      self.medianVolume = audio.medianVolume;

      self.centroid = audio.lastFrameData.centroid;
      self.lastFrame = audio.lastFrameData;
      self.absolutefft = audio.absolutefft;
      self.maxabsolutefft = audio.maxabsolutefft;

      _.each(
        _.get(audio.currentAudioFrame, "center.summary"),
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
