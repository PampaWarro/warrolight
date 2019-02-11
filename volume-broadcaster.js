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
    channels: 1,
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
