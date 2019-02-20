if (!window.socket) {
  window.socket = io();
}

class MicrophoneViewer extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      connected: false,
      sendingMicData: props.config.sendingMicData,
      metric: props.config.metric
    };
  }

  _initializeState(state) {
    this.setState({
      connected: true
    });
  }

  toggleMic() {
    if (this.props.config.sendingMicData) {
      socket.emit('setMicDataConfig', { sendingMicData: false });
    } else {
      socket.emit('setMicDataConfig', { sendingMicData: true });
    }
  }

  componentDidMount() {
    socket.on('micViewerReady', this._initializeState.bind(this));

    socket.on('micSample', samples => {
      // _.each(samples, ({level, max}) => this.plotEnergyHistogram(level, max))
      _.each(samples, sample => this.plotPerBandHistogram(sample));
    });

    this.createHistogramCanvas();
  }

  createHistogramCanvas() {
    let c = document.getElementById("music");
    this.canvasCtx = c.getContext("2d");
    this.canvasCtx.clearRect(0, 0, this.canvasCtx.canvas.width, this.canvasCtx.canvas.height);
    this.frame = 0;
  }

  componentWillUnmount() {
    //this.stopCurrent()
  }

  componentDidUpdate(oldProps, oldState) {
    if (oldState.func !== this.state.func) {
      //this.startCurrent()
    }
  }

  plotEnergyHistogram(level, max) {
    let histogram = document.getElementById("music");

    level = level / 100;
    let HEIGHT = this.canvasCtx.canvas.height;
    let h = Math.round(level * HEIGHT);
    this.canvasCtx.fillStyle = `hsl(${Math.round((1 - h / 50 % 1 + 0) * 255)}, ${50}%, ${50}%)`;
    // this.canvasCtx.fillStyle = `#ff5500`;
    this.canvasCtx.fillRect(this.canvasCtx.canvas.width - 100, 50 - h, 2, h);
    // Move all left
    let imageData = this.canvasCtx.getImageData(2, 0, this.canvasCtx.canvas.width - 1, this.canvasCtx.canvas.height);
    this.canvasCtx.putImageData(imageData, 0, 0);
    // now clear the right-most pixels:
    this.canvasCtx.clearRect(this.canvasCtx.canvas.width - 2, 0, 2, this.canvasCtx.canvas.height);

    this.canvasCtx.fillStyle = 'white';
    this.canvasCtx.font = "12px monospace";
    this.canvasCtx.clearRect(this.canvasCtx.canvas.width - 100, 0, 100, this.canvasCtx.canvas.height);
    this.canvasCtx.fillText(`MAX Vol: ${Math.round(max * 100)}`, this.canvasCtx.canvas.width - 90, 15);
    // this.canvasCtx.fillText(`    Vol: ${Math.round(this.averageVolume*100)}`, 310, 30);
    this.canvasCtx.fillText(`REL Vol: ${Math.round(level)}`, this.canvasCtx.canvas.width - 90, 45);
  }

  plotPerBandHistogram({ bass, mid, high, all }) {
    let histogram = document.getElementById("music");
    let r = Math.round(bass * 255);
    let g = Math.round(mid * 255);
    let b = Math.round(high * 255);
    let rms = Math.round(all * 255);
    let max = 0;
    let level = Math.min(1, (r + g + b) / (3 * 255));

    //
    let MIN = 30;
    let w = 2;
    let HEIGHT = this.canvasCtx.canvas.height / 3;
    let h;
    if (this.state.perBand) {
      this.canvasCtx.globalCompositeOperation = "screen";

      this.canvasCtx.fillStyle = `rgba(${Math.max(MIN, r)}, ${0}, ${0})`;
      h = Math.round(r / 255 * HEIGHT);
      this.canvasCtx.fillRect(this.canvasCtx.canvas.width - 100, HEIGHT - h, w, h);

      h = Math.round(g / 255 * HEIGHT);
      this.canvasCtx.fillStyle = `rgba(${0}, ${Math.max(MIN, g)}, ${0})`;
      this.canvasCtx.fillRect(this.canvasCtx.canvas.width - 100, HEIGHT - h + HEIGHT, w, h);

      h = Math.round(b / 255 * HEIGHT);
      this.canvasCtx.fillStyle = `rgba(${0}, ${0}, ${Math.max(MIN, b)})`;
      this.canvasCtx.fillRect(this.canvasCtx.canvas.width - 100, HEIGHT - h + HEIGHT * 2, w, h);

      this.canvasCtx.globalCompositeOperation = "source-over";
    } else {
      this.canvasCtx.fillStyle = `rgba(200,200,200)`;
      h = Math.round(rms / 255 * HEIGHT * 3);
      this.canvasCtx.fillRect(this.canvasCtx.canvas.width - 100, HEIGHT - h + HEIGHT * 2, w, h);
    }

    // this.canvasCtx.fillStyle = `#ff5500`;
    // Move all left
    let imageData = this.canvasCtx.getImageData(w, 0, this.canvasCtx.canvas.width - 1, this.canvasCtx.canvas.height);
    this.canvasCtx.putImageData(imageData, 0, 0);
    // now clear the right-most pixels:
    this.canvasCtx.clearRect(this.canvasCtx.canvas.width - w, 0, w, this.canvasCtx.canvas.height);

    this.canvasCtx.fillStyle = 'white';
    this.canvasCtx.font = "12px monospace";
    this.canvasCtx.clearRect(this.canvasCtx.canvas.width - 100, 0, 100, this.canvasCtx.canvas.height);
    this.canvasCtx.fillText(`MAX Vol: ${Math.round(max * 100)}`, this.canvasCtx.canvas.width - 90, 15);
    // this.canvasCtx.fillText(`    Vol: ${Math.round(this.averageVolume*100)}`, 310, 30);
    this.canvasCtx.fillText(`REL Vol: ${Math.round(level * 100)}`, this.canvasCtx.canvas.width - 90, 45);
  }

  toggleperBandMode(e) {
    this.setState({ perBand: !this.state.perBand });
    return false;
  }

  toggleMetric() {
    if (this.props.config.metric === 'Rms') {
      socket.emit('setMicDataConfig', { metric: 'FastPeakDecay' });
    } else if (this.props.config.metric === 'FastPeakDecay') {
      socket.emit('setMicDataConfig', { metric: 'PeakDecay' });
    } else {
      socket.emit('setMicDataConfig', { metric: 'Rms' });
    }
    return false;
  }

  render() {
    return React.createElement(
      'div',
      { className: 'mic-client' },
      React.createElement(
        'div',
        { className: 'perdband-btn' },
        React.createElement(
          'a',
          { href: 'javascript:void(0)', onClick: () => this.toggleMetric() },
          this.props.config.metric
        ),
        React.createElement('br', null),
        React.createElement(
          'a',
          { href: 'javascript:void(0)', onClick: e => this.toggleperBandMode(e) },
          this.state.perBand ? 'Global' : 'Per band'
        )
      ),
      React.createElement(
        'canvas',
        { id: 'music', width: '800', onClick: this.toggleMic.bind(this), height: '200', style: { opacity: this.props.config.sendingMicData ? '1' : '0.5' } },
        'a'
      ),
      this.props.config.sendingMicData ? null : React.createElement(
        'div',
        { className: 'preview-btn' },
        'Click to TURN ON / OFF server Mic input viz'
      )
    );
  }
}

//# sourceMappingURL=microphoneViewer.js.map