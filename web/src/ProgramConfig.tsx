import React from "react";
import _ from "lodash";
import Socket from "./socket";
import { StringParam } from "./StringParam";
import { BooleanParam } from "./BooleanParam";
import { NumberParam } from "./NumberParam";

// TODO: fix
type Program = any

type ConfigValue = string | number | boolean

interface Props {
  socket: Socket
  program: Program | null
  selected: string | null
  config: { [param: string]: ConfigValue } | null
  onSelectPreset(name: string): void
  onRestartProgram(): void
}

export class ProgramConfig extends React.Component<Props> {

  handleRestartProgram(e: React.SyntheticEvent) {
    e.preventDefault();
    this.props.onRestartProgram();
  }

  handleParamChange = (e: React.SyntheticEvent, field: string, value: ConfigValue) => {
    const config = this.props.config;
    if (!config) {
      throw new Error('attempting to update null config');
    }

    config[field] = value;

    console.log("PARAM CHANGE", config);
    this.props.socket.emit("updateConfigParam", config);
  }

  render() {
    const currentProgram = this.props.program;
    const currentConfig = this.props.config;

    if (!currentProgram || !currentConfig) {
      return null;
    }

    let configOptions = [];
    let presets = [];

    for (let paramName in currentProgram.config) {
      let configDef = currentProgram.config[paramName];
      let value = currentConfig[paramName];

      if (_.isBoolean(configDef.default)) {
        configOptions.push(
          <BooleanParam
            key={paramName}
            name={paramName}
            value={value as boolean}
            onChange={this.handleParamChange}
          />
        );
      } else if (_.isString(configDef.default)) {
        configOptions.push(
          <StringParam
            key={paramName}
            name={paramName}
            value={value as string}
            options={configDef.values}
            onChange={this.handleParamChange}
          />
        );
      } else {
        configOptions.push(
          <NumberParam
            key={paramName}
            name={paramName}
            value={value as number}
            step={configDef.step}
            min={configDef.min}
            max={configDef.max}
            onChange={this.handleParamChange}
          />
        );
      }
    }

    const programPresets = currentProgram.presets ? currentProgram.presets : []

    for (let preset of programPresets) {
      presets.push(
        <a
          className="btn btn-sm btn-outline-success mr-1 mb-1"
          href="#"
          key={preset}
          onClick={e => this.props.onSelectPreset(preset)}
        >
          {preset}
        </a>
      );
    }

    return (
      <div>
        <h4 className="pt-2">
          {currentProgram.name} &nbsp;
          <a href="#" className="btn btn-sm btn-outline-secondary" onClick={this.handleRestartProgram.bind(this)}>
            Restart
          </a>
        </h4>
        {presets.length > 0 ? <hr /> : null}
        <div>{presets}</div>
        <hr/>
        <div>{configOptions}</div>
      </div>
    )

  }
}
