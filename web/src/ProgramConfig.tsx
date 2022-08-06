import React from "react";
import { StringParam } from "./StringParam";
import { BooleanParam } from "./BooleanParam";
import { NumberParam } from "./NumberParam";
import { Program, ConfigValue, CurrentProgramParameters } from "./types";
import { GradientParam } from "./GradientParam";
import { SubprogramParam } from "./SubprogramParam";
import { SoundMetricParam } from "./SoundMetricParam";
import { SubprogramsListParam } from "./SubprogramsListParam";
import _ from "lodash";
import { TagsParam } from "./TagsParam";

interface Props {
  program: Program | null;
  programs: any;
  config: CurrentProgramParameters;
  globalConfig: { [param: string]: any };
  onSelectPreset(name: string): void;
  onSaveNewPreset?(programName: string, presetName: string, presetConfig: { [param: string]: ConfigValue }): void;
  onDeletePreset?(programName: string, presetName: string): void;
  onChangeProgramConfig(config: { [name: string]: ConfigValue }): void;
}

const lightProgramConfigKeys = ['tags', 'globalBrightness', 'fps']

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
      if (newPresetName && this.props.onSaveNewPreset) {
        let combinedParams = { ...this.props.config.presetOverrides, ...this.props.config.overrides };
        this.props.onSaveNewPreset(this.props.program.name, newPresetName, combinedParams)
      }
    }
  }

  handleDeletePreset = (presetName: string) => {
    if(this.props.program && this.props.onDeletePreset && window.confirm("Are you sure? There is no undo")) {
        this.props.onDeletePreset(this.props.program.name, presetName)
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

    let configKeys = Object.keys(currentProgram.config);
    configKeys = _.sortBy(configKeys, k => lightProgramConfigKeys.includes(k));

    for (let paramName of configKeys) {
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
          parameterEditor = <SoundMetricParam
            key={paramName}
            name={paramName}
            value={value as string}
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
        case "tags":
          parameterEditor = <TagsParam
            key={paramName}
            name={paramName}
            value={value}
            options={configDef.options}
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

      configOptions.push(<span key={paramName} className={paramStateClass}>{parameterEditor}</span>);
    }

    const presets = currentProgram.presets || [];

    let savePresets, deletePresetBtn;
    if (this.props.onSaveNewPreset) {
      const addNewBtn = <button className="btn btn-sm btn-link mt-2" onClick={() => this.handleSavePreset(null)}>
        Save as preset...
      </button>

      let overridePresetBtn = null;
      if (currentPreset) {
        overridePresetBtn = <button className="btn btn-sm btn-link mt-2 ml-3"
                                    onClick={() => this.handleSavePreset(currentPreset)}>
          Save to <span className={'text-info'}>'{currentPreset}'</span>
        </button>

        deletePresetBtn = <button className="btn btn-sm btn-link text-danger mt-2 ml-3"
                                  onClick={() => this.handleDeletePreset(currentPreset)}>
          Delete
        </button>
      }
      savePresets = <div className={'text-center'}>
        {addNewBtn}
        {overridePresetBtn}
        {deletePresetBtn}
      </div>
    }

    return (
      <div>
        <Presets presets={presets} selected={currentPreset} onSelect={this.props.onSelectPreset}/>
        <div>{configOptions}</div>
        {savePresets}
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

  return <div className="dropdown">
    <button className="btn btn-sm btn-secondary dropdown-toggle" type="button" id="dropdownMenuButton"
            data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
      {selected || `${presets.length} presets...`}
    </button>
    <div className="dropdown-menu gradient-dropdown" aria-labelledby="dropdownMenuButton">
      {_.map(presets, preset => (
        <button
          key={preset}
          className={`small dropdown-item ${preset === selected ? "active" : ""}`}
          onClick={e => onSelect(preset)}
        >
          {preset}
        </button>
      ))}
    </div>
  </div>
};
