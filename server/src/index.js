const { startServer } = require("./server");
const { loadSetup } = require("./setup");

const setupPath = `../setups/${process.argv[2]}`;
console.log(`Loading setup from ${setupPath}`)
const setup = require(setupPath);

const controller = loadSetup(setup);
controller.start();

startServer(controller);
