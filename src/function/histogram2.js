import {AbstractColorProgram} from "./AbstractColorProgram";

export class Func extends AbstractColorProgram {
  constructor() {
    super();
    const self = this;
    this.lastVolume = new Array(150+1).join('0').split('').map(() => "#000000");
    this.lastVolumeAmp = new Array(150+1).join('0').split('').map(() => 0);
    this.lastVolumeInc = new Array(150+1).join('0').split('').map(() => 0);
    this.lastVolumeSum = new Array(150+1).join('0').split('').map(() => 0);
    this.lastVolumeCount = new Array(150+1).join('0').split('').map(() => 0);

    if (navigator.getUserMedia) {
      navigator.getUserMedia({video: false, audio: true}, onSuccess, onError);
    } else if (navigator.webkitGetUserMedia) {
      navigator.webkitGetUserMedia({video: false, audio: true}, onSuccess, onError);
    }

    function frequenciesToColors(array) {
      // get all the frequency amplitudes
      for (let i = 0; i < 150; i++) {
        let pos = i;

        let val = (array[i] / 256);

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
      analyser.fftSize = 512;

      const javascriptNode = context.createScriptProcessor(256, 1, 1);

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
      for(let i=0;i<150;i++) {
        let inc = this.lastVolumeInc[i];
        let amp = this.lastVolumeSum[i] / this.lastVolumeCount[i];
        if(inc < 0.3){
          inc = 0;
        }

        this.lastVolume[i] = Func.rgbToHex(... Func.HSVtoRGB((Math.min(1, amp)+0.5)%1, 1, Math.min(1, Math.pow(amp/2+inc/2, 2))));
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
  frequencyInHertz: Number
}