const _ = require('lodash');

const LightDeviceSerial = require('./LightDeviceSerial')
const LightDeviceUDP = require('./LightDeviceUDP')
const DeviceMultiplexer = require('./DeviceMultiplexer')
const LightController = require('./light-programs/main-program')

const device1 = new LightDeviceUDP(300, '192.168.0.5', 5555);
const device2 = new LightDeviceUDP(300, '192.168.0.6', 6666);
// const device2 = new LightDeviceSerial(150, 'COM21', '/dev/ttyACM0');
// const device2 = new LightDeviceSerial(150, 'COM16', '/dev/ttyACM0');
// const device3 = new LightDeviceUDP(300, '192.168.0.7', 7777);
// const device4 = new LightDeviceUDP(300, '192.168.0.8', 8888);
// const device3 = new LightDeviceSerial(300, 'COM18', '/dev/ttyACM1');

setTimeout(() => {
  // let multiplexer = new DeviceMultiplexer(1200, [device1, device2], (index) => [0, index])
  let multiplexer = new DeviceMultiplexer(1200, [device1, device2], (index) => {
    if (index < 300) {
      return [0, index]
    } else if (index < 600) {
      return [1, index - 300]
    } else {
      return [0,0]
    }
  })

  let program = new LightController(colorArray => multiplexer.setState(colorArray))
  program.start()

  const server = require("./server")
  server.createRemoteControl(program, multiplexer);
}, 100)