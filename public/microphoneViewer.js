if (!window.socket) {
  window.socket = io();
}

class MicrophoneViewer extends React.Component {
  constructor() {
    super(...arguments);

    this.state = {
      micOn: true,
      connected: false
    };
  }

  _initializeState(state) {
    this.setState({
      connected: true
    });
  }

  _stateChange(state) {
    this.setState({
      selected: state.currentProgramName,
      currentConfig: state.currentConfig,
      remoteChange: true
    });
    console.log(state);
  }

  componentDidMount() {
    socket.on('micViewerReady', this._initializeState.bind(this));

    socket.on('micSample', samples => {
      _.each(samples, ({ level, max }) => this.plotEnergyHistogram(level, max));
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

  handleProgramClick(key, ev) {
    ev.preventDefault();
    this.setCurrentProgram(key);
  }

  plotEnergyHistogram(level, max) {
    let histogram = document.getElementById("music");

    let h = Math.round(level * 50);
    this.canvasCtx.fillStyle = `hsl(${Math.round((1 - h / 50 % 1 + 0) * 255)}, ${50}%, ${50}%)`;
    // this.canvasCtx.fillStyle = `#ff5500`;
    this.canvasCtx.fillRect(300, 50 - h, 2, h);
    // Move all left
    let imageData = this.canvasCtx.getImageData(2, 0, this.canvasCtx.canvas.width - 1, this.canvasCtx.canvas.height);
    this.canvasCtx.putImageData(imageData, 0, 0);
    // now clear the right-most pixels:
    this.canvasCtx.clearRect(this.canvasCtx.canvas.width - 2, 0, 2, this.canvasCtx.canvas.height);

    this.canvasCtx.fillStyle = 'white';
    this.canvasCtx.font = "12px monospace";
    this.canvasCtx.clearRect(this.canvasCtx.canvas.width - 100, 0, 100, this.canvasCtx.canvas.height);
    this.canvasCtx.fillText(`MAX Vol: ${Math.round(max * 100)}`, 310, 15);
    // this.canvasCtx.fillText(`    Vol: ${Math.round(this.averageVolume*100)}`, 310, 30);
    this.canvasCtx.fillText(`REL Vol: ${Math.round(level * 100)}`, 310, 45);
  }

  turnOn() {
    this.setState({ micOn: true });
    alert("No se duerme");
  }

  turnOff() {
    this.setState({ micOn: false });
  }

  render() {
    return React.createElement(
      'div',
      { className: 'mic-client' },
      React.createElement(
        'canvas',
        { id: 'music', width: '400', height: '50' },
        'a'
      )
    );
  }
}

//# sourceMappingURL=microphoneViewer.js.map