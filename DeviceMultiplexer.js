const _ = require('lodash')
const term = require( 'terminal-kit' ).terminal ;
const moment = require("moment")
const Table = require('cli-table2');

const colors = {
  'connecting': 'yellow',
  'error': 'red',
  'running': 'green'
}

function logDevicesStatus(devices) {
  let table = new Table({
    head: ['Time', ... _.map(devices, 'deviceId')],
    colWidths: [10, ... _.range(0,devices.length+0).map(() => Math.floor(120 / (devices.length+1)))],
    style: {
      head: []
    },
    wordWrap:true
  });
  let time = moment().format('HH:mm:ss')

  table.push(
    [time, ... _.map(devices, d => d.deviceState[colors[d.deviceState] || "gray"])],
    ["", ... _.map(devices, d => (d.lastStateMsg || "")[colors[d.deviceState] || "gray"])],
    // ["", ... _.map(devices, d => {
    //   if(d.deviceState == d.STATE_RUNNING) {
    //
    //   }
    // })]
  );

  let msgs = []
  // devices.forEach(d => {
  //   msgs.push(`${d.deviceId} - ${d.deviceState} ${d.deviceState === d.STATE_RUNNING ? d.lastFps : ''}`[colors[d.deviceState] || 'gray'])
  // })
  term.saveCursor();
  term.eraseDisplayBelow();
  term.nextLine(2)
  term(table.toString())
  term.restoreCursor();
  term.column(0)
}

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

    // Report devices' states every 250ms
    setInterval(() => {
      this.statusCbk(_.map(devices, d => {
        return {state: d.deviceState, deviceId: d.deviceId, lastFps: d.lastFps}
      }));
    }, 250)
  }

  onDeviceStatus(cbk) {
    this.statusCbk = cbk;
  }

  setState(newState) {
    const deviceStateArrays = this.devices.map(
      device => _.map(_.range(device.numberOfLights), i => [0,0,0])
    )
    const targetDevice = this.targetDevice
    const targetPosition = this.targetPosition

    for (let i = 0; i < newState; i++) {
      let deviceIndex = targetDevice[i];
      if(deviceIndex >= 0) {
        deviceStateArrays[deviceIndex][targetPosition[i]] = newState[i]
      }
    }

    for (let i = 0; i < this.devices.length; i++) {
      this.devices[i].setState(deviceStateArrays[i])
    }
  }
}
