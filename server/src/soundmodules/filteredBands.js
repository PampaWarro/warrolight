const _ = require("lodash");
const Fili = require("fili");

// Configure a
class FilteredBands {
  constructor(config) {
    const iirCalculator = Fili.CalcCascades();
    this._filters = {
      bass: new Fili.IirFilter(
        iirCalculator.lowpass({
          order: 3,
          characteristic: "butterworth",
          Fs: config.sampleRate,
          Fc: config.frequencyBands.bassMidCrossover
        })
      ),
      mid: new Fili.IirFilter(
        iirCalculator.bandpass({
          order: 3,
          characteristic: "butterworth",
          Fs: config.sampleRate,
          Fc:
            config.frequencyBands.midHighCrossover -
            config.frequencyBands.bassMidCrossover
        })
      ),
      high: new Fili.IirFilter(
        iirCalculator.highpass({
          order: 3,
          characteristic: "butterworth",
          Fs: config.sampleRate,
          Fc: config.frequencyBands.midHighCrossover
        })
      )
    };
  }
  run(frame, emitter) {
    frame.allChannels.forEach(channel => {
      channel.filteredBands = {};
      _.forOwn(this._filters, (filter, bandName) => {
        const filteredSamples = filter.multiStep(channel.samples);
        channel.filteredBands[bandName] = {
          samples: filteredSamples
        };
      });
    });
  }
}

module.exports = {
  init: config => new FilteredBands(config)
};
