const _ = require('lodash')


module.exports = class DeviceMultiplexer {

  constructor(numberOfLights, devices, lightToDeviceMapping) {
    this.numberOfLights = numberOfLights
    this.devices = devices
    this.targetDevice = []
    this.targetPosition = []

    for (let i = 0; i < numberOfLights; i++) {
      const [device, position] = lightToDeviceMapping(i)
      this.targetDevice[i] = device
      this.targetPosition[i] = position
    }
    this.statusCbk = () => null;

    setInterval(() => this.statusCbk(_.map(devices, d => {
      return {state: d.deviceState, deviceId: d.deviceId, lastFps: d.lastFps}
    })), 1000)
  }

  onDeviceStatus(cbk) {
    this.statusCbk = cbk;
  }

  setState(newState) {
    const newStates = this.devices.map(
      device => _.map(_.range(device.numberOfLights), i => [0,0,0])
    )
    const targetDevice = this.targetDevice
    const targetPosition = this.targetPosition
    for (let i = 0; i < this.numberOfLights; i++) {
      newStates[targetDevice[i]][targetPosition[i]] = newState[i]
    }
    for (let i = 0; i < this.devices.length; i++) {
      this.devices[i].setState(newStates[i])
    }
  }
}
