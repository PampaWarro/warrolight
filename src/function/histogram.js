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

    function getAverageVolume(array) {
      var values = 0;
      // get all the frequency amplitudes
      for (var i = 0; i < array.length; i++) {
        values += array[i];
      }
      return values / (array.length);
    }

    function frequenciesToColors(array) {
      let t = self.t;
      // get all the frequency amplitudes
      for (var i = 0; i < array.length; i++) {
        let val = (array[i]/256)*250;

        let amp = Math.round(Math.min(255, (val)*(i/32+0.25))) % 255;

        let pos = Math.floor(i/512*150) % 75;

        let {r, g, b} = Func.HSVtoRGB(t/150%1+amp/512, 1, Math.min(1,(Math.pow(amp/255, 1))));

        let ledIndex1 = (75+pos)%150;
        let ledIndex2 = (75-pos)%150;
        let [or, og, ob] = self.lastVolumeRGB[ledIndex1];
        r = or*0.90+r*0.1;
        g = og*0.90+g*0.1;
        b = ob*0.90+b*0.1;

        self.lastVolumeRGB[ledIndex1] = [r, g, b];
        self.lastVolume[ledIndex1] = Func.rgbToHex(r, g, b);
        self.lastVolume[ledIndex2] = Func.rgbToHex(r, g, b);
      }1
    }


    function onSuccess(stream) {
      self.stream = stream;
      var context = new webkitAudioContext();
      var mediaStreamSource = context.createMediaStreamSource(stream);

      var analyser = context.createAnalyser();
      analyser.smoothingTimeConstant = 0.3;
      analyser.fftSize = 512;

      var javascriptNode = context.createScriptProcessor(512, 1, 1);

      javascriptNode.onaudioprocess = function(e) {
        //var sample = e.inputBuffer.getChannelData(0);

        // get the average, bincount is fftsize / 2
        var array =  new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(array);

        // calculate average
        var average = getAverageVolume(array);
        frequenciesToColors(array);
        // print value out
        // console.log(average);
        self.averageVolume = average;
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
      for(let i=0;i<1;i++) {
        // this.lastVolume.shift();
        // this.lastVolume.push(Func.rgbToHex(Math.floor(this.averageVolume), Math.floor(this.averageVolume), Math.floor(this.averageVolume)));
      }
      draw(this.lastVolume)
    }, 1 / config.frequencyInHertz)
    done()
  }

  static rgbToHex(r, g, b) {
    function componentToHex(c) {
      var hex = Math.floor(c).toString(16);
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
    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255)
    };
  }

  stop() {
    this.stream.getTracks()[0].stop();
    clearInterval(this.interval)
  }
}

export const config = {
  frequencyInHertz: Number
}