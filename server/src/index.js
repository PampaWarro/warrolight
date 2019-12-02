const { startServer } = require("./server");
const { loadSetup } = require("./setup");

const setup = require(`../setups/${process.argv[2]}`);

const controller = loadSetup(setup);
controller.start();

startServer(controller);
