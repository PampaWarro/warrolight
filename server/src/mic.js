const _ = require('lodash');
const mic = require('./mic/mic');
const soundEmitter = require("./soundEmitter")

function startMic() {
  let frameSize = 512;
  let micInstance = mic({
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
    windowType: 'hamming',
    frequencyBands: {
      bassCutoff: 10,
      bassMidCrossover: 300,
      midHighCrossover: 1200,
      highCutoff: 16000,
      bandNames: ['bass', 'mid', 'high'],
    },
  });

  soundEmitter.on('error', function(err) {
    console.log("Microphone Error in Input Stream: " + err);
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

exports.startMic = startMic
