var spawn = require('child_process').spawn;
var isMac = require('os').type() == 'Darwin';
var isWindows = require('os').type().indexOf('Windows') > -1;
var osEndianness = require('os').endianness();
var MeasureVolume = require('./volumeTransform.js');
var PassThrough = require('stream').PassThrough;

var mic = function mic(options) {
  options = options || {};
  var that = {};
  var endian = osEndianness == "BE"? "big" : "little";
  var outputBitwidth = 32;
  var outputEncoding = 'floating-point';
  var outputRate = that._sampleRate = options.rate || 44100;
  var channels = that._channels = options.channels || 1;
  if (channels != 1) {
    // TODO: stereo support.
    throw Error('Only 1 channel supported.');
  }
  var device = options.device || 'plughw:1,0';
  var exitOnSilence = options.exitOnSilence || 0;
  var fileType = options.fileType || 'raw';
  var frameSize = options.frameSize || 512;
  var bufferSize = frameSize * channels * outputBitwidth / 8;
  var debug = options.debug || false;
  var format, formatEndian, formatEncoding;
  var audioProcess = null;
  var infoStream = new PassThrough;
  var soundEmitter = options.soundEmitter;
  var audioProcessOptions = {
    stdio: ['ignore', 'pipe', 'ignore']
  };

  if(debug) {
    audioProcessOptions.stdio[2] = 'pipe';
  }

  // Setup format variable for arecord call
  if(outputEncoding === 'unsigned-integer') {
    formatEncoding = 'U';
  } else {
    formatEncoding = 'S';
  }
  format = formatEncoding + outputBitwidth + '_' + osEndianness;

  that.start = function start() {
    if(audioProcess === null) {
      if(isWindows){
        var params = [
          // Parameters for input (-t wave audio)
          // '-b', '16',
          // '--endian', endian,
          '-c', channels,
          // '-r', '44100',
          // '-e', 'signed-integer',
          '-t' , 'waveaudio', 'default',

          // Parameters for output (- means pipe it)
          '-b', outputBitwidth,
          '--endian', endian,
          '-c', channels,
          '-r', outputRate,
          '-e', outputEncoding,
          '--buffer', bufferSize/8,
          '-t' , 'raw',
          '-'
        ];

        audioProcess = spawn('sox', params, audioProcessOptions)

        console.log(params.join(" "))
      }
      else if(isMac){
        let params = ['-b', outputBitwidth, '--endian', endian,
          '-c', channels, '-r', outputRate, '-e', outputEncoding,
          '-t', fileType, '--buffer', bufferSize, '-'];

        console.log("rec", params.join(' '))
        audioProcess = spawn('rec', params , audioProcessOptions)
      }
      else {
        // TODO: fix this branch, no idea about the args for this program.
        let params = ['-c', channels, '-r', outputRate, '-f',
          format, '-D', device, '-B', '100000'];

        console.log("arecord", params.join(' '))
        audioProcess = spawn('arecord', params, audioProcessOptions);
      }

      audioProcess.on('exit', function(code, sig) {
        if(code != null && sig === null) {
          soundEmitter.emit('audioProcessExitComplete');
          if(debug) console.log("recording audioProcess has exited with code = %d", code);
        }
      });
      audioProcess.stdout.on('readable', function() {
        let data;
        let bufferCount = 0;
        while (data = this.read(bufferSize)) {
          that._processRawAudioBuffer(data);
          bufferCount++;
        }
        // console.log('buffers accumulated:', bufferCount);
      });
      if(debug) {
        audioProcess.stderr.pipe(infoStream);
      }
      soundEmitter.emit('startComplete');
    } else {
      if(debug) {
        throw new Error("Duplicate calls to start(): Microphone already started!");
      }
    }
  };

  var offsetSamples = 0;
  that._processRawAudioBuffer = function(rawBuffer) {
    var samples = new Float32Array(rawBuffer.buffer, rawBuffer.byteOffset,
      rawBuffer.length / 4);

    // TODO: deinterleave channels for stereo support.
    const channels = [{
      samples: samples
    }];
    const center = channels[0];
    const allChannels = [center].concat(channels);

    soundEmitter.emit('audioframe', {
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
    if(audioProcess != null) {
      audioProcess.kill('SIGTERM');
      audioProcess = null;
      soundEmitter.emit('stopComplete');
      if(debug) console.log("Microhphone stopped");
    }
  };

  that.pause = function pause() {
    if(audioProcess != null) {
      audioProcess.kill('SIGSTOP');
      soundEmitter.pause();
      soundEmitter.emit('pauseComplete');
      if(debug) console.log("Microphone paused");
    }
  };

  that.resume = function resume() {
    if(audioProcess != null) {
      audioProcess.kill('SIGCONT');
      soundEmitter.resume();
      soundEmitter.emit('resumeComplete');
      if(debug) console.log("Microphone resumed");
    }
  }

  that.getSoundEmitter = function getSoundEmitter() {
    return soundEmitter;
  }

  if(debug) {
    infoStream.on('data', function(data) {
      console.log("Received Info: " + data);
    });
    infoStream.on('error', function(error) {
      console.log("Error in Info Stream: " + error);
    });
  }

  return that;
}

module.exports = mic;
