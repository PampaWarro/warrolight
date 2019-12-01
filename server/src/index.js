
const { startServer } = require("./server");
const { loadSetup } = require("./setup");

const setup = require(`../setups/${process.argv[2]}`);

const { program, multiplexer } = loadSetup(setup);
program.start();

startServer(program, multiplexer);
