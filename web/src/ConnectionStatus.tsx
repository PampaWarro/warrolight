import React from "react";
import Socket from "./socket";

const STATUS_OK = "success";
const STATUS_WARN = "warning";

interface Props {
  socket: Socket
}

interface State {
  status: string
  level: string
}

export class ConnectionStatus extends React.Component<Props, State> {

  constructor(props: Props) {
    super(props);

    this.state = {
      status: "Connecting",
      level: "STATUS_WARN"
    };
  }

  componentDidMount() {
    // TODO: move socket listening above
    const socket = this.props.socket;
    const events = [
      "connect",
      "connecting",
      "disconnect",
      "error",
    ];

    events.forEach(evtName => {
      socket.on(evtName, (extra: any) => {
        this.setState({
          status: evtName,
          level: STATUS_WARN
        });
      });
    });

    socket.on("devicesStatus", () => {
      this.setState({
        status: "Connected",
        level: STATUS_OK
      });
    });

    socket.on("disconnect", () => {
      this.setState({
        status: "Disconnected",
        level: STATUS_WARN
      });
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
