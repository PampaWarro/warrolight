const FFT = require("fft.js");

// Computes the discrete Fourier transform (DFT) of the windowedSamples in each
// channel. The output is a complex array with interleaved real and imaginary
// parts. If the absolute energy per FFT bin is needed, take the output of the
// downstream 'absolutefft' module.
class AbsoluteFFTModule {
  constructor(config) {
    this._fft = new FFT(config.frameSize);
  }
  run(frame, emitter) {
    frame.allChannels.forEach(channel => {
      const input = this._fft.toComplexArray(channel.windowedSamples);
      const out = new Array(this._fft.size)
      this._fft.realTransform(out, input);
      channel.absolutefft = out;
    });
  }
}

module.exports = {
  deps: ["window"],
  init: config => new AbsoluteFFTModule(config)
};
