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

class SoundListener {
  constructor(soundEmitter, micConfig) {
    this.soundEmitter = soundEmitter;
    this.micConfig = micConfig;
    this.listener = () => {};
  }

  start() {
    let micConfig = this.micConfig;
    let lastVolumes = [];
    let lastRawVolumes = [];

    const flushVolume = _.throttle(() => {
      if (this.micConfig.isSendingMicData()) {
        this.listener(lastVolumes);
      }
      lastVolumes = [];
    }, 100);

    let avg = 1;

    this.soundEmitter.on("processedaudioframe", frame => {
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

  setListener(cb) {
    this.listener = cb;
  }

  clearListener() {
    this.listener = () => {};
  }
}

exports.startSoundListener = function startSoundListener(
  soundEmitter,
  micConfig
) {
  const sound = new SoundListener(soundEmitter, micConfig);
  sound.start();
  return sound;
};
