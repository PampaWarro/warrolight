if (!window.socket) {
  window.socket = io();
}

class MicrophoneViewer extends React.Component {
  constructor() {
    super(...arguments)

    this.state = {
      micOn: true,
      connected: false,
    }
  }

  _initializeState(state) {
    this.setState({
      connected: true,
    })
  }

  _stateChange(state) {
    this.setState({
      selected: state.currentProgramName,
      currentConfig: state.currentConfig,
      remoteChange: true
    })
    console.log(state)
  }

  componentDidMount() {
    socket.on('micViewerReady', this._initializeState.bind(this));

    socket.on('micSample', samples => {
      // _.each(samples, ({level, max}) => this.plotEnergyHistogram(level, max))
      _.each(samples, sample => this.plotPerBandHistogram(sample))
    });

    this.createHistogramCanvas()
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
    ev.preventDefault()
    this.setCurrentProgram(key)
  }

  plotEnergyHistogram(level, max) {
    let histogram = document.getElementById("music");

    let h = Math.round(level * 50);
    this.canvasCtx.fillStyle = `hsl(${Math.round((1 - h/50 % 1 + 0)*255)}, ${50}%, ${50}%)`;
    // this.canvasCtx.fillStyle = `#ff5500`;
    this.canvasCtx.fillRect(300, 50 - h, 2, h);
    // Move all left
    let imageData = this.canvasCtx.getImageData(2, 0, this.canvasCtx.canvas.width - 1, this.canvasCtx.canvas.height);
    this.canvasCtx.putImageData(imageData, 0, 0);
    // now clear the right-most pixels:
    this.canvasCtx.clearRect(this.canvasCtx.canvas.width - 2, 0, 2, this.canvasCtx.canvas.height);

    this.canvasCtx.fillStyle = 'white'
    this.canvasCtx.font = "12px monospace";
    this.canvasCtx.clearRect(this.canvasCtx.canvas.width - 100, 0, 100, this.canvasCtx.canvas.height);
    this.canvasCtx.fillText(`MAX Vol: ${Math.round(max*100)}`, 310, 15);
    // this.canvasCtx.fillText(`    Vol: ${Math.round(this.averageVolume*100)}`, 310, 30);
    this.canvasCtx.fillText(`REL Vol: ${Math.round(level*100)}`, 310, 45);
  }

  plotPerBandHistogram({bass, mid, high, onsetbass, onsetmid, onsethigh}) {
    let HEIGHT = this.canvasCtx.canvas.height / 3;
    let histogram = document.getElementById("music");
    let r = Math.round(bass)*2;
    let g = Math.round(mid)*2;
    let b = Math.round(high)*0.5;
    let max = 0;
    let level = Math.min(1, (r+g+b)/(3*255));

    let h = Math.round(level * HEIGHT);

    // let w = 6;
    // this.canvasCtx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    // this.canvasCtx.fillRect(300, HEIGHT - h, w, h);
    //
    let MIN = 30;
    let w = 1;
    this.canvasCtx.globalCompositeOperation = "screen";
    this.canvasCtx.fillStyle = `rgba(${Math.max(MIN,r)}, ${0}, ${0})`;
    h = Math.round((r/255) * HEIGHT);
    this.canvasCtx.fillRect(this.canvasCtx.canvas.width - 100, HEIGHT - h, w, h);
    if(onsetbass) {
      this.canvasCtx.fillStyle = `#fff`;
      this.canvasCtx.fillRect(this.canvasCtx.canvas.width - 100, HEIGHT, w, 5);
    }

    h = Math.round((g/255) * HEIGHT);
    this.canvasCtx.fillStyle = `rgba(${0}, ${Math.max(MIN,g)}, ${0})`;
    this.canvasCtx.fillRect(this.canvasCtx.canvas.width - 100, HEIGHT - h +HEIGHT, w, h);
    if(onsetmid) {
      this.canvasCtx.fillStyle = `#fff`;
      this.canvasCtx.fillRect(this.canvasCtx.canvas.width - 100, HEIGHT + HEIGHT, w, 5);
    }

    h = Math.round((b/255) * HEIGHT);
    this.canvasCtx.fillStyle = `rgba(${0}, ${0}, ${Math.max(MIN,b)})`;
    this.canvasCtx.fillRect(this.canvasCtx.canvas.width - 100, HEIGHT - h+HEIGHT*2, w, h);
    if(onsethigh) {
      this.canvasCtx.fillStyle = `#fff`;
      this.canvasCtx.fillRect(this.canvasCtx.canvas.width - 100, HEIGHT + HEIGHT*2-5, w, 5);
    }
    //
    this.canvasCtx.globalCompositeOperation = "source-over";

    // this.canvasCtx.fillStyle = `#ff5500`;
    // Move all left
    let imageData = this.canvasCtx.getImageData(w, 0, this.canvasCtx.canvas.width - 1, this.canvasCtx.canvas.height);
    this.canvasCtx.putImageData(imageData, 0, 0);
    // now clear the right-most pixels:
    this.canvasCtx.clearRect(this.canvasCtx.canvas.width - w, 0, w, this.canvasCtx.canvas.height);

    this.canvasCtx.fillStyle = 'white'
    this.canvasCtx.font = "12px monospace";
    this.canvasCtx.clearRect(this.canvasCtx.canvas.width - 100, 0, 100, this.canvasCtx.canvas.height);
    this.canvasCtx.fillText(`MAX Vol: ${Math.round(max*100)}`, this.canvasCtx.canvas.width - 90, 15);
    // this.canvasCtx.fillText(`    Vol: ${Math.round(this.averageVolume*100)}`, 310, 30);
    this.canvasCtx.fillText(`REL Vol: ${Math.round(level*100)}`, this.canvasCtx.canvas.width - 90, 45);
  }

  turnOn(){
    this.setState({micOn: true});
    alert("No se duerme")
  }

  turnOff(){
    this.setState({micOn: false})
  }

  render() {
    return <div className="mic-client">
      <canvas id="music" width="800" height="300">a</canvas>
    </div>
  }
}