const _ = require('lodash');
const DeviceSerial = require('./devices/serial');
const DeviceUDP = require('./devices/udp');

function initDevicesFromConfig(outputDevices) {
  let devices = {};
  _.each(outputDevices, (deviceConfig, name) => {
    const {type, params} = deviceConfig;

    let device
    switch (type) {
      case 'serial':
        device = new DeviceSerial(params);
        break;
      case 'udp':
        device = new DeviceUDP(params);
        break;
      default:
        throw new Error(`Invalid device type: ${type}`);
    }

    devices[name] = device;
  });
  return devices;
}

module.exports = class DeviceMultiplexer {
  constructor(setup) {
    this.numberOfLights = setup.lights;

    let devices = initDevicesFromConfig(setup.outputDevices)
    let devicesList = [];
    let namesToIndex = {};
    _.each(_.toPairs(devices), ([name, device], i) => {
      devicesList.push(device);
      namesToIndex[name] = i;
    });
    let lightToDevice = new Array(this.numberOfLights);

    // For each segment, save that light 'i' of the strip corresponds to light 'j' of device 'deviceName'
    _.each(setup.lightsToDevicesMapping, ({ from, to, baseIndex, deviceName }) => {
      for (let i = from; i < to; i++) {
        let j = i - from + baseIndex;
        if (!lightToDevice[i]) {
          lightToDevice[i] = [namesToIndex[deviceName], j];
        } else {
          console.warn(
            `There are two devices being mapped to the same light (${deviceName} to ${i})`
          );
        }
      }
    });

    let unmappedIndexes = [];
    for (let i = 0; i < this.numberOfLights; i++) {
      if (!lightToDevice[i]) {
        unmappedIndexes.push(i);
        // -1 indicates to the multiplexer that that light can be ignored
        lightToDevice[i] = [-1, 0];
      }
    }

    if (unmappedIndexes.length) {
      console.warn(
        "In the lights-devices mapping some light were not mapped to any device: ",
        JSON.stringify(unmappedIndexes)
      );
    }

    this.devices = devicesList;
    this.targetDevice = [];
    this.targetPosition = [];

    for (let i = 0; i < this.numberOfLights; i++) {
      const [device, position] = lightToDevice[i];
      this.targetDevice[i] = device;
      this.targetPosition[i] = position;
    }

    this.statusCbk = () => null;

    // Report devices' states every 1s
    // TODO: clearInterval?
    setInterval(() => {
      this.statusCbk(
        _.map(devices, d => {
          return {
            status: d.status,
            deviceId: d.deviceId,
            lastFps: d.lastFps
          };
        })
      );
    }, 1000);
  }

  onDeviceStatus(cbk) {
    this.statusCbk = cbk;
  }

  setLights(rgbArray) {
    const deviceStateArrays = this.devices.map(device =>
      _.map(_.range(device.numberOfLights), i => [0, 0, 0])
    );
    const targetDevice = this.targetDevice;
    const targetPosition = this.targetPosition;

    for (let i = 0; i < rgbArray.length; i++) {
      let deviceIndex = targetDevice[i];
      if (deviceIndex >= 0) {
        deviceStateArrays[deviceIndex][targetPosition[i]] = rgbArray[i];
      }
    }

    for (let i = 0; i < this.devices.length; i++) {
      this.devices[i].setLights(deviceStateArrays[i]);
    }
  }
};
