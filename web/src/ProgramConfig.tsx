import React from "react";
import { StringParam } from "./StringParam";
import { BooleanParam } from "./BooleanParam";
import { NumberParam } from "./NumberParam";
import { Program, ConfigValue } from "./types";
import { GradientParam } from "./GradientParam";

interface Props {
  program: Program | null;
  selected: string | null;
  config: { [param: string]: ConfigValue } | null;
  globalConfig: { [param: string]: any };
  onSelectPreset(name: string): void;
  onRestartProgram(): void;
  onChangeProgramConfig(config: { [name: string]: ConfigValue }): void;
}

export class ProgramConfig extends React.Component<Props> {
  handleRestartProgram(e: React.SyntheticEvent) {
    e.preventDefault();
    this.props.onRestartProgram();
  }

  handleParamChange = (
    e: React.SyntheticEvent,
    field: string,
    value: ConfigValue
  ) => {
    let config = this.props.config;

    if (!config) {
      throw new Error("attempting to update null config");
    }

    config = Object.assign({}, config, { [field]: value });
    this.props.onChangeProgramConfig(config);
  };

  render() {
    const currentProgram = this.props.program;
    const currentConfig = this.props.config;
    const globalConfig = this.props.globalConfig;

    if (!currentProgram || !currentConfig) {
      return null;
    }

    let configOptions = [];

    for (let paramName in currentProgram.config) {
      let configDef = currentProgram.config[paramName] as any;
      let value = currentConfig[paramName];

      let typeName = configDef.type || typeof configDef.default;

      switch (typeName) {
        case "boolean":
          configOptions.push(
            <BooleanParam
              key={paramName}
              name={paramName}
              value={value as boolean}
              onChange={this.handleParamChange}
            />
          );
          break;
        case "string":
          configOptions.push(
            <StringParam
              key={paramName}
              name={paramName}
              value={value as string}
              options={configDef.values}
              onChange={this.handleParamChange}
            />
          );
          break;
        case "gradient":
          configOptions.push(
            <GradientParam
              key={paramName}
              name={paramName}
              value={value as string}
              options={globalConfig.gradientsLibrary || {}}
              onChange={this.handleParamChange}
            />
          );
          break;
        default:
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
        <h5 className="">
          {currentProgram.name} &nbsp;
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={this.handleRestartProgram.bind(this)}
          >
            Restart
          </button>
        </h5>
        <Presets presets={presets} onSelect={this.props.onSelectPreset} />
        <hr />
        <div>{configOptions}</div>
      </div>
    );
  }
}

interface PresetsProps {
  presets: string[];
  onSelect(preset: string): void;
}

const Presets: React.FC<PresetsProps> = ({ presets, onSelect }) => {
  if (presets.length === 0) {
    return null;
  }

  return (
    <div>
      <hr />
      {presets.map(preset => (
        <button
          className="btn btn-sm btn-outline-success mr-1 mb-1"
          key={preset}
          onClick={e => onSelect(preset)}
        >
          {preset}
        </button>
      ))}
    </div>
  );
};
