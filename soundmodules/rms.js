// Easy measure of overall sound energy level. Basically, the area under the
// curve of the waveform, also equal to the level of the DC signal that would
// provide the same average power as the periodic signal
class RMS {
  rms(samples) {
    // sqrt(sum(sample^2)).
    return Math.sqrt(samples.reduce((a, x) => a + x*x, 0)/samples.length);
  }
  run(frame, emitter) {
    const that = this;
    frame.allChannels.forEach(channel => {
      channel.rms = that.rms(channel.samples);
    });
  }
}

module.exports = {
  init: options => new RMS(options)
}
