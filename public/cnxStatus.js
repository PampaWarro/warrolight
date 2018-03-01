if (!window.socket) {
  window.socket = io({
    reconnection: true,
    'force new connection': true
  });
}

const STATUS_OK = "success";
const STATUS_WARN = "warning";
const STATUS_ERROR = "danger";
const STATUS_INFO = "info";

class CnxStatus extends React.Component {
  constructor() {
    super(...arguments);

    this.state = {
      status: "Connecting",
      level: "STATUS_WARN"
    };

    const events = ["connect", "connecting", "disconnect", "connect_failed", "error", "message", "anything", "reconnect_failed", "reconnect"];

    events.forEach(evtName => {
      socket.on(evtName, extra => {
        this.setState({
          status: evtName,
          level: STATUS_WARN
        });
        console.warn(evtName + " fired", extra);
      });

      socket.on('devicesStatus', data => {
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

      socket.on('end', data => {
        socket.disconnect();
        this.setState({
          status: "Connection finished",
          level: STATUS_WARN
        });
      });
    });
  }

  componentDidMount() {
    socket.on('devicesStatus', devices => {
      this.setState({ devices });
    });
  }

  render() {
    return React.createElement(
      "div",
      { className: "status-" + this.state.level },
      this.state.status
    );
  }
}

//# sourceMappingURL=cnxStatus.js.map