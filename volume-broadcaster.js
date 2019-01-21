const mic = require('./mic/mic');
const fs = require('fs');

const soundEmitter = require("./sound-broadcast")

// var outputFileStream = fs.WriteStream('output.raw');
// micInputStream.pipe(outputFileStream);

// micInputStream.pipe(process.stdout);

// micInputStream.on('data', function(data) {
//   // console.log(new Date() - start, "Recieved Input Stream: " + data.length, data.slice(0,10));
// });

function startMic(){
  let micInstance = mic({ 'rate': 44100, 'channels': 1, 'bitwidth': 16 });
  let audioEmitter = micInstance.getAudioEmitter();

  audioEmitter.on('error', function(err) {
    console.log("Microphone Error in Input Stream: " + err);
  });

  audioEmitter.on('data', function(){})

  let lastTest = new Date();

  // Calculate and emit RMS events.
  audioEmitter.on('audioframe', function(frame) {
    var rmsChannels = new Array(frame.channels.length);
    for (var i = 0; i < frame.channels.length; i++) {
      var channel = frame.channels[i];
      rmsChannels[i] = Math.sqrt(channel.reduce(function(accumulator, value) {
        return accumulator + (value*value);
      }, 0))
    }
    audioEmitter.emit('audiorms', {
      max: Math.max(...rmsChannels),
      channels: rmsChannels
    });
  });

  // Very rough onset detector. When ratio between current RMS and moving
  // average is over threshold, that's an onset.
  var runningAverage = 0;
  audioEmitter.on('audiorms', function(rms) {
    rms = rms.max;
    if (runningAverage > 0) {
      var ratio = rms/runningAverage;
      if (ratio > 10) {
        console.log("onset!");
      }
    }
    runningAverage = .8 * runningAverage + .2 * rms;
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
