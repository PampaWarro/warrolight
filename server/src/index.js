const { startServer } = require("./server");
const { loadSetup } = require("./setup");

let setupFile = process.argv[2] || "sample.json";

const setupPath = `../setups/${setupFile}`;
console.log(`Loading setup from ${setupPath}`)
const setup = require(setupPath);

const controller = loadSetup(setup);
controller.start();

startServer(controller);
