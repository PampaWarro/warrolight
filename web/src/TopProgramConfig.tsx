import React from "react";
import {Program, ConfigValue, CurrentProgramParameters} from "./types";
import {ProgramConfig} from "./ProgramConfig";

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

    onTap(): void;

    onChangeProgramConfig(config: { [name: string]: ConfigValue }): void;

    onProgramChange(name: string): void;
}

export class TopProgramConfig extends React.PureComponent<Props> {
    handleRestartProgram(e: React.SyntheticEvent) {
        e.preventDefault();
        this.props.onRestartProgram();
    }

    handleTap(e: React.SyntheticEvent) {
        e.preventDefault();
        this.props.onTap();
    }

    handleParamChange = (value: { [param: string]: ConfigValue }) => {
        this.props.onChangeProgramConfig(value);
    };

    handleUseOnMix = (value: { [param: string]: ConfigValue }) => {
        let newMixConfig = {
            "programs": [
                {
                    "programName": this.props.program?.name,
                    "config": {...this.props.config.presetOverrides, ...this.props.config.overrides}
                }
            ]
        }
        this.props.onProgramChange('mix');
        this.props.onChangeProgramConfig(newMixConfig);
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
                    <button
                        className="btn btn-sm btn-outline-secondary"
                        onClick={this.handleTap.bind(this)}
                    >
                        Tap
                    </button>
                </h5>

                <hr/>

                <ProgramConfig
                    program={currentProgram}
                    programs={this.props.programs}
                    config={currentParameters}
                    globalConfig={this.props.globalConfig}
                    onSelectPreset={this.props.onSelectPreset}
                    onSaveNewPreset={this.props.onSaveNewPreset}
                    onDeletePreset={this.props.onDeletePreset}
                    onChangeProgramConfig={this.handleParamChange}/>

                <div className={'text-right'}>
                    <button
                        className="btn btn-sm btn-link"
                        onClick={this.handleUseOnMix.bind(this)}
                    >
                        Use in mix...
                    </button>
                </div>
            </div>
        );
    }
}
