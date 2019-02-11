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
    this.fastAvg = null;
    this.max = null;
    this.min = null;
    this.alpha = 0.001;
    this.fastAlpha = 0.4;
  }
  extract(frame, object) {
    const value = this.getter(object);
    var avg = this.avg;
    var fastAvg = this.fastAvg;
    var min = this.min;
    var max = this.max;
    if (this.avg == null) {
      avg = value;
    } else {
      avg = this.alpha * value + (1 - this.alpha) * this.avg;
    }
    if (this.fastAvg == null) {
      fastAvg = value;
    } else {
      fastAvg = this.fastAlpha * value + (1 - this.fastAlpha) * this.fastAvg;
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
    var normalizedFastAvg = 0;
    if (max - min > 0) {
      normalizedValue = (value - min) / (max - min);
      normalizedAvg = (avg - min) / (max - min);
      normalizedFastAvg = (fastAvg - min) / (max - min);
    }
    this.avg = avg;
    this.fastAvg = fastAvg;
    this.min = min;
    this.max = max;
    return {
      value: value,
      normalizedValue: normalizedValue,
      normalizedAvg: normalizedAvg,
      normalizedFastAvg: normalizedFastAvg,
      avg: this.avg,
      fastAvg: this.fastAvg,
      min: this.min,
      max: this.max,
    }
  }
}

// Calculate running average, max and min for audio features.
class MovingStats {
  constructor(options)  {
    const bandNames = options.bandNames || ['bass', 'mid', 'high'];
    const that = this;
    this.channelExtractors = {};
    _.forOwn(channelFeatures, (options, featureName) => {
      that.channelExtractors[featureName] = new StatsExtractor(options);
    });
    this.filteredBandExtractors = {};
    _.forOwn(filteredBandFeatures, (options, featureName) => {
      that.filteredBandExtractors[featureName] = {};
      bandNames.forEach(bandName => {
        that.filteredBandExtractors[
          featureName][bandName] = new StatsExtractor(options);
      });
    });
    this.spectralBandExtractors = {};
    _.forOwn(spectralBandFeatures, (options, featureName) => {
      that.spectralBandExtractors[featureName] = {};
      bandNames.forEach(bandName => {
        that.spectralBandExtractors[
          featureName][bandName] = new StatsExtractor(options);
      });
    });
  }

  run(frame, emitter) {
    const that = this;
    frame.allChannels.forEach(channel => {
      channel.movingStats = {};
      _.forOwn(that.channelExtractors, (extractor, name) => {
        channel.movingStats[name] = extractor.extract(frame, channel);
      });

      _.forOwn(channel.filteredBands, (band, bandName) => {
        band.movingStats = {};
        _.forOwn(that.filteredBandExtractors, (extractors, name) => {
          band.movingStats[name] = extractors[bandName].extract(frame, band);
        });
      });

      _.forOwn(channel.spectralBands, (band, bandName) => {
        band.movingStats = {};
        _.forOwn(that.spectralBandExtractors, (extractors, name) => {
          band.movingStats[name] = extractors[bandName].extract(frame, band);
        });
      });
    });
  }
}

module.exports = {
  deps: ['rms', 'absolutefft'],
  init: options => new MovingStats(options)
}
