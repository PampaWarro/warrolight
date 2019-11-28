const _ = require('lodash');



const DeviceMultiplexer = require('./DeviceMultiplexer')
const LightController = require('./light-programs/LightController')

// const device1 = new LightDeviceUDP(300, '192.168.1.2', 2222);
// const device2 = new LightDeviceUDP(300, '192.168.1.4', 4444);
// const deviceRF1 = new LightDeviceSerial(150, 'COM27', '/dev/ttyACM0');
// const deviceRF2 = new LightDeviceSerial(150, 'COM25', '/dev/ttyACM0');
// const device2 = new LightDeviceSerial(150, 'COM16', '/dev/ttyACM0');
// const device3 = new LightDeviceUDP(300, '192.168.0.7', 7777);
// const device4 = new LightDeviceUDP(300, '192.168.0.8', 8888);
// const device3 = new LightDeviceSerial(300, 'COM18', '/dev/ttyACM1');

let setup = require('./setups/default.json')

function instantiateDevicesFromConfig(outputDevices) {
  const  devicesTypes = {
    'LightDeviceSerial': require('./LightDeviceSerial'),
    'LightDeviceUDP': require('./LightDeviceUDP'),
  }

  let devices = {};
  _.each(outputDevices, (deviceConfig, name) => {
    const {type, params} = deviceConfig;
    const deviceClass = devicesTypes[type];

    if(!deviceClass) {
      throw new Error(`Invalid device type: ${type}`);
    }

    devices[name] = new deviceClass(params);
  });
  return devices;
}

function createLightsMultiplexer(totalLightsCount, devices, lightsToDevicesMapping) {
  let devicesList = [];
  let namesToIndex = {};
  _.each(_.toPairs(devices), ([name, device], i) => {
    devicesList.push(device);
    namesToIndex[name] = i;
  })
  let lightToDevice = new Array(totalLightsCount);

  // For each segment, save that light 'i' of the strip corresponds to light 'j' of device 'deviceName'
  _.each(lightsToDevicesMapping, ({from, to, baseIndex, deviceName}) => {
    for(let i=from; i < to; i++) {
      let j = i - from + baseIndex;
      if(!lightToDevice[i]) {
        lightToDevice[i] = [namesToIndex[deviceName], j];
      } else {
        console.warn(`There are two devices being mapped to the same light (${deviceName} to ${i})`)
      }
    }
  })

  let unmappedIndexes = [];
  for(let i=0; i < totalLightsCount; i++) {
    if(!lightToDevice[i]) {
      unmappedIndexes.push(i);
      // -1 indicates to the multiplexer that that light can be ignored
      lightToDevice[i] = [-1,0];
    }
  }

  if(unmappedIndexes.length) {
    console.warn("In the lights-devices mapping some light were not mapped to any device: ", JSON.stringify(unmappedIndexes));
  }

  return new DeviceMultiplexer(totalLightsCount, devicesList, index => lightToDevice[index]);
}

setTimeout(() => {
  let setupName = 'fuego-2019';
  // let setupName = 'w-chica-rf';

  let {geometryModule, shapeMappingModule, lights, outputDevices, lightsToDevicesMapping} = setup[setupName];

  const devices = instantiateDevicesFromConfig(outputDevices);
  const geometry = require(`./geometry/${geometryModule}`)
  const shapeMapping = require(`./geometry/mappings/${shapeMappingModule}`)
  const multiplexer = createLightsMultiplexer(lights, devices, lightsToDevicesMapping);

  let program = new LightController(colorArray => multiplexer.setState(colorArray), geometry, shapeMapping)
  program.start()

  const server = require("./server")
  server.createRemoteControl(program, multiplexer);
}, 100)