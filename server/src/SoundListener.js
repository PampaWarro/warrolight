const _ = require("lodash");

module.exports = class SoundListener {

  constructor(audioEmitter, micConfig) {
    this.audioEmitter = audioEmitter;
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

    this.audioEmitter.on("audioframe", frame => {
      const summary = {
        ..._.fromPairs(_.map(
            [ 'bass', 'mid', 'high' ],
            (bandName) => [bandName, frame[bandName + micConfig.metric]],
            )),
        all : frame.fastPeakDecay,
      };

      lastRawVolumes.push(summary);

      if (lastRawVolumes.length >= avg) {
        let avgLastVolumes = {
          bass : _.sum(_.map(lastRawVolumes, "bass")) / avg,
          mid : _.sum(_.map(lastRawVolumes, "mid")) / avg,
          high : _.sum(_.map(lastRawVolumes, "high")) / avg,
          all : _.sum(_.map(lastRawVolumes, "all")) / avg
        };

        lastVolumes.push(avgLastVolumes);
        flushVolume();

        lastRawVolumes.shift();
      }
    });
  }
}
