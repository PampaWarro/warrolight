const _ = require('lodash');
const DeviceMultiplexer = require('./DeviceMultiplexer')
const LightController = require('./light-programs/LightController')

const devicesTypes = {
  serial: require('./devices/serial'),
  udp: require('./devices/udp'),
}

function instantiateDevicesFromConfig(outputDevices) {
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

exports.loadSetup = function loadSetup(setup) {
    const devices = instantiateDevicesFromConfig(setup.outputDevices);
    const geometry = require(`../setups/geometries/${setup.geometry}`)
    const shapeMapping = require(`../setups/shapeMappings/${setup.shapeMapping}`)
    const multiplexer = createLightsMultiplexer(setup.lights, devices, setup.lightsToDevicesMapping);
  
    const program = new LightController(
        colorArray => multiplexer.setState(colorArray),
        geometry,
        shapeMapping
    );

    return { program, multiplexer }
}
