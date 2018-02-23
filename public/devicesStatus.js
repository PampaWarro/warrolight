if (!window.socket) {
  window.socket = io();
}

class DevicesStatus extends React.Component {
  constructor() {
    super(...arguments);

    this.state = {
      devices: []
    };
  }

  componentDidMount() {
    socket.on('devicesStatus', devices => {
      this.setState({ devices });
    });
  }

  render() {
    let devices = this.state.devices.map(d => React.createElement(
      "div",
      { key: d.deviceId, className: `device device-${d.state}` },
      React.createElement(
        "div",
        null,
        d.deviceId
      ),
      React.createElement(
        "div",
        null,
        d.state
      ),
      React.createElement(
        "div",
        null,
        d.lastFps
      )
    ));

    return React.createElement(
      "div",
      { className: "devices" },
      devices
    );
  }
}

//# sourceMappingURL=devicesStatus.js.map