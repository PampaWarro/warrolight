import React from "react";
import _ from "lodash";
import { ConnectionStatus } from "./ConnectionStatus";
import { DevicesStatus } from "./DevicesStatus";
import { LightsSimulator } from "./LightsSimulator";
import { MicrophoneViewer } from "./MicrophoneViewer";
import { ProgramList } from "./ProgramList";
import {
  Program,
  ConfigValue,
  MicConfig,
  MicSample,
  RemoteState,
  RemoteLayout,
  Device,
  CurrentProgramParameters
} from "./types";
import { API } from "./api";
import { TopProgramConfig } from "./TopProgramConfig";

interface Props {}

interface State {
  selected: string | null;
  programs: { [name: string]: Program };
  currentConfig: CurrentProgramParameters;
  globalConfig: { [param: string]: any };
  micConfig: MicConfig;
  remoteChange: boolean;
  devices: Device[];
  connection: string;
}

// Quick and dirty User agent sniffing for desktop detection
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

export class App extends React.Component<Props, State> {
  api!: API;
  lightsSim: React.RefObject<LightsSimulator>;
  micViewer: React.RefObject<MicrophoneViewer>;
  private pendingAnimationFrame?: number;

  constructor(props: Props) {
    super(props);

    this.state = {
      selected: null,
      programs: {},
      currentConfig: {},
      globalConfig: {},
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
      globalConfig: state.globalConfig || {},
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

    // console.log(state.currentProgramName, state);
  }

  componentDidMount() {
    const api = new API();
    this.api = api;

    api.on("connecting", () => this.setState({ connection: "connecting" }));
    api.on("connect", () => {
      this.setState({ connection: "connected" });

      if(!isMobile) {
        setTimeout(() => api.startSamplingLights(), 500);
      }
    });
    api.on("disconnect", () => this.setState({ connection: "disconnected" }));
    api.on("error", () => this.setState({ connection: "error" }));

    api.on("completeState", this._initializeState.bind(this));
    api.on("stateChange", this._stateChange.bind(this));
    api.on("micSample", (samples: MicSample[]) =>
      this.micViewer.current!.update(samples)
    );

    api.on("lightsSample", (encodedLights: string) => {
      if (this.pendingAnimationFrame) {
        return;
      }
      this.pendingAnimationFrame = window.requestAnimationFrame(() => {
        delete this.pendingAnimationFrame;
        const lights = decodeLedsColorsFromString(encodedLights);
        this.lightsSim.current!.drawCanvas(lights);
      });
    });

    api.on("layout", (layout: RemoteLayout) => {
      let geometryX = layout.geometry.x;
      let geometryY = layout.geometry.y;
      let geometryZ = layout.geometry.z;
      let minX = _.min(geometryX)!;
      let minY = _.min(geometryY)!;
      let minZ = _.min(geometryZ)!;
      let maxX = _.max(geometryX)!;
      let maxY = _.max(geometryY)!;
      let maxZ = _.max(geometryZ)!;

      const layoutObj = {
        geometryX,
        geometryY,
        geometryZ,
        minX,
        minY,
        minZ,
        maxX,
        maxY,
        maxZ
      };

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
        this.api.updateConfigParam(newState.currentConfig.overrides || {});
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

  handleSaveNewPreset = (programName: string, presetName: string, presetConfig: { [param: string]: ConfigValue }) => {
    this.api.savePreset(programName, presetName, presetConfig);
  }

  handleDeletePreset = (programName: string, presetName: string) => {
    this.api.deletePreset(programName, presetName);
  }

  render() {
    let currentProgram = this.getCurrentProgram();

    return (
      <div>
        <div className="">
          <div className="grid-container">
            <nav className="devicesbar bg-dark d-flex justify-content-between align-items-center p-2">
              <span className="navbar-brand">WarroLight</span>
              <DevicesStatus devices={this.state.devices} />
              <ConnectionStatus status={this.state.connection} />
            </nav>
            <nav className="programsbar overflow-auto py-2">
              <ProgramList
                programs={this.state.programs}
                config={this.state.currentConfig}
                selected={this.state.selected}
                onSelectPreset={this.selectPreset}
                onProgramChange={this.handleProgramChange}
              />
            </nav>
            <div className="controlsbar overflow-auto p-3">
              <TopProgramConfig
                program={currentProgram}
                selected={this.state.selected}
                config={this.state.currentConfig}
                globalConfig={this.state.globalConfig}
                programs={this.state.programs}
                onSelectPreset={this.selectPreset}
                onSaveNewPreset={this.handleSaveNewPreset}
                onDeletePreset={this.handleDeletePreset}
                onRestartProgram={this.restartProgram}
                onChangeProgramConfig={this.handleChangeProgramConfig}
              />
            </div>
            <div className="preview p-2">
              <LightsSimulator
                ref={this.lightsSim}
                height={600}
                width={800}
                receivingData={!isMobile}
                onStart={this.handleStartLights}
                onStop={this.handleStopLights}
                real3d={true}
                stats={true}
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
