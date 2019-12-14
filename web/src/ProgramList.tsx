import React from "react";

// TODO: fix
interface Program {
  name: string;
}

interface Props {
  programs: { [name: string]: Program };
  selected: string | null;
  onProgramChange(name: string): void;
}

export class ProgramList extends React.Component<Props> {
  render() {
    return (
      <ul className="nav flex-column">
        {Object.keys(this.props.programs).map(key => {
          let program = this.props.programs[key];
          let selected = key === this.props.selected;

          return (
            <li key={key} className="nav-item">
              <span
                className={"nav-link py-0 px-2 border-bottom border-dark  " + (selected ? "active" : "")}
                onClick={() => this.props.onProgramChange(key)}
              >
                {program.name}
              </span>
            </li>
          );
        })}
      </ul>
    );
  }
}
