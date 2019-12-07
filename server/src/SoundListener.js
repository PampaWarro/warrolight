const _ = require("lodash");

module.exports = class SoundListener {

  constructor(soundAnalyzer, micConfig) {
    this.soundAnalyzer = soundAnalyzer;
    this.micConfig = micConfig;
  }

  start(callback) {
    let micConfig = this.micConfig;
    let lastVolumes = [];
    let lastRawVolumes = [];

    const flushVolume = _.throttle(() => {
      if (this.micConfig.sendingMicData) {
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
          (b, name) => frame.center.summary[name + micConfig.metric]
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
