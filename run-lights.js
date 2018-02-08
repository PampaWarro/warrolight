const _ = require('lodash');

const LightDeviceSerial = require('./LightDeviceSerial')
const LightDeviceUDP = require('./LightDeviceUDP')
const DeviceMultiplexer = require('./DeviceMultiplexer')
const LightController = require('./light-programs/main-program')

const device1 = new LightDeviceSerial(150, 'COM21', '/dev/ttyACM0');
// const device1 = new LightDeviceUDP(150);

setTimeout(() => {
  let multiplexer = new DeviceMultiplexer(150, [device1], (index) => {
    if (index < 150) {
      return [0, index]
    }
  })

  let program = new LightController(colorArray => multiplexer.setState(colorArray))
  program.start()

  const server = require("./server")
  server.createRemoteControl(program);
}, 100)