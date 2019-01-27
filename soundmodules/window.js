function cosineSumWindow(a0, N) {
  // https://en.wikipedia.org/wiki/Window_function#Hann_and_Hamming_windows
  const w = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    w[i] = a0 - (1 - a0) * Math.cos(2 * Math.PI * i / (N - 1));
  }
  return w;
}

const WINDOW_BUILDERS = {
  // a0=25/46 == Hamming window.
  hamming: config => cosineSumWindow(25/46, config.frameSize),
}

// Applies a window function to the raw audio in the "samples" buffer and puts
// the result in the new "windowedSamples" property. It's recommended to run the
// FFT on the windowed samples to reduce spectral leakage.
class Window {
  constructor(config) {
    this._window = WINDOW_BUILDERS[config.windowType](config);
  }

  run(frame, emitter) {
    const that = this;
    frame.allChannels.forEach(channel => {
      const windowed = new Float32Array(channel.samples.length);
      channel.samples.forEach((value, i) => {
        windowed[i] = that._window[i] * value;
      });
      channel.windowedSamples = windowed;
    });
  }
}

module.exports = {
  deps: [],
  init: config => new Window(config),
}
