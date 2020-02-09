import React from "react";
import { StringParam } from "./StringParam";
import { BooleanParam } from "./BooleanParam";
import { NumberParam } from "./NumberParam";
import { Program, ConfigValue, CurrentProgramParameters } from "./types";
import { GradientParam } from "./GradientParam";
import { SubprogramParam } from "./SubprogramParam";
import { SubprogramsListParam } from "./SubprogramsListParam";

interface Props {
  program: Program | null;
  programs: any;
  config: CurrentProgramParameters;
  globalConfig: { [param: string]: any };
  onSelectPreset(name: string): void;
  onSaveNewPreset(programName: string, presetName: string, presetConfig: { [param: string]: ConfigValue }): void;
  onChangeProgramConfig(config: { [name: string]: ConfigValue }): void;
}

export class ProgramConfig extends React.PureComponent<Props> {
  handleParamChange = (
    field: string,
    value: ConfigValue
  ) => {
    this.props.onChangeProgramConfig({ [field]: value });
  };

  handleSavePreset = (presetName: string | null | undefined) => {
    if(this.props.config.presetOverrides && this.props.program) {
      let newPresetName = presetName || prompt("Enter preset name");
      if (newPresetName) {
        let combinedParams = { ...this.props.config.presetOverrides, ...this.props.config.overrides };
        this.props.onSaveNewPreset(this.props.program.name, newPresetName, combinedParams)
      }
    }
  }

  render() {
    const currentProgram = this.props.program;
    const globalConfig = this.props.globalConfig;

    const { currentPreset, defaults, overrides, presetOverrides } = this.props.config;
    let currentConfig: { [index: string]: ConfigValue } = { ...defaults, ...presetOverrides, ...overrides };

    if (!currentProgram || !currentConfig) {
      console.log("returned")
      return null;
    }

    let configOptions = [];


    for (let paramName in currentProgram.config) {
      let configDef = currentProgram.config[paramName] as any;
      let value = currentConfig[paramName];

      let typeName = configDef.type || typeof configDef.default;

      let parameterEditor = null;
      switch (typeName) {
        case "boolean":
          parameterEditor = <BooleanParam
            key={paramName}
            name={paramName}
            value={value as boolean}
            onChange={this.handleParamChange}/>
          break;
        case "string":
          parameterEditor = <StringParam
            key={paramName}
            name={paramName}
            value={value as string}
            options={configDef.values}
            onChange={this.handleParamChange}/>
          break;
        case "soundMetric":
          parameterEditor = <StringParam
            key={paramName}
            name={paramName}
            value={value as string}
            options={[
              'rms', 'fastPeakDecay', 'peakDecay',
              'bassRms', 'bassFastPeakDecay', 'bassPeakDecay',
              'midRms', 'midFastPeakDecay', 'midPeakDecay',
              'highRms', 'highFastPeakDecay', 'highPeakDecay'
            ]}
            onChange={this.handleParamChange}/>
          break;
        case "gradient":
          parameterEditor = <GradientParam
            key={paramName}
            name={paramName}
            value={value as string}
            options={globalConfig.gradientsLibrary || {}}
            onChange={this.handleParamChange}
          />
          break;
        case "program":
          parameterEditor = <SubprogramParam
            key={paramName}
            name={paramName}
            value={value}
            globalConfig={globalConfig}
            options={this.props.programs}
            onChange={this.handleParamChange}/>
          break;
        case "programs":
          parameterEditor = <SubprogramsListParam
            key={paramName}
            name={paramName}
            value={value}
            globalConfig={globalConfig}
            options={this.props.programs}
            onChange={this.handleParamChange}/>
          break;
        default:
          parameterEditor = <NumberParam
            key={paramName}
            name={paramName}
            value={value as number}
            step={configDef.step}
            min={configDef.min}
            max={configDef.max}
            onChange={this.handleParamChange}/>
      }

      let paramStateClass = (overrides && overrides[paramName]) ? 'text-warning' : (presetOverrides && presetOverrides[paramName] ? 'text-info' : 'text-secondary');

      configOptions.push(<div key={paramName} className={paramStateClass}>{parameterEditor}</div>);
    }

    const presets = currentProgram.presets || [];

    const addNewBtn = <button className="btn btn-sm btn-link mt-2" onClick={() => this.handleSavePreset(null)}>
      Save as preset...
    </button>

    let overridePresetBtn = null;
    if(currentPreset) {
      overridePresetBtn = <button className="btn btn-sm btn-link mt-2 ml-3"
                                  onClick={() => this.handleSavePreset(currentPreset)}>
        Save to <span className={'text-info'}>'{currentPreset}'</span>
      </button>
    }

    return (
      <div>
        <Presets presets={presets} selected={currentPreset} onSelect={this.props.onSelectPreset} />
        <div>{configOptions}</div>
        <div className={'text-center'}>
         { addNewBtn }
         { overridePresetBtn }
        </div>
      </div>
    );
  }
}

interface PresetsProps {
  presets: string[];
  selected: string | undefined | null;
  onSelect(preset: string): void;
}

const Presets: React.FC<PresetsProps> = ({ presets, selected, onSelect }) => {
  if (presets.length === 0) {
    return null;
  }

  return (
    <div>
      {presets.map(preset => (
        <button
          className={`btn btn-sm ${selected === preset ? 'btn-info' : 'btn-outline-info'} mr-1 mb-1`}
          key={preset}
          onClick={e => onSelect(preset)}
        >
          {preset}
        </button>
      ))}
    </div>
  );
};
