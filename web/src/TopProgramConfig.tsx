import React from "react";
import { Program, ConfigValue, CurrentProgramParameters } from "./types";
import { ProgramConfig } from "./ProgramConfig";

interface Props {
  program: Program | null;
  programs: any;
  selected: string | null;
  config: CurrentProgramParameters;
  globalConfig: { [param: string]: any };
  onSelectPreset(name: string): void;
  onSaveNewPreset(programName: string, presetName: string, presetConfig: { [param: string]: ConfigValue }): void;
  onDeletePreset(programName: string, presetName: string): void;
  onRestartProgram(): void;
  onChangeProgramConfig(config: { [name: string]: ConfigValue }): void;
}

export class TopProgramConfig extends React.PureComponent<Props> {
  handleRestartProgram(e: React.SyntheticEvent) {
    e.preventDefault();
    this.props.onRestartProgram();
  }

  handleParamChange = (value: { [param: string]: ConfigValue }) => {
    this.props.onChangeProgramConfig(value);
  };

  render() {
    const currentProgram = this.props.program;
    const currentParameters = this.props.config;

    if (!currentProgram || !currentParameters.defaults) {
      return null;
    }

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

        <hr />
      <ProgramConfig
        program={currentProgram}
        programs={this.props.programs}
        config={currentParameters}
        globalConfig={this.props.globalConfig}
        onSelectPreset={this.props.onSelectPreset}
        onSaveNewPreset={this.props.onSaveNewPreset}
        onDeletePreset={this.props.onDeletePreset}
        onChangeProgramConfig={this.handleParamChange}/>
      </div>
    );
  }
}
