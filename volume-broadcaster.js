const mic = require('./mic/mic');
const fs = require('fs');
const FFT = require('fft.js');

const soundEmitter = require("./sound-broadcast")

// var outputFileStream = fs.WriteStream('output.raw');
// micInputStream.pipe(outputFileStream);

// micInputStream.pipe(process.stdout);

// micInputStream.on('data', function(data) {
//   // console.log(new Date() - start, "Recieved Input Stream: " + data.length, data.slice(0,10));
// });

function startMic(){
  let frameSize = 512;
  let micInstance = mic({ 'rate': 44100, 'channels': 1, 'bitwidth': 16,
    'frameSize': frameSize
  });
  let audioEmitter = micInstance.getAudioEmitter();
  let fft = new FFT(frameSize);

  audioEmitter.on('error', function(err) {
    console.log("Microphone Error in Input Stream: " + err);
  });

  let lastTest = new Date();

  // Calculate and emit RMS events.
  audioEmitter.on('audioframe', function(frame) {
    var rmsChannels = new Array(frame.channels.length);
    for (var i = 0; i < frame.channels.length; i++) {
      var channel = frame.channels[i];
      // sqrt(sum(buffer^2))
      rmsChannels[i] = Math.sqrt(channel.reduce((
        accumulator, value) => accumulator + (value*value), 0))
    }
    audioEmitter.emit('audiorms', {
      // center = sum(channels)
      center: rmsChannels.reduce((a, b) => a + b),
      channels: rmsChannels
    });
  });

  // Calculate and emit FFT.
  audioEmitter.on('audioframe', function(frame) {
    var fftChannels = new Array(frame.channels.length);
    for (var i = 0; i < frame.channels.length; i++) {
      const out = fftChannels[i] = fft.createComplexArray();
      fft.realTransform(out, frame.channels[i]);
    }
    audioEmitter.emit('audiofft', {
      channels: fftChannels,
      sampleRate: frame.sampleRate,
      frameSize: frame.frameSize
    });
  });

  // Calculate absolute FFT magnitude.
  audioEmitter.on('audiofft', function(frame) {
    var absoluteChannels = new Array(frame.channels.length);
    for (var i = 0; i < frame.channels.length; i++) {
      const channel = frame.channels[i];
      const absoluteChannel = absoluteChannels[i] = new Float32Array(
        channel.length);
      for (var bin = 0; bin < absoluteChannel.length / 2; bin++) {
        absoluteChannel[bin] = Math.sqrt(
          Math.pow(channel[bin * 2], 2) + Math.pow(channel[bin * 2 + 1], 2));
      }
    }
    audioEmitter.emit('audiofftabsolute', {
      channels: absoluteChannels,
      sampleRate: frame.sampleRate,
      frameSize: frame.frameSize
    });
  });

  // TODO: move audio utils to some file.
  function getFreqForFFTBin(bin, sampleRate, fftLength) {
    return bin * sampleRate / fftLength;
  }

  function getFFTBinForFreq(freq, sampleRate, fftLength) {
    return Math.floor(freq * fftLength / sampleRate);
  }

  frequencyBands = {
    bass: [10, 300],
    mid: [300, 1200],
    high: [1200, 20000]
  }

  // Process absolute FFT amplitudes and produce simple per-band energy.
  audioEmitter.on('audiofftabsolute', function(frame) {
    const bandEnergyChannels = new Array(frame.channels.length);
    for (var i = 0; i < frame.channels.length; i++) {
      const channel = frame.channels[i];
      const bandEnergyChannel = bandEnergyChannels[i] = {};
      for (const bandName in frequencyBands) {
        var minFreq, maxFreq;
        [minFreq, maxFreq] = frequencyBands[bandName];
        const minBin = getFFTBinForFreq(minFreq, frame.sampleRate,
          channel.length);
        const maxBin = getFFTBinForFreq(maxFreq, frame.sampleRate,
          channel.length);
        // sum(channel[minBin..maxBin]) / nbins
        bandEnergyChannel[bandName] = channel.slice(minBin, maxBin).reduce(
          (a, b) => a + b) / (maxBin - minBin + 1)
      }
    }
    const center = {};
    for (const bandName in frequencyBands) {
      // center[bandName] = sum(channel[bandName])
      center[bandName] = bandEnergyChannels.map(
        c => c[bandName]).reduce((a, b) => a + b);
    }
    audioEmitter.emit('audiobandenergy', {
      channels: bandEnergyChannels,
      center: center
    });
  });

  // TODO: make this a setting (per-band?).
  const onsetThreshold = 6;

  // Rough onset detector, applied to bands.
  var previousBands = null;
  audioEmitter.on('audiobandenergy', function(frame) {
    // TODO: support other channels, not only center.
    const bands = frame.center;
    if (previousBands != null) {
      const perBandOnsets = [];
      for (bandName in bands) {
        const oldValue = previousBands[bandName];
        if (oldValue == 0) {
          continue;
        }
        const newValue = bands[bandName];
        const ratio = newValue/oldValue;
        if (ratio > onsetThreshold) {
          perBandOnsets.push({
            bandName: bandName,
            energy: newValue,
            ratio: ratio
          });
        }
      }
      perBandOnsets.sort((a, b) => b.energy - a.energy);
      if (perBandOnsets.length > 0) {
        audioEmitter.emit('audiobandonset', {
          perBand: perBandOnsets,
          max: perBandOnsets[0]
        });
      }
    }
    previousBands = bands;
  });

  // Very rough onset detector. When ratio between current and previous RMS is
  // over threshold, that's an onset.
  var previousRms = null;
  audioEmitter.on('audiorms', function(rms) {
    if (previousRms != null && previousRms.center > 0) {
      const ratio = rms.center/previousRms.center;
      if (ratio > onsetThreshold) {
        audioEmitter.emit('audioonset', {
          energy: rms.center,
          ratio: ratio
        });
      }
    }
    previousRms = rms;
  });

  audioEmitter.on('audiobandonset', function(onset) {
    console.log(onset.max.bandName);
  });

  audioEmitter.on('startComplete', function() {
    console.log("Microphone listening");
  });

  audioEmitter.on('audioProcessExitComplete', function() {
    console.log("Microphone stopped listening. Retrying in 1s");
    setTimeout(startMic, 1000)
  });

  micInstance.start();
}

startMic();
