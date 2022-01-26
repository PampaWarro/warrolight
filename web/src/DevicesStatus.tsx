import _ from "lodash";
import React from "react";
import { Device } from "./types";

interface Props {
  devices: Device[];
}

interface State {
    showMetadata: boolean;
}


export class DevicesStatus extends React.Component<Props,State> {
  constructor(props: Props) {
      super(props);
      this.state = {showMetadata: false};
  }

  render() {
    const { devices } = this.props;

    function className(status: string) {
      switch (status) {
        case "running":
          return "success";
        case "connecting":
        case "waiting":
          return "warning";
        case "error":
          return "danger";
      }
    }

    return <div className="devices d-none d-md-block">
      {devices.map(device => {
          let extendedMetadata = {FPS: device.lastFps || '-'};
          if(this.state.showMetadata) {
              extendedMetadata = {...  extendedMetadata, ... device.metadata};
          }

          let metadata = <div className={'small'}>
              {_.map(extendedMetadata, (val, key) => <span key={key}>
                      <span className={'text-dark ml-2'}>{key}</span> {val}
                  </span>)}
          </div>;

          let statusText = device.status.toUpperCase();
          let status = null;
          if(statusText !== 'RUNNING') {
              status = <div className={'small'}><strong>{statusText}</strong></div>;
          }

          return <span key={device.deviceId} className={`mr-2 btn btn-sm btn-${className(device.status)}`}>
              {device.deviceId}
              {status}
              {metadata}
        </span>;
      })}
    </div>;
  }
}
