const _ = require('lodash');

const Device = require('./device')
const Multiplexer = require('./multiplexer')
const LightController = require('./light-programs/main-program')

let multiplexer;

// W chica
var serialDevice = '/dev/ttyACM0'
if(/^win/.test(process.platform)){
  serialDevice = 'COM15'
}
var device1 = new Device(150, serialDevice)

setTimeout(() => {
  multiplexer = new Multiplexer(150, [device1], (index) => {
    if (index < 150) {
      if (index < 0)
        return [0, 0]

      return [0, index]
    }
  })

  let program = new LightController((colorArray) => multiplexer.setState(colorArray))
  program.start()

  const server = require("./server")
  server.createRemoteControl(program);
}, 100)