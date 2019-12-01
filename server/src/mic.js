const portAudio = require("naudiodon");
const soundEmitter = require("./soundEmitter");

class Mic {
  constructor(options) {
    this.sampleRate = options.rate || 44100;
    this.channels = options.channels || 1;
    if (this.channels != 1) {
      // TODO: stereo support.
      throw Error("Only 1 channel supported.");
    }
    this.deviceId = options.deviceId || -1;
    this.frameSize = options.frameSize || 512;
    const outputBitwidth = 16;
    this.bufferSize = (this.frameSize * this.channels * outputBitwidth) / 8;
    this.debug = options.debug || false;
    this.soundEmitter = options.soundEmitter;
    this.audioInput = null;
    this.offsetSamples = 0;
  }

  start() {
    let audioInput;
    if (this.audioInput === null) {
      try {
        audioInput = new portAudio.AudioIO({
          inOptions: {
            channelCount: this.channels,
            sampleFormat: portAudio.SampleFormat16Bit,
            sampleRate: this.sampleRate,
            deviceId: this.deviceId
          }
        });
        this.audioInput = audioInput;
      } catch (err) {
        console.log("Error opening audio. Check device id.");
        console.log(portAudio.getDevices());
        throw err;
      }

      audioInput.on("end", () => {
        soundEmitter.emit("audioProcessExitComplete");
      });

      audioInput.on("readable", () => {
        let data;
        while ((data = audioInput.read(this.bufferSize))) {
          this._processRawAudioBuffer(data);
        }
      });

      audioInput.on("error", error => {
        console.error("audio input error:", error);
      });
      audioInput.start();
      soundEmitter.emit("startComplete");
    } else {
      if (this.debug) {
        console.error(
          "Duplicate calls to start(): Microphone already started!"
        );
      }
    }
  }

  _processRawAudioBuffer(rawBuffer) {
    const intBuffer = new Int16Array(
      rawBuffer.buffer,
      rawBuffer.byteOffset,
      rawBuffer.length / 2
    );
    const samples = new Float32Array(intBuffer.length);
    for (let i = 0; i < samples.length; i++) {
      const s = intBuffer[i];
      samples[i] = s < 0 ? s / 0x8000 : s / 0x7fff;
    }

    // TODO: deinterleave channels for stereo support.
    const channels = [
      {
        samples: samples
      }
    ];
    const center = channels[0];
    const allChannels = [center].concat(channels);

    this.soundEmitter.emit("audioframe", {
      center: center,
      channels: channels,
      allChannels: allChannels,
      sampleRate: this.sampleRate,
      frameSize: samples.length,
      offsetSamples: this.offsetSamples,
      offsetSeconds: this.offsetSamples / this.sampleRate
    });

    this.offsetSamples += samples.length;
  }

  stop() {
    if (this.audioInput != null) {
      this.audioInput.stop(() => {
        if (this.debug) console.log("Microphone stopped");
      });
      this.audioInput = null;
      this.soundEmitter.emit("stopComplete");
    }
  }

  pause() {
    if (this.audioInput != null) {
      this.audioInput.pause();
      this.soundEmitter.pause();
      this.soundEmitter.emit("pauseComplete");
      if (this.debug) console.log("Microphone paused");
    }
  }

  resume() {
    if (this.audioInput != null) {
      this.audioInput.resume();
      this.soundEmitter.resume();
      this.soundEmitter.emit("resumeComplete");
      if (this.debug) console.log("Microphone resumed");
    }
  }
}

let micInstance = null;

function startMic() {
  if (micInstance) {
    throw new Error("mic already started!");
  }

  let frameSize = 512;

  micInstance = new Mic({
    rate: 44100,
    channels: 1,
    bitwidth: 16,
    frameSize: frameSize,
    soundEmitter: soundEmitter
  });

  soundEmitter.init({
    channels: 1,
    sampleRate: 44100,
    frameSize: frameSize,
    windowType: "hamming",
    frequencyBands: {
      bassCutoff: 10,
      bassMidCrossover: 300,
      midHighCrossover: 1200,
      highCutoff: 16000,
      bandNames: ["bass", "mid", "high"]
    }
  });

  soundEmitter.on("error", function(err) {
    console.log("Microphone Error in Input Stream: " + err);
  });

  soundEmitter.on("startComplete", function() {
    console.log("Microphone listening");
  });

  soundEmitter.on("audioProcessExitComplete", function() {
    micInstance = null;
    console.log("Microphone stopped listening. Retrying in 1s");
    setTimeout(startMic, 1000);
  });

  micInstance.start();
}

exports.startMic = startMic;
