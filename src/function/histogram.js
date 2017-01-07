export class Func {
  constructor() {
    this.averageVolume = 0;
    this.lastVolume = new Array(150+1).join('0').split('').map(() => "#000000");
    this.lastVolumeRGB = new Array(150+1).join('0').split('').map(() => [0,0,0]);
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

    function frequenciesToColors(array) {
      let t = self.t;
      // get all the frequency amplitudes
      for (var i = 0; i < array.length; i++) {
        let val = (array[i]/256);

        let amp = val*0.5;
        if(amp < 0.2){
          amp = 0;
        }

        function hueFromAmp(v){
          if(v < 0.025)
            return 0;
          else
            return Math.min(1, v);
        }

        let pos = Math.floor(i/(array.length*2)*150) % 75;

        // Por tiempo
        let timeOffset = t/150%1*0;
        let [r, g, b] = Func.HSVtoRGB(amp*3%1, 1, Math.min(1,(Math.pow(amp, 2))));

        let ledIndex1 = (75+pos)%150;
        let ledIndex2 = (75-pos)%150;
        // let [or, og, ob] = self.lastVolumeRGB[ledIndex1];

        // let rate = 0.2;
        // r = or+r*rate;
        // g = og+g*rate;
        // b = ob+b*rate;

        self.lastVolumeRGB[ledIndex1] = [r, g, b];
        self.lastVolume[ledIndex1] = Func.rgbToHex(r, g, b);
        self.lastVolume[ledIndex2] = Func.rgbToHex(r, g, b);
      }
    }


    function onSuccess(stream) {
      self.stream = stream;
      var context = window.webkitAudioContext ? new webkitAudioContext() : new AudioContext();
      var mediaStreamSource = context.createMediaStreamSource(stream);

      var analyser = context.createAnalyser();
      analyser.smoothingTimeConstant = 0.1;
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
    this.interval = setInterval(() => {
      this.t += 1;

      let vol = this.maxVolume;
      this.maxVolume = 0;
      if(vol < 0.3){
        vol = vol/3;
      }
      // console.log(vol);
      let newVal = Func.rgbToHex(... Func.HSVtoRGB(vol*2+this.t/2000, 1, Math.pow(vol*1.3, 3)));

      for(let i=0;i<1;i++) {
        this.lastVolume.splice(74, 2);
        this.lastVolume.unshift(newVal);
        this.lastVolume.push(newVal);
      }
      draw(this.lastVolume)
    }, 5)
    done()
  }

  static rgbToHex(r, g, b) {
    function componentToHex(c) {
      var hex = Math.max(0, Math.min(255, Math.floor(c))).toString(16);
      return hex.length == 1 ? "0" + hex : hex;
    }

    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
  }

  static HSVtoRGB(h, s, v) {
    var r, g, b, i, f, p, q, t;
    if (arguments.length === 1) {
      s = h.s, v = h.v, h = h.h;
    }
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
      case 0: r = v, g = t, b = p; break;
      case 1: r = q, g = v, b = p; break;
      case 2: r = p, g = v, b = t; break;
      case 3: r = p, g = q, b = v; break;
      case 4: r = t, g = p, b = v; break;
      case 5: r = v, g = p, b = q; break;
    }
    return [
      Math.round(r * 255),
      Math.round(g * 255),
      Math.round(b * 255)
    ];
  }

  stop() {
    this.stream.getTracks()[0].stop();
    clearInterval(this.interval)
  }
}

export const config = {
  frequencyInHertz: Number
}