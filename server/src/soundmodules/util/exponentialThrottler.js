class ExponentialThrottler {
  constructor(options) {
    this._emitter = options.emitter;
    this._eventName = options.eventName;
    this._filter = options.filter || (_ => true);
    this._getValue = options.getValue;
    this._minDt = options.minDt || 0;
    this._lastEvent = null;
  }
  onEvent(event) {
    if (!this._filter(event)) {
      return;
    }
    const t1 = event.offsetSeconds;
    const x1 = this._getValue(event);
    if (this._lastEvent != null) {
      const t0 = this._lastEvent.t;
      const x0 = this._lastEvent.x;
      const dt = t1 - t0;
      if (dt < this._minDt) {
        this._lastEvent.x = Math.max(x0, x1);
        return;
      }
      const decayFactor = Math.pow(2, -dt / this._halfLife);
      if (x1 < x0 * decayFactor) {
        return;
      }
    }
    this._emitter.emit(this._eventName, event);
    this._lastEvent = {
      t: t1,
      x: x1
    };
  }
}

module.exports = ExponentialThrottler;
