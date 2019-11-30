import React from "react";
import { StringParam } from "./StringParam";
import { BooleanParam } from "./BooleanParam";
import { NumberParam } from "./NumberParam";
import { Program, ConfigValue } from "./types";

interface Props {
  program: Program | null
  selected: string | null
  config: { [param: string]: ConfigValue } | null
  onSelectPreset(name: string): void
  onRestartProgram(): void
  onChangeProgramConfig(config: { [name: string]: ConfigValue }): void
}

export class ProgramConfig extends React.Component<Props> {

  handleRestartProgram(e: React.SyntheticEvent) {
    e.preventDefault();
    this.props.onRestartProgram();
  }

  handleParamChange = (e: React.SyntheticEvent, field: string, value: ConfigValue) => {
    let config = this.props.config;

    if (!config) {
      throw new Error('attempting to update null config');
    }

    config = Object.assign({}, config, { [field]: value });
    this.props.onChangeProgramConfig(config)
  }

  render() {
    const currentProgram = this.props.program;
    const currentConfig = this.props.config;

    if (!currentProgram || !currentConfig) {
      return null;
    }

    let configOptions = [];

    for (let paramName in currentProgram.config) {
      let configDef = currentProgram.config[paramName] as any;
      let value = currentConfig[paramName];

      if (typeof configDef.default === 'boolean') {
        configOptions.push(
          <BooleanParam
            key={paramName}
            name={paramName}
            value={value as boolean}
            onChange={this.handleParamChange}
          />
        );
      } else if (typeof configDef.default === 'string') {
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

    const presets = currentProgram.presets || [];

    return (
      <div>
        <h4 className="pt-2">
          {currentProgram.name} &nbsp;
          <a href="#" className="btn btn-sm btn-outline-secondary" onClick={this.handleRestartProgram.bind(this)}>
            Restart
          </a>
        </h4>
        <Presets presets={presets} onSelect={this.props.onSelectPreset} />
        <hr/>
        <div>{configOptions}</div>
      </div>
    )
  }
}

interface PresetsProps {
  presets: string[]
  onSelect(preset: string): void
}

const Presets: React.FC<PresetsProps> = ({ presets, onSelect }) => {
  if (presets.length === 0) {
    return null
  }

  return (
    <div>
      <hr />
      {presets.map(preset =>
        <a
          className="btn btn-sm btn-outline-success mr-1 mb-1"
          href="#"
          key={preset}
          onClick={e => onSelect(preset)}
        >
          {preset}
        </a>
      )}
    </div>
  )
}
