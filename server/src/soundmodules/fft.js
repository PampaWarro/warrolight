const FFT = require('fft.js');

// Computes the discrete Fourier transform (DFT) of the windowedSamples in each
// channel. The output is a complex array with interleaved real and imaginary
// parts. If the absolute energy per FFT bin is needed, take the output of the
// downstream 'absolutefft' module.
class FFTModule {
  constructor(config) {
    this._fft = new FFT(config.frameSize);
  }
  run(frame, emitter) {
    const that = this;
    frame.allChannels.forEach(channel => {
      const input = that._fft.toComplexArray(channel.windowedSamples);
      const out = that._fft.createComplexArray();
      that._fft.realTransform(out, input);
      channel.fft = out;
    });
  }
}

module.exports = {
  deps: ['window'],
  init: config => new FFTModule(config)
}
