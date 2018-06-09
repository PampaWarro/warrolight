const _ = require('lodash');

const LightDeviceSerial = require('./LightDeviceSerial')
const LightDeviceUDP = require('./LightDeviceUDP')
const DeviceMultiplexer = require('./DeviceMultiplexer')
const LightController = require('./light-programs/main-program')

const device1 = new LightDeviceUDP(300, '192.168.1.2', 2222);
const device2 = new LightDeviceUDP(300, '192.168.1.4', 4444);
const deviceRF1 = new LightDeviceSerial(300, 'COM14', '/dev/ttyACM0');
const deviceRF2 = new LightDeviceSerial(300, 'COM15', '/dev/ttyACM0');

// const device2 = new LightDeviceSerial(150, 'COM16', '/dev/ttyACM0');
// const device3 = new LightDeviceUDP(300, '192.168.0.7', 7777);
// const device4 = new LightDeviceUDP(300, '192.168.0.8', 8888);
// const device3 = new LightDeviceSerial(300, 'COM18', '/dev/ttyACM1');

setTimeout(() => {
  // let multiplexer = new DeviceMultiplexer(1200, [device1, device2], (index) => [0, index])
  let multiplexer = new DeviceMultiplexer(1200, [device1, device2,deviceRF1, deviceRF2], (index) => {
    if (index < 300) {
      return [0, index]
    } else if (index < 600) {
      return [1, index - 300]
    } else if(index < 900) {
      if(index < 750)
        return [3,index - 600]
      else
        return [2,index - 600 - 150]
    }else {
      if(index < 1050)
        return [2,index - 900 + 150]
      else
        return [3,index - 900]
    }
  })

  let program = new LightController(colorArray => multiplexer.setState(colorArray))
  program.start()

  const server = require("./server")
  server.createRemoteControl(program, multiplexer);
}, 100)