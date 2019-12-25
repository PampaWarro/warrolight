import React from "react";
import { Device } from "./types";

interface Props {
  devices: Device[];
}

export class DevicesStatus extends React.Component<Props> {
  render() {
    const { devices } = this.props;

    function className(status: string) {
      switch (status) {
        case "running":
          return "success";
        case "connecting":
          return "warning";
        case "error":
          return "danger";
      }
    }

    return (
      <div className="devices">
        {devices.map(device => (
          <span
            key={device.deviceId}
            className={"mr-2 btn btn-sm btn-" + className(device.status)}
          >
            {device.deviceId} ({device.status.toUpperCase()}) {device.lastFps}
          </span>
        ))}
      </div>
    );
  }
}
