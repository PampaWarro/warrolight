const _ = require('lodash');

// Read output of other sound modules and provide easy to use variables that
// make sense in a visual context.
class Summarize {
  summarizeFilteredBand(band, prefix) {
    const slowMax = band.movingStats.rms.slow.max;
    const fastMax = band.movingStats.rms.fast.max;
    const fastAvg = band.movingStats.rms.fast.avg;
    const normalizedRms = band.movingStats.rms.slow.normalizedValue;
    return {
      [`${prefix}Max`]: slowMax,
      [`${prefix}Rms`]: normalizedRms,
      [`${prefix}PeakDecay`]: (fastMax - fastAvg)/(slowMax - fastAvg) || 0,
    };
  }
  summarizeSpectralBand(band) {
    return {};
  }
  summarizeChannel(channel) {
    const slowMax = channel.movingStats.rms.slow.max;
    const fastMax = channel.movingStats.rms.fast.max;
    const fastAvg = channel.movingStats.rms.fast.avg;
    const normalizedRms = channel.movingStats.rms.slow.normalizedValue;
    const highRmsNoBass = Math.max(0,
      channel.summary.highRms - channel.summary.bassRms);
    const midRmsNoBass = Math.max(0,
      channel.summary.midRms - channel.summary.bassRms);
    const highPeakDecayNoBass = Math.max(0,
      channel.summary.highPeakDecay - channel.summary.bassPeakDecay);
    const midPeakDecayNoBass = Math.max(0,
      channel.summary.midPeakDecay - channel.summary.bassPeakDecay);
    return {
      highPeakDecayNoBass: highPeakDecayNoBass,
      midPeakDecayNoBass: midPeakDecayNoBass,
      highRmsNoBass: highRmsNoBass,
      midRmsNoBass: midRmsNoBass,
      max: slowMax,
      rms: normalizedRms,
      peakDecay: (fastMax - fastAvg)/(slowMax - fastAvg) || 0,
    };
  }
  run(frame, emitter) {
    const that = this;
    frame.allChannels.forEach(channel => {
      const summary = channel.summary = {}
      _.forOwn(channel.filteredBands, (band, bandName) => {
        Object.assign(summary, that.summarizeFilteredBand(band, bandName));
      });
      _.forOwn(channel.spectralBands, (band, bandName) => {
        Object.assign(summary, that.summarizeSpectralBand(band, bandName));
      });
      Object.assign(summary, that.summarizeChannel(channel));
    });
  }
}

module.exports = {
  deps: ['movingStats'],
  init: options => new Summarize(options)
}
