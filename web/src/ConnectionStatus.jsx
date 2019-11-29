/*global socket*/
import React from "react";

const STATUS_OK = "success";
const STATUS_WARN = "warning";

export class ConnectionStatus extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      status: "Connecting",
      level: "STATUS_WARN"
    };

    const events = [
      "connect",
      "connecting",
      "disconnect",
      "error",
    ];

    events.forEach(evtName => {
      socket.on(evtName, extra => {
        this.setState({
          status: evtName,
          level: STATUS_WARN
        });
        console.warn(evtName + " fired", extra);
      });

      socket.on("devicesStatus", data => {
        this.setState({
          status: "Connected",
          level: STATUS_OK
        });
      });

      socket.on("disconnect", (a, b) => {
        this.setState({
          status: "Disconnected",
          level: STATUS_WARN
        });
      });

      socket.on("end", data => {
        socket.disconnect();
        this.setState({
          status: "Connection finished",
          level: STATUS_WARN
        });
      });
    });
  }

  componentDidMount() {
    socket.on("devicesStatus", devices => {
      this.setState({ devices });
    });
  }

  render() {
    return (
      <button className={"btn btn-sm btn-" + this.state.level}>
        {this.state.status}
      </button>
    );
  }
}
