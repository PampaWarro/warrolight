const _ = require("lodash");

module.exports = class DeviceMultiplexer {
  constructor(numberOfLights, devices, lightToDeviceMapping) {
    this.numberOfLights = numberOfLights;
    this.devices = devices;
    this.targetDevice = [];
    this.targetPosition = [];

    for (let i = 0; i < numberOfLights; i++) {
      const [device, position] = lightToDeviceMapping(i);
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
            state: d.deviceState,
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
