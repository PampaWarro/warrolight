
const { startServer } = require("./server");
const { loadSetup } = require("./setup");

const setup = require('./setups/una-tira-prueba.json');

const { program, multiplexer } = loadSetup(setup);
program.start();

startServer(program, multiplexer);
