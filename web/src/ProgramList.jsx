import React from "react";

export class ProgramList extends React.Component {
    render() {
      return (
        <ul className="nav flex-column">
          {Object.keys(this.props.programs).map((key) => {
            let program = this.props.programs[key];
            let selected = key === this.props.selected;

            return (
              <li key={key} className="nav-item">
                <a href="#" className={"nav-link " + (selected ? "active" : "")} onClick={() => this.props.onProgramChange(key)}>
                  {program.name}
                </a>
              </li>
            )
          })}
        </ul>
      )
    }
}
