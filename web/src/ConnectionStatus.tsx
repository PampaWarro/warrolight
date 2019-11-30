import React from "react";

interface Props {
  status: string;
}

export class ConnectionStatus extends React.Component<Props> {
  render() {
    let type, label;

    switch (this.props.status) {
      case "connecting":
        [type, label] = ["warning", "Connecting"];
        break;
      case "connected":
        [type, label] = ["success", "Connected"];
        break;
      case "disconnected":
        [type, label] = ["danger", "Disconnected"];
        break;
      case "error":
        [type, label] = ["danger", "Error"];
        break;
    }
    return <button className={"btn btn-sm btn-" + type}>{label}</button>;
  }
}
