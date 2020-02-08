const { startServer } = require("./server");
const { loadSetup } = require("./setup");
const audioEmitter = require("./audioEmitter");
const {AudioInput, listDevices} = require("../../audio/input");

const setupFile = process.argv[2] || "sample.json";
const setupPath = `../setups/${setupFile}`;

console.log(`Loading setup from ${setupPath}`)
const setup = require(setupPath);

const controller = loadSetup(setup);
controller.start();

console.log('Available audio devices:\n', listDevices());
const audioInput = new AudioInput({
  deviceIndex: null,  // TODO: allow overriding device.
  fakeAudio: true,
});
audioInput.on('audioframe', audioEmitter.updateFrame.bind(audioEmitter));
audioInput.start();

startServer(controller);
