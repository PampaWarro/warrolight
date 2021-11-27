const { startServer } = require("./server");
const { loadSetup } = require("./setup");
const audioEmitter = require("./audioEmitter");
const {AudioInput, listDevices} = require("../../audio/input");
const _ = require('lodash');

const setupFile = process.argv[2] || "sample.json";
const setupPath = `../setups/${setupFile}`;

console.log(`Loading setup from ${setupPath}`)
const setup = require(setupPath);

const controller = loadSetup(setup);

// TODO: Development hack to reload programs module on restart
require('./hackProgramReloadOnRestart')(controller);

controller.start();

console.log('Available audio devices:\n', listDevices());

const audioInput = new AudioInput({deviceIndex: null,});
// audioInput.on('audioframe', audioEmitter.updateFrame.bind(audioEmitter));

const audioInput2 = new AudioInput({deviceIndex: 2,});
audioInput2.on('audioframe', (frame) => {
  audioEmitter.frame2 = frame;
});
audioInput2.start();

// Second audio input test
audioInput.on('audioframe', (frame) => {
  audioEmitter.currentFrame = {... frame, ... _.mapKeys(audioEmitter.frame2, (v,k) => 'mic2_'+k)};
  audioEmitter.ready = true;
  audioEmitter.emit('audioframe', frame);
});
audioInput.start();


startServer(controller);
