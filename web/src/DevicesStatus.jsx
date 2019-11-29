/*global socket*/
import React from "react";

export class DevicesStatus extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      devices: []
    };
  }

  componentDidMount() {
    socket.on("devicesStatus", devices => {
      this.setState({ devices });
    });
  }

  render() {
    function className(state) {
      switch (state) {
        case 'running':
          return 'success';
        case 'connecting':
          return 'warning';
        case 'error':
          return 'danger'
      }
    }
    let devices = this.state.devices.map(d => (
      <span className={"mr-2 btn btn-sm btn-" + className(d.state)} key={d.deviceId}>
        {d.deviceId} ({d.state.toUpperCase()}) {d.lastFps}
      </span>
    ));

    return <div className="devices">{devices}</div>;
  }
}
