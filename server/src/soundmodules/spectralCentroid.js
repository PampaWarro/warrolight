const fftbins = require("./util/fftbins");

// The spectral centroid is a measure used in digital signal processing to
// characterise a spectrum. It indicates where the "center of mass" of the
// spectrum is located. Perceptually, it has a robust connection with the
// impression of "brightness" of a sound.
class SpectralCentroid {
  constructor(config) {}
  run(frame, emitter) {
    const that = this;
    frame.allChannels.forEach(channel => {
      let weightedSum = 0,
        totalWeight = 0;
      channel.absolutefft.forEach((value, bin) => {
        weightedSum += value * (bin + 0.5);
        totalWeight += value;
      });
      const bin = weightedSum / totalWeight;
      const freq = fftbins.getFreqForFFTBin(
        bin,
        frame.sampleRate,
        channel.absolutefft.length
      );
      channel.spectralCentroid = {
        bin: bin,
        freq: freq
      };
    });
  }
}

module.exports = {
  deps: ["absolutefft"],
  init: config => new SpectralCentroid(config)
};
