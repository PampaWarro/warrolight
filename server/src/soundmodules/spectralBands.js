const _ = require("lodash");
const fftbins = require("./util/fftbins");

// Split the absolute fft spectrum in bass/mid/high bands and calculate the
// total energy in each (sum of all absolute fft bins in that band). Also
// outputs the subspectrum just in case it's useful for something.
class SpectralBands {
  constructor(config) {
    this._bands = {
      bass: {
        freqs: [
          config.frequencyBands.bassCutoff,
          config.frequencyBands.bassMidCrossover
        ]
      },
      mid: {
        freqs: [
          config.frequencyBands.bassMidCrossover,
          config.frequencyBands.midHighCrossover
        ]
      },
      high: {
        freqs: [
          config.frequencyBands.midHighCrossover,
          config.frequencyBands.highCutoff
        ]
      }
    };
    _.forOwn(this._bands, (band, name) => {
      const minBin = Math.ceil(
        fftbins.getFFTBinForFreq(
          band.freqs[0],
          config.sampleRate,
          config.frameSize * 2
        )
      );
      const maxBin = Math.floor(
        fftbins.getFFTBinForFreq(
          band.freqs[1],
          config.sampleRate,
          config.frameSize * 2
        )
      );
      band.bins = [Math.max(0, minBin), Math.min(config.frameSize - 1, maxBin)];
    });
  }
  run(frame, emitter) {
    const that = this;
    frame.allChannels.forEach(channel => {
      channel.spectralBands = {};
      _.forOwn(that._bands, (bandConfig, bandName) => {
        const subspectrum = channel.absolutefft.slice(
          bandConfig.bins[0],
          bandConfig.bins[1]
        );
        const energy = subspectrum.reduce((a, v) => a + v, 0);
        channel.spectralBands[bandName] = Object.assign(
          {
            subspectrum: subspectrum,
            energy: energy
          },
          bandConfig
        );
      });
    });
  }
}

module.exports = {
  deps: ["absolutefft"],
  init: config => new SpectralBands(config)
};
