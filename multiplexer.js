const _ = require('lodash')

module.exports = class Multiplexer {

  constructor(numberOfLights, devices, mapping) {
    this.numberOfLights = numberOfLights
    this.devices = []
    this.targetDevice = []
    this.targetPosition = []
    for (let i = 0; i < numberOfLights; i++) {
      const [ device, position ] = mapping(i)
      this.targetDevice[i] = device
      this.targetPosition[i] = position
    }
  }

  setState(newState) {
    const newStates = this.devices.map(
      device => _.range(device.numberOfLights)
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
