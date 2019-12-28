import React from "react";
import _ from "lodash";
import { ConnectionStatus } from "./ConnectionStatus";
import { DevicesStatus } from "./DevicesStatus";
import { LightsSimulator } from "./LightsSimulator";
import { MicrophoneViewer } from "./MicrophoneViewer";
import { ProgramList } from "./ProgramList";
import { ProgramConfig } from "./ProgramConfig";
import {
  Program,
  ConfigValue,
  MicConfig,
  MicSample,
  RemoteState,
  RemoteLayout,
  Device
} from "./types";
import { API } from "./api";

interface Props {}

interface State {
  selected: string | null;
  programs: { [name: string]: Program };
  currentConfig: { [param: string]: ConfigValue } | null;
  micConfig: MicConfig;
  remoteChange: boolean;
  devices: Device[];
  connection: string;
}

export class App extends React.Component<Props, State> {
  api!: API;
  lightsSim: React.RefObject<LightsSimulator>;
  micViewer: React.RefObject<MicrophoneViewer>;
  private lightsToRender: string | null = null;

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
      remoteChange: false,
      devices: [],
      connection: "connecting"
    };

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
    const api = new API();
    this.api = api;

    api.on("connecting", () => this.setState({ connection: "connecting" }));
    api.on("connect", () => {
      this.setState({ connection: "connected" });
      setTimeout(() => api.startSamplingLights(), 500);
    });
    api.on("disconnect", () => this.setState({ connection: "disconnected" }));
    api.on("error", () => this.setState({ connection: "error" }));

    api.on("completeState", this._initializeState.bind(this));
    api.on("stateChange", this._stateChange.bind(this));
    api.on("micSample", (samples: MicSample[]) =>
      this.micViewer.current!.update(samples)
    );

    api.on("lightsSample", (encodedLights: string) => {
      // Save last lights information, request animation frame and render last frame only once
      this.lightsToRender = encodedLights;
      window.requestAnimationFrame(() => {
        if(this.lightsToRender) {
          const lights = decodeLedsColorsFromString(this.lightsToRender);
          this.lightsSim.current!.drawCanvas(lights);
          // Ensure the last frame is not rendered twice, otherwise animation frame requests can queue and render
          // all at the same time
          this.lightsToRender = null;
        }
      })
    });

    api.on("layout", (layout: RemoteLayout) => {
      let geometryX = layout.geometry.x;
      let geometryY = layout.geometry.y;
      let minX = _.min(geometryX)!;
      let minY = _.min(geometryY)!;
      let maxX = _.max(geometryX)!;
      let maxY = _.max(geometryY)!;

      const layoutObj = { geometryX, geometryY, minX, minY, maxX, maxY };

      this.lightsSim.current!.updateLayout(layoutObj);
    });

    api.on("devicesStatus", (devices: Device[]) => {
      this.setState({ devices });
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
        this.api.updateConfigParam(newState.currentConfig);
      }
    }
  }

  getCurrentProgram() {
    if (this.state.selected) {
      return this.state.programs[this.state.selected];
    }
    return null;
  }

  handleProgramChange = (key: string) => {
    this.setCurrentProgram(key);
  };

  setCurrentProgram = (name: string) => {
    this.api.setCurrentProgram(name);
  };

  selectPreset = (preset: string) => {
    this.api.setPreset(preset);
  };

  restartProgram = () => {
    this.api.restartProgram();
  };

  handleSetMicConfig = (config: Partial<MicConfig>) => {
    this.api.setMicConfig(config);
  };

  handleChangeProgramConfig = (config: { [name: string]: ConfigValue }) => {
    this.api.updateConfigParam(config);
  };

  handleStartLights = () => {
    this.api.startSamplingLights();
  };

  handleStopLights = () => {
    this.api.stopSamplingLights();
  };

  render() {
    let currentProgram = this.getCurrentProgram();

    return (
      <div>
        <div className="">
          <div className="grid-container">
            <nav className="devicesbar bg-dark d-flex justify-content-between align-items-center p-2">
              <span className="navbar-brand">WarroLight</span>
              <DevicesStatus devices={this.state.devices}/>
              <ConnectionStatus status={this.state.connection}/>
            </nav>
            <nav className="programsbar overflow-auto py-2">
              <ProgramList
                programs={this.state.programs}
                selected={this.state.selected}
                onProgramChange={this.handleProgramChange}
              />
            </nav>
            <div className="controlsbar overflow-auto p-3">
              <ProgramConfig
                program={currentProgram}
                selected={this.state.selected}
                config={this.state.currentConfig}
                onSelectPreset={this.selectPreset}
                onRestartProgram={this.restartProgram}
                onChangeProgramConfig={this.handleChangeProgramConfig}
              />
            </div>
            <div className="preview p-2">
              <LightsSimulator
                ref={this.lightsSim}
                height={400}
                width={600}
                onStart={this.handleStartLights}
                onStop={this.handleStopLights}
              />
            </div>
            <div className="soundbar p-2">
              <MicrophoneViewer
                ref={this.micViewer}
                config={this.state.micConfig}
                onSetConfig={this.handleSetMicConfig}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

function decodeLedsColorsFromString(
  encodedLights: string
): [number, number, number][] {
  const bytes = Uint8Array.from(atob(encodedLights), c => c.charCodeAt(0));

  const byLed = new Array(bytes.length / 3);
  for (let i = 0; i < bytes.length / 3; i += 1) {
    byLed[i] = [bytes[i * 3], bytes[i * 3 + 1], bytes[i * 3 + 2]];
  }
  return byLed;
}
