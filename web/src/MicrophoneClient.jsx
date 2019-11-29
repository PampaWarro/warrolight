/*global socket*/
import React from "react";
import _ from "lodash";

// Used to prevent android from locking
var noSleep = new NoSleep();

export class MicrophoneClient extends React.Component {
  constructor(props) {
    super(props);

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

  componentDidMount() {
    socket.on("micClientReady", this._initializeState.bind(this));

    this.createHistogramCanvas();
    this.setupMicrophone();
  }

  setupMicrophone() {
    let self = this;

    this.averageVolume = 0;
    this.averageRelativeVolume = 0;
    this.maxVolume = 0;

    if (window.singletonAudioStream) {
      createAnalyzer(window.singletonAudioStream);
    } else {
      function onSuccess(stream) {
        window.singletonAudioStream = stream;
        createAnalyzer(window.singletonAudioStream);
      }

      function onError(err) {
        alert("Error" + err.toString());
      }

      let audioops = {
        mandatory: {
          googEchoCancellation: "false",
          googAutoGainControl: "false",
          googNoiseSuppression: "false",
          googHighpassFilter: "false"
        },
        optional: []
      };

      if (navigator.getUserMedia) {
        navigator.getUserMedia(
          {
            video: false,
            audio: audioops
          },
          onSuccess,
          onError
        );
      } else if (navigator.webkitGetUserMedia) {
        navigator.webkitGetUserMedia(
          { video: false, audio: true },
          onSuccess,
          onError
        );
      }
    }

    function getAverageVolume(array, from = 0, to = null) {
      let values = 0;
      to = to || array.length;
      // get all the frequency amplitudes
      for (var i = from; i < to; i++) {
        values += array[i]; //*array[i];
      }
      return values / (array.length * (to - from));
    }

    function createAudioMeter(audioContext) {
      var processor = audioContext.createScriptProcessor(512);
      processor.onaudioprocess = volumeAudioProcess;
      processor.volume = 0;

      // this will have no effect, since we don't copy the input to the output,
      // but works around a current Chrome bug.
      processor.connect(audioContext.destination);

      processor.shutdown = function() {
        this.disconnect();
        this.onaudioprocess = null;
      };

      return processor;
    }

    var lastVolumes = [];
    function volumeAudioProcess(event) {
      var buf = event.inputBuffer.getChannelData(0);
      var bufLength = buf.length;
      var sum = 0;
      var x;

      // Do a root-mean-square on the samples: sum up the squares...
      for (var i = 0; i < bufLength; i++) {
        x = buf[i];
        sum += x * x;
      }

      // ... then take the square root of the sum.
      var energy = Math.sqrt(sum / bufLength);

      // Now smooth this out with the averaging factor applied
      // to the previous sample - take the max here because we
      // want "fast attack, slow release."
      lastVolumes.push(energy);

      /*
      self.averageVolume = energy
      // self.bassesAverageVolume = getAverageVolume(array, 32);
      self.maxVolume = Math.max(self.maxVolume, self.averageVolume);
      self.averageRelativeVolume = Math.min(1, self.averageVolume / (self.maxVolume || 1))

      // Plot
      self.plotEnergyHistogram(self);
      */
    }

    const interval = 100;
    self.processRawInterval = setTimeout(function computeVolume() {
      if (self.state.micOn && socket.connected && lastVolumes.length) {
        // calculate average
        self.averageVolume =
          _.reduce(
            lastVolumes,
            function(memo, num) {
              return memo + num;
            },
            0
          ) / lastVolumes.length;
        lastVolumes = [];

        // Send integer sound value to reduce message byte size
        socket.emit("SV", Math.round(self.averageVolume * 10000));

        // Plot
        self.plotEnergyHistogram(self);

        // self.bassesAverageVolume = getAverageVolume(array, 32);
        self.maxVolume = Math.max(self.maxVolume, self.averageVolume);
        self.averageRelativeVolume = Math.min(
          1,
          self.averageVolume / (self.maxVolume || 1)
        );
      }
      self.processRawInterval = setTimeout(computeVolume, interval);
    }, interval);

    function createAnalyzer(stream) {
      self.stream = stream;

      if (!window.singletonAudioContext) {
        console.log("Creating singleton audio context");
        window.singletonAudioContext = window.webkitAudioContext
          ? new webkitAudioContext()
          : new AudioContext();
      }

      self.audioContext = window.singletonAudioContext;
      self.mediaStreamSource = self.audioContext.createMediaStreamSource(
        stream
      );

      self.mediaStreamSource.connect(createAudioMeter(self.audioContext));
      return;
      /*
      self.analyser = self.audioContext.createAnalyser();
      self.analyser.smoothingTimeConstant = 0.0;
      self.analyser.fftSize = 512;

      self.audioProcessorNode = self.audioContext.createScriptProcessor(self.analyser.frequencyBinCount, 1, 1);
      */

      let lastTime = new Date();
      //self.audioProcessorNode.onaudioprocess = function(e) {
      self.processInterval = setTimeout(function computeSoundStats() {
        if (self.state.micOn && socket.connected) {
          //var sample = e.inputBuffer.getChannelData(0);

          // get the average, bincount is fftsize / 2
          var byteFrequencyData = new Uint8Array(
            self.analyser.frequencyBinCount
          );
          self.analyser.getByteFrequencyData(byteFrequencyData);

          // calculate average
          self.averageVolume = getAverageVolume(byteFrequencyData, 0, null);

          // Send integer sound value to reduce message byte size
          socket.emit("SV", Math.round(self.averageVolume * 10000));

          // Plot
          self.plotEnergyHistogram(self);

          // self.bassesAverageVolume = getAverageVolume(array, 32);
          self.maxVolume = Math.max(self.maxVolume, self.averageVolume);
          self.averageRelativeVolume = Math.min(
            1,
            self.averageVolume / (self.maxVolume || 1)
          );
        }
        // console.log("Last audio: " + (new Date() - lastTime) + "ms "+self.averageVolume)
        self.processInterval = setTimeout(computeSoundStats, 25);
        lastTime = new Date();
      }, 25);

      // stream -> mediaSource -> analyser -> javascriptNode -> destination
      self.mediaStreamSource.connect(self.analyser);
      self.analyser.connect(self.audioProcessorNode);
      self.audioProcessorNode.connect(self.audioContext.destination);
    }
  }

  createHistogramCanvas() {
    let c = document.getElementById("music");
    this.canvasCtx = c.getContext("2d");
    this.canvasCtx.clearRect(
      0,
      0,
      this.canvasCtx.canvas.width,
      this.canvasCtx.canvas.height
    );
    this.frame = 0;
  }

  handleProgramClick(key, ev) {
    ev.preventDefault();
    this.setCurrentProgram(key);
  }

  plotEnergyHistogram() {
    let histogram = document.getElementById("music");

    let h = Math.round((this.averageVolume / (this.maxVolume || 1)) * 100);
    this.canvasCtx.fillStyle = `hsl(${Math.round(
      (1 - ((h / 100) % 1) + 0) * 255
    )}, ${50}%, ${50}%)`;
    // this.canvasCtx.fillStyle = `#ff5500`;
    this.canvasCtx.fillRect(300, 100 - h, 2, h);
    // Move all left
    let imageData = this.canvasCtx.getImageData(
      2,
      0,
      this.canvasCtx.canvas.width - 1,
      this.canvasCtx.canvas.height
    );
    this.canvasCtx.putImageData(imageData, 0, 0);
    // now clear the right-most pixels:
    this.canvasCtx.clearRect(
      this.canvasCtx.canvas.width - 2,
      0,
      2,
      this.canvasCtx.canvas.height
    );

    this.canvasCtx.fillStyle = "white";
    this.canvasCtx.font = "12px monospace";
    this.canvasCtx.clearRect(
      this.canvasCtx.canvas.width - 100,
      0,
      100,
      this.canvasCtx.canvas.height
    );
    this.canvasCtx.fillText(
      `MAX Vol: ${Math.round(this.maxVolume * 100)}`,
      310,
      15
    );
    this.canvasCtx.fillText(
      `    Vol: ${Math.round(this.averageVolume * 100)}`,
      310,
      30
    );
    this.canvasCtx.fillText(
      `REL Vol: ${Math.round(this.averageRelativeVolume * 100)}`,
      310,
      45
    );
  }

  turnOn() {
    this.setState({ micOn: true });
    noSleep.enable();
    alert("No se duerme");
  }

  turnOff() {
    this.setState({ micOn: false });
    this.maxVolume = 0.00001;
    noSleep.disable();
  }

  render() {
    let buttonAction = null;

    if (this.state.micOn) {
      buttonAction = (
        <a href="#" onClick={e => this.turnOff()}>
          TURN MIC OFF
        </a>
      );
    } else {
      buttonAction = (
        <a href="#" onClick={e => this.turnOn()}>
          TURN MIC ON
        </a>
      );
    }
    return (
      <div className="mic-client">
        <div className="buttons">
          MIC CLIENT &nbsp; &nbsp; {this.state.connected} {buttonAction}
        </div>
        <canvas id="music" width="400" height="100">
          a
        </canvas>
      </div>
    );
  }
}
