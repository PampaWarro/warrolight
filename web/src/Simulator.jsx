/*global socket*/
import React from "react";
import { ConnectionStatus } from "./ConnectionStatus";
import { DevicesStatus } from "./DevicesStatus";
import { LightsSimulator } from "./LightsSimulator";
import { MicrophoneViewer } from "./MicrophoneViewer";
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

  componentWillUnmount() {
    //this.stopCurrent()
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

class NumberParam extends React.Component {
  constructor(props) {
    super(props);
    this.field = props.field;
    this.min = (props.configDefinition || {}).min || 0;
    this.max = (props.configDefinition || {}).max || 100;
    this.step = (props.configDefinition || {}).step || 1;
    this.state = { value: props.val, configRef: props.configRef };
    this.handleChange = this.handleChange.bind(this);
    this.name = "" + Math.random();
  }

  handleChange(event) {
    this.setVal(event.target.value);
  }

  componentWillReceiveProps(nextProps) {
    this.setState({ value: nextProps.val, configRef: nextProps.configRef });
  }

  setVal(val) {
    let value = parseFloat(val);
    this.setState({ value: value, configRef: this.state.configRef });
    this.state.configRef[this.field] = value;
    console.log("PARAM CHANGE", this.state.configRef);
    socket.emit("updateConfigParam", this.state.configRef);
  }

  render() {
    return (
      <div className="config-item">
        <span>{this.field}:&nbsp;</span>
        <div>
          <strong>{this.state.value}&nbsp;</strong>
          <input
            type="range"
            name={this.name}
            min={this.min}
            step={this.step}
            max={this.max}
            value={this.state.value}
            onChange={this.handleChange}
          />
        </div>
      </div>
    );
  }
}

class BooleanParam extends React.Component {
  constructor(props) {
    super(props);
    this.field = props.field;
    this.state = { value: props.val, configRef: props.configRef };
    this.handleChange = this.handleChange.bind(this);
    this.name = "" + Math.random();
  }

  handleChange(event) {
    this.setVal(event.target.checked);
  }

  componentWillReceiveProps(nextProps) {
    this.setState({ value: nextProps.val, configRef: nextProps.configRef });
  }

  setVal(value) {
    this.setState(state => {
      state.configRef[this.field] = value;
      return { configRef: state.configRef, value };
    });
    console.log("BOOL PARAM CHANGE", this.state.configRef);
    socket.emit("updateConfigParam", this.state.configRef);
  }

  render() {
    return (
      <div className="config-item">
        <span>{this.field}:&nbsp;</span>
        <div>
          <strong>{this.state.value}&nbsp;</strong>
          <input
            type="checkbox"
            name={this.name}
            checked={this.state.value}
            onChange={this.handleChange}
          />
        </div>
      </div>
    );
  }
}

class StringParam extends React.Component {
  constructor(props) {
    super(props);
    this.field = props.field;
    this.state = { value: props.val, configRef: props.configRef };
    this.values = (props.configDefinition || {}).values || "MAL DEFINIDO";
    this.handleChange = this.handleChange.bind(this);
    this.name = "" + Math.random();
  }

  handleChange(val) {
    this.setVal(val);
  }

  componentWillReceiveProps(nextProps) {
    this.setState({ value: nextProps.val, configRef: nextProps.configRef });
  }

  setVal(val) {
    let value = val;
    this.state.configRef[this.field] = value;
    this.setState({ value: value });
    console.log("STRING PARAM CHANGE", this.state.configRef);
    socket.emit("updateConfigParam", this.state.configRef);
  }

  render() {
    return (
      <div className="config-item">
        <span>{this.field}:&nbsp;</span>
        <div>
          <strong>{this.state.value}&nbsp;</strong>
          <br />
          <div style={{ zoom: "0.8" }}>
            {_.map(this.values, v => (
              <button
                key={v}
                className={this.state.value === v ? "selected" : ""}
                onClick={() => this.handleChange(v)}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }
}
