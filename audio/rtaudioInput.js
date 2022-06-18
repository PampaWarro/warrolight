const EventEmitter = require("events");
const rtaudio = require("rtaudio");

function convertFrame(frame) {
  return {
    sampleRate: frame.sampleRate,
    samples: frame.samples,
    bassMax: frame.bass.normalizedPeak,
    bassAvg: frame.bass.normalizedRms,
    bassRms: frame.bass.normalizedRms,
    bassPeakDecay: frame.bass.normalizedPeakMid,
    bassFastPeakDecay: frame.bass.normalizedPeakFast,
    midMax: frame.mid.normalizedPeak,
    midAvg: frame.mid.normalizedRms,
    midRms: frame.mid.normalizedRms,
    midPeakDecay: frame.mid.normalizedPeakMid,
    midFastPeakDecay: frame.mid.normalizedPeakFast,
    highMax: frame.high.normalizedPeak,
    highAvg: frame.high.normalizedRms,
    highRms: frame.high.normalizedRms,
    highPeakDecay: frame.high.normalizedPeakMid,
    highFastPeakDecay: frame.high.normalizedPeakFast,
    fft: frame.fft,
    slowFft: frame.fft,
    highPeakDecayNoBass: Math.max(
      0,
      frame.high.normalizedPeakMid - frame.bass.normalizedPeakMid
    ),
    midPeakDecayNoBass: Math.max(
      0,
      frame.mid.normalizedPeakMid - frame.bass.normalizedPeakMid
    ),
    highRmsNoBass: Math.max(
      0,
      frame.high.normalizedRmsMid,
      -frame.bass.normalizedRmsMid
    ),
    midRmsNoBass: Math.max(
      0,
      frame.mid.normalizedRmsMid - frame.bass.normalizedRmsMid
    ),
    max: frame.normalizedPeak,
    rms: frame.normalizedRms,
    slowRms: frame.normalizedRmsMid,
    peakDecay: frame.normalizedPeakMid,
    fastPeakDecay: frame.normalizedPeakFast,
  };
}

class AudioInput extends EventEmitter {
  constructor(options) {
    super();
    this._sampleRate = options.sampleRate || 48000;
    this._deviceIndex = options.deviceIndex || undefined;
    this._running = false;
  }

  start() {
    if (this._running) {
      throw "Already running";
    }
    this._doStart();
  }

  stop() {
    if (this._rtaudioStream) {
      throw "Can't stop audio stream that never started";
    }
    this._running = false;
    if (this._retryTimeout) {
      clearTimeout(this._retryTimeout);
    }
    this._rtaudioStream.stop();
    this._rtaudioStream = null;
  }

  _doStart() {
    this._running = true;
    this._rtaudioStream = new rtaudio.InputStream({
      device: this._deviceIndex,
      sampleRate: this._sampleRate,
      callback: this._rtaudioStreamCallback.bind(this),
    });
    try {
      this._rtaudioStream.start();
    } catch (err) {
      console.error("rtaudio start error:", err);
      if (this._running) {
        this._attemptRetry();
      }
    }
  }

  _rtaudioStreamCallback(err, frame) {
    if (err) {
      console.error("rtaudio callback error:", err);
      if (this._running) {
        this._attemptRetry();
      }
      return;
    }
    this.emit("audioframe", convertFrame(frame));
  }

  _attemptRetry() {
    console.info("Retrying audio in 1s");
    if (this._retryTimeout) {
      clearTimeout(this._retryTimeout);
    }
    this._retryTimeout = setTimeout(this._doStart.bind(this), 1000);
  }
}

module.exports = {
  AudioInput,
  listDevices: rtaudio.getDevices,
};
