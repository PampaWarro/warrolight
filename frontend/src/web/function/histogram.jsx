export class Func {
    constructor() {
        this.averageVolume = 0;
        this.lastVolume = new Array(150+1).join('0').split('').map(() => "#000000");
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
                let ampsq = Math.min(255, (val)*(i/32));
                let b = Math.round(Math.min(255, Math.sin(val/5))) % 255;
                ampsq = Math.round(Math.sqrt(ampsq/255)*150) % 255;
                let pos = Math.floor(i/512*150) % 75;
                self.lastVolume[(75+pos+t)%150] = Func.rgbToHex(amp, 0, 0);
                self.lastVolume[(75-pos+t)%150] = Func.rgbToHex(amp, 0, 0);
            }
        }


        function onSuccess(stream) {
            self.stream = stream;
            var context = new webkitAudioContext();
            var mediaStreamSource = context.createMediaStreamSource(stream);

            var analyser = context.createAnalyser();
            analyser.smoothingTimeConstant = 0.8;
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
            var hex = c.toString(16);
            return hex.length == 1 ? "0" + hex : hex;
        }

        return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
    }

    stop() {
        this.stream.getTracks()[0].stop();
        clearInterval(this.interval)
    }
}

export const config = {
    frequencyInHertz: Number
}