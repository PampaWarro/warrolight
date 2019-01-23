const mic = require('./mic/mic');
const FFT = require('fft.js');

const soundEmitter = require("./sound-broadcast")

// const fs = require('fs');
// var outputFileStream = fs.WriteStream('output.raw');
// micInputStream.pipe(outputFileStream);

// micInputStream.pipe(process.stdout);

// micInputStream.on('data', function(data) {
//   // console.log(new Date() - start, "Recieved Input Stream: " + data.length, data.slice(0,10));
// });

function startMic(){
  let frameSize = 512;
  let micInstance = mic({
    rate: 44100,
    channels: 1,
    bitwidth: 16,
    frameSize: frameSize,
    soundEmitter: soundEmitter
  });
  let fft = new FFT(frameSize);

  soundEmitter.on('error', function(err) {
    console.log("Microphone Error in Input Stream: " + err);
  });

  let lastTest = new Date();

  // TODO: move this to a shared lib.
  const rms = function rms(values) {
    return Math.sqrt(values.reduce(
      (accumulator, value) => accumulator + (value*value), 0) / values.length);
  };

  // Calculate and emit RMS events.
  soundEmitter.on('audioframe', function(frame) {
    var rmsChannels = new Array(frame.channels.length);
    for (var i = 0; i < frame.channels.length; i++) {
      var channel = frame.channels[i];
      // sqrt(sum(buffer^2))
      rmsChannels[i] = rms(channel);
    }
    soundEmitter.emit('audiorms', {
      // center = sqrt(sum(channels^2))
      center: Math.sqrt(rmsChannels.reduce((a, b) => a + b*b), 0),
      channels: rmsChannels,
      sampleRate: frame.sampleRate,
      frameSize: frame.frameSize,
      offsetSamples: frame.offsetSamples,
      offsetSeconds: frame.offsetSeconds
    });
  });

  // Apply windowing to audio frames.
  function cosineSumWindow(a0, N) {
    // https://en.wikipedia.org/wiki/Window_function#Hann_and_Hamming_windows
    const w = new Float32Array(N);
    for (var i = 0; i < N; i++) {
      w[i] = a0 - (1 - a0) * Math.cos(2 * Math.PI * i / (N - 1));
    }
    return w;
  }
  // a0=25/46 == Hamming window.
  const precalcWindow = cosineSumWindow(25/46, frameSize);
  soundEmitter.on('audioframe', function(frame) {
    function applyWindow(channel) {
      const windowed = new Float32Array(channel.length);
      channel.forEach(function(value, i) {
        windowed[i] = precalcWindow[i] * value;
      });
      return windowed;
    }
    soundEmitter.emit('audiowindowedframe', {
      center: applyWindow(frame.center),
      channels: frame.channels.map(applyWindow),
      sampleRate: frame.sampleRate,
      frameSize: frame.frameSize,
      offsetSamples: frame.offsetSamples,
      offsetSeconds: frame.offsetSeconds
    });
  });

  // Calculate and emit FFT.
  soundEmitter.on('audiowindowedframe', function(frame) {
    var fftChannels = new Array(frame.channels.length);
    for (var i = 0; i < frame.channels.length; i++) {
      const out = fftChannels[i] = fft.createComplexArray();
      fft.realTransform(out, frame.channels[i]);
    }
    soundEmitter.emit('audiofft', {
      channels: fftChannels,
      sampleRate: frame.sampleRate,
      frameSize: frame.frameSize,
      offsetSamples: frame.offsetSamples,
      offsetSeconds: frame.offsetSeconds
    });
  });

  // Calculate absolute FFT magnitude.
  soundEmitter.on('audiofft', function(frame) {
    const absoluteChannels = new Array(frame.channels.length);
    for (var i = 0; i < frame.channels.length; i++) {
      const channel = frame.channels[i];
      const absoluteChannel = absoluteChannels[i] = new Float32Array(
        channel.length);
      for (var bin = 0; bin < absoluteChannel.length / 2; bin++) {
        // Magintude = sqrt(real^2 + imaginary^2)
        absoluteChannel[bin] = Math.sqrt(
          Math.pow(channel[bin * 2], 2) + Math.pow(channel[bin * 2 + 1], 2));
      }
    }
    const center = new Float32Array(absoluteChannels[0].length);
    for (var i = 0; i < center.length; i++) {
      center[i] = Math.sqrt(
        absoluteChannels.map(channel => Math.pow(channel[i], 2)).reduce(
        (accumulator, value) => accumulator + value, 0));
    }
    soundEmitter.emit('audiofftabsolute', {
      channels: absoluteChannels,
      center: center,
      sampleRate: frame.sampleRate,
      frameSize: frame.frameSize,
      offsetSamples: frame.offsetSamples,
      offsetSeconds: frame.offsetSeconds
    });
  });

  // TODO: move audio utils to some file.
  function getFreqForFFTBin(bin, sampleRate, fftLength) {
    return bin * sampleRate / fftLength;
  }

  function getFFTBinForFreq(freq, sampleRate, fftLength) {
    return Math.floor(freq * fftLength / sampleRate);
  }

  // Process absolute FFT amplitudes and produce spectral centroid.
  soundEmitter.on('audiofftabsolute', function(frame) {
    const centroid = function centroid(channel) {
      var weightedSum = 0, totalWeight = 0;
      channel.forEach(function(value, bin) {
        weightedSum += value * (bin + 0.5);
        totalWeight += value;
      });
      const bin = weightedSum / totalWeight;
      const freq = getFreqForFFTBin(bin, frame.sampleRate, channel.length);
      return {
        bin: bin,
        freq: freq
      };
    }
    soundEmitter.emit('audiospectralcentroid', {
      channels: frame.channels.map(centroid),
      center: centroid(frame.center),
      offsetSamples: frame.offsetSamples,
      offsetSeconds: frame.offsetSeconds
    });
  });
  soundEmitter.on('audiospectralcentroid', function(frame) {
    //console.log(frame.center.bin);
  });

  frequencyBands = {
    bass: [10, 300],
    mid: [300, 1200],
    high: [1200, 20000]
  }

  // Process absolute FFT amplitudes and produce simple per-band energy.
  soundEmitter.on('audiofftabsolute', function(frame) {
    const bandChannels = new Array(frame.channels.length);
    for (var i = 0; i < frame.channels.length; i++) {
      const channel = frame.channels[i];
      const bandEnergyChannel = bandChannels[i] = {};
      for (const bandName in frequencyBands) {
        var minFreq, maxFreq;
        [minFreq, maxFreq] = frequencyBands[bandName];
        const minBin = getFFTBinForFreq(minFreq, frame.sampleRate,
          channel.length);
        const maxBin = getFFTBinForFreq(maxFreq, frame.sampleRate,
          channel.length);
        const subspectrum = channel.slice(minBin, maxBin);
        bandEnergyChannel[bandName] = {
          energy: rms(subspectrum),
          minBin: minBin,
          maxBin: maxBin,
          subspectrum: subspectrum
        };
      }
    }
    const center = {};
    for (const bandName in frequencyBands) {
      // center[bandName] = sqrt(sum(channel[bandName]^2))
      center[bandName] = {
        energy: Math.sqrt(bandChannels.map(
          c => c[bandName].energy).reduce((a, b) => a + b*b, 0)),
        minBin: bandChannels[0][bandName].minBin,
        maxBin: bandChannels[0][bandName].maxBin,
        // TODO: proper calculation for this in stereo.
        subspectrum: bandChannels[0][bandName].subspectrum
      };
    }
    soundEmitter.emit('audiobands', {
      inputAbsoluteFFTFrame: frame,
      channels: bandChannels,
      center: center,
      offsetSamples: frame.offsetSamples,
      offsetSeconds: frame.offsetSeconds
    });
  });

  soundEmitter.on('audiobands', function(frame) {
    // console.log(
    //   frame.center.bass.energy.toFixed(3),
    //   frame.center.mid.energy.toFixed(3),
    //   frame.center.high.energy.toFixed(3),
    // );
  });

  // TODO: make this a setting (per-band?).
  const onsetThreshold = 1.2;

  // Calculate spectral flux.
  var lastAudioBands = null;
  soundEmitter.on('audiobands', function(frame) {
    function normalize(s) {
      const n = new Float32Array(s.length);
      const norm = s.reduce((a, b) => a + b, 0);
      s.forEach(function(value, i) {
        n[i] = value / norm;
      });
      return n;
    }
    function rectifiedNorm(a, b) {
      var sum = 0;
      a.forEach(function(value, i) {
        const diff = b[i] - value;
        if (diff > 0) {
          sum += diff;
        }
      });
      return sum;
    }
    function spectralFlux(s1, s2) {
      return rectifiedNorm(s1, s2);
    }
    if (lastAudioBands != null) {
      // TODO: implement stereo support.
      const center = {
        perBand: {},
        global: spectralFlux(
          lastAudioBands.inputAbsoluteFFTFrame.center,
          frame.inputAbsoluteFFTFrame.center)

      };
      for (const bandName in frame.center) {
        const band = frame.center[bandName];
        center.perBand[bandName] = spectralFlux(
          lastAudioBands.center[bandName].subspectrum,
          frame.center[bandName].subspectrum);
      }

      soundEmitter.emit('audiospectralflux', {
        center: center,
        offsetSamples: frame.offsetSamples,
        offsetSeconds: frame.offsetSeconds
      });
    }
    lastAudioBands = frame;
  });

  // Rough onset detector, applied to spectral flux.
  const previousBands = [null, null];
  function isPeak(v0, v1, v2) {
    if (v0 <= 0) return false;
    if (v1 <= 0) return false;
    if (v2 <= 0) return false;
    return v1 >= v0 && v1 >= v2;
  }
  const perBandMovingAverage = {}
  soundEmitter.on('audiospectralflux', function(frame) {
    // TODO: support other channels, not only center.
    const bands = frame.center.perBand;
    if (!previousBands[1]) {
      previousBands[1] = bands;
      return;
    }
    if (!previousBands[0]) {
      previousBands[0] = previousBands[1];
      previousBands[1] = bands;
    }
    // Log per band with fixed decimals:
    // console.log(bands.bass.toFixed(2),
    //   bands.mid.toFixed(2),
    //   bands.high.toFixed(2));
    const perBandOnsets = [];
    for (bandName in bands) {
      perBandMovingAverage[bandName] = (
        0.1*bands[bandName] + 0.9*(perBandMovingAverage[bandName] || 0));
      if (previousBands[1][bandName] <= perBandMovingAverage[bandName]) {
        continue;  // Skip frame with below average energy.
      }
      const values = [
        previousBands[0][bandName],
        previousBands[1][bandName],
        bands[bandName],
      ];
      if (isPeak(...values)) {
        perBandOnsets.push({
          bandName: bandName,
          energy: values[1],
        });
      }
    }
    perBandOnsets.sort((a, b) => b.energy - a.energy);
    if (perBandOnsets.length > 0) {
      soundEmitter.emit('audiobandonset', {
        perBand: perBandOnsets,
        max: perBandOnsets[0],
        offsetSamples: frame.offsetSamples,
        offsetSeconds: frame.offsetSeconds
      });
    }
    previousBands[0] = previousBands[1];
    previousBands[1] = bands;
  });

  // Band onsets filtered by exponential decay threshold.
  const halfLife = .5;
  const perBandPeaks = {};
  soundEmitter.on('audiobandonset', function(frame) {
    var perBandFilteredOnsets = [];
    for (var i = 0; i < frame.perBand.length; i++) {
      const onset = frame.perBand[i];
      const peak = perBandPeaks[onset.bandName];
      if (peak) {
        const dt = frame.offsetSeconds - peak.offsetSeconds;
        const onsetValue = onset.energy;
        const peakValue = peak.value;
        const decayFactor = Math.pow(2, -dt/halfLife);
        if (onsetValue > peakValue * decayFactor) {
          perBandFilteredOnsets.push(onset);
          perBandPeaks[onset.bandName] = {
            value: onset.energy,
            offsetSeconds: frame.offsetSeconds
          };
        }
      } else {
        perBandPeaks[onset.bandName] = {
          value: onset.energy,
          offsetSeconds: frame.offsetSeconds
        };
      }
    }
    if (perBandFilteredOnsets.length > 0) {
      soundEmitter.emit('audiobandfilteredonset', {
        perBand: perBandFilteredOnsets,
        max: perBandFilteredOnsets[0],
        offsetSamples: frame.offsetSamples,
        offsetSeconds: frame.offsetSeconds
      });
    }
  });

  soundEmitter.on('audiobandfilteredonset', function(frame) {
    function replaceAt(s, i, c) {
      return s.substr(0, i) + c + s.substr(i+1);
    }
    var msg = new Array(30).join(' ');
    for (var i = 0; i < frame.perBand.length; i++) {
      const onset = frame.perBand[i];
      if (onset.bandName == 'bass') {
        msg = replaceAt(msg, 0, '*');
      } else if (onset.bandName == 'mid') {
        msg = replaceAt(msg, msg.length / 2, '*');
      } else if (onset.bandName == 'high') {
        msg = replaceAt(msg, msg.length - 1, '*');
      }
    }
    console.log(msg);
  });


  // Very rough onset detector. When ratio between current and previous RMS is
  // over threshold, that's an onset.
  var previousRms = null;
  soundEmitter.on('audiorms', function(frame) {
    if (previousRms != null && previousRms.center > 0) {
      const ratio = frame.center/previousRms.center;
      if (ratio > onsetThreshold) {
        soundEmitter.emit('audioonset', {
          energy: frame.center,
          ratio: ratio,
          offsetSamples: frame.offsetSamples,
          offsetSeconds: frame.offsetSeconds
        });
      }
    }
    previousRms = frame;
  });

  soundEmitter.on('startComplete', function() {
    console.log("Microphone listening");
  });

  soundEmitter.on('audioProcessExitComplete', function() {
    console.log("Microphone stopped listening. Retrying in 1s");
    setTimeout(startMic, 1000)
  });

  micInstance.start();
}

startMic();
