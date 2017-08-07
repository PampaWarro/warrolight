if (!window.socket) {
  window.socket = io();
}

// Used to prevent android from locking
var noSleep = new NoSleep();

class MicrophoneClient extends React.Component {
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
    socket.on('micClientReady', this._initializeState.bind(this));

    this.createHistogramCanvas()
    this.setupMicrophone()
    // socket.on('stateChange', this._stateChange.bind(this));
  }

  setupMicrophone(){
    let self = this;

    this.averageVolume = 0;
    this.averageRelativeVolume = 0;
    this.maxVolume = 0;

    if(window.singletonAudioStream) {
      createAnalyzer(window.singletonAudioStream)
    } else {
      function onSuccess(stream) {
        window.singletonAudioStream = stream;
        createAnalyzer(window.singletonAudioStream);
      }

      function onError(err) {
        alert('Error' + err.toString());
      }

      if (navigator.getUserMedia) {
        navigator.getUserMedia({video: false, audio: true}, onSuccess, onError);
      } else if (navigator.webkitGetUserMedia) {
        navigator.webkitGetUserMedia({video: false, audio: true}, onSuccess, onError);
      }
    }

    function getAverageVolume(array, from=0, to=null) {
      let values = 0;
      to = to || array.length;
      // get all the frequency amplitudes
      for (var i = from; i < to; i++) {
        values += array[i];
      }
      return values / (array.length * (to - from));
    }

    function createAnalyzer(stream) {
      self.stream = stream;

      if(!window.singletonAudioContext){
        console.log("Creating singleton audio context");
        window.singletonAudioContext = window.webkitAudioContext ? new webkitAudioContext() : new AudioContext();
      }

      self.audioContext = window.singletonAudioContext;
      self.mediaStreamSource = self.audioContext.createMediaStreamSource(stream);

      self.analyser = self.audioContext.createAnalyser();
      self.analyser.smoothingTimeConstant = 0.0;
      self.analyser.fftSize = 512;

      self.audioProcessorNode = self.audioContext.createScriptProcessor(self.analyser.frequencyBinCount, 1, 1);

      let lastTime = new Date();
      //self.audioProcessorNode.onaudioprocess = function(e) {
      self.processInterval = setTimeout(function computeSoundStats(){
        if(self.state.micOn) {
          //var sample = e.inputBuffer.getChannelData(0);

          // get the average, bincount is fftsize / 2
          var byteFrequencyData = new Uint8Array(self.analyser.frequencyBinCount);
          self.analyser.getByteFrequencyData(byteFrequencyData);

          // calculate average
          self.averageVolume = getAverageVolume(byteFrequencyData, 0, 64);

          if (self.state.micOn) {
            socket.emit('soundValue', self.averageVolume)
          }

          // Plot
          self.plotEnergyHistogram(self);

          // self.bassesAverageVolume = getAverageVolume(array, 32);
          self.maxVolume = Math.max(self.maxVolume, self.averageVolume);
          self.averageRelativeVolume = self.averageVolume / (self.maxVolume || 1)
        }
        // console.log("Last audio: " + (new Date() - lastTime) + "ms "+self.averageVolume)
        self.processInterval = setTimeout(computeSoundStats, 2);
        lastTime = new Date();

      }, 2);

      // stream -> mediaSource -> analyser -> javascriptNode -> destination
      self.mediaStreamSource.connect(self.analyser);
      self.analyser.connect(self.audioProcessorNode);
      self.audioProcessorNode.connect(self.audioContext.destination);
    }
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

  plotEnergyHistogram() {
    let histogram = document.getElementById("music");

    let h = Math.round(this.averageVolume / (this.maxVolume || 1) * 100);
    this.canvasCtx.fillStyle = `hsl(${Math.round((1 - h/100 % 1 + 0)*255)}, ${50}%, ${50}%)`;
    // this.canvasCtx.fillStyle = `#ff5500`;
    this.canvasCtx.fillRect(300, 100 - h, 2, h);
    // Move all left
    let imageData = this.canvasCtx.getImageData(2, 0, this.canvasCtx.canvas.width - 1, this.canvasCtx.canvas.height);
    this.canvasCtx.putImageData(imageData, 0, 0);
    // now clear the right-most pixels:
    this.canvasCtx.clearRect(this.canvasCtx.canvas.width - 2, 0, 2, this.canvasCtx.canvas.height);

    this.canvasCtx.fillStyle = 'white'
    this.canvasCtx.font = "12px monospace";
    this.canvasCtx.clearRect(this.canvasCtx.canvas.width - 100, 0, 100, this.canvasCtx.canvas.height);
    this.canvasCtx.fillText(`MAX Vol: ${Math.round(this.maxVolume*100)}`, 310, 15);
    this.canvasCtx.fillText(`    Vol: ${Math.round(this.averageVolume*100)}`, 310, 30);
    this.canvasCtx.fillText(`REL Vol: ${Math.round(this.averageRelativeVolume*100)}`, 310, 45);
  }

  turnOn(){
    this.setState({micOn: true});
    noSleep.enable();
    alert("No se duerme")
  }

  turnOff(){
    this.setState({micOn: false});
    noSleep.disable();
  }

  render() {
    let buttonAction = null;

    if (this.state.micOn) {
      buttonAction = <a href="#" onClick={e => this.turnOff()}>TURN MIC OFF</a>
    } else {
      buttonAction = <a href="#" onClick={e => this.turnOn()}>TURN MIC ON</a>
    }
    return <div className="mic-client">
      <div className="buttons">MIC CLIENT &nbsp; &nbsp; {this.state.connected} {buttonAction}
      </div>
      <canvas id="music" width="400" height="100">a</canvas>
    </div>
  }
}