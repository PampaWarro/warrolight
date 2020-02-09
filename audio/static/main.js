(() => {
  class AudioRenderer {
    constructor(canvas) {
      this._canvas = canvas;
      const that = this;
      canvas.addEventListener('mousemove', (event) => {
        const rect = that._canvas.getBoundingClientRect();
        that.mouseCoordinates = {
          x : event.clientX - rect.left,
          y : event.clientY - rect.top,
        };
      });
      canvas.addEventListener('mouseout',
                              (event) => { that.mouseCoordinates = null; });
    }
    get canvas() { return this._canvas; }

    get audioFrame() { return this._audioFrame; }

    set audioFrame(value) {
      this._audioFrame = value;
      this.audioFrameUpdated();
      this.update();
    }

    get mouseCoordinates() { return this._mouseCoordinates; }

    set mouseCoordinates(value) {
      this._mouseCoordinates = value;
      this.update();
    }

    update() {
      if (this._pendingAnimationFrame != null) {
        window.cancelAnimationFrame(this._pendingAnimationFrame);
      }
      const that = this;
      this._pendingAnimationFrame = window.requestAnimationFrame(() => {
        that._pendingAnimationFrame = null;
        that.draw();
      });
    }

    audioFrameUpdated() {}
  }

  class SamplesRenderer extends AudioRenderer {
    constructor(canvas, getter) {
      super(canvas);
      this.getter = getter;
    }
    draw() {
      const ctx = this.canvas.getContext('2d');
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      if (this.audioFrame != null) {
        ctx.strokeStyle = "white";
        ctx.beginPath();
        ctx.moveTo(0, this.canvas.height / 2);
        const samples = this.getter(this.audioFrame);
        for (let i = 0; i < samples.length; i++) {
          const x = i * this.canvas.width / (samples.length - 1);
          const y = (this.canvas.height - this.canvas.height * samples[i]) / 2;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    }
  }

  class SpectrumRenderer extends AudioRenderer {
    constructor(canvas, getter) {
      super(canvas);
      this.logX = true;
      this.logY = true;
      this.getter = getter;
    }
    draw() {
      const ctx = this.canvas.getContext('2d');
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      const spectrum = this.getter(this.audioFrame);
      if (spectrum) {
        ctx.strokeStyle = "white";
        ctx.fillStyle = "navy";
        ctx.beginPath();
        ctx.moveTo(-1, this.canvas.height + 1);
        for (let i = 0; i < spectrum.length; i++) {
          const x = this.binToX(i, spectrum.length, this.canvas.width);
          const y = this.canvas.height * (1 - Math.log(spectrum[i] + 1) / 4);
          ctx.lineTo(x, y);
        }
        ctx.lineTo(this.canvas.width + 1, this.canvas.height + 1);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        if (this.mouseCoordinates != null) {
          ctx.strokeStyle = "white";
          ctx.fillStyle = "white";
          ctx.beginPath();
          const x = this.mouseCoordinates.x + 1;
          ctx.moveTo(x, 0);
          ctx.lineTo(x, this.canvas.height);
          ctx.font = '14px sans-serif';
          ctx.stroke();
          const bin = this.xToBin(x, spectrum.length, this.canvas.width);
          const freq =
              this.binToFreq(bin, spectrum.length, this.audioFrame.sampleRate);
          const binLabel = `bin=${Math.round(bin)}`;
          const binLabelWidth = ctx.measureText(binLabel).width;
          const freqLabel = `freq=${this.formatFreq(freq)}Hz`;
          const freqLabelWidth = ctx.measureText(freqLabel).width;
          const maxLabelWidth = Math.max(binLabelWidth, freqLabelWidth);
          const binLabelX = (x + 4 + maxLabelWidth < this.canvas.width)
                                ? x + 2
                                : x - binLabelWidth - 2;
          const freqLabelX = (x + 4 + maxLabelWidth < this.canvas.width)
                                 ? x + 2
                                 : x - freqLabelWidth - 2;
          ctx.fillText(binLabel, binLabelX, 16);
          ctx.fillText(freqLabel, freqLabelX, 32);
        }
      }
    }
    binToX(bin, bins, width) {
      const normalized = bin / (bins - 1);
      if (this.logX) {
        return width * Math.log2(normalized + 1);
      } else {
        return width * normalized;
      }
    }
    xToBin(x, bins, width) {
      let normalized = x / width;
      if (this.logX) {
        normalized = Math.pow(2, normalized) - 1;
      }
      return normalized * (bins - 1);
    }
    binToFreq(bin, bins, sampleRate) { return bin * sampleRate / (bins * 2); }
    formatFreq(freq) {
      if (freq >= 1000) {
        return (freq / 1000).toFixed(2) + 'k';
      }
      return freq.toFixed(2);
    }
  }

  class HistoryRenderer extends AudioRenderer {
    constructor(canvas, getter, length, min, max) {
      super(canvas);
      this.getter = getter;
      if (length == null) {
        length = 1000;
      }
      this.length = length;
      if (min == null) {
        min = 0;
      }
      this.min = min;
      if (max == null) {
        max = 1;
      }
      this.max = max;
      this.history = new Array(length).fill(0);
    }
    audioFrameUpdated() {
      this.history.shift();
      this.history.push(this.getter(this.audioFrame));
    }
    draw() {
      const ctx = this.canvas.getContext('2d');
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      ctx.strokeStyle = "white";
      ctx.beginPath();
      ctx.moveTo(0, this.canvas.height / 2);
      for (let i = 0; i < this.history.length; i++) {
        const x = i * this.canvas.width / (this.history.length - 1);
        const value = (this.max - this.min) * (this.history[i] - this.min);
        const y = this.canvas.height - this.canvas.height * value;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }

  const renderers = [];
  const socket = io();
  socket.on('connect', () => { console.log('connected'); });
  socket.on('disconnect', () => { console.log('disconnected'); });
  socket.on('audioframe', (frame) => {
    window.lastAudioFrame = frame;
    renderers.forEach((renderer) => { renderer.audioFrame = frame; });
  });

  function addVizCanvas(caption, width, height) {
    const div = document.createElement('div');
    div.classList.add('col-sm');
    div.classList.add('audio-viz');
    document.getElementById('visualizers').appendChild(div);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    div.appendChild(canvas);
    const p = document.createElement('p');
    p.innerText = caption;
    p.classList.add('title');
    div.appendChild(p);
    return canvas;
  }

  $(() => {
    renderers.push(new SamplesRenderer(addVizCanvas('samples', 600, 100),
                                       (frame) => { return frame.samples; }));
    renderers.push(new SpectrumRenderer(addVizCanvas('spectrum', 600, 100),
                                        (frame) => { return frame.slowFft; }));
    renderers.push(new HistoryRenderer(addVizCanvas('rms', 600, 100),
                                       (frame) => { return frame.rms; }, 300));
    renderers.push(
        new HistoryRenderer(addVizCanvas('max', 600, 100),
                            (frame) => { return frame.max; }, 300));
    renderers.push(
        new HistoryRenderer(addVizCanvas('bass', 600, 100),
                            (frame) => { return frame.bassFastPeakDecay; }, 300));
    renderers.push(
        new HistoryRenderer(addVizCanvas('mid', 600, 100),
                            (frame) => { return frame.midFastPeakDecay; }, 300));
    renderers.push(
        new HistoryRenderer(addVizCanvas('high', 600, 100),
                            (frame) => { return frame.highFastPeakDecay; }, 300));
  });
})();
