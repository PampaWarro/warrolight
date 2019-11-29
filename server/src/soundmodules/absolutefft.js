// Takes the interleaved complex values in each channel's FFT and output the
// norm of each in a new "absolutefft" buffer that's half the size of the input.
// Most downstream modules that only care about the amount of energy on each bin
// and can afford to ignore the phase information should use "absolutefft"
// instead of "fft".
class AbsoluteFFT {
  constructor(config) {}
  run(frame, emitter) {
    const that = this;
    frame.allChannels.forEach(channel => {
      const absolutefft = new Float32Array(channel.fft.length / 2);
      for (let bin = 0; bin < absolutefft.length / 2; bin++) {
        // Magnitude = sqrt(real^2 + imaginary^2)
        absolutefft[bin] = Math.sqrt(
          Math.pow(channel.fft[bin * 2], 2) +
            Math.pow(channel.fft[bin * 2 + 1], 2)
        );
      }
      channel.absolutefft = absolutefft;
    });
  }
}

module.exports = {
  deps: ["fft"],
  init: config => new AbsoluteFFT(config)
};
