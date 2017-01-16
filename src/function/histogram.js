import {AbstractColorProgram} from "./AbstractColorProgram";

export class Func extends AbstractColorProgram {
  constructor(config) {
    super(config);
    this.ledCount = config.numberOfLeds;
    this.averageVolume = 0;
    this.lastVolume = new Array(this.ledCount+1).join('0').split('').map(() => "#000000");
    this.lastVolumeRGB = new Array(this.ledCount+1).join('0').split('').map(() => [0,0,0]);
    let self = this;
    this.t = 0;
    if(navigator.getUserMedia) {
      navigator.getUserMedia({video: false, audio: true}, onSuccess, onError);
    } else if(navigator.webkitGetUserMedia) {
      navigator.webkitGetUserMedia({video: false, audio: true}, onSuccess, onError);
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

    function onSuccess(stream) {
      self.stream = stream;
      var context = window.webkitAudioContext ? new webkitAudioContext() : new AudioContext();
      var mediaStreamSource = context.createMediaStreamSource(stream);

      var analyser = context.createAnalyser();
      analyser.smoothingTimeConstant = 0;
      analyser.fftSize = 512;

      var javascriptNode = context.createScriptProcessor(256, 1, 1);

      let lastTime = new Date();
      javascriptNode.onaudioprocess = function(e) {
        //var sample = e.inputBuffer.getChannelData(0);

        // get the average, bincount is fftsize / 2
        var array =  new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(array);

        // calculate average
        self.averageVolume = getAverageVolume(array);
        self.maxVolume = Math.max(self.maxVolume, self.averageVolume);
        // frequenciesToColors(array);
        // print value out
        // console.log(average);
        // console.log("Last audio: "+(new Date() - lastTime)+"ms")
        lastTime = new Date();
      };

      // stream -> mediaSource -> analyser -> javascriptNode -> destination
      mediaStreamSource.connect(analyser);
      analyser.connect(javascriptNode);
      javascriptNode.connect(context.destination);
    }

    function onError() {
      alert('Error');
    }
    this.interval = 0;
  }
  start(config, draw, done) {
    const speed = 1;
    this.interval = setInterval(() => {
      this.t += speed;

      let vol = this.maxVolume;
      this.maxVolume = 0;
      if(vol < 0.3){
        vol = vol/3;
      }
      // console.log(vol);
      let newVal = Func.rgbToHex(... Func.HSVtoRGB(vol*2+this.t/2000, 1, Math.pow(2, vol*50)/255));

      for(let i=0;i<speed;i++) {
        this.lastVolume.splice(Math.floor(this.ledCount/2-1), 2);
        this.lastVolume.unshift(newVal);
        this.lastVolume.push(newVal);
      }
      draw(this.lastVolume)
    }, 1 / config.frequencyInHertz * 500)
    done()
  }

  stop() {
    this.stream.getTracks()[0].stop();
    clearInterval(this.interval)
  }
}

export const config = {
  frequencyInHertz: Number
}