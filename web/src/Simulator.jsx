/*global socket*/
import React from "react";
import { ConnectionStatus } from "./ConnectionStatus";
import { DevicesStatus } from "./DevicesStatus";
import { LightsSimulator } from "./LightsSimulator";
import { MicrophoneViewer } from "./MicrophoneViewer";
import { StringParam } from "./StringParam";
import { BooleanParam } from "./BooleanParam";
import { NumberParam } from "./NumberParam";
import _ from "lodash";

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

  handleProgramClick(key, ev) {
    ev.preventDefault();
    this.setCurrentProgram(key);
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
    e.preventDefault();
    socket.emit("restartProgram");
  }

  render() {
    let menuItems = [];
    for (let key in this.state.programs) {
      if (key === this.state.selected) {
        menuItems.push(
          <Item key={key} className="selected">
            {this.state.programs[key].name}
          </Item>
        );
      } else {
        menuItems.push(
          <Item key={key} onClick={e => this.handleProgramClick(key, e)}>
            {this.state.programs[key].name}
          </Item>
        );
      }
    }

    let configOptions = [];
    let presets = [];
    let currentProgram = { name: "NO SELECTED PROGRAM" };

    if (this.state.selected) {
      currentProgram = this.state.programs[this.state.selected];

      for (let paramName in currentProgram.config) {
        let val = this.state.currentConfig[paramName];
        if (_.isBoolean(currentProgram.config[paramName].default)) {
          configOptions.push(
            <BooleanParam
              key={paramName}
              configDefinition={currentProgram.config[paramName]}
              configRef={this.state.currentConfig}
              val={val}
              field={paramName}
            />
          );
        } else if (_.isString(currentProgram.config[paramName].default)) {
          configOptions.push(
            <StringParam
              key={paramName}
              configDefinition={currentProgram.config[paramName]}
              configRef={this.state.currentConfig}
              val={val}
              field={paramName}
            />
          );
        } else {
          configOptions.push(
            <NumberParam
              key={paramName}
              configDefinition={currentProgram.config[paramName]}
              configRef={this.state.currentConfig}
              val={val}
              field={paramName}
            />
          );
        }
      }

      for (let preset of currentProgram.presets) {
        presets.push(
          <a
            className="preset"
            href="#"
            key={preset}
            onClick={e => this.selectPreset(preset)}
          >
            {preset}{" "}
          </a>
        );
      }
    }

    {
      return (
        <div>
          <div className="contain">
            <div className={"top-header"}>
              <div>Setup</div>

              <div>
                <ConnectionStatus />
                &nbsp;&nbsp; <strong>Warro Lights</strong>
              </div>
            </div>

            <DevicesStatus />

            <div className="controls">
              <div className="menuItems">{menuItems}</div>
              <div className="simControls">
                <div className="configuration">
                  <h3>
                    {this.state.selected} &nbsp;
                    <a href="#" onClick={e => this.restartProgram(e)}>
                      restart
                    </a>
                  </h3>
                  <div className="config-items">{configOptions}</div>
                  <div className={"presets"}>{presets}</div>
                </div>
                <LightsSimulator height="400" width="600"></LightsSimulator>
              </div>
            </div>

            <MicrophoneViewer config={this.state.micConfig} />
          </div>
        </div>
      );
    }
  }
}

class Item extends React.Component {
  render() {
    return (
      <a href="#" className={this.props.className} onClick={this.props.onClick}>
        {this.props.children}
      </a>
    );
  }
}

