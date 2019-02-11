const _ = require('lodash');
const Throttler = require('./util/exponentialThrottler.js');

// Dynamic range compressor-inspired peak detector. Lambda acts as a threshold
// that reacts quickly during attack and slowly during release.
// Populates the "peaks" property in the frame object and also emits "peak"
// events. Also emits "throttledpeaks" events after applying exponential
// throttling.
class PeakDetector {
  constructor(config) {
    // TODO: make taua and taur config args.
    this._taua = 500e-6;
    this._taur = 100e-2;
    this._aa = 1 - Math.exp(-1/(this._taua*config.sampleRate));
    this._ar = 1 - Math.exp(-1/(this._taur*config.sampleRate));
    this._perChannelState = [];
    for (let i = 0; i <= config.channels; i++) {
      this._perChannelState.push({});
    }
    const throttlers = [
      new Throttler({
        filter: event => event.bandName == 'global',
        eventName: 'throttledpeak',
        emitter: config.emitter,
        halfLife: 1,
        minDt: .1,
        getValue: event => event.energy,
      }),
      new Throttler({
        filter: event => event.bandName == 'bass',
        eventName: 'throttledpeak',
        emitter: config.emitter,
        halfLife: 1,
        minDt: .1,
        getValue: event => event.energy,
      }),
      new Throttler({
        filter: event => event.bandName == 'mid',
        eventName: 'throttledpeak',
        emitter: config.emitter,
        halfLife: 1,
        minDt: .1,
        getValue: event => event.energy,
      }),
      new Throttler({
        filter: event => event.bandName == 'high',
        eventName: 'throttledpeak',
        emitter: config.emitter,
        halfLife: 1,
        minDt: .1,
        getValue: event => event.energy,
      }),
    ]
    throttlers.forEach(throttler => {
      config.emitter.on('peak', event => throttler.onEvent(event));
    });
  }
  detectPeaks(frame, samples, state) {
    const that = this;
    state = state || {};
    let lambda = state.lambda || 0;
    let inAttack = state.inAttack || false;
    const peaks = [];
    samples.forEach((sample, i) => {
      const absSample = Math.abs(sample);
      if (absSample >= lambda) {
        inAttack = true;
        lambda += that._aa * (absSample - lambda);
      } else {
        if (inAttack) {
          const offsetSamples = frame.offsetSamples + i - 1;
          const offsetSeconds = frame.offsetSeconds + (
            (i - 1) / frame.sampleRate);
          peaks.push({
            energy: lambda,
            offsetSamples: offsetSamples,
            offsetSeconds: offsetSeconds,
          });
        }
        inAttack = false;
        lambda += that._ar * (absSample - lambda);
      }
    });
    return {
      peaks: peaks,
      state: {
        lambda: lambda,
        inAttack: inAttack,
      },
    }
  }
  run(frame, emitter) {
    const that = this;
    frame.allChannels.forEach((channel, channelIndex) => {
      const channelState = that._perChannelState[channelIndex];
      const perBandSamples = {
        global: channel.samples,
        bass: channel.filteredBands.bass.samples,
        mid: channel.filteredBands.mid.samples,
        high: channel.filteredBands.high.samples,
      }
      const perBandPeaks = {}
      _.forOwn(perBandSamples, (samples, bandName) => {
        const state = channelState[bandName];
        const result = that.detectPeaks(frame, samples, state);
        const peaks = result.peaks;
        channelState[bandName] = result.state;
        perBandPeaks[bandName] = peaks;
        if (peaks.length > 0) {
          peaks.forEach(peak => {
            emitter.emitDeferred('peak', Object.assign({
              bandName: bandName,
            }, peak));
          });
        }
      });
      channel.peaks = perBandPeaks.global;
      channel.filteredBands.bass.peaks = perBandPeaks.bass;
      channel.filteredBands.mid.peaks = perBandPeaks.mid;
      channel.filteredBands.high.peaks = perBandPeaks.high;
    });
  }
}

module.exports = {
  deps: ['filteredBands'],
  init: options => new PeakDetector(options)
}
