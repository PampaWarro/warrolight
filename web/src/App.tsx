import React from "react";
import _ from "lodash";
import Socket from "./socket";
import { ConnectionStatus } from "./ConnectionStatus";
import { DevicesStatus } from "./DevicesStatus";
import { LightsSimulator } from "./LightsSimulator";
import { MicrophoneViewer } from "./MicrophoneViewer";
import { ProgramList } from "./ProgramList";
import { ProgramConfig } from "./ProgramConfig";

// TODO: fix
type Program = any

type MicConfig = any

type RemoteState = any

interface Props {}

type ConfigValue = string | number | boolean

interface State {
  selected: string | null
  programs: { [name: string]: Program }
  currentConfig: { [param: string]: ConfigValue } | null
  micConfig: MicConfig
  remoteChange: boolean
}

export class App extends React.Component<Props, State> {
  socket: Socket

  constructor(props: Props) {
    super(props);

    this.state = {
      selected: null,
      programs: [],
      currentConfig: null,
      micConfig: {},
      remoteChange: false
    };

    this.socket = new Socket("ws://localhost:8080/", "warro");
  }

  _initializeState(state: RemoteState) {
    this.setState({
      programs: _.keyBy(state.programs, "name"),
      selected: state.currentProgramName,
      currentConfig: state.currentConfig,
      micConfig: state.micConfig
    });
    console.log(state);
  }

  _stateChange(state: RemoteState) {
    this.setState({
      selected: state.currentProgramName,
      currentConfig: state.currentConfig,
      micConfig: state.micConfig,
      remoteChange: true
    });

    console.log(state.currentProgramName, state);
  }

  componentDidMount() {
    this.socket.on("completeState", this._initializeState.bind(this));
    this.socket.on("stateChange", this._stateChange.bind(this));
  }

  UNSAFE_componentWillUpdate(newProps: Props, newState: State) {
    if (
      this.state.currentConfig !== newState.currentConfig &&
      !newState.remoteChange
    ) {
      // TODO: added to typecheck, check if it's right
      if (newState.currentConfig) {
        console.log("ENTIRE CHANGING TO", newState.currentConfig);
        this.socket.emit("updateConfigParam", newState.currentConfig);
      }
    }
  }

  handleProgramChange(key: string) {
    this.setCurrentProgram(key);
  }

  getCurrentProgram(): Program {
    if (this.state.selected) {
      return this.state.programs[this.state.selected];
    }
    return null
  }

  setCurrentProgram(name: string) {
    this.socket.emit("setCurrentProgram", name);
  }

  selectPreset(preset: string) {
    this.socket.emit("setPreset", preset);
  }

  restartProgram() {
    this.socket.emit("restartProgram");
  }

  render() {
    let currentProgram = this.getCurrentProgram()

    return (
      <div>
        <nav className="navbar fixed-top navbar-dark bg-dark">
          <span className="navbar-brand">WarroLight</span>
          <DevicesStatus socket={this.socket} />
          <ConnectionStatus socket={this.socket} />
        </nav>
        <div className="container-fluid">
          <div className="row">
            <nav className="sidebar">
              <ProgramList
                programs={this.state.programs}
                selected={this.state.selected}
                onProgramChange={this.handleProgramChange.bind(this)}
              />
            </nav>
            <div className="col-md-3 offset-2 sidebar-2 p-4">
              <ProgramConfig
                socket={this.socket}
                program={currentProgram}
                selected={this.state.selected}
                config={this.state.currentConfig}
                onSelectPreset={this.selectPreset.bind(this)}
                onRestartProgram={this.restartProgram.bind(this)}
              />
            </div>
            <div className="offset-5 fixed-top">
              <div className="m-3">
                <LightsSimulator socket={this.socket} height={400} width={600} />
                <MicrophoneViewer socket={this.socket} config={this.state.micConfig} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
