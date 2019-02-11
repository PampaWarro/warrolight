const _ = require('lodash');

function rectifiedNorm(a, b) {
  let sum = 0;
  a.forEach((value, i) => {
    const diff = b[i] - value;
    if (diff > 0) {
      sum += diff;
    }
  });
  return sum;
}

// Spectral flux is a measure of how quickly the power spectrum of a signal is
// changing, calculated by comparing the power spectrum for one frame against
// the power spectrum from the previous frame.
class SpectralFlux {
  constructor(config) {
  }
  run(frame, emitter) {
    if (!emitter.previousFrame) {
      return;  // Need a previous frame to compare with.
    }
    const that = this;
    frame.allChannels.forEach((channel, i) => {
      const previousChannel = emitter.previousFrame.allChannels[i];
      const previousSpectrum = previousChannel.absolutefft;
      const spectrum = channel.absolutefft;
      const spectralFlux = rectifiedNorm(previousSpectrum, spectrum);
      channel.spectralFlux = spectralFlux;
      _.forOwn(channel.spectralBands, (band, bandName) => {
        const previousSpectrum = previousChannel.spectralBands[
          bandName].subspectrum;
        const spectrum = band.subspectrum;
        const spectralFlux = rectifiedNorm(previousSpectrum, spectrum);
        band.spectralFlux = spectralFlux;
      });
    });
  }
}

module.exports = {
  deps: ['absolutefft', 'spectralBands'],
  init: config => new SpectralFlux(config),
}
