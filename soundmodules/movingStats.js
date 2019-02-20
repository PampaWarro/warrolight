const _ = require('lodash');

const channelFeatures = {
  rms: {
    getter: channel => channel.rms
  },
  fftPeak: {
    forceZeroMin: true,
    getter: channel => Math.max(...channel.absolutefft)
  },
}

const filteredBandFeatures = {
  rms: {
    getter: band => band.rms
  },
}

const spectralBandFeatures = {
  energy: {
    getter: band => band.energy
  },
  fftPeak: {
    forceZeroMin: true,
    getter: band => Math.max(...band.subspectrum)
  },
}

class StatsExtractor {
  constructor(options) {
    this.getter = options.getter;
    this.forceZeroMin = !!options.forceZeroMin;
    this.avg = null;
    this.max = null;
    this.min = null;
    this.alpha = (options.alpha === undefined)? 0.001 : options.alpha;
  }
  extract(frame, object) {
    const value = this.getter(object);
    var avg = this.avg;
    var min = this.min;
    var max = this.max;
    if (this.avg == null) {
      avg = value;
    } else {
      avg = this.alpha * value + (1 - this.alpha) * this.avg;
    }
    if (this.forceZeroMin) {
      min = 0;
    } else if (min == null) {
      min = value;
    } else {
      min = this.alpha * this.avg + (1 - this.alpha) * this.min;
    }
    min = Math.min(min, value);
    if (max == null) {
      max = value;
    } else {
      max = this.alpha * this.avg + (1 - this.alpha) * this.max;
    }
    max = Math.max(max, value);
    if (max < min) {
      max = min;
    }
    var normalizedValue = 0;
    var normalizedAvg = 0;
    if (max - min > 0) {
      normalizedValue = (value - min) / (max - min);
      normalizedAvg = (avg - min) / (max - min);
    }
    this.avg = avg;
    this.min = min;
    this.max = max;
    return {
      value: value,
      normalizedValue: normalizedValue,
      normalizedAvg: normalizedAvg,
      avg: this.avg,
      min: this.min,
      max: this.max,
    }
  }
}

const statsExtractorOptions = {
  slow: {alpha: 0.0001},
  mid: {alpha: 0.02},
  fast: {alpha: 0.06},
};

// Calculate running average, max and min for audio features.
class MovingStats {
  constructor(options)  {
    const bandNames = options.bandNames || ['bass', 'mid', 'high'];
    const that = this;
    this.channelExtractors = {};
    _.forOwn(channelFeatures, (baseOptions, featureName) => {
      that.channelExtractors[featureName] = {};
      _.forOwn(statsExtractorOptions, (options, name) => {
        that.channelExtractors[featureName][name] = new StatsExtractor(
          Object.assign({}, options, baseOptions));
      });
    });
    this.filteredBandExtractors = {};
    _.forOwn(filteredBandFeatures, (baseOptions, featureName) => {
      that.filteredBandExtractors[featureName] = {};
      bandNames.forEach(bandName => {
        that.filteredBandExtractors[featureName][bandName] = {};
        _.forOwn(statsExtractorOptions, (options, name) => {
          that.filteredBandExtractors[featureName][bandName][
            name] = new StatsExtractor(Object.assign({}, options, baseOptions));
        });
      });
    });
    this.spectralBandExtractors = {};
    _.forOwn(spectralBandFeatures, (baseOptions, featureName) => {
      that.spectralBandExtractors[featureName] = {};
      bandNames.forEach(bandName => {
        that.spectralBandExtractors[featureName][bandName] = {};
        _.forOwn(statsExtractorOptions, (options, name) => {
          that.spectralBandExtractors[featureName][bandName][
            name] = new StatsExtractor(Object.assign({}, options, baseOptions));
        });
      });
    });
  }

  run(frame, emitter) {
    const that = this;
    frame.allChannels.forEach(channel => {
      channel.movingStats = {};
      _.forOwn(that.channelExtractors, (extractor, name) => {
        channel.movingStats[name] = {
          slow: extractor.slow.extract(frame, channel),
          mid: extractor.mid.extract(frame, channel),
          fast: extractor.fast.extract(frame, channel),
        };
      });

      _.forOwn(channel.filteredBands, (band, bandName) => {
        band.movingStats = {};
        _.forOwn(that.filteredBandExtractors, (extractors, name) => {
          band.movingStats[name] = {
            slow: extractors[bandName].slow.extract(frame, band),
            mid: extractors[bandName].mid.extract(frame, band),
            fast: extractors[bandName].fast.extract(frame, band),
          };
        });
      });

      _.forOwn(channel.spectralBands, (band, bandName) => {
        band.movingStats = {};
        _.forOwn(that.spectralBandExtractors, (extractors, name) => {
          band.movingStats[name] = {
            slow: extractors[bandName].slow.extract(frame, band),
            mid: extractors[bandName].mid.extract(frame, band),
            fast: extractors[bandName].fast.extract(frame, band),
          };
        });
      });
    });
  }
}

module.exports = {
  deps: ['rms', 'absolutefft'],
  init: options => new MovingStats(options)
}
