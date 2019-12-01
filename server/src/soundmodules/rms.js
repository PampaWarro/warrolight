const _ = require("lodash");

// Easy measure of overall sound energy level. Basically, the area under the
// curve of the waveform, also equal to the level of the DC signal that would
// provide the same average power as the periodic signal
class RMS {
  rms(samples) {
    // sqrt(sum(sample^2)).
    return Math.sqrt(samples.reduce((a, x) => a + x * x, 0) / samples.length);
  }
  run(frame, emitter) {
    frame.allChannels.forEach(channel => {
      channel.rms = this.rms(channel.samples);
      _.forOwn(channel.filteredBands, band => {
        band.rms = this.rms(band.samples);
      });
    });
  }
}

module.exports = {
  deps: ["filteredBands"],
  init: options => new RMS(options)
};
