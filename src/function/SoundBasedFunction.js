import {ColorUtils} from "../utils/ColorUtils";
import {TimeTickedFunction} from "./TimeTickedFunction";

export class SoundBasedFunction extends TimeTickedFunction{
  constructor(config, leds) {
    super(config, leds);
  }

  start(config, draw, done){
    this.averageVolume = 0;
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

    super.start(config, draw, done)
  }

  // To be overriden by subclasses that need this
  analyzeRawAudioData(data){

  }

  stop() {
    super.stop();
    this.mediaStreamSource.disconnect(self.audioProcessorNode);
    this.audioProcessorNode.disconnect(this.audioContext);
    clearInterval(this.processInterval)
  }

  // Override and extend config Schema
  static configSchema(){
    let config = super.configSchema();
    config.soundSamplingFreq = {type: Number, min: 1, max: 100, step: 1, default: 16};
    config.maxFreq = {type: Number, min: 1, max: 512, step: 1, default: 512};
    config.minFreq = {type: Number, min: 0, max: 512, step: 1, default: 0};
    return config;
  }
}