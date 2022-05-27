const _ = require("lodash");

module.exports = class SoundListener {

  constructor(audioEmitter, micConfig) {
    this.audioEmitter = audioEmitter;
    this.micConfig = micConfig;
  }

  start(callback) {
    let lastVolumes = [];
    let lastRawVolumes = [];

    const flushVolume = _.throttle(() => {
      callback(lastVolumes);
      lastVolumes = [];
    }, 100);

    let avg = 1;

    this.audioFrameHandler = frame => {
      let micConfig = this.micConfig;
      let micPrefix = micConfig.input || '';
      const summary = {
        ..._.fromPairs(_.map(
          [ 'bass', 'mid', 'high' ],
          (bandName) => [bandName, frame[micPrefix+bandName + _.upperFirst(micConfig.metric)]],
        )),
        all : frame[micPrefix+micConfig.metric],
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
    }

    this.audioEmitter.on("audioframe", this.audioFrameHandler);
  }

  stop() {
    this.audioEmitter.off("audioframe", this.audioFrameHandler)
  }
}
