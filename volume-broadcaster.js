const mic = require('./mic');
const fs = require('fs');

const soundEmitter = require("./sound-broadcast")

// var outputFileStream = fs.WriteStream('output.raw');
// micInputStream.pipe(outputFileStream);

// micInputStream.pipe(process.stdout);

// micInputStream.on('data', function(data) {
//   // console.log(new Date() - start, "Recieved Input Stream: " + data.length, data.slice(0,10));
// });

function startMic(){
  let micInstance = mic({ 'rate': '2000', 'channels': '1', 'bitwidth': 16 });
  let micInputStream = micInstance.getAudioStream();

  micInputStream.on('error', function(err) {
    console.log("Microphone Error in Input Stream: " + err);
  });

  micInputStream.on('data', function(){})

  let lastTest = new Date();
  micInputStream.on('volumeSample', function(volume) {
    soundEmitter.emit('sound', volume)

    // let elapsed = new Date() - lastTest;
    // if(elapsed > 1000) {
    //   console.log(`${elapsed}ms VOLUME`, Math.round(volume * 100), new Array(Math.round(volume * 60) + 1).join('#'))
    //   lastTest = new Date();
    // }
  });

  micInputStream.on('startComplete', function() {
    console.log("Microphone listening");
  });

  micInputStream.on('audioProcessExitComplete', function() {
    console.log("Microphone stopped listening. Retrying in 1s");
    setTimeout(startMic, 1000)
  });

  micInstance.start();
}

startMic();