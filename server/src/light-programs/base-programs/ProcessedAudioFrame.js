const _ = require("lodash");

module.exports = class ProcessedAudioFrame {
  constructor() {
    // TODO: add center property?
    this.lastFrame = {
      centroid: 0,
      rms: 0,
      spectralBands: { bass: { energy: 0 } },
      filteredBands: { bass: { energy: 0, rms: 25 } },
      movingStats: { rms: { slow: { value: 0, normalizedValue: 0 } } },
      spectralCentroid: { bin: 100 }
    };
    this.currentAudioFrame = this.lastFrame;
    this.absolutefft = _.range(0, 512).map(() => 0);
    this.maxabsolutefft = _.range(0, 512).map(() => 0);
    this.medianVolume11 = _.map(_.range(11), () => 0);
    this.averageVolume = 0;
    this.averageRelativeVolume = 0;
    this.averageVolumeSmoothed = 0;
    this.averageVolumeSmoothedSlow = 0;
    this.averageRelativeVolumeSmoothed = 0;
    this.medianVolume = 0;
    this.maxVolume = 0;
    this.audioReady = false;
  }

  update(frame) {
    let { center: lastFrame } = frame;
    let realSound = frame.center.rms;
    // realSound = lastFrame.rms;
  
    this.currentAudioFrame = frame;
    this.thisReady = true;
    this.lastFrame = lastFrame;
  
    _.each(
      this.maxabsolutefft,
      (v, i) =>
        (this.maxabsolutefft[i] = Math.max(
          this.maxabsolutefft[i] * 0.99,
          lastFrame.absolutefft[i]
        ))
    );
    _.each(
      this.absolutefft,
      (v, i) =>
        (this.absolutefft[i] = this.absolutefft[i] * 0.5 + 0.5 * lastFrame.absolutefft[i])
    );
  
    this.averageVolume = realSound;
    this.averageVolumeSmoothed = (this.averageVolume + 2 * this.averageVolumeSmoothed) / 3;
    this.averageVolumeSmoothedSlow =
      (this.averageVolume + 20 * this.averageVolumeSmoothedSlow) / 21;
  
    this.medianVolume11.push(this.averageRelativeVolume);
    this.medianVolume11 = this.medianVolume11.slice(1);
    this.medianVolume = _.sortBy(this.medianVolume11)[5];
  
    this.maxVolume = (Math.max(this.maxVolume, this.averageVolume) * 500 + this.averageVolume) / 501;
    this.averageRelativeVolume = this.averageVolume / (this.maxVolume || 1);
    this.averageRelativeVolumeSmoothed = this.averageVolumeSmoothed / (this.maxVolume || 1);
  
    _.each(
      _.get(frame, "center.summary"),
      (val, key) => (this[key] = val)
    );
  }
}
