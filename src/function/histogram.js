import {ColorUtils} from "../utils/ColorUtils";
import {TimeTickedFunction} from "./TimeTickedFunction";

export class Func extends TimeTickedFunction{
  constructor(config) {
    super(config);

    this.ledCount = config.numberOfLeds;
    this.averageVolume = 0;
    this.lastVolume = new Array(this.ledCount+1).join('0').split('').map(() => "#000000");
    this.lastVolumeRGB = new Array(this.ledCount+1).join('0').split('').map(() => [0,0,0]);
    let self = this;
    this.t = 0;

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

      console.log("Creating audio context")
      if(!window.singletonAudioContext){
        window.singletonAudioContext = window.webkitAudioContext ? new webkitAudioContext() : new AudioContext();
      }
      self.audioContext = window.singletonAudioContext;

      self.mediaStreamSource = self.audioContext.createMediaStreamSource(stream);

      self.analyser = self.audioContext.createAnalyser();
      self.analyser.smoothingTimeConstant = 0.0;
      self.analyser.fftSize = 512;

      self.audioProcessorNode = self.audioContext.createScriptProcessor(self.analyser.frequencyBinCount, 1, 1);
      console.log("BUFFER: "+self.audioProcessorNode.bufferSize);

      let lastTime = new Date();
      //self.audioProcessorNode.onaudioprocess = function(e) {
      self.processInterval = setInterval(function(){
        //var sample = e.inputBuffer.getChannelData(0);

        // get the average, bincount is fftsize / 2
        var array =  new Uint8Array(self.analyser.frequencyBinCount);
        self.analyser.getByteFrequencyData(array);

        // calculate average
        self.averageVolume = getAverageVolume(array);
        self.maxVolume = Math.max(self.maxVolume, self.averageVolume);
        self.pushVolume();

        console.log("Last audio: " + (new Date() - lastTime) + "ms "+self.averageVolume)
        lastTime = new Date();
        //};
      }, 10);

        // stream -> mediaSource -> analyser -> javascriptNode -> destination
        self.mediaStreamSource.connect(self.analyser);
        self.analyser.connect(self.audioProcessorNode);
        self.audioProcessorNode.connect(self.audioContext.destination);
    }

    this.interval = 0;
  }

  // Override parent method
  drawFrame(config, draw, done){
    draw(this.lastVolume);
    done();
  }

  pushVolume(){
    const speed = 1;
    this.t += speed;

    let vol = this.averageVolume*this.config.intensityDim;
    // this.maxVolume = 0;
    // if(vol < 0.3){
    //   vol = vol/3;
    // }
    // console.log(vol);
    let newVal = ColorUtils.rgbToHex(... ColorUtils.HSVtoRGB(vol*2+this.t/2000, 1, Math.pow(2, vol*50)/255));
    // newVal = "22AA00";

    for(let i=0;i<speed;i++) {
      this.lastVolume.splice(Math.floor(this.ledCount/2-1), 2);
      this.lastVolume.unshift(newVal);
      this.lastVolume.push(newVal);
    }
  }

  stop() {
    super.stop();
    this.mediaStreamSource.disconnect(self.audioProcessorNode);
    this.audioProcessorNode.disconnect(this.audioContext);
    console.log("destroying otdo")
    clearInterval(this.processInterval)
  }
}

export const config = {
  frequencyInHertz: Number,
  intensityDim: {type: Number, min: 0, max: 3, step: 0.01, default: 1}
}