const mic = require('./mic/mic');
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
  soundEmitter.init({
    sampleRate: 44100,
    frameSize: frameSize,
    windowType: 'hamming',
    frequencyBands: {
      bassCutoff: 10,
      bassMidCrossover: 300,
      midHighCrossover: 1200,
      highCutoff: 16000,
    },
  });

  soundEmitter.on('error', function(err) {
    console.log("Microphone Error in Input Stream: " + err);
  });

  let lastTest = new Date();

  // soundEmitter.on('audiobands', function(frame) {
  //   // console.log(
  //   //   frame.center.bass.energy.toFixed(3),
  //   //   frame.center.mid.energy.toFixed(3),
  //   //   frame.center.high.energy.toFixed(3),
  //   // );
  // });

  // // TODO: make this a setting (per-band?).
  // const onsetThreshold = 1.2;

  // // Rough onset detector, applied to spectral flux.
  // const previousBands = [null, null];
  // function isPeak(v0, v1, v2) {
  //   if (v0 <= 0) return false;
  //   if (v1 <= 0) return false;
  //   if (v2 <= 0) return false;
  //   return v1 >= v0 && v1 >= v2;
  // }
  // const perBandMovingAverage = {}
  // soundEmitter.on('audiospectralflux', function(frame) {
  //   // TODO: support other channels, not only center.
  //   const bands = frame.center.perBand;
  //   if (!previousBands[1]) {
  //     previousBands[1] = bands;
  //     return;
  //   }
  //   if (!previousBands[0]) {
  //     previousBands[0] = previousBands[1];
  //     previousBands[1] = bands;
  //   }
  //   // Log per band with fixed decimals:
  //   // console.log(bands.bass.toFixed(2),
  //   //   bands.mid.toFixed(2),
  //   //   bands.high.toFixed(2));
  //   const perBandOnsets = [];
  //   for (bandName in bands) {
  //     perBandMovingAverage[bandName] = (
  //       0.1*bands[bandName] + 0.9*(perBandMovingAverage[bandName] || 0));
  //     if (previousBands[1][bandName] <= perBandMovingAverage[bandName]) {
  //       continue;  // Skip frame with below average energy.
  //     }
  //     const values = [
  //       previousBands[0][bandName],
  //       previousBands[1][bandName],
  //       bands[bandName],
  //     ];
  //     if (isPeak(...values)) {
  //       perBandOnsets.push({
  //         bandName: bandName,
  //         energy: values[1],
  //       });
  //     }
  //   }
  //   perBandOnsets.sort((a, b) => b.energy - a.energy);
  //   if (perBandOnsets.length > 0) {
  //     soundEmitter.emit('audiobandonset', {
  //       perBand: perBandOnsets,
  //       max: perBandOnsets[0],
  //       offsetSamples: frame.offsetSamples,
  //       offsetSeconds: frame.offsetSeconds
  //     });
  //   }
  //   previousBands[0] = previousBands[1];
  //   previousBands[1] = bands;
  // });

  // // Band onsets filtered by exponential decay threshold.
  // const halfLife = .5;
  // const perBandPeaks = {};
  // soundEmitter.on('audiobandonset', function(frame) {
  //   var perBandFilteredOnsets = [];
  //   for (var i = 0; i < frame.perBand.length; i++) {
  //     const onset = frame.perBand[i];
  //     const peak = perBandPeaks[onset.bandName];
  //     if (peak) {
  //       const dt = frame.offsetSeconds - peak.offsetSeconds;
  //       const onsetValue = onset.energy;
  //       const peakValue = peak.value;
  //       const decayFactor = Math.pow(2, -dt/halfLife);
  //       if (onsetValue > peakValue * decayFactor) {
  //         perBandFilteredOnsets.push(onset);
  //         perBandPeaks[onset.bandName] = {
  //           value: onset.energy,
  //           offsetSeconds: frame.offsetSeconds
  //         };
  //       }
  //     } else {
  //       perBandPeaks[onset.bandName] = {
  //         value: onset.energy,
  //         offsetSeconds: frame.offsetSeconds
  //       };
  //     }
  //   }
  //   if (perBandFilteredOnsets.length > 0) {
  //     soundEmitter.emit('audiobandfilteredonset', {
  //       perBand: perBandFilteredOnsets,
  //       max: perBandFilteredOnsets[0],
  //       offsetSamples: frame.offsetSamples,
  //       offsetSeconds: frame.offsetSeconds
  //     });
  //   }
  // });

  // soundEmitter.on('audiobandfilteredonset', function(frame) {
  //   function replaceAt(s, i, c) {
  //     return s.substr(0, i) + c + s.substr(i+1);
  //   }
  //   var msg = new Array(30).join(' ');
  //   for (var i = 0; i < frame.perBand.length; i++) {
  //     const onset = frame.perBand[i];
  //     if (onset.bandName == 'bass') {
  //       msg = replaceAt(msg, 0, '*');
  //     } else if (onset.bandName == 'mid') {
  //       msg = replaceAt(msg, msg.length / 2, '*');
  //     } else if (onset.bandName == 'high') {
  //       msg = replaceAt(msg, msg.length - 1, '*');
  //     }
  //   }
  //   console.log(msg);
  // });


  // // Very rough onset detector. When ratio between current and previous RMS is
  // // over threshold, that's an onset.
  // var previousRms = null;
  // soundEmitter.on('audiorms', function(frame) {
  //   if (previousRms != null && previousRms.center > 0) {
  //     const ratio = frame.center/previousRms.center;
  //     if (ratio > onsetThreshold) {
  //       soundEmitter.emit('audioonset', {
  //         energy: frame.center,
  //         ratio: ratio,
  //         offsetSamples: frame.offsetSamples,
  //         offsetSeconds: frame.offsetSeconds
  //       });
  //     }
  //   }
  //   previousRms = frame;
  // });

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
