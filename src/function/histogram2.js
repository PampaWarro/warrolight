import {ColorUtils} from "../utils/ColorUtils";

export class Func {
  constructor(config) {
    const self = this;
    this.ledCount = config.numberOfLeds;
    this.lastVolume = new Array(this.ledCount+1).join('0').split('').map(() => "#000000");
    this.lastVolumeAmp = new Array(this.ledCount+1).join('0').split('').map(() => 0);
    this.lastVolumeInc = new Array(this.ledCount+1).join('0').split('').map(() => 0);
    this.lastVolumeSum = new Array(this.ledCount+1).join('0').split('').map(() => 0);
    this.lastVolumeCount = new Array(this.ledCount+1).join('0').split('').map(() => 0);

    if (navigator.getUserMedia) {
      navigator.getUserMedia({video: false, audio: true}, onSuccess, onError);
    } else if (navigator.webkitGetUserMedia) {
      navigator.webkitGetUserMedia({video: false, audio: true}, onSuccess, onError);
    }

    function frequenciesToColors(array) {
      // get all the frequency amplitudes
      for (let i = 0; i < self.ledCount; i++) {
        let pos = i;

        let val = (array[i%array.length] / 256);

        let lastVal = self.lastVolumeAmp[pos];
        self.lastVolumeAmp[pos] = val;

        self.lastVolumeInc[pos] +=  Math.max(0, val - lastVal);
        self.lastVolumeSum[pos] +=  val;
        self.lastVolumeCount[pos] +=  1;
      }
    }

    function onSuccess(stream) {
      self.stream = stream;
      const context = window.webkitAudioContext ? new webkitAudioContext() : new AudioContext();
      const mediaStreamSource = context.createMediaStreamSource(stream);

      const analyser = context.createAnalyser();
      analyser.smoothingTimeConstant = 0.0;
      analyser.fftSize = 2048;

      const javascriptNode = context.createScriptProcessor(analyser.fftSize/2, 1, 1);

      let lastAudioInfoTime = new Date();
      javascriptNode.onaudioprocess = function (e) {
        // get the average, bincount is fftsize / 2
        const array = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(array);

        frequenciesToColors(array);

        lastAudioInfoTime = new Date();
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
    this.interval = setInterval(() => {
      for(let i=0;i<this.ledCount;i++) {
        let inc = this.lastVolumeInc[i];
        let amp = this.lastVolumeSum[i] / this.lastVolumeCount[i]*config.intensityDim;
        if(inc < 0.3){
          inc = 0;
        }

        this.lastVolume[i] = ColorUtils.rgbToHex(... ColorUtils.HSVtoRGB((Math.min(1, amp)+config.colorOffset)%1, 1, Math.min(1, Math.pow(amp/2+inc/2, 1))));
        this.lastVolumeInc[i] = 0;
        this.lastVolumeCount[i] = 0;
        this.lastVolumeSum[i] = 0;
      }
      draw(this.lastVolume)
    }, 20)
    done()
  }

  stop() {
    this.stream.getTracks()[0].stop();
    clearInterval(this.interval)
  }
}

export const config = {
  frequencyInHertz: {type: Number, min: 1, max: 300, default: 70},
  colorOffset: {type: Number, min: 0, max: 1, step: 0.01, default: 0.3},
  intensityDim: {type: Number, min: 0, max: 3, step: 0.01, default: 1}
}