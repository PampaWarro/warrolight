/*global socket*/
import React from 'react';

export class DevicesStatus extends React.Component {
  constructor() {
    super(...arguments)

    this.state = {
      devices: []
    }
  }

  componentDidMount() {
    socket.on('devicesStatus', (devices) => {
      this.setState({devices})
    });
  }

  render() {
    let devices = this.state.devices.map(d => <div key={d.deviceId} className={`device device-${d.state}`}>
      <div>{d.deviceId}</div>
      <div>{d.state}</div>
      <div>{d.lastFps}</div>
    </div>)

    return <div className="devices">
      {devices}
    </div>
  }
}
