const _ = require("lodash");

exports.MicConfig = class MicConfig {
  constructor(config) {
    this.config = config;
  }

  update(newConfig) {
    Object.assign(this.config, newConfig);
  }

  isSendingMicData() {
    return this.config.sendingMicData;
  }

  getMetric() {
    return this.config.metric;
  }
};

exports.SoundListener = class SoundListener {

  constructor(soundAnalyzer, micConfig) {
    this.soundAnalyzer = soundAnalyzer;
    this.micConfig = micConfig;
  }

  start(callback) {
    let micConfig = this.micConfig;
    let lastVolumes = [];
    let lastRawVolumes = [];

    const flushVolume = _.throttle(() => {
      if (this.micConfig.isSendingMicData()) {
        callback(lastVolumes);
      }
      lastVolumes = [];
    }, 100);

    let avg = 1;

    this.soundAnalyzer.on("processedaudioframe", frame => {
      let {
        center: {
          filteredBands,
          movingStats: {
            rms: {
              slow: { normalizedValue }
            }
          }
        }
      } = frame;

      lastRawVolumes.push({
        ..._.mapValues(
          filteredBands,
          (b, name) => frame.center.summary[name + micConfig.getMetric()]
        ),
        all: normalizedValue
      });

      if (lastRawVolumes.length >= avg) {
        let avgLastVolumes = {
          bass: _.sum(_.map(lastRawVolumes, "bass")) / avg,
          mid: _.sum(_.map(lastRawVolumes, "mid")) / avg,
          high: _.sum(_.map(lastRawVolumes, "high")) / avg,
          all: _.sum(_.map(lastRawVolumes, "all")) / avg
        };

        lastVolumes.push(avgLastVolumes);
        flushVolume();

        lastRawVolumes.shift();
      }
    });
  }
}
