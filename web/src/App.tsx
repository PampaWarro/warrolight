import React from "react";
import _ from "lodash";
import Socket from "./socket";
import { ConnectionStatus } from "./ConnectionStatus";
import { DevicesStatus } from "./DevicesStatus";
import { LightsSimulator } from "./LightsSimulator";
import { MicrophoneViewer } from "./MicrophoneViewer";
import { ProgramList } from "./ProgramList";
import { ProgramConfig } from "./ProgramConfig";
import { Program, ConfigValue, MicConfig, MicSample, RemoteState, RemoteLayout } from "./types";

interface Props {}

interface State {
  selected: string | null
  programs: { [name: string]: Program }
  currentConfig: { [param: string]: ConfigValue } | null
  micConfig: MicConfig
  remoteChange: boolean
}

export class App extends React.Component<Props, State> {
  socket: Socket

  lightsSim: React.RefObject<LightsSimulator>
  micViewer: React.RefObject<MicrophoneViewer>

  constructor(props: Props) {
    super(props);

    this.state = {
      selected: null,
      programs: {},
      currentConfig: null,
      micConfig: {
        sendingMicData: false,
        metric: ""
      },
      remoteChange: false
    };

    this.socket = new Socket("ws://localhost:8080/", "warro");

    this.lightsSim = React.createRef();
    this.micViewer = React.createRef();
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
    const socket = this.socket;

    socket.on("completeState", this._initializeState.bind(this));
    socket.on("stateChange", this._stateChange.bind(this));
    socket.on("micSample", (samples: MicSample[]) =>
      this.micViewer.current!.update(samples)
    );

    socket.on("lightsSample", (encodedLights: string) => {
      const lights = decodeLedsColorsFromString(encodedLights);
      this.lightsSim.current!.drawCanvas(lights);
    });

    socket.on("layout", (layout: RemoteLayout) => {
      let geometryX = layout.geometry.x;
      let geometryY = layout.geometry.y;
      let minX = _.min(geometryX)!;
      let minY = _.min(geometryY)!;
      let maxX = _.max(geometryX)!;
      let maxY = _.max(geometryY)!;

      const layoutObj = { geometryX, geometryY, minX, minY, maxX, maxY }

      this.lightsSim.current!.updateLayout(layoutObj)
    });
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

  getCurrentProgram() {
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

  handleSetMicConfig = (config: Partial<MicConfig>) => {
    this.socket.emit("setMicDataConfig", config);
  }

  handleStartLights = () => {
    this.socket.emit("startSamplingLights");
  }

  handleStopLights = () => {
    this.socket.emit("stopSamplingLights");
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
                <LightsSimulator
                  ref={this.lightsSim}
                  height={400}
                  width={600}
                  onStart={this.handleStartLights}
                  onStop={this.handleStopLights}
                />
                <MicrophoneViewer
                  ref={this.micViewer}
                  config={this.state.micConfig}
                  onSetConfig={this.handleSetMicConfig}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

function decodeLedsColorsFromString(encodedLights: string): [number, number, number][] {
  const bytes = Uint8Array.from(atob(encodedLights), c => c.charCodeAt(0));

  const byLed = new Array(bytes.length / 3);
  for (let i = 0; i < bytes.length / 3; i += 1) {
    byLed[i] = [bytes[i * 3], bytes[i * 3 + 1], bytes[i * 3 + 2]];
  }
  return byLed;
}
