import {ColorUtils} from "../utils/ColorUtils";
import {TimeTickedFunction} from "./TimeTickedFunction";

export class SoundBasedFunction extends TimeTickedFunction{
  constructor(config, leds) {
    super(config, leds);
  }

  start(config, draw, done){
    this.averageVolume = 0;
    this.averageVolumeSmoothed = 0;
    this.averageVolumeSmoothedSlow = 0;
    this.medianVolume15 = _.map(_.range(15), () => 0)
    this.medianVolume = 0
    let self = this;

    if(window.singletonAudioStream){
      createAnalyzer(window.singletonAudioStream)
    } else {
      function onSuccess(stream) {
        window.singletonAudioStream = stream;
        createAnalyzer(window.singletonAudioStream);
      }

      function onError(err) {
        alert('Error'+err.toString());
      }

      if (navigator.getUserMedia) {
        navigator.getUserMedia({video: false, audio: true}, onSuccess, onError);
      } else if (navigator.webkitGetUserMedia) {
        navigator.webkitGetUserMedia({video: false, audio: true}, onSuccess, onError);
      }
    }

    this.maxVolume = 0;

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
      self.analyser.smoothingTimeConstant = 0.2;
      self.analyser.fftSize = 2048;

      self.audioProcessorNode = self.audioContext.createScriptProcessor(self.analyser.frequencyBinCount, 1, 1);

      let lastTime = new Date();
      //self.audioProcessorNode.onaudioprocess = function(e) {
      self.processInterval = setTimeout(function computeSoundStats(){
        //var sample = e.inputBuffer.getChannelData(0);

        // get the average, bincount is fftsize / 2
        var byteFrequencyData =  new Uint8Array(self.analyser.frequencyBinCount);
        self.analyser.getByteFrequencyData(byteFrequencyData);

        // calculate average
        self.averageVolume = getAverageVolume(byteFrequencyData, config.minFreq, config.maxFreq);
        self.averageVolumeSmoothed = (self.averageVolume+2*self.averageVolumeSmoothed)/3
        self.averageVolumeSmoothedSlow = (self.averageVolume+20*self.averageVolumeSmoothedSlow)/21

        // Plot
        self.plotEnergyHistogram(self);


        self.medianVolume15.push(self.averageVolume)
        self.medianVolume15 = self.medianVolume15.slice(1)
        self.medianVolume = _.sortBy(self.medianVolume15)[7]

        self.analyzeRawAudioData(byteFrequencyData)

        // self.bassesAverageVolume = getAverageVolume(array, 32);
        self.maxVolume = Math.max(self.maxVolume, self.averageVolume);

        // console.log("Last audio: " + (new Date() - lastTime) + "ms "+self.averageVolume)
        self.processInterval = setTimeout(computeSoundStats, config.soundSamplingFreq);
        lastTime = new Date();
      }, config.soundSamplingFreq);

      // stream -> mediaSource -> analyser -> javascriptNode -> destination
      self.mediaStreamSource.connect(self.analyser);
      self.analyser.connect(self.audioProcessorNode);
      self.audioProcessorNode.connect(self.audioContext.destination);
    }

    this.createHistogramCanvas();

    super.start(config, draw, done)
  }

  plotEnergyHistogram() {
    let histogram = document.getElementById("music");
    if(!this.config.showHistogram){
      if(histogram){
        histogram.parentNode.removeChild(histogram);
      }
      return;
    } else if(!histogram) {
      this.createHistogramCanvas();
    }

    let h = Math.round(this.averageVolume / (this.maxVolume || 1) * 100);
    let avgH = Math.round(this.averageVolumeSmoothedSlow / (this.maxVolume || 1) * 100);
    this.canvasCtx.fillStyle = ColorUtils.HSVtoHex((1 - h/150 % 1 + 0.7), .5, .5);
    this.canvasCtx.fillRect(800, 100 - h, 2, h);
    this.canvasCtx.fillStyle = "white";
    this.canvasCtx.fillRect(800, 100 - avgH, 2, 2);
    // Move all left
    let imageData = this.canvasCtx.getImageData(2, 0, this.canvasCtx.canvas.width - 1, this.canvasCtx.canvas.height);
    this.canvasCtx.putImageData(imageData, 0, 0);
    // now clear the right-most pixels:
    this.canvasCtx.clearRect(this.canvasCtx.canvas.width - 2, 0, 2, this.canvasCtx.canvas.height);

    this.canvasCtx.fillStyle = 'white'
    this.canvasCtx.font = "12px monospace";
    this.canvasCtx.clearRect(this.canvasCtx.canvas.width - 100, 0, 100, this.canvasCtx.canvas.height);
    this.canvasCtx.fillText(`MAX Vol: ${Math.round(this.maxVolume*100)}`, 810, 15);
    this.canvasCtx.fillText(`    Vol: ${Math.round(this.averageVolume*100)}`, 810, 30);
    this.canvasCtx.fillText(`AVG Vol: ${Math.round(this.averageVolumeSmoothedSlow*100)}`, 810, 45);
    this.canvasCtx.fillText(`MED Vol: ${Math.round(this.medianVolume*100)}`, 810, 60);
  }

  createHistogramCanvas() {
    if(!this.config.showHistogram){
      return;
    }

    let c = document.getElementById("music");
    if(!c) {
      var plot = document.createElement("div");
      plot.style = "position: fixed;bottom: 5px;right: 5px;border: solid 1px white;";
      plot.innerHTML += '<canvas id="music"></canvas>';
      document.getElementsByTagName('body')[0].appendChild(plot)

      c = document.getElementById("music");
      c.height = 100;
      c.width = 900;
    }

    this.canvasCtx = c.getContext("2d");
    this.canvasCtx.clearRect(0, 0, this.canvasCtx.canvas.width, this.canvasCtx.canvas.height);
    this.frame = 0;
  }

  // To be overriden by subclasses that need this
  analyzeRawAudioData(data){

  }

  stop() {
    super.stop();
    if(this.mediaStreamSource) {
      this.mediaStreamSource.disconnect(self.audioProcessorNode);
      this.audioProcessorNode.disconnect(this.audioContext);
    }
    clearInterval(this.processInterval)
  }

  // Override and extend config Schema
  static configSchema(){
    let config = super.configSchema();
    config.soundSamplingFreq = {type: Number, min: 1, max: 100, step: 1, default: 16};
    config.maxFreq = {type: Number, min: 1, max: 512, step: 1, default: 512};
    config.minFreq = {type: Number, min: 0, max: 512, step: 1, default: 0};
    config.showHistogram = {type: Boolean, default: false};
    return config;
  }
}