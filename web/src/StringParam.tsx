import React from "react";
import _ from "lodash";

interface Props {
  name: string;
  value: string;
  options: string[];
  onChange(name: string, value: string): void;
}

export class StringParam extends React.Component<Props> {
  handleChange = (event: React.SyntheticEvent, value: string) => {
    event.preventDefault();
    this.props.onChange(this.props.name, value);
  };

  render() {
    const {name, value, options} = this.props;
    return (
      <div className="config-item d-flex justify-content-between align-items-center">
        <div className="small">{name}&nbsp;</div>
        <div className="font-weight-bold">
          <div className="dropdown">
            <button className="btn btn-sm btn-secondary dropdown-toggle" type="button" id="dropdownMenuButton"
                    data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
              {value}
            </button>
            <div className="dropdown-menu gradient-dropdown" aria-labelledby="dropdownMenuButton">
              {_.map(options, option => (
                <button
                  key={option}
                  className={`small dropdown-item ${option === value ? "active" : ""}`}
                  onClick={e => this.handleChange(e, option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
}
