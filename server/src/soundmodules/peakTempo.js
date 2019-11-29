const _ = require("lodash");

//
class PeakTempo {
  constructor(config) {
    this._windowSize = config.windowSize || 3;
    this._minDt = config.minDt || 0.01;
    this._perChannelState = [];
    this._minTempo = config.minTempo || 90;
    this._maxTempo = config.maxTempo || 220;
    for (let i = 0; i <= config.channels; i++) {
      this._perChannelState.push({});
    }
  }
  estimateTempo(peakWindow) {
    if (peakWindow.length == 0) {
      return [];
    }
    const that = this;
    var histogram = new Float32Array(this._maxTempo - this._minTempo + 1);
    for (var j = 1; j < peakWindow.length; j++) {
      const peakB = peakWindow[j];
      for (var i = 0; i < j; i++) {
        const peakA = peakWindow[i];
        const dt = peakB.offsetSeconds - peakA.offsetSeconds;
        if (dt < this._minDt) {
          continue;
        }
        const energy = peakA.energy * peakB.energy;
        var t2 = 60 / dt;
        var t2c = 0;
        while (t2 < this._maxTempo) {
          t2 *= 2;
          t2c += 1;
        }
        while (t2 >= this._minTempo) {
          if (t2 <= this._maxTempo) {
            const rt2 = Math.round(t2);
            const binWidthFactor = Math.sqrt(rt2 / this._maxTempo);
            histogram[rt2 - this._minTempo] +=
              (binWidthFactor * energy) / Math.pow(1.2, Math.abs(t2c));
          }
          t2 /= 2;
          t2c -= 1;
        }
      }
    }
    const estimates = [];
    histogram.forEach((energy, index) => {
      const tempo = index + that._minTempo;
      const range = histogram.slice(
        Math.max(index - 10, 0),
        Math.min(index + 10, histogram.length)
      );
      const avg = range.reduce((a, b) => a + b, 0) / range.length;
      if (avg == 0) {
        return;
      }
      const ratio = energy / avg;
      const max = Math.max(...range);
      if (energy == max) {
        estimates.push({
          bpm: tempo,
          value: ratio * Math.sqrt(energy)
        });
      }
    });
    estimates.sort((a, b) => b.value - a.value);
    estimates.forEach((estimate, index) => {
      estimate.value = estimates[0].value;
    });
    return estimates.slice(0, 3);
  }
  updateTempoEstimate(frame, peaks, state) {
    peaks = peaks.slice(); // make copy to reorder by offsetSeconds.
    peaks.sort((a, b) => a.offsetSeconds - b.offsetSeconds);
    const currentTime =
      peaks.length > 0
        ? peaks[peaks.length - 1].offsetSeconds
        : frame.offsetSeconds;
    const peakWindow = (state.peakWindow = state.peakWindow || []);
    while (
      peakWindow.length > 0 &&
      currentTime - peakWindow[0].offsetSeconds > this._windowSize
    ) {
      peakWindow.shift();
    }
    peakWindow.push(...peaks);
    const estimates = this.estimateTempo(peakWindow);
    return {
      state: state,
      estimates: estimates
    };
  }
  // TODO: remove _ to re-enable when it stops being a CPU hog.
  _run(frame, emitter) {
    const that = this;
    frame.allChannels.forEach((channel, channelIndex) => {
      const channelState = that._perChannelState[channelIndex];
      const perBandPeaks = {
        global: channel.peaks,
        bass: channel.filteredBands.bass.peaks,
        mid: channel.filteredBands.mid.peaks,
        high: channel.filteredBands.high.peaks
      };
      const allEstimates = [];
      const perBandPeakTempo = {};
      _.forOwn(perBandPeaks, (peaks, bandName) => {
        const state = channelState[bandName] || {};
        const result = that.updateTempoEstimate(frame, peaks, state);
        channelState[bandName] = result.state;
        perBandPeakTempo[bandName] = result.estimates;
        allEstimates.push(...result.estimates);
      });
      channel.bpm = that.pickBest(allEstimates);
      channel.bpmEstimates = perBandPeakTempo.global;
      channel.filteredBands.bass.bpmEstimates = perBandPeakTempo.bass;
      channel.filteredBands.mid.bpmEstimates = perBandPeakTempo.mid;
      channel.filteredBands.high.bpmEstimates = perBandPeakTempo.high;
    });
  }
  pickBest(estimates) {
    const sum = {};
    estimates.forEach(estimate => {
      sum[estimate.bpm] = (sum[estimate.bpm] || 0) + estimate.value;
    });
    var best;
    var max = 0;
    _.forOwn(sum, (value, bpm) => {
      if (value >= max) {
        max = value;
        best = bpm;
      }
    });
    return best && Number.parseFloat(best);
  }
}

module.exports = {
  deps: ["peakDetector"],
  init: options => new PeakTempo(options)
};
