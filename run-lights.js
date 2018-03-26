const _ = require('lodash');

const LightDeviceSerial = require('./LightDeviceSerial')
const DeviceMultiplexer = require('./DeviceMultiplexer')
const LightController = require('./light-programs/main-program')

// W chica
var device1 = new LightDeviceSerial(150, 'COM6', '/dev/ttyACM0')

setTimeout(() => {
  // let multiplexer = new DeviceMultiplexer(1200, [device1, device2], (index) => [0, index])
  let multiplexer = new DeviceMultiplexer(150, [device1], (index) => {
    if (index < 150) {
      if (index < 15)
        return [0, 0]

      return [0, index]
    }
  })

  let program = new LightController(colorArray => multiplexer.setState(colorArray))
  program.start()

  const server = require("./server")
  server.createRemoteControl(program, multiplexer);
}, 100)