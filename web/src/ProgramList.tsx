import React from "react";
import _ from "lodash";
import { CurrentProgramParameters, Program } from "./types";

interface Props {
  programs: { [name: string]: Program };
  selected: string | null;
  config: CurrentProgramParameters;
  onSelectPreset(name: string): void;
  onProgramChange(name: string): void;
}

export class ProgramList extends React.Component<Props> {
  render() {

    const { config, onProgramChange, programs, onSelectPreset, selected } = this.props;

    return <ul className="nav flex-column">
      {Object.keys(programs).map(key => {
        let program = programs[key];
        let isSelected = key === selected;
        let selectedProgramPresets;
        if(isSelected && program.presets.length) {
          selectedProgramPresets = <div className={'border-bottom border-dark pb-2'}>
            {_.map(program.presets, preset => {
              const isCurrentPreset = config.currentPreset === preset;
              return <div className={'nav-preset pl-2 ' + (isCurrentPreset ? 'bg-info text-white' : '')}
                          onClick={() => onSelectPreset(preset)}
                          key={preset}>
                &gt; {preset}
              </div>;
            })}
          </div>
        }

        return <li key={key} className="nav-item">
            <span
              className={"nav-link py-1 px-2 border-bottom border-dark  " + (isSelected ? "active" : "")}
              onClick={() => onProgramChange(key)}
            >
              {program.name}
            </span>
            { selectedProgramPresets }
          </li>;
      })}
    </ul>;
  }
}
