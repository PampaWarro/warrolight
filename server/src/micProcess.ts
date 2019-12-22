const portAudio = require("naudiodon");
const {SoundAnalyzer} = require("./soundAnalyzer");

if (!process.send) {
  throw 'micProcess only works as a child process';
}

class Mic {
  sampleRate: number;
  channels: number;
  deviceId: number;
  frameSize: number;
  bufferSize: number;
  debug: boolean;
  soundAnalyzer: any;
  audioInput: any;
  offsetSamples: number;
  lastAudioTime: number = null;

  constructor(options: any) {
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
    this.soundAnalyzer = options.soundAnalyzer;
    this.audioInput = null;
    this.offsetSamples = 0;
  }

  start() {
    let audioInput: any;
    if (this.audioInput === null) {
      try {
        audioInput = new portAudio.AudioIO({
          inOptions : {
            channelCount : this.channels,
            sampleFormat : portAudio.SampleFormat16Bit,
            sampleRate : this.sampleRate,
            deviceId : this.deviceId,
            highwaterMark : this.bufferSize,
          }
        });
        this.audioInput = audioInput;
      } catch (err) {
        console.log("Error opening audio. Check device id.");
        console.log(portAudio.getDevices());
        throw err;
      }

      audioInput.on("end",
                    () => { process.send([ "audioProcessExitComplete" ]); });

      audioInput.on("readable", () => {
        let data;
        let bufferCount = 0;
        while (data = audioInput.read(this.bufferSize)) {
          this._processRawAudioBuffer(data);
        }
        if (bufferCount > 1) {
          console.warn(`audio buffers accummulated: ${bufferCount}`);
        }
      });

      audioInput.on("error", (error: any) => {
                                 // console.error("audio input error:", error);
                             });
      audioInput.start();
      process.send([ "startComplete" ]);
    } else {
      if (this.debug) {
        console.error(
            "Duplicate calls to start(): Microphone already started!");
      }
    }
  }

  _processRawAudioBuffer(rawBuffer: any) {
    let now = Date.now();
    if (this.lastAudioTime) {
      let dt = now - this.lastAudioTime;
      // console.log(dt);
    }
    this.lastAudioTime = now;
    const intBuffer = new Int16Array(rawBuffer.buffer, rawBuffer.byteOffset,
                                     rawBuffer.length / 2);
    const samples = new Float32Array(intBuffer.length);
    for (let i = 0; i < samples.length; i++) {
      const s = intBuffer[i];
      samples[i] = s < 0 ? s / 0x8000 : s / 0x7fff;
    }

    // TODO: deinterleave channels for stereo support.
    const allChannels = [ {samples : samples} ];

    const frame = {
      center : allChannels[0],
      allChannels : allChannels,
      sampleRate : this.sampleRate,
      frameSize : samples.length,
      offsetSamples : this.offsetSamples,
      offsetSeconds : this.offsetSamples / this.sampleRate
    };
    // process.send(["audioframe", frame]);
    process.send(
        [ "processedaudioframe", this.soundAnalyzer.processAudioFrame(frame) ]);

    this.offsetSamples += samples.length;
  }

  stop() {
    if (this.audioInput != null) {
      this.audioInput.stop(() => {
        if (this.debug)
          console.log("Microphone stopped");
      });
      this.audioInput = null;
      process.send([ "stopComplete" ]);
    }
  }

  pause() {
    if (this.audioInput != null) {
      this.audioInput.pause();
      process.send([ "pauseComplete" ]);
      if (this.debug)
        console.log("Microphone paused");
    }
  }

  resume() {
    if (this.audioInput != null) {
      this.audioInput.resume();
      process.send([ "resumeComplete" ]);
      if (this.debug)
        console.log("Microphone resumed");
    }
  }
}

let micInstance: Mic = null;

function startMic() {
  if (micInstance) {
    throw new Error("mic already started!");
  }

  const frameSize = 512;
  const soundAnalyzer = new SoundAnalyzer({
    channels : 1,
    sampleRate : 44100,
    frameSize : frameSize,
    windowType : "hamming",
    frequencyBands : {
      bassCutoff : 10,
      bassMidCrossover : 300,
      midHighCrossover : 1200,
      highCutoff : 16000,
      bandNames : [ "bass", "mid", "high" ]
    }
  });

  micInstance = new Mic({
    rate : 44100,
    channels : 1,
    bitwidth : 16,
    frameSize : frameSize,
    soundAnalyzer : soundAnalyzer
  });

  micInstance.start();
}

startMic();
