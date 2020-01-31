import React from "react";
import _ from "lodash";
import { ConfigValue } from "./types";
import { ProgramConfig } from "./ProgramConfig";

interface Props {
  name: string;
  value: any;
  options: any;
  globalConfig: { [param: string]: any };
  onChange(name: string, value: ConfigValue): void;
}

export class SubprogramParam extends React.Component<Props,any> {
  constructor(props: Props) {
    super(props)
    this.state = {
      collapsed: true
    }
  }
  handleChange(newConfig: { [name: string]: ConfigValue }) {
    const { programName, presetName, config } = this.props.value;
    this.props.onChange(this.props.name, { programName, config: { ...config, presetName, ...newConfig } });
  }

  handleProgramChange(programName: string) {
    this.props.onChange(this.props.name, { programName });
  }

  handleSelectPreset(presetName: string) {
    const { programName } = this.props.value;
    // Setting a preset discards previous config
    this.props.onChange(this.props.name, { programName, presetName, config: {} });
  }

  handleSavePreset(programName: string, presetName: string, presetConfig: { [param: string]: ConfigValue }) {

  }

  render() {
    const { name, value, options, globalConfig } = this.props;

    const { programName, presetName } = value || {};

    const currentProgram = options[programName]

    let programConfig = null;

    let currentConfig = {
      defaults: _.mapValues(currentProgram.config, 'default'),
      overrides: value.config,
      currentPreset: presetName
    }

    if(value) {
      if(!this.state.collapsed) {
        programConfig = <div className={'p-2 my-1 bg-lighter rounded'} style={{ zoom: '0.9' }}>
          <span onClick={() => this.setState({collapsed: true})} className={'btn btn-sm btn-link mb-2'}>➖ Parameters {name}</span>

          <ProgramConfig
            program={currentProgram}
            programs={options}
            config={currentConfig}
            globalConfig={globalConfig}
            onSelectPreset={this.handleSelectPreset.bind(this)}
            onSaveNewPreset={this.handleSavePreset.bind(this)}
            onChangeProgramConfig={this.handleChange.bind(this)}/>
        </div>
      } else {
        programConfig =
          <div className={'p-0 my-1 bg-lighter rounded'} style={{ zoom: '0.9' }}>
            <span onClick={() => this.setState({collapsed: false})} className={'btn btn-sm btn-link'}>➕ Parameters {name}</span>
          </div>
      }
    }

    return (
      <div className="config-item">
        <div className="">
          <div className="float-left">
            {name}&nbsp;
          </div>

          <div className="float-right font-weight-bold">
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
        </div>
        <div className={'clearfix'}></div>
        {programConfig}
      </div>
    );
  }
}
