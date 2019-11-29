/*global socket*/
import React from "react";
import _ from "lodash";
import { ConnectionStatus } from "./ConnectionStatus";
import { DevicesStatus } from "./DevicesStatus";
import { LightsSimulator } from "./LightsSimulator";
import { MicrophoneViewer } from "./MicrophoneViewer";
import { ProgramList } from "./ProgramList";
import { ProgramConfig } from "./ProgramConfig";

export class Simulator extends React.Component {
  constructor(props) {
    super(props);

    this.config = {
      frequencyInHertz: 60
    };

    this.programs = [];

    this.state = {
      selected: null,
      programs: [],
      micConfig: {}
    };

    this.leds = [];

    this.getLeds = index => this.leds[index];
  }

  _initializeState(state) {
    this.setState({
      programs: _.keyBy(state.programs, "name"),
      selected: state.currentProgramName,
      currentConfig: state.currentConfig,
      micConfig: state.micConfig
    });
    console.log(state);
  }

  _stateChange(state) {
    this.setState({
      selected: state.currentProgramName,
      currentConfig: state.currentConfig,
      micConfig: state.micConfig,
      remoteChange: true
    });

    console.log(state.currentProgramName, state);
  }

  componentDidMount() {
    socket.on("completeState", this._initializeState.bind(this));
    socket.on("stateChange", this._stateChange.bind(this));
  }

  UNSAFE_componentWillUpdate(newProps, newState) {
    if (
      this.state.currentConfig !== newState.currentConfig &&
      !newState.remoteChange
    ) {
      console.log("ENTIRE CHANGING TO", newState.currentConfig);
      socket.emit("updateConfigParam", newState.currentConfig);
    }
  }

  handleProgramChange(key) {
    this.setCurrentProgram(key);
  }

  getCurrentProgram() {
    if (this.state.selected) {
      return this.state.programs[this.state.selected];
    }
    return null
  }

  setCurrentProgram(name) {
    socket.emit("setCurrentProgram", name);
  }

  updateLeds(leds) {
    this.props.send(leds);
    this.leds = leds;
    this.refs.simulator.getNextFrame();
  }

  selectPreset(preset) {
    socket.emit("setPreset", preset);
  }

  restartProgram(e) {
    socket.emit("restartProgram");
  }

  render() {
    let currentProgram = this.getCurrentProgram()

    return (
      <div>
        <nav className="navbar fixed-top navbar-dark bg-dark">
          <span className="navbar-brand">WarroLight</span>
          <DevicesStatus />
          <ConnectionStatus />
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
                program={currentProgram}
                selected={this.state.selected}
                config={this.state.currentConfig}
                onSelectPreset={this.selectPreset.bind(this)}
                onRestartProgram={this.restartProgram.bind(this)}
              />
            </div>
            <div className="col-md-7">
              <LightsSimulator height="400" width="600"></LightsSimulator>
              <MicrophoneViewer config={this.state.micConfig} />
            </div>
          </div>
        </div>
      </div>
    );
  }
}
