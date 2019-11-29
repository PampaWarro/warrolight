const spawn = require("child_process").spawn;
const isMac = require("os").type() == "Darwin";
const isWindows =
  require("os")
    .type()
    .indexOf("Windows") > -1;
const osEndianness = require("os").endianness();
const PassThrough = require("stream").PassThrough;
const portAudio = require("naudiodon");

// console.log(portAudio.getDevices());

const mic = function mic(options) {
  options = options || {};
  const that = {};
  const outputRate = (that._sampleRate = options.rate || 44100);
  const channels = (that._channels = options.channels || 1);
  if (channels != 1) {
    // TODO: stereo support.
    throw Error("Only 1 channel supported.");
  }
  const deviceId = options.deviceId || -1;
  const exitOnSilence = options.exitOnSilence || 0;
  const frameSize = options.frameSize || 512;
  const outputBitwidth = 16;
  const bufferSize = (frameSize * channels * outputBitwidth) / 8;
  const debug = options.debug || false;
  const soundEmitter = options.soundEmitter;
  let audioInput = null;

  that.start = function start() {
    if (audioInput === null) {
      try {
        audioInput = new portAudio.AudioIO({
          inOptions: {
            channelCount: channels,
            sampleFormat: portAudio.SampleFormat16Bit,
            sampleRate: 44100,
            deviceId: -1 // Use -1 or omit the deviceId to select the default device
          }
        });
      } catch (err) {
        console.log("Error opening audio. Check device id.");
        console.log(portAudio.getDevices());
        throw err;
      }

      audioInput.on("end", () => {
        soundEmitter.emit("audioProcessExitComplete");
      });
      audioInput.on("readable", function() {
        let data;
        let bufferCount = 0;
        while ((data = this.read(bufferSize))) {
          that._processRawAudioBuffer(data);
          bufferCount++;
        }
        // console.log('buffers accumulated:', bufferCount);
      });
      audioInput.on("error", error => {
        console.error("audio input error:", error);
      });
      audioInput.start();
      soundEmitter.emit("startComplete");
    } else {
      if (debug) {
        console.error(
          "Duplicate calls to start(): Microphone already started!"
        );
      }
    }
  };

  let offsetSamples = 0;
  that._processRawAudioBuffer = function(rawBuffer) {
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

    soundEmitter.emit("audioframe", {
      center: center,
      channels: channels,
      allChannels: allChannels,
      sampleRate: this._sampleRate,
      frameSize: samples.length,
      offsetSamples: offsetSamples,
      offsetSeconds: offsetSamples / this._sampleRate
    });

    offsetSamples += samples.length;
  };

  that.stop = function stop() {
    if (audioInput != null) {
      audioInput.stop(() => {
        if (debug) console.log("Microhphone stopped");
      });
      audioInput = null;
      soundEmitter.emit("stopComplete");
    }
  };

  that.pause = function pause() {
    if (audioInput != null) {
      audioInput.pause();
      soundEmitter.pause();
      soundEmitter.emit("pauseComplete");
      if (debug) console.log("Microphone paused");
    }
  };

  that.resume = function resume() {
    if (audioInput != null) {
      audioInput.resume();
      soundEmitter.resume();
      soundEmitter.emit("resumeComplete");
      if (debug) console.log("Microphone resumed");
    }
  };

  that.getSoundEmitter = function getSoundEmitter() {
    return soundEmitter;
  };

  return that;
};

module.exports = mic;
