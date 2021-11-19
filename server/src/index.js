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
controller.start();

console.log('Available audio devices:\n', listDevices());

const audioInput = new AudioInput({deviceIndex: null,});
const audioInput2 = new AudioInput({deviceIndex: 2,});

// audioInput.on('audioframe', audioEmitter.updateFrame.bind(audioEmitter));
audioInput2.on('audioframe', (frame) => {
  audioEmitter.preCurrentFrame = {... frame};
});

// Second audio input test
audioInput.on('audioframe', (frame) => {
  audioEmitter.currentFrame = {... audioEmitter.preCurrentFrame, ... _.mapKeys(frame, (v,k) => 'mic2_'+k)};
  audioEmitter.currentFrame.expanded = true;
  audioEmitter.ready = true;
  audioEmitter.emit('audioframe', frame);
});

audioInput.start();
audioInput2.start();

startServer(controller);
