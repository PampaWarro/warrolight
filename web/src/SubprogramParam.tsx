import React from "react";
import _ from "lodash";
import { ConfigValue } from "./types";
import { ProgramConfig } from "./ProgramConfig";

interface Props {
  name: string;
  value: any;
  options: any;
  includeShapeParameter?: boolean;
  globalConfig: { [param: string]: any };

  onChange(name: string, value: ConfigValue): void;

  onRemoveProgram?(name: string): void;
}

export class SubprogramParam extends React.Component<Props, any> {
  constructor(props: Props) {
    super(props)
    this.state = {
      collapsed: true
    }
  }

  handleChange(newConfig: { [name: string]: ConfigValue }) {
    const { programName, presetName, config, shape } = this.props.value;
    this.props.onChange(this.props.name, { programName, shape, config: { ...config, presetName, ...newConfig } });
  }

  handleProgramChange(programName: string) {
    this.props.onChange(this.props.name, { programName, shape: this.props.value.shape });
  }

  handleSelectPreset(presetName: string) {
    const { programName, shape } = this.props.value;
    // Setting a preset discards previous config
    this.props.onChange(this.props.name, { programName, shape, presetName, config: {} });
  }

  handleShapeChange(selectedShapeName: string) {
    const updatedConfig = { ...this.props.value, shape: selectedShapeName };
    // To be consistent with the default no shape
    if(!selectedShapeName)
      delete updatedConfig.shape;

    this.props.onChange(this.props.name, updatedConfig);
  }

  render() {
    const { name, value, options, globalConfig, includeShapeParameter, onRemoveProgram } = this.props;

    const { programName, presetName, config, shape } = value || {};

    const currentProgram = options[programName]

    let programConfig = null;

    let currentConfig = {
      defaults: _.mapValues(currentProgram.config, 'default'),
      overrides: config,
      currentPreset: presetName
    }

    let collapsableName: any = name;

    if (value) {
      if (!this.state.collapsed) {
        programConfig = <div className="p-2 mt-1 mb-2 bg-lighter rounded" style={{ zoom: '0.9' }}>

          <ProgramConfig
            program={currentProgram}
            programs={options}
            config={currentConfig}
            globalConfig={globalConfig}
            onSelectPreset={this.handleSelectPreset.bind(this)}
            onChangeProgramConfig={this.handleChange.bind(this)}/>
        </div>

        collapsableName =
          <div onClick={() => this.setState({ collapsed: true })} className="config-group-header ml-1">
            <span role={'img'} aria-label={'Hide parameters'}>➖</span> {name}
          </div>
      } else {
        programConfig = null
        collapsableName =
          <div onClick={() => this.setState({ collapsed: false })} className="config-group-header ml-1">
            <span role={'img'} aria-label={'Hide parameters'}>➕</span> {name}
          </div>
      }
    }

    // Convinience UI functionality for components that use SubprogramParams
    let deleteBtn = null;
    if (onRemoveProgram) {
      deleteBtn = <span className={'btn btn-sm btn-link text-danger p-1'}
                        onClick={() => onRemoveProgram(programName)}
                        title={'Remove program'}
                        role={'img'}
                        aria-label={'Remove program'}>❌</span>
    }

    let shapeSelector = null;
    if (includeShapeParameter) {
      const options = globalConfig.shapes

      shapeSelector = <span className="dropdown mr-1" style={{zoom: '0.8'}}>
        <button className="btn btn-sm btn-secondary dropdown-toggle" type="button" id="dropdownMenuButton"
                data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
          {shape || 'ALL'}
        </button>

        <div className="dropdown-menu gradient-dropdown" aria-labelledby="dropdownMenuButton">
          <button
            key={'no shape'}
            className={`small dropdown-item ${!shape ? "active" : ""}`}
            onClick={() => this.handleShapeChange('')}
          >
              ALL
            </button>
          {_.map(options, option => (
            <button
              key={option}
              className={`small dropdown-item ${option === shape ? "active" : ""}`}
              onClick={() => this.handleShapeChange(option)}
            >
              {option}
            </button>
          ))}
        </div>
      </span>
    }

    return (
      <div className="config-item">
        <div className="d-flex justify-content-between align-items-center bg-lighter rounded">
          <div className={'flex-fill'}>
            {collapsableName}
          </div>

          {shapeSelector}

          <div>
            <div className="dropdown">
              <button className="btn btn-sm btn-dark dropdown-toggle" type="button" id="dropdownMenuButton"
                      data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                {programName}
              </button>
              <div className="dropdown-menu" aria-labelledby="dropdownMenuButton">
                {_.map(_.keys(options), (programId) => (
                  <button
                    key={programId}
                    className={`small dropdown-item ${programId === programName ? "active" : ""}`}
                    onClick={e => this.handleProgramChange(programId)}
                  >{programId}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {deleteBtn}
        </div>

        {programConfig}
      </div>
    );
  }
}
