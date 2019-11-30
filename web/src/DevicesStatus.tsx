import React from "react";
import Socket from "./socket";
import { Device } from "./types";

interface Props {
  socket: Socket
}

interface State {
  devices: Device[]
}

export class DevicesStatus extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      devices: []
    };
  }

  componentDidMount() {
    const socket = this.props.socket;

    socket.on("devicesStatus", (devices: Device[]) => {
      this.setState({ devices });
    });
  }

  render() {
    // TODO: add type for device states
    function className(state: string) {
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
